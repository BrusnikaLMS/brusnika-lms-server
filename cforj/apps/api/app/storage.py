"""Asset storage — S3/R2 or local fallback."""
import uuid
import os
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import UploadFile

from app.config import settings

# Local uploads directory (fallback when S3 is not configured)
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def _s3_configured() -> bool:
    return bool(settings.storage_bucket and settings.storage_endpoint and settings.storage_access_key)


def _s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint,
        aws_access_key_id=settings.storage_access_key,
        aws_secret_access_key=settings.storage_secret_key,
        region_name="auto",
    )


async def upload_file(file: UploadFile) -> tuple[str, str]:
    """Upload file and return (public_url, key)."""
    ext = Path(file.filename or "file").suffix.lower() or ".bin"
    key = f"{uuid.uuid4().hex}{ext}"
    data = await file.read()

    if _s3_configured():
        try:
            s3 = _s3_client()
            s3.put_object(
                Bucket=settings.storage_bucket,
                Key=key,
                Body=data,
                ContentType=file.content_type or "application/octet-stream",
                ACL="public-read",
            )
            endpoint = settings.storage_endpoint.rstrip("/")
            return f"{endpoint}/{settings.storage_bucket}/{key}", key
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError(f"Storage upload failed: {e}") from e
    else:
        dest = UPLOAD_DIR / key
        dest.write_bytes(data)
        return f"/api/uploads/{key}", key


async def delete_file(key: str) -> None:
    """Delete file from S3/R2 or local storage. No-op if not found."""
    if _s3_configured():
        try:
            s3 = _s3_client()
            s3.delete_object(Bucket=settings.storage_bucket, Key=key)
        except (BotoCoreError, ClientError):
            pass
    else:
        dest = UPLOAD_DIR / key
        if dest.exists():
            dest.unlink()
