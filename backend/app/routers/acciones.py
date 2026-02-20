"""
Router for acciones table - Full CRUD + Search + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Accion, DatosDescriptivo, Iniciativa
from ..schemas import SearchRequest, PaginatedResponse, AccionesReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/acciones", tags=["Acciones"])
crud = CRUDBase(Accion)


@router.get("/", response_model=PaginatedResponse)
def list_acciones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all acciones with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-acciones-filter-options")
def get_report_acciones_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Acciones report."""
    estado_values = (
        db.query(Iniciativa.estado_de_la_iniciativa)
        .distinct()
        .filter(
            Iniciativa.estado_de_la_iniciativa.isnot(None),
            Iniciativa.estado_de_la_iniciativa != ""
        )
        .order_by(Iniciativa.estado_de_la_iniciativa)
        .all()
    )

    result = {
        "estado_de_la_iniciativa": [v[0] for v in estado_values],
    }

    logger.info(f"Report Acciones filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-acciones", response_model=PaginatedResponse)
def search_report_acciones(request: AccionesReportRequest, db: Session = Depends(get_db)):
    """
    Search acciones for the Acciones report.

    Joins acciones with datos_descriptivos (for nombre) and
    iniciativas (for estado_de_la_iniciativa).
    """
    query = (
        db.query(Accion, DatosDescriptivo, Iniciativa)
        .outerjoin(DatosDescriptivo, Accion.portfolio_id == DatosDescriptivo.portfolio_id)
        .outerjoin(Iniciativa, Accion.portfolio_id == Iniciativa.portfolio_id)
    )

    if request.siguiente_accion_inicio:
        query = query.filter(Accion.siguiente_accion >= request.siguiente_accion_inicio)
    if request.siguiente_accion_fin:
        query = query.filter(Accion.siguiente_accion <= request.siguiente_accion_fin)
    if request.estado_de_la_iniciativa:
        query = query.filter(
            Iniciativa.estado_de_la_iniciativa.in_(request.estado_de_la_iniciativa)
        )

    total = query.count()

    # Ordering
    if request.order_by:
        column = (
            getattr(Accion, request.order_by, None)
            or getattr(DatosDescriptivo, request.order_by, None)
            or getattr(Iniciativa, request.order_by, None)
        )
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for accion_obj, datos_desc, iniciativa_obj in rows:
        row_dict = model_to_dict_with_calculated(db, accion_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        row_dict["estado_de_la_iniciativa"] = (
            iniciativa_obj.estado_de_la_iniciativa if iniciativa_obj else None
        )
        data.append(row_dict)

    logger.info(f"Report Acciones search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_accion(id: int, db: Session = Depends(get_db)):
    """Get an accion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Accion not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_acciones_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all acciones for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_accion(data: dict, db: Session = Depends(get_db)):
    """Create a new accion."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_accion(id: int, data: dict, db: Session = Depends(get_db)):
    """Update an accion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Accion not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_accion(id: int, db: Session = Depends(get_db)):
    """Delete an accion by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Accion not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_acciones(request: SearchRequest, db: Session = Depends(get_db)):
    """Search acciones with flexible filters."""
    return search(db, Accion, request)
