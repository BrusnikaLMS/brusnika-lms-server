from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog, User


async def log_action(
    db: AsyncSession,
    actor: User,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    resource_name: str | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    """Add an audit log entry. Caller is responsible for committing the session."""
    entry = AuditLog(
        owner_id=actor.id,
        actor_id=actor.id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        resource_name=resource_name,
        meta=meta or {},
    )
    db.add(entry)
