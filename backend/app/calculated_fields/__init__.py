"""
Calculated fields package.

This package handles fields that are computed on-the-fly rather than
stored in the database. It provides:

- Field definitions: which fields are calculated for each table
- Lookup functions: retrieve values from related tables
- Calculation functions: compute derived values
- Service class: main entry point for calculated field operations

Usage:
    from app.calculated_fields import CalculatedFieldService

    service = CalculatedFieldService(db)

    # Strip calculated fields before saving
    clean_data = service.strip_calculated_fields("hechos", input_data)

    # Populate calculated fields when reading
    full_record = service.populate_calculated_fields("hechos", db_record)
"""
from .definitions import (
    CALCULATED_FIELDS,
    READONLY_TABLES,
    FIELD_CALCULATORS,
    get_calculated_fields,
    is_readonly_table,
    is_calculated_field,
    get_calculator,
)
from .service import CalculatedFieldService
from .cache import LookupCache

__all__ = [
    # Definitions
    "CALCULATED_FIELDS",
    "READONLY_TABLES",
    "FIELD_CALCULATORS",
    "get_calculated_fields",
    "is_readonly_table",
    "is_calculated_field",
    "get_calculator",
    # Service
    "CalculatedFieldService",
    # Cache
    "LookupCache",
]
