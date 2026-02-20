# Requirements Prompt for feature_027

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_027/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_027/plan.md' in order to do that.

## Feature Brief

Architecture improvements suggested by Claude Code after comprehensive analysis of the entire codebase (backend, frontend, management, cross-cutting). This feature consolidates high-impact improvements across all three modules, prioritized by severity and effort.

## User Story

As a developer and maintainer, I want the codebase to have stronger foundations (performance, reliability, security, maintainability) so that I can develop new features faster with fewer regressions and deploy with confidence.

---

## Key Requirements

### Requirement 1: Database Schema Improvements

**Files:** `db/schema.sql`

1. **Missing CASCADE constraints** — Add `ON DELETE CASCADE` to 3 tables that are missing it:
   - `ltp` (line ~345)
   - `wbes` (line ~364)
   - `dependencias` (line ~385)
   All other child tables already have CASCADE. These 3 are inconsistent and will create orphaned records on delete.

2. **Missing indexes for common query paths** — Add indexes on `portfolio_id` for tables that lack them (hechos, etiquetas, beneficios, acciones, fichas, notas, justificaciones, ltp, wbes, dependencias, avance, facturacion). Also add indexes on:
   - `hechos(estado)`, `hechos(fecha)`, `hechos(portfolio_id, estado)`
   - `datos_relevantes(tipo)`, `datos_relevantes(capex_opex)`
   - `etiquetas(etiqueta)`
   - `transacciones(fecha_registro_cambio)`
   - `transacciones_json(estado_db)`
   - `fichas(fecha)`
   - `facturacion(ano)`

3. **Standardize CREATE TABLE pattern** — `datos_relevantes` uses `CREATE TABLE IF NOT EXISTS` while all others use `CREATE TABLE`. Standardize.

### Requirement 2: Backend — CORS & Security Hardening

**Files:** `backend/app/main.py`, `backend/app/config.py`, `backend/.env`

1. **Restrict CORS origins** — Currently `allow_origins=["*"]` with `allow_credentials=True`. Move CORS origins to `.env` configuration (`CORS_ORIGINS`) and restrict to known hosts (default: `http://localhost:5173`).

2. **Restrict CORS methods/headers** — Limit `allow_methods` to `["GET", "POST", "PUT", "DELETE"]` and `allow_headers` to `["Content-Type", "Authorization"]` instead of `["*"]`.

### Requirement 3: Backend — Expand Configuration

**Files:** `backend/app/config.py`, `backend/app/database.py`, `backend/.env`, `backend/.env.example`

1. **Make database path configurable** — Currently hardcoded in `database.py`. Add `DATABASE_PATH` to Settings and use it.

2. **Add missing configuration variables:**
   - `CORS_ORIGINS` (list of allowed origins)
   - `DATABASE_PATH` (path to SQLite file)
   - `DATABASE_ECHO` (boolean, log SQL queries)

3. **Update `.env.example`** with all available settings and documentation.

### Requirement 4: Backend — Input Validation with Pydantic Schemas

**Files:** `backend/app/schemas.py`, all routers with `data: dict` parameters

1. **Create Pydantic schemas for all create/update operations** — Many routers accept `data: dict` with no validation (beneficios, facturacion, justificaciones, ltp, wbes, etc.). Create proper `XxxCreate` and `XxxUpdate` schemas.

2. **Update routers** to use typed schemas instead of `data: dict`.

### Requirement 5: Backend — Reduce Router Boilerplate with Factory

**Files:** `backend/app/routers/` (16+ standard CRUD routers)

1. **Create a generic CRUD router factory** — 16+ routers follow identical patterns (list, get, create, update, delete) with ~50-80 lines each. Create a `create_crud_router()` factory function that generates standard CRUD endpoints from model + table name.

2. **Refactor standard CRUD routers** to use the factory. Keep custom routers (hechos, datos_relevantes, portfolio, etc.) that have special endpoints.

### Requirement 6: Backend — Calculated Fields Performance (N+1 Queries)

**Files:** `backend/app/calculated_fields/service.py`, `backend/app/calculated_fields/lookup.py`, `backend/app/crud.py`

1. **Add caching layer for calculated field lookups** — Currently each record triggers separate DB queries for lookups (datos_descriptivos, informacion_economica, datos_relevantes). For a list of 100 records, this means 300+ extra queries.

2. **Implement batch population** — Create `batch_populate_calculated_fields()` that shares a cache across all records in a single API response.

### Requirement 7: Backend — Structured Logging with Request Context

**Files:** `backend/app/main.py`, new `backend/app/middleware/`

1. **Add request ID middleware** — Generate UUID per request, add to all log messages, return in `X-Request-ID` response header.

2. **Add timing to CRUD operations** — Log query duration for list/search operations.

3. **Configure log rotation** — Use `RotatingFileHandler` (10MB max, 5 backups) instead of unlimited append.

### Requirement 8: Frontend — Route-Based Code Splitting

**Files:** `frontend/src/App.jsx`, `frontend/vite.config.js`

1. **Add `React.lazy()` + `Suspense`** for all protected routes (Dashboard, Search, Reports, Detail). Currently all feature pages are eagerly imported, resulting in a 1.3MB main bundle.

2. **Configure Vite `rollupOptions`** to split vendor chunks (React, TanStack, Clerk, Recharts) into separate files for better caching.

### Requirement 9: Frontend — Consolidate Duplicated Utilities

**Files:** Multiple storage utils, filter panel components

1. **Create shared `lib/localStorage.js` utility** — Three features (search, dashboard, reports) each implement identical localStorage save/load/clear patterns. Extract to a shared utility.

2. **Extract shared filter panel logic** — `FilterPanel.jsx` and `ReportFilterPanel.jsx` have identical keyboard handling, badge counting, and collapsible state logic. Extract shared `useFilterPanelLogic()` hook.

3. **Remove legacy column selectors** if unused — `ColumnSelector.jsx` and `ReportColumnSelector.jsx` may be superseded by `ColumnConfigurator.jsx`.

### Requirement 10: Frontend — Error Boundary & 404 Route

**Files:** `frontend/src/App.jsx`, new error boundary component

1. **Add catch-all 404 route** — Currently undefined paths show a blank page. Add `<Route path="*" element={<NotFoundPage />} />`.

2. **Add error boundary** around protected routes to catch rendering errors gracefully.

### Requirement 11: Management — Calculation Engine N+1 Queries

**Files:** `management/src/calculate/engine.py`, helper functions

1. **Preload reference data** — Currently processes ~837 portfolio IDs, each executing 50+ SQL queries (~42,000 total). Preload `datos_descriptivos`, `informacion_economica`, and `hechos` into memory once, then pass to `calculate_row()`.

2. **Replace per-row SQL with in-memory lookups** in helper functions (`get_datos_descriptivos_lookups()`, `get_informacion_economica_lookups()`, `ultimo_id()`, `importe()`, etc.).

### Requirement 12: Management — Configuration Validation

**Files:** `management/src/config/settings.py`, `management/main.py`

1. **Add startup validation** — Check that `EXCEL_SOURCE_DIR`, `EXCEL_OUTPUT_DIR`, and `DATABASE_PATH` directories/files exist before any processing begins. Currently failures only surface deep in the pipeline.

2. **Validate required Excel source files exist** at startup for migration commands.

### Requirement 13: Management — Transaction Commit Consistency

**Files:** `management/src/migrate/engine.py`, `management/src/calculate/engine.py`

1. **Standardize batch commit pattern** — Migration commits per-row, calculation commits every 100 rows. Standardize to a configurable batch size (e.g., 500-1000 rows).

2. **Use `executemany()` for batch inserts** — Replace `.iterrows()` + per-row `execute()` with `df.to_dict('records')` + `executemany()` for significant performance improvement.

### Requirement 14: Cross-Cutting — .gitignore Improvements

**Files:** `.gitignore`

1. **Add missing entries:**
   - `.DS_Store` (macOS)
   - `.vscode/`, `.idea/` (IDE settings)
   - `frontend/dist/` (build output)
   - `coverage/`, `.coverage`, `htmlcov/` (test coverage)

### Requirement 15: Documentation Updates

1. **Fix CLAUDE.md** — `calculated_fields.py` is described as a single file but is actually a directory with 5 files. Update the project structure section.

2. **Update README.md** with any new configuration variables, commands, or architecture changes from this feature.

3. **Update architecture docs** (`specs/architecture/architecture_backend.md`, `specs/architecture/architecture_frontend.md`) to reflect all changes.

---

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Changes should be backward-compatible — no breaking API response shape changes.
- The management CLI interface (commands, flags) should remain unchanged.

## Implementation Priority (Suggested)

**Phase 1 — Critical / Quick Wins:**
- Req 1 (DB schema: CASCADE + indexes)
- Req 2 (CORS hardening)
- Req 3 (Backend config expansion)
- Req 14 (.gitignore)
- Req 15 (Documentation fixes)

**Phase 2 — High Impact:**
- Req 6 (Calculated fields N+1 fix)
- Req 8 (Frontend code splitting)
- Req 10 (Error boundary + 404)
- Req 11 (Management N+1 fix)
- Req 12 (Config validation)

**Phase 3 — Code Quality:**
- Req 4 (Pydantic schemas)
- Req 5 (Router factory)
- Req 7 (Structured logging)
- Req 9 (Frontend deduplication)
- Req 13 (Batch commits)

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
