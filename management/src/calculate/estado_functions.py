"""
Estado calculation functions for datos_relevantes.

Contains functions that calculate various estado (status) fields.
"""

import logging
from typing import Optional

from .helper_functions import (
    ultimo_id, ultimo_id_aprobado, get_estado_especial
)

logger = logging.getLogger('portfolio_calculate')


def estado_iniciativa(caches: dict, portfolio_id: str) -> str:
    """
    Get the estado de la iniciativa.

    First checks estado_especial table. If a record exists, returns that value.
    Otherwise, gets estado from hechos table using ultimo_id.

    Excel equivalent (simplified):
    Get estado from estado_especial if it exists, otherwise from hechos.
    """
    # First check estado_especial table
    estado_esp = get_estado_especial(caches, portfolio_id)
    if estado_esp:
        return estado_esp

    # States excluded from both the ultimo_id lookup and the estado query
    excluded_states = ('Cierre económico iniciativa', 'Facturación cierre año', 'Importe Planificado', 'Importe Estimado')

    ult_id = ultimo_id(caches, portfolio_id, excluded_states=excluded_states)
    if not ult_id:
        return ""

    # Find the hecho with this id_hecho
    hechos_list = caches['hechos'].get(portfolio_id, [])
    for h in hechos_list:
        if h.get('id_hecho') == ult_id:
            return h.get('estado') or ""
    return ""


def fecha_de_ultimo_estado(caches: dict, portfolio_id: str) -> str:
    """
    Get the date of the record with the latest ID.

    Excel equivalent:
    =LAMBDA(portfolioID;
        IFERROR(LET(ultID; UltimoID(portfolioID; "");
        TAKE(CHOOSECOLS(FILTER(Hechos[#Data];
          ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[ID] = ultID))); 6); 1)); "Estado erróneo"))
    """
    # Same excluded states as estado_iniciativa
    excluded_states = ('Cierre económico iniciativa', 'Facturación cierre año', 'Importe Planificado', 'Importe Estimado')

    ult_id = ultimo_id(caches, portfolio_id, excluded_states=excluded_states)
    if not ult_id:
        return "Estado erróneo"

    # Find the hecho with this id_hecho
    hechos_list = caches['hechos'].get(portfolio_id, [])
    for h in hechos_list:
        if h.get('id_hecho') == ult_id:
            fecha = h.get('fecha')
            return fecha if fecha else "Estado erróneo"
    return "Estado erróneo"


def estado_aprobacion_iniciativa(caches: dict, portfolio_id: str) -> str:
    """
    Get approval status from the latest record, excluding execution states.

    Excel equivalent:
    =LAMBDA(portfolioID;
        IFERROR(LET(ultID; UltimoIDAprobado(portfolioID; "");
            TAKE(CHOOSECOLS(FILTER(Hechos[#Data];
            ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[ID] = ultID) *
            ((Hechos[Estado] <> "En ejecución") * (Hechos[Estado] <> "Finalizado") *
                (Hechos[Estado] <> "Pendiente PES") * (Hechos[Estado] <> "PES completado")))); 5); 1));
        "Estado erróneo"))

    Note: This function should return the last approval-related estado, not execution estados.
    """
    # Exclude execution + importe states from the ultimo_id_aprobado lookup
    excluded_states = (
        'Cierre económico iniciativa',
        'En ejecución', 'Finalizado', 'Pendiente PES', 'PES completado',
        'Facturación cierre año', 'Importe Planificado', 'Importe Estimado',
    )

    ult_id = ultimo_id_aprobado(caches, portfolio_id, excluded_states=excluded_states)
    if not ult_id:
        return "Estado erróneo"

    # Find the hecho with this id_hecho
    hechos_list = caches['hechos'].get(portfolio_id, [])
    for h in hechos_list:
        if h.get('id_hecho') == ult_id:
            return h.get('estado') or "Estado erróneo"
    return "Estado erróneo"


def estado_ejecucion_iniciativa(caches: dict, portfolio_id: str) -> str:
    """
    Get execution status from the latest record, only for execution states.
    Uses case-insensitive matching for state comparison.

    Excel equivalent:
    =LAMBDA(portfolioID;
        IFERROR(LET(ultID; UltimoID(portfolioID; "");
            TAKE(CHOOSECOLS(FILTER(Hechos[#Data];
                ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[ID] = ultID) *
                ((Hechos[Estado] = "En ejecución") + (Hechos[Estado] = "Finalizado") +
                (Hechos[Estado] = "Pendiente PES") + (Hechos[Estado] = "PES completado")))); 5); 1));
        "No iniciada"))
    """
    # Exclude importe-only states from the ultimo_id lookup
    excluded_states = ('Cierre económico iniciativa', 'Facturación cierre año', 'Importe Planificado', 'Importe Estimado')

    ult_id = ultimo_id(caches, portfolio_id, excluded_states=excluded_states)
    if not ult_id:
        return "No iniciada"

    # Only return execution-related estados
    hechos_list = caches['hechos'].get(portfolio_id, [])
    for h in hechos_list:
        if h.get('id_hecho') == ult_id:
            estado = h.get('estado') or ""
            estado_lower = estado.lower()
            if (estado_lower == 'en ejecución' or estado_lower == 'finalizado'
                    or estado_lower == 'pendiente pes' or estado_lower.startswith('pes completado')):
                return estado
            return "No iniciada"
    return "No iniciada"


