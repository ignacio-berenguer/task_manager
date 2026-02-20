"""
Lookup functions for datos_relevantes.

Contains functions that retrieve data from related tables.
"""

import logging

logger = logging.getLogger('portfolio_calculate')


def get_datos_descriptivos_lookups(caches: dict, portfolio_id: str) -> dict:
    """Get all lookup fields from datos_descriptivos using preloaded cache."""
    row = caches['dd'].get(portfolio_id)
    if row:
        return {
            'nombre': row.get('nombre'),
            'unidad': row.get('unidad'),
            'origen': row.get('origen'),
            'digital_framework_level_1': row.get('digital_framework_level_1'),
            'prioridad_descriptiva': row.get('prioridad_descriptiva_bi'),
            'cluster': row.get('cluster'),
            'priorizacion': row.get('priorizacion'),
            'tipo': row.get('tipo_proyecto'),
            'referente_negocio': row.get('referente_b_unit'),
            'referente_bi': row.get('referente_bi'),
            'jira_id': row.get('codigo_jira'),
            'it_partner': row.get('it_partner'),
            'referente_ict': row.get('referente_enabler_ict'),
            'tipo_agrupacion': row.get('tipo_agrupacion'),
        }
    return {}


def get_informacion_economica_lookups(caches: dict, portfolio_id: str) -> dict:
    """Get all lookup fields from informacion_economica using preloaded cache."""
    row = caches['ie'].get(portfolio_id)
    if row:
        return {
            'capex_opex': row.get('capex_opex'),
            'cini': row.get('cini'),
            'fecha_prevista_pes': row.get('fecha_prevista_pes'),
        }
    return {}
