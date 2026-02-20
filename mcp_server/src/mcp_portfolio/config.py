"""Configuration loaded from .env file."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the mcp_server directory
_mcp_server_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(_mcp_server_dir / ".env")

# API Connection
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
API_TIMEOUT = float(os.getenv("API_TIMEOUT", "30"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "portfolio_mcp.log")
LOG_FORMAT = os.getenv(
    "LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Resolve log file path: store in project-level logs/ directory
_project_root = _mcp_server_dir.parent
LOG_FILE_PATH = _project_root / "logs" / LOG_FILE

# Query limits
MAX_QUERY_ROWS = int(os.getenv("MAX_QUERY_ROWS", "500"))
DEFAULT_QUERY_ROWS = int(os.getenv("DEFAULT_QUERY_ROWS", "50"))

# Transport
MCP_TRANSPORT = os.getenv("MCP_TRANSPORT", "stdio")
MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")
MCP_PORT = int(os.getenv("MCP_PORT", "8001"))

# Chart Generation
CHART_DPI = int(os.getenv("CHART_DPI", "150"))
CHART_DEFAULT_WIDTH = int(os.getenv("CHART_DEFAULT_WIDTH", "900"))
CHART_DEFAULT_HEIGHT = int(os.getenv("CHART_DEFAULT_HEIGHT", "600"))
CHART_MAX_CATEGORIES = int(os.getenv("CHART_MAX_CATEGORIES", "15"))
CHART_LOCALE = os.getenv("CHART_LOCALE", "es_ES")
