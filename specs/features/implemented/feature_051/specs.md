# Specs — feature_051: MCP Server (Read-Only Portfolio Access)

## 1. Overview

Create a new `mcp_server/` module that exposes portfolio database information through the Model Context Protocol (MCP). The server provides **read-only** access to all portfolio data via ~9 MCP tools, designed for use with Claude Desktop/Claude Code and future chat interfaces. All tool names, descriptions, and parameter help text are in **Spanish**.

## 2. Architecture: API Client Pattern

```
┌─────────────────┐       HTTP/JSON        ┌─────────────────┐       SQLite
│   MCP Server    │ ─────────────────────► │   FastAPI API   │ ────────────► portfolio.db
│  (separate      │   POST /search         │  (existing      │
│   process)      │   GET /portfolio/{id}  │   backend)      │
│                 │   GET /{table}         │                 │
│  stdio | SSE    │ ◄───────────────────── │  :8000          │
└─────────────────┘       JSON responses   └─────────────────┘
```

**The MCP server acts as an HTTP client of the FastAPI backend.** It translates MCP tool calls into HTTP requests to `http://localhost:8000/api/v1/...` and returns the API responses formatted for LLM consumption.

**Rationale:**
- **Clean separation of concerns** — FastAPI serves HTTP clients (frontend, integrations); MCP serves AI agents
- **Independent lifecycle** — restart/update the MCP server without touching the API
- **All business logic stays in the API** — calculated fields, search operators, data validation, cross-table joins are all handled by the existing backend
- **Flexibility** — the MCP server can run locally (stdio) for development or remotely (SSE/streamable HTTP) for production
- **No code duplication** — no need to re-implement search, calculated fields, or data access patterns

**Trade-off:** The FastAPI backend must be running for the MCP server to work. This is documented as a prerequisite.

## 3. Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| MCP SDK | `mcp[cli]` (FastMCP) | >=1.2.0 |
| Python | 3.10+ | (matches project) |
| HTTP client | httpx | latest |
| Config | python-dotenv | latest |
| Package manager | uv | (matches project) |

## 4. Module Structure

```
mcp_server/
├── pyproject.toml              # Package config + dependencies
├── .env                        # Configuration (gitignored)
├── .env.example                # Template
├── src/
│   └── mcp_portfolio/
│       ├── __init__.py         # Package init + version
│       ├── __main__.py         # Entry point: python -m mcp_portfolio
│       ├── server.py           # FastMCP instance + tool registration + main()
│       ├── config.py           # Settings loaded from .env
│       ├── api_client.py       # httpx client wrapper for FastAPI calls
│       ├── logging_config.py   # File + console (stderr) logging setup
│       ├── table_metadata.py   # Static table descriptions + search capability flags
│       └── tools/
│           ├── __init__.py     # Registers all tools on the server
│           ├── busqueda.py     # buscar_iniciativas, buscar_en_tabla
│           ├── detalle.py      # obtener_iniciativa, obtener_documentos
│           ├── agregacion.py   # contar_iniciativas, totalizar_importes
│           └── esquema.py      # listar_tablas, describir_tabla, obtener_valores_campo
```

## 5. API Endpoint Mapping

### 5.1 Tables with Flexible Search (`POST /search`)

These 10 tables support the full `SearchRequest` with filters, sorting, pagination:

| Table | API Prefix | Notes |
|-------|-----------|-------|
| datos_relevantes | `/datos-relevantes` | Primary query target (60+ calculated fields) |
| iniciativas | `/iniciativas` | Master table |
| datos_descriptivos | `/datos-descriptivos` | Descriptive metadata |
| informacion_economica | `/informacion-economica` | Financial data |
| hechos | `/hechos` | Budget milestones |
| etiquetas | `/etiquetas` | Tags |
| acciones | `/acciones` | Actions |
| dependencias | `/dependencias` | Dependencies |
| documentos | `/documentos` | Documents with AI summaries |
| fichas | `/fichas` | Data cards |

