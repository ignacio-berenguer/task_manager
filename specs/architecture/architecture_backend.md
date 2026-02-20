# Backend Architecture: Portfolio Digital API

## 1. Overview

The backend provides a RESTful API for accessing the portfolio database. It is built using **FastAPI** for high performance and **SQLAlchemy** as the Object Relational Mapper (ORM). It follows a modular design to decouple the database logic, business logic, and API presentation layers.

---

## 2. Technology Stack

- **Framework:** FastAPI (Python 3.12+)
- **ORM:** SQLAlchemy 2.0 (using the declarative mapping style)
- **Database:** SQLite (portfolio.db)
- **Validation:** Pydantic v2 (for request/response schemas)
- **Configuration:** pydantic-settings with python-dotenv

---

## 3. Directory Structure

```text
backend/
├── app/
│   ├── __init__.py          # Package init
│   ├── main.py              # Entry point & app configuration
│   ├── config.py            # Environment configuration
│   ├── database.py          # Connection setup & SessionLocal
│   ├── models.py            # SQLAlchemy ORM definitions (28 models)
│   ├── calculated_fields/   # On-the-fly computed fields (~51 fields)
│   │   ├── __init__.py      # Module exports
│   │   ├── definitions.py   # Field mappings & metadata (FIELD_CALCULATORS)
│   │   ├── lookup.py        # Lookup functions (datos_descriptivos, datos_relevantes, informacion_economica)
│   │   ├── cache.py         # LookupCache for batch processing (avoids N+1 queries)
│   │   ├── estado.py        # Estado/justification calculation functions
│   │   ├── utils.py         # Utility calculations (debe_tener, grupo_importes)
│   │   └── service.py       # CalculatedFieldService orchestrator
│   ├── schemas.py           # Pydantic models for data validation (search, reports, CRUD)
│   ├── crud.py              # Reusable CRUD operations + batch_model_to_dict_with_calculated
│   ├── search.py            # Flexible search operations
│   ├── router_factory.py    # Generic CRUD router factory (12 routers use this)
│   ├── table_registry.py    # Shared TABLE_MODELS mapping
│   ├── agent/               # AI Chat Agent module
│   │   ├── __init__.py
│   │   ├── config.py             # Agent configuration (model, tokens, temperature)
│   │   ├── table_metadata.py     # Table descriptions & search capabilities
│   │   ├── api_client.py         # Internal async HTTP client for self-calling API
│   │   ├── tools_definition.py   # 11 tool schemas for Claude function calling
│   │   ├── tools_executor.py     # Tool execution dispatcher (incl. chart generation)
│   │   ├── orchestrator.py       # Claude conversation loop with tool use
│   │   └── system_prompt.py      # Dynamic system prompt with date injection, Cancelado exclusion, and visualization guidelines
│   ├── charts/              # Chart rendering module (matplotlib-based, shared with MCP server)
│   │   ├── __init__.py      # Module exports
│   │   ├── renderer.py      # ChartRenderer — generates bar, pie, line, stacked bar charts as PNG files
│   │   ├── themes.py        # Chart color palettes and styling (dark/light, Spanish locale)
│   │   └── utils.py         # Data preparation, category truncation, legend formatting
│   ├── services/            # Business logic services
│   │   ├── __init__.py
│   │   ├── transaction_processor.py  # Applies pending JSON diffs to DB
│   │   ├── excel_mapping.py          # EXCEL_MAPPING dict (14 tables → Excel sheets)
│   │   ├── excel_pk_resolver.py      # Resolves Excel-specific PKs at transaction creation
│   │   ├── excel_writer.py           # xlwings Excel write-back service
│   │   └── sql_validator.py          # SQL safety validation (SELECT-only, injection prevention)
│   └── routers/             # API Endpoints by resource
│       ├── __init__.py
│       ├── iniciativas.py         # Full CRUD + Search (custom)
│       ├── datos_relevantes.py    # Read-only + Search (custom)
│       ├── hechos.py              # Full CRUD + Search + Report (custom)
│       ├── datos_descriptivos.py  # Full CRUD + Search (custom)
│       ├── etiquetas.py           # Full CRUD + Search + Report (custom)
│       ├── fichas.py              # Full CRUD + Search (custom)
│       ├── informacion_economica.py # Full CRUD + Search (custom)
│       ├── acciones.py            # Full CRUD + Search + Report (custom)
│       ├── ltp.py                 # Full CRUD + Search + Report (custom)
│       ├── beneficios.py          # Factory CRUD
│       ├── facturacion.py         # Factory CRUD
│       ├── grupos_iniciativas.py  # Factory CRUD
│       ├── justificaciones.py     # Full CRUD + Report (custom)
│       ├── wbes.py                # Factory CRUD + Search
│       ├── notas.py               # Full CRUD + Report (custom)
│       ├── avance.py              # Factory CRUD
│       ├── descripciones.py       # Full CRUD + Report (custom)
│       ├── estado_especial.py     # Full CRUD (custom, single portfolio_id)
│       ├── investment_memos.py    # Full CRUD (custom, single portfolio_id)
│       ├── impacto_aatt.py        # Full CRUD (custom, single portfolio_id)
│       ├── dependencias.py        # Full CRUD + Search + Report (custom)
│       ├── datos_ejecucion.py     # Factory CRUD
│       ├── transacciones.py       # Read-only + Report (custom)
│       ├── transacciones_json.py  # CRUD + Report + Process (custom)
│       ├── migracion_metadata.py  # Read-only (custom)
│       ├── parametros.py          # Full CRUD + query by parameter name (custom)
│       ├── etiquetas_destacadas.py # Full CRUD (custom)
│       ├── documentos.py          # Full CRUD + Search + Report (custom)
│       ├── documentos_items.py    # Full CRUD + Search (custom)
│       ├── trabajos.py            # Management CLI jobs with SSE streaming (custom)
│       ├── stats.py               # Public stats overview (custom)
│       ├── agent.py               # AI agent chat with SSE streaming (custom)
│       ├── charts.py              # Serves generated chart images (GET /charts/{filename})
│       ├── sql.py                 # Read-only SQL query execution (custom)
│       └── portfolio.py           # Cross-table search (custom)
├── .env                     # Environment variables
├── .env.example             # Template
└── pyproject.toml           # Dependencies
```

