"""
Router for hechos table - Full CRUD + Search + Report endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Hecho, DatosRelevante
from ..schemas import SearchRequest, PaginatedResponse, HechosReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hechos", tags=["Hechos"])
crud = CRUDBase(Hecho)


@router.get("/", response_model=PaginatedResponse)
def list_hechos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all hechos with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{id_hecho} to avoid route conflicts) ---

@router.get("/report-hechos-filter-options")
def get_report_hechos_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Hechos report."""
    result = {}

    # Filter options from datos_relevantes
    for field_name in ["digital_framework_level_1", "unidad", "cluster", "tipo"]:
        column = getattr(DatosRelevante, field_name)
        values = (
            db.query(column)
            .distinct()
            .filter(column.isnot(None), column != "")
            .order_by(column)
            .all()
        )
        result[field_name] = [v[0] for v in values]

    # Filter options from hechos (estado)
    estado_values = (
        db.query(Hecho.estado)
        .distinct()
        .filter(Hecho.estado.isnot(None), Hecho.estado != "")
        .order_by(Hecho.estado)
        .all()
    )
    result["estado"] = [v[0] for v in estado_values]

    logger.info(f"Report hechos filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-hechos", response_model=PaginatedResponse)
def search_report_hechos(request: HechosReportRequest, db: Session = Depends(get_db)):
    """
    Search hechos for the Hechos report.

    Joins hechos with datos_relevantes to include portfolio metadata
    and filters by date range, estado, and optional portfolio attributes.
    """
    # Build query with LEFT JOIN to datos_relevantes (full models for all columns)
    query = (
        db.query(Hecho, DatosRelevante)
        .outerjoin(DatosRelevante, Hecho.portfolio_id == DatosRelevante.portfolio_id)
    )

    # Date range filter (hechos.fecha is TEXT in YYYY-MM-DD format)
    if request.fecha_inicio:
        query = query.filter(Hecho.fecha >= request.fecha_inicio)
    if request.fecha_fin:
        query = query.filter(Hecho.fecha <= request.fecha_fin)

    # Estado filter on hechos
    if request.estado:
        query = query.filter(Hecho.estado.in_(request.estado))

    # Optional filters on datos_relevantes fields
    if request.digital_framework_level_1:
        query = query.filter(
            DatosRelevante.digital_framework_level_1.in_(request.digital_framework_level_1)
        )
    if request.unidad:
        query = query.filter(DatosRelevante.unidad.in_(request.unidad))
    if request.cluster:
        query = query.filter(DatosRelevante.cluster.in_(request.cluster))
    if request.tipo:
        query = query.filter(DatosRelevante.tipo.in_(request.tipo))

    # Total count before pagination
    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Hecho, request.order_by, None) or getattr(DatosRelevante, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    # Pagination
    rows = query.offset(request.offset).limit(request.limit).all()

    # Convert to dicts: merge hecho + datos_relevantes fields
    data = []
    for hecho, datos_rel in rows:
        row_dict = model_to_dict_with_calculated(db, hecho)
        if datos_rel:
            dr_dict = model_to_dict_with_calculated(db, datos_rel)
            dr_dict.pop("portfolio_id", None)  # avoid duplicate key
            row_dict.update(dr_dict)
        data.append(row_dict)

    logger.info(
        f"Report hechos search: fecha={request.fecha_inicio}..{request.fecha_fin}, "
        f"{total} total, returning {len(data)} records"
    )

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


@router.post("/search", response_model=PaginatedResponse)
def search_hechos(request: SearchRequest, db: Session = Depends(get_db)):
    """Search hechos with flexible filters."""
    return search(db, Hecho, request)


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/{id_hecho}")
def get_hecho(id_hecho: int, db: Session = Depends(get_db)):
    """Get a single hecho by id_hecho."""
    obj = crud.get(db, id_hecho)
    if not obj:
        raise HTTPException(status_code=404, detail="Hecho not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_hechos_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all hechos for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_hecho(data: dict, db: Session = Depends(get_db)):
    """Create a new hecho."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id_hecho}")
def update_hecho(id_hecho: int, data: dict, db: Session = Depends(get_db)):
    """Update a hecho by id_hecho."""
    obj = crud.get(db, id_hecho)
    if not obj:
        raise HTTPException(status_code=404, detail="Hecho not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id_hecho}")
def delete_hecho(id_hecho: int, db: Session = Depends(get_db)):
    """Delete a hecho by id_hecho."""
    if not crud.delete(db, id_hecho):
        raise HTTPException(status_code=404, detail="Hecho not found")
    return {"status": "deleted"}
