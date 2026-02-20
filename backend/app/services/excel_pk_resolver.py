"""
Excel Primary Key Resolver.

Resolves Excel-specific primary key values for a transaction at creation time.
The resolved keys are stored in `clave_primaria_excel` and used by the Excel
writer to locate the correct row in the workbook.
"""

import json
import logging

from sqlalchemy.orm import Session

from app.services.excel_mapping import EXCEL_MAPPING
from app.table_registry import TABLE_MODELS

logger = logging.getLogger("portfolio_backend")


def resolve_excel_primary_key(
    db: Session,
    entidad: str,
    tipo_operacion: str,
    clave_primaria_json: str,
    cambios_json: str | None,
) -> dict | None:
    """Resolve Excel primary key values for a transaction.

    Args:
        db: Database session
        entidad: Target table name (e.g. 'hechos')
        tipo_operacion: INSERT, UPDATE, or DELETE
        clave_primaria_json: JSON string with DB primary key
        cambios_json: JSON string with changed fields (for INSERT)

    Returns:
        Dict with Excel pk_field -> value mapping, or None if entity
        is not configured in EXCEL_MAPPING.
    """
    mapping = EXCEL_MAPPING.get(entidad)
    if not mapping:
        logger.debug("Entity '%s' not in EXCEL_MAPPING, skipping Excel PK resolution", entidad)
        return None

    pk_fields = mapping["pk_fields"]

    try:
        if tipo_operacion == "INSERT":
            return _resolve_insert(pk_fields, cambios_json, clave_primaria_json)
        elif tipo_operacion in ("UPDATE", "DELETE"):
            return _resolve_update_delete(db, entidad, pk_fields, clave_primaria_json)
        else:
            logger.warning("Unknown tipo_operacion '%s' for Excel PK resolution", tipo_operacion)
            return None
    except Exception as e:
        logger.warning("Failed to resolve Excel PK for %s (tipo=%s): %s", entidad, tipo_operacion, e)
        return None


def _resolve_insert(
    pk_fields: list[str],
    cambios_json: str | None,
    clave_primaria_json: str,
) -> dict:
    """For INSERT: extract pk_fields values from cambios (contains all new fields)."""
    cambios = json.loads(cambios_json) if cambios_json else {}
    clave_primaria = json.loads(clave_primaria_json) if clave_primaria_json else {}

    # Merge: cambios has all fields, but portfolio_id may only be in clave_primaria
    merged = {**clave_primaria, **cambios}

    result = {}
    for field in pk_fields:
        result[field] = merged.get(field)

    logger.info("Resolved Excel PK for INSERT %s: %s", "entity", result)
    return result


def _resolve_update_delete(
    db: Session,
    entidad: str,
    pk_fields: list[str],
    clave_primaria_json: str,
) -> dict | None:
    """For UPDATE/DELETE: look up DB record and extract pk_fields values."""
    model = TABLE_MODELS.get(entidad)
    if not model:
        logger.warning("No model found for entity '%s'", entidad)
        return None

    clave_primaria = json.loads(clave_primaria_json) if clave_primaria_json else {}

    # Find the DB record using the DB primary key
    query = db.query(model)
    for pk_field, pk_value in clave_primaria.items():
        col_attr = getattr(model, pk_field, None)
        if col_attr is not None:
            query = query.filter(col_attr == pk_value)

    record = query.first()
    if not record:
        logger.warning(
            "DB record not found for %s with pk %s — cannot resolve Excel PK",
            entidad, clave_primaria,
        )
        return None

    # Extract Excel pk_fields values from the current record state
    result = {}
    for field in pk_fields:
        value = getattr(record, field, None)
        result[field] = value

    logger.info("Resolved Excel PK for %s %s: %s", "UPDATE/DELETE", entidad, result)
    return result