### 5.2 Tables with Standard CRUD Only (`GET /`)

These tables support list with `limit`/`offset` and get-by-id, but no flexible `/search`:

| Table | API Prefix | Notes |
|-------|-----------|-------|
| avance | `/avance` | Progress data |
| beneficios | `/beneficios` | Benefits |
| datos_ejecucion | `/datos-ejecucion` | Execution data |
| facturacion | `/facturacion` | Billing |
| grupos_iniciativas | `/grupos-iniciativas` | Group-component relationships |
| wbes | `/wbes` | Work breakdown elements |
| notas | `/notas` | Notes (has report endpoint) |
| ltp | `/ltp` | Planned work lines (has report endpoint) |
| justificaciones | `/justificaciones` | Justifications (has report endpoint) |
| descripciones | `/descripciones` | Descriptions (has report endpoint) |
| estado_especial | `/estado-especial` | Special states |
| investment_memos | `/investment-memos` | Investment memos |
| impacto_aatt | `/impacto-aatt` | Technical impact |

### 5.3 Cross-Table Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/portfolio/{portfolio_id}` | GET | All data for one initiative across all tables |
| `/portfolio/search` | POST | Batch search by multiple portfolio_ids |
| `/parametros/{nombre}` | GET | Dropdown values for a parameter field |

## 6. MCP Tools Specification (9 tools)

### 6.1 Search Tools (`busqueda.py`)

#### `buscar_iniciativas`
**Descripción**: Buscar iniciativas en la vista consolidada (datos_relevantes) con filtros flexibles, ordenamiento y paginación. Esta es la herramienta principal para consultas sobre iniciativas. La tabla datos_relevantes contiene 60+ campos calculados incluyendo nombre, unidad, framework, estado, importes por año (2024-2028), y más.

**API call**: `POST /api/v1/datos-relevantes/search`

| Parameter | Type | Required | Description (Spanish) |
|-----------|------|----------|----------------------|
| `filtros` | list[dict] | No | Lista de filtros. Cada filtro: `{"field": "nombre_campo", "operator": "eq\|ne\|gt\|gte\|lt\|lte\|like\|ilike\|in\|not_in\|is_null\|is_not_null", "value": "..."}`. Ejemplo: `[{"field": "estado_de_la_iniciativa", "operator": "eq", "value": "En Ejecución"}]` |
| `orden_campo` | str | No | Campo por el cual ordenar los resultados (order_by) |
| `orden_direccion` | str | No | `"asc"` o `"desc"` (por defecto: `"asc"`) |
| `limite` | int | No | Máximo de resultados (por defecto: 50, máximo: 500) |
| `desplazamiento` | int | No | Desplazamiento para paginación (por defecto: 0) |

**Returns**: `{"total": int, "datos": [dict], "limite": int, "desplazamiento": int}`

**Implementation**: Translates parameters to `SearchRequest` JSON body:
```python
{
  "filters": filtros,  # Already in API format
  "order_by": orden_campo,
  "order_dir": orden_direccion,
  "limit": limite,
  "offset": desplazamiento
}
```

Note: The MCP tool uses **Spanish parameter names** externally, but maps them to the **English API field names** internally (`order_by`, `order_dir`, `limit`, `offset`).

#### `buscar_en_tabla`
**Descripción**: Buscar registros en cualquier tabla disponible de la base de datos. Para las tablas principales (datos_relevantes, iniciativas, hechos, etiquetas, acciones, etc.) se pueden usar filtros flexibles. Para otras tablas, se obtiene la lista de registros con paginación. Todos los registros incluyen campos calculados cuando están disponibles.

