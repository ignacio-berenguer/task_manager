"""Acciones realizadas CRUD endpoints."""

import logging
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import verify_auth
from app.database import get_db
from app.models import AccionRealizada, Tarea
from app.schemas import AccionCreate, AccionUpdate, CompleteAndScheduleRequest
from app.crud import CRUDBase, model_to_dict

LOG = logging.getLogger("task_manager_backend")

router = APIRouter(prefix="/acciones", tags=["acciones"], dependencies=[Depends(verify_auth)])
crud_acciones = CRUDBase(AccionRealizada)


@router.post("/complete-and-schedule", status_code=201)
def complete_and_schedule(req: CompleteAndScheduleRequest, db: Session = Depends(get_db)):
    """Complete a current action and schedule the next one atomically."""
    tarea = db.query(Tarea).filter(Tarea.tarea_id == req.tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail=f"Tarea {req.tarea_id} no encontrada")

    accion1 = AccionRealizada(
        tarea_id=req.tarea_id,
        accion=req.accion_completada,
        fecha_accion=date.today(),
        estado="Completada",
    )
    db.add(accion1)

    accion2 = None
    if req.accion_siguiente:
        accion2 = AccionRealizada(
            tarea_id=req.tarea_id,
            accion=req.accion_siguiente,
            fecha_accion=req.fecha_siguiente,
            estado="Pendiente",
        )
        db.add(accion2)

    tarea.fecha_siguiente_accion = req.fecha_siguiente
    tarea.fecha_actualizacion = datetime.now()

    db.commit()
    db.refresh(accion1)
    if accion2:
        db.refresh(accion2)
    db.refresh(tarea)

    if accion2:
        LOG.info(f"Complete & schedule for tarea {req.tarea_id}: completed accion {accion1.id}, scheduled accion {accion2.id}")
    else:
        LOG.info(f"Complete for tarea {req.tarea_id}: completed accion {accion1.id}, fecha updated to {req.fecha_siguiente}")

    result = {
        "accion_completada": model_to_dict(accion1),
        "tarea": model_to_dict(tarea),
    }
    if accion2:
        result["accion_siguiente"] = model_to_dict(accion2)
    return result


@router.get("/tarea/{tarea_id}")
def get_acciones_by_tarea(tarea_id: int, db: Session = Depends(get_db)):
    """Get all acciones for a specific tarea."""
    items = db.query(AccionRealizada).filter(AccionRealizada.tarea_id == tarea_id).all()
    return [model_to_dict(item) for item in items]


@router.get("/")
def list_acciones(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all acciones with pagination."""
    total = crud_acciones.count(db)
    items = crud_acciones.get_multi(db, skip=offset, limit=limit)
    return {
        "total": total,
        "data": [model_to_dict(item) for item in items],
        "limit": limit,
        "offset": offset,
    }


@router.get("/{id}")
def get_accion(id: int, db: Session = Depends(get_db)):
    """Get an accion by ID."""
    item = crud_acciones.get(db, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Accion {id} no encontrada")
    return model_to_dict(item)


@router.post("/", status_code=201)
def create_accion(accion_in: AccionCreate, db: Session = Depends(get_db)):
    """Create a new accion."""
    item = crud_acciones.create(db, accion_in.model_dump())
    return model_to_dict(item)


@router.put("/{id}")
def update_accion(id: int, accion_in: AccionUpdate, db: Session = Depends(get_db)):
    """Update an accion."""
    item = crud_acciones.get(db, id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Accion {id} no encontrada")
    updated = crud_acciones.update(db, item, accion_in.model_dump(exclude_unset=True))
    return model_to_dict(updated)


@router.delete("/{id}")
def delete_accion(id: int, db: Session = Depends(get_db)):
    """Delete an accion."""
    if not crud_acciones.delete(db, id):
        raise HTTPException(status_code=404, detail=f"Accion {id} no encontrada")
    return {"detail": f"Accion {id} eliminada"}
