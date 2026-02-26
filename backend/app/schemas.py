"""Pydantic validation schemas for Task Manager."""

from datetime import date
from typing import Any, Literal
from pydantic import BaseModel


# --- Search ---

class SearchFilter(BaseModel):
    field: str
    operator: str  # eq, ne, gt, gte, lt, lte, like, ilike, in, not_in, is_null, is_not_null
    value: Any = None


class SearchRequest(BaseModel):
    filters: list[SearchFilter] = []
    order_by: str | None = None
    order_dir: str = "asc"
    limit: int = 50
    offset: int = 0


class PaginatedResponse(BaseModel):
    total: int
    data: list[dict]
    limit: int
    offset: int


# --- Tareas ---

class TareaCreate(BaseModel):
    tarea: str
    responsable: str | None = None
    descripcion: str | None = None
    fecha_siguiente_accion: date | None = None
    tema: str | None = None
    estado: str | None = None
    notas_anteriores: str | None = None


class TareaUpdate(BaseModel):
    tarea: str | None = None
    responsable: str | None = None
    descripcion: str | None = None
    fecha_siguiente_accion: date | None = None
    tema: str | None = None
    estado: str | None = None
    notas_anteriores: str | None = None


# --- Acciones ---

class AccionCreate(BaseModel):
    tarea_id: int
    accion: str
    fecha_accion: date | None = None
    estado: str | None = None


class AccionUpdate(BaseModel):
    accion: str | None = None
    fecha_accion: date | None = None
    estado: str | None = None


class CompleteAndScheduleRequest(BaseModel):
    tarea_id: int
    accion_completada: str
    accion_siguiente: str | None = None
    fecha_siguiente: date
    accion_existente_id: int | None = None


# --- Estados (parametric) ---

class EstadoCreate(BaseModel):
    valor: str
    orden: int = 0
    color: str | None = None


class EstadoUpdate(BaseModel):
    valor: str | None = None
    orden: int | None = None
    color: str | None = None


# --- Responsables (parametric) ---

class ResponsableCreate(BaseModel):
    valor: str
    orden: int = 0


class ResponsableUpdate(BaseModel):
    valor: str | None = None
    orden: int | None = None


# --- Bulk Operations ---

class BulkUpdateRequest(BaseModel):
    tarea_ids: list[int]
    operation: Literal["change_date", "complete_and_create"]
    fecha: date
    accion: str | None = None  # required for complete_and_create


class BulkUpdateResponse(BaseModel):
    updated_tareas: int
    updated_acciones: int
    created_acciones: int