---

## 4. API Endpoints

### 4.1 Standard CRUD Endpoints

For each table, the following endpoints are available:

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/v1/{table}`                 | List all (with pagination) |
| GET    | `/api/v1/{table}/{id}`            | Get by ID                |
| GET    | `/api/v1/{table}/portfolio/{pid}` | Get by portfolio_id      |
| POST   | `/api/v1/{table}`                 | Create new               |
| PUT    | `/api/v1/{table}/{id}`            | Update by ID             |
| DELETE | `/api/v1/{table}/{id}`            | Delete by ID             |

### 4.2 Read-Only Tables

Some tables are read-only (GET only):
- `datos-relevantes` - Computed by management module
- `migracion-metadata` - Generated during migration
- `transacciones` - Audit trail

### 4.2.1 Delete-Protected Tables

Some tables have DELETE operations explicitly disabled (HTTP 403 Forbidden):
- `datos-descriptivos` — Master record per initiative, delete is not permitted. The `DELETE /{id}` endpoint returns `403` with message "Delete operation is not permitted for Datos Descriptivos records." The frontend also disables the delete button via `disableDelete` prop on `EntityFormModal`.

### 4.3 Flexible Search Endpoints

Tables with advanced filtering capability:

| Table               | Search Endpoint                         |
|--------------------|-----------------------------------------|
| iniciativas        | POST `/api/v1/iniciativas/search`       |
| datos-relevantes   | POST `/api/v1/datos-relevantes/search`  |
| hechos             | POST `/api/v1/hechos/search`            |
| datos-descriptivos | POST `/api/v1/datos-descriptivos/search`|
| etiquetas          | POST `/api/v1/etiquetas/search`         |
| fichas             | POST `/api/v1/fichas/search`            |
| informacion-economica | POST `/api/v1/informacion-economica/search` |
| acciones           | POST `/api/v1/acciones/search`          |
| documentos         | POST `/api/v1/documentos/search`        |
| documentos-items   | POST `/api/v1/documentos-items/search`  |

**Search Request Body:**
```json
{
  "filters": [
    {"field": "estado_de_la_iniciativa", "operator": "eq", "value": "Aprobada"},
    {"field": "importe_2025", "operator": "gte", "value": 100000},
    {"field": "unidad", "operator": "in", "value": ["DSO", "DGR"]}
  ],
  "order_by": "importe_2025",
  "order_dir": "desc",
  "limit": 100,
  "offset": 0
}
```

**Supported Operators:**
- `eq` - Equal
- `ne` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `like` - SQL LIKE pattern match
- `ilike` - Case-insensitive LIKE
- `in` - In list
- `not_in` - Not in list
- `is_null` - Is NULL
- `is_not_null` - Is not NULL

### 4.4 Report Endpoints

Report endpoints provide dedicated search and filter-options for the Informes feature. Each report has a pair of endpoints: a GET for filter options and a POST for search.

**Important:** Report endpoints must be defined **before** dynamic path parameter routes (e.g., `/{id}`) in FastAPI routers to avoid route conflicts (422 errors).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hechos/report-hechos-filter-options` | Filter options for Hechos report |
| POST | `/api/v1/hechos/search-report-hechos` | Search Hechos (joins with datos_relevantes) |
| GET | `/api/v1/ltp/report-ltps-filter-options` | Filter options for LTPs report |
| POST | `/api/v1/ltp/search-report-ltps` | Search LTPs (joins with datos_descriptivos) |
| GET | `/api/v1/acciones/report-acciones-filter-options` | Filter options for Acciones report |
| POST | `/api/v1/acciones/search-report-acciones` | Search Acciones (joins with datos_descriptivos + iniciativas) |
| GET | `/api/v1/etiquetas/report-etiquetas-filter-options` | Filter options for Etiquetas report |
| POST | `/api/v1/etiquetas/search-report-etiquetas` | Search Etiquetas (joins with datos_descriptivos + datos_relevantes for estado_de_la_iniciativa) |
| GET | `/api/v1/justificaciones/report-justificaciones-filter-options` | Filter options for Justificaciones report |
| POST | `/api/v1/justificaciones/search-report-justificaciones` | Search Justificaciones (joins with datos_descriptivos) |
| GET | `/api/v1/dependencias/report-dependencias-filter-options` | Filter options for Dependencias report |
| POST | `/api/v1/dependencias/search-report-dependencias` | Search Dependencias (joins with datos_descriptivos) |
| GET | `/api/v1/descripciones/report-descripciones-filter-options` | Filter options for Descripciones report |
| POST | `/api/v1/descripciones/search-report-descripciones` | Search Descripciones (joins with datos_descriptivos) |
| GET | `/api/v1/notas/report-notas-filter-options` | Filter options for Notas report |
| POST | `/api/v1/notas/search-report-notas` | Search Notas (joins with datos_descriptivos) |
| GET | `/api/v1/transacciones/report-transacciones-filter-options` | Filter options for Transacciones report |
| POST | `/api/v1/transacciones/search-report-transacciones` | Search Transacciones (no joins) |
| GET | `/api/v1/transacciones-json/report-filter-options` | Filter options for Transacciones JSON report |
| POST | `/api/v1/transacciones-json/search-report` | Search Transacciones JSON (no joins) |
| GET | `/api/v1/documentos/report-documentos-filter-options` | Filter options for Documentos report |
| POST | `/api/v1/documentos/search-report-documentos` | Search Documentos (joins with datos_descriptivos) |
| POST | `/api/v1/transacciones-json/process` | Process pending JSON transaction diffs |
| POST | `/api/v1/transacciones-json/process-excel` | Trigger async Excel write-back for pending transactions |
| GET | `/api/v1/transacciones-json/process-excel-status` | Poll Excel processing status |
| GET | `/api/v1/transacciones-json/by-portfolio/{portfolio_id}` | Get transacciones_json by portfolio_id (via json_extract) |

