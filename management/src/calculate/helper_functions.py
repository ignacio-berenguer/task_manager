"""
Helper functions for datos_relevantes calculations.

Contains utility functions for ID lookups, date lookups, and other helpers.
"""

import logging
from typing import Optional

logger = logging.getLogger('portfolio_calculate')


def ultimo_id(caches: dict, portfolio_id: str,
                partida_presupuestaria: str = None,
                excluded_states: tuple = ('Cierre económico iniciativa', 'Importe Planificado', 'Facturación cierre año')) -> Optional[int]: # type: ignore
    """
    Get the latest ID (highest) for a portfolio, optionally filtered by partida.
    Excludes records whose estado is in excluded_states.

    Args:
        excluded_states: tuple of estado values to exclude from the MAX(id_hecho) lookup.
            Defaults to ('Importe Planificado', 'Facturación cierre año').
            Callers can pass a wider tuple to exclude additional states.
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    if not hechos_list:
        return None

    filtered = [
        h for h in hechos_list
        if h.get('estado') not in excluded_states
        and (not partida_presupuestaria or h.get('partida_presupuestaria') == partida_presupuestaria)
    ]

    if not filtered:
        return None

    max_id = max(h['id_hecho'] for h in filtered)
    return max_id if max_id else None


def ultimo_id_aprobado(caches: dict, portfolio_id: str,
                partida_presupuestaria: str = None,
                excluded_states: tuple = (
                    'Cierre económico iniciativa',
                    'Importe Planificado', 'Importe Estimado', 'Facturación cierre año',
                    'En ejecución', 'Finalizado', 'Pendiente PES', 'PES completado',
                )) -> Optional[int]: # type: ignore
    """
    Get the latest ID (highest) for a portfolio, excluding approval-irrelevant states.

    Args:
        excluded_states: tuple of estado values to exclude from the MAX(id_hecho) lookup.
            Defaults to importe/execution/PES states that are not approval-related.
            Callers can pass a wider tuple to exclude additional states.
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    if not hechos_list:
        return None

    filtered = [
        h for h in hechos_list
        if h.get('estado') not in excluded_states
        and (not partida_presupuestaria or h.get('partida_presupuestaria') == partida_presupuestaria)
    ]

    if not filtered:
        return None

    max_id = max(h['id_hecho'] for h in filtered)
    return max_id if max_id else None


def fecha_estado(caches: dict, portfolio_id: str, estado: str) -> str:
    """
    Get the maximum date for a given portfolio and estado.

    Excel equivalent:
    =LAMBDA(portfolioID;estado;
      IFERROR(MAX(CHOOSECOLS(SORT(FILTER(Hechos[#Data];
        (Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[Estado] = estado); "No encontrado"); 6); 6)); ""))
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    if not hechos_list:
        return ""

    fechas = [
        h['fecha'] for h in hechos_list
        if h.get('estado') == estado and h.get('fecha')
    ]

    if not fechas:
        return ""

    return max(fechas)


def get_estado_especial(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Get the special estado from estado_especial table if it exists.

    Args:
        caches: Preloaded data caches
        portfolio_id: Initiative ID

    Returns:
        Special estado value or None if no record exists
    """
    row = caches['estado_especial'].get(portfolio_id)
    if row and row.get('estado_especial'):
        return row['estado_especial']
    return None


def fecha_iniciativa(caches: dict, portfolio_id: str,
                     tipo_fecha: str) -> Optional[str]:
    """
    Get a specific date for an initiative based on estado.
    Uses fecha_estado helper to find the max date for the given estado.

    Args:
        portfolio_id: Initiative ID
        tipo_fecha: One of "SM100 Final", "Aprobada con CCT", "En ejecución"

    Returns:
        Date in ISO 8601 format or None
    """
    return fecha_estado(caches, portfolio_id, tipo_fecha) or None


def fecha_aprobada_iniciativa(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Get a specific date for an initiative based on estado.
    Uses fecha_estado helper to find the max date for the given estado.
    Consider that "Aprobada con CCT" takes precedence over "Aprobada".

    Args:
        portfolio_id: Initiative ID
        tipo_fecha: One of "SM100 Final", "Aprobada con CCT", "En ejecución"

    Returns:
        Date in ISO 8601 format or None
    """
    fecha_aprobada_con_CCT = fecha_estado(caches, portfolio_id, "Aprobada con CCT")
    fecha_aprobada = fecha_estado(caches, portfolio_id, "Aprobada")

    if fecha_aprobada_con_CCT:
        return fecha_aprobada_con_CCT
    elif fecha_aprobada:
        return fecha_aprobada
    else:
        return None


def fecha_limite(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Get fecha límite from acciones table.

    Returns the next action date if available.
    """
    # The siguiente_accion might be text describing an action, not a date
    # For now, return None - can be enhanced later when date format is known
    return None


def fecha_limite_comentarios(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Get fecha límite comentarios from acciones.siguiente_accion_comentarios.
    """
    acciones_list = caches['acciones'].get(portfolio_id, [])
    if acciones_list:
        row = acciones_list[0]
        val = row.get('siguiente_accion_comentarios')
        return val if val else None
    return None


def en_presupuesto_del_ano(caches: dict, portfolio_id: str,
                            partida_presupuestaria: str = None) -> str: # type: ignore
    """
    Check if portfolio exists in hechos for given partida.

    Excel equivalent:
    =LAMBDA(portfolioID;partidaPresupuestaria;
        LET(lookupArr; CHOOSECOLS(FILTER(Hechos[#Data];
            Hechos[Partida presupuestaria] = partidaPresupuestaria; "No encontrado"); 1);
            IF(XLOOKUP(portfolioID; lookupArr; lookupArr; "No") <> "No"; "Sí"; "No")))
    """
    if not partida_presupuestaria:
        partida_presupuestaria = "2026"  # Default year as string

    hechos_list = caches['hechos'].get(portfolio_id, [])
    for h in hechos_list:
        if h.get('partida_presupuestaria') == partida_presupuestaria:
            return "Sí"
    return "No"


def calidad_valoracion(caches: dict, portfolio_id: str, ano: int) -> str:
    """
    Get calidad_estimacion from latest record with importe <> 0.

    Excel equivalent:
    =LAMBDA(portfolioID;partidaPresupuestaria;
        IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data];
            ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[Partida presupuestaria] = partidaPresupuestaria)
            * (Hechos[Importe] <> 0))); 6); 1; 2; 3; 4; 5; 11); -1); 6); "NO CALIFICADA"))
    """
    partida = f"{ano}.0"  # Year as float string

    hechos_list = caches['hechos'].get(portfolio_id, [])
    filtered = [
        h for h in hechos_list
        if h.get('partida_presupuestaria') == partida and h.get('importe') and h['importe'] != 0
    ]

    if not filtered:
        return "NO CALIFICADA"

    # Get the one with highest id_hecho (latest)
    latest = max(filtered, key=lambda h: h['id_hecho'])
    val = latest.get('calidad_estimacion')
    return val if val else "NO CALIFICADA"


def siguiente_accion(caches: dict, portfolio_id: str, ano: int = 2025) -> Optional[str]:
    """
    Get siguiente acción from acciones table.
    """
    acciones_list = caches['acciones'].get(portfolio_id, [])
    if acciones_list:
        row = acciones_list[0]
        val = row.get('siguiente_accion')
        return val if val else None
    return None


def esta_en_los_206_me_de_2026(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Check if initiative is in the 206 ME of 2026.

    Business rule: Check if exists record in etiquetas with etiqueta = "Segmento Budget 2026 - 20.6 M€"
    Returns "Sí" or "No".
    """
    etiquetas_list = caches['etiquetas'].get(portfolio_id, [])
    for e in etiquetas_list:
        if e.get('etiqueta') == 'Segmento Budget 2026 - 20.6 M€':
            return "Sí"
    return "No"


def iniciativa_cerrada_economicamente(caches: dict, portfolio_id: str) -> str:
    """
    Check if initiative has been economically closed.

    Returns "Cerrado en año YYYY" if a hechos record exists with
    estado = 'Cierre económico iniciativa', extracting the year from
    partida_presupuestaria. Returns "No" if no such record exists.
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    matching = [h for h in hechos_list if h.get('estado') == 'Cierre económico iniciativa']
    if not matching:
        return "No"
    latest = max(matching, key=lambda h: h['id_hecho'])
    partida = latest.get('partida_presupuestaria') or ''
    try:
        year = int(float(partida))
        return f"Cerrado en año {year}"
    except (ValueError, TypeError):
        return "Sí"


def activo_ejercicio_actual(cerrada_economicamente: str, importe_anio_actual: float) -> str:
    """
    Check if initiative is active in the current fiscal year.

    Returns "Si" if the initiative is NOT economically closed
    and has importe > 0 in the current year, otherwise "No".
    """
    if cerrada_economicamente == "No" and importe_anio_actual and importe_anio_actual > 0:
        return "Si"
    return "No"
