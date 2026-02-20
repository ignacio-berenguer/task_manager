"""
Calculated field definitions and mappings.

This module defines which fields are calculated (not stored in database)
and how they should be computed.
"""

# Tables that are completely calculated (read-only, no writes allowed)
READONLY_TABLES = {"datos_relevantes", "iniciativas"}

# Calculated fields per table
CALCULATED_FIELDS = {
    "datos_descriptivos": [
        "estado_de_la_iniciativa",
        "estado_sm100",
        "estado_sm200",
        "iniciativa_aprobada",
        "justificacion_regulatoria",
        "falta_justificacion_regulatoria",
    ],
    "justificaciones": [
        "nombre",
        "digital_framework_level_1",
    ],
    "grupos_iniciativas": [
        "nombre_componente",
        "importe_2025_componente",
        "importe_2025_grupo",
    ],
    "informacion_economica": [
        "nombre",
        "referente_bi",
        "cluster",
        "digital_framework_level_1",
        "origen",
        "estado",
        "debe_tener_cini",
        "debe_tener_capex_opex",
        "debe_tener_fecha_prevista_pes",
        "debe_tener_wbe",
        "budget_2026",
        "importe_2025",
        "importe_2026",
    ],
    "facturacion": ["descripcion"],
    "datos_ejecucion": [
        "nombre",
        "unidad",
        "estado_de_la_iniciativa",
        "fecha_de_ultimo_estado",
        "origen",
        "importe_2025",
        "importe_facturado_2025",
        "tipo_agrupacion",
    ],
    "hechos": ["nombre", "referente_bi"],
    "beneficios": ["nombre", "estado_de_la_iniciativa"],
    "etiquetas": ["nombre"],
    "ltp": ["nombre", "digital_framework_level_1"],
    "wbes": ["nombre"],
    "dependencias": ["nombre"],
    "notas": ["nombre", "referente_bi"],
    "avance": ["descripcion"],
    "acciones": [
        "nombre",
        "unidad",
        "estado",
        "cluster",
        "tipo",
        "siguiente_accion",
        "siguiente_accion_comentarios",
        "referente_bi",
        "referente_b_unit",
        "referente_ict",
        "importe_2025",
        "importe_2026",
    ],
    "descripciones": [
        "nombre",
        "digital_framework_level_1",
        "estado_de_la_iniciativa",
        "referente_b_unit",
    ],
    "estado_especial": ["nombre"],
    "investment_memos": ["nombre"],
    "impacto_aatt": [
        "nombre",
        "estado_de_la_iniciativa",
        "digital_framework_level_1",
        "fecha_prevista_finalizacion",
        "fecha_finalizacion_ict",
        "falta_evaluacion_impacto_aatt",
    ],
}

# Field calculation mappings
# Format: field_name -> (type, source_table, source_field) for lookups
#         field_name -> (type, function_name) for functions
#         field_name -> (type, function_name, kwargs) for functions with args
FIELD_CALCULATORS = {
    # Simple lookups from datos_descriptivos
    "nombre": ("lookup", "datos_descriptivos", "nombre"),
    "unidad": ("lookup", "datos_descriptivos", "unidad"),
    "origen": ("lookup", "datos_descriptivos", "origen"),
    "digital_framework_level_1": ("lookup", "datos_descriptivos", "digital_framework_level_1"),
    "cluster": ("lookup", "datos_descriptivos", "cluster"),
    "referente_bi": ("lookup", "datos_descriptivos", "referente_bi"),
    "referente_b_unit": ("lookup", "datos_descriptivos", "referente_b_unit"),
    "referente_ict": ("lookup", "datos_descriptivos", "referente_enabler_ict"),
    "tipo_agrupacion": ("lookup", "datos_descriptivos", "tipo_agrupacion"),
    "descripcion": ("lookup", "datos_descriptivos", "nombre"),  # descripcion = nombre

    # Lookups from datos_relevantes
    "estado_de_la_iniciativa": ("lookup", "datos_relevantes", "estado_de_la_iniciativa"),
    "estado": ("lookup", "datos_relevantes", "estado_de_la_iniciativa"),  # Alias
    "estado_sm100": ("lookup", "datos_relevantes", "estado_sm100"),
    "estado_sm200": ("lookup", "datos_relevantes", "estado_sm200"),
    "iniciativa_aprobada": ("lookup", "datos_relevantes", "iniciativa_aprobada"),
    "fecha_de_ultimo_estado": ("lookup", "datos_relevantes", "fecha_de_ultimo_estado"),
    "tipo": ("lookup", "datos_relevantes", "tipo"),
    "siguiente_accion": ("lookup", "datos_relevantes", "siguiente_accion"),
    "siguiente_accion_comentarios": ("lookup", "datos_relevantes", "fecha_limite_comentarios"),
    "fecha_prevista_finalizacion": ("lookup", "datos_relevantes", "fecha_prevista_pes"),
    "fecha_finalizacion_ict": ("lookup", "datos_relevantes", "fecha_en_ejecucion"),

    # Calculated functions - Justificacion
    "justificacion_regulatoria": ("function", "calc_justificacion_regulatoria"),
    "falta_justificacion_regulatoria": ("function", "calc_falta_justificacion_regulatoria"),

    # Importe calculations from datos_relevantes (pre-computed)
    "importe_2025": ("lookup", "datos_relevantes", "importe_2025"),
    "importe_2026": ("lookup", "datos_relevantes", "importe_2026"),
    "importe_facturado_2025": ("lookup", "datos_relevantes", "importe_facturacion_2025"),
    "budget_2026": ("lookup", "datos_relevantes", "budget_2026"),

    # Boolean fields
    "debe_tener_cini": ("function", "calc_debe_tener", {"field": "cini"}),
    "debe_tener_capex_opex": ("function", "calc_debe_tener", {"field": "capex_opex"}),
    "debe_tener_fecha_prevista_pes": ("function", "calc_debe_tener", {"field": "fecha_prevista_pes"}),
    "debe_tener_wbe": ("function", "calc_debe_tener", {"field": "wbe"}),
    "falta_evaluacion_impacto_aatt": ("function", "calc_falta_evaluacion_impacto"),

    # Grupos lookups (special - uses portfolio_id_componente)
    "nombre_componente": ("lookup_grupo", "datos_relevantes", "nombre"),
    "importe_2025_componente": ("lookup_grupo", "datos_relevantes", "importe_2025"),
    "importe_2025_grupo": ("function", "calc_sum_grupo_importes"),
}


def get_calculated_fields(table_name: str) -> list[str]:
    """Get list of calculated fields for a table."""
    return CALCULATED_FIELDS.get(table_name, [])


def is_readonly_table(table_name: str) -> bool:
    """Check if table is completely calculated (read-only)."""
    return table_name in READONLY_TABLES


def is_calculated_field(table_name: str, field_name: str) -> bool:
    """Check if a field is calculated for the given table."""
    return field_name in get_calculated_fields(table_name)


def get_calculator(field_name: str) -> tuple | None:
    """Get the calculator definition for a field."""
    return FIELD_CALCULATORS.get(field_name)
