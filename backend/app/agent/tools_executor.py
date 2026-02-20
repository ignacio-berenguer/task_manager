"""Tool execution — calls api_client methods, same logic as MCP tools.

Adapted from mcp_server/src/mcp_portfolio/tools/ (busqueda, detalle, agregacion, esquema).
"""

import json
import logging
import uuid
from collections import Counter, defaultdict
from pathlib import Path

from .api_client import AgentAPIClient, APIError
from .table_metadata import TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA
from . import config
from ..charts import ChartRenderer, VALID_CHART_TYPES
from ..config import settings

logger = logging.getLogger("portfolio_agent")


async def execute_tool(tool_name: str, tool_input: dict, api_client: AgentAPIClient) -> str:
    """Execute a tool by name and return a JSON string result."""
    executor = _TOOL_MAP.get(tool_name)
    if not executor:
        return json.dumps({"error": f"Herramienta desconocida: {tool_name}"}, ensure_ascii=False)
    try:
        return await executor(tool_input, api_client)
    except Exception as e:
        logger.error("Tool %s error: %s", tool_name, e)
        return json.dumps({"error": f"Error ejecutando {tool_name}: {str(e)}"}, ensure_ascii=False)


async def _buscar_iniciativas(inp: dict, client: AgentAPIClient) -> str:
    limite = min(inp.get("limite", config.DEFAULT_QUERY_ROWS), config.MAX_QUERY_ROWS)
    desplazamiento = inp.get("desplazamiento", 0)
    filtros = inp.get("filtros")
    orden_campo = inp.get("orden_campo")
    orden_direccion = inp.get("orden_direccion", "asc")

    try:
        result = client.search(
            table="datos_relevantes",
            filters=filtros,
            order_by=orden_campo,
            order_dir=orden_direccion,
            limit=limite,
            offset=desplazamiento,
        )
        # Await the coroutine
        result = await result
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


async def _buscar_en_tabla(inp: dict, client: AgentAPIClient) -> str:
    tabla = inp.get("tabla", "")
    if tabla not in TABLA_DESCRIPCIONES:
        return json.dumps(
            {
                "error": f"Tabla '{tabla}' no disponible. "
                f"Tablas disponibles: {', '.join(sorted(TABLA_DESCRIPCIONES.keys()))}"
            },
            ensure_ascii=False,
        )

    limite = min(inp.get("limite", config.DEFAULT_QUERY_ROWS), config.MAX_QUERY_ROWS)
    desplazamiento = inp.get("desplazamiento", 0)
    filtros = inp.get("filtros")
    orden_campo = inp.get("orden_campo")
    orden_direccion = inp.get("orden_direccion", "asc")

    try:
        if tabla in TABLAS_CON_BUSQUEDA:
            result = await client.search(
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
            result = await client.list_records(table=tabla, limit=limite, offset=desplazamiento)

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


async def _obtener_iniciativa(inp: dict, client: AgentAPIClient) -> str:
    portfolio_id = inp.get("portfolio_id", "")

    try:
        data = await client.get_portfolio(portfolio_id)
    except APIError as e:
        if e.status_code == 404:
            return json.dumps(
                {"error": f"No se encontró la iniciativa con portfolio_id '{portfolio_id}'."},
                ensure_ascii=False,
            )
        return json.dumps({"error": e.message}, ensure_ascii=False)

    # Remove empty/null tables for cleaner LLM output
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


async def _obtener_documentos(inp: dict, client: AgentAPIClient) -> str:
    portfolio_id = inp.get("portfolio_id")
    texto_busqueda = inp.get("texto_busqueda")
    estado = inp.get("estado")
    limite = min(inp.get("limite", config.DEFAULT_QUERY_ROWS), config.MAX_QUERY_ROWS)

    try:
        if portfolio_id and not texto_busqueda:
            docs = await client.get_portfolio_records("documentos", portfolio_id)
            try:
                items = await client.get_portfolio_records("documentos_items", portfolio_id)
            except APIError:
                items = []

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

        filters = []
        if portfolio_id:
            filters.append({"field": "portfolio_id", "operator": "eq", "value": portfolio_id})
        if texto_busqueda:
            filters.append({"field": "resumen", "operator": "ilike", "value": f"%{texto_busqueda}%"})
        if estado:
            filters.append({"field": "estado_proceso_documento", "operator": "eq", "value": estado})

        result = await client.search(table="documentos", filters=filters, limit=limite)
        return json.dumps(
            {"total": result.get("total", 0), "documentos": result.get("data", [])},
            ensure_ascii=False,
            default=str,
        )
    except APIError as e:
        return json.dumps({"error": e.message}, ensure_ascii=False)


async def _fetch_all_datos_relevantes(
    client: AgentAPIClient, filtros: list[dict] | None = None
) -> list[dict]:
    """Fetch all datos_relevantes rows (up to 1000) for aggregation."""
    result = await client.search(table="datos_relevantes", filters=filtros, limit=1000)
    return result.get("data", [])


async def _contar_iniciativas(inp: dict, client: AgentAPIClient) -> str:
    campo_agrupacion = inp.get("campo_agrupacion", "")
    filtros = inp.get("filtros")

    try:
        rows = await _fetch_all_datos_relevantes(client, filtros)
    except APIError as e:
        return json.dumps({"error": e.message}, ensure_ascii=False)

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

    grupos = [{"valor": valor, "cantidad": cantidad} for valor, cantidad in counter.most_common()]
    return json.dumps(
        {"total_iniciativas": len(rows), "grupos": grupos},
        ensure_ascii=False,
        default=str,
    )


async def _totalizar_importes(inp: dict, client: AgentAPIClient) -> str:
    campo_importe = inp.get("campo_importe", "")
    campo_agrupacion = inp.get("campo_agrupacion")
    filtros = inp.get("filtros")

    try:
        rows = await _fetch_all_datos_relevantes(client, filtros)
    except APIError as e:
        return json.dumps({"error": e.message}, ensure_ascii=False)

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
            {"valor": key, "total": round(data["total"], 2), "cantidad": data["cantidad"]}
            for key, data in sorted(group_totals.items(), key=lambda x: x[1]["total"], reverse=True)
        ]
        result["grupos"] = grupos

    return json.dumps(result, ensure_ascii=False, default=str)


