"""
Router for etiquetas destacadas (highlighted etiquetas).
CRUD management of the etiquetas_destacadas parametric table (Feature 042).
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import EtiquetaDestacada
from ..schemas import EtiquetaDestacadaCreate, EtiquetaDestacadaUpdate

logger = logging.getLogger("portfolio_backend")

router = APIRouter(prefix="/etiquetas-destacadas", tags=["Etiquetas Destacadas"])


def _to_dict(obj):
    return {
        "id": obj.id,
        "etiqueta": obj.etiqueta,
        "color": obj.color,
        "orden": obj.orden,
        "fecha_creacion": obj.fecha_creacion.isoformat() if obj.fecha_creacion else None,
        "fecha_actualizacion": obj.fecha_actualizacion.isoformat() if obj.fecha_actualizacion else None,
    }


@router.get("/")
def list_etiquetas_destacadas(db: Session = Depends(get_db)):
    """List all etiquetas destacadas, ordered by orden then etiqueta."""
    results = (
        db.query(EtiquetaDestacada)
        .order_by(
            case(
                (EtiquetaDestacada.orden.isnot(None), 0),
                else_=1
            ),
            EtiquetaDestacada.orden,
            EtiquetaDestacada.etiqueta,
        )
        .all()
    )

    data = [_to_dict(r) for r in results]
    logger.info(f"Etiquetas destacadas list: {len(data)} records")
    return {"data": data, "total": len(data)}


@router.post("/", status_code=201)
def create_etiqueta_destacada(data: EtiquetaDestacadaCreate, db: Session = Depends(get_db)):
    """Create a new etiqueta destacada. Validates unique etiqueta."""
    obj = EtiquetaDestacada(
        etiqueta=data.etiqueta,
        color=data.color,
        orden=data.orden,
    )
    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Etiqueta destacada '{data.etiqueta}' ya existe.",
        )

    logger.info(f"Etiqueta destacada created: {data.etiqueta}")
    return _to_dict(obj)


@router.put("/{id}")
def update_etiqueta_destacada(id: int, data: EtiquetaDestacadaUpdate, db: Session = Depends(get_db)):
    """Update an etiqueta destacada by ID."""
    obj = db.query(EtiquetaDestacada).filter(EtiquetaDestacada.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Etiqueta destacada not found")

    if data.etiqueta is not None:
        obj.etiqueta = data.etiqueta
    if data.color is not None:
        obj.color = data.color
    if data.orden is not None:
        obj.orden = data.orden
    obj.fecha_actualizacion = datetime.now()

    try:
        db.commit()
        db.refresh(obj)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Etiqueta destacada '{obj.etiqueta}' ya existe.",
        )

    logger.info(f"Etiqueta destacada updated: id={id}, {obj.etiqueta}")
    return _to_dict(obj)


@router.delete("/{id}")
def delete_etiqueta_destacada(id: int, db: Session = Depends(get_db)):
    """Delete an etiqueta destacada by ID."""
    obj = db.query(EtiquetaDestacada).filter(EtiquetaDestacada.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Etiqueta destacada not found")

    logger.info(f"Etiqueta destacada deleted: id={id}, {obj.etiqueta}")
    db.delete(obj)
    db.commit()
    return {"success": True}
