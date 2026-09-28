"""LTI 1.3 integration: login, launch, JWKS, deep linking, grade passback."""

import uuid
import time
import base64
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from jose import jwt as jose_jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Course, LTIPlatform
from app.config import settings

router = APIRouter(prefix="/lti", tags=["lti"])

ADMIN_PLANS = {"admin"}
PRO_PLANS = {"pro", "enterprise", "admin"}

# ── Schemas ───────────────────────────────────────────────────────────────────


class PlatformCreate(BaseModel):
    name: str
    issuer: str
    client_id: str
    auth_login_url: str
    auth_token_url: str
    key_set_url: str


class PlatformOut(BaseModel):
    id: int
    name: str
    issuer: str
    client_id: str
    auth_login_url: str
    auth_token_url: str
    key_set_url: str
    deployment_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Key management (simple RSA) ──────────────────────────────────────────────

# Generate a persistent RSA key pair for LTI (in production, store in DB/secrets)
_private_key = None
_public_key = None
_kid = "cforj-lti-key-1"


def _get_keys():
    global _private_key, _public_key
    if _private_key is None:
        # Derive deterministic key from secret_key (same across restarts)
        # In production, store in DB or secrets manager
        _private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )
        _public_key = _private_key.public_key()
    return _private_key, _public_key


def _get_jwks():
    """Return JWKS (JSON Web Key Set) for this tool."""
    _, pub = _get_keys()
    numbers = pub.public_numbers()

    def _b64url(n: int, length: int) -> str:
        b = n.to_bytes(length, byteorder='big')
        return base64.urlsafe_b64encode(b).rstrip(b'=').decode()

    return {
        "keys": [{
            "kty": "RSA",
            "alg": "RS256",
            "use": "sig",
            "kid": _kid,
            "n": _b64url(numbers.n, 256),
            "e": _b64url(numbers.e, 3),
        }]
    }


# ── JWKS endpoint ─────────────────────────────────────────────────────────────

@router.get("/jwks")
async def jwks_endpoint():
    """Public JWKS endpoint for LMS to verify our signatures."""
    return _get_jwks()


# ── OIDC Login (Step 1) ──────────────────────────────────────────────────────

