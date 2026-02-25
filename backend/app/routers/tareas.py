"""Tareas CRUD and search endpoints."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import verify_auth
from app.database import get_db
from app.models import Tarea, AccionRealizada
from app.schemas import TareaCreate, TareaUpdate, SearchRequest, BulkUpdateRequest, BulkUpdateResponse
from app.crud import CRUDBase, model_to_dict
from app.search import search

LOG = logging.getLogger("task_manager_backend")

router = APIRouter(prefix="/tareas", tags=["tareas"], dependencies=[Depends(verify_auth)])
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


def _sync_fecha_siguiente_accion(db: Session, tarea_id: int):
    """Recalculate tarea's fecha_siguiente_accion from pending acciones."""
    max_fecha = (
        db.query(func.max(AccionRealizada.fecha_accion))
        .filter(
            AccionRealizada.tarea_id == tarea_id,
            func.lower(AccionRealizada.estado) == "pendiente",
        )
        .scalar()
    )
    tarea = db.query(Tarea).filter(Tarea.tarea_id == tarea_id).first()
    if tarea:
        tarea.fecha_siguiente_accion = max_fecha
        tarea.fecha_actualizacion = datetime.now()
        db.commit()
        db.refresh(tarea)


@router.post("/bulk-update")
def bulk_update_tareas(req: BulkUpdateRequest, db: Session = Depends(get_db)):
    """Bulk update tareas: change dates or complete pending acciones and create new ones."""
    if not req.tarea_ids:
        raise HTTPException(status_code=400, detail="tarea_ids must not be empty")

    if req.operation == "complete_and_create" and not req.accion:
        raise HTTPException(status_code=400, detail="accion is required for complete_and_create operation")

    updated_tareas = 0
    updated_acciones = 0
    created_acciones = 0

    for tarea_id in req.tarea_ids:
        tarea = db.query(Tarea).filter(Tarea.tarea_id == tarea_id).first()
        if not tarea:
            continue

        if req.operation == "change_date":
            tarea.fecha_siguiente_accion = req.fecha
            tarea.fecha_actualizacion = datetime.now()
            updated_tareas += 1

            pending = db.query(AccionRealizada).filter(
                AccionRealizada.tarea_id == tarea_id,
                func.lower(AccionRealizada.estado) == "pendiente",
            ).all()
            for acc in pending:
                acc.fecha_accion = req.fecha
                acc.fecha_actualizacion = datetime.now()
                updated_acciones += 1

        elif req.operation == "complete_and_create":
            pending = db.query(AccionRealizada).filter(
                AccionRealizada.tarea_id == tarea_id,
                func.lower(AccionRealizada.estado) == "pendiente",
            ).all()
            for acc in pending:
                acc.estado = "Completada"
                acc.fecha_actualizacion = datetime.now()
                updated_acciones += 1

            new_accion = AccionRealizada(
                tarea_id=tarea_id,
                accion=req.accion,
                fecha_accion=req.fecha,
                estado="Pendiente",
            )
            db.add(new_accion)
            created_acciones += 1
            updated_tareas += 1

    db.commit()

    # Sync fecha_siguiente_accion for operations that modify acciones states
    # (skip for change_date — fecha is already set directly on the tarea)
    if req.operation != "change_date":
        for tarea_id in req.tarea_ids:
            _sync_fecha_siguiente_accion(db, tarea_id)

    LOG.info(f"Bulk {req.operation}: {updated_tareas} tareas, {updated_acciones} acciones updated, {created_acciones} acciones created")
    return BulkUpdateResponse(
        updated_tareas=updated_tareas,
        updated_acciones=updated_acciones,
        created_acciones=created_acciones,
    )


@router.post("/{tarea_id}/complete")
def complete_tarea(tarea_id: int, db: Session = Depends(get_db)):
    """Mark a tarea as Completado and all non-completed acciones as Completada."""
    tarea = db.query(Tarea).filter(Tarea.tarea_id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail=f"Tarea {tarea_id} no encontrada")

    tarea.estado = "Completado"
    tarea.fecha_actualizacion = datetime.now()

    pending = db.query(AccionRealizada).filter(
        AccionRealizada.tarea_id == tarea_id,
        ~func.lower(AccionRealizada.estado).in_(["completada", "completado"]),
    ).all()

    for acc in pending:
        acc.estado = "Completada"
        acc.fecha_actualizacion = datetime.now()

    db.commit()
    db.refresh(tarea)

    LOG.info(f"Completed tarea {tarea_id}: {len(pending)} acciones marked as Completada")
    return {"tarea": model_to_dict(tarea), "acciones_updated": len(pending)}


@router.get("/{tarea_id}")
def get_tarea(tarea_id: int, db: Session = Depends(get_db)):
    """Get a tarea by tarea_id."""
    item = crud_tareas.get(db, tarea_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Tarea {tarea_id} no encontrada")
    return model_to_dict(item)


@router.post("/", status_code=201)
def create_tarea(tarea_in: TareaCreate, db: Session = Depends(get_db)):
    """Create a new tarea."""
    item = crud_tareas.create(db, tarea_in.model_dump())
    return model_to_dict(item)


@router.put("/{tarea_id}")
def update_tarea(tarea_id: int, tarea_in: TareaUpdate, db: Session = Depends(get_db)):
    """Update a tarea."""
    item = crud_tareas.get(db, tarea_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Tarea {tarea_id} no encontrada")
    updated = crud_tareas.update(db, item, tarea_in.model_dump(exclude_unset=True))
    return model_to_dict(updated)


@router.delete("/{tarea_id}")
def delete_tarea(tarea_id: int, db: Session = Depends(get_db)):
    """Delete a tarea (cascades to acciones)."""
    if not crud_tareas.delete(db, tarea_id):
        raise HTTPException(status_code=404, detail=f"Tarea {tarea_id} no encontrada")
    return {"detail": f"Tarea {tarea_id} eliminada"}