### 4.7 Transaction Processor — Automatic Timestamps

The `transaction_processor.py` service automatically manages `fecha_actualizacion` for entities that have the column:

- **On INSERT:** Sets `fecha_actualizacion` to `datetime.now().isoformat()` in the insert data
- **On UPDATE:** Adds `fecha_actualizacion = datetime.now().isoformat()` to the cambios before applying

This is generic — any entity with a `fecha_actualizacion` column benefits automatically without frontend involvement. The `fecha_creacion` column is handled by SQLite's `DEFAULT CURRENT_TIMESTAMP` on the schema level.

#### 4.8 Auto-generation of id_hecho (Feature 030)

The `hechos` table uses `id_hecho` as primary key, which is NOT auto-increment (it was imported from Excel). The transaction processor auto-generates `id_hecho` for INSERT operations when not provided in the payload:

```python
if entidad == "hechos" and "id_hecho" not in insert_data:
    max_id = db.query(func.max(Hecho.id_hecho)).scalar()
    insert_data["id_hecho"] = (max_id or 0) + 1
```

This keeps the frontend simple (no need to query max ID) and avoids race conditions.

#### 4.9 Excel Write-Back Service (Feature 032)

The `excel_writer.py` service processes pending `transacciones_json` records (`estado_db=EJECUTADO`, `estado_excel=PENDIENTE`) and writes changes back to the original Excel source files via **xlwings** (Excel COM API).

**Architecture:**
- Triggered by `POST /process-excel` which launches a `BackgroundTasks` job
- Progress tracked via module-level `_processing_state` dict, polled by `GET /process-excel-status`
- Groups transactions by Excel file to minimize workbook open/close cycles
- Each transaction processed independently — one failure doesn't prevent others
- **Bulk-read optimization** (Feature 034): `_SheetCache` class reads entire sheet data in one COM call via `sheet.range().value`, then all row matching, PK reconciliation, and previous-value reads happen in pure Python. Cache is per-workbook, invalidated after INSERT/DELETE. Reduces COM calls from O(rows x pk_fields x transactions) to O(1) per sheet.
- **Open-workbook resilience** (Feature 039): `_find_open_workbook()` checks all running Excel instances (`xw.apps`) for an already-open copy of the target file before attempting to open it. If found, reuses the existing workbook reference and leaves it open after saving. If not found, opens normally via a lazily-created `xw.App(visible=False)` instance. Comprehensive `logger.debug()` messages trace detection, timing, sheet access, row matching, and save/close decisions.

