from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, AuditLog
from app.schemas import AuditLogOut

router = APIRouter(prefix="/audit-log", tags=["audit"])

ENTERPRISE_PLANS = {"enterprise", "admin"}


@router.get("", response_model=list[AuditLogOut])
async def list_audit_log(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan not in ENTERPRISE_PLANS:
        raise HTTPException(
            status_code=403,
            detail="Audit log is an Enterprise feature.",
        )
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.owner_id == current_user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    )
    entries = result.scalars().all()
    return [
        AuditLogOut(
            id=e.id,
            action=e.action,
            resource_type=e.resource_type,
            resource_name=e.resource_name,
            created_at=e.created_at,
        )
        for e in entries
    ]
