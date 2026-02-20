"""
Router for impacto_aatt table - Full CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ImpactoAATT
from ..schemas import PaginatedResponse
from ..schemas import ImpactoAATTCreate, ImpactoAATTUpdate
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

router = APIRouter(prefix="/impacto-aatt", tags=["Impacto AATT"])
crud = CRUDBase(ImpactoAATT)


@router.get("/", response_model=PaginatedResponse)
def list_impacto_aatt(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all impacto_aatt records with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


@router.get("/{id}")
def get_impacto_aatt(id: int, db: Session = Depends(get_db)):
    """Get an impacto_aatt record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Impacto AATT not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_impacto_aatt_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get impacto_aatt for a portfolio_id."""
    obj = crud.get_by_portfolio_id(db, portfolio_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Impacto AATT not found")
    return model_to_dict_with_calculated(db, obj)


@router.post("/", status_code=201)
def create_impacto_aatt(data: ImpactoAATTCreate, db: Session = Depends(get_db)):
    """Create a new impacto_aatt record."""
    return model_to_dict_with_calculated(db, crud.create(db, data.model_dump(exclude_unset=True)))


@router.put("/{id}")
def update_impacto_aatt(id: int, data: ImpactoAATTUpdate, db: Session = Depends(get_db)):
    """Update an impacto_aatt record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Impacto AATT not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data.model_dump(exclude_unset=True)))


@router.delete("/{id}")
def delete_impacto_aatt(id: int, db: Session = Depends(get_db)):
    """Delete an impacto_aatt record by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Impacto AATT not found")
    return {"status": "deleted"}
