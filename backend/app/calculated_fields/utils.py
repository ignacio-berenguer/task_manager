"""
Utility functions for calculated fields.
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..models import GrupoIniciativa
from .lookup import lookup_datos_relevantes

logger = logging.getLogger(__name__)


def calc_debe_tener(db: Session, portfolio_id: str, field: str, cache=None) -> int:
    """
    Check if a field should be required based on business rules.
    Business rule: if importe_2025 > 0, the field is required.
    """
    importe = lookup_datos_relevantes(db, portfolio_id, "importe_2025", cache=cache)
    if importe and float(importe) > 0:
        return 1
    return 0


def calc_falta_evaluacion_impacto(db: Session, portfolio_id: str, cache=None) -> Optional[str]:
    """
    Check if impact evaluation is missing.
    """
    estado = lookup_datos_relevantes(db, portfolio_id, "estado_de_la_iniciativa", cache=cache)
    if not estado:
        return None

    estados_requieren_evaluacion = [
        "En ejecución",
        "Aprobada",
        "Aprobada con CCT",
    ]

    estado_lower = estado.lower() if estado else ""
    requiere = any(e.lower() in estado_lower for e in estados_requieren_evaluacion)

    if not requiere:
        return None

    return None


def calc_sum_grupo_importes(db: Session, portfolio_id_grupo: str, cache=None) -> float:
    """
    Sum importe_2025 of all components in a group.
    """
    if not portfolio_id_grupo:
        return 0.0

    components = db.query(GrupoIniciativa.portfolio_id_componente).filter(
        GrupoIniciativa.portfolio_id_grupo == portfolio_id_grupo
    ).all()

    total = 0.0
    for (pid_componente,) in components:
        if pid_componente:
            importe = lookup_datos_relevantes(db, pid_componente, "importe_2025", cache=cache)
            if importe:
                try:
                    total += float(importe)
                except (ValueError, TypeError):
                    logger.warning(
                        f"Invalid importe_2025 value for {pid_componente}: {importe}"
                    )

    return total
