"""Task Manager MCP Server."""

import logging
from mcp.server.fastmcp import FastMCP

from .config import settings
from .logging_config import setup_logging
from .api_client import TaskAPIClient
from .tools import register_tools

mcp = FastMCP("Task Manager")
LOG = logging.getLogger("task_manager_mcp")

api_client: TaskAPIClient | None = None


@mcp.lifecycle()
async def _init():
    """Initialize on startup."""
    global api_client
    setup_logging()
    api_client = TaskAPIClient(settings.API_BASE_URL)
    LOG.info("MCP server initialized")

    # Health check
    try:
        result = api_client.list_records("tareas", limit=1)
        LOG.info("Backend API connection OK")
    except Exception as e:
        LOG.warning(f"Backend API not reachable: {e}")

    register_tools(mcp, api_client)


def main():
    """Entry point."""
    transport = settings.MCP_TRANSPORT
    if transport == "sse":
        mcp.run(transport="sse", host=settings.MCP_HOST, port=settings.MCP_PORT)
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
