"""MCP tool registration — imports and registers all tools on the server."""

from ..api_client import PortfolioAPIClient
from . import agregacion, busqueda, detalle, esquema, sql_query, visualizacion


def register_tools(mcp, api_client: PortfolioAPIClient):
    """Register all MCP tools on the server instance."""
    busqueda.register(mcp, api_client)
    detalle.register(mcp, api_client)
    agregacion.register(mcp, api_client)
    esquema.register(mcp, api_client)
    sql_query.register(mcp, api_client)
    visualizacion.register(mcp, api_client)