**EXCEL_MAPPING** (`services/excel_mapping.py`): Parameterized mapping of 14 DB tables → Excel sheets with `excel_file`, `sheet_name`, `header_row`, `pk_fields`, and `column_mapping`.

**Composite pk_fields for 1:N entities** (Feature 033): 1:N entities use composite keys that uniquely identify a row in the Excel sheet, since `portfolio_id` alone is insufficient:

| Entity | pk_fields |
|--------|-----------|
| notas | `["portfolio_id", "fecha", "registrado_por"]` |
| etiquetas | `["portfolio_id", "etiqueta"]` |
| acciones | `["portfolio_id", "siguiente_accion"]` |
| justificaciones | `["portfolio_id", "tipo_justificacion"]` |
| descripciones | `["portfolio_id", "tipo_descripcion"]` |
| ltp | `["portfolio_id", "tarea"]` |
| wbes | `["portfolio_id", "anio", "wbe_pyb"]` |
| dependencias | `["portfolio_id", "descripcion_dependencia"]` |

**Special Behaviors:**
- `insert_blocked: true` (datos_descriptivos) — INSERT sets `estado_excel=NO_APLICA` since Excel is master
- `insert_pk_reconcile` (hechos) — Reads Excel max `id_hecho`, reassigns if conflict, updates both DB record and `clave_primaria` JSON

**Excel PK Resolver** (`services/excel_pk_resolver.py`, Feature 033): Resolves Excel-specific primary key values for a transaction at creation time. The resolved keys are stored in `clave_primaria_excel` (a new column on `transacciones_json`) and used by `excel_writer.py` to locate the correct row in the workbook. For INSERT: extracts pk_fields from `cambios`. For UPDATE/DELETE: looks up the current DB record and extracts pk_fields from its current state (capturing old values before changes are applied). The `clave_primaria_excel` field is auto-populated by the `POST /transacciones-json/` endpoint — the frontend does not send it.

**Configuration:** `EXCEL_SOURCE_DIR` in `.env` (default: `../management/excel_source`)

**Filter Options Response Pattern:**
```json
{
  "field_name_1": ["value1", "value2", ...],
  "field_name_2": ["value1", "value2", ...]
}
```

Report search endpoints return the standard `PaginatedResponse` format.

### 4.5 Cross-Table Portfolio Search

Search across all tables by portfolio_id:

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/api/v1/portfolio/{pid}/related` | Find initiatives related by shared cluster, unidad, or etiquetas |
| GET    | `/api/v1/portfolio/{pid}/timeline` | Unified activity timeline merging hechos, notas, and transacciones_json |
| GET    | `/api/v1/portfolio/{pid}`       | Get all data for a portfolio_id |
| POST   | `/api/v1/portfolio/search`      | Search multiple portfolio_ids  |

**Important:** The `/related` and `/timeline` routes are defined **before** the `GET /{portfolio_id}` route in `routers/portfolio.py` to avoid FastAPI route conflicts.

**Related Initiatives** (`GET /portfolio/{portfolio_id}/related`):

Finds initiatives that share cluster, unidad, or etiquetas with the given portfolio_id. Returns a maximum of 20 results.

```json
{
  "portfolio_id": "SPA_25_01",
  "related": [
    {
      "portfolio_id": "SPA_25_05",
      "nombre": "Iniciativa Ejemplo",
      "reasons": [
        { "type": "cluster", "value": "Cluster Digital" },
        { "type": "etiqueta", "value": "Cloud" }
      ]
    }
  ]
}
```

**Activity Timeline** (`GET /portfolio/{portfolio_id}/timeline`):

Unified timeline merging records from hechos, notas, and transacciones_json into a single chronologically sorted stream. Supports pagination via `limit` and `offset` query parameters.

```json
{
  "portfolio_id": "SPA_25_01",
  "total": 42,
  "timeline": [
    {
      "date": "2025-06-15T10:30:00",
      "type": "hecho",
      "summary": "Aprobacion presupuestaria",
      "detail": "Se aprueba el presupuesto para fase 2",
      "user": "Juan Garcia",
      "badge": "info",
      "source_id": "123"
    }
  ]
}
```

**Portfolio Search Request:**
```json
{
  "portfolio_ids": ["P001", "P002", "P003"],
  "tables": ["iniciativas", "hechos", "datos_descriptivos"]
}
```

### 4.6 Parametros Endpoints

Full CRUD endpoints for managing allowed dropdown values for codified fields. The `parametros` table is initially populated by the migration CLI (`PARAMETRIC_SOURCES` in `engine.py`) and is not part of the `table_registry` (uses a custom router).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/parametros/` | List all parametros (optional `nombre_parametro` query filter) |
| POST | `/api/v1/parametros/` | Create a new parametro |
| PUT | `/api/v1/parametros/{id}` | Update an existing parametro by ID |
| DELETE | `/api/v1/parametros/{id}` | Delete a parametro by ID |
| GET | `/api/v1/parametros/{nombre_parametro}` | Get sorted list of allowed values for a parameter |

