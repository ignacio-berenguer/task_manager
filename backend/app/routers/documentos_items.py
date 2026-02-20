"""
Router for documentos_items table - Read-only.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DocumentoItem
from ..schemas import PaginatedResponse
from ..crud import CRUDBase, model_to_dict

router = APIRouter(prefix="/documentos-items", tags=["Documentos Items"])
crud = CRUDBase(DocumentoItem)


@router.get("/", response_model=PaginatedResponse)
def list_documentos_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all documentos_items records with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


@router.get("/portfolio/{portfolio_id}")
def get_documentos_items_by_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    """Get documentos_items for a specific portfolio."""
    objs = db.query(DocumentoItem).filter(
        DocumentoItem.portfolio_id == portfolio_id
    ).order_by(DocumentoItem.nombre_fichero, DocumentoItem.tipo_registro).all()
    return [model_to_dict(obj) for obj in objs]


@router.get("/{id}")
def get_documentos_item(id: int, db: Session = Depends(get_db)):
    """Get a documentos_items record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Documento item not found")
    return model_to_dict(obj)
