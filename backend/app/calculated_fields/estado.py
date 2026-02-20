"""
Justificacion calculation functions.

Note: estado_de_la_iniciativa and fecha_de_ultimo_estado are now
looked up from datos_relevantes, not calculated here.
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from ..models import Justificacion

logger = logging.getLogger(__name__)


def calc_justificacion_regulatoria(db: Session, portfolio_id: str) -> Optional[str]:
    """
    Get regulatory justification from justificaciones table.

    Looks for justifications with tipo_justificacion containing 'legal' or 'regulat'.

    Args:
        db: Database session
        portfolio_id: Initiative ID

    Returns:
        Justification value or None if not found
    """
    result = db.query(Justificacion.valor).filter(
        Justificacion.portfolio_id == portfolio_id,
        or_(
            Justificacion.tipo_justificacion.ilike('%legal%'),
            Justificacion.tipo_justificacion.ilike('%regulat%')
        )
    ).first()

    return result[0] if result else None


def calc_falta_justificacion_regulatoria(db: Session, portfolio_id: str) -> int:
    """
    Check if regulatory justification is missing.

    Args:
        db: Database session
        portfolio_id: Initiative ID

    Returns:
        1 if justificacion_regulatoria is missing, 0 otherwise
    """
    justificacion = calc_justificacion_regulatoria(db, portfolio_id)
    return 0 if justificacion else 1
