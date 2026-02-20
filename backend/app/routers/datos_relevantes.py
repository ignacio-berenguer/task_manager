"""
Router for datos_relevantes table - Read-only + Search.
This table is computed by the management module.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import DatosRelevante, Etiqueta
from ..schemas import SearchRequest, PaginatedResponse, SearchFilter
from ..crud import CRUDBase, model_to_dict
from ..search import search, apply_filter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/datos-relevantes", tags=["Datos Relevantes"])
crud = CRUDBase(DatosRelevante)


def get_etiquetas_for_portfolios(db: Session, portfolio_ids: list[str]) -> dict[str, str]:
    """Get comma-separated etiquetas for a list of portfolio_ids."""
    if not portfolio_ids:
        return {}

    # Query etiquetas grouped by portfolio_id
    results = (
        db.query(
            Etiqueta.portfolio_id,
            func.group_concat(Etiqueta.etiqueta.distinct())
        )
        .filter(Etiqueta.portfolio_id.in_(portfolio_ids))
        .group_by(Etiqueta.portfolio_id)
        .all()
    )

    return {portfolio_id: etiquetas or "" for portfolio_id, etiquetas in results}


def get_unique_etiquetas(db: Session) -> list[str]:
    """Get all unique etiqueta values."""
    results = (
        db.query(Etiqueta.etiqueta)
        .distinct()
        .filter(Etiqueta.etiqueta.isnot(None))
        .order_by(Etiqueta.etiqueta)
        .all()
    )
    return [r[0] for r in results if r[0]]


@router.get("/", response_model=PaginatedResponse)
def list_datos_relevantes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all datos_relevantes with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


@router.get("/etiquetas-options")
def get_etiquetas_options(db: Session = Depends(get_db)):
    """Get all unique etiqueta values for filter dropdown."""
    return get_unique_etiquetas(db)


@router.get("/{portfolio_id}")
def get_datos_relevantes(portfolio_id: str, db: Session = Depends(get_db)):
    """Get datos_relevantes by portfolio_id."""
    obj = crud.get(db, portfolio_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Datos relevantes not found")
    return model_to_dict(obj)


@router.post("/search", response_model=PaginatedResponse)
def search_datos_relevantes(request: SearchRequest, db: Session = Depends(get_db)):
    """
    Search datos_relevantes with flexible filters.

    Special filter: etiquetas - filters by portfolio_ids that have matching etiquetas.
    The results include a comma-separated 'etiquetas' field for each record.
    """
    # Check for etiquetas filter
    etiquetas_filter = None
    other_filters = []

    for f in request.filters:
        if f.field == "etiquetas":
            etiquetas_filter = f
        else:
            other_filters.append(f)

    # If etiquetas filter exists, get matching portfolio_ids first
    portfolio_ids_with_etiquetas = None
    if etiquetas_filter:
        etiqueta_values = etiquetas_filter.value
        if not isinstance(etiqueta_values, list):
            etiqueta_values = [etiqueta_values]

        # Get portfolio_ids that have any of the specified etiquetas
        matching_portfolios = (
            db.query(Etiqueta.portfolio_id)
            .filter(Etiqueta.etiqueta.in_(etiqueta_values))
            .distinct()
            .all()
        )
        portfolio_ids_with_etiquetas = [p[0] for p in matching_portfolios]

        # If no portfolios match, return empty result
        if not portfolio_ids_with_etiquetas:
            return {
                "total": 0,
                "data": [],
                "limit": request.limit,
                "offset": request.offset
            }

    # Build main query
    query = db.query(DatosRelevante)

    # Apply etiquetas filter (portfolio_id in matching list)
    if portfolio_ids_with_etiquetas is not None:
        query = query.filter(DatosRelevante.portfolio_id.in_(portfolio_ids_with_etiquetas))

    # Apply other filters
    for f in other_filters:
        try:
            query = apply_filter(query, DatosRelevante, f)
        except ValueError as e:
            logger.warning(f"Invalid filter: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    # Get total count before pagination
    total = query.count()

    # Apply ordering
    if request.order_by:
        column = getattr(DatosRelevante, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    # Apply pagination
    data = query.offset(request.offset).limit(request.limit).all()

    # Convert to dictionaries
    data_dicts = [model_to_dict(row) for row in data]

    # Add etiquetas field to each record
    if data_dicts:
        portfolio_ids = [d["portfolio_id"] for d in data_dicts]
        etiquetas_map = get_etiquetas_for_portfolios(db, portfolio_ids)

        for d in data_dicts:
            d["etiquetas"] = etiquetas_map.get(d["portfolio_id"], "")

    logger.info(
        f"Search on datos_relevantes: "
        f"{len(request.filters)} filters, {total} total, "
        f"returning {len(data_dicts)} records"
    )

    return {
        "total": total,
        "data": data_dicts,
        "limit": request.limit,
        "offset": request.offset
    }
