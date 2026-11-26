from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Any


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    avatar_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class VerificationRequired(BaseModel):
    requires_verification: bool = True
    email: str


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResendCodeRequest(BaseModel):
    email: EmailStr


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Courses ─────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    id: str | None = None  # client may pass its own ID to keep local↔cloud in sync
    title: str
    description: str | None = None
    thumbnail: str | None = None
    content: dict[str, Any]  # full CourseApp JSON


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail: str | None = None
    content: dict[str, Any] | None = None
    published: bool | None = None


class CourseOut(BaseModel):
    id: str
    owner_id: str
    title: str
    description: str | None
    thumbnail: str | None
    content: dict[str, Any]
    published: bool
    view_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PublicCourseOut(CourseOut):
    show_branding: bool = True  # True for community plan, False for pro/enterprise/admin
    white_label: "WhiteLabelBrief | None" = None


class CourseListItem(BaseModel):
    id: str
    title: str
    description: str | None
    thumbnail: str | None
    published: bool
    view_count: int = 0
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Analytics ───────────────────────────────────────────────────────────────

class CompletionIn(BaseModel):
    course_id: str
    learner_id: str | None = None
    learner_name: str | None = None
    score: int
    max_score: int
    completed: bool
    progress: dict[str, Any]


class CompletionOut(BaseModel):
    id: int
    course_id: str
    learner_id: str | None
    learner_name: str | None
    score: int
    max_score: int
    completed: bool
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


# ─── Versions ────────────────────────────────────────────────────────────────

class VersionCreate(BaseModel):
    label: str | None = None


class VersionOut(BaseModel):
    id: str
    course_id: str
    version_number: int
    label: str | None
    screen_count: int
    size_bytes: int
    is_auto: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VersionWithContent(VersionOut):
    content: dict[str, Any]


class QuizBreakdownItem(BaseModel):
    question_id: str
    question_text: str
    correct_count: int
    total_answers: int
    pct_correct: float


class ScreenFunnelItem(BaseModel):
    screen_id: str
    title: str
    visits: int
    pct: float


class AvgScreenTime(BaseModel):
    screen_id: str
    title: str
    avg_ms: float


class CourseAnalyticsOut(BaseModel):
    course_id: str
    view_count: int
    total_starts: int
    total_completions: int
    completion_rate: float
    avg_score: float
    quiz_breakdown: list[QuizBreakdownItem]
    screen_funnel: list[ScreenFunnelItem]
    avg_screen_times: list[AvgScreenTime]
    learners: list[dict]


# ─── Collaborators ────────────────────────────────────────────────────────────

class CollaboratorInvite(BaseModel):
    email: EmailStr
    role: str = "editor"  # "editor" | "viewer"


class CollaboratorOut(BaseModel):
    id: int
    course_id: str
    user_id: str | None
    invited_email: str
    role: str
    accepted_at: datetime | None
    created_at: datetime
    user_name: str | None = None  # populated from joined user

    model_config = {"from_attributes": True}


class CollaboratorRoleUpdate(BaseModel):
    role: str  # "editor" | "viewer"


# ─── Comments ─────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str


class CommentResolve(BaseModel):
    resolved: bool


class CommentOut(BaseModel):
    id: int
    course_id: str
    screen_id: str
    author_id: str
    author_name: str = ""
    content: str
    resolved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── SSO ──────────────────────────────────────────────────────────────────────

class SSOConfigSchema(BaseModel):
    provider: str = "saml"
    entity_id: str = ""
    sso_url: str = ""
    certificate: str = ""
    enabled: bool = False

    model_config = {"from_attributes": True}


# ─── White-label ─────────────────────────────────────────────────────────────

class WhiteLabelOut(BaseModel):
    id: int | None = None
    owner_id: str | None = None
    app_name: str = "cforj"
    logo_url: str | None = None
    primary_color: str = "#34d399"
    remove_branding: bool = False
    custom_domain: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class WhiteLabelUpdate(BaseModel):
    app_name: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    remove_branding: bool | None = None
    custom_domain: str | None = None


class WhiteLabelBrief(BaseModel):
    app_name: str
    logo_url: str | None
    primary_color: str
    remove_branding: bool


# ─── Audit Log ────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    action: str
    resource_type: str
    resource_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
