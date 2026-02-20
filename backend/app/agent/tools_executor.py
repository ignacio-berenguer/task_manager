"""Tool execution for Task Manager agent."""

import logging

from .api_client import AgentAPIClient, APIError
from .config import MAX_QUERY_ROWS, DEFAULT_QUERY_ROWS
from .table_metadata import get_url_prefix

LOG = logging.getLogger("task_manager_agent")


async def execute_tool(tool_name: str, tool_input: dict, api_client: AgentAPIClient) -> str:
    """Execute a tool and return the result as a string."""
    import json

    executors = {
        "buscar_tareas": _buscar_tareas,
        "obtener_tarea": _obtener_tarea,
        "buscar_acciones": _buscar_acciones,
        "listar_estados": _listar_estados,
    }

    executor = executors.get(tool_name)
    if not executor:
        return json.dumps({"error": f"Herramienta desconocida: {tool_name}"})

    try:
        result = await executor(tool_input, api_client)
        return json.dumps(result, ensure_ascii=False, default=str)
    except APIError as e:
        LOG.warning(f"API error in {tool_name}: {e}")
        return json.dumps({"error": str(e)})
    except Exception as e:
        LOG.error(f"Error executing {tool_name}: {e}", exc_info=True)
        return json.dumps({"error": f"Error interno: {str(e)}"})


async def _buscar_tareas(tool_input: dict, api_client: AgentAPIClient) -> dict:
    """Search tareas with filters."""
    filters = tool_input.get("filtros", [])
    limit = min(tool_input.get("limite", DEFAULT_QUERY_ROWS), MAX_QUERY_ROWS)
    offset = tool_input.get("desplazamiento", 0)
    order_by = tool_input.get("orden_campo")
    order_dir = tool_input.get("orden_direccion", "asc")

    search_body = {
        "filters": [{"field": f["field"], "operator": f["operator"], "value": f.get("value")} for f in filters],
        "order_by": order_by,
        "order_dir": order_dir,
        "limit": limit,
        "offset": offset,
    }

    result = await api_client.search("tareas", search_body)
    return result


async def _obtener_tarea(tool_input: dict, api_client: AgentAPIClient) -> dict:
    """Get tarea details + acciones."""
    tarea_id = tool_input["tarea_id"]

    tarea = await api_client.get_record("tareas", tarea_id)
    acciones = await api_client.list_records("acciones/tarea/" + tarea_id)

    return {
        "tarea": tarea,
        "acciones_realizadas": acciones,
    }


async def _buscar_acciones(tool_input: dict, api_client: AgentAPIClient) -> dict:
    """Get acciones for a tarea."""
    tarea_id = tool_input["tarea_id"]
    acciones = await api_client.list_records("acciones/tarea/" + tarea_id)
    return {"tarea_id": tarea_id, "acciones": acciones}


async def _listar_estados(tool_input: dict, api_client: AgentAPIClient) -> dict:
    """List parametric estados."""
    tipo = tool_input["tipo"]
    prefix = "estados-tareas" if tipo == "tareas" else "estados-acciones"
    estados = await api_client.list_records(prefix)
    return {"tipo": tipo, "estados": estados}