**Important:** All CRUD routes (list, create, update, delete) are defined **before** the dynamic `GET /{nombre_parametro}` route to avoid FastAPI route conflicts.

**Schemas** (`schemas.py`):

| Schema | Fields | Description |
|--------|--------|-------------|
| `ParametroCreate` | `nombre_parametro` (str), `valor` (str), `orden` (int, optional), `color` (str, optional) | Create a new parametro |
| `ParametroUpdate` | `nombre_parametro` (str, optional), `valor` (str, optional), `orden` (int, optional), `color` (str, optional) | Partial update of a parametro |

**GET `/parametros/{nombre_parametro}` Response:** Array of objects with `valor` and `color`, sorted by the `orden` column.

```json
[
  {"valor": "Aprobada", "color": "emerald"},
  {"valor": "En Ejecucion", "color": null},
  {"valor": "Cancelado", "color": "red"}
]
```

**Model:** `Parametro` (`parametros` table)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK, autoincrement) | Row identifier |
| nombre_parametro | TEXT (NOT NULL) | Parameter group name (e.g., `estado_de_la_iniciativa`) |
| valor | TEXT (NOT NULL) | Allowed value |
| orden | INTEGER (default 0) | Sort order within the parameter group |
| color | TEXT (default NULL) | Optional color name for UI display (e.g., `emerald`, `red`, `blue`) |
| fecha_creacion | TEXT (default CURRENT_TIMESTAMP) | Row creation timestamp |

The `estado_de_la_iniciativa` parameter group is pre-seeded with 21 color values matching the canonical workflow states (e.g., Recepción → slate, Aprobada → emerald, Cancelado → red).

**Router:** `routers/parametros.py` — Custom router with full CRUD, not registered in `table_registry`. The `GET /{nombre_parametro}` endpoint returns 404 if no values found for the given parameter name.

### 4.10 Etiquetas Destacadas Endpoints

Full CRUD endpoints for managing highlighted tags (etiquetas destacadas) that are displayed as badges on initiative headers and drawers.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/etiquetas-destacadas/` | List all etiquetas destacadas |
| POST | `/api/v1/etiquetas-destacadas/` | Create a new etiqueta destacada |
| PUT | `/api/v1/etiquetas-destacadas/{id}` | Update an existing etiqueta destacada by ID |
| DELETE | `/api/v1/etiquetas-destacadas/{id}` | Delete an etiqueta destacada by ID |

**Schemas** (`schemas.py`):

| Schema | Fields | Description |
|--------|--------|-------------|
| `EtiquetaDestacadaCreate` | `etiqueta` (str), `color` (str, optional), `orden` (int, optional) | Create a new etiqueta destacada |
| `EtiquetaDestacadaUpdate` | `etiqueta` (str, optional), `color` (str, optional), `orden` (int, optional) | Partial update of an etiqueta destacada |

**Model:** `EtiquetaDestacada` (`etiquetas_destacadas` table)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK, autoincrement) | Row identifier |
| etiqueta | TEXT (NOT NULL) | Tag value (must match an etiqueta in the etiquetas table) |
| color | TEXT (default 'blue') | Badge color for display |
| orden | INTEGER (default 0) | Sort order |
| fecha_creacion | TEXT (default CURRENT_TIMESTAMP) | Row creation timestamp |

**Router:** `routers/etiquetas_destacadas.py` — Custom router with full CRUD, not registered in `table_registry`.

### 4.11 Documentos Endpoints (Feature 043)

Full CRUD endpoints for managing documents linked to portfolio initiatives. The `documentos` table tracks document metadata including file references, processing status, and AI-generated summaries.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documentos/` | List all documentos (paginated) |
| GET | `/api/v1/documentos/report-documentos-filter-options` | Filter options for Documentos report |
| POST | `/api/v1/documentos/search-report-documentos` | Search Documentos (joins with datos_descriptivos) |
| GET | `/api/v1/documentos/portfolio/{portfolio_id}` | Get documentos by portfolio_id |
| POST | `/api/v1/documentos/search` | Flexible search with filters |
| GET | `/api/v1/documentos/{nombre_fichero}` | Get a documento by nombre_fichero |
| POST | `/api/v1/documentos/` | Create a new documento |
| PUT | `/api/v1/documentos/{nombre_fichero}` | Update an existing documento |
| DELETE | `/api/v1/documentos/{nombre_fichero}` | Delete a documento |

**Schemas** (`schemas.py`):

