"""
Lookup functions for calculated fields.

These functions retrieve field values from related tables by portfolio_id.
When a LookupCache is provided, results are cached to avoid N+1 queries.
"""
import logging
from sqlalchemy.orm import Session
from typing import Any, Optional

from ..models import DatosDescriptivo, DatosRelevante, InformacionEconomica

logger = logging.getLogger(__name__)


def lookup_datos_descriptivos(
    db: Session,
    portfolio_id: str,
    field: str,
    cache=None
) -> Optional[Any]:
    """Lookup a field from datos_descriptivos by portfolio_id."""
    if cache:
        obj = cache.get_datos_descriptivos(portfolio_id)
    else:
        obj = db.query(DatosDescriptivo).filter(
            DatosDescriptivo.portfolio_id == portfolio_id
        ).first()
    if obj:
        return getattr(obj, field, None)
    return None


def lookup_datos_relevantes(
    db: Session,
    portfolio_id: str,
    field: str,
    cache=None
) -> Optional[Any]:
    """Lookup a field from datos_relevantes by portfolio_id."""
    if cache:
        obj = cache.get_datos_relevantes(portfolio_id)
    else:
        obj = db.query(DatosRelevante).filter(
            DatosRelevante.portfolio_id == portfolio_id
        ).first()
    if obj:
        return getattr(obj, field, None)
    return None


def lookup_informacion_economica(
    db: Session,
    portfolio_id: str,
    field: str,
    cache=None
) -> Optional[Any]:
    """Lookup a field from informacion_economica by portfolio_id."""
    if cache:
        obj = cache.get_informacion_economica(portfolio_id)
    else:
        obj = db.query(InformacionEconomica).filter(
            InformacionEconomica.portfolio_id == portfolio_id
        ).first()
    if obj:
        return getattr(obj, field, None)
    return None


def lookup_grupo_componente(
    db: Session,
    portfolio_id_componente: str,
    field: str,
    cache=None
) -> Optional[Any]:
    """Lookup a field from datos_relevantes for a grupo component."""
    if not portfolio_id_componente:
        return None
    return lookup_datos_relevantes(db, portfolio_id_componente, field, cache=cache)


# Mapping of source tables to their lookup functions
LOOKUP_FUNCTIONS = {
    "datos_descriptivos": lookup_datos_descriptivos,
    "datos_relevantes": lookup_datos_relevantes,
    "informacion_economica": lookup_informacion_economica,
}


def lookup_field(
    db: Session,
    portfolio_id: str,
    source_table: str,
    source_field: str,
    cache=None
) -> Optional[Any]:
    """Generic lookup function that routes to the appropriate table-specific lookup."""
    lookup_func = LOOKUP_FUNCTIONS.get(source_table)
    if lookup_func:
        return lookup_func(db, portfolio_id, source_field, cache=cache)
    logger.warning(f"No lookup function for table: {source_table}")
    return None
