from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/course_studio"
    secret_key: str = ""  # MUST be set via env SECRET_KEY
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    deepseek_api_key: str = ""  # set via env DEEPSEEK_API_KEY
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    storage_bucket: str = ""
    storage_endpoint: str = ""
    storage_access_key: str = ""
    storage_secret_key: str = ""
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Email — Resend (HTTP API, no firewall issues) takes priority over SMTP
    resend_api_key: str = ""
    # SMTP fallback — Zoho Mail (587=STARTTLS, 465=SSL — port 465 is often blocked on VPS)
    smtp_host: str = "smtp.zoho.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""  # set via env SMTP_PASSWORD
    smtp_from: str = "info@cforj.studio"
    app_url: str = "http://localhost:3001"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # AI backend: "deepseek" | "openai" | "ollama"
    ai_backend: str = "deepseek"
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "llama3"


settings = Settings()
