from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.database import get_db
from app.models import Course
from app.config import settings

router = APIRouter(prefix="/share", tags=["share"])


def _og_html(title: str, description: str, image: str, url: str, embed_url: str) -> str:
    safe = lambda s: s.replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")
    t = safe(title)
    d = safe(description)
    i = safe(image)
    u = safe(url)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{t}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:title"       content="{t}" />
  <meta property="og:description" content="{d}" />
  <meta property="og:image"       content="{i}" />
  <meta property="og:url"         content="{u}" />
  <meta property="og:site_name"   content="cforj" />

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="{t}" />
  <meta name="twitter:description" content="{d}" />
  <meta name="twitter:image"       content="{i}" />

  <!-- Telegram doesn't need anything extra — it reads OG tags -->

  <meta name="description" content="{d}" />
  <meta name="theme-color" content="#34d399" />

  <!-- Redirect real users to the React player -->
  <script>window.location.replace("{embed_url}");</script>
</head>
<body style="margin:0;background:#f9fafb;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
  <div style="text-align:center;padding:2rem">
    <div style="width:48px;height:48px;border:3px solid #34d399;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem"></div>
    <p style="color:#6b7280;font-size:14px">Loading <strong>{t}</strong>…</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:0.5rem"><a href="{embed_url}" style="color:#34d399">Click here if not redirected</a></p>
  </div>
  <style>@keyframes spin{{to{{transform:rotate(360deg)}}}}</style>
</body>
</html>"""


@router.get("/{course_id}", response_class=HTMLResponse)
async def share_page(course_id: str, db: AsyncSession = Depends(get_db)):
    """
    Returns an HTML page with Open Graph / Twitter / Telegram meta tags
    and immediately redirects real users to the React embed player.
    Share this URL on Telegram, Twitter, WhatsApp etc. for rich previews.
    """
    course = await db.get(Course, course_id)
    if not course or not course.published:
        raise HTTPException(status_code=404, detail="Course not found")

    base = settings.app_url.rstrip("/")
    embed_url = f"{base}/embed/{course_id}"
    share_url = f"{base}/api/share/{course_id}"

    title = course.title
    description = course.description or "Interactive learning app — built with cforj"
    thumbnail = course.thumbnail or f"https://placehold.co/1200x630/34d399/ffffff?text={course.title[:30]}"

    return HTMLResponse(_og_html(title, description, thumbnail, share_url, embed_url))
