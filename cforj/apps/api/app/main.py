from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.config import settings
from app.routers import auth, courses, analytics, ai, uploads, share, versions, documents, collaborators, sso, audit, comments, white_label, embed


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        # X-Frame-Options removed — cforj-embed is designed to run in iframes
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


app = FastAPI(
    title="Course Studio API",
    description="Backend API for Course Studio — no-code learning app builder",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(share.router, prefix="/api")
app.include_router(versions.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(collaborators.router, prefix="/api")
app.include_router(sso.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(white_label.router, prefix="/api")
app.include_router(embed.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
