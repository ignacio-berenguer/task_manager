# Implementation Plan — feature_027: Architecture Improvements

## Phase 1 — Critical / Quick Wins

### Step 1.1: Database Schema — CASCADE + Indexes (Req 1)
**Files:** `db/schema.sql`
**Effort:** Small

1. Add `ON DELETE CASCADE` to `ltp` (line ~345), `wbes` (line ~364), `dependencias` (line ~385) FOREIGN KEY constraints
2. Add 6 secondary indexes:
   - `idx_hechos_portfolio_estado ON hechos (portfolio_id, estado)`
   - `idx_datos_relevantes_tipo ON datos_relevantes (tipo)`
   - `idx_datos_relevantes_capex_opex ON datos_relevantes (capex_opex)`
   - `idx_transacciones_fecha_registro ON transacciones (fecha_registro_cambio)`
   - `idx_fichas_fecha ON fichas (fecha)`
   - `idx_facturacion_ano ON facturacion (ano)`
3. Change `datos_relevantes` from `CREATE TABLE IF NOT EXISTS` to `CREATE TABLE`
4. **Verify:** Run `management/main.py init --db test.db` to validate schema parses correctly

### Step 1.2: Backend — CORS Hardening (Req 2)
**Files:** `backend/app/main.py`
**Depends on:** Step 1.3 (needs `CORS_ORIGINS` in config)

1. Replace `allow_origins=["*"]` with `settings.CORS_ORIGINS`
2. Replace `allow_methods=["*"]` with `["GET", "POST", "PUT", "DELETE"]`
3. Replace `allow_headers=["*"]` with `["Content-Type", "Authorization"]`

### Step 1.3: Backend — Configuration Expansion (Req 3)
**Files:** `backend/app/config.py`, `backend/app/database.py`, `backend/.env`, `backend/.env.example`
**Effort:** Small

1. Add to `config.py` Settings class:
   - `DATABASE_PATH: str = ""` (empty = auto-detect)
   - `DATABASE_ECHO: bool = False`
   - `CORS_ORIGINS: list[str] = ["http://localhost:5173"]`
2. Update `database.py` to use `settings.DATABASE_PATH` when non-empty, fall back to current path calculation
3. Pass `echo=settings.DATABASE_ECHO` to `create_engine()`
4. Create/update `backend/.env.example` with all settings documented
5. **Verify:** Backend starts normally with default settings (no .env changes needed)

### Step 1.4: .gitignore Improvements (Req 14)
**Files:** `.gitignore`
**Effort:** Trivial

1. Add `.DS_Store`, `.vscode/`, `.idea/`, `*.swp`, `*.swo`, `frontend/dist/`, `coverage/`, `.coverage`, `htmlcov/`

### Step 1.5: Documentation Quick Fixes (Req 15 — partial)
**Files:** `CLAUDE.md`
**Effort:** Trivial

1. Fix `calculated_fields.py` reference to `calculated_fields/` directory with 6 files listing
2. Fix line 200 reference

---

## Phase 2 — High Impact

### Step 2.1: Backend — Calculated Fields Caching (Req 6)
**Files:** `backend/app/calculated_fields/cache.py` (new), `backend/app/calculated_fields/service.py`, `backend/app/calculated_fields/lookup.py`, `backend/app/crud.py`
**Effort:** Medium

1. Create `cache.py` with `LookupCache` class:
   - Three internal dicts: `_datos_descriptivos`, `_datos_relevantes`, `_informacion_economica`
   - Methods: `get_datos_descriptivos(portfolio_id)`, `get_datos_relevantes(portfolio_id)`, `get_informacion_economica(portfolio_id)`
   - Each method queries DB on first access, caches result
2. Update `lookup.py` functions to accept optional `cache: LookupCache` parameter
   - When cache provided, use `cache.get_*()` instead of direct DB query
   - When cache is None, use existing behavior (backward compatible)
3. Update `service.py` `populate_calculated_fields()` to accept optional `cache` parameter, pass through to lookup functions
4. Update `crud.py`:
   - Add `batch_model_to_dict_with_calculated(db, items)` that creates single `LookupCache` shared across all items
   - Update `get_multi()` and list endpoints to use batch version
   - Keep single-record `model_to_dict_with_calculated()` for get-by-id endpoints
5. **Verify:** Compare API responses before/after for `/api/v1/informacion-economica?limit=10` to ensure identical output

### Step 2.2: Frontend — Route-Based Code Splitting (Req 8)
**Files:** `frontend/src/App.jsx`, `frontend/vite.config.js`
**Effort:** Small

1. Replace static imports with `React.lazy()` for: DashboardPage, SearchPage, DetailPage, ReportPage, LTPsReportPage, AccionesReportPage, EtiquetasReportPage, TransaccionesReportPage, TransaccionesJsonReportPage
2. Create a simple loading spinner component (inline or small file)
3. Wrap routes content in `<Suspense fallback={<LoadingSpinner />}>`
4. Add `manualChunks` to `vite.config.js`:
   - `vendor-react`: react, react-dom, react-router-dom
   - `vendor-tanstack`: @tanstack/react-query, @tanstack/react-table
   - `vendor-clerk`: @clerk/clerk-react
   - `vendor-charts`: recharts
