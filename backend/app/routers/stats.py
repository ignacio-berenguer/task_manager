"""
Stats router — aggregated overview statistics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Iniciativa, DatosRelevante
from ..schemas import StatsOverview
from ..table_registry import TABLE_MODELS

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/overview", response_model=StatsOverview)
def get_overview(db: Session = Depends(get_db)):
    """Return aggregated portfolio stats for the landing page."""
    total_iniciativas = db.query(func.count(Iniciativa.id)).scalar() or 0

    presupuesto_total = (
        db.query(func.coalesce(func.sum(DatosRelevante.budget_2025), 0)).scalar()
    )

    iniciativas_aprobadas = (
        db.query(func.count(DatosRelevante.portfolio_id))
        .filter(DatosRelevante.estado_aprobacion == "Aprobada")
        .scalar()
    ) or 0

    en_ejecucion = (
        db.query(func.count(DatosRelevante.portfolio_id))
        .filter(DatosRelevante.estado_ejecucion.ilike("%ejecuci%"))
        .scalar()
    ) or 0

    return StatsOverview(
        total_iniciativas=total_iniciativas,
        presupuesto_total=presupuesto_total,
        total_tablas=len(TABLE_MODELS),
        iniciativas_aprobadas=iniciativas_aprobadas,
        en_ejecucion=en_ejecucion,
    )
