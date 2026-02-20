"""
Router for migracion_metadata table - Read-only.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MigracionMetadata
from ..schemas import PaginatedResponse
from ..crud import CRUDBase, model_to_dict

router = APIRouter(prefix="/migracion-metadata", tags=["Migracion Metadata"])
crud = CRUDBase(MigracionMetadata)


@router.get("/", response_model=PaginatedResponse)
def list_migracion_metadata(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all migracion_metadata records with pagination."""
    result = crud.get_multi(db, skip=skip, limit=limit)
    result["data"] = [model_to_dict(item) for item in result["data"]]
    return result


@router.get("/{id}")
def get_migracion_metadata(id: int, db: Session = Depends(get_db)):
    """Get a migracion_metadata record by ID."""
    obj = crud.get(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Migracion metadata not found")
    return model_to_dict(obj)


@router.get("/tabla/{tabla_destino}")
def get_migracion_by_tabla(tabla_destino: str, db: Session = Depends(get_db)):
    """Get migracion_metadata for a specific table."""
    objs = db.query(MigracionMetadata).filter(
        MigracionMetadata.tabla_destino == tabla_destino
    ).all()
    return [model_to_dict(obj) for obj in objs]
