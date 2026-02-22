"""Configuration loaded from .env file."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the mcp_server directory
_mcp_server_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(_mcp_server_dir / ".env")


class _Settings:
    """Configuration settings loaded from environment."""

    # API Connection
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8080/api/v1")
    API_TIMEOUT: float = float(os.getenv("API_TIMEOUT", "30"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "task_manager_mcp.log")
    LOG_FORMAT: str = os.getenv(
        "LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Resolve log file path: store in project-level logs/ directory
    _project_root = _mcp_server_dir.parent
    LOG_FILE_PATH: Path = _project_root / "logs" / LOG_FILE

    # Authentication
    API_KEY: str = os.getenv("API_KEY", "")

    # Query limits
    MAX_QUERY_ROWS: int = int(os.getenv("MAX_QUERY_ROWS", "500"))
    DEFAULT_QUERY_ROWS: int = int(os.getenv("DEFAULT_QUERY_ROWS", "50"))

    # Transport
    MCP_TRANSPORT: str = os.getenv("MCP_TRANSPORT", "stdio")
    MCP_HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
    MCP_PORT: int = int(os.getenv("MCP_PORT", "8001"))


settings = _Settings()