**API call**: `POST /api/v1/{tabla}/search` (for search-enabled tables) or `GET /api/v1/{tabla}?limit={limite}&offset={desplazamiento}` (for CRUD-only tables)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tabla` | str | Yes | Nombre de la tabla a consultar (ej: "hechos", "etiquetas", "beneficios") |
| `filtros` | list[dict] | No | Lista de filtros (mismo formato que buscar_iniciativas). Solo disponible para tablas con endpoint /search. |
| `orden_campo` | str | No | Campo de ordenamiento |
| `orden_direccion` | str | No | `"asc"` o `"desc"` |
| `limite` | int | No | Máximo de resultados (por defecto: 50, máximo: 500) |
| `desplazamiento` | int | No | Desplazamiento para paginación |

**Returns**: Same paginated structure. Validates table name against allowed list. If filters are provided for a CRUD-only table, returns an error explaining that table doesn't support filtered search.

### 6.2 Detail Tools (`detalle.py`)

#### `obtener_iniciativa`
**Descripción**: Obtener todos los datos de una iniciativa específica de todas las tablas relacionadas. Devuelve un objeto completo con la información de cada tabla, incluyendo datos relevantes calculados, hechos, etiquetas, documentos, notas, acciones, y más.

**API call**: `GET /api/v1/portfolio/{portfolio_id}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `portfolio_id` | str | Yes | Identificador de la iniciativa (ej: "SPA_25_001") |

**Returns**: `{"portfolio_id": str, "tablas": {table_name: data, ...}}` where:
- `datos_relevantes`, `iniciativas`, `datos_descriptivos` → single dict (1:1)
- `grupos_iniciativas` → `{"as_grupo": [...], "as_componente": [...]}`
- Other tables → list of records

The API response is reformatted for cleaner LLM consumption (flattened, null tables omitted).

#### `obtener_documentos`
**Descripción**: Obtener resúmenes de documentos asociados a iniciativas. Puede filtrar por portfolio_id o buscar en el texto de los resúmenes. Los documentos incluyen resúmenes generados por IA y metadatos del archivo.

**API calls**:
- By portfolio: `GET /api/v1/documentos/portfolio/{portfolio_id}` + `GET /api/v1/documentos-items/portfolio/{portfolio_id}`
- By search: `POST /api/v1/documentos/search` with ilike filters on relevant fields

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `portfolio_id` | str | No | Filtrar documentos de una iniciativa específica |
| `texto_busqueda` | str | No | Buscar en resúmenes y nombres de documentos (usa operador ilike) |
| `estado` | str | No | Filtrar por estado del procesamiento: "Pendiente", "Completado", "Error", "Ignorado" |
| `limite` | int | No | Máximo de resultados (por defecto: 50) |

**Returns**: List of document records with summaries and associated items.

### 6.3 Aggregation Tools (`agregacion.py`)

These tools fetch data from `datos_relevantes` via the search API and perform client-side aggregation. Since `datos_relevantes` has ~837 rows (one per initiative), fetching all matching rows is efficient.

#### `contar_iniciativas`
**Descripción**: Contar iniciativas agrupadas por un campo (ej: estado, unidad, framework). Útil para obtener distribuciones y estadísticas como "¿cuántas iniciativas hay por estado?" o "¿cuántas iniciativas tiene cada unidad?".

**API call**: `POST /api/v1/datos-relevantes/search` with `limit=1000` and optional filters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `campo_agrupacion` | str | Yes | Campo de datos_relevantes por el que agrupar (ej: "estado_de_la_iniciativa", "unidad", "digital_framework_level_1", "cluster") |
| `filtros` | list[dict] | No | Filtros previos a la agrupación (mismo formato que buscar_iniciativas) |

**Returns**: `{"total_iniciativas": int, "grupos": [{"valor": str|null, "cantidad": int}]}`

**Implementation**:
1. Call search API with `limit=1000` and provided filters
2. Extract `campo_agrupacion` values from all results
3. Group and count using Python `collections.Counter`
4. Sort by count descending

#### `totalizar_importes`
**Descripción**: Sumar un campo de importe agrupado por una dimensión. Útil para obtener presupuestos totales, facturación acumulada, etc. Ejemplos: "presupuesto total 2025 por unidad", "importe aprobado por framework".

