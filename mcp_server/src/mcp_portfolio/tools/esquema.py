"""Herramientas de esquema — listar_tablas, describir_tabla, obtener_valores_campo."""

import json
import logging

from ..api_client import APIError, PortfolioAPIClient
from ..table_metadata import TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA, get_url_prefix
from .. import config

logger = logging.getLogger("portfolio_mcp")


def register(mcp, api_client: PortfolioAPIClient):
    """Register schema tools on the MCP server."""

    # Session-level cache for table info (counts don't change within a conversation)
    _table_info_cache: dict = {}

    @mcp.tool()
    def listar_tablas() -> str:
        """Listar todas las tablas disponibles con su descripción en español, número de registros, y si soportan búsqueda con filtros flexibles.

        No requiere parámetros. Devuelve la lista completa de tablas consultables.
        """
        logger.info("listar_tablas")

        tablas = []
        for tabla, descripcion in sorted(TABLA_DESCRIPCIONES.items()):
            num_registros = 0

            # Try to get count from cache or API
            if tabla in _table_info_cache:
                num_registros = _table_info_cache[tabla]
            else:
                try:
                    result = api_client.list_records(tabla, limit=1, offset=0)
                    num_registros = result.get("total", 0)
                    _table_info_cache[tabla] = num_registros
                except Exception:
                    pass  # Table count unavailable, show 0

            tablas.append(
                {
                    "tabla": tabla,
                    "descripcion": descripcion,
                    "num_registros": num_registros,
                    "soporta_busqueda": tabla in TABLAS_CON_BUSQUEDA,
                }
            )

        return json.dumps(tablas, ensure_ascii=False)

    @mcp.tool()
    def describir_tabla(tabla: str) -> str:
        """Obtener los nombres de las columnas/campos disponibles en una tabla específica.

        Útil para saber qué campos se pueden usar en filtros y consultas.

        Args:
            tabla: Nombre de la tabla a describir (ej: "datos_relevantes", "hechos", "etiquetas").
        """
        if tabla not in TABLA_DESCRIPCIONES:
            return json.dumps(
                {
                    "error": f"Tabla '{tabla}' no disponible. "
                    f"Tablas disponibles: {', '.join(sorted(TABLA_DESCRIPCIONES.keys()))}"
                },
                ensure_ascii=False,
            )

        logger.info("describir_tabla tabla=%s", tabla)

        try:
            result = api_client.list_records(tabla, limit=1, offset=0)
            num_registros = result.get("total", 0)
            data = result.get("data", [])

            campos = []
            if data and isinstance(data, list) and len(data) > 0:
                campos = list(data[0].keys())

            return json.dumps(
                {
                    "tabla": tabla,
                    "descripcion": TABLA_DESCRIPCIONES[tabla],
                    "campos": campos,
                    "num_registros": num_registros,
                    "soporta_busqueda": tabla in TABLAS_CON_BUSQUEDA,
                },
                ensure_ascii=False,
            )
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("describir_tabla error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )

    @mcp.tool()
    def obtener_valores_campo(
        tabla: str,
        campo: str,
        limite: int = 100,
    ) -> str:
        """Obtener los valores distintos de un campo en una tabla.

        Útil para conocer las opciones de filtrado disponibles, como los posibles estados,
        unidades, frameworks, clusters, etc.

        Args:
            tabla: Nombre de la tabla (ej: "datos_relevantes", "hechos").
            campo: Nombre del campo (ej: "estado_de_la_iniciativa", "unidad").
            limite: Máximo de valores distintos a devolver (por defecto: 100).
        """
        if tabla not in TABLA_DESCRIPCIONES:
            return json.dumps(
                {
                    "error": f"Tabla '{tabla}' no disponible. "
                    f"Tablas disponibles: {', '.join(sorted(TABLA_DESCRIPCIONES.keys()))}"
                },
                ensure_ascii=False,
            )

        logger.info("obtener_valores_campo tabla=%s campo=%s", tabla, campo)

        try:
            if tabla in TABLAS_CON_BUSQUEDA:
                result = api_client.search(tabla, limit=1000)
            else:
                result = api_client.list_records(tabla, limit=1000)

            data = result.get("data", [])

            # Extract distinct values
            values = set()
            for row in data:
                if campo not in row:
                    return json.dumps(
                        {
                            "error": f"El campo '{campo}' no existe en la tabla '{tabla}'. "
                            f"Usa describir_tabla para ver los campos disponibles."
                        },
                        ensure_ascii=False,
                    )
                values.add(row[campo])

            # Sort: None last, then by value
            sorted_values = sorted(
                values,
                key=lambda x: (x is None, "" if x is None else str(x)),
            )

            if len(sorted_values) > limite:
                sorted_values = sorted_values[:limite]

            return json.dumps(
                {
                    "tabla": tabla,
                    "campo": campo,
                    "valores": sorted_values,
                    "total_distintos": len(values),
                },
                ensure_ascii=False,
                default=str,
            )
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("obtener_valores_campo error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )
