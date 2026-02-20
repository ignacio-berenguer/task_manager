# Portfolio Digital

Full-stack portfolio management system for IT initiatives. Consolidates data from 5 Excel workbooks (~90,000 rows across 30+ sheets) into a normalized SQLite database, exposes it through a REST API, and provides a rich web application with dashboards, search, reports, and detail views.

## Architecture

| Module | Technology | Purpose |
|--------|-----------|---------|
| `management/` | Python 3.12, pandas, openpyxl | CLI tool for Excel-to-SQLite migration, calculation, validation, and export |
| `backend/` | Python 3.12, FastAPI, SQLAlchemy, anthropic, httpx | REST API with CRUD, flexible search, reports, calculated fields, and AI agent |
| `backend/app/agent/` | Python 3.12, Anthropic SDK, httpx | AI agent chat: Claude-powered assistant with portfolio tools for natural-language queries |
| `frontend/` | React 19, Vite, Tailwind CSS | SPA with dashboard, search, 11 report pages, initiative detail, and AI chat |
| `mcp_server/` | Python 3.12, MCP SDK, httpx, matplotlib | MCP server for AI agents — read-only portfolio access via 11 tools (incl. SQL query and chart generation) |

## Quick Start

### Prerequisites

- Python 3.12+ with [`uv`](https://docs.astral.sh/uv/) package manager
- Node.js 18+ with `npm`

### 1. Migration (populate the database)

```bash
cd management
uv sync
cp .env.example .env                                      # Configure paths (optional)
uv run python manage.py complete_process                    # Full pipeline: recreate + migrate + calculate + export + scan
```

### 2. Backend API

```bash
cd backend
uv sync
cp .env.example .env                                      # Configure (optional)
uv run uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env                                      # Add Clerk key + API URL
npm run dev                                               # http://localhost:5173
```

### 4. MCP Server (AI Agent Interface)

**Prerequisite:** The backend API must be running on port 8000.

```bash
cd mcp_server
uv sync
cp .env.example .env                                      # Configure (optional)
uv run -m mcp_portfolio                                    # Start MCP server (stdio mode)
```

**Claude Code integration** (project-scoped via `.mcp.json` — already configured):
```bash
# Tools are automatically available when Claude Code is opened in the project
```

**Claude Desktop** (Windows — `%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "portfolio-digital": {
      "command": "uv",
      "args": ["--directory", "C:\\Users\\ignac\\dev\\portfolio_migration\\mcp_server", "run", "-m", "mcp_portfolio"]
    }
  }
}
```

**Available MCP Tools** (11 tools, descriptions in Spanish):

| Tool | Purpose |
|------|---------|
| `buscar_iniciativas` | Search datos_relevantes with flexible filters |
| `buscar_en_tabla` | Search any table |
| `obtener_iniciativa` | Get all data for a portfolio_id |
| `obtener_documentos` | Get/search document AI summaries |
| `contar_iniciativas` | Count initiatives by dimension |
| `totalizar_importes` | Aggregate importe fields |
| `listar_tablas` | List available tables |
| `describir_tabla` | Describe table columns |
| `obtener_valores_campo` | Get distinct field values |
| `ejecutar_consulta_sql` | Execute read-only SQL SELECT queries with safety validation |
| `generar_grafico` | Generate charts (bar, pie, line, stacked) from portfolio data |

## Project Structure

```
portfolio_migration/
├── management/                      # Migration CLI tool
│   ├── manage.py                    # CLI entry point (9 commands)
│   ├── .env / .env.example          # Configuration
│   ├── src/
│   │   ├── core/                    # logging_config.py, data_quality.py
│   │   ├── config/                  # settings.py (loads .env)
│   │   ├── init/                    # db_init.py
│   │   ├── migrate/                 # engine.py, excel_readers.py
│   │   ├── calculate/               # engine.py, estado/importe/lookup/helper functions
│   │   ├── export/                  # excel_export.py, documentos_items_export.py
│   │   ├── scan/                    # Document scanner (scan_documents)
│   │   ├── summarize/               # LLM document summarization (summarize_documentos)
│   │   └── validate/                # validator.py
│   ├── excel_source/                # Excel workbooks (gitignored)
│   └── excel_output/                # Excel output (gitignored)
│
├── db/
│   ├── schema.sql                   # Complete DDL (28 tables)
│   └── portfolio.db                 # SQLite database (gitignored)
│
├── backend/                         # FastAPI REST API
│   ├── app/
│   │   ├── main.py                  # Entry point + CORS + router registration
│   │   ├── config.py                # Environment config
│   │   ├── database.py              # SQLite connection
│   │   ├── models.py                # 25 SQLAlchemy ORM models
│   │   ├── agent/                   # AI agent chat module
│   │   │   ├── config.py            # Agent configuration (model, tokens, temperature)
│   │   │   ├── table_metadata.py    # Table descriptions + search capabilities
│   │   │   ├── api_client.py        # Async HTTP client (httpx) for API self-calls
│   │   │   ├── tools_definition.py  # 10 tool schemas in Anthropic API format
│   │   │   ├── tools_executor.py    # Tool execution logic
│   │   │   ├── system_prompt.py     # System prompt with portfolio context
│   │   │   └── orchestrator.py      # Agentic loop with streaming + tool execution
│   │   ├── calculated_fields/       # On-the-fly computed fields (~51 fields)
│   │   │   ├── definitions.py       # Field mappings & metadata
│   │   │   ├── lookup.py            # Lookup functions
│   │   │   ├── cache.py             # LookupCache for batch processing
│   │   │   ├── estado.py            # Estado/justification calculations
│   │   │   ├── utils.py             # Utility calculations
│   │   │   └── service.py           # CalculatedFieldService orchestrator
│   │   ├── schemas.py               # Pydantic validation schemas
│   │   ├── crud.py                  # Reusable CRUD operations
│   │   ├── search.py                # Flexible search with operators
│   │   ├── router_factory.py        # Generic CRUD router factory
│   │   ├── table_registry.py        # TABLE_MODELS mapping
│   │   ├── services/
│   │   │   ├── transaction_processor.py  # JSON diff processor
│   │   │   ├── excel_mapping.py          # DB-to-Excel field mapping config
│   │   │   ├── excel_pk_resolver.py      # Excel-specific PK resolution at transaction creation
│   │   │   └── excel_writer.py           # Excel write-back via xlwings
│   │   └── routers/                 # 27 API endpoint files
│   ├── pyproject.toml
│   └── .env                         # Configuration (gitignored)
│
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── api/client.js            # Axios + Clerk JWT interceptors
│   │   ├── components/
│   │   │   ├── ui/                  # Base components (Button, Dialog, DatePicker, MultiSelect, etc.)
│   │   │   ├── layout/              # Navbar, Footer, Layout
│   │   │   ├── theme/               # ThemeProvider, ModeToggle
│   │   │   └── shared/              # ProtectedRoute, SidebarNav, ColumnConfigurator, EstadoTag, EmptyState, InitiativeDrawer, JsonViewerModal, SummaryViewerModal, ConsoleDialog, ErrorBoundary, NotFoundPage
│   │   ├── features/
│   │   │   ├── landing/             # Public landing page (hero + changelog)
│   │   │   ├── dashboard/           # KPIs, charts, filters, sidebar nav
│   │   │   ├── search/              # Initiative search + data grid + export
│   │   │   ├── reports/             # 11 report pages (GenericReportPage pattern)
│   │   │   ├── detail/              # Initiative detail (21 accordion sections, sidebar nav, CRUD)
│   │   │   └── chat/                # AI agent chat (ChatContext persistence, streaming, markdown, portfolio links, thinking accordion)
│   │   ├── lib/                     # changelog.js, estadoOrder.js, logger.js, storage.js, utils.js, version.js
│   │   └── providers/               # QueryProvider, combined Providers
│   ├── .env / .env.example
│   ├── package.json
│   └── vite.config.js
│
├── mcp_server/                      # MCP server for AI agents
│   ├── pyproject.toml               # Package config (mcp[cli], httpx, python-dotenv)
│   ├── .env / .env.example          # Configuration
│   └── src/mcp_portfolio/           # Server + 11 MCP tools
│       ├── server.py                # FastMCP instance + entry point
│       ├── api_client.py            # HTTP client for FastAPI backend
│       ├── table_metadata.py        # Table descriptions + search capabilities
│       └── tools/                   # Tool implementations (busqueda, detalle, agregacion, esquema)
│
├── logs/                            # Centralized logs (gitignored)
├── specs/                           # Technical specifications
│   ├── specs.md                     # Core technical specs
│   ├── architecture/                # Architecture documents
│   │   ├── architecture_management.md
│   │   ├── architecture_backend.md
│   │   ├── architecture_frontend.md
│   │   └── architecture_agent.md
│   └── features/                    # Feature specs (implemented/ has feature_001–feature_066)
│
├── .claude/skills/                  # Custom Claude Code skills
│   ├── create_feature/SKILL.md      # /create_feature — scaffold new feature folder
│   ├── plan_feature/SKILL.md        # /plan_feature — plan a feature from requirements
│   ├── develop_feature/SKILL.md     # /develop_feature — implement feature from plan
│   └── close_feature/SKILL.md       # /close_feature — verify docs, move to implemented, commit+push
│
├── CLAUDE.md                        # Claude Code instructions
└── README.md                        # This file
```

## Features

### Frontend Application

- **Landing Page** — Public page at `/` with hero section (auth-conditional CTA button: "Ir al Dashboard" for signed-in users, "Iniciar Sesión" for guests), dynamic stats from API with loading skeletons, and changelog (version history with search filter, collapsible version groups)
- **Dashboard** — Portfolio KPIs and interactive charts at `/dashboard`
  - 4 KPI cards: Total initiatives, Budget (year), Approved, In Execution — financial KPIs show year-over-year trend arrows
  - 6 chart pairs (12 cards): Priorizacion, Unidad, Framework, Cluster, Estado — count and importe views
  - Chart tooltips show value and percentage of total (e.g., "42 (15.3% del total)")
  - Truncated bar chart labels show full text on hover via native tooltip
  - 2 list cards: Top value initiatives (configurable threshold), Recent changes
  - 9 filters in collapsible panel: Year, Digital Framework, Unidad, Cluster, Estado, Previstas, Cerrada Econ., Excl. Canceladas, Excl. EPTs
  - Active filter count badge shown when filter panel is collapsed
  - Sticky sidebar navigation (xl+ screens) with section links and active highlighting
  - Chart PNG export: download any chart as a PNG image
  - Chart-to-Search navigation: double-click any bar to search matching initiatives
  - All filter and panel collapse selections persisted to localStorage
- **Search Page** — Flexible initiative search at `/search`
  - 9 filter criteria: Portfolio ID, Nombre, Digital Framework, Unidad, Estado, Cluster, Tipo, Etiquetas, Cerrada Economicamente
  - Saved searches: save, load, and delete named filter configurations (up to 20, stored in localStorage)
  - Filter chips bar: active filters displayed as removable chips above the data grid for quick reference and removal
  - Row selection with checkboxes persists across page changes; clears on filter/sort changes; selection count in toolbar; "Copy IDs" button copies selected portfolio_ids to clipboard
  - Smart paste in Portfolio ID filter: auto-normalizes pasted text (newlines, tabs, semicolons, spaces) into comma-separated IDs, with format validation (SPA_YY_NNN) and amber warnings for non-matching IDs
  - Configurable data grid: select and drag-and-drop reorder columns from 60+ available
  - Favorites system: star icon per row to mark initiatives as favorites (persisted to localStorage), toolbar with copy portfolio IDs, edit favorites dialog, and clear all
  - Initiative quick-view drawer: dedicated column before Portfolio ID, sliding side panel showing initiative summary (key fields + current year importe), Hechos, Notas, Justificaciones, Descripciones, and Dependencias tables via portfolio endpoint, with "Go to Initiative" navigation
  - LTP Quick Edit Modal: edit LTP records directly from search results via transacciones_json system (create, edit, delete)
  - Export to TSV, CSV, JSON, Excel formats (respects column selection, order, and current sort)
  - View mode toggle: switch between table view and card-based grid view (persisted to localStorage); card view shows key fields (portfolio_id link, nombre, estado, importe, unidad, cluster) in a responsive grid
  - Column-level filtering: per-column filter popovers (text contains, multi-select checkbox, numeric min/max range) for client-side filtering on server results; "Limpiar filtros columna" button to clear all
  - Row grouping: "Agrupar por" dropdown to group rows by Estado, Unidad, Cluster, Digital Framework, or Tipo with collapsible group headers showing row counts
  - Server-side sorting and pagination (25/50/100/200 rows per page)
  - All preferences (filters, columns, page size, filter panel collapsed state, saved searches, view mode) persisted to localStorage
  - All MultiSelect filter dropdowns support type-ahead search
- **Reports (Informes)** — 11 report pages under `/informes` with Navbar dropdown
  - **Hechos**: Facts in a date range joined with portfolio data at `/informes/hechos`
  - **LTPs**: LTP tasks with responsable/estado filters at `/informes/ltps`
  - **Acciones**: Actions with date range and estado filters at `/informes/acciones`
  - **Etiquetas**: Tags with portfolio/nombre/etiqueta filters at `/informes/etiquetas`
  - **Justificaciones**: Justifications with tipo/portfolio filters at `/informes/justificaciones`
  - **Dependencias**: Dependencies with portfolio/descripcion filters at `/informes/dependencias`
  - **Descripciones**: Descriptions with tipo/portfolio filters at `/informes/descripciones`
  - **Notas**: Notes with registrado_por/portfolio filters at `/informes/notas`
  - **Documentos**: Documents associated with initiatives at `/informes/documentos`, with JSON viewer and formatted summary viewer modals for LLM-generated document summaries, SharePoint document links, initiative side drawer, and estado_proceso_documento displayed as colored tags
  - **Transacciones**: Transaction audit trail with multiple filters at `/informes/transacciones`
  - **Transacciones JSON**: JSON transaction diffs with status tracking at `/informes/transacciones-json`
  - Shared features: server-side pagination & sorting, sticky table headers, configurable columns with drag-and-drop reordering, data-driven filters, per-report localStorage persistence, collapsible row mode for Transacciones reports (with colored badges and expandable detail rows), estado fields displayed as colored EstadoTag components across reports, initiative quick-view drawer button in Hechos/LTPs/Acciones/Documentos, expandable rows in Hechos report, expandable rows in LTP report for comentarios, aggregation footer row (sum/count/avg for configured columns on current page), date range quick-select presets (7d/30d/month/quarter/year), filter-aware empty state with active filter badges, saved report templates (save/load/delete named configurations, max 10 per report), cross-report navigation per row (dropdown to jump to related reports pre-filtered by portfolio_id)
- **Parametricas Pages** — Parametric values management (Navbar dropdown)
  - **Parametricas**: View and manage dropdown values for codified fields (parametros table) at `/parametricas`
  - **Etiquetas Destacadas**: Manage highlighted tags for initiatives (etiquetas_destacadas table) at `/parametricas/etiquetas-destacadas`, with badge display in DetailHeader and InitiativeDrawer
- **Detail Page** — Comprehensive initiative view at `/detail/:portfolio_id`
  - 21 data sections in controlled accordion layout with "Expandir Todo" / "Contraer Todo" buttons for global expand/collapse control
  - Sections without data are hidden from the accordion list and consolidated into a "Secciones sin datos" summary panel at the bottom, with inline "Añadir" buttons for CRUD-enabled entities
  - Documentos section with expandable rows (click to reveal ruta_documento, enlace, dates, token counts), estado_proceso_documento as colored tag, JSON viewer and formatted summary viewer modals for LLM-generated summaries
  - Sticky sidebar navigation (xl+ screens) showing only sections with data, plus a "Sin datos" link to the summary panel; active section highlighting and data badges (dot for 1:1 sections, count for 1:N sections); search input for accent-insensitive section filtering
  - Mobile detail navigation: floating action button (hidden on xl+) opens a bottom sheet with section list, search, and active section highlighting
  - Sortable column headers in SimpleTable sections (ascending/descending/unsorted cycling, type-aware comparison)
  - Per-section CSV export via download button in accordion headers (10 SimpleTable sections, semicolon-separated, UTF-8 BOM for Excel)
  - Section edit history: clock icon on editable section headers opens a modal showing transacciones_json history for that entity type
  - Related Initiatives section: accordion section showing up to 20 initiatives sharing the same cluster, unidad, or etiquetas
  - Activity Timeline section: accordion section merging hechos, notas, and transacciones_json into a single chronological timeline with pagination
  - Create/Update/Delete operations on 14 entities (datos_descriptivos, informacion_economica, hechos, etiquetas, acciones, justificaciones, descripciones, ltp, wbes, dependencias, grupos_iniciativas, estado_especial, impacto_aatt, and notas) via transacciones_json with generic EntityFormModal, centralized field configuration, toast notifications, user auto-identification, and confirmation dialogs
  - CurrencyInput component for monetary fields with Spanish locale formatting
  - Importes table: Budget, SM200, Aprobado, CITETIC, Facturacion, Importe by year (2024–2028)
  - Currency hover tooltips: hovering over "k\u20AC" formatted values shows full precision ("\u20AC" with 2 decimals)
  - Sticky detail header: Portfolio ID and name bar stays visible below navbar when scrolling on large screens, with context-aware back button ("Volver a Busqueda", "Volver a Dashboard", etc.)
  - Deep-linkable sections via URL hash (e.g., `/detail/SPA_25_11#hechos`) — auto-expands and scrolls to section on load, hash syncs with scroll position
  - portfolio_id links to detail page throughout the app
- **Full-width layout** — All pages use full viewport width with responsive padding on wide screens
- **Empty date filter defaults** — Date filter inputs show blank instead of browser "dd/mm/aa" placeholder
- **Custom Favicon** — SVG favicon representing portfolio management
- **Dynamic Page Titles** — Each route sets `document.title` via `usePageTitle` hook (e.g., "Dashboard - Portfolio Digital")
- **Route-Based Code Splitting** — `React.lazy()` + `Suspense` with page-specific loading skeletons (Dashboard, Search, Detail, Report), vendor chunk splitting
- **Error Boundary** — Graceful error handling per route with retry button
- **404 Page** — Catch-all route for undefined paths
- **AI Agent Chat** — Claude-powered chat assistant at `/chat` for natural-language portfolio queries. Streaming responses with markdown rendering, conversation persistence across navigation (ChatContext), clickable portfolio_id links to detail pages, collapsible reasoning/thinking accordion, assumptions transparency in responses, portfolio-aware tools (search, detail, aggregation), and inline chart generation (bar, pie, line, stacked bar). Accessible from Navbar
- **Trabajos Menu** — Navbar dropdown to launch management CLI jobs (Proceso Completo, Escanear Documentos, Sumarizar Documentos) with real-time terminal output via SSE streaming in a ConsoleDialog
- **Breadcrumb Navigation** — Route-aware breadcrumb bar on all protected pages showing navigation path (e.g., "Dashboard > Busqueda > SPA_25_11") with clickable parent links
- **Recent Initiatives** — Navbar dropdown tracking last 10 viewed initiatives in localStorage for quick navigation, with clear history option
- **Global Search** — Navbar search bar (Ctrl+Shift+F shortcut or mobile menu "Buscar" button) searches initiatives by portfolio_id and nombre, with direct navigation to detail page
- **Authentication** — Clerk-based sign-in/sign-up with JWT
- **Dark/Light Mode** — System-aware theming with manual toggle
- **Color Themes** — 6 color themes selectable from navbar: Clásico (default), Pizarra, Esmeralda, Ámbar, Rosa, Violeta. 4 high-contrast themes with vivid accent colors. Orthogonal to dark/light mode. Persisted in localStorage
- **Responsive Design** — Mobile-first layout with card views, bottom sheets, and FAB navigation on small screens
- **Accessibility** — Enhanced focus ring visibility (ring-ring + ring-offset-2), forced-colors support for Windows High Contrast mode
- **Spanish UI** — All user-facing text in properly accented Spanish

### Backend API

- **CRUD operations** on all 28 database tables (12 use generic router factory, 15 have custom endpoints)
- **Flexible search** with 12 filter operators on 8 key tables
- **11 report endpoints** with dedicated filter options and search
- **Cross-table portfolio search** — Get all data for a portfolio_id across tables
- **Calculated fields** — ~51 columns computed on-the-fly with LookupCache for batch performance
- **Pydantic input validation** — Typed Create/Update schemas on all CRUD endpoints
- **Transaction processing** — Apply JSON diffs to modify database records
- **Excel write-back** — Async propagation of DB changes to Excel source files via xlwings (COM)
- **Trabajos API** — SSE-streaming endpoints to execute management CLI commands (complete_process, scan_documents, summarize_documentos) with singleton guard
- **AI Agent** — Claude-powered chat endpoint with streaming SSE responses, portfolio query tools (search, detail, aggregation), and agentic tool loop
- **CORS hardening** — Configurable origins, restricted methods/headers
- **Pagination** on all list endpoints
- **Logging** to `logs/portfolio_backend.log` with configurable format

### Migration CLI

- **28-table normalized database** with Spanish column names (accents removed)
- **9 CLI commands**: init, recreate_tables, migrate, validate, calculate_datos_relevantes, export_datos_relevantes, complete_process, scan_documents, summarize_documentos
- **Computed table** (datos_relevantes) with 60+ Python-calculated columns replicating Excel formulas
- **Excel export** with format preservation, date conversion, and VBA support
- **Data quality handling**: date normalization, formula error handling, currency precision, CRLF normalization
- **Sparse matrix denormalization** (beneficios, etiquetas)
- **Comprehensive logging** with configurable levels (DEBUG/INFO/WARNING/ERROR)
- **Configuration validation** — Startup checks for required files/directories before processing
- **Performance** — Reference data preloaded into memory caches (~8 bulk queries instead of ~35K per-row)
- **LLM document summarization** using Claude API with per-document-type prompts, JSON output, and immediate per-document commit to avoid data loss
- **Configuration via `.env`** with sensible defaults

## Database Schema

**28 tables** with `portfolio_id` (TEXT) as the consistent primary key across workbooks:

| Category | Tables | Rows |
|----------|--------|------|
| Core | iniciativas, grupos_iniciativas | 832, 55 |
| Descriptive | datos_descriptivos | 837 |
| Financial | informacion_economica, facturacion | 812, 127 |
| Operational | datos_ejecucion, hechos | 211, 3,530 |
| Benefits | beneficios (current only, excludes snapshots) | 26,568 |
| Supporting | etiquetas, justificaciones, ltp, wbes, dependencias | 7,278 / 689 / 95 / 122 |
| Additional | notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt | various |
| Fichas | fichas | 7,787 |
| Computed | datos_relevantes (60+ calculated columns) | ~837 |
| Parametric | parametros, etiquetas_destacadas | variable |
| Documents | documentos (PK: nombre_fichero), documentos_items | variable |
| Audit | migracion_metadata, transacciones, transacciones_json | ~9,000 |

## Backend API Reference

### Endpoints

**Standard CRUD** (all tables):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/{table}` | List all (paginated, limit/offset) |
| GET | `/api/v1/{table}/{id}` | Get by ID |
| GET | `/api/v1/{table}/portfolio/{pid}` | Get by portfolio_id |
| POST | `/api/v1/{table}` | Create record |
| PUT | `/api/v1/{table}/{id}` | Update by ID |
| DELETE | `/api/v1/{table}/{id}` | Delete by ID |

**Flexible Search** (datos-relevantes, iniciativas, hechos, datos-descriptivos, etiquetas, acciones, ltp, informacion-economica):

```bash
curl -X POST "http://localhost:8000/api/v1/iniciativas/search" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {"field": "estado_de_la_iniciativa", "operator": "eq", "value": "Aprobada"},
      {"field": "importe_2025", "operator": "gte", "value": 100000}
    ],
    "order_by": "importe_2025",
    "order_dir": "desc",
    "limit": 10
  }'
```

Operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `not_in`, `is_null`, `is_not_null`

**Report Endpoints** (11 reports, each with filter-options GET + search POST):

| Report | Filter Options | Search |
|--------|---------------|--------|
| Hechos | `GET /hechos/report-hechos-filter-options` | `POST /hechos/search-report-hechos` |
| LTPs | `GET /ltp/report-ltps-filter-options` | `POST /ltp/search-report-ltps` |
| Acciones | `GET /acciones/report-acciones-filter-options` | `POST /acciones/search-report-acciones` |
| Etiquetas | `GET /etiquetas/report-etiquetas-filter-options` | `POST /etiquetas/search-report-etiquetas` |
| Justificaciones | `GET /justificaciones/report-justificaciones-filter-options` | `POST /justificaciones/search-report-justificaciones` |
| Dependencias | `GET /dependencias/report-dependencias-filter-options` | `POST /dependencias/search-report-dependencias` |
| Descripciones | `GET /descripciones/report-descripciones-filter-options` | `POST /descripciones/search-report-descripciones` |
| Notas | `GET /notas/report-notas-filter-options` | `POST /notas/search-report-notas` |
| Transacciones | `GET /transacciones/report-transacciones-filter-options` | `POST /transacciones/search-report-transacciones` |
| Trans. JSON | `GET /transacciones-json/report-filter-options` | `POST /transacciones-json/search-report` |
| Documentos | `GET /documentos/report-documentos-filter-options` | `POST /documentos/search-report-documentos` |

**Trabajos (Management CLI Jobs):**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trabajos/proceso-completo` | Run complete management process (SSE streaming) |
| POST | `/api/v1/trabajos/escanear-documentos` | Run document scanning (SSE streaming) |
| POST | `/api/v1/trabajos/sumarizar-documentos` | Run document summarization (SSE streaming) |
| GET | `/api/v1/trabajos/status` | Get current job status |

All POST endpoints return Server-Sent Events (SSE) streams with real-time stdout/stderr output. Only one job can run at a time (singleton guard, HTTP 409 if busy).

**AI Agent:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agent/chat` | Send a message to the AI agent (streaming SSE response with tool calls and text) |

**Cross-Table & Transactions:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/portfolio/{pid}` | All data for a portfolio_id |
| POST | `/api/v1/portfolio/search` | Multi-portfolio search with table selection |
| POST | `/api/v1/transacciones-json/process` | Process pending JSON diffs |
| POST | `/api/v1/transacciones-json/process-excel` | Trigger async Excel write-back |
| GET | `/api/v1/transacciones-json/process-excel-status` | Poll Excel processing status |
| GET | `/api/v1/transacciones-json/by-portfolio/{pid}` | Get JSON transactions for a portfolio |
| GET | `/api/v1/parametros/{nombre_parametro}` | Get dropdown values for a codified field |
| GET | `/api/v1/stats/overview` | Public portfolio overview stats (initiative count, budget, tables) |

### Calculated Fields

~65 columns previously stored in the database have been removed and are now computed on-the-fly by `calculated_fields.py`. They are injected into API responses via `model_to_dict_with_calculated()`, so the API response shape is unchanged for consumers.

## Frontend Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/sign-in`, `/sign-up` | Public | Clerk authentication |
| `/dashboard` | Private | Portfolio KPIs, charts, filters, sidebar nav |
| `/search` | Private | Initiative search with configurable grid and export |
| `/informes/hechos` | Private | Hechos report (date range + portfolio data) |
| `/informes/ltps` | Private | LTPs report (responsable/estado) |
| `/informes/acciones` | Private | Acciones report (date range/estado) |
| `/informes/etiquetas` | Private | Etiquetas report (portfolio/etiqueta) |
| `/informes/justificaciones` | Private | Justificaciones report (tipo/portfolio) |
| `/informes/dependencias` | Private | Dependencias report (portfolio/descripcion) |
| `/informes/descripciones` | Private | Descripciones report (tipo/portfolio) |
| `/informes/notas` | Private | Notas report (registrado_por/portfolio) |
| `/informes/transacciones` | Private | Transaction audit trail |
| `/informes/transacciones-json` | Private | JSON diffs + process button |
| `/informes/documentos` | Private | DocumentosReportPage - Document reports with filters |
| `/detail/:portfolio_id` | Private | Initiative detail (21 sections, sidebar nav, CRUD) |
| `/chat` | Private | AI agent chat assistant for natural-language portfolio queries |
| `/parametricas` | Private | Parametric values CRUD management |
| `/parametricas/etiquetas-destacadas` | Private | Etiquetas Destacadas management |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS 4, custom components (Shadcn/ui patterns), fintech aesthetic |
| Typography | Space Grotesk (headings), Plus Jakarta Sans (body), JetBrains Mono (data) |
| Authentication | Clerk |
| Data Fetching | TanStack Query 5 + Axios |
| Data Grid | TanStack Table 8 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Toast Notifications | Sonner |
| Date Picker | react-day-picker 9 + date-fns 4 |
| Charts | Recharts 3 |
| Export | xlsx + file-saver |
| Markdown | react-markdown + remark-gfm |
| Icons | lucide-react |
| Theming | next-themes |

## Migration CLI

All commands run from the `management/` directory:

```bash
cd management

# Complete process (recreate + migrate + calculate + export + scan + export docs)
uv run python manage.py complete_process

# Individual commands
uv run python manage.py init                          # Create .db file + schema
uv run python manage.py recreate_tables               # Drop all tables, recreate from schema.sql
uv run python manage.py migrate                       # Excel → SQLite
uv run python manage.py validate                      # Check data quality
uv run python manage.py calculate_datos_relevantes    # Compute datos_relevantes table
uv run python manage.py export_datos_relevantes       # Export to Excel
uv run python manage.py scan_documents                # Scan configured folders and insert new documents into DB
uv run python manage.py summarize_documentos          # Summarize pending documents using LLM

# Custom database path
uv run python manage.py migrate --db custom.db

# Summarize specific portfolios only
uv run python manage.py summarize_documentos --portfolio-ids SPA_25_11,SPA_25_12

# Reprocess already-processed documents (not just Pendiente)
uv run python manage.py summarize_documentos --reprocess

# Combine filters
uv run python manage.py summarize_documentos --portfolio-ids SPA_25_11 --reprocess

# Print colored JSON summaries to console after each document
uv run python manage.py summarize_documentos --json-output-to-console
```

> **Data Protection**: The `transacciones_json` table is protected by `PRESERVED_TABLES` in `db_init.py`. Running `recreate_tables` or `complete_process` will preserve transacciones_json data. The `documentos` table is now migrated from Excel during the migration process. Only the `init` command (which deletes the entire .db file) destroys all data.

### Excel Source Files

Place Excel files in `management/excel_source/` (or configure `EXCEL_SOURCE_DIR` in `.env`):

```
management/excel_source/
├── PortfolioDigital_Master.xlsm          # 21 sheets → iniciativas, grupos_iniciativas, etc.
├── PortfolioDigital_Beneficios.xlsm      # beneficios (26,568 rows, current only)
├── PortfolioDigital_Facturado.xlsx        # facturacion_mensual
├── PortfolioDigital_Transacciones.xlsm   # transacciones audit trail
└── PortfolioDigital_Fichas.xlsm          # fichas (7,787 rows)
```

### Migration Process

1. Master data (grupos_iniciativas)
2. Core entities (iniciativas, datos_descriptivos)
3. Financial data (informacion_economica, facturacion)
4. Operational data (datos_ejecucion, hechos, beneficios, etiquetas, justificaciones)
5. Supporting data (ltp, wbes, dependencias)
6. Additional tables (notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt)
7. Audit data (transacciones)
8. Fichas data (fichas)
9. Parametric data (parametros)
10. Document data (documentos from Excel, documentos_items from Excel or JSON expansion)

### Computed Table: datos_relevantes

Consolidates and calculates data from multiple source tables (60+ columns):

- **Lookups**: 17 from datos_descriptivos + informacion_economica
- **Estado functions**: estado_iniciativa, estado_aprobacion, estado_ejecucion, estado_agrupado, estado_dashboard, iniciativa_cerrada_economicamente, activo_ejercicio_actual
- **Importe functions**: budget, SM200, aprobado, facturado for years 2024–2028
- **Date functions**: fecha_sm100, fecha_aprobada_con_cct, fecha_en_ejecucion, fecha_limite

See `specs/features/implemented/feature_002/specs.md` for complete specifications.

### Excel Export

```bash
cd management
uv run python manage.py export_datos_relevantes
```

Exports `datos_relevantes` to an existing Excel file with format preservation, date conversion, and VBA macro support (.xlsm).

## Configuration

### Management (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `LOG_FILE` | `portfolio_migration.log` | Log file name (stored in PROJECT_ROOT/logs/) |
| `DATABASE_PATH` | `PROJECT_ROOT/db/portfolio.db` | SQLite database file path |
| `EXCEL_SOURCE_DIR` | `excel_source` | Base directory for Excel source/import files |
| `EXCEL_OUTPUT_DIR` | `excel_output` | Base directory for Excel export output files |
| `DATOS_RELEVANTES_FILE` | `PortfolioDigital_DatosRelevantes.xlsm` | Datos relevantes export filename |
| `DATOS_RELEVANTES_WORKSHEET` | `Datos Relevantes` | Worksheet name for datos relevantes export |
| `DATOS_RELEVANTES_TABLE` | `DatosRelevantes` | Table name for datos relevantes export |
| `DOCUMENTOS_EXPORT_FILE` | `PortfolioDigital_Documentos.xlsm` | Documentos export filename (in EXCEL_OUTPUT_DIR) |
| `DOCUMENTOS_IMPORT_FILE` | `PortfolioDigital_Documentos.xlsx` | Documentos import filename (in EXCEL_SOURCE_DIR) |
| `DOCUMENTOS_ITEMS_EXPORT_FILE` | `PortfolioDigital_Documentos_Items_Calculation.xlsx` | Documentos items export filename (in EXCEL_OUTPUT_DIR) |
| `DOCUMENTOS_ITEMS_IMPORT_FILE` | `PortfolioDigital_Documentos_Items.xlsx` | Documentos items import filename (in EXCEL_SOURCE_DIR) |
| `BATCH_COMMIT_SIZE` | `100` | Rows per commit during calculation |
| `DOCUMENT_SCAN_CONFIG` | `[]` | JSON-encoded list of folder scan definitions |
| `ANTHROPIC_API_KEY` | _(required for summarize)_ | Anthropic API key for LLM summarization |
| `LLM_PROVIDER` | `claude` | LLM provider name |
| `LLM_MODEL` | `claude-haiku-4-5-20251001` | LLM model identifier |
| `LLM_MAX_TOKENS` | `4096` | Maximum tokens for LLM response |
| `LLM_TEMPERATURE` | `0.2` | LLM temperature for summarization |

