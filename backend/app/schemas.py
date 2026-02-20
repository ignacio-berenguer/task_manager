"""Pydantic validation schemas for Task Manager."""

from typing import Any
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
    tarea_id: str
    tarea: str
    responsable: str | None = None
    descripcion: str | None = None
    fecha_siguiente_accion: str | None = None
    tema: str | None = None
    estado: str | None = None


class TareaUpdate(BaseModel):
    tarea: str | None = None
    responsable: str | None = None
    descripcion: str | None = None
    fecha_siguiente_accion: str | None = None
    tema: str | None = None
    estado: str | None = None


# --- Acciones ---

class AccionCreate(BaseModel):
    tarea_id: str
    accion: str
    estado: str | None = None


class AccionUpdate(BaseModel):
    accion: str | None = None
    estado: str | None = None


# --- Estados (parametric) ---

class EstadoCreate(BaseModel):
    valor: str
    orden: int = 0
    color: str | None = None


class EstadoUpdate(BaseModel):
    valor: str | None = None
    orden: int | None = None
    color: str | None = None
