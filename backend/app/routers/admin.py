"""Admin endpoints for database export."""

import logging
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.auth import verify_auth
from app.database import get_db
from app.models import EstadoTarea, EstadoAccion, Responsable, Tarea, AccionRealizada
from app.crud import model_to_dict

LOG = logging.getLogger("task_manager_backend")

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(verify_auth)])

# Tables in dependency order: reference tables first, then main, then dependent
EXPORT_TABLES = [
    ("estados_tareas", EstadoTarea),
    ("estados_acciones", EstadoAccion),
    ("responsables", Responsable),
    ("tareas", Tarea),
    ("acciones_realizadas", AccionRealizada),
]


def _serialize_row(row_dict: dict) -> dict:
    """Convert date/datetime values to ISO 8601 strings for JSON serialization."""
    result = {}
    for key, value in row_dict.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, date):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


@router.get("/export")
def export_database(db: Session = Depends(get_db)):
    """Export all database tables as a JSON file."""
    LOG.info("Database export initiated")

    data = {}
    record_counts = {}

    for table_name, model in EXPORT_TABLES:
        rows = db.query(model).all()
        data[table_name] = [_serialize_row(model_to_dict(row)) for row in rows]
        record_counts[table_name] = len(data[table_name])

    export_payload = {
        "export_metadata": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "version": "1.0",
            "tables": [name for name, _ in EXPORT_TABLES],
            "record_counts": record_counts,
        },
        "data": data,
    }

    total = sum(record_counts.values())
    LOG.info(f"Database export completed: {record_counts} (total: {total})")

    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    filename = f"task_manager_export_{timestamp}.json"

    return JSONResponse(
        content=export_payload,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
