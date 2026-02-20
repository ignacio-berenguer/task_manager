"""
Router for parametric values.
Serves dropdown options for codified fields in entity forms (Feature 037).
Full CRUD management of parametros table (Feature 038).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..models import Parametro
from ..schemas import ParametroCreate, ParametroUpdate

logger = logging.getLogger("portfolio_backend")

router = APIRouter(prefix="/parametros", tags=["Parametros"])


# --- CRUD endpoints (must be before /{nombre_parametro} to avoid route conflicts) ---

@router.get("/")
def list_parametros(
    nombre_parametro: str | None = Query(None, description="Filter by nombre_parametro"),
    db: Session = Depends(get_db),
):
    """List all parametros, optionally filtered by nombre_parametro."""
    query = db.query(Parametro)

    if nombre_parametro:
        query = query.filter(Parametro.nombre_parametro == nombre_parametro)

    query = query.order_by(
        Parametro.nombre_parametro,
        case(
            (Parametro.orden.isnot(None), 0),
            else_=1
        ),
        Parametro.orden,
        Parametro.valor,
    )

    results = query.all()
    data = [
        {
            "id": r.id,
            "nombre_parametro": r.nombre_parametro,
            "valor": r.valor,
            "color": r.color,
            "orden": r.orden,
            "fecha_creacion": r.fecha_creacion.isoformat() if r.fecha_creacion else None,
        }
        for r in results
    ]

    logger.info(f"Parametros list: {len(data)} records" + (f" (filter: {nombre_parametro})" if nombre_parametro else ""))

    return {"data": data, "total": len(data)}


@router.post("/", status_code=201)
def create_parametro(data: ParametroCreate, db: Session = Depends(get_db)):
    """Create a new parametro. Validates unique(nombre_parametro, valor)."""
    obj = Parametro(
        nombre_parametro=data.nombre_parametro,
        valor=data.valor,
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
            detail=f"Parametro '{data.nombre_parametro}' con valor '{data.valor}' ya existe.",
        )

    logger.info(f"Parametro created: {data.nombre_parametro} = {data.valor}")

    return {
        "id": obj.id,
        "nombre_parametro": obj.nombre_parametro,
        "valor": obj.valor,
        "color": obj.color,
        "orden": obj.orden,
        "fecha_creacion": obj.fecha_creacion.isoformat() if obj.fecha_creacion else None,
    }


@router.put("/{id}")
def update_parametro(id: int, data: ParametroUpdate, db: Session = Depends(get_db)):
    """Update a parametro by ID."""
    obj = db.query(Parametro).filter(Parametro.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Parametro not found")

    if data.nombre_parametro is not None:
        obj.nombre_parametro = data.nombre_parametro
    if data.valor is not None:
        obj.valor = data.valor
    if data.color is not None:
        obj.color = data.color if data.color != '' else None
    if data.orden is not None:
        obj.orden = data.orden

    try:
        db.commit()
        db.refresh(obj)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"Parametro '{obj.nombre_parametro}' con valor '{obj.valor}' ya existe.",
        )

    logger.info(f"Parametro updated: id={id}, {obj.nombre_parametro} = {obj.valor}")

    return {
        "id": obj.id,
        "nombre_parametro": obj.nombre_parametro,
        "valor": obj.valor,
        "color": obj.color,
        "orden": obj.orden,
        "fecha_creacion": obj.fecha_creacion.isoformat() if obj.fecha_creacion else None,
    }


@router.delete("/{id}")
def delete_parametro(id: int, db: Session = Depends(get_db)):
    """Delete a parametro by ID."""
    obj = db.query(Parametro).filter(Parametro.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Parametro not found")

    logger.info(f"Parametro deleted: id={id}, {obj.nombre_parametro} = {obj.valor}")

    db.delete(obj)
    db.commit()

    return {"success": True}


# --- Lookup endpoint (original from Feature 037, must be after CRUD routes) ---

@router.get("/{nombre_parametro}")
def get_parametro_values(nombre_parametro: str, db: Session = Depends(get_db)):
    """
    Get sorted list of allowed values for a parametric field.

    Returns values sorted by: explicit orden first, then alphabetically.
    Returns empty list if parameter name not found (graceful degradation).
    """
    results = (
        db.query(Parametro.valor, Parametro.color)
        .filter(Parametro.nombre_parametro == nombre_parametro)
        .order_by(
            case(
                (Parametro.orden.isnot(None), 0),
                else_=1
            ),
            Parametro.orden,
            Parametro.valor,
        )
        .all()
    )

    valores = [{"valor": r[0], "color": r[1]} for r in results]

    logger.debug(f"Parametro '{nombre_parametro}': {len(valores)} values")

    return {
        "nombre_parametro": nombre_parametro,
        "valores": valores,
    }
