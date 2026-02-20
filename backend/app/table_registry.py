"""Table name to SQLAlchemy model mapping."""

from app.models import Tarea, AccionRealizada, EstadoTarea, EstadoAccion

TABLE_MODELS = {
    "tareas": Tarea,
    "acciones_realizadas": AccionRealizada,
    "estados_tareas": EstadoTarea,
    "estados_acciones": EstadoAccion,
}
