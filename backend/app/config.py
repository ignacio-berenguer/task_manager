"""
Configuration management for the backend API.
"""
import logging
import os
import re
from pathlib import Path
from pydantic_settings import BaseSettings

# Project root: backend/ -> task_manager/
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

_cfg_logger = logging.getLogger(__name__)

# Patterns that identify sensitive settings (matched against lowercase field name)
SENSITIVE_PATTERNS = {"password", "key", "secret", "token", "jwks"}


def get_app_version() -> str:
    """Parse the canonical app version from frontend/src/lib/version.js.

    Returns a string like '1.029' or 'unknown' if the file cannot be read.
    """
    version_file = PROJECT_ROOT / "frontend" / "src" / "lib" / "version.js"
    try:
        text = version_file.read_text(encoding="utf-8")
        match = re.search(r"major:\s*(\d+)\s*,\s*minor:\s*(\d+)", text)
        if match:
            major, minor = int(match.group(1)), int(match.group(2))
            return f"{major}.{minor:03d}"
    except FileNotFoundError:
        _cfg_logger.warning("Version file not found: %s", version_file)
    except Exception as exc:
        _cfg_logger.warning("Could not parse version file: %s", exc)
    return "unknown"


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
    AGENT_USER_MAPPINGS: str = "{}"  # JSON: {"email": "ResponsableName", ...}

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Auto-derive AGENT_API_BASE_URL if not explicitly set.
# Always use 127.0.0.1 because the agent calls itself (same process).
# Check PORT env var first — many PaaS platforms (Railway, Render, Heroku)
# set PORT to control the listening port, which may differ from API_PORT.
if not settings.AGENT_API_BASE_URL:
    port = int(os.environ.get("PORT", settings.API_PORT))
    settings.AGENT_API_BASE_URL = f"http://127.0.0.1:{port}{settings.API_PREFIX}"
