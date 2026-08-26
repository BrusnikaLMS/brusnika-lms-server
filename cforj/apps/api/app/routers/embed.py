"""
Embed API — open endpoints for LMS integration (no auth required).

LMS communicates with cforj-embed by courseId only.
Course data is stored in cforj-embed database.
Includes AI generation endpoints without auth.
"""

import json
import re
import uuid
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Course, User, UploadedAsset
from app.storage import delete_file, UPLOAD_DIR
from app.ai_client import get_ai_client, get_ai_model
from app.ai_prompts import (
    GENERATE_COURSE_SYSTEM,
    GENERATE_QUIZ_SYSTEM,
    GENERATE_SCENARIO_SYSTEM,
    GENERATE_FLASHCARDS_SYSTEM,
)
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/embed/courses", tags=["embed"])

EMBED_OWNER_ID = "lms-embed-system"
EMBED_OWNER_EMAIL = "embed@system.local"

# Matches asset keys produced by storage.py: uuid4().hex (32 hex chars) + extension
_UPLOAD_KEY_RE = re.compile(r"\b([0-9a-f]{32}\.[a-zA-Z0-9]+)\b")


def estimate_ai_cost(kind: str, **kwargs: Any) -> int:
    """Rough token cost per AI operation — same formula as main Course Studio.

    The number is reported to the LMS via X-Tokens-Spent / tokens_spent so the
    LMS can forward it to its own billing. cforj-embed itself does not deduct
    anything from any balance — it only reports usage.
    """
    if kind == "generate-course":
        screens = int(kwargs.get("screen_count", 5))
        return max(200, screens * 120)
    if kind == "generate-quiz":
        count = int(kwargs.get("count", 3))
        return max(100, count * 80)
    if kind == "generate-scenario":
        return 300
    if kind == "generate-flashcards":
        count = int(kwargs.get("count", 6))
        return max(150, count * 60)
    return 100


async def ensure_embed_user(db: AsyncSession) -> str:
    """Ensure a system user exists for embed-created courses."""
    user = await db.get(User, EMBED_OWNER_ID)
    if not user:
        user = User(
            id=EMBED_OWNER_ID,
            email=EMBED_OWNER_EMAIL,
            name="LMS Embed",
            plan="enterprise",
            hashed_password=None,
        )
        db.add(user)
        await db.commit()
    return EMBED_OWNER_ID


def _extract_upload_keys(content: dict | None) -> set[str]:
    """Return all upload asset keys referenced anywhere in course content JSON.

    Keys are identified by the storage.py format: uuid4().hex (32 lowercase hex
    characters) followed by a file extension, e.g. '4bc72798abc123...mp4'.
    Works for both local URLs (/api/uploads/<key>) and S3/R2 URLs.
    """
    if not content:
        return set()
    raw = json.dumps(content, ensure_ascii=False)
    return set(_UPLOAD_KEY_RE.findall(raw))


async def _get_key_sizes(keys: set[str], db: AsyncSession) -> dict[str, int]:
    """Return {key: size_bytes} for the given asset keys.

    Checks uploaded_assets table first; falls back to statting the file on disk
    for legacy uploads that pre-date the table.
    """
    if not keys:
        return {}

    result = await db.execute(
        select(UploadedAsset.key, UploadedAsset.size_bytes)
        .where(UploadedAsset.key.in_(keys))
    )
    sizes: dict[str, int] = {row.key: row.size_bytes for row in result.fetchall()}

    for key in keys:
        if key not in sizes:
            path = UPLOAD_DIR / key
            if path.exists():
                sizes[key] = path.stat().st_size

    return sizes


async def _calc_media_bytes(keys: set[str], db: AsyncSession) -> int:
    """Sum size_bytes for the given asset keys."""
    if not keys:
        return 0
    sizes = await _get_key_sizes(keys, db)
    return sum(sizes.values())


async def _enrich_courses(courses: list[Course], db: AsyncSession) -> list[dict]:
    """Return per-course dicts with content_bytes, media_bytes, total_bytes.

    Uses two DB queries total regardless of how many courses are in the list.
    """
    per_course_keys: list[set[str]] = []
    all_keys: set[str] = set()
    for course in courses:
        keys = _extract_upload_keys(course.content)
        per_course_keys.append(keys)
        all_keys |= keys

    key_to_size = await _get_key_sizes(all_keys, db)

    items = []
    for course, keys in zip(courses, per_course_keys):
        cb = len(json.dumps(course.content, ensure_ascii=False).encode("utf-8"))
        mb = sum(key_to_size.get(k, 0) for k in keys)
        items.append({
            "id": course.id,
            "title": course.title,
            "updated_at": course.updated_at,
            "content_bytes": cb,
            "media_bytes": mb,
            "total_bytes": cb + mb,
        })
    return items


