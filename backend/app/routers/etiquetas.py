"""
Router for etiquetas table - Full CRUD + Search + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Etiqueta, DatosDescriptivo, DatosRelevante
from ..schemas import SearchRequest, PaginatedResponse, EtiquetasReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/etiquetas", tags=["Etiquetas"])
crud = CRUDBase(Etiqueta)


@router.get("/", response_model=PaginatedResponse)
def list_etiquetas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all etiquetas with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-etiquetas-filter-options")
def get_report_etiquetas_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Etiquetas report."""
    etiqueta_values = (
        db.query(Etiqueta.etiqueta)
        .distinct()
        .filter(Etiqueta.etiqueta.isnot(None), Etiqueta.etiqueta != "")
        .order_by(Etiqueta.etiqueta)
        .all()
    )

    result = {
        "etiqueta": [v[0] for v in etiqueta_values],
    }

    logger.info(f"Report Etiquetas filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-etiquetas", response_model=PaginatedResponse)
def search_report_etiquetas(request: EtiquetasReportRequest, db: Session = Depends(get_db)):
    """
    Search etiquetas for the Etiquetas report.

    Joins etiquetas with datos_descriptivos to include nombre.
    """
    query = (
        db.query(Etiqueta, DatosDescriptivo, DatosRelevante.estado_de_la_iniciativa)
        .outerjoin(DatosDescriptivo, Etiqueta.portfolio_id == DatosDescriptivo.portfolio_id)
        .outerjoin(DatosRelevante, Etiqueta.portfolio_id == DatosRelevante.portfolio_id)
    )

    if request.portfolio_id:
        query = query.filter(Etiqueta.portfolio_id == request.portfolio_id)
    if request.nombre:
        query = query.filter(DatosDescriptivo.nombre.ilike(f"%{request.nombre}%"))
    if request.etiqueta:
        query = query.filter(Etiqueta.etiqueta.in_(request.etiqueta))

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Etiqueta, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for etiqueta_obj, datos_desc, estado_iniciativa in rows:
        row_dict = model_to_dict_with_calculated(db, etiqueta_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        row_dict["estado_de_la_iniciativa"] = estado_iniciativa
        data.append(row_dict)

    logger.info(f"Report Etiquetas search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_etiqueta(id: int, db: Session = Depends(get_db)):
    """Get an etiqueta by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Etiqueta not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_etiquetas_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all etiquetas for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_etiqueta(data: dict, db: Session = Depends(get_db)):
    """Create a new etiqueta."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_etiqueta(id: int, data: dict, db: Session = Depends(get_db)):
    """Update an etiqueta by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Etiqueta not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_etiqueta(id: int, db: Session = Depends(get_db)):
    """Delete an etiqueta by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Etiqueta not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_etiquetas(request: SearchRequest, db: Session = Depends(get_db)):
    """Search etiquetas with flexible filters."""
    return search(db, Etiqueta, request)
