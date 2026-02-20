"""11 tool schemas in Anthropic API format for the agent."""

AGENT_TOOLS = [
    {
        "name": "buscar_iniciativas",
        "description": (
            "Buscar iniciativas en la vista consolidada (datos_relevantes) con filtros flexibles, "
            "ordenamiento y paginación. Esta es la herramienta principal para consultas sobre "
            "iniciativas. La tabla datos_relevantes contiene 60+ campos calculados incluyendo "
            "nombre, unidad, framework, estado, importes por año (2024-2028), y más."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "filtros": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "operator": {
                                "type": "string",
                                "enum": ["eq", "ne", "gt", "gte", "lt", "lte", "like", "ilike", "in", "not_in", "is_null", "is_not_null"],
                            },
                            "value": {},
                        },
                        "required": ["field", "operator"],
                    },
                    "description": (
                        'Lista de filtros. Cada filtro tiene "field", "operator" y "value". '
                        'Ejemplo: [{"field": "estado_de_la_iniciativa", "operator": "eq", "value": "En Ejecución"}]'
                    ),
                },
                "orden_campo": {
                    "type": "string",
                    "description": "Campo por el cual ordenar los resultados.",
                },
                "orden_direccion": {
                    "type": "string",
                    "enum": ["asc", "desc"],
                    "description": '"asc" o "desc" (por defecto: "asc").',
                },
                "limite": {
                    "type": "integer",
                    "description": "Máximo de resultados a devolver (por defecto: 50, máximo: 500).",
                },
                "desplazamiento": {
                    "type": "integer",
                    "description": "Desplazamiento para paginación (por defecto: 0).",
                },
            },
        },
    },
    {
        "name": "buscar_en_tabla",
        "description": (
            "Buscar registros en cualquier tabla disponible de la base de datos. "
            "Para las tablas principales (datos_relevantes, iniciativas, hechos, etiquetas, acciones, etc.) "
            "se pueden usar filtros flexibles. Para otras tablas, se obtiene la lista con paginación."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tabla": {
                    "type": "string",
                    "description": 'Nombre de la tabla (ej: "hechos", "etiquetas", "beneficios"). Usa listar_tablas para ver las disponibles.',
                },
                "filtros": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "operator": {"type": "string"},
                            "value": {},
                        },
                        "required": ["field", "operator"],
                    },
                    "description": "Lista de filtros (mismo formato que buscar_iniciativas). Solo para tablas con búsqueda flexible.",
                },
                "orden_campo": {"type": "string", "description": "Campo para ordenar."},
                "orden_direccion": {"type": "string", "enum": ["asc", "desc"]},
                "limite": {"type": "integer", "description": "Máximo de resultados (por defecto: 50, máximo: 500)."},
                "desplazamiento": {"type": "integer", "description": "Desplazamiento para paginación."},
            },
            "required": ["tabla"],
        },
    },
    {
        "name": "obtener_iniciativa",
        "description": (
            "Obtener todos los datos de una iniciativa específica de todas las tablas relacionadas. "
            "Devuelve datos relevantes calculados, hechos, etiquetas, documentos, notas, acciones, y más."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "portfolio_id": {
                    "type": "string",
                    "description": 'Identificador de la iniciativa (ej: "SPA_25_001").',
                },
            },
            "required": ["portfolio_id"],
        },
    },
    {
        "name": "obtener_documentos",
        "description": (
            "Obtener resúmenes de documentos asociados a iniciativas. "
            "Puede filtrar por portfolio_id o buscar en el texto de los resúmenes. "
            "Los documentos incluyen resúmenes generados por IA y metadatos del archivo."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "portfolio_id": {
                    "type": "string",
                    "description": 'Filtrar documentos de una iniciativa específica (ej: "SPA_25_001").',
                },
                "texto_busqueda": {
                    "type": "string",
                    "description": "Buscar en resúmenes y nombres de documentos (búsqueda parcial).",
                },
                "estado": {
                    "type": "string",
                    "enum": ["Pendiente", "Completado", "Error", "Ignorado"],
                    "description": "Filtrar por estado del procesamiento.",
                },
                "limite": {
                    "type": "integer",
                    "description": "Máximo de resultados (por defecto: 50).",
                },
            },
        },
    },
    {
        "name": "contar_iniciativas",
        "description": (
            "Contar iniciativas agrupadas por un campo (ej: estado, unidad, framework). "
            'Útil para distribuciones como "¿cuántas iniciativas hay por estado?" '
            'o "¿cuántas iniciativas tiene cada unidad?".'
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "campo_agrupacion": {
                    "type": "string",
                    "description": (
                        "Campo de datos_relevantes por el que agrupar. "
                        'Ejemplos: "estado_de_la_iniciativa", "unidad", "digital_framework_level_1", '
                        '"cluster", "tipo", "estado_agrupado".'
                    ),
                },
                "filtros": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "operator": {"type": "string"},
                            "value": {},
                        },
                        "required": ["field", "operator"],
                    },
                    "description": "Filtros previos a la agrupación (mismo formato que buscar_iniciativas).",
                },
            },
            "required": ["campo_agrupacion"],
        },
    },
    {
        "name": "totalizar_importes",
        "description": (
            "Sumar un campo de importe agrupado por una dimensión. "
            'Útil para presupuestos totales, facturación acumulada, etc. '
            'Ejemplos: "presupuesto total 2025 por unidad", "importe aprobado por framework".'
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "campo_importe": {
                    "type": "string",
                    "description": (
                        'Campo numérico a sumar. Ejemplos: "importe_2025", "budget_2025", '
                        '"importe_aprobado_2025", "importe_facturacion_2025", "importe_sm200_2025".'
                    ),
                },
                "campo_agrupacion": {
                    "type": "string",
                    "description": (
                        "Campo por el que agrupar. Si no se indica, devuelve solo el total global. "
                        'Ejemplos: "unidad", "estado_de_la_iniciativa", "digital_framework_level_1".'
                    ),
                },
                "filtros": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "operator": {"type": "string"},
                            "value": {},
                        },
                        "required": ["field", "operator"],
                    },
                    "description": "Filtros previos a la agregación.",
                },
            },
            "required": ["campo_importe"],
        },
    },
    {
        "name": "listar_tablas",
        "description": (
            "Listar todas las tablas disponibles con su descripción, número de registros, "
            "y si soportan búsqueda con filtros flexibles. No requiere parámetros."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "describir_tabla",
        "description": (
            "Obtener los nombres de las columnas/campos disponibles en una tabla específica. "
            "Útil para saber qué campos se pueden usar en filtros y consultas."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tabla": {
                    "type": "string",
                    "description": 'Nombre de la tabla (ej: "datos_relevantes", "hechos", "etiquetas").',
                },
            },
            "required": ["tabla"],
        },
    },
    {
        "name": "obtener_valores_campo",
        "description": (
            "Obtener los valores distintos de un campo en una tabla. "
            "Útil para conocer las opciones de filtrado disponibles, como los posibles estados, "
            "unidades, frameworks, clusters, etc."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tabla": {
                    "type": "string",
                    "description": 'Nombre de la tabla (ej: "datos_relevantes", "hechos").',
                },
                "campo": {
                    "type": "string",
                    "description": 'Nombre del campo (ej: "estado_de_la_iniciativa", "unidad").',
                },
                "limite": {
                    "type": "integer",
                    "description": "Máximo de valores distintos a devolver (por defecto: 100).",
                },
            },
            "required": ["tabla", "campo"],
        },
    },
    {
        "name": "generar_grafico",
        "description": (
            "Genera un gráfico visual a partir de datos del portfolio. "
            "Modo consulta: proporciona campo_agrupacion para consultar datos_relevantes automáticamente. "
            "Modo directo: proporciona datos como lista de {etiqueta, valor} con datos ya obtenidos. "
            "Tipos: barra, barra_horizontal, tarta, linea, barra_apilada. "
            "El gráfico se muestra como imagen en la respuesta."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tipo_grafico": {
                    "type": "string",
                    "enum": ["barra", "barra_horizontal", "tarta", "linea", "barra_apilada"],
                    "description": (
                        "Tipo de gráfico. barra: barras verticales, barra_horizontal: barras horizontales, "
                        "tarta: circular/donut, linea: líneas con puntos, barra_apilada: barras apiladas multiserie."
                    ),
                },
                "titulo": {
                    "type": "string",
                    "description": "Título del gráfico.",
                },
                "datos": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "etiqueta": {"type": "string"},
                            "valor": {"type": "number"},
                            "valores": {
                                "type": "object",
                                "description": "Para barra_apilada: dict con series como claves y valores numéricos.",
                            },
                        },
                        "required": ["etiqueta"],
                    },
                    "description": (
                        "Datos directos. Cada elemento tiene 'etiqueta' y 'valor' (o 'valores' para barra_apilada). "
                        'Ejemplo: [{"etiqueta": "En Ejecución", "valor": 95}]'
                    ),
                },
                "campo_agrupacion": {
                    "type": "string",
                    "description": (
                        "Campo de datos_relevantes para agrupar (modo consulta). "
                        'Ejemplos: "estado_de_la_iniciativa", "unidad", "digital_framework_level_1".'
                    ),
                },
                "campo_valor": {
                    "type": "string",
                    "description": (
                        "Campo numérico a sumar por grupo (modo consulta). Si no se indica, cuenta iniciativas. "
                        'Ejemplos: "budget_2025", "importe_2025".'
                    ),
                },
                "filtros": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {"type": "string"},
                            "operator": {"type": "string"},
                            "value": {},
                        },
                        "required": ["field", "operator"],
                    },
                    "description": "Filtros previos a la agrupación (modo consulta).",
                },
                "opciones": {
                    "type": "object",
                    "description": (
                        "Opciones de personalización. Claves: subtitulo, etiqueta_x, etiqueta_y, "
                        'mostrar_valores (bool), formato_valor ("numero"/"moneda"/"porcentaje"), '
                        "max_categorias (int), ancho (int), alto (int)."
                    ),
                },
            },
            "required": ["tipo_grafico", "titulo"],
        },
    },
    {
        "name": "ejecutar_consulta_sql",
        "description": (
            "Ejecutar una consulta SQL SELECT de solo lectura contra la base de datos del portfolio. "
            "Usa esta herramienta cuando las herramientas existentes no pueden responder la pregunta "
            "porque requiere JOINs entre tablas, subconsultas, CTEs, agregaciones complejas "
            "(GROUP BY con HAVING, funciones de ventana), o combinar datos de tablas sin búsqueda flexible. "
            "Solo se permiten consultas SELECT; cualquier intento de modificar datos será rechazado."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "consulta_sql": {
                    "type": "string",
                    "description": (
                        "Consulta SQL SELECT a ejecutar. Debe ser una única sentencia SELECT válida. "
                        'Ejemplo: "SELECT d.portfolio_id, d.nombre, COUNT(h.id_hecho) as num_hechos '
                        "FROM datos_relevantes d LEFT JOIN hechos h ON d.portfolio_id = h.portfolio_id "
                        'GROUP BY d.portfolio_id, d.nombre"'
                    ),
                },
                "explicacion": {
                    "type": "string",
                    "description": (
                        "Breve explicación de por qué se generó esta consulta SQL de esta manera. "
                        "Se incluirá en la respuesta para transparencia del usuario."
                    ),
                },
                "limite_filas": {
                    "type": "integer",
                    "description": "Máximo de filas a devolver (por defecto: 500, máximo: 1000).",
                },
            },
            "required": ["consulta_sql"],
        },
    },
]
