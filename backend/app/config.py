"""
Configuration management for the backend API.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "portfolio_backend.log"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # API
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "Portfolio Digital API"
    API_VERSION: str = "1.0.0"

    # Database
    DATABASE_PATH: str = ""  # Empty = auto-detect relative to project root
    DATABASE_ECHO: bool = False

    # Excel Write-Back
    EXCEL_SOURCE_DIR: str = "../management/excel_source"

    # Management CLI (Trabajos)
    MANAGEMENT_DIR: str = "../management"
    UV_EXECUTABLE: str = "uv"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Agent (AI Chat)
    ANTHROPIC_API_KEY: str = ""
    AGENT_MODEL: str = "claude-sonnet-4-20250514"
    AGENT_MAX_TOKENS: int = 4096
    AGENT_TEMPERATURE: float = 0.3
    AGENT_MAX_TOOL_ROUNDS: int = 10
    AGENT_API_BASE_URL: str = "http://localhost:8000/api/v1"

    # SQL Query Tool
    SQL_MAX_ROWS: int = 1000
    SQL_QUERY_TIMEOUT: int = 30
    SQL_MAX_QUERY_LENGTH: int = 5000

    # Chart Generation (Agent)
    CHART_DPI: int = 150
    CHART_DEFAULT_WIDTH: int = 900
    CHART_DEFAULT_HEIGHT: int = 600
    CHART_MAX_CATEGORIES: int = 15
    CHART_LOCALE: str = "es_ES"
    CHART_OUTPUT_DIR: str = "charts_output"
    CHART_MAX_AGE_HOURS: int = 24

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
