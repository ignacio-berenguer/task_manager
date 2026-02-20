# Specifications — feature_027: Architecture Improvements

## 1. Overview

This feature consolidates high-impact architecture improvements across all three modules (backend, frontend, management) and cross-cutting concerns. The changes improve performance, security, maintainability, and reliability without altering existing API response shapes or CLI interfaces.

**Scope:** 15 requirements organized in 3 phases.

---

## 2. Current State Analysis

### 2.1 Database Schema (`db/schema.sql`)

- **25 tables**, 41 indexes, 19 tables with FOREIGN KEY constraints
- **3 tables missing ON DELETE CASCADE:** `ltp` (line 345), `wbes` (line 364), `dependencias` (line 385). All other 16 child tables have CASCADE.
- **All tables with portfolio_id already have indexes** on portfolio_id (19 tables + datos_relevantes uses it as PRIMARY KEY). No missing portfolio_id indexes.
- **Missing secondary indexes:** `datos_relevantes(tipo)`, `datos_relevantes(capex_opex)`, `hechos(portfolio_id, estado)` composite, `transacciones(fecha_registro_cambio)`, `fichas(fecha)`, `facturacion(ano)` single-column.
- **Inconsistency:** `datos_relevantes` uses `CREATE TABLE IF NOT EXISTS` (line 461); all other 24 tables use `CREATE TABLE`.

### 2.2 Backend Configuration

**`config.py` (25 lines):** 5 settings — `LOG_LEVEL`, `LOG_FILE`, `API_PREFIX`, `API_TITLE`, `API_VERSION`. No database, CORS, or environment settings.

**`database.py` (32 lines):** DB path hardcoded via `Path(__file__).parent.parent.parent / "db" / "portfolio.db"`. Not configurable via .env.

**`main.py` (169 lines):**
- CORS: `allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]` (lines 109-115)
- Logging: Already configured with `FileHandler` + `StreamHandler` (lines 49-56), no rotation
- `RequestLoggingMiddleware`: logs method/path/status/duration, skips health/docs (lines 66-87)

### 2.3 Backend Routers & Schemas

**Router classification (25 routers):**

| Category | Count | Routers | Pattern |
|----------|-------|---------|---------|
| Standard CRUD only | 10 | beneficios, facturacion, grupos_iniciativas, notas, avance, descripciones, estado_especial, investment_memos, impacto_aatt, datos_ejecucion | list/get/portfolio/create/update/delete with `data: dict` |
| CRUD + Search | 5 | iniciativas, datos_descriptivos, fichas, informacion_economica, etiquetas | Standard CRUD + `POST /search` |
| CRUD + Report + Search | 3 | hechos, acciones, ltp | CRUD + report filter-options + report search |
| Special endpoints | 4 | datos_relevantes, transacciones, transacciones_json, portfolio | Custom logic |
| Report-only | 3 | (handled within hechos, acciones, ltp) | - |

**Input validation:** 20+ endpoints accept `data: dict` with no Pydantic schema validation.

**Existing Pydantic schemas in `schemas.py`:** `SearchFilter`, `SearchRequest`, `PaginatedResponse`, `PortfolioSearchRequest`, `HechosReportRequest`, `LTPReportRequest`, `AccionesReportRequest`, `EtiquetasReportRequest`, `TransaccionesReportRequest`, `TransaccionesJsonReportRequest`.

### 2.4 Calculated Fields — N+1 Query Problem

**Architecture:** `crud.py:model_to_dict_with_calculated()` → `service.py:populate_calculated_fields()` → loops through each calculated field → `lookup.py` executes DB query per field.

**51 calculated fields** across 19 tables. Three source tables queried: `datos_descriptivos`, `datos_relevantes`, `informacion_economica`.

**Critical issue:** For a single record from `informacion_economica` (13 calculated fields):
- 9 identical queries to `datos_descriptivos` (one per lookup field)
- 4 identical queries to `datos_relevantes` (one per lookup field)
- **13 queries total per record** — same source row loaded 9 times

**For a list of 100 records:** `2 + (100 × 13) = 1,302 queries` instead of `2 + 2 = 4`.

**Root cause:** `lookup_datos_descriptivos()`, `lookup_datos_relevantes()`, `lookup_informacion_economica()` in `lookup.py` each execute `db.query(Model).filter(portfolio_id == ...).first()` per field, with no caching between fields for the same record or across records.

### 2.5 Frontend

**`App.jsx`:** All route components imported statically (no `React.lazy`). Bundle size: 1.3MB (398KB gzip).

