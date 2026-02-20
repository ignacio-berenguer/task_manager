"""Search tools for Task Manager MCP."""

import logging
from ..config import settings

LOG = logging.getLogger("task_manager_mcp")


def register(mcp, api_client):
    @mcp.tool()
    def buscar_tareas(
        filtros: list[dict] | None = None,
        orden_campo: str | None = None,
        orden_direccion: str = "asc",
        limite: int = 50,
        desplazamiento: int = 0,
    ) -> dict:
        """Busca tareas con filtros flexibles. Cada filtro tiene field, operator y value."""
        limit = min(limite, settings.MAX_QUERY_ROWS)
        filters = []
        for f in (filtros or []):
            filters.append({"field": f["field"], "operator": f["operator"], "value": f.get("value")})

        body = {
            "filters": filters,
            "order_by": orden_campo,
            "order_dir": orden_direccion,
            "limit": limit,
            "offset": desplazamiento,
        }
        return api_client.search("tareas", body)

    @mcp.tool()
    def buscar_acciones(tarea_id: str) -> list:
        """Obtiene todas las acciones realizadas de una tarea especifica."""
        return api_client.list_records(f"acciones/tarea/{tarea_id}")
