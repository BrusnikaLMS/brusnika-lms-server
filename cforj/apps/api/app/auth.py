import secrets
import uuid
import bcrypt as _bcrypt
from datetime import datetime, timedelta, UTC
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models import User, RefreshToken

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # short-lived access token
REFRESH_TOKEN_EXPIRE_DAYS = 30    # long-lived refresh token

bearer = HTTPBearer()
optional_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.secret_key, algorithm=ALGORITHM)


async def create_refresh_token(user_id: str, db: AsyncSession) -> str:
    """Create a new refresh token, store in DB, return the token string."""
    token = secrets.token_urlsafe(64)
    expires = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user_id, token=token, expires_at=expires))
    await db.commit()
    return token


async def rotate_refresh_token(old_token: str, db: AsyncSession) -> tuple[str, str]:
    """Validate and rotate a refresh token. Returns (new_access_token, new_refresh_token).
    The old token is revoked (single-use rotation for security)."""
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == old_token)
    )
    record = result.scalar_one_or_none()

    if not record or record.revoked:
        # If a revoked token is reused, revoke ALL tokens for this user (possible theft)
        if record and record.revoked:
            from sqlalchemy import update
            await db.execute(
                update(RefreshToken)
                .where(RefreshToken.user_id == record.user_id)
                .values(revoked=True)
            )
            await db.commit()
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if datetime.utcnow() > record.expires_at:
        record.revoked = True
        await db.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # Revoke old token
    record.revoked = True
    await db.commit()

    # Issue new pair
    new_access = create_access_token(record.user_id)
    new_refresh = await create_refresh_token(record.user_id, db)
    return new_access, new_refresh


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            return None
    except (JWTError, ValueError):
        return None
    return await db.get(User, user_id)


async def register_user(email: str, password: str, name: str, db: AsyncSession) -> User:
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hash_password(password),
        name=name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user
