"""Schema tools for Task Manager MCP."""

import logging
from ..table_metadata import TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA, get_url_prefix

LOG = logging.getLogger("task_manager_mcp")


def register(mcp, api_client):
    @mcp.tool()
    def listar_tablas() -> list[dict]:
        """Lista todas las tablas disponibles con descripcion y numero de registros."""
        result = []
        for tabla, desc in TABLA_DESCRIPCIONES.items():
            prefix = get_url_prefix(tabla)
            try:
                data = api_client.list_records(prefix, limit=1)
                if isinstance(data, dict):
                    count = data.get("total", 0)
                elif isinstance(data, list):
                    count = len(data)
                else:
                    count = 0
            except Exception:
                count = 0
            result.append({
                "tabla": tabla,
                "descripcion": desc,
                "num_registros": count,
                "soporta_busqueda": tabla in TABLAS_CON_BUSQUEDA,
            })
        return result

    @mcp.tool()
    def describir_tabla(tabla: str) -> dict:
        """Obtiene la descripcion y campos de una tabla."""
        if tabla not in TABLA_DESCRIPCIONES:
            return {"error": f"Tabla '{tabla}' no encontrada. Tablas disponibles: {list(TABLA_DESCRIPCIONES.keys())}"}
        prefix = get_url_prefix(tabla)
        try:
            data = api_client.list_records(prefix, limit=1)
            if isinstance(data, dict) and "data" in data:
                items = data["data"]
            elif isinstance(data, list):
                items = data
            else:
                items = []
            campos = list(items[0].keys()) if items else []
        except Exception:
            campos = []
        return {
            "tabla": tabla,
            "descripcion": TABLA_DESCRIPCIONES[tabla],
            "campos": campos,
            "soporta_busqueda": tabla in TABLAS_CON_BUSQUEDA,
        }

    @mcp.tool()
    def obtener_valores_campo(tabla: str, campo: str, limite: int = 100) -> dict:
        """Obtiene los valores distintos de un campo de una tabla."""
        if tabla not in TABLA_DESCRIPCIONES:
            return {"error": f"Tabla '{tabla}' no encontrada"}
        prefix = get_url_prefix(tabla)
        try:
            data = api_client.list_records(prefix, limit=500)
            if isinstance(data, dict) and "data" in data:
                items = data["data"]
            elif isinstance(data, list):
                items = data
            else:
                items = []
            values = sorted(set(str(item.get(campo, "")) for item in items if item.get(campo) is not None))
            return {
                "tabla": tabla,
                "campo": campo,
                "valores": values[:limite],
                "total_distintos": len(values),
            }
        except Exception as e:
            return {"error": str(e)}
