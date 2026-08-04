import io
import re
import uuid
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.storage import upload_file, delete_file, UPLOAD_DIR
from app.models import UploadedAsset, User
from app.auth import get_current_user, get_optional_user
from app.database import get_db

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_MIME_PREFIXES = ("image/", "video/", "audio/")
MAX_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",
    b"\x00\x00\x00": "video/mp4",
    b"\x1a\x45\xdf\xa3": "video/webm",
    b"ID3": "audio/mpeg",
    b"\xff\xfb": "audio/mpeg",
    b"\xff\xf3": "audio/mpeg",
    b"OggS": "audio/ogg",
    b"fLaC": "audio/flac",
}

SAFE_KEY_RE = re.compile(r"^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$")


def _validate_magic_bytes(data: bytes) -> bool:
    for sig in MAGIC_SIGNATURES:
        if data[:len(sig)] == sig:
            return True
    if len(data) > 8 and data[4:8] == b"ftyp":
        return True
    return False


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("")
async def upload_asset(
    file: UploadFile = File(...),
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload an image, video or audio file. Returns url, key and size_bytes."""
    if not any(file.content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        raise HTTPException(status_code=415, detail="Only image/video/audio files are allowed.")

    data = await file.read()
    if len(data) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 100 MB).")

    if not _validate_magic_bytes(data):
        raise HTTPException(status_code=415, detail="File content does not match a supported media format.")

    file.file = io.BytesIO(data)
    file.size = len(data)

    try:
        url, key = await upload_file(file)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    asset = UploadedAsset(
        id=str(uuid.uuid4()),
        owner_id=current_user.id if current_user else None,
        key=key,
        url=url,
        original_name=file.filename,
        mime_type=file.content_type,
        size_bytes=len(data),
    )
    db.add(asset)
    await db.commit()

    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=201,
        content={"url": url, "key": key, "size_bytes": len(data)},
        headers={"Access-Control-Expose-Headers": "Content-Range, Content-Length"},
    )


# ── List assets (auth required) ───────────────────────────────────────────────

@router.get("/assets")
async def list_assets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all uploaded assets for the current user with sizes and total storage used."""
    result = await db.execute(
        select(UploadedAsset)
        .where(UploadedAsset.owner_id == current_user.id)
        .order_by(UploadedAsset.created_at.desc())
    )
    assets = result.scalars().all()
    total_bytes = sum(a.size_bytes for a in assets)
    return {
        "assets": [
            {
                "key": a.key,
                "url": a.url,
                "original_name": a.original_name,
                "mime_type": a.mime_type,
                "size_bytes": a.size_bytes,
                "created_at": a.created_at,
            }
            for a in assets
        ],
        "total_size_bytes": total_bytes,
        "count": len(assets),
    }


# ── Delete asset (auth required) ──────────────────────────────────────────────

@router.delete("/assets/{key}", status_code=204)
async def delete_asset(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an uploaded asset from storage and database."""
    if not SAFE_KEY_RE.match(key):
        raise HTTPException(status_code=400, detail="Invalid asset key.")

    result = await db.execute(
        select(UploadedAsset).where(
            UploadedAsset.key == key,
            UploadedAsset.owner_id == current_user.id,
        )
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")

    await delete_file(key)
    await db.delete(asset)
    await db.commit()


# ── Serve local assets (S3 fallback) ─────────────────────────────────────────

@router.get("/{filepath:path}")
async def serve_local_asset(filepath: str):
    """Serve locally stored assets (fallback when S3 is not configured)."""
    segments = filepath.replace("\\", "/").split("/")
    for seg in segments:
        if not re.match(r"^[a-zA-Z0-9_\-]+\.?[a-zA-Z0-9]*$", seg):
            raise HTTPException(status_code=400, detail="Invalid filename.")
    path = (UPLOAD_DIR / filepath).resolve()
    if not str(path).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path, headers={"Content-Disposition": f'inline; filename="{segments[-1]}"'})