def estado_agrupado(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Get estado agrupado from estado_especial table.

    If the initiative has a special status, return it. Otherwise derive from estado_de_la_iniciativa.
    """
    # First check estado_especial table
    row = caches['estado_especial'].get(portfolio_id)
    if row and row.get('estado_especial'):
        return row['estado_especial']

    # If no special status, derive from current estado
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return None

    # Map estados to grouped categories
    estado_lower = estado.lower()
    if 'aprobada' in estado_lower:
        return 'Aprobada'
    elif 'ejecuci' in estado_lower:
        return 'En ejecución'
    elif 'finalizado' in estado_lower:
        return 'Finalizado'
    elif 'pes' in estado_lower:
        return 'PES'
    elif 'sm' in estado_lower:
        return 'SM200'
    elif 'cancelad' in estado_lower or 'rechazad' in estado_lower:
        return 'Cancelada'
    return estado


def estado_dashboard(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Calculate estado dashboard from estado_de_la_iniciativa.

    Maps detailed estados to dashboard-level categories.
    """
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return None

    # Map estados to dashboard categories
    estado_lower = estado.lower()
    if 'aprobada' in estado_lower:
        return 'Aprobada'
    elif 'ejecuci' in estado_lower:
        return 'En ejecución'
    elif 'finalizado' in estado_lower:
        return 'Finalizado'
    elif 'pes completado' in estado_lower:
        return 'PES completado'
    elif 'pendiente pes' in estado_lower:
        return 'Pendiente PES'
    elif 'sm200' in estado_lower or 'sm 200' in estado_lower:
        return 'SM200'
    elif 'cancelad' in estado_lower:
        return 'Cancelada'
    elif 'rechazad' in estado_lower:
        return 'Rechazada'
    return estado


def estado_requisito_legal(caches: dict, portfolio_id: str) -> Optional[str]:
    """
    Get estado requisito legal from justificaciones table.

    Looks for justification of type 'Requisito legal' or similar.
    """
    # Look for regulatory justification
    justificaciones_list = caches['justificaciones'].get(portfolio_id, [])
    for j in justificaciones_list:
        tipo = j.get('tipo_justificacion') or ''
        if 'legal' in tipo.lower() or 'regulat' in tipo.lower() or tipo == 'Requisito legal':
            val = j.get('valor')
            if val:
                return val

    # Also check etiquetas table
    etiquetas_list = caches['etiquetas'].get(portfolio_id, [])
    for e in etiquetas_list:
        etiqueta = e.get('etiqueta') or ''
        if 'legal' in etiqueta.lower() or 'regulat' in etiqueta.lower():
            val = e.get('valor')
            if val:
                return val

    return None


def estado_sm100(caches: dict, portfolio_id: str) -> str:
    """
    Determine SM100 availability status based on estado_de_la_iniciativa.

    Returns:
        'SM100 Disponible' if past SM100 stage
        'SM100 Pendiente' if at or before SM100 stage
        'Cancelada' if cancelled
        'Error' if estado is Importe Estimado/Planificado
        '' if no estado
    """
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return ""
    if estado == "Cancelado":
        return "Cancelada"
    if estado in ("Importe Estimado", "Importe Planificado"):
        return "Error"
    if estado in ("Recepción", "SM100 Redacción"):
        return "SM100 Pendiente"
    return "SM100 Disponible"


def estado_sm200(caches: dict, portfolio_id: str) -> str:
    """
    Determine SM200 availability status based on estado_de_la_iniciativa.

    Returns:
        'SM200 Disponible' if past SM200 stage
        'SM200 Pendiente' if at or before SM200 stage
        'Cancelada' if cancelled
        'Error' if estado is Importe Estimado/Planificado
        '' if no estado
    """
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return ""
    if estado == "Cancelado":
        return "Cancelada"
    if estado in ("Importe Estimado", "Importe Planificado"):
        return "Error"
    if estado in ("Recepción", "SM100 Redacción", "SM100 Final", "SM200 En Revisión"):
        return "SM200 Pendiente"
    return "SM200 Disponible"


def iniciativa_aprobada_fn(caches: dict, portfolio_id: str) -> str:
    """
    Determine if initiative is approved based on estado_de_la_iniciativa.

    Returns:
        'Aprobada' if in an approved or post-approval state
        'No aprobada' if not yet approved
        'Cancelada' if cancelled
        'Error' if estado is Importe Estimado/Planificado
        '' if no estado
    """
    estado = estado_iniciativa(caches, portfolio_id)
    if not estado:
        return ""
    if estado == "Cancelado":
        return "Cancelada"
    if estado in ("Importe Estimado", "Importe Planificado"):
        return "Error"
    if estado in ("Aprobada", "Aprobada con CCT", "En ejecución", "Finalizado",
                  "Pendiente PES", "Facturación cierre año", "Cierre económico iniciativa"):
        return "Aprobada"
    return "No aprobada"
