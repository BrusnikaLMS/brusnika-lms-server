from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, OrgSSOConfig
from app.schemas import SSOConfigSchema

router = APIRouter(prefix="/sso", tags=["sso"])

ENTERPRISE_PLANS = {"enterprise", "admin"}


def _require_enterprise(user: User) -> None:
    if user.plan not in ENTERPRISE_PLANS:
        raise HTTPException(
            status_code=403,
            detail="SSO is an Enterprise feature. Upgrade to Enterprise to configure single sign-on.",
        )


@router.get("/config", response_model=SSOConfigSchema)
async def get_sso_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_enterprise(current_user)
    result = await db.execute(
        select(OrgSSOConfig).where(OrgSSOConfig.owner_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if not config:
        return SSOConfigSchema(
            provider="saml",
            entity_id="",
            sso_url="",
            certificate="",
            enabled=False,
        )
    return SSOConfigSchema(
        provider=config.provider,
        entity_id=config.entity_id,
        sso_url=config.sso_url,
        certificate=config.certificate,
        enabled=config.enabled,
    )


@router.post("/config", response_model=SSOConfigSchema)
async def save_sso_config(
    body: SSOConfigSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_enterprise(current_user)
    result = await db.execute(
        select(OrgSSOConfig).where(OrgSSOConfig.owner_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if config:
        config.provider = body.provider
        config.entity_id = body.entity_id
        config.sso_url = body.sso_url
        config.certificate = body.certificate
        config.enabled = body.enabled
        config.updated_at = datetime.utcnow()
    else:
        config = OrgSSOConfig(
            owner_id=current_user.id,
            provider=body.provider,
            entity_id=body.entity_id,
            sso_url=body.sso_url,
            certificate=body.certificate,
            enabled=body.enabled,
        )
        db.add(config)
    await db.commit()
    await db.refresh(config)
    return SSOConfigSchema(
        provider=config.provider,
        entity_id=config.entity_id,
        sso_url=config.sso_url,
        certificate=config.certificate,
        enabled=config.enabled,
    )


@router.post("/saml/login")
async def saml_login(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_enterprise(current_user)
    result = await db.execute(
        select(OrgSSOConfig).where(OrgSSOConfig.owner_id == current_user.id)
    )
    config = result.scalar_one_or_none()
    if not config or not config.enabled or not config.sso_url:
        raise HTTPException(status_code=400, detail="SSO is not configured or not enabled.")
    # Stub: in production, generate a real SAML AuthnRequest and redirect
    return {"redirect_url": config.sso_url, "note": "Configure real SAML provider in production"}


@router.post("/saml/callback")
async def saml_callback():
    return JSONResponse(
        status_code=501,
        content={"detail": "Configure real SAML provider in production"},
    )
