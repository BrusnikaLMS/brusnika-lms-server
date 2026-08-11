import asyncio
import collections
import logging
import secrets
import time
import uuid
from datetime import datetime, UTC, timedelta

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import (
    UserRegister, UserLogin, TokenResponse, UserOut,
    ForgotPasswordRequest, ResetPasswordRequest,
    VerificationRequired, VerifyCodeRequest, ResendCodeRequest,
    GoogleAuthRequest, RefreshRequest,
)
from app.auth import register_user, authenticate_user, create_access_token, create_refresh_token, rotate_refresh_token, get_current_user, hash_password
from app.models import User, PasswordResetToken, EmailVerification
from app.email import send_verification_code_email, send_password_reset_email
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

RESET_TOKEN_TTL_HOURS = 1
CODE_TTL_MINUTES = 10
CODE_RESEND_SECONDS = 60

# ── Simple in-memory rate limiter ────────────────────────────────────────────
_rate_store: dict[str, list[float]] = collections.defaultdict(list)
RATE_LIMIT_WINDOW = 300  # 5 minutes
RATE_LIMIT_MAX_AUTH = 10  # max login/register attempts per IP per window
RATE_LIMIT_MAX_VERIFY = 15  # max verify-code attempts per IP per window


def _check_rate_limit(key: str, max_attempts: int) -> None:
    now = time.time()
    attempts = _rate_store[key]
    # Clean old entries
    _rate_store[key] = [t for t in attempts if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_store[key]) >= max_attempts:
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    _rate_store[key].append(now)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _generate_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


async def _create_and_send_code(email: str, name: str, db: AsyncSession) -> str:
    """Generate a fresh 6-digit code, store it, return it (caller sends email)."""
    code = _generate_code()
    expires = datetime.utcnow() + timedelta(minutes=CODE_TTL_MINUTES)
    db.add(EmailVerification(email=email, code=code, expires_at=expires))
    await db.commit()
    logger.info("Verification code sent to %s", email)
    return code


def _fire_email(coro) -> None:
    """Schedule an email coroutine as a fire-and-forget task."""
    asyncio.ensure_future(coro)


@router.post("/register", response_model=VerificationRequired)
async def register(body: UserRegister, request: Request, db: AsyncSession = Depends(get_db)):
    _check_rate_limit(f"auth:{_get_client_ip(request)}", RATE_LIMIT_MAX_AUTH)
    user = await register_user(body.email, body.password, body.name, db)
    code = await _create_and_send_code(user.email, user.name, db)
    _fire_email(send_verification_code_email(user.email, code, user.name))
    return VerificationRequired(email=user.email)


@router.post("/login", response_model=VerificationRequired)
async def login(body: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    _check_rate_limit(f"auth:{_get_client_ip(request)}", RATE_LIMIT_MAX_AUTH)
    user = await authenticate_user(body.email, body.password, db)
    code = await _create_and_send_code(user.email, user.name, db)
    _fire_email(send_verification_code_email(user.email, code, user.name))
    return VerificationRequired(email=user.email)


@router.post("/send-code")
async def send_code(body: ResendCodeRequest, db: AsyncSession = Depends(get_db)):
    """Resend verification code. Rate-limited to once per 60 seconds."""
    result = await db.execute(
        select(EmailVerification)
        .where(EmailVerification.email == body.email, EmailVerification.used == False)
        .order_by(EmailVerification.created_at.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()

    if last:
        elapsed = (datetime.utcnow() - last.created_at.replace(tzinfo=None)).total_seconds()
        if elapsed < CODE_RESEND_SECONDS:
            wait = int(CODE_RESEND_SECONDS - elapsed)
            raise HTTPException(status_code=429, detail=f"Please wait {wait} seconds before requesting a new code.")

    # Look up user name for personalised email
    user_result = await db.execute(select(User).where(User.email == body.email))
    user = user_result.scalar_one_or_none()
    name = user.name if user else ""

    code = await _create_and_send_code(body.email, name, db)
    _fire_email(send_verification_code_email(body.email, code, name))
    return {"detail": "Code sent."}


@router.post("/verify-code", response_model=TokenResponse)
async def verify_code(body: VerifyCodeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Verify the 6-digit code and return a JWT."""
    _check_rate_limit(f"verify:{_get_client_ip(request)}:{body.email}", RATE_LIMIT_MAX_VERIFY)
    result = await db.execute(
        select(EmailVerification)
        .where(
            EmailVerification.email == body.email,
            EmailVerification.code == body.code,
            EmailVerification.used == False,
        )
        .order_by(EmailVerification.created_at.desc())
        .limit(1)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    if datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="Code has expired. Please request a new one.")

    record.used = True
    await db.commit()

    user_result = await db.execute(select(User).where(User.email == body.email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    access = create_access_token(user.id)
    refresh = await create_refresh_token(user.id, db)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a refresh token for a new access + refresh token pair (rotation)."""
    new_access, new_refresh = await rotate_refresh_token(body.refresh_token, db)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout")
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Revoke a refresh token on logout."""
    from app.models import RefreshToken as RT
    result = await db.execute(select(RT).where(RT.token == body.refresh_token))
    record = result.scalar_one_or_none()
    if record:
        record.revoked = True
        await db.commit()
    return {"detail": "Logged out."}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Always returns 200 to prevent email enumeration."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user:
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=RESET_TOKEN_TTL_HOURS)
        db.add(PasswordResetToken(user_id=user.id, token=token, expires_at=expires))
        await db.commit()
        reset_url = f"{settings.app_url}/reset-password?token={token}"
        await send_password_reset_email(user.email, reset_url)

    return {"detail": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == body.token)
    )
    record = result.scalar_one_or_none()

    if not record or record.used:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if datetime.utcnow() > record.expires_at.replace(tzinfo=UTC):
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user_result = await db.execute(select(User).where(User.id == record.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.hashed_password = hash_password(body.new_password)
    record.used = True
    await db.commit()

    return {"detail": "Password updated successfully."}


# ── Google OAuth ────────────────────────────────────────────────────────────

GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


async def _verify_google_token(id_token: str) -> dict:
    """Verify Google ID token via Google's tokeninfo endpoint."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": id_token})
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    payload = resp.json()
    # Verify audience matches our client ID
    if payload.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="Token audience mismatch")
    if payload.get("email_verified") != "true":
        raise HTTPException(status_code=401, detail="Email not verified by Google")
    return payload


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, request: Request, db: AsyncSession = Depends(get_db)):
    _check_rate_limit(f"auth:{_get_client_ip(request)}", RATE_LIMIT_MAX_AUTH)
    """Authenticate or register via Google. Returns JWT immediately (no OTP needed)."""
    payload = await _verify_google_token(body.credential)

    google_id = payload["sub"]
    email = payload["email"]
    name = payload.get("name", email.split("@")[0])
    avatar = payload.get("picture", "")

    # Check if user exists by google_id or email
    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        # Link google_id if not linked yet (user registered with email/password before)
        if not user.google_id:
            user.google_id = google_id
        if avatar and not user.avatar_url:
            user.avatar_url = avatar
        await db.commit()
        await db.refresh(user)
    else:
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=None,
            name=name,
            google_id=google_id,
            avatar_url=avatar,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access = create_access_token(user.id)
    refresh = await create_refresh_token(user.id, db)
    return TokenResponse(access_token=access, refresh_token=refresh)
