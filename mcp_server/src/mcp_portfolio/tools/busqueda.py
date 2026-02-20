"""Herramientas de búsqueda — buscar_iniciativas, buscar_en_tabla."""

import json
import logging

from ..api_client import APIError, PortfolioAPIClient
from ..table_metadata import TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA, get_url_prefix
from .. import config

logger = logging.getLogger("portfolio_mcp")


def register(mcp, api_client: PortfolioAPIClient):
    """Register search tools on the MCP server."""

    @mcp.tool()
    def buscar_iniciativas(
        filtros: list[dict] | None = None,
        orden_campo: str | None = None,
        orden_direccion: str = "asc",
        limite: int = config.DEFAULT_QUERY_ROWS,
        desplazamiento: int = 0,
    ) -> str:
        """Buscar iniciativas en la vista consolidada (datos_relevantes) con filtros flexibles, ordenamiento y paginación.

        Esta es la herramienta principal para consultas sobre iniciativas. La tabla datos_relevantes
        contiene 60+ campos calculados incluyendo nombre, unidad, framework, estado, importes por año
        (2024-2028), y más.

        Args:
            filtros: Lista de filtros. Cada filtro es un diccionario con "field", "operator" y "value".
                Operadores: eq, ne, gt, gte, lt, lte, like, ilike, in, not_in, is_null, is_not_null.
                Ejemplo: [{"field": "estado_de_la_iniciativa", "operator": "eq", "value": "En Ejecución"}]
            orden_campo: Campo por el cual ordenar los resultados.
            orden_direccion: "asc" o "desc" (por defecto: "asc").
            limite: Máximo de resultados a devolver (por defecto: 50, máximo: 500).
            desplazamiento: Desplazamiento para paginación (por defecto: 0).
        """
        limite = min(limite, config.MAX_QUERY_ROWS)
        logger.info(
            "buscar_iniciativas filtros=%s limite=%d offset=%d",
            json.dumps(filtros, default=str) if filtros else "[]",
            limite,
            desplazamiento,
        )

        try:
            result = api_client.search(
                table="datos_relevantes",
                filters=filtros,
                order_by=orden_campo,
                order_dir=orden_direccion,
                limit=limite,
                offset=desplazamiento,
            )
            return json.dumps(
                {
                    "total": result.get("total", 0),
                    "datos": result.get("data", []),
                    "limite": result.get("limit", limite),
                    "desplazamiento": result.get("offset", desplazamiento),
                },
                ensure_ascii=False,
                default=str,
            )
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("buscar_iniciativas error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )

    @mcp.tool()
    def buscar_en_tabla(
        tabla: str,
        filtros: list[dict] | None = None,
        orden_campo: str | None = None,
        orden_direccion: str = "asc",
        limite: int = config.DEFAULT_QUERY_ROWS,
        desplazamiento: int = 0,
    ) -> str:
        """Buscar registros en cualquier tabla disponible de la base de datos.

        Para las tablas principales (datos_relevantes, iniciativas, hechos, etiquetas, acciones, etc.)
        se pueden usar filtros flexibles. Para otras tablas, se obtiene la lista de registros con paginación.

        Args:
            tabla: Nombre de la tabla a consultar (ej: "hechos", "etiquetas", "beneficios").
                Usa la herramienta listar_tablas para ver las tablas disponibles.
            filtros: Lista de filtros (mismo formato que buscar_iniciativas).
                Solo disponible para tablas con búsqueda flexible.
            orden_campo: Campo por el cual ordenar los resultados.
            orden_direccion: "asc" o "desc" (por defecto: "asc").
            limite: Máximo de resultados (por defecto: 50, máximo: 500).
            desplazamiento: Desplazamiento para paginación (por defecto: 0).
        """
        if tabla not in TABLA_DESCRIPCIONES:
            return json.dumps(
                {
                    "error": f"Tabla '{tabla}' no disponible. "
                    f"Tablas disponibles: {', '.join(sorted(TABLA_DESCRIPCIONES.keys()))}"
                },
                ensure_ascii=False,
            )

        limite = min(limite, config.MAX_QUERY_ROWS)
        logger.info(
            "buscar_en_tabla tabla=%s filtros=%s limite=%d",
            tabla,
            json.dumps(filtros, default=str) if filtros else "[]",
            limite,
        )

        try:
            if tabla in TABLAS_CON_BUSQUEDA:
                result = api_client.search(
                    table=tabla,
                    filters=filtros,
                    order_by=orden_campo,
                    order_dir=orden_direccion,
                    limit=limite,
                    offset=desplazamiento,
                )
            else:
                if filtros:
                    return json.dumps(
                        {
                            "error": f"La tabla '{tabla}' no soporta búsqueda con filtros. "
                            f"Solo se puede listar con paginación. "
                            f"Tablas con búsqueda flexible: {', '.join(sorted(TABLAS_CON_BUSQUEDA))}"
                        },
                        ensure_ascii=False,
                    )
                result = api_client.list_records(
                    table=tabla,
                    limit=limite,
                    offset=desplazamiento,
                )

            return json.dumps(
                {
                    "total": result.get("total", 0),
                    "datos": result.get("data", []),
                    "limite": result.get("limit", limite),
                    "desplazamiento": result.get("offset", desplazamiento),
                },
                ensure_ascii=False,
                default=str,
            )
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("buscar_en_tabla error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )
