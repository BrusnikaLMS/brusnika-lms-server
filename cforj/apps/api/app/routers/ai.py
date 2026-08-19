import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai_client import get_ai_client, get_ai_model
from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.ai_prompts import (
    GENERATE_COURSE_SYSTEM,
    GENERATE_QUIZ_SYSTEM,
    GENERATE_SCENARIO_SYSTEM,
    GENERATE_FLASHCARDS_SYSTEM,
)
from app.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

PRO_PLANS = {"pro", "enterprise", "admin"}


def _require_pro(user: User):
    if user.plan not in PRO_PLANS:
        raise HTTPException(status_code=403, detail="Pro plan required for AI features")


class GenerateCourseRequest(BaseModel):
    prompt: str
    language: str = "en"
    screen_count: int = 5


class GenerateQuizRequest(BaseModel):
    text: str
    count: int = 3
    language: str = "en"


class GenerateScenarioRequest(BaseModel):
    topic: str
    context: str = ""
    choice_count: int = 3
    language: str = "en"


class GenerateFlashcardsRequest(BaseModel):
    topic: str
    text: str = ""
    count: int = 6
    language: str = "en"


async def _chat(system: str, user: str, stream: bool = False):
    client = get_ai_client()
    response = await client.chat.completions.create(
        model=get_ai_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        stream=stream,
    )
    return response


def _parse_json(text: str) -> dict | list:
    """Strip markdown code fences if present and parse JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    return json.loads(text)


@router.post("/generate-course")
async def generate_course(
    body: GenerateCourseRequest,
    current_user: User = Depends(get_current_user),
):
    _require_pro(current_user)
    """Generate a full CourseApp JSON from a prompt. Streams the response."""

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

    return StreamingResponse(stream_generator(), media_type="text/plain")


@router.post("/generate-quiz")
async def generate_quiz(
    body: GenerateQuizRequest,
    current_user: User = Depends(get_current_user),
):
    _require_pro(current_user)
    """Generate quiz components from text."""
    lang_map = {"ru": "Russian", "es": "Spanish", "pt": "Portuguese", "zh": "Chinese", "en": "English"}
    lang_name = lang_map.get(body.language, "English")
    user_message = (
        f"Generate {body.count} quiz questions based on this text:\n\n{body.text}\n\n"
        f"IMPORTANT: Generate ALL text (questions, options, explanations) in {lang_name}.\n"
        f"Mix single-choice, multiple-choice, and true-false questions. "
        f"Return a JSON array wrapped in an object: {{\"components\": [...]}}"
    )
    try:
        response = await _chat(GENERATE_QUIZ_SYSTEM, user_message)
        raw = response.choices[0].message.content or "{}"
        data = _parse_json(raw)
        components = data.get("components", data) if isinstance(data, dict) else data
        # Ensure unique IDs
        for i, c in enumerate(components):
            c["id"] = f"ai-q-{uuid.uuid4().hex[:8]}"
        return {"components": components}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-scenario")
async def generate_scenario(
    body: GenerateScenarioRequest,
    current_user: User = Depends(get_current_user),
):
    _require_pro(current_user)
    """Generate a branching scenario component."""
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
        response = await _chat(GENERATE_SCENARIO_SYSTEM, user_message)
        raw = response.choices[0].message.content or "{}"
        data = _parse_json(raw)
        component = data.get("component", data)
        component["id"] = f"ai-b-{uuid.uuid4().hex[:8]}"
        for choice in component.get("choices", []):
            choice["id"] = f"ai-ch-{uuid.uuid4().hex[:8]}"
        return {"component": component}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-flashcards")
async def generate_flashcards(
    body: GenerateFlashcardsRequest,
    current_user: User = Depends(get_current_user),
):
    _require_pro(current_user)
    """Generate a flashcard deck component."""
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
        response = await _chat(GENERATE_FLASHCARDS_SYSTEM, user_message)
        raw = response.choices[0].message.content or "{}"
        data = _parse_json(raw)
        component = data.get("component", data)
        component["id"] = f"ai-f-{uuid.uuid4().hex[:8]}"
        return {"component": component}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AIReportRequest(BaseModel):
    prompt: str
    analytics_summary: str


@router.post("/report")
async def generate_report(
    body: AIReportRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate an AI analytics report. Requires Pro plan."""
    _require_pro(current_user)
    system_prompt = (
        "You are an analytics expert for an e-learning platform. "
        "Analyze the following course analytics data and answer the user's question. "
        "Be specific, give actionable recommendations. "
        "Write in the same language as the user's question. Use markdown formatting.\n\n"
        f"Analytics data:\n{body.analytics_summary}"
    )
    try:
        client = get_ai_client()
        response = await client.chat.completions.create(
            model=get_ai_model(),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": body.prompt},
            ],
            temperature=0.7,
        )
        text = response.choices[0].message.content or ""
        return {"report": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
