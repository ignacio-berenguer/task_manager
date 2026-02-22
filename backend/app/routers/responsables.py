"""Responsables parametric CRUD endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import verify_auth
from app.database import get_db
from app.models import Responsable
from app.schemas import ResponsableCreate, ResponsableUpdate
from app.crud import CRUDBase, model_to_dict

LOG = logging.getLogger("task_manager_backend")

router = APIRouter(prefix="/responsables", tags=["responsables"], dependencies=[Depends(verify_auth)])
crud_responsables = CRUDBase(Responsable)


@router.get("/")
def list_responsables(db: Session = Depends(get_db)):
    """List all responsables, ordered by 'orden'."""
    items = db.query(Responsable).order_by(Responsable.orden).all()
    return [model_to_dict(item) for item in items]


@router.post("/", status_code=201)
def create_responsable(responsable_in: ResponsableCreate, db: Session = Depends(get_db)):
    """Create a new responsable."""
    existing = db.query(Responsable).filter(Responsable.valor == responsable_in.valor).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Responsable '{responsable_in.valor}' ya existe")
    item = crud_responsables.create(db, responsable_in.model_dump())
    return model_to_dict(item)


@router.put("/{id}")
def update_responsable(id: int, responsable_in: ResponsableUpdate, db: Session = Depends(get_db)):
    """Update a responsable."""
    item = crud_responsables.get(db, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Responsable {id} no encontrado")
    updated = crud_responsables.update(db, item, responsable_in.model_dump(exclude_unset=True))
    return model_to_dict(updated)


@router.delete("/{id}")
def delete_responsable(id: int, db: Session = Depends(get_db)):
    """Delete a responsable."""
    if not crud_responsables.delete(db, id):
        raise HTTPException(status_code=404, detail=f"Responsable {id} no encontrado")
    return {"detail": f"Responsable {id} eliminado"}
