"""Estados parametric CRUD endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EstadoTarea, EstadoAccion
from app.schemas import EstadoCreate, EstadoUpdate
from app.crud import CRUDBase, model_to_dict

LOG = logging.getLogger("task_manager_backend")

# --- Estados Tareas ---

router_tareas = APIRouter(prefix="/estados-tareas", tags=["estados"])
crud_estados_tareas = CRUDBase(EstadoTarea)


@router_tareas.get("/")
def list_estados_tareas(db: Session = Depends(get_db)):
    """List all estados for tareas, ordered by 'orden'."""
    items = db.query(EstadoTarea).order_by(EstadoTarea.orden).all()
    return [model_to_dict(item) for item in items]


@router_tareas.post("/", status_code=201)
def create_estado_tarea(estado_in: EstadoCreate, db: Session = Depends(get_db)):
    """Create a new estado for tareas."""
    item = crud_estados_tareas.create(db, estado_in.model_dump())
    return model_to_dict(item)


@router_tareas.put("/{id}")
def update_estado_tarea(id: int, estado_in: EstadoUpdate, db: Session = Depends(get_db)):
    """Update an estado for tareas."""
    item = crud_estados_tareas.get(db, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Estado {id} no encontrado")
    updated = crud_estados_tareas.update(db, item, estado_in.model_dump(exclude_unset=True))
    return model_to_dict(updated)


@router_tareas.delete("/{id}")
def delete_estado_tarea(id: int, db: Session = Depends(get_db)):
    """Delete an estado for tareas."""
    if not crud_estados_tareas.delete(db, id):
        raise HTTPException(status_code=404, detail=f"Estado {id} no encontrado")
    return {"detail": f"Estado {id} eliminado"}


# --- Estados Acciones ---

router_acciones = APIRouter(prefix="/estados-acciones", tags=["estados"])
crud_estados_acciones = CRUDBase(EstadoAccion)


@router_acciones.get("/")
def list_estados_acciones(db: Session = Depends(get_db)):
    """List all estados for acciones, ordered by 'orden'."""
    items = db.query(EstadoAccion).order_by(EstadoAccion.orden).all()
    return [model_to_dict(item) for item in items]


@router_acciones.post("/", status_code=201)
def create_estado_accion(estado_in: EstadoCreate, db: Session = Depends(get_db)):
    """Create a new estado for acciones."""
    item = crud_estados_acciones.create(db, estado_in.model_dump())
    return model_to_dict(item)


@router_acciones.put("/{id}")
def update_estado_accion(id: int, estado_in: EstadoUpdate, db: Session = Depends(get_db)):
    """Update an estado for acciones."""
    item = crud_estados_acciones.get(db, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Estado {id} no encontrado")
    updated = crud_estados_acciones.update(db, item, estado_in.model_dump(exclude_unset=True))
    return model_to_dict(updated)


@router_acciones.delete("/{id}")
def delete_estado_accion(id: int, db: Session = Depends(get_db)):
    """Delete an estado for acciones."""
    if not crud_estados_acciones.delete(db, id):
        raise HTTPException(status_code=404, detail=f"Estado {id} no encontrado")
    return {"detail": f"Estado {id} eliminado"}
