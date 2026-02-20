"""
Router for estado_especial table - Full CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import EstadoEspecial
from ..schemas import PaginatedResponse
from ..schemas import EstadoEspecialCreate, EstadoEspecialUpdate
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

router = APIRouter(prefix="/estado-especial", tags=["Estado Especial"])
crud = CRUDBase(EstadoEspecial)


@router.get("/", response_model=PaginatedResponse)
def list_estado_especial(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all estado_especial records with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


@router.get("/{id}")
def get_estado_especial(id: int, db: Session = Depends(get_db)):
    """Get an estado_especial record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estado especial not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_estado_especial_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get estado_especial for a portfolio_id."""
    obj = crud.get_by_portfolio_id(db, portfolio_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estado especial not found")
    return model_to_dict_with_calculated(db, obj)


@router.post("/", status_code=201)
def create_estado_especial(data: EstadoEspecialCreate, db: Session = Depends(get_db)):
    """Create a new estado_especial record."""
    return model_to_dict_with_calculated(db, crud.create(db, data.model_dump(exclude_unset=True)))


@router.put("/{id}")
def update_estado_especial(id: int, data: EstadoEspecialUpdate, db: Session = Depends(get_db)):
    """Update an estado_especial record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Estado especial not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data.model_dump(exclude_unset=True)))


@router.delete("/{id}")
def delete_estado_especial(id: int, db: Session = Depends(get_db)):
    """Delete an estado_especial record by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Estado especial not found")
    return {"status": "deleted"}
