"""Static table metadata — descriptions, search capabilities, URL prefixes.

Copied from mcp_server/src/mcp_portfolio/table_metadata.py to avoid cross-module
dependencies. Both modules live in the same repo and this data changes rarely.
"""

# Spanish descriptions for each table
TABLA_DESCRIPCIONES = {
    "datos_relevantes": "Vista consolidada con 60+ campos calculados por iniciativa — tabla principal para consultas",
    "iniciativas": "NO UTILIZAR ESTA TABLA",
    "datos_descriptivos": "Datos descriptivos de cada iniciativa del portfolio: nombre, unidad, framework, cluster, tipo, referentes",
    "informacion_economica": "Información económica: CINI, CAPEX/OPEX, indicadores financieros",
    "hechos": "Hechos/hitos presupuestarios con importes y estados",
    "beneficios": "Beneficios por periodo asociados a iniciativas",
    "etiquetas": "Etiquetas (tags) asociadas a iniciativas que definen categorías de clasificación de la iniciativa o valores de campos representados por la etiqueta",
    "justificaciones": "Justificaciones de priorización o regulatorias (precepto legal, estado de publicación del precepto legal) de iniciativas",
    "ltp": "Líneas de Trabajo Planificadas (LTPs) son las tareas que los gestores de Business Improvement tienen que realizar sobre las iniciativas",
    "wbes": "Los WBEs son las cuentas contables en las que se imputan los costes de las iniciativas",
    "dependencias": "En la tabla de dependencias se registran los motivos por los que una iniciativa es especialmente importante o tiene que estar terminada en una determinada fecha",
    "notas": "Notas y comentarios sobre iniciativas suelen contenter información relevante para la gestión de la iniciativa ",
    "avance": "Datos de avance y progreso, especialmente el avance técnico de la iniciativa, la fecha de inicio, la fecha prevista de fin y la fecha de las UAT (pruebas de usuario)",
    "acciones": "Acciones que deben realizarse a continuación en la gestión de las iniciativas",
    "descripciones": "Descripciones detalladas de iniciativas",
    "estado_especial": "Tabla paramétrica para definir el estado que debe tener una iniciativa con independencia de la tabla de Hechos",
    "investment_memos": "Investment Memos para iniciativas de especial importancia",
    "impacto_aatt": "Impacto en áreas territoriales (AATT) de cada iniciativa",
    "facturacion": "Facturación mensual por iniciativa",
    "fichas": "Volcado de los campos de la ficha de aprobación a las iniciativas",
    "documentos": "Documentos asociados con resúmenes generados por IA que describen el contenido funcional de cada iniciatiba",
    "documentos_items": "Secciones y páginas extraídas de documentos que describen el contenido funcional de cada iniciativa",
    "grupos_iniciativas": "Relaciones grupo-componente entre iniciativas",
    "datos_ejecucion": "Datos de ejecución, hitos y progreso",
    "parametros": "Valores paramétricos para campos (opciones de dropdown)",
    "etiquetas_destacadas": "Identifica alunas etiquetas de especial importancia de entre todas las que existen en la tabla Etiquetas",
}

# Tables that support POST /search with flexible filters
TABLAS_CON_BUSQUEDA = {
    "datos_relevantes",
    "iniciativas",
    "datos_descriptivos",
    "informacion_economica",
    "hechos",
    "etiquetas",
    "acciones",
    "dependencias",
    "documentos",
    "fichas",
}

# API URL prefix overrides (hyphenated names differ from table names)
_TABLA_URL_PREFIX_OVERRIDES = {
    "datos_relevantes": "datos-relevantes",
    "datos_descriptivos": "datos-descriptivos",
    "informacion_economica": "informacion-economica",
    "datos_ejecucion": "datos-ejecucion",
    "grupos_iniciativas": "grupos-iniciativas",
    "estado_especial": "estado-especial",
    "investment_memos": "investment-memos",
    "impacto_aatt": "impacto-aatt",
    "documentos_items": "documentos-items",
    "etiquetas_destacadas": "etiquetas-destacadas",
}


def get_url_prefix(tabla: str) -> str:
    """Get the API URL prefix for a table name."""
    return _TABLA_URL_PREFIX_OVERRIDES.get(tabla, tabla)
