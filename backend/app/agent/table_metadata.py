"""Static table metadata for Task Manager agent."""

TABLA_DESCRIPCIONES = {
    "tareas": "Tabla principal de tareas. Contiene tarea_id, tarea (descripcion breve), responsable, descripcion (detalle), fecha_siguiente_accion, tema, estado.",
    "acciones_realizadas": "Acciones realizadas sobre las tareas. Relacionada con tarea_id. Contiene accion (texto de la accion) y estado.",
    "estados_tareas": "Tabla parametrica con los valores validos de estado para tareas (valor, orden, color).",
    "estados_acciones": "Tabla parametrica con los valores validos de estado para acciones (valor, orden, color).",
}

TABLAS_CON_BUSQUEDA = {"tareas"}


def get_url_prefix(table_name: str) -> str:
    """Get the API URL prefix for a table."""
    overrides = {
        "acciones_realizadas": "acciones",
        "estados_tareas": "estados-tareas",
        "estados_acciones": "estados-acciones",
    }
    return overrides.get(table_name, table_name)
