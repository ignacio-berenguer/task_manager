"""Herramientas de detalle — obtener_iniciativa, obtener_documentos."""

import json
import logging

from ..api_client import APIError, PortfolioAPIClient
from .. import config

logger = logging.getLogger("portfolio_mcp")


def register(mcp, api_client: PortfolioAPIClient):
    """Register detail tools on the MCP server."""

    @mcp.tool()
    def obtener_iniciativa(portfolio_id: str) -> str:
        """Obtener todos los datos de una iniciativa específica de todas las tablas relacionadas.

        Devuelve un objeto completo con la información de cada tabla, incluyendo datos relevantes
        calculados, hechos, etiquetas, documentos, notas, acciones, y más.

        Args:
            portfolio_id: Identificador de la iniciativa (ej: "SPA_25_001").
        """
        logger.info("obtener_iniciativa portfolio_id=%s", portfolio_id)

        try:
            data = api_client.get_portfolio(portfolio_id)
        except APIError as e:
            if e.status_code == 404:
                return json.dumps(
                    {
                        "error": f"No se encontró la iniciativa con portfolio_id '{portfolio_id}'."
                    },
                    ensure_ascii=False,
                )
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("obtener_iniciativa error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )

        # Reformat: remove empty/null tables for cleaner LLM output
        cleaned = {"portfolio_id": portfolio_id, "tablas": {}}
        for table_name, table_data in data.items():
            if table_data is None:
                continue
            if isinstance(table_data, list) and len(table_data) == 0:
                continue
            if isinstance(table_data, dict) and not table_data:
                continue
            cleaned["tablas"][table_name] = table_data

        return json.dumps(cleaned, ensure_ascii=False, default=str)

    @mcp.tool()
    def obtener_documentos(
        portfolio_id: str | None = None,
        texto_busqueda: str | None = None,
        estado: str | None = None,
        limite: int = config.DEFAULT_QUERY_ROWS,
    ) -> str:
        """Obtener resúmenes de documentos asociados a iniciativas.

        Puede filtrar por portfolio_id o buscar en el texto de los resúmenes.
        Los documentos incluyen resúmenes generados por IA y metadatos del archivo.

        Args:
            portfolio_id: Filtrar documentos de una iniciativa específica (ej: "SPA_25_001").
            texto_busqueda: Buscar en resúmenes y nombres de documentos (búsqueda parcial).
            estado: Filtrar por estado del procesamiento: "Pendiente", "Completado", "Error", "Ignorado".
            limite: Máximo de resultados a devolver (por defecto: 50).
        """
        limite = min(limite, config.MAX_QUERY_ROWS)
        logger.info(
            "obtener_documentos portfolio_id=%s texto=%s estado=%s",
            portfolio_id,
            texto_busqueda,
            estado,
        )

        try:
            if portfolio_id and not texto_busqueda:
                # Fetch by portfolio directly
                docs = api_client.get_portfolio_records("documentos", portfolio_id)
                try:
                    items = api_client.get_portfolio_records(
                        "documentos_items", portfolio_id
                    )
                except APIError:
                    items = []

                # Merge items into documents
                if items and isinstance(docs, list):
                    items_by_doc = {}
                    for item in items:
                        doc_name = item.get("nombre_fichero", "")
                        items_by_doc.setdefault(doc_name, []).append(item)

                    for doc in docs:
                        doc_name = doc.get("nombre_fichero", "")
                        doc["items"] = items_by_doc.get(doc_name, [])

                return json.dumps(
                    {"portfolio_id": portfolio_id, "documentos": docs},
                    ensure_ascii=False,
                    default=str,
                )

            # Build search filters
            filters = []
            if portfolio_id:
                filters.append(
                    {"field": "portfolio_id", "operator": "eq", "value": portfolio_id}
                )
            if texto_busqueda:
                filters.append(
                    {
                        "field": "resumen",
                        "operator": "ilike",
                        "value": f"%{texto_busqueda}%",
                    }
                )
            if estado:
                filters.append(
                    {
                        "field": "estado_proceso_documento",
                        "operator": "eq",
                        "value": estado,
                    }
                )

            result = api_client.search(
                table="documentos", filters=filters, limit=limite
            )
            return json.dumps(
                {
                    "total": result.get("total", 0),
                    "documentos": result.get("data", []),
                },
                ensure_ascii=False,
                default=str,
            )

        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("obtener_documentos error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )
