"""
Importe calculation functions for datos_relevantes.

Contains functions that calculate various importe (amount) fields.
"""

import logging

from .estado_functions import estado_aprobacion_iniciativa

logger = logging.getLogger('portfolio_calculate')


def importe(caches: dict, portfolio_id: str, ano: int,
            tipo_importe: str) -> float:
    """
    Calculate importe based on type. The 'ano' parameter maps to 'partida_presupuestaria'.

    Args:
        caches: Preloaded data caches
        portfolio_id: Initiative ID
        ano: Year (2024, 2025, 2026, etc.) - used as partida_presupuestaria
        tipo_importe: One of "Budget", "Aprobado", "Importe", "En Aprobación",
                        "Importe RE", "Cash Cost RE", "Importe Planificado Fijo",
                        "Planificado", "SM200", "Citetic", "Facturado"

    Returns:
        Calculated amount as float, or 0.0 if not found
    """
    # Year as float string for partida_presupuestaria (e.g., "2025")
    partida = f"{ano}"

    if tipo_importe == "Aprobado":
        return _importe_en_aprobacion(caches, portfolio_id, partida)
    elif tipo_importe == "Importe":
        return _importe_iniciativa(caches, portfolio_id, partida)
    elif tipo_importe == "En Aprobación":
        return _importe_en_aprobacion(caches, portfolio_id, partida)
    elif tipo_importe in ("Importe RE", "Cash Cost RE"):
        return _importe_re(caches, portfolio_id, partida)
    elif tipo_importe == "Importe Planificado Fijo":
        return _importe_planificado_fijo(caches, portfolio_id, partida)
    elif tipo_importe == "Planificado":
        return _importe_planificado(caches, portfolio_id, partida)
    elif tipo_importe == "SM200":
        return _importe_sm200(caches, portfolio_id, partida)
    elif tipo_importe == "Budget":
        return _importe_planificado(caches, portfolio_id, partida)  # Budget uses Planificado logic
    elif tipo_importe == "Citetic":
        return 0.0  # Not implemented - no formula provided
    elif tipo_importe == "Facturado":
        return _importe_facturado(caches, portfolio_id, ano)
    else:
        return 0.0


def _importe_aprobado(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Get approved amount. If approval status is "Aprobada" or "Aprobada con CCT",
    returns en_aprobacion amount if non-zero, otherwise SM200 amount.

    Excel:
    =LAMBDA(portfolioID;partidaPresupuestaria;
        LET(estadoAprobación; EstadoAprobaciónIniciativa(portfolioID);
            importeEnAprobación; ImporteIniciativaEnAprobación(portfolioID; partidaPresupuestaria);
            importeSM200; ImporteSM200Iniciativa(portfolioID; partidaPresupuestaria);
            IF(OR(estadoAprobación = "Aprobada"; estadoAprobación = "Aprobada con CCT");
                IF(importeEnAprobación <> 0; importeEnAprobación; importeSM200); 0)))
    """
    estado_aprobacion = estado_aprobacion_iniciativa(caches, portfolio_id)
    if estado_aprobacion in ('Aprobada', 'Aprobada con CCT'):
        importe_aprobacion = _importe_en_aprobacion(caches, portfolio_id, partida)
        if importe_aprobacion != 0:
            return importe_aprobacion
        return _importe_sm200(caches, portfolio_id, partida)
    return 0.0


def _importe_iniciativa(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Get importe using a priority-based estado lookup.

    Priority tiers (highest to lowest), each taking the latest id_hecho:
      1. Aprobada, Aprobada con CCT, En Aprobación, Revisión Regulación, Facturación cierre año, SM200 Final
      2. En ejecución, SM200 En Revisión
      3. Importe Planificado, Importe Estimado
    Returns 0.0 if no match found in any tier.
    """
    # Priority tiers: checked in order, first tier with a result wins
    priority_tiers = [
        # Tier 1: approved / regulatory / year-end — most authoritative
        ('Aprobada', 'Aprobada con CCT', 'En Aprobación', 'Revisión Regulación', 'Facturación cierre año', 'SM200 Final'),
        # Tier 2: in execution / under SM200 review
        ('En ejecución', 'SM200 En Revisión'),
        # Tier 3: planned / estimated — least authoritative
        ('Importe Planificado', 'Importe Estimado'),
    ]

    hechos_list = caches['hechos'].get(portfolio_id, [])
    if not hechos_list:
        return 0.0

    for estados in priority_tiers:
        filtered = [
            h for h in hechos_list
            if h.get('partida_presupuestaria') == partida
            and h.get('importe') and h['importe'] != 0
            and h.get('estado') in estados
        ]
        if filtered:
            # Get the one with highest id_hecho (latest)
            latest = max(filtered, key=lambda h: h['id_hecho'])
            return float(latest['importe'])

    return 0.0


def _importe_en_aprobacion(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record with estado "Aprobada" or "Aprobada con CCT".
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    filtered = [
        h for h in hechos_list
        if h.get('partida_presupuestaria') == partida
        and h.get('importe') and h['importe'] != 0
        and h.get('estado') in ('Aprobada', 'Aprobada con CCT')
    ]

    if not filtered:
        return 0.0

    latest = max(filtered, key=lambda h: h['id_hecho'])
    return float(latest['importe'])


def _importe_re(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Get importe_re from latest record matching specific estados.
    """
    valid_states = ('SM200 Final', 'Aprobada', 'Aprobada con CCT',
                    'Revisión Regulación', 'En ejecución', 'SM200 En Revisión')

    hechos_list = caches['hechos'].get(portfolio_id, [])
    filtered = [
        h for h in hechos_list
        if h.get('partida_presupuestaria') == partida
        and h.get('importe') and h['importe'] != 0
        and h.get('estado') in valid_states
    ]

    if not filtered:
        return 0.0

    latest = max(filtered, key=lambda h: h['id_hecho'])
    val = latest.get('importe_re')
    return float(val) if val else 0.0


def _importe_planificado_fijo(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record with estado = "Importe Planificado".
    Sorts by fecha (date) instead of ID.
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    filtered = [
        h for h in hechos_list
        if h.get('partida_presupuestaria') == partida
        and h.get('importe') and h['importe'] != 0
        and h.get('estado') == 'Importe Planificado'
    ]

    if not filtered:
        return 0.0

    # Sort by fecha DESC (latest date first)
    latest = max(filtered, key=lambda h: h.get('fecha') or '')
    return float(latest['importe'])


def _importe_planificado(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Cascading logic: try planificado_fijo, then SM200, then importe.

    Excel:
    =LAMBDA(portfolioID;partidaPresupuestaria; LET(
        ipfi;ImportePlanificadoFijoIniciativa(portfolioID;partidaPresupuestaria);
        ism;ImporteSM200Iniciativa(portfolioID;partidaPresupuestaria);
        ii;ImporteIniciativa(portfolioID;partidaPresupuestaria;"");
        IF(ipfi<>0;ipfi;IF(ism<>0;ism;IF(ii<>0;ii;0))) ) )
    """
    ipfi = _importe_planificado_fijo(caches, portfolio_id, partida)
    if ipfi != 0:
        return ipfi
    ism = _importe_sm200(caches, portfolio_id, partida)
    if ism != 0:
        return ism
    return _importe_iniciativa(caches, portfolio_id, partida)


def _importe_sm200(caches: dict, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record with estado "SM200 Final" or "SM200 En Revisión".
    """
    hechos_list = caches['hechos'].get(portfolio_id, [])
    filtered = [
        h for h in hechos_list
        if h.get('partida_presupuestaria') == partida
        and h.get('importe') and h['importe'] != 0
        and h.get('estado') in ('SM200 Final', 'SM200 En Revisión')
    ]

    if not filtered:
        return 0.0

    latest = max(filtered, key=lambda h: h['id_hecho'])
    return float(latest['importe'])


def _importe_facturado(caches: dict, portfolio_id: str, ano: int) -> float:
    """
    Get total facturado from facturacion table for a given year.
    """
    facturacion_list = caches['facturacion'].get(portfolio_id, [])
    total = sum(
        float(f['importe']) for f in facturacion_list
        if f.get('ano') == ano and f.get('importe')
    )
    return total
