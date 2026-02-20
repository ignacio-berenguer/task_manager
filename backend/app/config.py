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

    # Database
    DATABASE_PATH: str = ""  # Empty = auto-detect relative to project root
    DATABASE_ECHO: bool = False

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Agent (AI Chat)
    ANTHROPIC_API_KEY: str = ""
    AGENT_MODEL: str = "claude-sonnet-4-20250514"
    AGENT_MAX_TOKENS: int = 4096
    AGENT_TEMPERATURE: float = 0.3
    AGENT_MAX_TOOL_ROUNDS: int = 10
    AGENT_API_BASE_URL: str = "http://localhost:8080/api/v1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
