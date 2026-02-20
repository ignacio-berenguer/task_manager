# MCP Server Architecture

## Task Manager

### Overview

The MCP (Model Context Protocol) server provides read-only access to Task Manager data for AI agents (Claude Desktop, Claude Code). It runs as a **separate process** from the FastAPI backend and acts as an HTTP client that translates MCP tool calls into API requests.

---

## Architecture Pattern

```
┌─────────────────┐       HTTP/JSON        ┌─────────────────┐       SQLite
│   MCP Server    │ ─────────────────────> │   FastAPI API   │ ───────────> task_manager.db
│  (mcp_server/)  │   POST /search         │  (backend/)     │
│                 │   GET /tareas/{id}     │                 │
│  stdio | SSE    │ <───────────────────── │  :8080          │
└─────────────────┘       JSON responses   └─────────────────┘
```

- **Clean separation of concerns**: FastAPI serves HTTP clients; MCP serves AI agents
- **All business logic in the API**: Search, validation, CRUD handled by the backend
- **Independent lifecycle**: MCP server can restart without affecting the API
- **Dual transport**: stdio for local (Claude Desktop/Code), SSE for remote/production

---

## Module Structure

```
mcp_server/
├── pyproject.toml                  # mcp[cli], httpx, python-dotenv
├── .env / .env.example
└── src/mcp_tareas/
    ├── __init__.py                 # Package + version
    ├── __main__.py                 # python -m mcp_tareas entry point
    ├── server.py                   # FastMCP instance + tool registration + main()
    ├── config.py                   # Settings from .env (API URL, logging, limits)
    ├── api_client.py               # TaskAPIClient (synchronous httpx wrapper)
    ├── logging_config.py           # File + stderr logging (never stdout)
    ├── table_metadata.py           # TABLA_DESCRIPCIONES, TABLAS_CON_BUSQUEDA, URL prefixes
    └── tools/
        ├── __init__.py             # register_tools(mcp, api_client)
        ├── busqueda.py             # buscar_tareas
        ├── detalle.py              # obtener_tarea, buscar_acciones
        └── esquema.py              # listar_tablas, describir_tabla, obtener_valores_campo
```

---

## MCP Tools (6 total)

All tool names, descriptions, and parameter help are in Spanish.

### Search Tools (busqueda.py)

| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `buscar_tareas` | POST /tareas/search | Search tareas with flexible filters, sorting, pagination |

### Detail Tools (detalle.py)

| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `obtener_tarea` | GET /tareas/{tarea_id} + GET /acciones/tarea/{tarea_id} | Get complete tarea data with all acciones |
| `buscar_acciones` | GET /acciones/tarea/{tarea_id} | Get acciones for a specific tarea |

### Schema Tools (esquema.py)

| Tool | API Endpoint | Description |
|------|-------------|-------------|
| `listar_tablas` | GET /{table}?limit=1 (each) | List all tables with descriptions and row counts |
| `describir_tabla` | GET /{table}?limit=1 | Get column names and metadata for a table |
| `obtener_valores_campo` | GET /{table} then extract distinct | Get distinct values for a field |

---

## API Client (api_client.py)

`TaskAPIClient` wraps `httpx.Client` (synchronous):

- `search(table, body)` -- POST /{table}/search
- `get_record(table, record_id)` -- GET /{table}/{id}
- `list_records(path, limit, offset)` -- GET /{path}
- `health_check()` -- GET /health

Error handling translates HTTP status codes to Spanish error messages.

---

## Table Metadata (table_metadata.py)

- **TABLA_DESCRIPCIONES**: 4 tables with Spanish descriptions (tareas, acciones_realizadas, estados_tareas, estados_acciones)
- **TABLAS_CON_BUSQUEDA**: Tables supporting POST /search with flexible filters (currently: tareas)
- **get_url_prefix(tabla)**: Maps table names (underscore) to API URL prefixes (hyphenated)

URL prefix overrides:
| Table Name | URL Prefix |
|------------|-----------|
| `acciones_realizadas` | `acciones` |
| `estados_tareas` | `estados-tareas` |
| `estados_acciones` | `estados-acciones` |
| `tareas` | `tareas` |

---

## Configuration (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8080/api/v1` | FastAPI backend URL |
| `API_TIMEOUT` | `30` | HTTP request timeout (seconds) |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `task_manager_mcp.log` | Log filename (in ../logs/) |
| `MCP_TRANSPORT` | `stdio` | Transport mode: "stdio" or "sse" |
| `MCP_HOST` | `0.0.0.0` | SSE bind host |
| `MCP_PORT` | `8001` | SSE bind port |

---

## Logging

- **File**: `logs/task_manager_mcp.log` (append, same directory as other modules)
- **Console**: stderr only (stdout reserved for MCP JSON-RPC in stdio mode)
- **Levels**: INFO for tool calls, DEBUG for API request/response, ERROR for failures

---

## Dependencies

```toml
[project]
dependencies = [
    "mcp[cli]>=1.0.0",
    "httpx>=0.27.0",
    "python-dotenv>=1.0.0",
]
```

---

## Security

1. **Read-only**: Only GET and POST-search endpoints called. No PUT/DELETE/mutation.
2. **No direct DB access**: All data flows through the API's validation layer.
3. **Table whitelist**: Only approved tables queryable via tools.
4. **No secrets**: Only the API URL in .env.

---

## Running

```bash
cd mcp_server
uv sync

# stdio mode (default, for Claude Desktop / Claude Code)
uv run -m mcp_tareas

# SSE mode (for remote/production use)
MCP_TRANSPORT=sse uv run -m mcp_tareas
```

**Prerequisite:** The backend API must be running on port 8080.