**API call**: `POST /api/v1/datos-relevantes/search` with `limit=1000` and optional filters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `campo_importe` | str | Yes | Campo numérico a sumar (ej: "importe_2025", "budget_2025", "importe_aprobado_2025", "importe_facturacion_2025") |
| `campo_agrupacion` | str | No | Campo por el que agrupar. Si no se indica, devuelve solo el total global. |
| `filtros` | list[dict] | No | Filtros previos a la agregación |

**Returns**: `{"total_general": float, "grupos": [{"valor": str|null, "total": float, "cantidad": int}]}` (grupos only if campo_agrupacion provided)

**Implementation**:
1. Call search API with `limit=1000` and provided filters
2. Extract `campo_importe` and optional `campo_agrupacion` from results
3. Sum values using Python `defaultdict`, skipping null/non-numeric values
4. Return total + per-group breakdown

### 6.4 Schema Tools (`esquema.py`)

#### `listar_tablas`
**Descripción**: Listar todas las tablas disponibles con su descripción en español, número de registros, y si soportan búsqueda con filtros flexibles.

**API calls**: `GET /api/v1/{tabla}?limit=1` for each table (to get `total` count from response)

**Returns**: `[{"tabla": str, "descripcion": str, "num_registros": int, "soporta_busqueda": bool}]`

Table descriptions and search capability flags are maintained as static metadata in `table_metadata.py`.

#### `describir_tabla`
**Descripción**: Obtener los nombres de las columnas/campos disponibles en una tabla específica. Útil para saber qué campos se pueden usar en filtros y consultas.

**API call**: `GET /api/v1/{tabla}?limit=1` — examine response keys to determine available fields

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tabla` | str | Yes | Nombre de la tabla a describir |

**Returns**: `{"tabla": str, "descripcion": str, "campos": [str], "num_registros": int, "soporta_busqueda": bool}`

Fields are extracted from the first record's keys. If the table is empty, returns the static description only.

#### `obtener_valores_campo`
**Descripción**: Obtener los valores distintos de un campo en una tabla. Útil para conocer las opciones de filtrado disponibles, como los posibles estados, unidades, frameworks, etc.

**API calls**:
- For search-enabled tables: `POST /api/v1/{tabla}/search` with `limit=1000`
- For CRUD-only tables: `GET /api/v1/{tabla}?limit=1000`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tabla` | str | Yes | Nombre de la tabla |
| `campo` | str | Yes | Nombre del campo |
| `limite` | int | No | Máximo de valores distintos a devolver (por defecto: 100) |

**Returns**: `{"tabla": str, "campo": str, "valores": [str|int|float|null], "total_distintos": int}`

**Implementation**: Fetches records from the API, extracts the specified field values, deduplicates, sorts, and returns up to `limite` distinct values.

## 7. API Client (`api_client.py`)

```python
class PortfolioAPIClient:
    """HTTP client for the FastAPI backend."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def search(self, table: str, filters=None, order_by=None,
               order_dir="asc", limit=50, offset=0) -> dict:
        """POST /api/v1/{table}/search"""
        body = {"filters": filters or [], "limit": limit, "offset": offset}
        if order_by:
            body["order_by"] = order_by
            body["order_dir"] = order_dir
        response = self.client.post(f"/{table}/search", json=body)
        response.raise_for_status()
        return response.json()

    def list_records(self, table: str, limit=50, offset=0) -> dict:
        """GET /api/v1/{table}?limit=N&offset=N"""
        response = self.client.get(f"/{table}", params={"limit": limit, "offset": offset})
        response.raise_for_status()
        return response.json()

    def get_portfolio(self, portfolio_id: str) -> dict:
        """GET /api/v1/portfolio/{portfolio_id}"""
        response = self.client.get(f"/portfolio/{portfolio_id}")
        response.raise_for_status()
        return response.json()

    def get_portfolio_records(self, table: str, portfolio_id: str) -> list:
        """GET /api/v1/{table}/portfolio/{portfolio_id}"""
        response = self.client.get(f"/{table}/portfolio/{portfolio_id}")
        response.raise_for_status()
        return response.json()

    def health_check(self) -> bool:
        """Check if the API is reachable."""
        try:
            response = self.client.get("/datos-relevantes", params={"limit": 1})
            return response.status_code == 200
        except httpx.ConnectError:
            return False
```