| Schema | Fields | Description |
|--------|--------|-------------|
| `DocumentoCreate` | `nombre_fichero` (str), `portfolio_id` (str), `tipo_documento` (str, optional), `enlace_documento` (str, optional), `estado_proceso_documento` (str, optional), `resumen_documento` (str, optional), `ruta_documento` (str, optional) | Create a new documento |
| `DocumentoUpdate` | `portfolio_id` (str, optional), `tipo_documento` (str, optional), `enlace_documento` (str, optional), `estado_proceso_documento` (str, optional), `resumen_documento` (str, optional), `ruta_documento` (str, optional) | Partial update of a documento |
| `DocumentosReportRequest` | Extends report search pattern with document-specific filters | Search request for Documentos report |

**Model:** `Documento` (`documentos` table)

| Column | Type | Description |
|--------|------|-------------|
| nombre_fichero | TEXT (PK) | File name, primary key |
| portfolio_id | TEXT | Reference to the initiative |
| tipo_documento | TEXT | Document type classification |
| enlace_documento | TEXT | Link/URL to the document |
| estado_proceso_documento | TEXT | Processing status of the document |
| resumen_documento | TEXT | AI-generated or manual summary |
| ruta_documento | TEXT | File system path to the document |
| fecha_creacion | TEXT (default CURRENT_TIMESTAMP) | Row creation timestamp |
| fecha_actualizacion | TEXT | Last update timestamp |

**Router:** `routers/documentos.py` — Custom router with full CRUD + Search + Report, registered in `table_registry`.

### 4.12 Documentos Items Endpoints (Feature 047)

Full CRUD endpoints for managing document content items (extracted sections/pages from documents).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documentos-items/` | List all documentos_items (paginated) |
| GET | `/api/v1/documentos-items/portfolio/{portfolio_id}` | Get documentos_items by portfolio_id |
| POST | `/api/v1/documentos-items/search` | Flexible search with filters |
| GET | `/api/v1/documentos-items/{id}` | Get a documento_item by id |
| POST | `/api/v1/documentos-items/` | Create a new documento_item |
| PUT | `/api/v1/documentos-items/{id}` | Update an existing documento_item |
| DELETE | `/api/v1/documentos-items/{id}` | Delete a documento_item |

**Schemas** (`schemas.py`):

| Schema | Fields | Description |
|--------|--------|-------------|
| `DocumentoItemCreate` | `nombre_fichero` (str), `portfolio_id` (str), `page_number` (int, optional), `section_title` (str, optional), `content_text` (str, optional) | Create a new documento_item |
| `DocumentoItemUpdate` | `nombre_fichero` (str, optional), `portfolio_id` (str, optional), `page_number` (int, optional), `section_title` (str, optional), `content_text` (str, optional) | Partial update of a documento_item |

**Model:** `DocumentoItem` (`documentos_items` table)

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK, autoincrement) | Row identifier |
| nombre_fichero | TEXT | Reference to parent document in documentos table |
| portfolio_id | TEXT | Reference to the initiative |
| page_number | INTEGER | Page or section number |
| section_title | TEXT | Title or heading of the section |
| content_text | TEXT | Extracted text content |
| fecha_creacion | TEXT (default CURRENT_TIMESTAMP) | Row creation timestamp |
| fecha_actualizacion | TEXT | Last update timestamp |

**Router:** `routers/documentos_items.py` — Custom router with full CRUD + Search, registered in `table_registry`.

### 4.13 Trabajos Endpoints (Feature 049)

Endpoints for executing management CLI commands from the web UI with real-time streaming output via Server-Sent Events (SSE).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/trabajos/status` | Get current job status (running, command, start_time, pid) |
| POST | `/api/v1/trabajos/proceso-completo` | Run `complete_process` management command (SSE) |
| POST | `/api/v1/trabajos/escanear-documentos` | Run `scan_documents` management command (SSE) |
| POST | `/api/v1/trabajos/sumarizar-documentos` | Run `summarize_documentos` management command (SSE) |

**Architecture:**
- POST endpoints return `StreamingResponse` with `media_type="text/event-stream"`
- The subprocess is launched via `asyncio.create_subprocess_exec` using the configured `UV_EXECUTABLE`
- stdout and stderr are read concurrently via an `asyncio.Queue` and emitted as separate SSE event types (`output` for stdout, `error` for stderr)
- A `status` SSE event is sent at the start (`running`) and end (`completed`/`failed`) of each job, including `exit_code` and `duration_seconds`

**Singleton Guard:** Only one job can run at a time. If a job is already running, POST endpoints return HTTP 409 Conflict with a detail message including the running command name and start time. The `GET /status` endpoint returns the current state without blocking.

**SSE Event Types:**

