"""
Lookup cache for calculated fields.

Caches source records per portfolio_id within a request scope,
eliminating N+1 queries when processing multiple records.
"""
import logging
from sqlalchemy.orm import Session
from typing import Any, Optional

from ..models import DatosDescriptivo, DatosRelevante, InformacionEconomica

logger = logging.getLogger(__name__)

_SENTINEL = object()  # Distinguishes "not cached" from "cached as None"


class LookupCache:
    """Per-request cache for calculated field source data."""

    def __init__(self, db: Session):
        self.db = db
        self._datos_descriptivos: dict[str, Any] = {}
        self._datos_relevantes: dict[str, Any] = {}
        self._informacion_economica: dict[str, Any] = {}

    def get_datos_descriptivos(self, portfolio_id: str) -> Optional[Any]:
        """Get datos_descriptivos record, cached per portfolio_id."""
        cached = self._datos_descriptivos.get(portfolio_id, _SENTINEL)
        if cached is not _SENTINEL:
            return cached
        obj = self.db.query(DatosDescriptivo).filter(
            DatosDescriptivo.portfolio_id == portfolio_id
        ).first()
        self._datos_descriptivos[portfolio_id] = obj
        return obj

    def get_datos_relevantes(self, portfolio_id: str) -> Optional[Any]:
        """Get datos_relevantes record, cached per portfolio_id."""
        cached = self._datos_relevantes.get(portfolio_id, _SENTINEL)
        if cached is not _SENTINEL:
            return cached
        obj = self.db.query(DatosRelevante).filter(
            DatosRelevante.portfolio_id == portfolio_id
        ).first()
        self._datos_relevantes[portfolio_id] = obj
        return obj

    def get_informacion_economica(self, portfolio_id: str) -> Optional[Any]:
        """Get informacion_economica record, cached per portfolio_id."""
        cached = self._informacion_economica.get(portfolio_id, _SENTINEL)
        if cached is not _SENTINEL:
            return cached
        obj = self.db.query(InformacionEconomica).filter(
            InformacionEconomica.portfolio_id == portfolio_id
        ).first()
        self._informacion_economica[portfolio_id] = obj
        return obj
