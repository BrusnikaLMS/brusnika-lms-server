from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Course, ScreenComment, CourseCollaborator
from app.schemas import CommentCreate, CommentResolve, CommentOut

router = APIRouter(tags=["comments"])

PRO_PLANS = {"pro", "enterprise", "admin"}


def _require_pro(user: User):
    if user.plan not in PRO_PLANS:
        raise HTTPException(status_code=403, detail="Pro plan required for comments")


async def _check_course_access(course_id: str, user: User, db: AsyncSession) -> Course:
    course = await db.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.owner_id == user.id:
        return course
    result = await db.execute(
        select(CourseCollaborator).where(
            CourseCollaborator.course_id == course_id,
            CourseCollaborator.user_id == user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")
    return course


@router.get("/courses/{course_id}/screens/{screen_id}/comments", response_model=list[CommentOut])
async def list_comments(
    course_id: str,
    screen_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_course_access(course_id, current_user, db)
    result = await db.execute(
        select(ScreenComment)
        .where(ScreenComment.course_id == course_id, ScreenComment.screen_id == screen_id)
        .order_by(ScreenComment.created_at.asc())
    )
    comments = result.scalars().all()
    out = []
    for c in comments:
        author = await db.get(User, c.author_id)
        out.append(CommentOut(
            id=c.id, course_id=c.course_id, screen_id=c.screen_id,
            author_id=c.author_id, author_name=author.name if author else "",
            content=c.content, resolved=c.resolved, created_at=c.created_at,
        ))
    return out


@router.post("/courses/{course_id}/screens/{screen_id}/comments", response_model=CommentOut)
async def create_comment(
    course_id: str,
    screen_id: str,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    await _check_course_access(course_id, current_user, db)
    comment = ScreenComment(
        course_id=course_id,
        screen_id=screen_id,
        author_id=current_user.id,
        content=body.content,
        resolved=False,
    )
    db.add(comment)

    # Notify course owner and collaborators about new comment
    course = await db.get(Course, course_id)
    notify_ids = set()
    if course and course.owner_id != current_user.id:
        notify_ids.add(course.owner_id)
    # Also notify collaborators
    collab_result = await db.execute(
        select(CourseCollaborator.user_id).where(
            CourseCollaborator.course_id == course_id,
            CourseCollaborator.user_id.isnot(None),
            CourseCollaborator.user_id != current_user.id,
        )
    )
    for row in collab_result.all():
        if row[0]:
            notify_ids.add(row[0])

    await db.commit()
    await db.refresh(comment)
    return CommentOut(
        id=comment.id, course_id=comment.course_id, screen_id=comment.screen_id,
        author_id=comment.author_id, author_name=current_user.name,
        content=comment.content, resolved=comment.resolved, created_at=comment.created_at,
    )


@router.patch("/comments/{comment_id}", response_model=CommentOut)
async def resolve_comment(
    comment_id: int,
    body: CommentResolve,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    comment = await db.get(ScreenComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    await _check_course_access(comment.course_id, current_user, db)
    comment.resolved = body.resolved
    await db.commit()
    await db.refresh(comment)
    author = await db.get(User, comment.author_id)
    return CommentOut(
        id=comment.id, course_id=comment.course_id, screen_id=comment.screen_id,
        author_id=comment.author_id, author_name=author.name if author else "",
        content=comment.content, resolved=comment.resolved, created_at=comment.created_at,
    )


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pro(current_user)
    comment = await db.get(ScreenComment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        course = await db.get(Course, comment.course_id)
        if not course or course.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the comment author or course owner can delete")
    await db.delete(comment)
    await db.commit()