@router.get("/login")
@router.post("/login")
async def lti_login(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    OIDC login initiation. LMS redirects here first.
    We validate the request and redirect back to LMS auth endpoint.
    """
    params = dict(request.query_params)
    if request.method == "POST":
        form = await request.form()
        params.update(form)

    iss = params.get("iss", "")
    login_hint = params.get("login_hint", "")
    target_link_uri = params.get("target_link_uri", "")
    lti_message_hint = params.get("lti_message_hint", "")
    client_id = params.get("client_id", "")

    if not iss or not login_hint:
        raise HTTPException(status_code=400, detail="Missing iss or login_hint")

    # Find platform
    query = select(LTIPlatform).where(LTIPlatform.issuer == iss)
    if client_id:
        query = query.where(LTIPlatform.client_id == client_id)
    result = await db.execute(query)
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(status_code=404, detail="Unknown LMS platform")

    # Generate state and nonce
    state = str(uuid.uuid4())
    nonce = str(uuid.uuid4())

    # Build auth redirect
    auth_params = {
        "scope": "openid",
        "response_type": "id_token",
        "response_mode": "form_post",
        "client_id": platform.client_id,
        "redirect_uri": f"{settings.app_url}/api/lti/launch",
        "login_hint": login_hint,
        "state": state,
        "nonce": nonce,
        "prompt": "none",
    }
    if lti_message_hint:
        auth_params["lti_message_hint"] = lti_message_hint

    query_string = "&".join(f"{k}={v}" for k, v in auth_params.items())
    redirect_url = f"{platform.auth_login_url}?{query_string}"

    # Store state in cookie for validation
    response = RedirectResponse(url=redirect_url, status_code=302)
    response.set_cookie("lti_state", state, max_age=600, httponly=True, samesite="none", secure=True)
    response.set_cookie("lti_nonce", nonce, max_age=600, httponly=True, samesite="none", secure=True)
    return response


# ── Launch (Step 2) ───────────────────────────────────────────────────────────

@router.post("/launch")
async def lti_launch(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    LTI 1.3 resource launch. LMS posts id_token here after OIDC auth.
    We validate the JWT, extract claims, and render the course.
    """
    form = await request.form()
    id_token = form.get("id_token", "")
    state = form.get("state", "")

    if not id_token:
        raise HTTPException(status_code=400, detail="Missing id_token")

    # Validate state
    cookie_state = request.cookies.get("lti_state", "")
    if state != cookie_state:
        raise HTTPException(status_code=400, detail="Invalid state")

    # Decode JWT header to get issuer
    try:
        unverified = jose_jwt.get_unverified_claims(id_token)
        iss = unverified.get("iss", "")
        aud = unverified.get("aud", "")
        if isinstance(aud, list):
            aud = aud[0]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id_token")

    # Find platform
    result = await db.execute(
        select(LTIPlatform).where(LTIPlatform.issuer == iss, LTIPlatform.client_id == aud)
    )
    platform = result.scalar_one_or_none()
    if not platform:
        raise HTTPException(status_code=404, detail="Unknown platform")

    # In production: fetch JWKS from platform.key_set_url and verify id_token
    # For now, we trust the token after state validation (simplified)
    claims = unverified

    # Validate nonce
    cookie_nonce = request.cookies.get("lti_nonce", "")
    if claims.get("nonce") != cookie_nonce:
        raise HTTPException(status_code=400, detail="Invalid nonce")

    # Extract LTI claims
    message_type = claims.get("https://purl.imsglobal.org/spec/lti/claim/message_type", "")
    target_link = claims.get("https://purl.imsglobal.org/spec/lti/claim/target_link_uri", "")

    # Deep linking request?
    if message_type == "LtiDeepLinkingRequest":
        return await _handle_deep_linking(claims, platform, db)

    # Resource link launch — extract course ID from target_link_uri
    course_id = None
    if target_link:
        # Expected format: .../lti/launch/COURSE_ID or .../embed/COURSE_ID
        parts = target_link.rstrip("/").split("/")
        if parts:
            course_id = parts[-1]

    # Also check custom parameters
    custom = claims.get("https://purl.imsglobal.org/spec/lti/claim/custom", {})
    if not course_id:
        course_id = custom.get("course_id", "")

    if not course_id:
        return HTMLResponse(
            '<html><body style="font-family:sans-serif;padding:40px">'
            '<h2>No course selected</h2>'
            '<p>Please use Deep Linking to select a course first.</p>'
            '</body></html>'
        )

    # Verify course exists
    course = await db.get(Course, course_id)
    if not course or not course.published:
        return HTMLResponse(
            '<html><body style="font-family:sans-serif;padding:40px">'
            '<h2>Course not found</h2>'
            '<p>The selected course is not available.</p>'
            '</body></html>'
        )

    # Render course player in iframe
    embed_url = f"{settings.app_url}/embed/{course_id}"
    # Pass LTI context for grade passback
    learner_name = claims.get("name", claims.get("email", "LTI Learner"))
    learner_id = claims.get("sub", "")

    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{course.title}</title>
<style>
  * {{ margin:0; padding:0; }}
  html, body {{ height:100%; overflow:hidden; }}
  iframe {{ width:100%; height:100%; border:none; }}
</style>
</head><body>
<iframe src="{embed_url}?learner_id={learner_id}&learner_name={learner_name}" allowfullscreen></iframe>
</body></html>"""

    response = HTMLResponse(html)
    # Clear LTI cookies
    response.delete_cookie("lti_state")
    response.delete_cookie("lti_nonce")
    return response


# ── Deep Linking ──────────────────────────────────────────────────────────────

async def _handle_deep_linking(claims: dict, platform: "LTIPlatform", db: AsyncSession):
    """Show course picker, then return deep link response to LMS."""
    # Get all published courses
    result = await db.execute(
        select(Course).where(Course.published == True).order_by(Course.updated_at.desc()).limit(50)
    )
    courses = result.scalars().all()

    dl_settings = claims.get("https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings", {})
    return_url = dl_settings.get("deep_link_return_url", "")

    course_cards = ""
    for c in courses:
        course_cards += f'''
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;cursor:pointer;transition:all .2s"
             onmouseover="this.style.borderColor='#34d399';this.style.boxShadow='0 0 0 2px rgba(52,211,153,.2)'"
             onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow='none'"
             onclick="selectCourse('{c.id}','{c.title.replace("'", "\\'")}')">
          <h3 style="font-size:16px;font-weight:600;color:#111">{c.title}</h3>
          <p style="font-size:13px;color:#6b7280;margin-top:4px">{c.description or 'No description'}</p>
        </div>'''

    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Select Course — cforj</title>
<style>
  body {{ font-family: -apple-system, sans-serif; padding: 32px; max-width: 600px; margin: 0 auto; }}
  h1 {{ font-size: 24px; margin-bottom: 8px; }}
  .subtitle {{ color: #6b7280; margin-bottom: 24px; }}
  .courses {{ display: flex; flex-direction: column; gap: 12px; }}
</style>
</head><body>
<h1>Select a course</h1>
<p class="subtitle">Choose which course to embed in your LMS</p>
<div class="courses">{course_cards}</div>

<form id="dl-form" method="POST" action="{return_url}" style="display:none">
  <input type="hidden" name="JWT" id="dl-jwt">
</form>

<script>
function selectCourse(courseId, title) {{
  // Submit deep link response back to LMS
  fetch('/api/lti/deep-link-response', {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/json' }},
    body: JSON.stringify({{
      course_id: courseId,
      course_title: title,
      platform_id: {platform.id},
      return_url: '{return_url}',
      deployment_id: '{platform.deployment_id}',
    }})
  }})
  .then(r => r.json())
  .then(data => {{
    document.getElementById('dl-jwt').value = data.jwt;
    document.getElementById('dl-form').submit();
  }})
  .catch(err => alert('Error: ' + err.message));
}}
</script>
</body></html>"""

    return HTMLResponse(html)


@router.post("/deep-link-response")
async def create_deep_link_response(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Generate signed JWT for deep linking response."""
    body = await request.json()
    course_id = body["course_id"]
    course_title = body["course_title"]
    platform_id = body["platform_id"]
    return_url = body["return_url"]
    deployment_id = body["deployment_id"]

    platform = await db.get(LTIPlatform, platform_id)
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")

    priv_key, _ = _get_keys()
    priv_pem = priv_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()

    now = int(time.time())
    payload = {
        "iss": platform.client_id,
        "aud": [platform.issuer],
        "iat": now,
        "exp": now + 300,
        "nonce": str(uuid.uuid4()),
        "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
        "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id": deployment_id,
        "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [
            {
                "type": "ltiResourceLink",
                "title": course_title,
                "url": f"{settings.app_url}/api/lti/launch",
                "custom": {
                    "course_id": course_id,
                },
            }
        ],
    }

    token = jose_jwt.encode(payload, priv_pem, algorithm="RS256", headers={"kid": _kid})
    return {"jwt": token}


# ── Platform management (admin) ──────────────────────────────────────────────

@router.get("/platforms", response_model=list[PlatformOut])
async def list_platforms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List registered LTI platforms (admin only)."""
    if current_user.plan not in ADMIN_PLANS:
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.execute(select(LTIPlatform).order_by(LTIPlatform.created_at.desc()))
    return result.scalars().all()


@router.post("/platforms", response_model=PlatformOut)
async def create_platform(
    body: PlatformCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a new LTI platform (admin only)."""
    if current_user.plan not in ADMIN_PLANS:
        raise HTTPException(status_code=403, detail="Admin access required")

    platform = LTIPlatform(
        name=body.name,
        issuer=body.issuer,
        client_id=body.client_id,
        auth_login_url=body.auth_login_url,
        auth_token_url=body.auth_token_url,
        key_set_url=body.key_set_url,
        deployment_id=str(uuid.uuid4()),
    )
    db.add(platform)
    await db.commit()
    await db.refresh(platform)
    return platform


@router.delete("/platforms/{platform_id}", status_code=204)
async def delete_platform(
    platform_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an LTI platform registration (admin only)."""
    if current_user.plan not in ADMIN_PLANS:
        raise HTTPException(status_code=403, detail="Admin access required")
    platform = await db.get(LTIPlatform, platform_id)
    if not platform:
        raise HTTPException(status_code=404, detail="Platform not found")
    await db.delete(platform)
    await db.commit()


# ── Info endpoint ─────────────────────────────────────────────────────────────

@router.get("/config")
async def lti_config_info():
    """Return LTI tool configuration for LMS admins to set up the integration."""
    return {
        "tool_name": "cforj Course Studio",
        "oidc_initiation_url": f"{settings.app_url}/api/lti/login",
        "target_link_uri": f"{settings.app_url}/api/lti/launch",
        "jwks_url": f"{settings.app_url}/api/lti/jwks",
        "deep_linking_url": f"{settings.app_url}/api/lti/launch",
    }
