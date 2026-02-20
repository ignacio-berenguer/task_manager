"""
Router for transacciones_json table - JSON transaction diffs.
"""
import json
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db, SessionLocal
from ..models import TransaccionJson
from ..schemas import (
    PaginatedResponse,
    TransaccionJsonCreate,
    TransaccionesJsonReportRequest,
)
from ..crud import CRUDBase, model_to_dict
from ..services.transaction_processor import process_pending_transactions
from ..services.excel_writer import (
    get_processing_state,
    process_pending_excel_transactions,
)
from ..services.excel_pk_resolver import resolve_excel_primary_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transacciones-json", tags=["Transacciones JSON"])
crud = CRUDBase(TransaccionJson)


@router.get("/", response_model=PaginatedResponse)
def list_transacciones_json(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all JSON transaction diffs with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


@router.get("/report-filter-options")
def get_report_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Transacciones JSON report."""
    entidad_values = (
        db.query(TransaccionJson.entidad)
        .distinct()
        .filter(TransaccionJson.entidad.isnot(None), TransaccionJson.entidad != "")
        .order_by(TransaccionJson.entidad)
        .all()
    )
    tipo_operacion_values = (
        db.query(TransaccionJson.tipo_operacion)
        .distinct()
        .filter(TransaccionJson.tipo_operacion.isnot(None))
        .order_by(TransaccionJson.tipo_operacion)
        .all()
    )
    estado_db_values = (
        db.query(TransaccionJson.estado_db)
        .distinct()
        .filter(TransaccionJson.estado_db.isnot(None))
        .order_by(TransaccionJson.estado_db)
        .all()
    )
    estado_excel_values = (
        db.query(TransaccionJson.estado_excel)
        .distinct()
        .filter(TransaccionJson.estado_excel.isnot(None))
        .order_by(TransaccionJson.estado_excel)
        .all()
    )
    usuario_values = (
        db.query(TransaccionJson.usuario)
        .distinct()
        .filter(TransaccionJson.usuario.isnot(None), TransaccionJson.usuario != "")
        .order_by(TransaccionJson.usuario)
        .all()
    )

    result = {
        "entidad": [v[0] for v in entidad_values],
        "tipo_operacion": [v[0] for v in tipo_operacion_values],
        "estado_db": [v[0] for v in estado_db_values],
        "estado_excel": [v[0] for v in estado_excel_values],
        "usuario": [v[0] for v in usuario_values],
    }

    logger.info(
        f"Report Transacciones JSON filter options: "
        f"{', '.join(f'{k}={len(v)}' for k, v in result.items())}"
    )
    return result


@router.post("/search-report", response_model=PaginatedResponse)
def search_report(
    request: TransaccionesJsonReportRequest,
    db: Session = Depends(get_db),
):
    """Search JSON transaction diffs with filters, ordering, and pagination."""
    query = db.query(TransaccionJson)

    if request.entidad:
        query = query.filter(TransaccionJson.entidad.in_(request.entidad))
    if request.tipo_operacion:
        query = query.filter(TransaccionJson.tipo_operacion.in_(request.tipo_operacion))
    if request.estado_db:
        query = query.filter(TransaccionJson.estado_db.in_(request.estado_db))
    if request.estado_excel:
        query = query.filter(TransaccionJson.estado_excel.in_(request.estado_excel))
    if request.usuario:
        query = query.filter(TransaccionJson.usuario == request.usuario)
    if request.fecha_creacion_inicio:
        query = query.filter(
            TransaccionJson.fecha_creacion >= request.fecha_creacion_inicio
        )
    if request.fecha_creacion_fin:
        query = query.filter(
            TransaccionJson.fecha_creacion <= request.fecha_creacion_fin
        )

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(TransaccionJson, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()
    data = [model_to_dict(item) for item in rows]

    logger.info(
        f"Report Transacciones JSON search: {total} total, returning {len(data)} records"
    )

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


@router.post("/process")
def process_transactions(db: Session = Depends(get_db)):
    """Process all pending JSON transaction diffs."""
    results = process_pending_transactions(db)
    return results


@router.post("/process-excel")
def process_excel(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger async Excel write-back for pending transactions."""
    count = (
        db.query(TransaccionJson)
        .filter(
            TransaccionJson.estado_db == "EJECUTADO",
            TransaccionJson.estado_excel == "PENDIENTE",
        )
        .count()
    )

    if count == 0:
        return {"status": "no_pending", "count": 0}

    background_tasks.add_task(
        process_pending_excel_transactions,
        SessionLocal,
        settings.EXCEL_SOURCE_DIR,
    )
    return {"status": "processing", "count": count}


@router.get("/process-excel-status")
def get_process_excel_status():
    """Get current Excel processing status."""
    return get_processing_state()


@router.get("/by-portfolio/{portfolio_id}")
def get_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all transacciones_json for a portfolio_id."""
    results = (
        db.query(TransaccionJson)
        .filter(TransaccionJson.portfolio_id == portfolio_id)
        .order_by(TransaccionJson.fecha_creacion.desc())
        .all()
    )
    return [model_to_dict(r) for r in results]


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_transaccion_json(id: int, db: Session = Depends(get_db)):
    """Get a JSON transaction diff by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="TransaccionJson not found")
    return model_to_dict(obj)


@router.post("/")
def create_transaccion_json(
    data: TransaccionJsonCreate,
    db: Session = Depends(get_db),
):
    """Create a new JSON transaction diff."""
    obj_data = data.model_dump()

    # Auto-resolve Excel PK at creation time
    excel_pk = resolve_excel_primary_key(
        db, data.entidad, data.tipo_operacion, data.clave_primaria, data.cambios
    )
    if excel_pk is not None:
        obj_data["clave_primaria_excel"] = json.dumps(excel_pk)

    obj = crud.create(db, obj_data)
    return model_to_dict(obj)


@router.delete("/{id}")
def delete_transaccion_json(id: int, db: Session = Depends(get_db)):
    """Delete a JSON transaction diff by ID."""
    success = crud.delete(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="TransaccionJson not found")
    return {"detail": "Deleted successfully"}