**Duplicated localStorage patterns:**
- `search/utils/searchStorage.js` — save/load columns, filters, pageSize
- `dashboard/utils/filterStorage.js` — save/load filters
- `reports/utils/reportStorage.js` — save/load columns, columnOrder, pageSize

All three use identical try/catch JSON.parse/stringify patterns.

**Legacy column selectors still exist:**
- `search/components/ColumnSelector.jsx` (98 lines) — dropdown-based, legacy
- `reports/components/ReportColumnSelector.jsx` (130 lines) — dropdown-based, legacy
- `components/shared/ColumnConfigurator.jsx` (226 lines) — dialog with drag-and-drop, current

**No 404 route or error boundary** in `App.jsx`.

### 2.6 Management Module

**Calculation engine N+1:** `calculate_row()` called per portfolio_id (~837 times). Each call executes:
- `get_datos_descriptivos_lookups()` — 1 query to `datos_descriptivos`
- `get_informacion_economica_lookups()` — 1 query to `informacion_economica`
- 6 estado functions — each queries `hechos`, `estado_especial`, `justificaciones`, `etiquetas` (6-12 queries)
- `importe()` called 22 times — each queries `hechos` or `facturacion` (22+ queries)
- Date/helper functions — ~10 more queries
- **Total: ~40-50 queries per portfolio_id × 837 = ~35,000-42,000 queries**

**Commit patterns:**
- Migration: commits once per table after all rows (line 142)
- Calculation: commits every 100 rows (line 160)

**Configuration:** `settings.py` loads from `.env` with defaults. No startup validation of directories/files.

### 2.7 Documentation & Git

**CLAUDE.md issues:**
- Line 94: `calculated_fields.py` — should be `calculated_fields/` directory (6 files)
- Line 200: References `calculated_fields.py` — same fix needed

**`.gitignore` missing:** `.DS_Store`, `.vscode/`, `.idea/`, `frontend/dist/`, `coverage/`, `htmlcov/`

---

## 3. Detailed Specifications

### Spec 1: Database Schema — CASCADE + Indexes

**Changes to `db/schema.sql`:**

1. Add `ON DELETE CASCADE` to 3 FOREIGN KEY constraints:
   - `ltp` table (line ~345): `FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE`
   - `wbes` table (line ~364): same
   - `dependencias` table (line ~385): same

2. Add missing secondary indexes:
   ```sql
   CREATE INDEX idx_hechos_portfolio_estado ON hechos (portfolio_id, estado);
   CREATE INDEX idx_datos_relevantes_tipo ON datos_relevantes (tipo);
   CREATE INDEX idx_datos_relevantes_capex_opex ON datos_relevantes (capex_opex);
   CREATE INDEX idx_transacciones_fecha_registro ON transacciones (fecha_registro_cambio);
   CREATE INDEX idx_fichas_fecha ON fichas (fecha);
   CREATE INDEX idx_facturacion_ano ON facturacion (ano);
   ```

3. Standardize `datos_relevantes` to `CREATE TABLE` (remove `IF NOT EXISTS`).

**Note:** All tables with portfolio_id already have portfolio_id indexes. No new portfolio_id indexes needed.

### Spec 2: Backend — CORS Hardening

**Changes to `main.py` (lines 109-115):**

Replace:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

With:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
```

### Spec 3: Backend — Configuration Expansion

**New settings in `config.py`:**

```python
class Settings(BaseSettings):
    # Existing
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "portfolio_backend.log"
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "Portfolio Digital API"
    API_VERSION: str = "1.0.0"

    # New
    DATABASE_PATH: str = ""  # Empty = auto-detect relative to project root
    DATABASE_ECHO: bool = False
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
```

**Changes to `database.py`:** Use `settings.DATABASE_PATH` when set; fall back to current path calculation when empty.

**Update `backend/.env.example`** with all settings documented.

### Spec 4: Backend — Pydantic Input Validation

Create `XxxCreate` schemas for the 10 standard CRUD routers that currently accept `data: dict`:

Tables needing schemas: `beneficios`, `facturacion`, `notas`, `avance`, `descripciones`, `estado_especial`, `investment_memos`, `impacto_aatt`, `datos_ejecucion`, `grupos_iniciativas`.

Each schema will have all columns as `Optional[Any]` except `portfolio_id: str` (required). This ensures type safety at the API boundary without breaking existing callers.

Update each router's `create` and `update` endpoints to use the typed schema with `.model_dump(exclude_unset=True)`.

### Spec 5: Backend — CRUD Router Factory

Create `backend/app/routers/base_router.py` with a `create_crud_router()` function that generates standard CRUD endpoints (list, get, get-by-portfolio, create, update, delete).

**Parameters:**
- `model`: SQLAlchemy model class
- `table_name`: URL path prefix and tag
- `pk_type`: `int` (default) or `str` for primary key type
- `create_schema`: Optional Pydantic schema for create/update (defaults to `dict`)
- `use_calculated_fields`: `bool` (default `True`)

**Routers to refactor** (10 pure CRUD): beneficios, facturacion, grupos_iniciativas, notas, avance, descripciones, estado_especial, investment_memos, impacto_aatt, datos_ejecucion.

**Routers to keep as-is** (15 with custom logic): iniciativas, datos_relevantes, datos_descriptivos, hechos, etiquetas, fichas, informacion_economica, acciones, ltp, wbes, dependencias, transacciones, transacciones_json, migracion_metadata, portfolio.

### Spec 6: Backend — Calculated Fields Caching

**Problem:** Per-field per-record DB queries with no caching.

**Solution:** Add a `LookupCache` class that caches source records per portfolio_id within a request scope.

**New file: `backend/app/calculated_fields/cache.py`**

```python
class LookupCache:
    """Per-request cache for calculated field source data."""

    def __init__(self, db: Session):
        self.db = db
        self._datos_descriptivos: dict[str, Any] = {}
        self._datos_relevantes: dict[str, Any] = {}
        self._informacion_economica: dict[str, Any] = {}

    def get_datos_descriptivos(self, portfolio_id: str):
        if portfolio_id not in self._datos_descriptivos:
            obj = self.db.query(DatosDescriptivo).filter(...).first()
            self._datos_descriptivos[portfolio_id] = obj
        return self._datos_descriptivos[portfolio_id]

    # Similar for datos_relevantes, informacion_economica
```

**Changes to `service.py`:** Accept optional `LookupCache` parameter. Use cache for all lookups.

**Changes to `crud.py`:** Create `batch_model_to_dict_with_calculated()` that creates a single `LookupCache` shared across all records.

**Impact:** For 100 records from `informacion_economica`: reduces from 1,302 queries to ~102 (1 per unique portfolio_id per source table + 2 base queries).

### Spec 7: Backend — Structured Logging

1. **Log rotation:** Replace `FileHandler` with `RotatingFileHandler(maxBytes=10MB, backupCount=5)` in `main.py`.

2. **Request ID middleware:** New middleware that generates UUID per request, stores in `request.state`, adds to `X-Request-ID` response header. Update `RequestLoggingMiddleware` to include request ID in log output.

3. **CRUD timing:** Add elapsed time logging to `CRUDBase.get_multi()` and search operations.

### Spec 8: Frontend — Route-Based Code Splitting

**Changes to `App.jsx`:**

Replace static imports:
```javascript
import { DashboardPage } from '@/features/dashboard/DashboardPage'
```

With lazy imports:
```javascript
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
```

Apply to all protected route components: DashboardPage, SearchPage, all 6 report pages, DetailPage.

Wrap `<Routes>` in `<Suspense fallback={<LoadingSpinner />}>`.

**Changes to `vite.config.js`:** Add `rollupOptions.output.manualChunks` to split vendor chunks:
- `vendor-react`: react, react-dom, react-router-dom
- `vendor-tanstack`: @tanstack/react-query, @tanstack/react-table
- `vendor-clerk`: @clerk/clerk-react
- `vendor-charts`: recharts

### Spec 9: Frontend — Consolidate Duplicated Utilities

1. **Create `frontend/src/lib/storage.js`** — generic localStorage utility:
   ```javascript
   export function createStorage(prefix) {
     return {
       save: (key, value) => { /* JSON.stringify with try/catch */ },
       load: (key, defaultValue) => { /* JSON.parse with try/catch */ },
       remove: (key) => { /* removeItem with try/catch */ },
     }
   }
   ```

2. **Refactor** `searchStorage.js`, `filterStorage.js`, `reportStorage.js` to use `createStorage()`. Keep their current export APIs unchanged to avoid breaking callers.

3. **Verify legacy column selectors:** Check if `ColumnSelector.jsx` and `ReportColumnSelector.jsx` are imported anywhere. If unused (superseded by `ColumnConfigurator.jsx`), remove them. If still used, leave in place.

### Spec 10: Frontend — Error Boundary & 404

1. **Create `frontend/src/components/shared/NotFoundPage.jsx`** — simple 404 page with link back to dashboard.

2. **Create `frontend/src/components/shared/ErrorBoundary.jsx`** — React error boundary with fallback UI and retry button.

3. **Add to `App.jsx`:** Wrap protected routes in `<ErrorBoundary>`, add `<Route path="*" element={<NotFoundPage />} />` as last route.

### Spec 11: Management — Calculation Engine Performance

**Strategy:** Preload all reference data into memory before the calculation loop.

**Changes to `calculate/engine.py`:**

Before the portfolio_id loop, preload:
```python
# Preload all reference data (3 queries instead of ~35,000)
dd_cache = {}  # portfolio_id → {field: value, ...}
for row in conn.execute("SELECT * FROM datos_descriptivos").fetchall():
    dd_cache[row['portfolio_id']] = dict(row)

