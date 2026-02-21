"""Table metadata for Task Manager MCP tools."""

TABLA_DESCRIPCIONES = {
    "tareas": "Tabla principal de tareas. Campos: tarea_id (entero, PK auto-incremental), tarea, responsable, descripcion, fecha_siguiente_accion, tema, estado.",
    "acciones_realizadas": "Acciones realizadas sobre las tareas. Campos: id, tarea_id (entero, FK), accion, estado.",
    "estados_tareas": "Tabla parametrica de estados validos para tareas. Campos: id, valor, orden, color.",
    "estados_acciones": "Tabla parametrica de estados validos para acciones. Campos: id, valor, orden, color.",
}

TABLAS_CON_BUSQUEDA = {"tareas"}


def get_url_prefix(table_name: str) -> str:
    overrides = {
        "acciones_realizadas": "acciones",
        "estados_tareas": "estados-tareas",
        "estados_acciones": "estados-acciones",
    }
    return overrides.get(table_name, table_name)
