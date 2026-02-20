"""
Router for cross-table portfolio search.
"""
import json
import logging
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from ..database import get_db
from ..table_registry import TABLE_MODELS
from ..schemas import PortfolioSearchRequest
from ..crud import model_to_dict, model_to_dict_with_calculated
from ..models import (
    DatosDescriptivo, Etiqueta, EtiquetaDestacada, GrupoIniciativa,
    Hecho, Nota, TransaccionJson, Transaccion,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/portfolio", tags=["Portfolio Search"])


# Mapping from legacy Excel sheet names (transacciones.tabla) to app entity names
_LEGACY_TABLE_MAP = {
    "PortfolioDigital_Master_DatosDescriptivos": "datos_descriptivos",
    "PortfolioDigital_Master_InformacionEconomica": "informacion_economica",
    "PortfolioDigital_Master_Etiquetas": "etiquetas",
    "PortfolioDigital_Master_Hechos": "hechos",
    "PortfolioDigital_Master_Acciones": "acciones",
    "PortfolioDigital_Master_Justificaciones": "justificaciones",
    "PortfolioDigital_Master_Descripciones": "descripciones",
    "PortfolioDigital_Master_LTP": "ltp",
    "PortfolioDigital_Master_WBEs": "wbes",
    "PortfolioDigital_Master_Dependencias": "dependencias",
    "PortfolioDigital_Master_GruposIniciativas": "grupos_iniciativas",
    "PortfolioDigital_Master_EstadoEspecial": "estado_especial",
    "PortfolioDigital_Master_ImpactoAATT": "impacto_aatt",
    "PortfolioDigital_Master_Notas": "notas",
    "PortfolioDigital_Master_Beneficios": "beneficios",
    "PortfolioDigital_Master_Facturacion": "facturacion",
}


@router.get("/{portfolio_id}/history")
def get_section_history(
    portfolio_id: str,
    entity: str = Query(..., description="Entity name to filter history for"),
    db: Session = Depends(get_db),
):
    """
    Get unified edit history for a specific entity/section combining both
    transacciones_json (app CRUD) and legacy transacciones (Excel imports).
    """
    results = []

    # 1. transacciones_json records (app-level CRUD)
    tj_records = db.query(TransaccionJson).filter(
        TransaccionJson.portfolio_id == portfolio_id,
        TransaccionJson.entidad == entity,
    ).all()

    for t in tj_records:
        results.append({
            "id": f"tj_{t.id}",
            "source": "app",
            "fecha_creacion": t.fecha_creacion.isoformat() if t.fecha_creacion else None,
            "usuario": t.usuario,
            "tipo_operacion": t.tipo_operacion,
            "estado_db": t.estado_db,
            "mensaje_commit": t.mensaje_commit,
            "clave_primaria": t.clave_primaria,
            "cambios": t.cambios,
        })

    # 2. Legacy transacciones records (Excel-based audit trail)
    # Find which legacy tabla names map to this entity
    legacy_tablas = [k for k, v in _LEGACY_TABLE_MAP.items() if v == entity]

    if legacy_tablas:
        legacy_records = db.query(Transaccion).filter(
            Transaccion.clave1 == portfolio_id,
            Transaccion.tabla.in_(legacy_tablas),
        ).all()

        for t in legacy_records:
            # Build a cambios-like JSON from the field-level change
            cambios = {}
            if t.campo_tabla and t.valor_nuevo is not None:
                cambios[t.campo_tabla] = t.valor_nuevo
                if t.valor_antes_del_cambio:
                    cambios[f"{t.campo_tabla} (antes)"] = t.valor_antes_del_cambio

            results.append({
                "id": f"tx_{t.id}",
                "source": "excel",
                "fecha_creacion": t.fecha_registro_cambio,
                "usuario": None,
                "tipo_operacion": t.tipo_cambio or "UPDATE",
                "estado_db": t.estado_cambio or "EJECUTADO",
                "mensaje_commit": t.comentarios,
                "clave_primaria": None,
                "cambios": json.dumps(cambios) if cambios else None,
            })

    # Sort by date descending
    results.sort(key=lambda x: x["fecha_creacion"] or "", reverse=True)

    return {"portfolio_id": portfolio_id, "entity": entity, "history": results}


@router.get("/{portfolio_id}/related")
def get_related_initiatives(portfolio_id: str, db: Session = Depends(get_db)):
    """
    Find initiatives related to the given portfolio_id by:
    - Shared etiquetas destacadas (only tags that are in the etiquetas_destacadas table)
    - Same grupo de iniciativas (shared parent or sibling components)
    """
    related = defaultdict(list)  # portfolio_id -> list of reason dicts

    # 1. Shared etiquetas destacadas only
    # Get the set of highlighted tag names
    destacadas = db.query(EtiquetaDestacada.etiqueta).all()
    destacada_names = {row[0].lower() for row in destacadas if row[0]}

    if destacada_names:
        # Get current initiative's etiquetas that are also destacadas
        current_tags = db.query(Etiqueta.etiqueta).filter(
            Etiqueta.portfolio_id == portfolio_id,
            Etiqueta.etiqueta.isnot(None),
        ).all()
        current_destacada_tags = [
            t[0] for t in current_tags if t[0] and t[0].lower() in destacada_names
        ]

        if current_destacada_tags:
            tag_matches = db.query(
                Etiqueta.portfolio_id, Etiqueta.etiqueta
            ).filter(
                Etiqueta.etiqueta.in_(current_destacada_tags),
                Etiqueta.portfolio_id != portfolio_id,
            ).all()
            for pid, tag in tag_matches:
                related[pid].append({"type": "etiqueta", "value": tag})

    # 2. Same grupo de iniciativas
    # Find all groups this initiative belongs to (as grupo or componente)
    as_grupo = db.query(GrupoIniciativa).filter(
        GrupoIniciativa.portfolio_id_grupo == portfolio_id
    ).all()
    as_componente = db.query(GrupoIniciativa).filter(
        GrupoIniciativa.portfolio_id_componente == portfolio_id
    ).all()

    # If this initiative is a grupo: its components are related
    for g in as_grupo:
        if g.portfolio_id_componente and g.portfolio_id_componente != portfolio_id:
            group_label = g.nombre_grupo or g.portfolio_id_grupo
            related[g.portfolio_id_componente].append({
                "type": "grupo",
                "value": f"Componente de {group_label}",
            })

    # If this initiative is a componente: the grupo and its other components are related
    for c in as_componente:
        grupo_pid = c.portfolio_id_grupo
        if grupo_pid and grupo_pid != portfolio_id:
            group_label = c.nombre_grupo or grupo_pid
            related[grupo_pid].append({
                "type": "grupo",
                "value": f"Grupo: {group_label}",
            })

        # Find sibling components in the same group
        if grupo_pid:
            siblings = db.query(GrupoIniciativa).filter(
                GrupoIniciativa.portfolio_id_grupo == grupo_pid,
                GrupoIniciativa.portfolio_id_componente != portfolio_id,
                GrupoIniciativa.portfolio_id_componente.isnot(None),
            ).all()
            for s in siblings:
                group_label = s.nombre_grupo or grupo_pid
                related[s.portfolio_id_componente].append({
                    "type": "grupo",
                    "value": f"Mismo grupo: {group_label}",
                })

    # 3. Deduplicate reasons per portfolio_id (same type+value)
    for pid in related:
        seen = set()
        unique = []
        for r in related[pid]:
            key = (r["type"], r["value"])
            if key not in seen:
                seen.add(key)
                unique.append(r)
        related[pid] = unique

    # 4. Enrich with nombre and sort by number of reasons
    nombres = {}
    if related:
        name_rows = db.query(
            DatosDescriptivo.portfolio_id, DatosDescriptivo.nombre
        ).filter(
            DatosDescriptivo.portfolio_id.in_(list(related.keys()))
        ).all()
        nombres = {pid: nombre for pid, nombre in name_rows}

    result = []
    for pid, reasons in related.items():
        result.append({
            "portfolio_id": pid,
            "nombre": nombres.get(pid, ""),
            "reasons": reasons,
        })

    # Sort by number of reasons (most related first), then by portfolio_id
    result.sort(key=lambda x: (-len(x["reasons"]), x["portfolio_id"]))

    # Limit to 20
    result = result[:20]

    return {"portfolio_id": portfolio_id, "related": result}


@router.get("/{portfolio_id}/timeline")
def get_portfolio_timeline(
    portfolio_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Unified activity timeline combining hechos, notas, and transacciones_json
    into a single chronological view.
    """
    timeline = []

    # 1. Hechos
    hechos = db.query(Hecho).filter(Hecho.portfolio_id == portfolio_id).all()
    for h in hechos:
        importe_str = ""
        if h.importe is not None:
            importe_str = f" — {h.importe:,.0f} EUR".replace(",", ".")
        summary = f"{h.estado or 'Sin estado'}{importe_str}"
        detail = f"Partida: {h.partida_presupuestaria}" if h.partida_presupuestaria else None
        timeline.append({
            "date": h.fecha or (h.fecha_creacion.isoformat() if h.fecha_creacion else ""),
            "type": "hecho",
            "summary": summary,
            "detail": detail,
            "user": None,
            "badge": h.estado,
            "source_id": h.id_hecho,
        })

    # 2. Notas
    notas = db.query(Nota).filter(Nota.portfolio_id == portfolio_id).all()
    for n in notas:
        nota_text = n.nota or ""
        summary = nota_text[:200] + ("..." if len(nota_text) > 200 else "")
        timeline.append({
            "date": n.fecha or (n.fecha_creacion.isoformat() if n.fecha_creacion else ""),
            "type": "nota",
            "summary": summary,
            "detail": None,
            "user": n.registrado_por,
            "badge": None,
            "source_id": n.id,
        })

    # 3. Transacciones JSON
    txns = db.query(TransaccionJson).filter(
        TransaccionJson.portfolio_id == portfolio_id
    ).all()
    for t in txns:
        summary = f"{t.tipo_operacion} en {t.entidad}"
        # Build detail from cambios
        detail = None
        if t.cambios:
            try:
                cambios = json.loads(t.cambios)
                fields = list(cambios.keys())[:3]
                detail = f"Campos: {', '.join(fields)}"
            except (json.JSONDecodeError, TypeError):
                pass
        timeline.append({
            "date": t.fecha_creacion.isoformat() if t.fecha_creacion else "",
            "type": "transaccion",
            "summary": summary,
            "detail": detail or t.mensaje_commit,
            "user": t.usuario,
            "badge": t.tipo_operacion,
            "source_id": t.id,
        })

    # 4. Sort by date descending
    timeline.sort(key=lambda x: x["date"] or "", reverse=True)

    total = len(timeline)

    # 5. Paginate
    paginated = timeline[offset:offset + limit]

    return {
        "portfolio_id": portfolio_id,
        "total": total,
        "timeline": paginated,
    }


@router.get("/{portfolio_id}")
def get_portfolio_data(portfolio_id: str, db: Session = Depends(get_db)):
    """
    Get all data for a specific portfolio_id across all tables.

    Returns a dictionary with data from each table that has records
    for the given portfolio_id.
    """
    result = {}

    def to_dict(obj, tname):
        return model_to_dict_with_calculated(db, obj, tname)

    for table_name, model in TABLE_MODELS.items():
        # Special case: transacciones uses clave1 instead of portfolio_id
        if table_name == "transacciones":
            objs = db.query(model).filter(model.clave1 == portfolio_id).all()
            if objs:
                result[table_name] = [to_dict(obj, table_name) for obj in objs]
            continue

        # Special case: grupos_iniciativas needs both parent and component relationships
        if table_name == "grupos_iniciativas":
            # Records where this initiative is the parent (grupo)
            as_grupo = db.query(model).filter(model.portfolio_id_grupo == portfolio_id).all()
            # Records where this initiative is a component
            as_componente = db.query(model).filter(model.portfolio_id_componente == portfolio_id).all()

            grupos_data = {
                "as_grupo": [to_dict(obj, table_name) for obj in as_grupo] if as_grupo else [],
                "as_componente": [to_dict(obj, table_name) for obj in as_componente] if as_componente else [],
            }

            if as_grupo or as_componente:
                result[table_name] = grupos_data
            continue

        if not hasattr(model, "portfolio_id"):
            continue

        if table_name == "datos_relevantes":
            # datos_relevantes uses portfolio_id as primary key
            obj = db.query(model).filter(model.portfolio_id == portfolio_id).first()
            if obj:
                result[table_name] = to_dict(obj, table_name)
        else:
            objs = db.query(model).filter(model.portfolio_id == portfolio_id).all()
            if objs:
                result[table_name] = [to_dict(obj, table_name) for obj in objs]

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for portfolio_id: {portfolio_id}"
        )

    logger.info(f"Portfolio search for {portfolio_id}: found data in {len(result)} tables")
    return result


@router.post("/search")
def search_portfolios(request: PortfolioSearchRequest, db: Session = Depends(get_db)):
    """
    Search across tables by portfolio_ids.

    Args:
        request: Contains portfolio_ids list and optional tables filter

    Returns:
        Dictionary with portfolio_id as key, containing data from requested tables
    """
    if not request.portfolio_ids:
        raise HTTPException(status_code=400, detail="portfolio_ids is required")

    # Determine which tables to search
    tables_to_search = request.tables if request.tables else list(TABLE_MODELS.keys())

    # Validate table names
    invalid_tables = set(tables_to_search) - set(TABLE_MODELS.keys())
    if invalid_tables:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid table names: {', '.join(invalid_tables)}"
        )

    result = {}

    def to_dict(obj, tname):
        return model_to_dict_with_calculated(db, obj, tname)

    for portfolio_id in request.portfolio_ids:
        portfolio_data = {}

        for table_name in tables_to_search:
            model = TABLE_MODELS[table_name]

            # Special case: transacciones uses clave1 instead of portfolio_id
            if table_name == "transacciones":
                objs = db.query(model).filter(model.clave1 == portfolio_id).all()
                if objs:
                    portfolio_data[table_name] = [to_dict(obj, table_name) for obj in objs]
                continue

            if not hasattr(model, "portfolio_id"):
                continue

            if table_name == "datos_relevantes":
                obj = db.query(model).filter(model.portfolio_id == portfolio_id).first()
                if obj:
                    portfolio_data[table_name] = to_dict(obj, table_name)
            else:
                objs = db.query(model).filter(model.portfolio_id == portfolio_id).all()
                if objs:
                    portfolio_data[table_name] = [to_dict(obj, table_name) for obj in objs]

        if portfolio_data:
            result[portfolio_id] = portfolio_data

    logger.info(
        f"Portfolio bulk search: {len(request.portfolio_ids)} requested, "
        f"{len(result)} found with data"
    )

    return result
