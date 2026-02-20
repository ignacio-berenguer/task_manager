"""Tareas CRUD and search endpoints."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Tarea
from app.schemas import TareaCreate, TareaUpdate, SearchRequest
from app.crud import CRUDBase, model_to_dict
from app.search import search

LOG = logging.getLogger("task_manager_backend")

router = APIRouter(prefix="/tareas", tags=["tareas"])
crud_tareas = CRUDBase(Tarea)


@router.get("/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """Get distinct values for filter dropdowns."""
    from sqlalchemy import distinct
    responsables = [r[0] for r in db.query(distinct(Tarea.responsable)).filter(Tarea.responsable.isnot(None)).order_by(Tarea.responsable).all()]
    temas = [r[0] for r in db.query(distinct(Tarea.tema)).filter(Tarea.tema.isnot(None)).order_by(Tarea.tema).all()]
    estados = [r[0] for r in db.query(distinct(Tarea.estado)).filter(Tarea.estado.isnot(None)).order_by(Tarea.estado).all()]
    return {
        "responsables": responsables,
        "temas": temas,
        "estados": estados,
    }


@router.post("/search")
def search_tareas(request: SearchRequest, db: Session = Depends(get_db)):
    """Search tareas with flexible filters."""
    return search(db, Tarea, request)


@router.get("/")
def list_tareas(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all tareas with pagination."""
    total = crud_tareas.count(db)
    items = crud_tareas.get_multi(db, skip=offset, limit=limit)
    return {
        "total": total,
        "data": [model_to_dict(item) for item in items],
        "limit": limit,
        "offset": offset,
    }


@router.get("/{tarea_id}")
def get_tarea(tarea_id: str, db: Session = Depends(get_db)):
    """Get a tarea by ID."""
    item = crud_tareas.get(db, tarea_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Tarea '{tarea_id}' no encontrada")
    return model_to_dict(item)


@router.post("/", status_code=201)
def create_tarea(tarea_in: TareaCreate, db: Session = Depends(get_db)):
    """Create a new tarea."""
    existing = crud_tareas.get(db, tarea_in.tarea_id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Tarea '{tarea_in.tarea_id}' ya existe")
    item = crud_tareas.create(db, tarea_in.model_dump())
    return model_to_dict(item)


@router.put("/{tarea_id}")
def update_tarea(tarea_id: str, tarea_in: TareaUpdate, db: Session = Depends(get_db)):
    """Update a tarea."""
    item = crud_tareas.get(db, tarea_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Tarea '{tarea_id}' no encontrada")
    updated = crud_tareas.update(db, item, tarea_in.model_dump(exclude_unset=True))
    return model_to_dict(updated)


@router.delete("/{tarea_id}")
def delete_tarea(tarea_id: str, db: Session = Depends(get_db)):
    """Delete a tarea (cascades to acciones)."""
    if not crud_tareas.delete(db, tarea_id):
        raise HTTPException(status_code=404, detail=f"Tarea '{tarea_id}' no encontrada")
    return {"detail": f"Tarea '{tarea_id}' eliminada"}
