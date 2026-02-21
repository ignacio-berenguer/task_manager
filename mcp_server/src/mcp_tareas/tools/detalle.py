"""Detail tools for Task Manager MCP."""

import logging

LOG = logging.getLogger("task_manager_mcp")


def register(mcp, api_client):
    @mcp.tool()
    def obtener_tarea(tarea_id: int) -> dict:
        """Obtiene los datos completos de una tarea y sus acciones realizadas."""
        tarea = api_client.get_record("tareas", tarea_id)
        acciones = api_client.list_records(f"acciones/tarea/{tarea_id}")
        return {
            "tarea": tarea,
            "acciones_realizadas": acciones,
        }