### Backend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `portfolio_backend.log` | Log file name |
| `LOG_FORMAT` | `%(asctime)s - %(name)s - ...` | Log message format |
| `API_PREFIX` | `/api/v1` | API route prefix |
| `API_TITLE` | `Portfolio Digital API` | Swagger title |
| `API_VERSION` | `1.0.0` | API version |
| `DATABASE_PATH` | _(auto-detect)_ | SQLite database file path |
| `DATABASE_ECHO` | `false` | Log SQL queries |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `EXCEL_SOURCE_DIR` | `../management/excel_source` | Path to Excel source files for write-back |
| `MANAGEMENT_DIR` | `../management` | Path to management module directory (for Trabajos) |
| `UV_EXECUTABLE` | `uv` | Path to `uv` executable (for Trabajos) |
| `ANTHROPIC_API_KEY` | — | Anthropic API key (required for AI agent) |
| `AGENT_MODEL` | `claude-sonnet-4-20250514` | AI agent model ID |
| `AGENT_MAX_TOKENS` | `4096` | Max tokens per agent response |
| `AGENT_TEMPERATURE` | `0.3` | Agent temperature |
| `AGENT_MAX_TOOL_ROUNDS` | `10` | Max tool iteration rounds per agent turn |
| `AGENT_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend API URL for agent self-calls |

### Frontend (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | — | Clerk publishable key (required) |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend API URL |
| `VITE_LOG_LEVEL` | `INFO` | Browser console log level |
| `VITE_APP_NAME` | `Portfolio Digital` | Application name |
| `VITE_DASHBOARD_TOP_VALUE_THRESHOLD` | `1000000` | Top value card threshold (EUR) |
| `VITE_DASHBOARD_RECENT_DAYS` | `7` | Recent changes window (days) |

## Logging

| Module | Log File | Description |
|--------|----------|-------------|
| Management | `logs/portfolio_migration.log` | 6 loggers (main, init, migration, validate, calculate, export). Append mode, "NEW EXECUTION" separators. |
| Backend | `logs/portfolio_backend.log` | FastAPI request/operation logging. |
| Frontend | Browser console | Color-coded, timestamped via `createLogger()`. |

All log levels configurable via `.env` in each module.

## Custom Claude Code Skills

Four custom skills for development workflow automation:

| Skill | Command | Description |
|-------|---------|-------------|
| create_feature | `/create_feature <description>` | Scaffolds `specs/features/feature_NNN/requirements.md` with next available number, following the "Architect First" protocol |
| plan_feature | `/plan_feature feature_NNN` | Plans a feature that has requirements.md ready |
| develop_feature | `/develop_feature feature_NNN` | Implements feature from specs & plan, creates task list, implements step by step |
| close_feature | `/close_feature feature_NNN` | Verifies README and feature docs are up to date, moves feature to `specs/features/implemented/`, commits and pushes |

## Implemented Features

54 features implemented across the full stack:

| # | Feature | Scope |
|---|---------|-------|
| 001 | Core migration system (5 workbooks → 25 tables) | Management |
| 002 | datos_relevantes computed table (60+ columns) | Management |
| 003 | Additional tables migration + calculation fixes | Management |
| 004 | .env configuration + Excel copy script | Management |
| 005 | Complete calculation pipeline + Excel export | Management |
| 006 | Code refactoring into modular package architecture | Management |
| 007 | full_calculation_datos_relevantes command + logging fixes | Management |
| 008 | Transacciones table migration (~9,000 audit rows) | Management |
| 009 | Fichas table migration (~7,787 rows) | Management |
| 010 | Multi-module project structure (management/backend/frontend) | All |
| 011 | FastAPI REST API (CRUD, search, pagination for 25 tables) | Backend |
| 012 | Calculated fields (~65 on-the-fly computed columns) | Backend |
| 013 | Frontend skeleton (React, Clerk auth, landing page, theme) | Frontend |
| 014 | Dashboard filters and charts | Frontend |
| 015 | Initiative search and detail pages | Full Stack |
| 016 | Hechos report ("Iniciativas Cambiadas en el Periodo") | Full Stack |
| 017 | Management command improvements + data model cleanup | Management, Backend |
| 018 | 5 report pages (Hechos, LTPs, Acciones, Etiquetas, Transacciones) | Full Stack |
| 019 | JSON transaction diff system (transacciones_json) | Full Stack |
| 020 | Cierre economico iniciativa calculated field | Full Stack |
| 021 | Dashboard improvements (6 chart pairs, 5 new filters) | Frontend |
| 022 | Chart-to-Search navigation + initiative list cards | Frontend |
| 023 | Column drag-and-drop reordering (ColumnConfigurator) | Frontend |
| 024 | Custom favicon and dynamic page titles | Frontend |
| 025 | Darker backgrounds for navbar, sidebar, headers, filters | Frontend |
| 026 | Move architecture docs to specs/architecture/ subfolder | Docs |
| 027 | Architecture improvements (perf, security, code quality) | All |
| 028 | Dashboard chart axis decimal fix | Frontend |
| 029 | Notas CUD refinement (toast, confirm dialog, auto-user, timestamps) | Full Stack |
| 030 | CUD operations for 13 entities on Detail page (datos_descriptivos, informacion_economica, justificaciones, descripciones, etiquetas, grupos_iniciativas, wbes, dependencias, ltp, hechos, acciones, estado_especial, impacto_aatt) with centralized configuration, generic EntityFormModal, CurrencyInput component, and ImpactoAattSection | Full Stack |
| 031 | Search & Detail page improvements: row selection with checkboxes, copy portfolio IDs to clipboard, paste bulk IDs normalization, Detail page sticky sidebar navigation with data badges | Frontend |
| 032 | Excel write-back from transacciones_json via xlwings (parameterized mapping, async processing, polling status) + Detail page Transacciones JSON section with expandable rows | Full Stack |
| 033 | Excel primary key columns for 1:N entities (composite pk_fields), excel_pk_resolver service, clave_primaria_excel field, full transaction field display in Detail page | Full Stack |
| 034 | Excel write-back bulk-read optimization: _SheetCache replaces cell-by-cell COM calls with single bulk-read per sheet, cached across transactions | Backend |
| 035 | Frontend UI improvements: full-width layout, sticky detail header, currency hover tooltips, transacciones table redesign with collapsible rows and badges, empty date filter defaults, favorites system in Search page, initiative quick-view side drawer | Frontend |
| 036 | Landing page redesign: simplified hero section, changelog with version history of all features, application versioning system (version.js + changelog.js) | Frontend |
| 037 | Parametric tables: `parametros` table for codified dropdown values, read-only API endpoint, `useParametricOptions` hook, `parametric` field property in EntityFormModal for dynamic dropdown options | Full Stack |
| 038 | UI improvements: estado colored tags across reports/detail, expandable rows in Hechos/LTP reports, Hechos side drawer, Parametricas CRUD page | Full Stack |
| 039 | Excel write-back resilience: detects and reuses already-open workbooks via `xw.apps`, leaves them open after saving; comprehensive debug-level logging throughout write-back process | Backend |
| 040 | UI polish: sticky table headers across all pages, initiative drawer button column in Search/Hechos/LTPs/Acciones, drawer with Notas/Justificaciones/Descripciones/Dependencias, estado tags in Search DataGrid and Acciones, LTP Completado/Pendiente colors, fixed-width centered EstadoTag | Frontend |
| 041 | Global Search in Navbar (Ctrl+Shift+F), 4 new report pages (Justificaciones, Dependencias, Descripciones, Notas), LTP Quick Edit Modal in Search page, InitiativeDrawer portfolioData fallback, LTP report default "Pendiente" filter, datos_descriptivos delete disabled (frontend + backend 403 guard) | Full Stack |
| 042 | Etiquetas Destacadas: new `etiquetas_destacadas` table with full CRUD API, dedicated management page at `/parametricas/etiquetas-destacadas`, Parametricas Navbar dropdown navigation, badge display in DetailHeader and InitiativeDrawer | Full Stack |
| 043 | Document Management: `documentos` table (PK: nombre_fichero), `scan_documents` CLI command to scan folders and insert new documents, documentos report endpoints, DocumentosReportPage at `/informes/documentos` | Full Stack |
| 044 | LLM Document Summarization: `summarize_documentos` CLI command, per-tipo_documento JSON prompts (SM100/SM200/default), Claude API integration, document readers (PDF/DOCX/DOC/PPTX/TXT), Excel export, skip list for Approval Forms | Management |
| 045 | Summarize Documentos Enhancements: `--portfolio-ids`, `--reprocess`, `--json-output-to-console` CLI flags, default model to Haiku, token tracking per document, DOCX table extraction for cover page metadata, filename context in LLM prompt, improved prompts for titulo/escrito_por/verificado_por, error resilience, `documentos` table protection via PRESERVED_TABLES, Excel date formatting | Management |
| 046 | Document Summary Viewer Modals: JsonViewerModal for syntax-highlighted raw JSON display, SummaryViewerModal for formatted HTML rendering of LLM-generated summaries (section headings, paragraphs, bullet lists), SharePoint document links in both modals, integrated into Detail page Documentos section and Informe Documentos report page | Frontend |
| 047 | Documentos Processing Improvement: migrate documentos from Excel, new documentos_items table (expanded resumen_documento JSON), documentos_items export/import, CLI rename (main.py→manage.py, full_calculation_datos_relevantes→complete_process), scan_documents in pipeline, Informe Documentos side drawer, Detail page Documentos row expansion, estado_proceso_documento as colored tag | Full Stack |
| 054 | Navigation Enhancements: breadcrumb navigation bar on all protected routes, context-aware back button in DetailHeader, recent initiatives dropdown in Navbar (localStorage, max 10), deep-linkable detail sections via URL hash with auto-expand and scroll-to-hash sync | Frontend |
| 055 | Dashboard Polish: chart tooltip percentages, truncated label tooltips, collapsible filter panel | Frontend |
| 056 | Search Page Enhancements: saved searches, filter chips, export sort fix, persistent row selection, portfolio ID paste validation | Frontend |
| 057 | Detail Page Tables & Sidebar: section search in sidebar, sortable SimpleTable columns, per-section CSV export | Frontend |
| 058 | UI Components Batch: DatePicker calendar component, Dialog size variants, Changelog search and grouping, EmptyState component | Frontend |
| 059 | Report Enhancements: aggregation footer (sum/count/avg), date range presets, filter-aware empty state, saved report templates | Frontend |
| 060 | Dashboard Advanced Features: KPI year-over-year trend indicators, chart PNG export via html2canvas, dynamic landing page stats from API | Full Stack |
| 061 | Detail Page Advanced Features: section edit history modal (transacciones_json per entity), Related Initiatives accordion (shared cluster/unidad/etiquetas), Activity Timeline accordion (hechos + notas + transacciones_json chronological merge with pagination) | Full Stack |
| 062 | Mobile & Accessibility: GlobalSearch in mobile menu, enhanced focus rings (ring-ring + forced-colors), page-specific loading skeletons, card-based search view, mobile detail FAB + bottom sheet navigation, cross-report navigation dropdown, column-level DataGrid filtering (text/select/range), row grouping by field | Frontend |
| 063 | AI Agent Chat: Claude-powered chat assistant at `/chat` with portfolio tools (search, detail, aggregation), streaming responses, markdown rendering, conversation history, and Navbar integration | Full Stack |
| 064 | Multiple improvements: fix Search free-text filter bug, 3 new calculated fields (Estado SM100, Estado SM200, Iniciativa Aprobada) with Excel export, chatbot UI redesign (gradients, frosted glass, command history), parametros-based color customization with pre-seeded estado colors, system prompt enhancements (Cancelado exclusion, current year importes, date injection) | Full Stack |
| 065 | Chatbot improvements: conversation persistence across navigation (ChatContext provider), clickable portfolio_id links in responses, thinking/reasoning accordion, assumptions transparency in system prompt | Full Stack |
| 066 | Agent Chart Visualization: `generar_grafico` tool for MCP server and web chatbot, generates PNG charts (bar, pie, line, stacked bar) from portfolio data via matplotlib, chart image serving endpoint, MarkdownRenderer inline image display, system prompt with proactive chart suggestion guidelines | Full Stack |
| 067 | SQL Query Tool for AI Agents: `ejecutar_consulta_sql` tool for MCP server and web chatbot, read-only SQL SELECT execution with security validation, schema context in tool descriptions, POST /api/v1/sql/execute endpoint with sqlparse validation | Full Stack |
| 068 | Multiple improvements: chat reset fix, cancelled initiatives filter in Search, status badges in Detail sticky header, preserved chart ordering in generar_grafico | Full Stack |
| 069 | datos_relevantes changes: `iniciativa_cerrada_economicamente` now shows "Cerrado en año YYYY" format, new `activo_ejercicio_actual` field, propagated across calculation, search, dashboard, detail, export, and AI agent | Full Stack |
| 070 | UI & Chat Agent improvements: Detail sticky header overlap fixes (sidebar/scroll offsets), Dashboard bar chart dynamic YAxis width (canvas.measureText), Dashboard filter dropdown clipping fix (overflow-visible), chatbot system prompt enhancements (importe_YYYY default, "fuera de budget" cluster filter, deprecated cluster_2025 field), QuickSearch partial portfolio_id with "ID" badge | Full Stack |

Feature specifications are in `specs/features/implemented/feature_NNN/`.

## Documentation

| Document | Description |
|----------|-------------|
| `specs/specs.md` | Core technical specifications |
| `specs/architecture/architecture_management.md` | Management module architecture |
| `specs/architecture/architecture_backend.md` | Backend API architecture (endpoints, models, patterns) |
| `specs/architecture/architecture_frontend.md` | Frontend architecture (routes, components, patterns) |
| `specs/architecture/architecture_agent.md` | AI agent architecture (tools, SSE protocol, orchestrator) |
| `specs/features/implemented/` | Feature specifications (requirements, specs, plans) |
| `CLAUDE.md` | Claude Code development instructions |

## License

Internal use only.
