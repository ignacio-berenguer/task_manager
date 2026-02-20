"""
Service for calculating fields.

This is the main entry point for calculated field operations.
"""
import logging
from sqlalchemy.orm import Session
from typing import Any, Optional

from .definitions import (
    FIELD_CALCULATORS,
    get_calculated_fields,
    is_readonly_table,
)
from .lookup import lookup_field, lookup_grupo_componente
from .estado import (
    calc_justificacion_regulatoria,
    calc_falta_justificacion_regulatoria,
)
from .utils import (
    calc_debe_tener,
    calc_falta_evaluacion_impacto,
    calc_sum_grupo_importes,
)

logger = logging.getLogger(__name__)


class CalculatedFieldService:
    """
    Service for handling calculated fields.

    Provides methods to:
    - Calculate individual field values
    - Populate all calculated fields for a record
    - Strip calculated fields from input data (for create/update)
    """

    def __init__(self, db: Session, cache=None):
        """
        Initialize the service.

        Args:
            db: Database session
            cache: Optional LookupCache for batch processing
        """
        self.db = db
        self.cache = cache

    def calculate_field(
        self,
        field_name: str,
        portfolio_id: str,
        record: dict = None
    ) -> Optional[Any]:
        """Calculate a single field value."""
        calculator = FIELD_CALCULATORS.get(field_name)
        if not calculator:
            return None

        calc_type = calculator[0]

        try:
            if calc_type == "lookup":
                source_table = calculator[1]
                source_field = calculator[2]
                return lookup_field(self.db, portfolio_id, source_table, source_field, cache=self.cache)

            elif calc_type == "lookup_grupo":
                source_field = calculator[2]
                pid_componente = record.get("portfolio_id_componente") if record else None
                if pid_componente:
                    return lookup_grupo_componente(self.db, pid_componente, source_field, cache=self.cache)
                return None

            elif calc_type == "function":
                func_name = calculator[1]
                kwargs = calculator[2] if len(calculator) > 2 else {}
                return self._call_function(func_name, portfolio_id, kwargs, record)

        except Exception as e:
            logger.error(f"Error calculating {field_name} for {portfolio_id}: {e}")
            return None

        return None

    def _call_function(
        self,
        func_name: str,
        portfolio_id: str,
        kwargs: dict,
        record: dict = None
    ) -> Optional[Any]:
        """Call a calculation function by name."""
        if func_name == "calc_justificacion_regulatoria":
            return calc_justificacion_regulatoria(self.db, portfolio_id)

        elif func_name == "calc_falta_justificacion_regulatoria":
            return calc_falta_justificacion_regulatoria(self.db, portfolio_id)

        elif func_name == "calc_debe_tener":
            field = kwargs.get("field", "")
            return calc_debe_tener(self.db, portfolio_id, field, cache=self.cache)

        elif func_name == "calc_falta_evaluacion_impacto":
            return calc_falta_evaluacion_impacto(self.db, portfolio_id, cache=self.cache)

        elif func_name == "calc_sum_grupo_importes":
            pid_grupo = record.get("portfolio_id_grupo") if record else portfolio_id
            return calc_sum_grupo_importes(self.db, pid_grupo, cache=self.cache)

        else:
            logger.warning(f"Unknown calculation function: {func_name}")
            return None

    def populate_calculated_fields(
        self,
        table_name: str,
        record: dict
    ) -> dict:
        """Populate all calculated fields for a record."""
        portfolio_id = record.get("portfolio_id")

        if not portfolio_id and table_name == "grupos_iniciativas":
            portfolio_id = record.get("portfolio_id_grupo")

        if not portfolio_id:
            return record

        result = dict(record)

        for field in get_calculated_fields(table_name):
            try:
                value = self.calculate_field(field, portfolio_id, record)
                result[field] = value
            except Exception as e:
                logger.warning(f"Error calculating {field} for {portfolio_id}: {e}")
                result[field] = None

        return result

    def strip_calculated_fields(self, table_name: str, data: dict) -> dict:
        """Remove calculated fields from input data."""
        calc_fields = set(get_calculated_fields(table_name))
        result = {}

        for key, value in data.items():
            if key in calc_fields:
                logger.debug(f"Stripping calculated field '{key}' from {table_name} input")
            else:
                result[key] = value

        return result

    def is_table_readonly(self, table_name: str) -> bool:
        """Check if a table is completely calculated (read-only)."""
        return is_readonly_table(table_name)
