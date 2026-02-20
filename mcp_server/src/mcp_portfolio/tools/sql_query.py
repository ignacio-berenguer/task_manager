"""MCP tool for executing read-only SQL queries against the portfolio database."""

import json
import logging

from ..api_client import PortfolioAPIClient, APIError
from .. import config

logger = logging.getLogger("portfolio_mcp")


def register(mcp, api_client: PortfolioAPIClient):
    """Register the SQL query tool on the MCP server."""

    @mcp.tool()
    def ejecutar_consulta_sql(
        consulta_sql: str,
        explicacion: str | None = None,
        limite_filas: int = config.MAX_QUERY_ROWS,
    ) -> str:
        """Ejecutar una consulta SQL SELECT de solo lectura contra la base de datos del portfolio.

        IMPORTANTE: Solo se permiten consultas SELECT. Cualquier intento de modificar datos
        será rechazado automáticamente.

        Usa esta herramienta cuando las herramientas existentes (buscar_iniciativas,
        buscar_en_tabla, etc.) no pueden responder la pregunta porque requiere:
        - JOINs entre múltiples tablas
        - Subconsultas o CTEs
        - Agregaciones complejas (GROUP BY con HAVING, funciones de ventana)
        - Consultas que combinan datos de tablas que no tienen búsqueda flexible

        Esquema de la base de datos (tablas principales y columnas clave):

        - datos_relevantes: portfolio_id, nombre, unidad, cluster, estado_de_la_iniciativa,
          priorizacion, tipo, digital_framework_level_1, digital_framework_level_2,
          en_presupuesto_del_ano, cerrada_economicamente, estado_agrupado,
          estado_aprobacion, estado_ejecucion, tiene_justificacion,
          budget_2024..2028, importe_sm200_2024..2028, importe_aprobado_2024..2028,
          importe_facturacion_2024..2028, importe_2024..2028,
          fecha_sm100, fecha_aprobada_con_cct, fecha_en_ejecucion
        - datos_descriptivos: portfolio_id, nombre, unidad, origen, digital_framework_level_1,
          cluster, priorizacion, tipo_proyecto, referente_bi, it_partner
        - informacion_economica: portfolio_id, cini, capex_opex, fecha_prevista_pes, wbe,
          cluster, finalidad_budget
        - hechos: id_hecho, portfolio_id, fecha, importe, estado, importe_ri, importe_re,
          notas, racional, partida_presupuestaria
        - etiquetas: portfolio_id, etiqueta, valor, fecha_modificacion
        - notas: portfolio_id, registrado_por, fecha, nota
        - facturacion: portfolio_id, ano, mes, importe, concepto_factura
        - ltp: portfolio_id, responsable, tarea, siguiente_accion, estado, comentarios
        - acciones: portfolio_id, siguiente_accion, siguiente_accion_comentarios, comentarios
        - justificaciones: portfolio_id, tipo_justificacion, valor
        - beneficios: portfolio_id, grupo, concepto, periodo, importe, valor, texto
        - documentos: nombre_fichero (PK), portfolio_id, tipo_documento,
          estado_proceso_documento, resumen_documento
        - fichas: portfolio_id, fecha, campo_ficha, subtitulo, periodo, valor
        - grupos_iniciativas: portfolio_id_grupo, portfolio_id_componente, nombre_grupo
        - datos_ejecucion: portfolio_id, fecha_inicio, fecha_uat, fecha_fin,
          porcentaje_avance, en_retraso
        - wbes: portfolio_id, anio, wbe_pyb, descripcion_pyb
        - dependencias: portfolio_id, descripcion_dependencia, fecha_dependencia, comentarios
        - transacciones_json: entidad, tipo_operacion, clave_primaria, cambios,
          estado_db, estado_excel, portfolio_id, fecha_creacion
        - parametros: nombre_parametro, valor, color, orden

        Relaciones: Todas las tablas se unen por portfolio_id -> iniciativas.portfolio_id.

        Ejemplos de consultas:
        - SELECT d.portfolio_id, d.nombre, COUNT(h.id_hecho) as num_hechos
          FROM datos_relevantes d LEFT JOIN hechos h ON d.portfolio_id = h.portfolio_id
          WHERE d.unidad = 'Digital' GROUP BY d.portfolio_id, d.nombre
        - SELECT portfolio_id, nombre, budget_2025, importe_aprobado_2025
          FROM datos_relevantes WHERE budget_2025 > 100000 ORDER BY budget_2025 DESC
        - SELECT e.etiqueta, COUNT(*) as total FROM etiquetas e
          GROUP BY e.etiqueta ORDER BY total DESC LIMIT 20

        Args:
            consulta_sql: Consulta SQL SELECT a ejecutar. Debe ser una única sentencia
                SELECT válida contra las tablas del portfolio.
            explicacion: Breve explicación de por qué se generó esta consulta SQL de esta
                manera. Se incluirá en la respuesta para transparencia del usuario.
            limite_filas: Número máximo de filas a devolver (default y máximo: 500).
        """
        logger.info(
            "ejecutar_consulta_sql: sql=%s, limite=%d",
            consulta_sql[:100], limite_filas,
        )

        limite = min(limite_filas, config.MAX_QUERY_ROWS)

        try:
            result = api_client.execute_sql(consulta_sql, max_rows=limite)

            response = {
                "sql_ejecutado": result.get("sql", consulta_sql),
                "explicacion": explicacion or "",
                "columnas": result.get("columns", []),
                "total_filas": result.get("total_rows", 0),
                "truncado": result.get("truncated", False),
                "tiempo_ejecucion_ms": result.get("execution_time_ms", 0),
                "datos": result.get("data", []),
            }

            return json.dumps(response, ensure_ascii=False, default=str)

        except APIError as e:
            logger.warning("ejecutar_consulta_sql error: %s", e.message)
            return json.dumps(
                {
                    "error": e.message,
                    "sql_recibido": consulta_sql,
                    "sugerencia": "Reformula tu consulta usando únicamente SELECT.",
                },
                ensure_ascii=False,
            )
        except Exception as e:
            logger.error("ejecutar_consulta_sql unexpected error: %s", e)
            return json.dumps(
                {
                    "error": f"Error inesperado: {str(e)}",
                    "sql_recibido": consulta_sql,
                    "sugerencia": "Verifica la sintaxis SQL e inténtalo de nuevo.",
                },
                ensure_ascii=False,
            )
