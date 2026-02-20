"""Herramienta de visualización — generar_grafico."""

import base64
import json
import logging
from collections import Counter, defaultdict

from mcp.server.fastmcp.utilities.types import Image

from ..api_client import APIError, PortfolioAPIClient
from ..charts import ChartRenderer, VALID_CHART_TYPES
from .. import config
from .agregacion import fetch_all_datos_relevantes

logger = logging.getLogger("portfolio_mcp")


def register(mcp, api_client: PortfolioAPIClient):
    """Register visualization tools on the MCP server."""

    renderer = ChartRenderer(
        dpi=config.CHART_DPI,
        default_width=config.CHART_DEFAULT_WIDTH,
        default_height=config.CHART_DEFAULT_HEIGHT,
        max_categories=config.CHART_MAX_CATEGORIES,
    )

    @mcp.tool()
    def generar_grafico(
        tipo_grafico: str,
        titulo: str,
        datos: list[dict] | None = None,
        campo_agrupacion: str | None = None,
        campo_valor: str | None = None,
        filtros: list[dict] | None = None,
        opciones: dict | None = None,
    ) -> Image | str:
        """Genera un gráfico a partir de datos del portfolio.

        Puede funcionar en dos modos:
        1. Modo consulta: proporciona campo_agrupacion (y opcionalmente campo_valor y filtros)
           para que la herramienta consulte datos_relevantes y genere el gráfico automáticamente.
        2. Modo directo: proporciona datos como lista de {etiqueta, valor} para graficar
           datos ya obtenidos con otras herramientas.

        Tipos de gráfico disponibles:
        - "barra": gráfico de barras verticales (comparación de categorías)
        - "barra_horizontal": gráfico de barras horizontales (ideal para muchas categorías)
        - "tarta": gráfico circular/de tarta (distribución proporcional, máximo 8-10 categorías)
        - "linea": gráfico de líneas (tendencias temporales o series)
        - "barra_apilada": barras apiladas (comparación multidimensional)

        Sugerencia de uso según el tipo de datos:
        - Distribución por categoría (estado, unidad, framework) → "barra" o "barra_horizontal"
        - Proporción sobre un total → "tarta"
        - Evolución temporal (importes por año) → "linea"
        - Comparación de múltiples series por categoría → "barra_apilada"

        Args:
            tipo_grafico: Tipo de gráfico a generar.
            titulo: Título del gráfico.
            datos: Datos directos como lista de {etiqueta, valor}.
            campo_agrupacion: Campo para agrupar (modo consulta).
            campo_valor: Campo numérico a sumar por grupo (por defecto cuenta).
            filtros: Filtros previos a la agrupación (mismo formato que buscar_iniciativas).
            opciones: Opciones de personalización del gráfico.
        """
        logger.info(
            "generar_grafico tipo=%s titulo='%s' campo_agrupacion=%s campo_valor=%s",
            tipo_grafico, titulo, campo_agrupacion, campo_valor,
        )

        # Validate chart type
        if tipo_grafico not in VALID_CHART_TYPES:
            return json.dumps(
                {"error": f"Tipo de gráfico '{tipo_grafico}' no válido. "
                 f"Tipos disponibles: {', '.join(sorted(VALID_CHART_TYPES))}"},
                ensure_ascii=False,
            )

        # Validate data source
        if not datos and not campo_agrupacion:
            return json.dumps(
                {"error": "Debes proporcionar 'datos' (modo directo) o "
                 "'campo_agrupacion' (modo consulta)."},
                ensure_ascii=False,
            )

        try:
            chart_data = _prepare_data(
                api_client, datos, campo_agrupacion, campo_valor, filtros
            )
        except APIError as e:
            return json.dumps({"error": e.message}, ensure_ascii=False)
        except Exception as e:
            logger.error("generar_grafico data error: %s", e)
            return json.dumps(
                {"error": f"Error obteniendo datos: {str(e)}"},
                ensure_ascii=False,
            )

        if not chart_data:
            return json.dumps(
                {"error": "No hay datos para generar el gráfico."},
                ensure_ascii=False,
            )

        # Render chart
        try:
            png_bytes = renderer.render(tipo_grafico, titulo, chart_data, opciones)
        except Exception as e:
            logger.error("generar_grafico render error: %s", e)
            return json.dumps(
                {"error": f"Error generando el gráfico: {str(e)}"},
                ensure_ascii=False,
            )

        b64 = base64.b64encode(png_bytes).decode("utf-8")
        logger.info("Chart generated: type=%s, data_points=%d, size=%d bytes",
                     tipo_grafico, len(chart_data), len(png_bytes))
        return Image(data=b64, format="png")


def _prepare_data(
    api_client: PortfolioAPIClient,
    datos: list[dict] | None,
    campo_agrupacion: str | None,
    campo_valor: str | None,
    filtros: list[dict] | None,
) -> list[dict]:
    """Prepare chart data from direct input or by querying the API."""
    if datos:
        # Direct mode — validate and normalize
        result = []
        for item in datos:
            if "etiqueta" not in item:
                continue
            if "valores" in item:
                # Multi-series (stacked bar)
                result.append({
                    "etiqueta": item["etiqueta"],
                    "valores": item["valores"],
                })
            else:
                val = item.get("valor", 0)
                try:
                    val = float(val) if val is not None else 0
                except (ValueError, TypeError):
                    val = 0
                result.append({"etiqueta": item["etiqueta"], "valor": val})
        return result

    # Query mode — fetch and aggregate
    rows = fetch_all_datos_relevantes(api_client, filtros)

    if campo_valor:
        # Sum mode
        group_totals = defaultdict(lambda: 0.0)
        for row in rows:
            group_key = row.get(campo_agrupacion)
            raw = row.get(campo_valor)
            if raw is None:
                continue
            try:
                group_totals[group_key] += float(raw)
            except (ValueError, TypeError):
                continue

        if not group_totals and rows:
            # Check if field exists
            if rows[0].get(campo_agrupacion) is None and campo_agrupacion not in rows[0]:
                raise ValueError(
                    f"El campo '{campo_agrupacion}' no existe en datos_relevantes."
                )

        # Return data preserving insertion order (Python 3.7+ dicts maintain order)
        return [
            {"etiqueta": k if k is not None else "(vacío)",
             "valor": round(v, 2)}
            for k, v in group_totals.items()
        ]

    # Count mode
    counter = Counter()
    for row in rows:
        value = row.get(campo_agrupacion)
        counter[value] += 1

    if not counter and rows:
        if campo_agrupacion not in rows[0]:
            raise ValueError(
                f"El campo '{campo_agrupacion}' no existe en datos_relevantes."
            )

    # Return data preserving encounter order
    return [
        {"etiqueta": k if k is not None else "(vacío)", "valor": v}
        for k, v in counter.items()
    ]
