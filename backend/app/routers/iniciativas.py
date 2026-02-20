"""
Router for iniciativas table - Full CRUD + Search.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Iniciativa
from ..schemas import SearchRequest, PaginatedResponse
from ..crud import CRUDBase, model_to_dict
from ..search import search

router = APIRouter(prefix="/iniciativas", tags=["Iniciativas"])
crud = CRUDBase(Iniciativa)


@router.get("/", response_model=PaginatedResponse)
def list_iniciativas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all iniciativas with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


@router.get("/{id}")
def get_iniciativa(id: int, db: Session = Depends(get_db)):
    """Get a single iniciativa by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Iniciativa not found")
    return model_to_dict(obj)


@router.get("/portfolio/{portfolio_id}")
def get_iniciativa_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get iniciativa by portfolio_id."""
    obj = crud.get_by_portfolio_id(db, portfolio_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Iniciativa not found")
    return model_to_dict(obj)


@router.post("/", status_code=201)
def create_iniciativa(data: dict, db: Session = Depends(get_db)):
    """Create a new iniciativa."""
    return model_to_dict(crud.create(db, data))


@router.put("/{id}")
def update_iniciativa(id: int, data: dict, db: Session = Depends(get_db)):
    """Update an iniciativa by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Iniciativa not found")
    return model_to_dict(crud.update(db, obj, data))


@router.delete("/{id}")
def delete_iniciativa(id: int, db: Session = Depends(get_db)):
    """Delete an iniciativa by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Iniciativa not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_iniciativas(request: SearchRequest, db: Session = Depends(get_db)):
    """Search iniciativas with flexible filters."""
    return search(db, Iniciativa, request)
