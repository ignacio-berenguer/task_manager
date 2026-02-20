"""Agent-specific configuration — re-exports from main settings."""

from ..config import settings

ANTHROPIC_API_KEY = settings.ANTHROPIC_API_KEY
AGENT_MODEL = settings.AGENT_MODEL
AGENT_MAX_TOKENS = settings.AGENT_MAX_TOKENS
AGENT_TEMPERATURE = settings.AGENT_TEMPERATURE
AGENT_MAX_TOOL_ROUNDS = settings.AGENT_MAX_TOOL_ROUNDS
AGENT_API_BASE_URL = settings.AGENT_API_BASE_URL

# Query limits (same as MCP server)
MAX_QUERY_ROWS = 500
DEFAULT_QUERY_ROWS = 50
