"""Herramientas de agregación — contar_iniciativas, totalizar_importes."""

import json
import logging
from collections import Counter, defaultdict

from ..api_client import APIError, PortfolioAPIClient
from .. import config

logger = logging.getLogger("portfolio_mcp")


def fetch_all_datos_relevantes(
    api_client: PortfolioAPIClient,
    filtros: list[dict] | None = None,
) -> list[dict]:
    """Fetch all datos_relevantes rows (up to 1000) for aggregation."""
    result = api_client.search(
        table="datos_relevantes",
        filters=filtros,
        limit=1000,
    )
    return result.get("data", [])


def register(mcp, api_client: PortfolioAPIClient):
    """Register aggregation tools on the MCP server."""

    @mcp.tool()
    def contar_iniciativas(
        campo_agrupacion: str,
        filtros: list[dict] | None = None,
    ) -> str:
        """Contar iniciativas agrupadas por un campo (ej: estado, unidad, framework).

        Útil para obtener distribuciones y estadísticas como "¿cuántas iniciativas hay por estado?"
        o "¿cuántas iniciativas tiene cada unidad?".

        Args:
            campo_agrupacion: Campo de datos_relevantes por el que agrupar.
                Ejemplos: "estado_de_la_iniciativa", "unidad", "digital_framework_level_1",
                "cluster", "tipo", "estado_agrupado".
            filtros: Filtros previos a la agrupación (mismo formato que buscar_iniciativas).
                Ejemplo: [{"field": "en_presupuesto_del_ano", "operator": "eq", "value": "Si"}]
        """
        logger.info(
            "contar_iniciativas campo=%s filtros=%s",
            campo_agrupacion,
            json.dumps(filtros, default=str) if filtros else "[]",
        )

        try:
            rows = fetch_all_datos_relevantes(api_client, filtros)
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("contar_iniciativas error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )

        # Client-side GROUP BY + COUNT
        counter = Counter()
        for row in rows:
            value = row.get(campo_agrupacion)
            counter[value] += 1

        if not counter and rows:
            return json.dumps(
                {
                    "error": f"El campo '{campo_agrupacion}' no existe en datos_relevantes. "
                    f"Usa describir_tabla con tabla='datos_relevantes' para ver los campos disponibles."
                },
                ensure_ascii=False,
            )

        grupos = [
            {"valor": valor, "cantidad": cantidad}
            for valor, cantidad in counter.most_common()
        ]

        return json.dumps(
            {"total_iniciativas": len(rows), "grupos": grupos},
            ensure_ascii=False,
            default=str,
        )

    @mcp.tool()
    def totalizar_importes(
        campo_importe: str,
        campo_agrupacion: str | None = None,
        filtros: list[dict] | None = None,
    ) -> str:
        """Sumar un campo de importe agrupado por una dimensión.

        Útil para obtener presupuestos totales, facturación acumulada, etc.
        Ejemplos: "presupuesto total 2025 por unidad", "importe aprobado por framework".

        Args:
            campo_importe: Campo numérico a sumar.
                Ejemplos: "importe_2025", "budget_2025", "importe_aprobado_2025",
                "importe_facturacion_2025", "importe_sm200_2025".
            campo_agrupacion: Campo por el que agrupar. Si no se indica, devuelve solo el total global.
                Ejemplos: "unidad", "estado_de_la_iniciativa", "digital_framework_level_1".
            filtros: Filtros previos a la agregación (mismo formato que buscar_iniciativas).
        """
        logger.info(
            "totalizar_importes campo_importe=%s agrupacion=%s filtros=%s",
            campo_importe,
            campo_agrupacion,
            json.dumps(filtros, default=str) if filtros else "[]",
        )

        try:
            rows = fetch_all_datos_relevantes(api_client, filtros)
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("totalizar_importes error: %s", e)
            return json.dumps(
                {
                    "error": f"Error: No se puede conectar con la API. "
                    f"Asegúrate de que el backend está ejecutándose en {config.API_BASE_URL}."
                },
                ensure_ascii=False,
            )

        # Client-side SUM + optional GROUP BY
        total_general = 0.0
        group_totals = defaultdict(lambda: {"total": 0.0, "cantidad": 0})

        for row in rows:
            raw_value = row.get(campo_importe)
            if raw_value is None:
                continue
            try:
                value = float(raw_value)
            except (ValueError, TypeError):
                continue

            total_general += value

            if campo_agrupacion:
                group_key = row.get(campo_agrupacion)
                group_totals[group_key]["total"] += value
                group_totals[group_key]["cantidad"] += 1

        result = {"total_general": round(total_general, 2)}

        if campo_agrupacion:
            grupos = [
                {
                    "valor": key,
                    "total": round(data["total"], 2),
                    "cantidad": data["cantidad"],
                }
                for key, data in sorted(
                    group_totals.items(), key=lambda x: x[1]["total"], reverse=True
                )
            ]
            result["grupos"] = grupos

        return json.dumps(result, ensure_ascii=False, default=str)