async def _listar_tablas(inp: dict, client: AgentAPIClient) -> str:
    tablas = []
    for tabla, descripcion in sorted(TABLA_DESCRIPCIONES.items()):
        num_registros = 0
        try:
            result = await client.list_records(tabla, limit=1, offset=0)
            num_registros = result.get("total", 0)
        except Exception:
            pass

        tablas.append(
            {
                "tabla": tabla,
                "descripcion": descripcion,
                "num_registros": num_registros,
                "soporta_busqueda": tabla in TABLAS_CON_BUSQUEDA,
            }
        )
    return json.dumps(tablas, ensure_ascii=False)


async def _describir_tabla(inp: dict, client: AgentAPIClient) -> str:
    tabla = inp.get("tabla", "")
    if tabla not in TABLA_DESCRIPCIONES:
        return json.dumps(
            {
                "error": f"Tabla '{tabla}' no disponible. "
                f"Tablas disponibles: {', '.join(sorted(TABLA_DESCRIPCIONES.keys()))}"
            },
            ensure_ascii=False,
        )

    try:
        result = await client.list_records(tabla, limit=1, offset=0)
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


async def _obtener_valores_campo(inp: dict, client: AgentAPIClient) -> str:
    tabla = inp.get("tabla", "")
    campo = inp.get("campo", "")
    limite = inp.get("limite", 100)

    if tabla not in TABLA_DESCRIPCIONES:
        return json.dumps(
            {
                "error": f"Tabla '{tabla}' no disponible. "
                f"Tablas disponibles: {', '.join(sorted(TABLA_DESCRIPCIONES.keys()))}"
            },
            ensure_ascii=False,
        )

    try:
        if tabla in TABLAS_CON_BUSQUEDA:
            result = await client.search(tabla, limit=1000)
        else:
            result = await client.list_records(tabla, limit=1000)

        data = result.get("data", [])

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

        sorted_values = sorted(values, key=lambda x: (x is None, "" if x is None else str(x)))
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


