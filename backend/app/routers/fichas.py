"""
Router for fichas table - Full CRUD + Search.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ficha
from ..schemas import SearchRequest, PaginatedResponse
from ..crud import CRUDBase, model_to_dict
from ..search import search

router = APIRouter(prefix="/fichas", tags=["Fichas"])
crud = CRUDBase(Ficha)


@router.get("/", response_model=PaginatedResponse)
def list_fichas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all fichas with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


@router.get("/{id}")
def get_ficha(id: int, db: Session = Depends(get_db)):
    """Get a ficha by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Ficha not found")
    return model_to_dict(obj)


@router.get("/portfolio/{portfolio_id}")
def get_fichas_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get all fichas for a portfolio_id."""
    objs = crud.get_all_by_portfolio_id(db, portfolio_id)
    return [model_to_dict(obj) for obj in objs]


@router.post("/", status_code=201)
def create_ficha(data: dict, db: Session = Depends(get_db)):
    """Create a new ficha."""
    return model_to_dict(crud.create(db, data))


@router.put("/{id}")
def update_ficha(id: int, data: dict, db: Session = Depends(get_db)):
    """Update a ficha by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Ficha not found")
    return model_to_dict(crud.update(db, obj, data))


@router.delete("/{id}")
def delete_ficha(id: int, db: Session = Depends(get_db)):
    """Delete a ficha by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Ficha not found")
    return {"status": "deleted"}


@router.post("/search", response_model=PaginatedResponse)
def search_fichas(request: SearchRequest, db: Session = Depends(get_db)):
    """Search fichas with flexible filters."""
    return search(db, Ficha, request)
