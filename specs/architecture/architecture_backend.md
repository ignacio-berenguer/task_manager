# Backend Architecture: Task Manager API

## 1. Overview

The backend provides a RESTful API for the Task Manager system. It is built using **FastAPI** for high performance and **SQLAlchemy** as the ORM. It follows a modular design with generic CRUD operations, flexible search, and an integrated AI agent module.

---

## 2. Technology Stack

- **Framework:** FastAPI (Python 3.12+)
- **ORM:** SQLAlchemy 2.0 (declarative mapping)
- **Database:** SQLite
- **Validation:** Pydantic v2
- **Configuration:** pydantic-settings with python-dotenv
- **AI Agent:** Anthropic SDK + httpx (async)

---

## 3. Directory Structure

```text
backend/
├── app/
│   ├── __init__.py          # Package init
│   ├── main.py              # Entry point, CORS, middleware, router registration
│   ├── config.py            # Environment configuration (pydantic-settings)
│   ├── database.py          # SQLite connection setup & SessionLocal
│   ├── models.py            # 5 SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic models for search, CRUD validation
│   ├── crud.py              # Generic CRUDBase class
│   ├── search.py            # Flexible search with 12 operators
│   ├── table_registry.py    # TABLE_MODELS mapping
│   ├── agent/               # AI Chat Agent module
│   │   ├── __init__.py
│   │   ├── config.py             # Agent configuration (model, tokens, temperature)
│   │   ├── table_metadata.py     # Table descriptions for system prompt
│   │   ├── api_client.py         # Async HTTP client for API self-calls
│   │   ├── tools_definition.py   # 4 tool schemas in Anthropic API format
│   │   ├── tools_executor.py     # Tool execution dispatcher
│   │   ├── system_prompt.py      # System prompt with task context
│   │   └── orchestrator.py       # Agentic loop with streaming + tool execution
│   └── routers/
│       ├── __init__.py
│       ├── tareas.py         # Tareas CRUD + Search
│       ├── acciones.py       # Acciones CRUD (incl. by tarea_id)
│       ├── estados.py        # Estados parametric tables (two routers)
│       ├── responsables.py   # Responsables parametric table CRUD
│       └── agent.py          # AI agent chat with SSE streaming
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template
└── pyproject.toml            # Dependencies
```

---

## 4. Database Models

5 SQLAlchemy models reflecting the database schema:

| Model | Table | Primary Key | Description |
|-------|-------|-------------|-------------|
| `Tarea` | `tareas` | `tarea_id` (TEXT) | Main tasks with responsable, tema, estado, descripcion, fecha_siguiente_accion, notas_anteriores |
| `AccionRealizada` | `acciones_realizadas` | `id` (INTEGER, auto) | Actions performed on tasks, FK to tareas (CASCADE). Includes fecha_accion |
| `EstadoTarea` | `estados_tareas` | `id` (INTEGER, auto) | Parametric: valid task estados with orden and color |
| `EstadoAccion` | `estados_acciones` | `id` (INTEGER, auto) | Parametric: valid action estados with orden and color |
| `Responsable` | `responsables` | `id` (INTEGER, auto) | Parametric: responsable values with orden (unique valor) |

---

## 5. Generic CRUD (crud.py)

The `CRUDBase` class provides generic operations for any SQLAlchemy model:

```python
class CRUDBase(Generic[ModelType]):
    def get(db, id) -> ModelType | None
    def get_multi(db, skip, limit) -> list[ModelType]
    def count(db) -> int
    def create(db, obj_in: dict) -> ModelType
    def update(db, db_obj, obj_in: dict) -> ModelType
    def delete(db, id) -> bool
```

Key behaviors:
- `update()` automatically sets `fecha_actualizacion` to current timestamp if the model has the column
- `model_to_dict()` converts any SQLAlchemy model instance to a dictionary

---

## 6. API Endpoints

### 6.1 Tareas

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tareas` | List all tareas (paginated: `limit`, `offset`) |
| GET | `/api/v1/tareas/{tarea_id}` | Get tarea by ID |
| POST | `/api/v1/tareas` | Create a new tarea |
| PUT | `/api/v1/tareas/{tarea_id}` | Update an existing tarea |
| DELETE | `/api/v1/tareas/{tarea_id}` | Delete a tarea (cascades to acciones) |
| POST | `/api/v1/tareas/search` | Flexible search with filters |

**Router:** `routers/tareas.py` with prefix `/tareas`.

### 6.2 Acciones

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/acciones` | List all acciones (paginated) |
| GET | `/api/v1/acciones/tarea/{tarea_id}` | Get acciones for a specific tarea |
| GET | `/api/v1/acciones/{id}` | Get accion by ID |
| POST | `/api/v1/acciones` | Create a new accion |
| PUT | `/api/v1/acciones/{id}` | Update an existing accion |
| DELETE | `/api/v1/acciones/{id}` | Delete an accion |

**Router:** `routers/acciones.py` with prefix `/acciones`.

**Important:** The `GET /tarea/{tarea_id}` route is defined before `GET /{id}` to avoid FastAPI route conflicts.

