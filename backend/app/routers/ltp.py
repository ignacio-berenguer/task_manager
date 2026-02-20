"""
Router for ltp (Linea Tareas Pendientes) table - Full CRUD + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LTP, DatosDescriptivo
from ..schemas import PaginatedResponse, LTPReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ltp", tags=["LTP"])
crud = CRUDBase(LTP)


@router.get("/", response_model=PaginatedResponse)
def list_ltp(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all LTP records with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-ltps-filter-options")
def get_report_ltps_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the LTPs report."""
    result = {}
    for field_name in ["responsable", "estado"]:
        column = getattr(LTP, field_name)
        values = (
            db.query(column)
            .distinct()
            .filter(column.isnot(None), column != "")
            .order_by(column)
            .all()
        )
        result[field_name] = [v[0] for v in values]

    logger.info(f"Report LTPs filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-ltps", response_model=PaginatedResponse)
def search_report_ltps(request: LTPReportRequest, db: Session = Depends(get_db)):
    """
    Search LTPs for the LTPs report.

    Joins ltp with datos_descriptivos to include nombre.
    """
    query = (
        db.query(LTP, DatosDescriptivo)
        .outerjoin(DatosDescriptivo, LTP.portfolio_id == DatosDescriptivo.portfolio_id)
    )

    if request.responsable:
        query = query.filter(LTP.responsable.in_(request.responsable))
    if request.estado:
        query = query.filter(LTP.estado.in_(request.estado))

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(LTP, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for ltp_obj, datos_desc in rows:
        row_dict = model_to_dict_with_calculated(db, ltp_obj)
        if datos_desc:
            row_dict["nombre"] = datos_desc.nombre
        else:
            row_dict["nombre"] = None
        data.append(row_dict)

    logger.info(f"Report LTPs search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_ltp(id: int, db: Session = Depends(get_db)):
    """Get an LTP record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="LTP not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_ltp_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all LTP records for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_ltp(data: dict, db: Session = Depends(get_db)):
    """Create a new LTP record."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_ltp(id: int, data: dict, db: Session = Depends(get_db)):
    """Update an LTP record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="LTP not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_ltp(id: int, db: Session = Depends(get_db)):
    """Delete an LTP record by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="LTP not found")
    return {"status": "deleted"}