| Event | Fields | Description |
|-------|--------|-------------|
| `status` | `status`, `command`, `exit_code`, `duration_seconds`, `error` | Job lifecycle events |
| `output` | `line`, `stream` ("stdout"), `timestamp` | Standard output lines |
| `error` | `line`, `stream` ("stderr"), `timestamp` | Standard error lines |

**Configuration** (in `config.py`):

| Variable | Default | Description |
|----------|---------|-------------|
| `MANAGEMENT_DIR` | `../management` | Path to management module directory (relative to backend/) |
| `UV_EXECUTABLE` | `uv` | Path to the `uv` executable |

**Router:** `routers/trabajos.py` — Custom router with prefix `/trabajos`, not registered in `table_registry`.

### 4.14 Stats Endpoints (Feature 060)

Public endpoint providing aggregate portfolio statistics for the landing page.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats/overview` | Get portfolio overview stats (initiative count, total budget, table count) |

**Schema** (`schemas.py`):

| Schema | Fields | Description |
|--------|--------|-------------|
| `StatsOverview` | `total_initiatives` (int), `total_budget` (float), `total_tables` (int) | Aggregate portfolio statistics |

**Router:** `routers/stats.py` — Custom router with prefix `/stats`, not registered in `table_registry`. No authentication required.

### 4.15 Agent Chat Endpoint (Feature 063)

AI-powered chat assistant that answers natural language questions about the portfolio by querying the API using Claude as the reasoning engine.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agent/chat` | AI agent chat with SSE streaming |

**Architecture:**
- The endpoint accepts a JSON body with `messages` (conversation history) and an optional `conversation_id`
- Returns a `StreamingResponse` with `media_type="text/event-stream"` for real-time token streaming
- The `orchestrator.py` manages a multi-turn conversation loop with Claude, dispatching tool calls to the portfolio API via `tools_executor.py`
- `api_client.py` makes internal HTTP calls to the same FastAPI backend (self-calling pattern via `httpx.AsyncClient`)
- `table_metadata.py` provides table descriptions and searchable field metadata used to build the system prompt and tool definitions
- `tools_definition.py` defines 11 tools matching the MCP server pattern: buscar_iniciativas, buscar_en_tabla, obtener_iniciativa, obtener_documentos, contar_iniciativas, totalizar_importes, listar_tablas, describir_tabla, obtener_valores_campo, generar_grafico, ejecutar_consulta_sql
- `tools_executor.py` routes `generar_grafico` calls to the `charts/` module, which renders the chart as a PNG file saved to `CHART_OUTPUT_DIR` and returns the filename; the agent then includes a markdown image reference (`![chart](url)`) in its response
- `system_prompt.py` includes a visualization suggestion guideline instructing the model to offer chart generation when presenting tabular aggregation results. Additional prompt guidelines: (a) `importe_YYYY` is the default field for generic financial queries (e.g., "cuanto dinero"), (b) "fuera de budget" queries use the `cluster` field from `datos_relevantes` (not a dedicated flag), (c) `cluster_2025_antes_de_19062025` is deprecated and should not be used

**SSE Event Types:**

| Event | Fields | Description |
|-------|--------|-------------|
| `token` | `content` | Individual text tokens as they stream from Claude |
| `tool_start` | `tool`, `input` | Signals the beginning of a tool call |
| `tool_result` | `tool`, `result_preview` | Summary of tool call result |
| `error` | `message` | Error information |
| `done` | `conversation_id` | Signals end of response |

**Router:** `routers/agent.py` — Custom router with prefix `/agent`, not registered in `table_registry`.

### 4.16 Charts Endpoint (Feature 066)

Serves generated chart images produced by the AI agent's `generar_grafico` tool.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/charts/{filename}` | Serve a generated chart image (PNG) |

**Architecture:**
- Chart images are saved to `CHART_OUTPUT_DIR` (default: `charts_output/` relative to backend) by the `charts/renderer.py` module
- Files are served with `FileResponse` and `media_type="image/png"`
- Auto-cleanup: files older than `CHART_MAX_AGE_HOURS` (default: 24) are removed on each request
- Filenames are UUID-based to prevent collisions and path traversal
- **Order Preservation (Feature 068):** The chart renderer preserves the input data order provided by the AI agent. For horizontal bar charts, the first item in the data appears at the top of the chart. The agent controls the presentation order (alphabetical, by value, by date, etc.)

**Router:** `routers/charts.py` — Custom router with prefix `/charts`, not registered in `table_registry`. No authentication required.

### 4.17 SQL Query Endpoint (Feature 067)

