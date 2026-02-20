"""
Router for notas table - Full CRUD + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Nota, DatosDescriptivo
from ..schemas import PaginatedResponse, NotasReportRequest, NotaCreate, NotaUpdate
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notas", tags=["Notas"])
crud = CRUDBase(Nota)


@router.get("/", response_model=PaginatedResponse)
def list_notas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all notas with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id} to avoid route conflicts) ---

@router.get("/report-notas-filter-options")
def get_report_notas_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Notas report."""
    registrado_por_values = (
        db.query(Nota.registrado_por)
        .distinct()
        .filter(
            Nota.registrado_por.isnot(None),
            Nota.registrado_por != ""
        )
        .order_by(Nota.registrado_por)
        .all()
    )

    result = {
        "registrado_por": [v[0] for v in registrado_por_values],
    }

    logger.info(f"Report Notas filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-notas", response_model=PaginatedResponse)
def search_report_notas(request: NotasReportRequest, db: Session = Depends(get_db)):
    """
    Search notas for the Notas report.

    Joins notas with datos_descriptivos to include nombre.
    """
    query = (
        db.query(Nota, DatosDescriptivo)
        .outerjoin(DatosDescriptivo, Nota.portfolio_id == DatosDescriptivo.portfolio_id)
    )

    if request.portfolio_id:
        query = query.filter(Nota.portfolio_id == request.portfolio_id)
    if request.registrado_por:
        query = query.filter(Nota.registrado_por.in_(request.registrado_por))
    if request.fecha_inicio:
        query = query.filter(Nota.fecha >= request.fecha_inicio)
    if request.fecha_fin:
        query = query.filter(Nota.fecha <= request.fecha_fin)

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Nota, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for nota_obj, datos_desc in rows:
        row_dict = model_to_dict_with_calculated(db, nota_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        data.append(row_dict)

    logger.info(f"Report Notas search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id}")
def get_nota(id: int, db: Session = Depends(get_db)):
    """Get a nota by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Nota not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_notas_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all notas for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_nota(data: NotaCreate, db: Session = Depends(get_db)):
    """Create a new nota."""
    return model_to_dict_with_calculated(db, crud.create(db, data.model_dump(exclude_unset=True)))


@router.put("/{id}")
def update_nota(id: int, data: NotaUpdate, db: Session = Depends(get_db)):
    """Update a nota by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Nota not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data.model_dump(exclude_unset=True)))


@router.delete("/{id}")
def delete_nota(id: int, db: Session = Depends(get_db)):
    """Delete a nota by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Nota not found")
    return {"status": "deleted"}
