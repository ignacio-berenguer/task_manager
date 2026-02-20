"""
Router for descripciones table - Full CRUD + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Descripcion, DatosDescriptivo
from ..schemas import PaginatedResponse, DescripcionesReportRequest, DescripcionCreate, DescripcionUpdate
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/descripciones", tags=["Descripciones"])
crud = CRUDBase(Descripcion)


@router.get("/", response_model=PaginatedResponse)
def list_descripciones(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all descripciones with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-descripciones-filter-options")
def get_report_descripciones_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Descripciones report."""
    tipo_values = (
        db.query(Descripcion.tipo_descripcion)
        .distinct()
        .filter(
            Descripcion.tipo_descripcion.isnot(None),
            Descripcion.tipo_descripcion != ""
        )
        .order_by(Descripcion.tipo_descripcion)
        .all()
    )

    result = {
        "tipo_descripcion": [v[0] for v in tipo_values],
    }

    logger.info(f"Report Descripciones filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-descripciones", response_model=PaginatedResponse)
def search_report_descripciones(request: DescripcionesReportRequest, db: Session = Depends(get_db)):
    """
    Search descripciones for the Descripciones report.

    Joins descripciones with datos_descriptivos to include nombre.
    """
    query = (
        db.query(Descripcion, DatosDescriptivo)
        .outerjoin(DatosDescriptivo, Descripcion.portfolio_id == DatosDescriptivo.portfolio_id)
    )

    if request.portfolio_id:
        query = query.filter(Descripcion.portfolio_id == request.portfolio_id)
    if request.tipo_descripcion:
        query = query.filter(Descripcion.tipo_descripcion.in_(request.tipo_descripcion))

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Descripcion, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for desc_obj, datos_desc in rows:
        row_dict = model_to_dict_with_calculated(db, desc_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        data.append(row_dict)

    logger.info(f"Report Descripciones search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_descripcion(id: int, db: Session = Depends(get_db)):
    """Get a descripcion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Descripcion not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_descripciones_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all descripciones for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_descripcion(data: DescripcionCreate, db: Session = Depends(get_db)):
    """Create a new descripcion."""
    return model_to_dict_with_calculated(db, crud.create(db, data.model_dump(exclude_unset=True)))


@router.put("/{id}")
def update_descripcion(id: int, data: DescripcionUpdate, db: Session = Depends(get_db)):
    """Update a descripcion by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Descripcion not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data.model_dump(exclude_unset=True)))


@router.delete("/{id}")
def delete_descripcion(id: int, db: Session = Depends(get_db)):
    """Delete a descripcion by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Descripcion not found")
    return {"status": "deleted"}
