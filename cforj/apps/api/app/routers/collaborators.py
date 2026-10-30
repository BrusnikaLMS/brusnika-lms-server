import secrets
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.audit import log_action
from app.config import settings
from app.database import get_db
from app.email import send_invite_email
from app.models import Course, CourseCollaborator, User
from app.schemas import CollaboratorInvite, CollaboratorOut, CollaboratorRoleUpdate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["collaborators"])

PRO_PLANS = {"pro", "enterprise", "admin"}


async def get_user_course_role(course: Course, user: User, db: AsyncSession) -> str | None:
    """Returns 'owner', 'editor', 'viewer', or None if no access."""
    if course.owner_id == user.id:
        return 'owner'
    result = await db.execute(
        select(CourseCollaborator).where(
            CourseCollaborator.course_id == course.id,
            CourseCollaborator.user_id == user.id,
        )
    )
    collab = result.scalar_one_or_none()
    if collab:
        return collab.role
    return None


def _collab_out(collab: CourseCollaborator) -> CollaboratorOut:
    user_name: str | None = None
    if collab.user is not None:
        user_name = collab.user.name
    return CollaboratorOut(
        id=collab.id,
        course_id=collab.course_id,
        user_id=collab.user_id,
        invited_email=collab.invited_email,
        role=collab.role,
        accepted_at=collab.accepted_at,
        created_at=collab.created_at,
        user_name=user_name,
    )


@router.get("/courses/{course_id}/collaborators", response_model=list[CollaboratorOut])
async def list_collaborators(
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

    result = await db.execute(
        select(CourseCollaborator).where(CourseCollaborator.course_id == course_id)
    )
    collabs = result.scalars().all()

    out = []
    for c in collabs:
        if c.user_id:
            user = await db.get(User, c.user_id)
            c.user = user
        out.append(_collab_out(c))
    return out


@router.post("/courses/{course_id}/collaborators", response_model=CollaboratorOut)
async def invite_collaborator(
    course_id: str,
    body: CollaboratorInvite,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan not in PRO_PLANS:
        raise HTTPException(status_code=403, detail="Collaboration is a Pro feature. Upgrade to invite collaborators.")

    course = await db.get(Course, course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the course owner can invite collaborators.")

    existing_result = await db.execute(
        select(CourseCollaborator).where(
            CourseCollaborator.course_id == course_id,
            CourseCollaborator.invited_email == body.email,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        if existing.user_id:
            user = await db.get(User, existing.user_id)
            existing.user = user
        return _collab_out(existing)

    user_result = await db.execute(select(User).where(User.email == body.email))
    found_user = user_result.scalar_one_or_none()

    if found_user:
        collab = CourseCollaborator(
            course_id=course_id,
            user_id=found_user.id,
            invited_email=body.email,
            role=body.role,
            invite_token=None,
            accepted_at=datetime.utcnow(),
        )
        db.add(collab)
        await log_action(db, current_user, "collaborator.invited", "collaborator", resource_id=course_id, resource_name=course.title, meta={"email": body.email, "role": body.role})
        await db.commit()
        await db.refresh(collab)
        collab.user = found_user
        return _collab_out(collab)

    token = secrets.token_urlsafe(32)
    collab = CourseCollaborator(
        course_id=course_id,
        user_id=None,
        invited_email=body.email,
        role=body.role,
        invite_token=token,
        accepted_at=None,
    )
    db.add(collab)
    await db.commit()
    await db.refresh(collab)

    invite_url = f"{settings.app_url}/invite/{token}"
    await send_invite_email(body.email, invite_url, course.title)

    return _collab_out(collab)


@router.put("/courses/{course_id}/collaborators/{collab_id}", response_model=CollaboratorOut)
async def update_collaborator_role(
    course_id: str,
    collab_id: int,
    body: CollaboratorRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the course owner can change collaborator roles.")

    collab = await db.get(CourseCollaborator, collab_id)
    if not collab or collab.course_id != course_id:
        raise HTTPException(status_code=404, detail="Collaborator not found")

    collab.role = body.role
    await db.commit()
    await db.refresh(collab)

    if collab.user_id:
        user = await db.get(User, collab.user_id)
        collab.user = user
    return _collab_out(collab)


@router.delete("/courses/{course_id}/collaborators/{collab_id}", status_code=204)
async def remove_collaborator(
    course_id: str,
    collab_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course = await db.get(Course, course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the course owner can remove collaborators.")

    collab = await db.get(CourseCollaborator, collab_id)
    if not collab or collab.course_id != course_id:
        raise HTTPException(status_code=404, detail="Collaborator not found")

    await db.delete(collab)
    await db.commit()


@router.get("/invite/{token}")
async def accept_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CourseCollaborator).where(CourseCollaborator.invite_token == token)
    )
    collab = result.scalar_one_or_none()
    if not collab:
        raise HTTPException(status_code=404, detail="Invalid or expired invite token.")

    collab.user_id = current_user.id
    collab.accepted_at = datetime.utcnow()
    collab.invite_token = None
    await db.commit()

    return RedirectResponse(url=f"{settings.app_url}/editor")
