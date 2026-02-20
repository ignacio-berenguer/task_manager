"""
Router for transacciones table - Read-only (audit trail) + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Transaccion
from ..schemas import PaginatedResponse, TransaccionesReportRequest
from ..crud import CRUDBase, model_to_dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transacciones", tags=["Transacciones"])
crud = CRUDBase(Transaccion)


@router.get("/", response_model=PaginatedResponse)
def list_transacciones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all transacciones with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-transacciones-filter-options")
def get_report_transacciones_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Transacciones report."""
    estado_cambio_values = (
        db.query(Transaccion.estado_cambio)
        .distinct()
        .filter(
            Transaccion.estado_cambio.isnot(None),
            Transaccion.estado_cambio != ""
        )
        .order_by(Transaccion.estado_cambio)
        .all()
    )

    result = {
        "estado_cambio": [v[0] for v in estado_cambio_values],
    }

    logger.info(f"Report Transacciones filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-transacciones", response_model=PaginatedResponse)
def search_report_transacciones(request: TransaccionesReportRequest, db: Session = Depends(get_db)):
    """
    Search transacciones for the Transacciones report.

    Queries transacciones table with optional filters.
    """
    query = db.query(Transaccion)

    if request.clave1:
        query = query.filter(Transaccion.clave1 == request.clave1)
    if request.estado_cambio:
        query = query.filter(Transaccion.estado_cambio.in_(request.estado_cambio))
    if request.fecha_registro_cambio_inicio:
        query = query.filter(
            Transaccion.fecha_registro_cambio >= request.fecha_registro_cambio_inicio
        )
    if request.fecha_registro_cambio_fin:
        query = query.filter(
            Transaccion.fecha_registro_cambio <= request.fecha_registro_cambio_fin
        )
    if request.fecha_ejecucion_cambio_inicio:
        query = query.filter(
            Transaccion.fecha_ejecucion_cambio >= request.fecha_ejecucion_cambio_inicio
        )
    if request.fecha_ejecucion_cambio_fin:
        query = query.filter(
            Transaccion.fecha_ejecucion_cambio <= request.fecha_ejecucion_cambio_fin
        )
    if request.id_filter is not None:
        query = query.filter(Transaccion.id == request.id_filter)

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Transaccion, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = [model_to_dict(item) for item in rows]

    logger.info(f"Report Transacciones search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_transaccion(id: int, db: Session = Depends(get_db)):
    """Get a transaccion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Transaccion not found")
    return model_to_dict(obj)


@router.get("/clave/{clave1}")
def get_transacciones_by_clave(clave1: str, db: Session = Depends(get_db)):
    """Get all transacciones for a clave1 (usually portfolio_id)."""
    objs = db.query(Transaccion).filter(Transaccion.clave1 == clave1).all()
    return [model_to_dict(obj) for obj in objs]
