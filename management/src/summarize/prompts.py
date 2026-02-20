"""Prompt templates and JSON schemas per document type for LLM summarization."""

from dataclasses import dataclass


@dataclass
class PromptTemplate:
    """Prompt configuration for a document type."""
    system_prompt: str
    json_schema_description: str


# Document types that should be skipped (marked as "Ignorado")
SKIP_DOCUMENT_TYPES: set[str] = {"Approval Form"}


# JSON schema description for SM100 documents (initial request / solicitud inicial)
_SM100_JSON_SCHEMA = """\
{
  "resumen": "Resumen ejecutivo del documento (2-3 parrafos)",
  "titulo_documento": "Titulo principal del documento: el texto grande y destacado que aparece en la primera pagina/portada (por ejemplo 'SM100 Repositorio AGUI VCR Secundaria'). NO usar subtitulos ni titulos de secciones internas.",
  "puntos_clave": ["Punto clave 1", "Punto clave 2", "..."],
  "introduccion": "Texto de la introduccion del documento (de la seccion Introduction)",
  "alcance": "Alcance del proyecto mencionado en el documento",
  "requerimientos_funcionales": ["Requerimiento funcional 1", "Requerimiento funcional 2", "..."],
  "descripcion_requerimientos_funcionales": "Descripcion detallada de los requerimientos funcionales mencionados (en la seccion Description of Requirements)",
  "escrito_por": "Nombre de la persona en la fila 'Written by:' de la tabla de la portada (por ejemplo 'Carlos Sanchez Ospina'). Buscar una tabla con filas Written by / Verified by / Approved by cerca del final de la primera pagina.",
  "fecha_elaboracion": "Fecha que aparece en la misma fila de 'Written by:' en la tabla de la portada (por ejemplo '21/07/2025'). Es la fecha junto al nombre del autor.",
  "verificado_por": "Nombre de la persona en la fila 'Verified by:' de la tabla de la portada (por ejemplo 'Daniel Bernado Fernandez').",
}"""

# JSON schema description for SM200 documents (detailed request / solicitud detallada)
_SM200_JSON_SCHEMA = """\
{
  "resumen": "Resumen ejecutivo del documento (2-3 parrafos)",
  "titulo_documento": "Titulo principal del documento: el texto grande y destacado que aparece en la primera pagina/portada (por ejemplo 'SM200 Cambio Referencia Catastral'). NO usar subtitulos ni titulos de secciones internas.",
  "puntos_clave": ["Punto clave 1", "Punto clave 2", "..."],
  "introduccion": "Texto de la introduccion del documento (de la seccion Introduction)",
  "alcance": "Alcance del proyecto mencionado en el documento elaborado a partir de toda la informacion disponible en el documento",
  "descripcion_proyecto": "Descripcion detallada del proyecto (de la seccion Project Description)",
  "requisitos_tecnicos": ["Requisito tecnico 1", "Requisito tecnico 2"],
  "estimacion_costes": "Estimacion de costes descrita en el documento (de la seccion Cost Estimation)",
  "plan_proyecto": "Plan del proyecto descrito en el documento (de la seccion Project Schedule)",
  "escrito_por": "Nombre de la persona en la fila 'Written by:' de la tabla de la portada (por ejemplo 'Carlos Sanchez Ospina'). Buscar una tabla con filas Written by / Verified by / Approved by cerca del final de la primera pagina.",
  "fecha_elaboracion": "Fecha que aparece en la misma fila de 'Written by:' en la tabla de la portada (por ejemplo '21/07/2025'). Es la fecha junto al nombre del autor.",
  "verificado_por": "Nombre de la persona en la fila 'Verified by:' de la tabla de la portada (por ejemplo 'Daniel Bernado Fernandez').",
}"""

# JSON schema for generic/default documents
_DEFAULT_JSON_SCHEMA = """\
{
  "resumen": "Resumen ejecutivo del documento (2-3 párrafos)",
  "puntos_clave": ["Punto clave 1", "Punto clave 2", "..."],
  "categoria": "Categoría o tipo de contenido del documento",
  "temas_principales": ["Tema 1", "Tema 2"],
  "datos_relevantes": "Datos, cifras o fechas relevantes mencionados"
}"""


_BASE_SYSTEM_PROMPT = """\
Eres un asistente experto en análisis de documentos de proyectos IT y portfolio digital. \
Tu tarea es resumir documentos de forma estructurada en español.

Analiza el documento proporcionado y genera un resumen en formato JSON siguiendo exactamente \
el siguiente esquema. Todos los campos deben estar en español. En el esquema JSON se indican \
en algunos casos las secciones de las que puedes obtener la información, pero si alguna sección no está presente \
en el documento, deja los campos correspondientes vacíos.

No dejes ningún detalle importante fuera del resumen, pero evita incluir información irrelevante (por ejemplo glosarios, referencias, secciones vacías, etc.).

Esquema JSON esperado:
{json_schema}

INSTRUCCIONES:
- Responde ÚNICAMENTE con el JSON, sin texto adicional, sin bloques de código markdown.
- Si algún campo no tiene información relevante en el documento, usa una cadena vacía "" para \
campos de texto o una lista vacía [] para campos de lista.
- Los resúmenes deben ser concisos pero informativos y no perder información relevante.
- Mantén el idioma español en todas las respuestas.
- No inventes información que no esté en el documento.
- El nombre del fichero se proporciona al inicio del texto entre corchetes. Úsalo como pista para \
identificar el título correcto del documento (por ejemplo, si el fichero es 'SM100_Tabla_AGUI_VCR_Secundaria_V5.docx', \
el título es probablemente 'SM100 Repositorio AGUI VCR Secundaria' o similar).
- Los campos escrito_por, verificado_por y fecha_elaboracion se encuentran en una tabla de la portada \
con filas etiquetadas 'Written by:', 'Verified by:', 'Approved by:'. Los datos de la tabla aparecen \
en el texto con formato 'Written by: | Nombre | Fecha'. Extrae estos datos de ahí."""


PROMPT_CONFIG: dict[str, PromptTemplate] = {
    "SM100": PromptTemplate(
        system_prompt=_BASE_SYSTEM_PROMPT.format(json_schema=_SM100_JSON_SCHEMA),
        json_schema_description=_SM100_JSON_SCHEMA,
    ),
    "SM200": PromptTemplate(
        system_prompt=_BASE_SYSTEM_PROMPT.format(json_schema=_SM200_JSON_SCHEMA),
        json_schema_description=_SM200_JSON_SCHEMA,
    ),
    "default": PromptTemplate(
        system_prompt=_BASE_SYSTEM_PROMPT.format(json_schema=_DEFAULT_JSON_SCHEMA),
        json_schema_description=_DEFAULT_JSON_SCHEMA,
    ),
}


def get_prompt_for_type(tipo_documento: str) -> PromptTemplate:
    """
    Get the prompt template for a document type, with fallback to default.

    Args:
        tipo_documento: The document type (e.g., "SM100", "SM200")

    Returns:
        The matching PromptTemplate, or the default if no specific one exists
    """
    return PROMPT_CONFIG.get(tipo_documento, PROMPT_CONFIG["default"])
