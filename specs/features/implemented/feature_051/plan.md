# Implementation Plan — feature_051: MCP Server (API Client Pattern)

## Phase 1: Module Scaffolding

### Step 1.1: Create directory structure
```
mcp_server/
├── pyproject.toml
├── .env
├── .env.example
├── src/
│   └── mcp_portfolio/
│       ├── __init__.py
│       ├── __main__.py
│       ├── server.py
│       ├── config.py
│       ├── api_client.py
│       ├── logging_config.py
│       ├── table_metadata.py
│       └── tools/
│           ├── __init__.py
│           ├── busqueda.py
│           ├── detalle.py
│           ├── agregacion.py
│           └── esquema.py
```

### Step 1.2: Create `pyproject.toml`
- Package name: `mcp-portfolio`
- Dependencies: `mcp[cli]>=1.2.0`, `httpx`, `python-dotenv`
- Entry point script: `mcp-portfolio = "mcp_portfolio:main"`
- Build system: hatchling
- Python >=3.10

### Step 1.3: Create `.env` and `.env.example`
- API_BASE_URL=http://localhost:8000/api/v1
- API_TIMEOUT=30
- LOG_LEVEL, LOG_FILE, LOG_FORMAT
- MAX_QUERY_ROWS, DEFAULT_QUERY_ROWS
- MCP_TRANSPORT, MCP_HOST, MCP_PORT

### Step 1.4: Run `uv sync` to install dependencies

**Files**: pyproject.toml, .env, .env.example, all `__init__.py` files

---

## Phase 2: Core Infrastructure