5. Keep LandingPage, SignIn, SignUp as static imports (public routes, always needed)
6. **Verify:** `npm run build` succeeds, check chunk sizes in output

### Step 2.3: Frontend — Error Boundary & 404 (Req 10)
**Files:** `frontend/src/components/shared/NotFoundPage.jsx` (new), `frontend/src/components/shared/ErrorBoundary.jsx` (new), `frontend/src/App.jsx`
**Effort:** Small

1. Create `NotFoundPage.jsx` — minimal page with "Pagina no encontrada" message and link to `/dashboard`
2. Create `ErrorBoundary.jsx` — React class component with error catch, fallback UI, and retry button
3. Add `<Route path="*" element={<NotFoundPage />} />` as last route (outside protected routes for public 404 too)
4. Wrap protected routes content in `<ErrorBoundary>`
5. **Verify:** Navigate to `/nonexistent` → 404 page shown

### Step 2.4: Management — Calculation Engine Performance (Req 11)
**Files:** `management/src/calculate/engine.py`, `management/src/calculate/lookup_functions.py`, `management/src/calculate/helper_functions.py`, `management/src/calculate/estado_functions.py`, `management/src/calculate/importe_functions.py`
**Effort:** Large

1. In `engine.py`, before the portfolio_id loop, preload into dicts:
   - `dd_cache`: `SELECT * FROM datos_descriptivos` → `{portfolio_id: {col: val, ...}}`
   - `ie_cache`: `SELECT * FROM informacion_economica` → `{portfolio_id: {col: val, ...}}`
   - `hechos_cache`: `SELECT * FROM hechos` → `{portfolio_id: [rows]}`
   - Also preload: `facturacion`, `justificaciones`, `etiquetas`, `estado_especial`, `acciones`, `ltp`, `fichas` into similar caches
2. Update `calculate_row()` signature to accept cache dicts instead of (or in addition to) `conn`
3. Update `lookup_functions.py`:
   - `get_datos_descriptivos_lookups(cache, portfolio_id)` → direct dict access
   - `get_informacion_economica_lookups(cache, portfolio_id)` → direct dict access
4. Update `helper_functions.py`:
   - `ultimo_id()`, `fecha_estado()`, etc. → filter from `hechos_cache[portfolio_id]` in memory
   - `importe()` → filter from `hechos_cache` or `facturacion_cache` in memory
5. Update `estado_functions.py` and `importe_functions.py` similarly
6. **Verify:** Run `full_calculation_datos_relevantes` and compare output to a baseline export

### Step 2.5: Management — Configuration Validation (Req 12)
**Files:** `management/src/config/settings.py`, `management/main.py`
**Effort:** Small

1. Add `validate_config(command: str)` function in `settings.py`
2. Call from `main.py` before executing any command
3. Validate: EXCEL_SOURCE_DIR exists (for migrate), DATABASE_PATH exists (for calculate/validate/export), Excel source files exist (for migrate)
4. Raise clear error messages listing all missing items
5. **Verify:** Run commands with missing paths → clear error messages

---

## Phase 3 — Code Quality

### Step 3.1: Backend — Pydantic Input Validation Schemas (Req 4)
**Files:** `backend/app/schemas.py`, 10 router files
**Effort:** Medium

1. Analyze each of the 10 CRUD tables to determine column names and types from `models.py`
2. Create `XxxCreate` schema for each table:
   - `portfolio_id: str` (required)
   - All other fields: `Optional[type] = None`
3. Update each router's `create` and `update` endpoints:
   - Change `data: dict` to `data: XxxCreate`
   - Use `data.model_dump(exclude_unset=True)` instead of `data` directly
4. Tables: beneficios, facturacion, notas, avance, descripciones, estado_especial, investment_memos, impacto_aatt, datos_ejecucion, grupos_iniciativas
5. **Verify:** Existing API calls still work (backward compatible since all fields except portfolio_id are optional)

### Step 3.2: Backend — CRUD Router Factory (Req 5)
**Files:** `backend/app/routers/base_router.py` (new), 10 router files, `backend/app/main.py`
**Depends on:** Step 3.1 (schemas needed for factory)
**Effort:** Medium

1. Create `base_router.py` with `create_crud_router()` factory:
   - Parameters: `model`, `table_name`, `pk_field`, `pk_type`, `create_schema`, `use_calculated_fields`
   - Generates: list (GET /), get (GET /{id}), get-by-portfolio (GET /portfolio/{pid}), create (POST /), update (PUT /{id}), delete (DELETE /{id})
   - Uses `batch_model_to_dict_with_calculated()` for list endpoints
2. Refactor 10 pure CRUD routers to use factory (each file reduced to ~5-10 lines)
3. Update `main.py` router registration if needed (should remain unchanged if router objects keep same attributes)
4. **Verify:** All CRUD endpoints return identical responses

