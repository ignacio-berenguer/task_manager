"""Static table metadata — descriptions, search capabilities, URL prefixes."""

# Spanish descriptions for each table
TABLA_DESCRIPCIONES = {
    "datos_relevantes": "Vista consolidada con 60+ campos calculados por iniciativa — tabla principal para consultas",
    "iniciativas": "Tabla maestra de iniciativas con presupuestos por año (2024-2028)",
    "datos_descriptivos": "Datos descriptivos: nombre, unidad, framework, cluster, tipo, referentes",
    "informacion_economica": "Información económica: CINI, CAPEX/OPEX, indicadores financieros",
    "hechos": "Hechos/hitos presupuestarios con importes y estados",
    "beneficios": "Beneficios por periodo asociados a iniciativas",
    "etiquetas": "Etiquetas (tags) asociadas a iniciativas",
    "justificaciones": "Justificaciones de estado de iniciativas",
    "ltp": "Líneas de Trabajo Planificadas (LTPs)",
    "wbes": "Elementos de Estructura de Desglose de Trabajo (WBEs)",
    "dependencias": "Dependencias entre iniciativas",
    "notas": "Notas y comentarios sobre iniciativas",
    "avance": "Datos de avance y progreso",
    "acciones": "Acciones pendientes o completadas",
    "descripciones": "Descripciones detalladas de iniciativas",
    "estado_especial": "Estados especiales de iniciativas",
    "investment_memos": "Memos de inversión con presupuestos 2024-2030",
    "impacto_aatt": "Impacto en áreas técnicas (AATT)",
    "facturacion": "Facturación mensual por iniciativa",
    "fichas": "Fichas de datos por periodo",
    "documentos": "Documentos asociados con resúmenes generados por IA",
    "documentos_items": "Secciones y páginas extraídas de documentos",
    "grupos_iniciativas": "Relaciones grupo-componente entre iniciativas",
    "datos_ejecucion": "Datos de ejecución, hitos y progreso",
    "parametros": "Valores paramétricos para campos (opciones de dropdown)",
    "etiquetas_destacadas": "Etiquetas destacadas/favoritas",
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
    """Get the API URL prefix for a table name.

    Tables with underscores have hyphenated prefixes; others use their name as-is.
    """
    return _TABLA_URL_PREFIX_OVERRIDES.get(tabla, tabla)
