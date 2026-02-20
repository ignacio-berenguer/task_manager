"""
Router for informacion_economica table - Full CRUD + Search.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import InformacionEconomica
from ..schemas import SearchRequest, PaginatedResponse
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated
from ..search import search

router = APIRouter(prefix="/informacion-economica", tags=["Informacion Economica"])
crud = CRUDBase(InformacionEconomica)


@router.get("/", response_model=PaginatedResponse)
def list_informacion_economica(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all informacion_economica with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


@router.get("/{id}")
def get_informacion_economica(id: int, db: Session = Depends(get_db)):
    """Get informacion_economica by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Informacion economica not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_informacion_economica_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get informacion_economica for a portfolio_id."""
    obj = crud.get_by_portfolio_id(db, portfolio_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Informacion economica not found")
    return model_to_dict_with_calculated(db, obj)


@router.post("/", status_code=201)
def create_informacion_economica(data: dict, db: Session = Depends(get_db)):
    """Create new informacion_economica."""
    return model_to_dict_with_calculated(db, crud.create(db, data))


@router.put("/{id}")
def update_informacion_economica(id: int, data: dict, db: Session = Depends(get_db)):
    """Update informacion_economica by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Informacion economica not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data))


@router.delete("/{id}")
def delete_informacion_economica(id: int, db: Session = Depends(get_db)):
    """Delete informacion_economica by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Informacion economica not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_informacion_economica(request: SearchRequest, db: Session = Depends(get_db)):
    """Search informacion_economica with flexible filters."""
    return search(db, InformacionEconomica, request)
