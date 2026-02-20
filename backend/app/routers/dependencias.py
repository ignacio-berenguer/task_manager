"""
Router for dependencias table - Full CRUD + Search + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dependencia, DatosDescriptivo
from ..schemas import SearchRequest, PaginatedResponse, DependenciasReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dependencias", tags=["Dependencias"])
crud = CRUDBase(Dependencia)


@router.get("/", response_model=PaginatedResponse)
def list_dependencias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all dependencias with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-dependencias-filter-options")
def get_report_dependencias_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Dependencias report."""
    result = {}

    logger.info("Report Dependencias filter options: no dropdown filters")
    return result


@router.post("/search-report-dependencias", response_model=PaginatedResponse)
def search_report_dependencias(request: DependenciasReportRequest, db: Session = Depends(get_db)):
    """
    Search dependencias for the Dependencias report.

    Joins dependencias with datos_descriptivos to include nombre.
    """
    query = (
        db.query(Dependencia, DatosDescriptivo)
        .outerjoin(DatosDescriptivo, Dependencia.portfolio_id == DatosDescriptivo.portfolio_id)
    )

    if request.portfolio_id:
        query = query.filter(Dependencia.portfolio_id == request.portfolio_id)
    if request.descripcion_dependencia:
        query = query.filter(
            Dependencia.descripcion_dependencia.ilike(f"%{request.descripcion_dependencia}%")
        )

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Dependencia, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for dep_obj, datos_desc in rows:
        row_dict = model_to_dict_with_calculated(db, dep_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        data.append(row_dict)

    logger.info(f"Report Dependencias search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_dependencia(id: int, db: Session = Depends(get_db)):
    """Get a dependencia by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Dependencia not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_dependencias_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all dependencias for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_dependencia(data: dict, db: Session = Depends(get_db)):
    """Create a new dependencia."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_dependencia(id: int, data: dict, db: Session = Depends(get_db)):
    """Update a dependencia by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Dependencia not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_dependencia(id: int, db: Session = Depends(get_db)):
    """Delete a dependencia by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Dependencia not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_dependencias(request: SearchRequest, db: Session = Depends(get_db)):
    """Search dependencias with flexible filters."""
    return search(db, Dependencia, request)