Execute read-only SQL SELECT queries against the portfolio database. Designed for AI agents and advanced users who need flexible data access beyond the predefined search endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sql/execute` | Execute a read-only SQL SELECT query |

**Request Body:**
```json
{
  "sql": "SELECT portfolio_id, nombre FROM datos_relevantes WHERE anio = 2025 LIMIT 10",
  "max_rows": 100
}
```

**Response:**
```json
{
  "sql": "SELECT portfolio_id, nombre FROM datos_relevantes WHERE anio = 2025 LIMIT 10",
  "columns": ["portfolio_id", "nombre"],
  "data": [
    {"portfolio_id": "SPA_25_01", "nombre": "Iniciativa Ejemplo"},
    ...
  ],
  "total_rows": 10,
  "truncated": false,
  "execution_time_ms": 12.5
}
```

**SQL Validator** (`services/sql_validator.py`): Validates SQL safety before execution using `sqlparse`:
- Only SELECT statements are allowed (no INSERT, UPDATE, DELETE, DROP, ALTER, etc.)
- Blocks dangerous patterns (injection attempts, multiple statements, PRAGMA, ATTACH)
- Enforces row limits via the `max_rows` parameter

**New dependency:** `sqlparse` added to `pyproject.toml`

**Router:** `routers/sql.py` — Custom router with prefix `/sql`, not registered in `table_registry`.

---

## 5. Database Models

The API provides access to 29 database tables:

| Category | Tables |
|----------|--------|
| Core | iniciativas, grupos_iniciativas |
| Descriptive | datos_descriptivos |
| Financial | informacion_economica, facturacion |
| Operational | datos_ejecucion, hechos |
| Benefits | beneficios |
| Supporting | etiquetas, justificaciones, ltp, wbes, dependencias |
| Additional | notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt, documentos, documentos_items |
| Fichas | fichas |
| Computed | datos_relevantes |
| Parametric | parametros, etiquetas_destacadas |
| Audit | transacciones, transacciones_json, migracion_metadata |

**Notable `datos_relevantes` fields:**
- `iniciativa_cerrada_economicamente` — "Cerrado en año YYYY" (with year from `partida_presupuestaria` of the closing hecho) or "No"
- `activo_ejercicio_actual` — "Si" if the initiative is not economically closed AND has importe > 0 in the current fiscal year, otherwise "No"

### 5.1 Calculated Fields

Approximately 51 fields that were previously stored redundantly across 19 tables have been removed from the database. These fields are now computed on-the-fly by the `calculated_fields/` module. Individual record endpoints use `model_to_dict_with_calculated()`, while list endpoints use `batch_model_to_dict_with_calculated()` with a shared `LookupCache` to avoid N+1 query problems. The API response shape is unchanged -- consumers see the same fields as before.

**LookupCache:** Per-request cache that stores source records (datos_descriptivos, datos_relevantes, informacion_economica) by portfolio_id. Created once per batch request, shared across all records in the response. Reduces queries from O(N * fields) to O(unique_portfolio_ids).

---

## 6. Configuration

### Environment Variables (.env)

```env
# Logging
LOG_LEVEL=INFO
LOG_FILE=portfolio_backend.log
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s

# API Settings
API_PREFIX=/api/v1
API_TITLE=Portfolio Digital API
API_VERSION=1.0.0

# Database
DATABASE_PATH=              # Empty = auto-detect relative to project root
DATABASE_ECHO=false         # Log SQL queries

# CORS
CORS_ORIGINS=["http://localhost:5173"]

# Excel Write-Back
EXCEL_SOURCE_DIR=../management/excel_source

# Management CLI (Trabajos)
MANAGEMENT_DIR=../management
UV_EXECUTABLE=uv

# AI Agent (Chat)
AGENT_MODEL=claude-sonnet-4-20250514
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.3
AGENT_MAX_TOOL_ROUNDS=15
AGENT_API_BASE_URL=http://localhost:8000/api/v1
ANTHROPIC_API_KEY=sk-ant-...

# Chart Generation
CHART_DPI=150
CHART_DEFAULT_WIDTH=10
CHART_DEFAULT_HEIGHT=6
CHART_MAX_CATEGORIES=15
CHART_LOCALE=es_ES
CHART_OUTPUT_DIR=charts_output
CHART_MAX_AGE_HOURS=24
```

### Logging

- **Log file**: `PROJECT_ROOT/logs/portfolio_backend.log`
- **Console output**: INFO and above
- **Configurable**: LOG_LEVEL, LOG_FORMAT in .env
- **Request logging**: `RequestLoggingMiddleware` logs method/path/status/duration (skips health/docs)

---

## 7. Running the API

```bash
cd backend

# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**API Documentation:**
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

---

## 8. Response Formats

### Paginated Response

```json
{
  "total": 813,
  "data": [...],
  "limit": 100,
  "offset": 0
}
```

### Error Response

```json
{
  "detail": "Error message"
}
```

---

## 9. Dependencies

```toml
[project]
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy>=2.0.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "python-dotenv>=1.0.0",
    "xlwings>=0.33.0",
    "anthropic>=0.40.0",
    "httpx>=0.27.0",
    "matplotlib>=3.8",
    "sqlparse>=0.5.0",
]
```