### Step 2.1: `config.py` — Settings
- Load `.env` via python-dotenv
- API_BASE_URL (default: http://localhost:8000/api/v1)
- API_TIMEOUT (default: 30)
- LOG_LEVEL, LOG_FILE path (relative to `../logs/`)
- Query limits (MAX_QUERY_ROWS=500, DEFAULT_QUERY_ROWS=50)
- Transport settings (MCP_TRANSPORT, MCP_HOST, MCP_PORT)

### Step 2.2: `logging_config.py` — Logging
- File handler → `logs/portfolio_mcp.log` (append mode)
- Stream handler → `sys.stderr` (NEVER stdout — MCP stdio protocol)
- Configurable level from .env
- Logger name: `portfolio_mcp`

### Step 2.3: `api_client.py` — HTTP Client
- `PortfolioAPIClient` class wrapping `httpx.Client`
- Methods:
  - `search(table, filters, order_by, order_dir, limit, offset)` → POST /search
  - `list_records(table, limit, offset)` → GET /{table}
  - `get_portfolio(portfolio_id)` → GET /portfolio/{pid}
  - `get_portfolio_records(table, portfolio_id)` → GET /{table}/portfolio/{pid}
  - `health_check()` → GET /datos-relevantes?limit=1
- Handles table name → URL prefix mapping (underscore to hyphen)
- Error handling: httpx exceptions → user-friendly Spanish messages
- Synchronous client (stdio is single-threaded)

### Step 2.4: `table_metadata.py` — Static Metadata
- `TABLA_DESCRIPCIONES` — Spanish description per table
- `TABLAS_CON_BUSQUEDA` — set of tables with POST /search endpoint
- `TABLA_URL_PREFIX` — table name → API URL prefix mapping
- Helper: `get_url_prefix(tabla)` → returns hyphenated prefix

### Step 2.5: `server.py` — FastMCP Instance
- Create `FastMCP("Portfolio Digital")` instance
- Initialize `PortfolioAPIClient` from config
- Import and register all tools from `tools/` subpackage
- `main()` function: select transport from config, call `mcp.run()`

### Step 2.6: `__main__.py` and `__init__.py`
- `__main__.py`: calls `server.main()`
- `__init__.py`: export `main`, version string

**Files**: config.py, logging_config.py, api_client.py, table_metadata.py, server.py, __main__.py, __init__.py

---

## Phase 3: Tool Implementation — Search

### Step 3.1: `busqueda.py` — Search Tools

#### `buscar_iniciativas`
- Translates Spanish params → API SearchRequest JSON
- Calls `api_client.search("datos-relevantes", ...)`
- Returns `{"total": int, "datos": [...], "limite": int, "desplazamiento": int}`
- Default limit: 50

#### `buscar_en_tabla`
- Validates `tabla` against `TABLA_DESCRIPCIONES` keys
- If tabla in `TABLAS_CON_BUSQUEDA`: calls `api_client.search(prefix, ...)`
- If tabla not in `TABLAS_CON_BUSQUEDA`: calls `api_client.list_records(prefix, ...)`
  - If filters were provided, returns error: "La tabla '{tabla}' no soporta búsqueda con filtros. Solo se puede listar con paginación."
- Maps table name → URL prefix via `TABLA_URL_PREFIX`

**Files**: tools/busqueda.py

---

## Phase 4: Tool Implementation — Detail

### Step 4.1: `detalle.py` — Detail Tools

#### `obtener_iniciativa`
- Calls `api_client.get_portfolio(portfolio_id)`
- Reformats API response:
  - Removes null/empty table entries
  - Flattens single-record tables (datos_relevantes → dict, not list)
  - Keeps the structure intuitive for LLM consumption
- Returns 404-friendly message if initiative not found

#### `obtener_documentos`
- If `portfolio_id` provided:
  - Calls `api_client.get_portfolio_records("documentos", portfolio_id)`
  - Also fetches items: `api_client.get_portfolio_records("documentos-items", portfolio_id)`
  - Merges items into parent documents
- If `texto_busqueda` provided:
  - Builds filters: `[{"field": "resumen", "operator": "ilike", "value": f"%{texto}%"}]`
  - Calls `api_client.search("documentos", filters=...)`
- If `estado` provided: adds estado filter
- Combines results and returns

**Files**: tools/detalle.py

---

## Phase 5: Tool Implementation — Aggregation

### Step 5.1: `agregacion.py` — Aggregation Tools

Both tools fetch all matching datos_relevantes rows and aggregate client-side.

#### `contar_iniciativas`
1. Call `api_client.search("datos-relevantes", filters=filtros, limit=1000)`
2. Extract `campo_agrupacion` from each record in `data`
3. Count with `collections.Counter`
4. Sort by count descending
5. Return `{"total_iniciativas": total, "grupos": [{"valor": v, "cantidad": c}]}`

#### `totalizar_importes`
1. Call `api_client.search("datos-relevantes", filters=filtros, limit=1000)`
2. For each record, extract `campo_importe` value (skip None/non-numeric)
3. If `campo_agrupacion`: group sums using `defaultdict(float)`
4. Calculate total_general = sum of all
5. Return `{"total_general": float, "grupos": [{"valor": v, "total": t, "cantidad": n}]}`

**Files**: tools/agregacion.py

---

## Phase 6: Tool Implementation — Schema

### Step 6.1: `esquema.py` — Schema Tools

#### `listar_tablas`
- Iterate `TABLA_DESCRIPCIONES`
- For each table: call `api_client.list_records(prefix, limit=1)` to get `total` count
- Return list with description + count + search capability flag
- Cache results for the session (table counts don't change within a conversation)

#### `describir_tabla`
- Validate table name
- Call `api_client.list_records(prefix, limit=1)` to get a sample record
- Extract field names from the first record's keys
- Return field list + static description + count + search flag
- If table is empty, return description only with note "sin registros"

#### `obtener_valores_campo`
- If table in `TABLAS_CON_BUSQUEDA`: call `api_client.search(prefix, limit=1000)`
- Else: call `api_client.list_records(prefix, limit=1000)`
- Extract specified field from all records
- Deduplicate, sort, limit to requested count
- Return distinct values + total count

**Files**: tools/esquema.py

---

## Phase 7: Tool Registration & Server Assembly

### Step 7.1: `tools/__init__.py` — Register all tools
- Import all tool functions from busqueda, detalle, agregacion, esquema
- `register_tools(mcp, api_client)` function:
  - Creates tool wrapper functions that have access to `api_client`
  - Registers each on the FastMCP instance via `@mcp.tool()` decorator
- All tool docstrings in Spanish (these become the LLM-visible descriptions)

### Step 7.2: `server.py` — Wire everything together
- Load config → create logger → create API client → create FastMCP → register tools
- Health check on startup: log warning if API is unreachable
- Select transport based on config
- Run server

**Files**: tools/__init__.py, server.py (final assembly)

---

## Phase 8: Testing & Claude Code Integration

### Step 8.1: Manual startup test
- Start backend: `cd backend && uv run uvicorn app.main:app --port 8000`
- Start MCP server: `cd mcp_server && uv run -m mcp_portfolio`
- Verify it starts without errors, logs appear in `logs/portfolio_mcp.log`
- Test via MCP Inspector (`mcp dev`) if available

### Step 8.2: Add MCP server to project config
- Create `.mcp.json` at project root for Claude Code project-scoped config:
```json
{
  "mcpServers": {
    "portfolio-digital": {
      "type": "stdio",
      "command": "uv",
      "args": ["--directory", "mcp_server", "run", "-m", "mcp_portfolio"]
    }
  }
}
```

### Step 8.3: Verify from Claude Code
- Restart Claude Code, verify tools appear
- Test representative queries:
  - "¿Cuántas iniciativas están en ejecución?" → contar_iniciativas
  - "¿Cuál es el presupuesto total de 2025 por unidad?" → totalizar_importes
  - "Dame los detalles de SPA_25_001" → obtener_iniciativa
  - "¿Qué documentos tiene SPA_25_011?" → obtener_documentos
  - "Busca iniciativas con importe > 1M" → buscar_iniciativas
  - "¿Qué tablas hay?" → listar_tablas

---

## Phase 9: Documentation Updates

### Step 9.1: Update `README.md`
- Add MCP Server section under modules
- Document prerequisites (backend API must be running)
- Document setup, running, transport modes
- Claude Desktop / Claude Code configuration
- List available tools with brief descriptions

### Step 9.2: Create `specs/architecture/architecture_mcp_server.md`
- Module architecture documentation
- API client pattern diagram
- Tool catalog with parameters
- Configuration reference
- Security model

### Step 9.3: Update project `CLAUDE.md`
- Add mcp_server to project structure tree
- Add MCP server setup/run commands
- Reference new architecture doc

### Step 9.4: Version bump & changelog
- Increment `APP_VERSION.minor` in `frontend/src/lib/version.js`
- Add changelog entry in `frontend/src/lib/changelog.js`

---

## Implementation Order Summary

| Phase | Description | Est. Files |
|-------|-------------|-----------|
| 1 | Module scaffolding | 5 |
| 2 | Core infrastructure (config, logging, API client, metadata, server) | 7 |
| 3 | Search tools (buscar_iniciativas, buscar_en_tabla) | 1 |
| 4 | Detail tools (obtener_iniciativa, obtener_documentos) | 1 |
| 5 | Aggregation tools (contar, totalizar) | 1 |
| 6 | Schema tools (listar, describir, valores) | 1 |
| 7 | Registration + server assembly | 2 |
| 8 | Testing + Claude Code integration | 1 |
| 9 | Documentation | 4 |

**Total new files**: ~14 in mcp_server/ + 1 .mcp.json + 3-4 doc updates
**No existing backend/frontend files modified** (only docs in Phase 9)

## Dependencies

- `mcp[cli]>=1.2.0` — MCP Python SDK with CLI tools
- `httpx` — HTTP client for API calls
- `python-dotenv` — .env file loading

## Prerequisites

- FastAPI backend running on `http://localhost:8000` (or configured URL)
- Database populated (`datos_relevantes` computed)

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API not running | Health check on startup, clear error message in Spanish |
| MCP SDK API changes | Pin minimum version `>=1.2.0` |
| Large API responses (aggregation) | datos_relevantes has ~837 rows — fully feasible to fetch all |
| Tool descriptions too long for LLM | Keep docstrings concise, provide usage examples |
| Table name mismatches | Static metadata + URL prefix mapping validated at startup |
| API response format changes | MCP server reformats responses — isolates LLM from API changes |
