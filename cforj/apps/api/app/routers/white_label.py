from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, WhiteLabelConfig
from app.schemas import WhiteLabelOut, WhiteLabelUpdate

router = APIRouter(prefix="/white-label", tags=["white-label"])

ENTERPRISE_PLANS = {"enterprise", "admin"}


@router.get("", response_model=WhiteLabelOut)
async def get_white_label(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan not in ENTERPRISE_PLANS:
        raise HTTPException(status_code=403, detail="White-label is an Enterprise feature.")
    result = await db.execute(
        select(WhiteLabelConfig).where(WhiteLabelConfig.owner_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if not config:
        return WhiteLabelOut()
    return WhiteLabelOut.model_validate(config)


@router.put("", response_model=WhiteLabelOut)
async def save_white_label(
    body: WhiteLabelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan not in ENTERPRISE_PLANS:
        raise HTTPException(status_code=403, detail="White-label is an Enterprise feature.")
    result = await db.execute(
        select(WhiteLabelConfig).where(WhiteLabelConfig.owner_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if config:
        for field, value in body.model_dump(exclude_none=True).items():
            setattr(config, field, value)
        config.updated_at = datetime.utcnow()
    else:
        config = WhiteLabelConfig(
            owner_id=current_user.id,
            **body.model_dump(exclude_none=True),
        )
        db.add(config)
    await db.commit()
    await db.refresh(config)
    return WhiteLabelOut.model_validate(config)