### Step 3.3: Backend — Structured Logging (Req 7)
**Files:** `backend/app/main.py`, `backend/app/middleware/` (new directory)
**Effort:** Small-Medium

1. Replace `FileHandler` with `RotatingFileHandler(maxBytes=10*1024*1024, backupCount=5)` in `main.py`
2. Create `middleware/request_id.py`:
   - Generate UUID per request
   - Store in `request.state.request_id`
   - Add `X-Request-ID` response header
3. Update `RequestLoggingMiddleware` to include request ID in log output
4. Add timing logs to `crud.py` `get_multi()` and search operations
5. **Verify:** Check log output includes request IDs and rotation works

### Step 3.4: Frontend — Consolidate Duplicated Utilities (Req 9)
**Files:** `frontend/src/lib/storage.js` (new), 3 storage files, 2 legacy column selectors
**Effort:** Small

1. Create `lib/storage.js` with `createStorage(prefix)` factory
2. Refactor `searchStorage.js` to use `createStorage('search')`
3. Refactor `filterStorage.js` to use `createStorage('dashboard')`
4. Refactor `reportStorage.js` to use `createStorage('report')`
5. Keep all existing export APIs unchanged
6. Check if `ColumnSelector.jsx` and `ReportColumnSelector.jsx` are imported anywhere:
   - Search for imports across codebase
   - If unused, delete them
   - If used, leave as-is
7. **Verify:** localStorage read/write works correctly across all three features

### Step 3.5: Management — Batch Commit Consistency (Req 13)
**Files:** `management/src/config/settings.py`, `management/src/migrate/engine.py`, `management/src/calculate/engine.py`
**Effort:** Small

1. Add `BATCH_COMMIT_SIZE = 500` to `settings.py`
2. Update calculation engine to use configurable batch size instead of hardcoded 100
3. For migration: evaluate tables for `executemany()` compatibility
   - Simple tables (direct mapping): use `executemany()` with `df.to_dict('records')`
   - Complex tables (per-row normalization): keep iterrows, add batch commit
4. **Verify:** Run full migration and calculation pipeline, compare output

---

## Phase 4 — Final Documentation

### Step 4.1: Update All Documentation (Req 15 — completion)
**Files:** `README.md`, `CLAUDE.md`, `specs/architecture/architecture_backend.md`, `specs/architecture/architecture_frontend.md`, `specs/architecture/architecture_management.md`
**Effort:** Small

1. Update `README.md` with:
   - New configuration variables (DATABASE_PATH, DATABASE_ECHO, CORS_ORIGINS, BATCH_COMMIT_SIZE)
   - Code splitting and error boundary features
   - Updated architecture overview if significant changes
2. Update `CLAUDE.md`:
   - Fix `calculated_fields.py` → `calculated_fields/` directory reference (already done in Step 1.5)
   - Add mention of `base_router.py` factory pattern
   - Update router count/classification
   - Add new middleware files
3. Update architecture docs to reflect:
   - Backend: LookupCache, router factory, RotatingFileHandler, request ID middleware
   - Frontend: lazy loading, error boundary, 404 route, storage utility
   - Management: preloaded caches, configuration validation, batch commits
4. **Verify:** Review all doc changes for accuracy

---

## Implementation Order Summary

| Step | Requirement | Effort | Dependencies |
|------|------------|--------|-------------|
| 1.1 | DB Schema | Small | None |
| 1.3 | Backend Config | Small | None |
| 1.2 | CORS Hardening | Small | 1.3 |
| 1.4 | .gitignore | Trivial | None |
| 1.5 | CLAUDE.md Fixes | Trivial | None |
| 2.1 | Calculated Fields Cache | Medium | None |
| 2.2 | Code Splitting | Small | None |
| 2.3 | Error Boundary & 404 | Small | None |
| 2.4 | Management N+1 Fix | Large | None |
| 2.5 | Config Validation | Small | None |
| 3.1 | Pydantic Schemas | Medium | None |
| 3.2 | Router Factory | Medium | 3.1 |
| 3.3 | Structured Logging | Small-Medium | None |
| 3.4 | Frontend Deduplication | Small | None |
| 3.5 | Batch Commits | Small | None |
| 4.1 | Documentation | Small | All above |

**Total estimated steps:** 16
**Phases:** 4 (can be implemented sequentially, steps within each phase can be parallelized where no dependencies exist)

---

## Risk Mitigation

- **Calculated fields caching (2.1):** Compare JSON output of API endpoints before/after. Any difference indicates a bug.
- **Management N+1 fix (2.4):** Export datos_relevantes before and after. Diff the Excel files row by row.
- **Router factory (3.2):** Test all 6 CRUD operations on each refactored router.
- **Code splitting (2.2):** Run `npm run build` and verify all routes render. Check that navigation between lazy routes works with Suspense fallback.
- **Schema migration (1.1):** Run `init --db test.db` to verify schema SQL is valid before applying to production database.