ie_cache = {}  # portfolio_id → {field: value, ...}
for row in conn.execute("SELECT * FROM informacion_economica").fetchall():
    ie_cache[row['portfolio_id']] = dict(row)

hechos_cache = {}  # portfolio_id → [list of hechos rows]
for row in conn.execute("SELECT * FROM hechos ORDER BY id_hecho").fetchall():
    hechos_cache.setdefault(row['portfolio_id'], []).append(dict(row))
```

**Changes to helper functions:** Accept cache dicts as parameters instead of `conn`. Replace SQL queries with in-memory lookups/filters.

**Affected functions:**
- `lookup_functions.py`: `get_datos_descriptivos_lookups()`, `get_informacion_economica_lookups()` → use cache directly
- `helper_functions.py`: `ultimo_id()`, `fecha_estado()`, `en_presupuesto_del_ano()`, `calidad_valoracion()`, `siguiente_accion()`, etc. → filter `hechos_cache[portfolio_id]` in memory
- `estado_functions.py`: all estado functions → use hechos_cache
- `importe_functions.py`: all importe functions → use hechos_cache

**Impact:** Reduces from ~35,000-42,000 queries to ~10 bulk queries at startup.

### Spec 12: Management — Configuration Validation

**New function in `settings.py`:**
```python
def validate_config(command: str):
    """Validate configuration for the given CLI command."""
    errors = []
    if command in ('migrate', 'full_calculation_datos_relevantes'):
        if not Path(EXCEL_SOURCE_DIR).exists():
            errors.append(f"EXCEL_SOURCE_DIR not found: {EXCEL_SOURCE_DIR}")
        for name, filename in EXCEL_FILES.items():
            if not (Path(EXCEL_SOURCE_DIR) / filename).exists():
                errors.append(f"Excel file missing: {name} ({filename})")
    if command in ('calculate_datos_relevantes', 'validate', 'export_datos_relevantes'):
        if not Path(DATABASE_PATH).exists():
            errors.append(f"Database not found: {DATABASE_PATH}")
    if errors:
        raise ConfigurationError("\n".join(errors))
```

**Call from `main.py`** at startup before executing any command.

### Spec 13: Management — Batch Commit Consistency

1. **Standardize commit frequency:** Both migration and calculation use configurable `BATCH_COMMIT_SIZE = 500` (new setting in `settings.py`).

2. **Migration: use `executemany()`** where possible. For simple tables where all rows share the same column mapping, collect values into a list and insert with a single `executemany()` call. For tables with complex per-row normalization, keep iterrows but batch commits.

### Spec 14: .gitignore Improvements

Add to `.gitignore`:
```
# IDE
.vscode/
.idea/
*.swp
*.swo

# macOS
.DS_Store

# Build outputs
frontend/dist/

# Test coverage
coverage/
.coverage
htmlcov/
```

### Spec 15: Documentation Updates

1. **CLAUDE.md line 94:** Replace `├── calculated_fields.py     # On-the-fly computed fields (~65 fields)` with directory listing of the 6 files.

2. **CLAUDE.md line 200:** Replace reference to `calculated_fields.py` with `calculated_fields/` module.

3. **Update `.env.example` files** in backend with new settings.

4. **Update architecture docs** after all changes are complete.

5. **Update README.md** with new configuration variables.

---

## 4. Backward Compatibility

- **API response shapes:** Unchanged. Calculated fields produce identical output.
- **CLI interface:** Unchanged. Same commands, same flags.
- **Frontend localStorage keys:** Unchanged. Storage utility refactor preserves key names.
- **Database schema:** CASCADE changes only affect DELETE behavior. Indexes are additive.
- **Environment variables:** All new settings have defaults matching current behavior.

---

## 5. Testing Strategy

- **Backend:** Verify API responses unchanged after calculated fields caching (compare before/after JSON)
- **Frontend:** `npm run build` succeeds, verify lazy-loaded routes render correctly
- **Management:** Run `full_calculation_datos_relevantes` pipeline, compare output to baseline
- **Schema:** Re-migrate after schema changes, verify data integrity
