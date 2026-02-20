"""
Processor service for applying pending JSON transaction diffs to the database.
"""
import json
import logging
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import inspect, func

from ..models import TransaccionJson, Hecho
from ..table_registry import TABLE_MODELS
from ..crud import CRUDBase

logger = logging.getLogger(__name__)


def _find_record(db: Session, model, pk_data: dict):
    """Find a record by primary key fields from the JSON pk dict."""
    query = db.query(model)
    for field, value in pk_data.items():
        column = getattr(model, field, None)
        if column is None:
            raise ValueError(f"Column '{field}' not found in model {model.__tablename__}")
        query = query.filter(column == value)
    return query.first()


def _apply_transaction(db: Session, txn: TransaccionJson) -> None:
    """Apply a single transaction diff to the database."""
    entidad = txn.entidad
    model = TABLE_MODELS.get(entidad)
    if model is None:
        raise ValueError(f"Unknown entity: {entidad}")

    pk_data = json.loads(txn.clave_primaria)
    cambios = json.loads(txn.cambios) if txn.cambios else {}

    crud = CRUDBase(model)

    if txn.tipo_operacion == "INSERT":
        # Merge pk fields + cambios for insert
        insert_data = {**pk_data, **cambios}
        # Auto-generate id_hecho for hechos if not provided
        if entidad == "hechos" and "id_hecho" not in insert_data:
            max_id = db.query(func.max(Hecho.id_hecho)).scalar()
            insert_data["id_hecho"] = (max_id or 0) + 1
            logger.info(f"Auto-generated id_hecho={insert_data['id_hecho']} for hechos INSERT")
        # Auto-set fecha_actualizacion if the model has the column
        if hasattr(model, "fecha_actualizacion"):
            insert_data["fecha_actualizacion"] = datetime.now()
        crud.create(db, insert_data)
        logger.info(f"INSERT into {entidad}: {pk_data}")

    elif txn.tipo_operacion == "UPDATE":
        record = _find_record(db, model, pk_data)
        if record is None:
            raise ValueError(f"Record not found in {entidad} for pk: {pk_data}")
        # Auto-set fecha_actualizacion if the model has the column
        if hasattr(model, "fecha_actualizacion"):
            cambios["fecha_actualizacion"] = datetime.now()
        crud.update(db, record, cambios)
        logger.info(f"UPDATE {entidad}: {pk_data}, fields: {list(cambios.keys())}")

    elif txn.tipo_operacion == "DELETE":
        record = _find_record(db, model, pk_data)
        if record is None:
            raise ValueError(f"Record not found in {entidad} for pk: {pk_data}")
        # Get the primary key value for deletion
        mapper = inspect(model)
        pk_col_name = mapper.primary_key[0].name
        pk_value = getattr(record, pk_col_name)
        crud.delete(db, pk_value)
        logger.info(f"DELETE from {entidad}: {pk_data}")

    else:
        raise ValueError(f"Unknown tipo_operacion: {txn.tipo_operacion}")


def process_pending_transactions(db: Session) -> dict:
    """
    Process all pending JSON transaction diffs.

    Each transaction is committed independently so partial failure is OK.

    Returns:
        Dict with processing results: {processed, success, errors, details}
    """
    pending = (
        db.query(TransaccionJson)
        .filter(TransaccionJson.estado_db == "PENDIENTE")
        .order_by(TransaccionJson.id)
        .all()
    )

    results = {
        "processed": 0,
        "success": 0,
        "errors": 0,
        "details": [],
    }

    if not pending:
        logger.info("No pending transactions to process")
        return results

    logger.info(f"Processing {len(pending)} pending transactions")

    for txn in pending:
        results["processed"] += 1
        try:
            _apply_transaction(db, txn)
            txn.estado_db = "EJECUTADO"
            txn.fecha_ejecucion_db = datetime.now()
            txn.error_detalle = None
            db.commit()
            results["success"] += 1
            results["details"].append({
                "id": txn.id,
                "status": "EJECUTADO",
                "entidad": txn.entidad,
                "tipo_operacion": txn.tipo_operacion,
            })
        except Exception as e:
            db.rollback()
            # Re-fetch the txn after rollback since the session state may be stale
            txn = db.query(TransaccionJson).get(txn.id)
            txn.estado_db = "ERROR"
            txn.fecha_ejecucion_db = datetime.now()
            txn.error_detalle = str(e)
            db.commit()
            results["errors"] += 1
            results["details"].append({
                "id": txn.id,
                "status": "ERROR",
                "entidad": txn.entidad,
                "tipo_operacion": txn.tipo_operacion,
                "error": str(e),
            })
            logger.error(f"Error processing transaction {txn.id}: {e}")

    logger.info(
        f"Transaction processing complete: "
        f"{results['processed']} processed, "
        f"{results['success']} success, "
        f"{results['errors']} errors"
    )

    return results
