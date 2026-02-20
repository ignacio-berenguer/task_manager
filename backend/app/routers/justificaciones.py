"""
Router for justificaciones table - Full CRUD + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Justificacion, DatosDescriptivo
from ..schemas import PaginatedResponse, JustificacionesReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/justificaciones", tags=["Justificaciones"])
crud = CRUDBase(Justificacion)


@router.get("/", response_model=PaginatedResponse)
def list_justificaciones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all justificaciones with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-justificaciones-filter-options")
def get_report_justificaciones_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Justificaciones report."""
    tipo_values = (
        db.query(Justificacion.tipo_justificacion)
        .distinct()
        .filter(
            Justificacion.tipo_justificacion.isnot(None),
            Justificacion.tipo_justificacion != ""
        )
        .order_by(Justificacion.tipo_justificacion)
        .all()
    )

    result = {
        "tipo_justificacion": [v[0] for v in tipo_values],
    }

    logger.info(f"Report Justificaciones filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-justificaciones", response_model=PaginatedResponse)
def search_report_justificaciones(request: JustificacionesReportRequest, db: Session = Depends(get_db)):
    """
    Search justificaciones for the Justificaciones report.

    Joins justificaciones with datos_descriptivos to include nombre.
    """
    query = (
        db.query(Justificacion, DatosDescriptivo)
        .outerjoin(DatosDescriptivo, Justificacion.portfolio_id == DatosDescriptivo.portfolio_id)
    )

    if request.portfolio_id:
        query = query.filter(Justificacion.portfolio_id == request.portfolio_id)
    if request.tipo_justificacion:
        query = query.filter(Justificacion.tipo_justificacion.in_(request.tipo_justificacion))

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Justificacion, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for just_obj, datos_desc in rows:
        row_dict = model_to_dict_with_calculated(db, just_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        data.append(row_dict)

    logger.info(f"Report Justificaciones search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_justificacion(id: int, db: Session = Depends(get_db)):
    """Get a justificacion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Justificacion not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_justificaciones_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all justificaciones for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_justificacion(data: dict, db: Session = Depends(get_db)):
    """Create a new justificacion."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_justificacion(id: int, data: dict, db: Session = Depends(get_db)):
    """Update a justificacion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Justificacion not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_justificacion(id: int, db: Session = Depends(get_db)):
    """Delete a justificacion by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Justificacion not found")
    return {"status": "deleted"}
