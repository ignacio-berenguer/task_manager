"""
Router for investment_memos table - Full CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import InvestmentMemo
from ..schemas import PaginatedResponse
from ..schemas import InvestmentMemoCreate, InvestmentMemoUpdate
from ..crud import CRUDBase, model_to_dict_with_calculated, batch_model_to_dict_with_calculated

router = APIRouter(prefix="/investment-memos", tags=["Investment Memos"])
crud = CRUDBase(InvestmentMemo)


@router.get("/", response_model=PaginatedResponse)
def list_investment_memos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all investment memos with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = batch_model_to_dict_with_calculated(db, result["data"])
    return result


@router.get("/{id}")
def get_investment_memo(id: int, db: Session = Depends(get_db)):
    """Get an investment memo by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Investment memo not found")
    return model_to_dict_with_calculated(db, obj)


@router.get("/portfolio/{portfolio_id}")
def get_investment_memo_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get investment memo for a portfolio_id."""
    obj = crud.get_by_portfolio_id(db, portfolio_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Investment memo not found")
    return model_to_dict_with_calculated(db, obj)


@router.post("/", status_code=201)
def create_investment_memo(data: InvestmentMemoCreate, db: Session = Depends(get_db)):
    """Create a new investment memo."""
    return model_to_dict_with_calculated(db, crud.create(db, data.model_dump(exclude_unset=True)))


@router.put("/{id}")
def update_investment_memo(id: int, data: InvestmentMemoUpdate, db: Session = Depends(get_db)):
    """Update an investment memo by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Investment memo not found")
    return model_to_dict_with_calculated(db, crud.update(db, obj, data.model_dump(exclude_unset=True)))


@router.delete("/{id}")
def delete_investment_memo(id: int, db: Session = Depends(get_db)):
    """Delete an investment memo by ID."""
    if not crud.delete(db, id):
        raise HTTPException(status_code=404, detail="Investment memo not found")
    return {"status": "deleted"}