### 6.3 Estados (Parametric)

Two separate routers for the two estado tables:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/estados-tareas` | List all task estados (ordered by `orden`) |
| GET | `/api/v1/estados-acciones` | List all action estados (ordered by `orden`) |

**Router:** `routers/estados.py` exports `router_tareas` and `router_acciones`.

### 6.4 Responsables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/responsables` | List all responsables (ordered by `orden`) |
| POST | `/api/v1/responsables` | Create a new responsable (409 on duplicate) |
| PUT | `/api/v1/responsables/{id}` | Update a responsable |
| DELETE | `/api/v1/responsables/{id}` | Delete a responsable |

**Router:** `routers/responsables.py` with prefix `/responsables`.

### 6.5 Agent Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agent/chat` | AI agent chat with SSE streaming |

**Router:** `routers/agent.py` with prefix `/agent`.

### 6.6 Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint (API info) |
| GET | `/health` | Health check |

---

## 7. Flexible Search (search.py)

The search module provides advanced filtering for any model via `POST /{table}/search`.

**Request body:**
```json
{
  "filters": [
    {"field": "estado", "operator": "eq", "value": "Pendiente"},
    {"field": "responsable", "operator": "ilike", "value": "%juan%"}
  ],
  "order_by": "fecha_siguiente_accion",
  "order_dir": "desc",
  "limit": 50,
  "offset": 0
}
```

**Supported operators (12):**

| Operator | Description |
|----------|-------------|
| `eq` | Equal |
| `ne` | Not equal |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `like` | SQL LIKE pattern match |
| `ilike` | Case-insensitive LIKE |
| `in` | In list |
| `not_in` | Not in list |
| `is_null` | Is NULL |
| `is_not_null` | Is not NULL |

**Response format (paginated):**
```json
{
  "total": 42,
  "data": [...],
  "limit": 50,
  "offset": 0
}
```

---

## 8. Agent Module (agent/)

AI-powered chat assistant that answers natural language questions about tasks by querying the API using Claude as the reasoning engine.

### Architecture

- `orchestrator.py` manages a multi-turn conversation loop with Claude, dispatching tool calls
- `api_client.py` makes internal HTTP calls to the same FastAPI backend (self-calling pattern via `httpx.AsyncClient`)
- `tools_definition.py` defines 4 tools in Anthropic API format
- `tools_executor.py` routes tool calls to the appropriate API endpoints
- `system_prompt.py` provides task management context to the model
- `table_metadata.py` provides table descriptions for the system prompt

### Agent Tools (4)

| Tool | Description |
|------|-------------|
| `buscar_tareas` | Search tareas with flexible filters, sorting, pagination |
| `obtener_tarea` | Get complete tarea data with all acciones |
| `buscar_acciones` | Get acciones for a specific tarea |
| `listar_estados` | List parametric estados for tareas or acciones |

### SSE Event Types

| Event | Fields | Description |
|-------|--------|-------------|
| `token` | `content` | Individual text tokens as they stream from Claude |
| `tool_start` | `tool`, `input` | Signals the beginning of a tool call |
| `tool_result` | `tool`, `result_preview` | Summary of tool call result |
| `error` | `message` | Error information |
| `done` | `conversation_id` | Signals end of response |

---

## 9. Configuration

### Environment Variables (.env)

```env
# Logging
LOG_LEVEL=INFO
LOG_FILE=task_manager_backend.log
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# API Settings
API_HOST=0.0.0.0
API_PORT=8080
API_PREFIX=/api/v1
API_TITLE=Task Manager API
API_VERSION=1.0.0

# Database
DATABASE_PATH=              # Empty = auto-detect relative to project root
DATABASE_ECHO=false         # Log SQL queries

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# AI Agent (Chat)
ANTHROPIC_API_KEY=sk-ant-...
AGENT_MODEL=claude-sonnet-4-20250514
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.3
AGENT_MAX_TOOL_ROUNDS=10
AGENT_API_BASE_URL=http://localhost:8080/api/v1
```

### Logging

- **Log file**: `PROJECT_ROOT/logs/task_manager_backend.log`
- **Console output**: INFO and above
- **Configurable**: LOG_LEVEL, LOG_FORMAT in .env
- **Request logging**: `RequestLoggingMiddleware` logs method/path/status/duration (skips health/docs)
- **Noisy loggers suppressed**: httpcore, anthropic, httpx, hpack set to WARNING

---

## 10. Middleware

- **CORSMiddleware**: Configurable origins, allows GET/POST/PUT/DELETE methods
- **RequestLoggingMiddleware**: Logs all API requests with method, path, status code, and duration (skips /health, /docs, /redoc, /openapi.json)

---

## 11. Running the API

```bash
cd backend
uv sync
uv run python -m app.main                    # Uses API_HOST/API_PORT from .env
```

**API Documentation:**
- Swagger UI: http://localhost:8080/api/v1/docs
- ReDoc: http://localhost:8080/api/v1/redoc

---

## 12. Dependencies

```toml
[project]
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy>=2.0.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
    "anthropic>=0.40.0",
    "httpx>=0.27.0",
]
```
