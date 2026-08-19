import uuid
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import User, Course, CourseVersion
from app.schemas import CourseCreate, CourseUpdate, CourseOut, CourseListItem, PublicCourseOut
from app.auth import get_current_user
from app.routers.collaborators import get_user_course_role
from app.audit import log_action

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=list[CourseListItem])
async def list_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Course).where(Course.owner_id == current_user.id).order_by(Course.updated_at.desc())
    )
    return result.scalars().all()


COMMUNITY_COURSE_LIMIT = 3


@router.post("", response_model=CourseOut)
async def create_course(
    body: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan == "community":
        count_result = await db.execute(
            select(func.count(Course.id)).where(Course.owner_id == current_user.id)
        )
        if (count_result.scalar() or 0) >= COMMUNITY_COURSE_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"Community plan is limited to {COMMUNITY_COURSE_LIMIT} courses. Upgrade to Pro to create more.",
            )

    course = Course(
        id=body.id or str(uuid.uuid4()),
        owner_id=current_user.id,
        title=body.title,
        description=body.description,
        content=body.content,
    )
    db.add(course)
    await log_action(db, current_user, "course.created", "course", resource_id=course.id, resource_name=course.title)
    await db.commit()
    await db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseOut)
async def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    role = await get_user_course_role(course, current_user, db)
    if not role:
        raise HTTPException(status_code=403, detail="Access denied")
    return course


@router.patch("/{course_id}", response_model=CourseOut)
async def update_course(
    course_id: str,
    body: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    role = await get_user_course_role(course, current_user, db)
    if role not in {'owner', 'editor'}:
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    course.updated_at = datetime.utcnow()

    # Auto-save version snapshot when publishing
    if body.published is True and not course.published:
        import json as _json
        import uuid as _uuid
        from sqlalchemy import select as _select, func as _func
        max_ver = await db.execute(
            _select(_func.max(CourseVersion.version_number)).where(CourseVersion.course_id == course_id)
        )
        next_ver = (max_ver.scalar() or 0) + 1
        content_str = _json.dumps(course.content)
        snap = CourseVersion(
            id=str(_uuid.uuid4()),
            course_id=course.id,
            version_number=next_ver,
            label="Published snapshot",
            content=course.content,
            screen_count=len(course.content.get("screens", [])),
            size_bytes=len(content_str.encode()),
            is_auto=True,
        )
        db.add(snap)
        await log_action(db, current_user, "course.published", "course", resource_id=course.id, resource_name=course.title)

    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the course owner can delete this course.")
    await log_action(db, current_user, "course.deleted", "course", resource_id=course.id, resource_name=course.title)
    await db.delete(course)
    await db.commit()


# Public endpoint for embed player
PRO_PLANS = {"pro", "enterprise", "admin"}

@router.get("/public/{course_id}", response_model=PublicCourseOut)
async def get_public_course(course_id: str, db: AsyncSession = Depends(get_db)):
    course = await db.get(Course, course_id)
    if not course or not course.published:
        raise HTTPException(status_code=404, detail="Course not found")
    course.view_count = (course.view_count or 0) + 1
    await db.commit()
    await db.refresh(course)
    owner = await db.get(User, course.owner_id)
    show_branding = (owner is None) or (owner.plan not in PRO_PLANS)
    return PublicCourseOut(
        **CourseOut.model_validate(course).model_dump(),
        show_branding=show_branding,
    )