The client is synchronous (httpx.Client, not AsyncClient) since MCP stdio is single-threaded and each tool call is sequential.

## 8. Table Metadata (`table_metadata.py`)

Static metadata maintained in the MCP server:

```python
TABLA_DESCRIPCIONES = {
    "datos_relevantes": "Vista consolidada con 60+ campos calculados por iniciativa — tabla principal para consultas",
    "iniciativas": "Tabla maestra de iniciativas con presupuestos por año (2024-2028)",
    "datos_descriptivos": "Datos descriptivos: nombre, unidad, framework, cluster, tipo, referentes",
    "informacion_economica": "Información económica: CINI, CAPEX/OPEX, indicadores financieros",
    "hechos": "Hechos/hitos presupuestarios con importes y estados",
    "beneficios": "Beneficios por periodo asociados a iniciativas",
    "etiquetas": "Etiquetas (tags) asociadas a iniciativas",
    "justificaciones": "Justificaciones de estado de iniciativas",
    "ltp": "Líneas de Trabajo Planificadas (LTPs)",
    "wbes": "Elementos de Estructura de Desglose de Trabajo (WBEs)",
    "dependencias": "Dependencias entre iniciativas",
    "notas": "Notas y comentarios sobre iniciativas",
    "avance": "Datos de avance y progreso",
    "acciones": "Acciones pendientes o completadas",
    "descripciones": "Descripciones detalladas de iniciativas",
    "estado_especial": "Estados especiales de iniciativas",
    "investment_memos": "Memos de inversión con presupuestos 2024-2030",
    "impacto_aatt": "Impacto en áreas técnicas (AATT)",
    "facturacion": "Facturación mensual por iniciativa",
    "fichas": "Fichas de datos por periodo",
    "documentos": "Documentos asociados con resúmenes generados por IA",
    "documentos_items": "Secciones y páginas extraídas de documentos",
    "grupos_iniciativas": "Relaciones grupo-componente entre iniciativas",
    "datos_ejecucion": "Datos de ejecución, hitos y progreso",
    "parametros": "Valores paramétricos para campos (opciones de dropdown)",
    "etiquetas_destacadas": "Etiquetas destacadas/favoritas",
}

# Tables that support POST /search with flexible filters
TABLAS_CON_BUSQUEDA = {
    "datos_relevantes", "iniciativas", "datos_descriptivos",
    "informacion_economica", "hechos", "etiquetas", "acciones",
    "dependencias", "documentos", "fichas",
}

# API URL prefix for each table (hyphenated, not underscored)
TABLA_URL_PREFIX = {
    "datos_relevantes": "datos-relevantes",
    "datos_descriptivos": "datos-descriptivos",
    "informacion_economica": "informacion-economica",
    "datos_ejecucion": "datos-ejecucion",
    "grupos_iniciativas": "grupos-iniciativas",
    "estado_especial": "estado-especial",
    "investment_memos": "investment-memos",
    "impacto_aatt": "impacto-aatt",
    "documentos_items": "documentos-items",
    "etiquetas_destacadas": "etiquetas-destacadas",
    # Tables where name == prefix (no transformation needed):
    # iniciativas, hechos, beneficios, etiquetas, justificaciones,
    # ltp, wbes, dependencias, notas, avance, acciones, descripciones,
    # facturacion, fichas, documentos, parametros
}
```

## 9. Configuration (.env)

