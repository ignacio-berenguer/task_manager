"""
Router for documentos table - Full CRUD + Search + Report.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Documento, DatosDescriptivo, DatosRelevante
from ..schemas import SearchRequest, PaginatedResponse, DocumentosReportRequest
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documentos", tags=["Documentos"])
crud = CRUDBase(Documento)


@router.get("/", response_model=PaginatedResponse)
def list_documentos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all documentos with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


# --- Report endpoints (must be before /{nombre_fichero} to avoid route conflicts) ---

@router.get("/report-documentos-filter-options")
def get_report_documentos_filter_options(db: Session = Depends(get_db)):
    """Get distinct filter values for the Documentos report."""
    tipo_values = (
        db.query(Documento.tipo_documento)
        .distinct()
        .filter(Documento.tipo_documento.isnot(None), Documento.tipo_documento != "")
        .order_by(Documento.tipo_documento)
        .all()
    )

    estado_values = (
        db.query(Documento.estado_proceso_documento)
        .distinct()
        .filter(Documento.estado_proceso_documento.isnot(None), Documento.estado_proceso_documento != "")
        .order_by(Documento.estado_proceso_documento)
        .all()
    )

    result = {
        "tipo_documento": [v[0] for v in tipo_values],
        "estado_proceso_documento": [v[0] for v in estado_values],
    }

    logger.info(f"Report Documentos filter options: {', '.join(f'{k}={len(v)}' for k, v in result.items())}")
    return result


@router.post("/search-report-documentos", response_model=PaginatedResponse)
def search_report_documentos(request: DocumentosReportRequest, db: Session = Depends(get_db)):
    """
    Search documentos for the Documentos report.

    Joins documentos with datos_descriptivos to include nombre
    and datos_relevantes to include estado_de_la_iniciativa.
    """
    query = (
        db.query(Documento, DatosDescriptivo, DatosRelevante.estado_de_la_iniciativa)
        .outerjoin(DatosDescriptivo, Documento.portfolio_id == DatosDescriptivo.portfolio_id)
        .outerjoin(DatosRelevante, Documento.portfolio_id == DatosRelevante.portfolio_id)
    )

    if request.portfolio_id:
        query = query.filter(Documento.portfolio_id == request.portfolio_id)
    if request.nombre:
        query = query.filter(DatosDescriptivo.nombre.ilike(f"%{request.nombre}%"))
    if request.tipo_documento:
        query = query.filter(Documento.tipo_documento.in_(request.tipo_documento))
    if request.estado_proceso_documento:
        query = query.filter(Documento.estado_proceso_documento.in_(request.estado_proceso_documento))

    total = query.count()

    # Ordering
    if request.order_by:
        column = getattr(Documento, request.order_by, None) or getattr(DatosDescriptivo, request.order_by, None)
        if column is not None:
            if request.order_dir == "desc":
                column = column.desc()
            query = query.order_by(column)

    rows = query.offset(request.offset).limit(request.limit).all()

    data = []
    for documento_obj, datos_desc, estado_iniciativa in rows:
        row_dict = model_to_dict_with_calculated(db, documento_obj)
        row_dict["nombre"] = datos_desc.nombre if datos_desc else None
        row_dict["estado_de_la_iniciativa"] = estado_iniciativa
        data.append(row_dict)

    logger.info(f"Report Documentos search: {total} total, returning {len(data)} records")

    return {
        "total": total,
        "data": data,
        "limit": request.limit,
        "offset": request.offset,
    }


# --- CRUD endpoints with path parameters (must be after static routes) ---

@router.get("/portfolio/{portfolio_id}")
def get_documentos_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all documentos for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.get("/{nombre_fichero:path}")
def get_documento(nombre_fichero: str, db: Session = Depends(get_db)):
    """Get a documento by nombre_fichero (primary key)."""
    obj = crud.get(db, nombre_fichero)
    if not obj:
        raise HTTPException(status_code=404, detail="Documento not found")
    return model_to_dict_with_calculated(db, obj)


@router.post("/", status_code=201)
def create_documento(data: dict, db: Session = Depends(get_db)):
    """Create a new documento."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{nombre_fichero:path}")
def update_documento(nombre_fichero: str, data: dict, db: Session = Depends(get_db)):
    """Update a documento by nombre_fichero."""
    obj = crud.get(db, nombre_fichero)
    if not obj:
        raise HTTPException(status_code=404, detail="Documento not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{nombre_fichero:path}")
def delete_documento(nombre_fichero: str, db: Session = Depends(get_db)):
    """Delete a documento by nombre_fichero."""
    if not crud.delete(db, nombre_fichero):
        raise HTTPException(status_code=404, detail="Documento not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_documentos(request: SearchRequest, db: Session = Depends(get_db)):
    """Search documentos with flexible filters."""
    return search(db, Documento, request)
