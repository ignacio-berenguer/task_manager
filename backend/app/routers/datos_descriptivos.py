"""
Router for datos_descriptivos table - Full CRUD + Search.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DatosDescriptivo
from ..schemas import SearchRequest, PaginatedResponse
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

router = APIRouter(prefix="/datos-descriptivos", tags=["Datos Descriptivos"])
crud = CRUDBase(DatosDescriptivo)


@router.get("/", response_model=PaginatedResponse)
def list_datos_descriptivos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all datos_descriptivos with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


@router.get("/{id}")
def get_datos_descriptivos(id: int, db: Session = Depends(get_db)):
    """Get datos_descriptivos by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Datos descriptivos not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_datos_descriptivos_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all datos_descriptivos for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict_with_calculated(db, obj) for obj in objs]


@router.post("/", status_code=201)
def create_datos_descriptivos(data: dict, db: Session = Depends(get_db)):
    """Create new datos_descriptivos."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_datos_descriptivos(id: int, data: dict, db: Session = Depends(get_db)):
    """Update datos_descriptivos by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Datos descriptivos not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_datos_descriptivos(id: int, db: Session = Depends(get_db)):
    """Delete operation disabled for datos_descriptivos."""
    raise HTTPException(
        status_code=403,
        detail="Delete operation is not permitted for Datos Descriptivos records."
    )


@router.post("/search", response_model=PaginatedResponse)
def search_datos_descriptivos(request: SearchRequest, db: Session = Depends(get_db)):
    """Search datos_descriptivos with flexible filters."""
    return search(db, DatosDescriptivo, request)