def _build_storage_out(courses_count: int, content_bytes: int, media_bytes: int) -> "EmbedStorageOut":
    total = content_bytes + media_bytes
    return EmbedStorageOut(
        courses_count=courses_count,
        content_bytes=content_bytes,
        content_kb=round(content_bytes / 1024, 2),
        content_mb=round(content_bytes / 1024 / 1024, 4),
        media_bytes=media_bytes,
        media_kb=round(media_bytes / 1024, 2),
        media_mb=round(media_bytes / 1024 / 1024, 4),
        total_bytes=total,
        total_kb=round(total / 1024, 2),
        total_mb=round(total / 1024 / 1024, 4),
    )


# ── Schemas ──────────────────────────────────────────────────────────────────

class EmbedCourseCreate(BaseModel):
    title: str = "Untitled Course"
    content: dict[str, Any] | None = None
    lms_user_id: str | int | None = None


class EmbedCourseUpdate(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    lms_user_id: str | int | None = None


class EmbedCourseOut(BaseModel):
    id: str
    title: str
    content: dict[str, Any]
    lms_user_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmbedCourseListItem(BaseModel):
    id: str
    title: str
    updated_at: datetime
    content_bytes: int
    media_bytes: int
    total_bytes: int


class EmbedStorageOut(BaseModel):
    courses_count: int
    content_bytes: int
    content_kb: float
    content_mb: float
    media_bytes: int       # actual uploaded file sizes (deduplicated per query scope)
    media_kb: float
    media_mb: float
    total_bytes: int       # content_bytes + media_bytes
    total_kb: float
    total_mb: float


class EmbedStorageBreakdownItem(BaseModel):
    id: str
    title: str
    updated_at: datetime
    content_bytes: int
    media_bytes: int       # per-course, NOT deduplicated across courses
    total_bytes: int


class EmbedStorageBreakdownOut(BaseModel):
    summary: EmbedStorageOut          # media_bytes here IS deduplicated
    courses: list[EmbedStorageBreakdownItem]


# ── CRUD Endpoints ────────────────────────────────────────────────────────────
# IMPORTANT: /storage and /storage/breakdown are registered BEFORE /{course_id}
# so FastAPI does not match the literal "storage" as a course ID parameter.

@router.post("", response_model=EmbedCourseOut, status_code=201)
async def create_course(
    body: EmbedCourseCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new course. Returns courseId for LMS to store."""
    import logging
    logger = logging.getLogger("embed")
    if body.lms_user_id is not None:
        logger.info(f"Course created by LMS user: {body.lms_user_id}")
    else:
        logger.warning("Course created without LMS user ID")
    owner_id = await ensure_embed_user(db)

    course_id = str(uuid.uuid4())
    default_content = body.content or {
        "id": course_id,
        "version": "1.0",
        "title": body.title,
        "screens": [
            {"id": f"s-{int(datetime.now().timestamp()*1000)}", "title": "Screen 1", "components": [], "events": [], "navigation": {}}
        ],
        "settings": {"allowNavigation": "linear", "showResults": True},
        "state": {},
    }

    course = Course(
        id=course_id,
        owner_id=owner_id,
        title=body.title,
        content=default_content,
        published=True,
        lms_user_id=str(body.lms_user_id) if body.lms_user_id is not None else None,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("", response_model=list[EmbedCourseListItem])
async def list_courses(
    lms_user_id: str | None = Query(default=None, description="Filter by LMS portal user ID"),
    db: AsyncSession = Depends(get_db),
):
    """List embed courses with per-course storage sizes.

    Pass ?lms_user_id=X to scope to one portal.
    Each item includes content_bytes (JSON), media_bytes (uploads), total_bytes.
    """
    q = select(Course).where(Course.owner_id == EMBED_OWNER_ID)
    if lms_user_id is not None:
        q = q.where(Course.lms_user_id == lms_user_id)
    result = await db.execute(q.order_by(Course.updated_at.desc()))
    courses = result.scalars().all()
    return await _enrich_courses(courses, db)


@router.get("/storage", response_model=EmbedStorageOut)
async def get_storage(
    lms_user_id: str | None = Query(default=None, description="Filter by LMS portal user ID"),
    db: AsyncSession = Depends(get_db),
):
    """Return total storage usage for the embed system or a single portal.

    media_bytes counts actual uploaded file sizes from the uploads table.
    Assets referenced by multiple courses are deduplicated (counted once).

    Pass ?lms_user_id=X to scope to one LMS portal.
    """
    q = select(Course).where(Course.owner_id == EMBED_OWNER_ID)
    if lms_user_id is not None:
        q = q.where(Course.lms_user_id == lms_user_id)
    result = await db.execute(q)
    courses = result.scalars().all()

    total_content = sum(
        len(json.dumps(c.content, ensure_ascii=False).encode("utf-8")) for c in courses
    )

    all_keys: set[str] = set()
    for c in courses:
        all_keys |= _extract_upload_keys(c.content)
    total_media = await _calc_media_bytes(all_keys, db)

    return _build_storage_out(len(courses), total_content, total_media)


@router.get("/storage/breakdown", response_model=EmbedStorageBreakdownOut)
async def get_storage_breakdown(
    lms_user_id: str | None = Query(default=None, description="Filter by LMS portal user ID"),
    db: AsyncSession = Depends(get_db),
):
    """Return storage summary + per-course breakdown in one request.

    summary.media_bytes is deduplicated across courses.
    Each course item's media_bytes counts that course's assets independently
    (may overlap with other courses — useful for per-course quota display).
    """
    q = select(Course).where(Course.owner_id == EMBED_OWNER_ID)
    if lms_user_id is not None:
        q = q.where(Course.lms_user_id == lms_user_id)
    result = await db.execute(q.order_by(Course.updated_at.desc()))
    courses = result.scalars().all()

    per_course = await _enrich_courses(courses, db)

    total_content = sum(item["content_bytes"] for item in per_course)
    all_keys: set[str] = set()
    for c in courses:
        all_keys |= _extract_upload_keys(c.content)
    total_media = await _calc_media_bytes(all_keys, db)

    summary = _build_storage_out(len(courses), total_content, total_media)
    return EmbedStorageBreakdownOut(
        summary=summary,
        courses=[EmbedStorageBreakdownItem(**item) for item in per_course],
    )


@router.get("/{course_id}", response_model=EmbedCourseOut)
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    """Get course by ID — used by editor and player."""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.patch("/{course_id}", response_model=EmbedCourseOut)
async def update_course(
    course_id: str,
    body: EmbedCourseUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update course content — called by editor auto-save."""
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if body.title is not None:
        course.title = body.title
    if body.content is not None:
        course.content = body.content
    if body.lms_user_id is not None:
        course.lms_user_id = str(body.lms_user_id)
    course.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
async def delete_course(course_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a course and any upload assets it exclusively referenced.

    Assets also referenced by other embed courses are left intact.
    """
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    keys_in_deleted = _extract_upload_keys(course.content)

    await db.delete(course)
    await db.flush()  # remove from session before scanning remaining courses

    if keys_in_deleted:
        remaining_result = await db.execute(
            select(Course).where(Course.owner_id == EMBED_OWNER_ID)
        )
        still_used: set[str] = set()
        for other in remaining_result.scalars().all():
            still_used |= _extract_upload_keys(other.content)

        orphans = keys_in_deleted - still_used
        for key in orphans:
            asset_result = await db.execute(
                select(UploadedAsset).where(UploadedAsset.key == key)
            )
            asset = asset_result.scalar_one_or_none()
            if asset:
                await delete_file(key)
                await db.delete(asset)

    await db.commit()


# ── AI Generation (no auth — for embed/LMS use) ────────────────────────────

def _parse_json(text: str) -> dict | list:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    return json.loads(text)


class EmbedGenerateCourseRequest(BaseModel):
    prompt: str
    language: str = "en"
    screen_count: int = 5


class EmbedGenerateQuizRequest(BaseModel):
    text: str
    count: int = 3
    language: str = "en"


class EmbedGenerateScenarioRequest(BaseModel):
    topic: str
    context: str = ""
    choice_count: int = 3
    language: str = "en"


class EmbedGenerateFlashcardsRequest(BaseModel):
    topic: str
    text: str = ""
    count: int = 6
    language: str = "en"


@router.post("/ai/generate-course")
async def embed_generate_course(body: EmbedGenerateCourseRequest):
    """Generate a full CourseApp JSON (no auth). Streams response."""
    cost = estimate_ai_cost("generate-course", screen_count=body.screen_count)
    user_message = (
        f"Create a complete interactive learning app about: {body.prompt}\n"
        f"Language: {body.language}\n"
        f"Target number of screens: {body.screen_count}\n"
        f"Make it engaging, practical, and include at least 2 quiz questions."
    )

    async def stream_generator():
        client = get_ai_client()
        try:
            stream = await client.chat.completions.create(
                model=get_ai_model(),
                messages=[
                    {"role": "system", "content": GENERATE_COURSE_SYSTEM},
                    {"role": "user", "content": user_message},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as e:
            yield json.dumps({"error": str(e)})

    return StreamingResponse(
        stream_generator(),
        media_type="text/plain",
        headers={
            "X-Tokens-Spent": str(cost),
            "X-AI-Operation": "generate-course",
            "Access-Control-Expose-Headers": "X-Tokens-Spent, X-AI-Operation",
        },
    )


@router.post("/ai/generate-quiz")
async def embed_generate_quiz(body: EmbedGenerateQuizRequest):
    """Generate quiz components (no auth)."""
    lang_map = {"ru": "Russian", "es": "Spanish", "pt": "Portuguese", "zh": "Chinese", "en": "English"}
    lang_name = lang_map.get(body.language, "English")
    user_message = (
        f"Generate {body.count} quiz questions based on this text:\n\n{body.text}\n\n"
        f"IMPORTANT: Generate ALL text (questions, options, explanations) in {lang_name}.\n"
        f"Mix single-choice, multiple-choice, and true-false questions. "
        f"Return a JSON array wrapped in an object: {{\"components\": [...]}}"
    )
    try:
        client = get_ai_client()
        response = await client.chat.completions.create(
            model=get_ai_model(),
            messages=[
                {"role": "system", "content": GENERATE_QUIZ_SYSTEM},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        raw = response.choices[0].message.content or "{}"
        data = _parse_json(raw)
        components = data.get("components", data) if isinstance(data, dict) else data
        for c in components:
            c["id"] = f"ai-q-{uuid.uuid4().hex[:8]}"
        return {
            "components": components,
            "tokens_spent": estimate_ai_cost("generate-quiz", count=body.count),
            "operation": "generate-quiz",
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-scenario")
async def embed_generate_scenario(body: EmbedGenerateScenarioRequest):
    """Generate branching scenario (no auth)."""
    lang_map = {"ru": "Russian", "es": "Spanish", "pt": "Portuguese", "zh": "Chinese", "en": "English"}
    lang_name = lang_map.get(body.language, "English")
    user_message = (
        f"Topic: {body.topic}\n"
        f"Context: {body.context or 'General professional scenario'}\n"
        f"Number of choices: {body.choice_count}\n"
        f"IMPORTANT: Generate ALL text in {lang_name}.\n"
        f"Create a realistic decision-making scenario with meaningful consequences.\n"
        f"Wrap in: {{\"component\": {{...}}}}"
    )
    try:
        client = get_ai_client()
        response = await client.chat.completions.create(
            model=get_ai_model(),
            messages=[
                {"role": "system", "content": GENERATE_SCENARIO_SYSTEM},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        raw = response.choices[0].message.content or "{}"
        data = _parse_json(raw)
        component = data.get("component", data)
        component["id"] = f"ai-b-{uuid.uuid4().hex[:8]}"
        for choice in component.get("choices", []):
            choice["id"] = f"ai-ch-{uuid.uuid4().hex[:8]}"
        return {
            "component": component,
            "tokens_spent": estimate_ai_cost("generate-scenario"),
            "operation": "generate-scenario",
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-flashcards")
async def embed_generate_flashcards(body: EmbedGenerateFlashcardsRequest):
    """Generate flashcard deck (no auth)."""
    lang_map = {"ru": "Russian", "es": "Spanish", "pt": "Portuguese", "zh": "Chinese", "en": "English"}
    lang_name = lang_map.get(body.language, "English")
    user_message = (
        f"Topic: {body.topic}\n"
        f"{'Additional context: ' + body.text if body.text else ''}\n"
        f"IMPORTANT: Generate ALL text (terms and definitions) in {lang_name}.\n"
        f"Generate {body.count} flashcards with clear terms and definitions.\n"
        f"Wrap in: {{\"component\": {{...}}}}"
    )
    try:
        client = get_ai_client()
        response = await client.chat.completions.create(
            model=get_ai_model(),
            messages=[
                {"role": "system", "content": GENERATE_FLASHCARDS_SYSTEM},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        raw = response.choices[0].message.content or "{}"
        data = _parse_json(raw)
        component = data.get("component", data)
        component["id"] = f"ai-f-{uuid.uuid4().hex[:8]}"
        return {
            "component": component,
            "tokens_spent": estimate_ai_cost("generate-flashcards", count=body.count),
            "operation": "generate-flashcards",
        }
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