async def _generar_grafico(inp: dict, client: AgentAPIClient) -> str:
    tipo_grafico = inp.get("tipo_grafico", "")
    titulo = inp.get("titulo", "Gráfico")
    datos = inp.get("datos")
    campo_agrupacion = inp.get("campo_agrupacion")
    campo_valor = inp.get("campo_valor")
    filtros = inp.get("filtros")
    opciones = inp.get("opciones") or {}

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

    # Prepare data
    try:
        if datos:
            chart_data = _prepare_direct_data(datos)
        else:
            chart_data = await _prepare_query_data(
                client, campo_agrupacion, campo_valor, filtros
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
    renderer = ChartRenderer(
        dpi=settings.CHART_DPI,
        default_width=settings.CHART_DEFAULT_WIDTH,
        default_height=settings.CHART_DEFAULT_HEIGHT,
        max_categories=settings.CHART_MAX_CATEGORIES,
    )

    try:
        png_bytes = renderer.render(tipo_grafico, titulo, chart_data, opciones)
    except Exception as e:
        logger.error("generar_grafico render error: %s", e)
        return json.dumps(
            {"error": f"Error generando el gráfico: {str(e)}"},
            ensure_ascii=False,
        )

    # Save to file
    charts_dir = Path(settings.CHART_OUTPUT_DIR)
    if not charts_dir.is_absolute():
        charts_dir = Path(__file__).parent.parent.parent / charts_dir
    charts_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}.png"
    file_path = charts_dir / filename
    file_path.write_bytes(png_bytes)

    imagen_url = f"/api/v1/charts/{filename}"
    logger.info("Chart generated: type=%s, data_points=%d, file=%s",
                tipo_grafico, len(chart_data), filename)

    return json.dumps(
        {
            "imagen_url": imagen_url,
            "descripcion": f"Gráfico de {tipo_grafico}: {titulo} ({len(chart_data)} categorías)",
        },
        ensure_ascii=False,
    )


def _prepare_direct_data(datos: list[dict]) -> list[dict]:
    """Validate and normalize direct chart data."""
    result = []
    for item in datos:
        if "etiqueta" not in item:
            continue
        if "valores" in item:
            result.append({"etiqueta": item["etiqueta"], "valores": item["valores"]})
        else:
            val = item.get("valor", 0)
            try:
                val = float(val) if val is not None else 0
            except (ValueError, TypeError):
                val = 0
            result.append({"etiqueta": item["etiqueta"], "valor": val})
    return result


async def _prepare_query_data(
    client: AgentAPIClient,
    campo_agrupacion: str,
    campo_valor: str | None,
    filtros: list[dict] | None,
) -> list[dict]:
    """Fetch data from API and aggregate for charting."""
    rows = await _fetch_all_datos_relevantes(client, filtros)

    if campo_valor:
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
        return [
            {"etiqueta": k if k is not None else "(vacío)", "valor": round(v, 2)}
            for k, v in sorted(group_totals.items(), key=lambda x: x[1], reverse=True)
        ]

    counter = Counter()
    for row in rows:
        value = row.get(campo_agrupacion)
        counter[value] += 1
    return [
        {"etiqueta": k if k is not None else "(vacío)", "valor": v}
        for k, v in counter.most_common()
    ]


async def _ejecutar_consulta_sql(inp: dict, client: AgentAPIClient) -> str:
    consulta_sql = inp.get("consulta_sql", "")
    explicacion = inp.get("explicacion", "")
    limite_filas = min(inp.get("limite_filas", config.MAX_QUERY_ROWS), config.MAX_QUERY_ROWS)

    try:
        result = await client.execute_sql(consulta_sql, max_rows=limite_filas)

        return json.dumps(
            {
                "sql_ejecutado": result.get("sql", consulta_sql),
                "explicacion": explicacion,
                "columnas": result.get("columns", []),
                "total_filas": result.get("total_rows", 0),
                "truncado": result.get("truncated", False),
                "tiempo_ejecucion_ms": result.get("execution_time_ms", 0),
                "datos": result.get("data", []),
            },
            ensure_ascii=False,
            default=str,
        )
    except APIError as e:
        return json.dumps(
            {
                "error": e.message,
                "sql_recibido": consulta_sql,
                "sugerencia": "Reformula tu consulta usando únicamente SELECT.",
            },
            ensure_ascii=False,
        )


_TOOL_MAP = {
    "buscar_iniciativas": _buscar_iniciativas,
    "buscar_en_tabla": _buscar_en_tabla,
    "obtener_iniciativa": _obtener_iniciativa,
    "obtener_documentos": _obtener_documentos,
    "contar_iniciativas": _contar_iniciativas,
    "totalizar_importes": _totalizar_importes,
    "listar_tablas": _listar_tablas,
    "describir_tabla": _describir_tabla,
    "obtener_valores_campo": _obtener_valores_campo,
    "generar_grafico": _generar_grafico,
    "ejecutar_consulta_sql": _ejecutar_consulta_sql,
}
