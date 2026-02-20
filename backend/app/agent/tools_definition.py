"""Tool definitions for Task Manager agent."""

AGENT_TOOLS = [
    {
        "name": "buscar_tareas",
        "description": "Busca tareas con filtros flexibles. Permite filtrar por cualquier campo de la tabla tareas usando operadores como eq, ne, ilike, in, is_null, etc.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filtros": {
                    "type": "array",
                    "description": "Lista de filtros. Cada filtro tiene field, operator y value.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "operator": {"type": "string", "enum": ["eq", "ne", "gt", "gte", "lt", "lte", "like", "ilike", "in", "not_in", "is_null", "is_not_null"]},
                            "value": {}
                        },
                        "required": ["field", "operator"]
                    }
                },
                "orden_campo": {"type": "string", "description": "Campo para ordenar resultados"},
                "orden_direccion": {"type": "string", "enum": ["asc", "desc"], "default": "asc"},
                "limite": {"type": "integer", "default": 50, "description": "Maximo de resultados"},
                "desplazamiento": {"type": "integer", "default": 0}
            }
        }
    },
    {
        "name": "obtener_tarea",
        "description": "Obtiene los datos completos de una tarea por su tarea_id, incluyendo todas sus acciones realizadas.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tarea_id": {"type": "string", "description": "Identificador de la tarea"}
            },
            "required": ["tarea_id"]
        }
    },
    {
        "name": "buscar_acciones",
        "description": "Obtiene las acciones realizadas de una tarea especifica.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tarea_id": {"type": "string", "description": "Identificador de la tarea"}
            },
            "required": ["tarea_id"]
        }
    },
    {
        "name": "listar_estados",
        "description": "Lista los valores parametricos de estado para tareas y acciones.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tipo": {
                    "type": "string",
                    "enum": ["tareas", "acciones"],
                    "description": "Tipo de estados a listar"
                }
            },
            "required": ["tipo"]
        }
    },
]
