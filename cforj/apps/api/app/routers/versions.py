import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import User, Course, CourseVersion
from app.schemas import VersionCreate, VersionOut, VersionWithContent
from app.auth import get_current_user

router = APIRouter(tags=["versions"])

PRO_PLANS = {"pro", "enterprise", "admin"}
VERSION_LIMIT_PRO = 50


def _require_pro(user: User):
    if user.plan not in PRO_PLANS:
        raise HTTPException(
            status_code=403,
            detail="Version history is available on Pro plan. Upgrade to unlock.",
        )


async def _get_owned_course(course_id: str, user: User, db: AsyncSession) -> Course:
    course = await db.get(Course, course_id)
    if not course or course.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


async def _next_version_number(course_id: str, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.max(CourseVersion.version_number)).where(
            CourseVersion.course_id == course_id
        )
    )
    current_max = result.scalar() or 0
    return current_max + 1


async def create_version_internal(
    course: Course,
    db: AsyncSession,
    label: str | None = None,
    is_auto: bool = False,
) -> CourseVersion:
    """Internal helper — called from versions router AND courses router (auto-save on publish)."""
    content_json = json.dumps(course.content)
    version = CourseVersion(
        id=str(uuid.uuid4()),
        course_id=course.id,
        version_number=await _next_version_number(course.id, db),
        label=label,
        content=course.content,
        screen_count=len(course.content.get("screens", [])),
        size_bytes=len(content_json.encode()),
        is_auto=is_auto,
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return version


@router.get("/courses/{course_id}/versions", response_model=list[VersionOut])
async def list_versions(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    await _get_owned_course(course_id, current_user, db)
    result = await db.execute(
        select(CourseVersion)
        .where(CourseVersion.course_id == course_id)
        .order_by(CourseVersion.version_number.desc())
    )
    return result.scalars().all()


@router.post("/courses/{course_id}/versions", response_model=VersionOut, status_code=201)
async def save_version(
    course_id: str,
    body: VersionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    course = await _get_owned_course(course_id, current_user, db)

    if current_user.plan == "pro":
        count_result = await db.execute(
            select(func.count(CourseVersion.id)).where(
                CourseVersion.course_id == course_id
            )
        )
        if (count_result.scalar() or 0) >= VERSION_LIMIT_PRO:
            raise HTTPException(
                status_code=403,
                detail=f"Pro plan is limited to {VERSION_LIMIT_PRO} saved versions per course.",
            )

    return await create_version_internal(course, db, label=body.label, is_auto=False)


@router.get("/courses/{course_id}/versions/{version_id}", response_model=VersionWithContent)
async def get_version(
    course_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    await _get_owned_course(course_id, current_user, db)
    version = await db.get(CourseVersion, version_id)
    if not version or version.course_id != course_id:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.post("/courses/{course_id}/versions/{version_id}/restore", response_model=VersionOut, status_code=201)
async def restore_version(
    course_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    course = await _get_owned_course(course_id, current_user, db)

    target = await db.get(CourseVersion, version_id)
    if not target or target.course_id != course_id:
        raise HTTPException(status_code=404, detail="Version not found")

    # Save current state as a safety snapshot before restoring
    await create_version_internal(
        course, db, label=f"Before restore to v{target.version_number}", is_auto=True
    )

    # Apply restored content to the course
    course.content = target.content
    course.title = target.content.get("title", course.title)
    course.updated_at = datetime.utcnow()
    await db.commit()

    # Return the restored version info
    await db.refresh(target)
    return target


@router.delete("/courses/{course_id}/versions/{version_id}", status_code=204)
async def delete_version(
    course_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    await _get_owned_course(course_id, current_user, db)
    version = await db.get(CourseVersion, version_id)
    if not version or version.course_id != course_id:
        raise HTTPException(status_code=404, detail="Version not found")
    await db.delete(version)
    await db.commit()
