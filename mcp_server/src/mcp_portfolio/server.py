"""FastMCP server instance and entry point."""

import logging

from mcp.server.fastmcp import FastMCP

from . import config
from .api_client import PortfolioAPIClient
from .logging_config import setup_logging

logger: logging.Logger | None = None
api_client: PortfolioAPIClient | None = None

mcp = FastMCP("Portfolio Digital")


def _init():
    """Initialize logging and API client (called once at import/startup)."""
    global logger, api_client

    logger = setup_logging()
    logger.info("Iniciando MCP Server Portfolio Digital v0.1.0")
    logger.info("API base URL: %s", config.API_BASE_URL)
    logger.info("Transport: %s", config.MCP_TRANSPORT)

    api_client = PortfolioAPIClient(
        base_url=config.API_BASE_URL,
        timeout=config.API_TIMEOUT,
    )

    if api_client.health_check():
        logger.info("API health check OK")
    else:
        logger.warning(
            "API no disponible en %s — las herramientas fallarán hasta que "
            "el backend esté ejecutándose.",
            config.API_BASE_URL,
        )

    # Register all MCP tools
    from .tools import register_tools

    register_tools(mcp, api_client)


def main():
    """Entry point — initialize and run the MCP server."""
    _init()

    if config.MCP_TRANSPORT == "sse":
        mcp.run(transport="sse", host=config.MCP_HOST, port=config.MCP_PORT)
    else:
        mcp.run(transport="stdio")
