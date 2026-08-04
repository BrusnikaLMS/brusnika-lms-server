from openai import AsyncOpenAI
from app.config import settings


def get_ai_client() -> AsyncOpenAI:
    """Return the configured AI client (DeepSeek, OpenAI, or Ollama)."""
    if settings.ai_backend == "ollama":
        return AsyncOpenAI(api_key="ollama", base_url=settings.ollama_base_url)
    elif settings.ai_backend == "openai":
        return AsyncOpenAI(api_key=settings.openai_api_key)
    else:  # deepseek (default)
        return AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )


def get_ai_model() -> str:
    """Return the model name for the configured backend."""
    if settings.ai_backend == "ollama":
        return settings.ollama_model
    elif settings.ai_backend == "openai":
        return "gpt-4o-mini"
    else:
        return settings.deepseek_model
