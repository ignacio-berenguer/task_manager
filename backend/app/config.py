"""
Configuration management for the backend API.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "task_manager_backend.log"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8080
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "Task Manager API"
    API_VERSION: str = "1.0.0"

    # Database (PostgreSQL)
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 5432
    DB_USER: str = "task_user"
    DB_PASSWORD: str = "your_secure_password"
    DB_NAME: str = "tasksmanager"
    DATABASE_ECHO: bool = False

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Authentication
    CLERK_JWKS_URL: str = ""
    CLERK_AUTHORIZED_PARTIES: list[str] = ["http://localhost:5173"]
    API_KEY: str = ""

    # Agent (AI Chat)
    ANTHROPIC_API_KEY: str = ""
    AGENT_MODEL: str = "claude-sonnet-4-20250514"
    AGENT_MAX_TOKENS: int = 4096
    AGENT_TEMPERATURE: float = 0.3
    AGENT_MAX_TOOL_ROUNDS: int = 10
    AGENT_API_BASE_URL: str = ""  # Auto-derived from API_HOST:API_PORT if empty

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Auto-derive AGENT_API_BASE_URL from API settings if not explicitly set
if not settings.AGENT_API_BASE_URL:
    _host = "127.0.0.1" if settings.API_HOST == "0.0.0.0" else settings.API_HOST
    settings.AGENT_API_BASE_URL = f"http://{_host}:{settings.API_PORT}{settings.API_PREFIX}"
