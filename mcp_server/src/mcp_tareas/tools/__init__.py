"""MCP tool registration for Task Manager."""

from .busqueda import register as register_busqueda
from .detalle import register as register_detalle
from .esquema import register as register_esquema


def register_tools(mcp, api_client):
    """Register all MCP tools."""
    register_busqueda(mcp, api_client)
    register_detalle(mcp, api_client)
    register_esquema(mcp, api_client)