```env
# API Connection
API_BASE_URL=http://localhost:8000/api/v1    # FastAPI backend URL
API_TIMEOUT=30                                # Request timeout in seconds

# Logging
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR
LOG_FILE=portfolio_mcp.log        # Filename (stored in ../logs/)
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# Query limits
MAX_QUERY_ROWS=500                # Maximum rows per tool call
DEFAULT_QUERY_ROWS=50             # Default rows per tool call

# Transport (stdio or sse)
MCP_TRANSPORT=stdio               # "stdio" for local, "sse" for remote
MCP_HOST=0.0.0.0                  # Host for SSE transport
MCP_PORT=8001                     # Port for SSE transport
```

## 10. Transport Modes

### stdio (default — local use with Claude Desktop/Claude Code)
```python
mcp.run(transport="stdio")
```
- Single-threaded, synchronous
- Communication via stdin/stdout (JSON-RPC)
- All logging to stderr only

### SSE (remote use — future chat interface)
```python
mcp.run(transport="sse", host="0.0.0.0", port=8001)
```
- HTTP-based Server-Sent Events transport
- Suitable for remote clients and web-based chat interfaces
- Can be proxied/load-balanced

Transport mode is selected via `MCP_TRANSPORT` env var or `--transport` CLI argument.

## 11. Logging Strategy

- **File**: `logs/portfolio_mcp.log` (append mode, same `logs/` dir as other modules)
- **Console**: stderr only (stdout is reserved for MCP JSON-RPC protocol in stdio mode)
- **Levels**: INFO by default:
  - INFO: Tool calls (name + parameters summary), API health checks, startup/shutdown
  - DEBUG: Full API request/response bodies, parameter details
  - ERROR: API connection failures, unexpected responses, tool errors
- **Format**: Timestamp + logger name + level + message (same pattern as backend)

```python
# CRITICAL: Never use print() or write to stdout — it breaks MCP stdio protocol
# File handler → logs/portfolio_mcp.log
# Stream handler → sys.stderr (NOT sys.stdout)
```

## 12. Claude Desktop / Claude Code Configuration

### Claude Code (recommended for initial use)
```bash
claude mcp add --scope project portfolio-digital -- uv --directory C:\Users\ignac\dev\portfolio_migration\mcp_server run -m mcp_portfolio
```

### Claude Desktop (Windows)
File: `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "portfolio-digital": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\Users\\ignac\\dev\\portfolio_migration\\mcp_server",
        "run",
        "-m",
        "mcp_portfolio"
      ]
    }
  }
}
```

### SSE mode (for remote/chat use)
```bash
cd mcp_server
MCP_TRANSPORT=sse uv run -m mcp_portfolio
# Server listens on http://0.0.0.0:8001
```

## 13. Security Considerations

1. **Read-only by design**: The MCP server only uses GET and POST-search API endpoints. No PUT, DELETE, or mutation endpoints are ever called.
2. **No direct database access**: All data goes through the API, which enforces its own validation and access control.
3. **Table whitelist**: Only approved tables (from `TABLA_DESCRIPCIONES`) are queryable via MCP tools.
4. **Row limits**: Hard maximum (500) prevents memory exhaustion in API responses.
5. **API prerequisite**: The backend API must be running. The MCP server performs a health check on startup and reports clearly if the API is unreachable.
6. **No secrets in .env**: Only the API URL (localhost by default). No database credentials, no auth tokens.

## 14. Error Handling

- **API unreachable**: Log error, return user-friendly message in Spanish: "Error: No se puede conectar con la API. Asegúrate de que el backend está ejecutándose en {API_BASE_URL}."
- **API returns 404**: Return "No se encontraron datos para {portfolio_id/tabla}."
- **API returns 422**: Return "Error en los parámetros de búsqueda: {details}."
- **API returns 500**: Return "Error interno del servidor API. Consulta los logs del backend."
- **Invalid table name**: Return "Tabla '{tabla}' no disponible. Usa listar_tablas para ver las tablas disponibles."
- **Invalid filter field**: Pass through the API's validation error message.
