# Feature 019: Implementation Plan

## Phase 1: Database Schema + Preservation Logic

### 1.1 Add DDL to schema.sql

**File:** `db/schema.sql`

Append after the transacciones section (before fichas or at end):

```sql
-- ============================================================================
-- TRANSACTION DIFFS (Feature 019)
-- ============================================================================

CREATE TABLE transacciones_json (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT NOT NULL,
    tipo_operacion TEXT NOT NULL,
    clave_primaria TEXT NOT NULL,
    cambios TEXT,
    usuario TEXT,
    mensaje_commit TEXT,
    estado_db TEXT NOT NULL DEFAULT 'PENDIENTE',
    estado_excel TEXT NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ejecucion_db DATETIME,
    fecha_ejecucion_excel DATETIME,
    error_detalle TEXT,
    CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    CHECK (estado_db IN ('PENDIENTE', 'EJECUTADO', 'ERROR')),
    CHECK (estado_excel IN ('PENDIENTE', 'EJECUTADO', 'ERROR', 'NO_APLICA'))
);

CREATE INDEX idx_tj_estado_db ON transacciones_json (estado_db);
CREATE INDEX idx_tj_entidad ON transacciones_json (entidad);
CREATE INDEX idx_tj_fecha ON transacciones_json (fecha_creacion);
```

### 1.2 Create table in existing portfolio.db

Run the CREATE TABLE + indexes directly via sqlite3 against the existing database (no full recreate needed).

### 1.3 Modify recreate_tables to preserve transacciones_json

**File:** `management/src/init/db_init.py`

Modify `recreate_tables()` function:
- Define `PRESERVED_TABLES = ["transacciones_json"]`
- Before dropping tables: for each preserved table that exists, SELECT all rows and column names into memory
- After schema execution: re-INSERT the backed-up rows
- Log the preservation process

---

## Phase 2: Backend Model + Schemas

### 2.1 SQLAlchemy Model

**File:** `backend/app/models.py`

Add `TransaccionJson` class after `Transaccion`:
- 13 columns matching the DDL
- `id` as AUTOINCREMENT primary key
- `fecha_creacion` with `default=func.now()`

### 2.2 Pydantic Schemas

**File:** `backend/app/schemas.py`

Add two schemas:

**TransaccionJsonCreate:**
- `entidad: str`
- `tipo_operacion: Literal["INSERT", "UPDATE", "DELETE"]`
- `clave_primaria: str` (JSON string)
- `cambios: str | None = None`
- `usuario: str | None = None`
- `mensaje_commit: str | None = None`
- `estado_excel: str = "PENDIENTE"`

**TransaccionesJsonReportRequest:**
- `entidad: list[str] = []`
- `tipo_operacion: list[str] = []`
- `estado_db: list[str] = []`
- `estado_excel: list[str] = []`
- `usuario: str | None = None`
- `fecha_creacion_inicio: str | None = None`
- `fecha_creacion_fin: str | None = None`
- `order_by: str | None = "fecha_creacion"`
- `order_dir: Literal["asc", "desc"] = "desc"`
- `limit: int = Field(default=50, le=1000)`
- `offset: int = Field(default=0, ge=0)`

---

## Phase 3: Table Registry Extraction

### 3.1 Create table_registry.py

**File:** `backend/app/table_registry.py` (NEW)

- Import all 22 model classes from `models.py`
- Define `TABLE_MODELS` dict (same content as currently in `portfolio.py`)

### 3.2 Update portfolio.py

**File:** `backend/app/routers/portfolio.py`

- Replace inline `TABLE_MODELS` definition with: `from ..table_registry import TABLE_MODELS`
- Remove model imports that were only needed for TABLE_MODELS definition

---

## Phase 4: Processor Service

### 4.1 Create services package

**File:** `backend/app/services/__init__.py` (NEW, empty)

### 4.2 Create transaction processor

**File:** `backend/app/services/transaction_processor.py` (NEW)

**Functions:**

`process_pending_transactions(db: Session) -> dict`:
- Query all `estado_db = 'PENDIENTE'` ordered by `id`
- For each: call `_apply_transaction(db, txn)`
- On success: `estado_db = 'EJECUTADO'`, `fecha_ejecucion_db = utcnow()`
- On error: `estado_db = 'ERROR'`, `error_detalle = str(e)`
- Commit after each transaction independently
- Return `{processed, success, errors, details}`

`_apply_transaction(db, txn)`:
- Look up model from `TABLE_MODELS` by `txn.entidad`
- Parse `clave_primaria` and `cambios` with `json.loads()`
- Dispatch by `tipo_operacion`:
  - INSERT: merge pk_data + cambios → `crud.create(db, data)`
  - UPDATE: find record → `crud.update(db, obj, cambios)`
  - DELETE: find record → `crud.delete(db, pk_value)`

`_find_record(db, model, pk_data)`:
- Build dynamic SQLAlchemy filter from pk_data dict
- Return first match or None

---

## Phase 5: Backend Router

### 5.1 Create router

**File:** `backend/app/routers/transacciones_json.py` (NEW)

Prefix: `/transacciones-json`, Tag: "Transacciones JSON"

**Endpoints (order matters — static before dynamic!):**
1. `GET /` — list paginated
2. `GET /report-filter-options` — distinct values for 5 filter fields
3. `POST /search-report` — filtered report search
4. `POST /process` — trigger processor for PENDIENTE records
5. `GET /{id}` — get by ID
6. `POST /` — create new transaction (status 201)
7. `DELETE /{id}` — delete transaction

### 5.2 Register router

**File:** `backend/app/routers/__init__.py` — add `transacciones_json` to imports and `__all__`

**File:** `backend/app/main.py` — add `app.include_router(transacciones_json.router, prefix=settings.API_PREFIX)`

---

## Phase 6: Frontend Report Page

### 6.1 Create report page

**File:** `frontend/src/features/reports/TransaccionesJsonReportPage.jsx` (NEW)

Using GenericReportPage pattern (same as TransaccionesReportPage):
- Icon: `FileJson` from lucide-react
- 13 REPORT_COLUMNS, 10 DEFAULT_COLUMN_IDS
- 7 FILTER_DEFS (4 multiselect, 1 text, 2 date)
- `buildRequestBody` function mapping camelCase filters to snake_case API fields
- `linkField: null` (no link column)
- Default sort: `fecha_creacion desc`

### 6.2 Register in exports

**File:** `frontend/src/features/reports/index.js` — add export

### 6.3 Add route

**File:** `frontend/src/App.jsx` — add route `/informes/transacciones-json`

### 6.4 Add navigation

**File:** `frontend/src/components/layout/Navbar.jsx` — add `FileJson` icon and nav item to `informesItems`

---

## Phase 7: Notas Modal Edit Form

### 7.1 Install Radix Dialog dependency

```bash
cd frontend && npm install @radix-ui/react-dialog
```

### 7.2 Create Dialog UI component

**File:** `frontend/src/components/ui/dialog.jsx` (NEW)

Create shadcn/ui-style Dialog component wrapping `@radix-ui/react-dialog`:
- `Dialog` (root), `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`
- `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`
- Styled with Tailwind: centered overlay, max-w-lg content, animation classes
- Accessible: focus trap, escape to close, click-outside to close

### 7.3 Create NotaFormModal component

**File:** `frontend/src/features/detail/components/NotaFormModal.jsx` (NEW)

**Props:**
- `open` (boolean) — controls visibility
- `onOpenChange` (function) — close handler
- `portfolioId` (string) — from detail page context
- `nota` (object|null) — null = create mode, object = edit mode
- `onSuccess` (function) — callback after successful save (triggers refetch)

**Internal state:**
- `fecha`, `registradoPor`, `notaText`, `mensajeCommit`
- `isSubmitting`, `showDeleteConfirm`

**Form layout:**
- Title: "Añadir Nota" (create) or "Editar Nota" (edit)
- Fields: fecha (date input), registrado_por (text), nota (textarea 4 rows)
- Separator line
- mensaje_commit (text input, required)
- Footer: [Eliminar] (edit only, red, left) ... [Cancelar] [Guardar] (right)

**Submit flow (create):**
1. Build JSON: `{ entidad: "notas", tipo_operacion: "INSERT", clave_primaria: JSON.stringify({portfolio_id}), cambios: JSON.stringify({portfolio_id, fecha, registrado_por, nota}), mensaje_commit }`
2. `POST /api/v1/transacciones-json/` — create transaction
3. `POST /api/v1/transacciones-json/process` — apply immediately
4. Call `onSuccess()` to refetch detail data
5. Close modal

**Submit flow (edit):**
1. Compute diff: only include fields that changed vs original `nota` prop
2. If no changes, show message and don't submit
3. Build JSON: `{ entidad: "notas", tipo_operacion: "UPDATE", clave_primaria: JSON.stringify({id: nota.id}), cambios: JSON.stringify(changedFields), mensaje_commit }`
4. Same POST + process + refetch + close flow

**Delete flow:**
1. User clicks "Eliminar" → show inline confirmation ("¿Está seguro?")
2. On confirm: `{ entidad: "notas", tipo_operacion: "DELETE", clave_primaria: JSON.stringify({id: nota.id}), mensaje_commit }`
3. Same POST + process + refetch + close flow

### 7.4 Create useTransactionSubmit hook

**File:** `frontend/src/features/detail/hooks/useTransactionSubmit.js` (NEW)

Encapsulates the create-then-process pattern:
```javascript
export function useTransactionSubmit() {
  // Returns { submit, isSubmitting }
  // submit(transactionData) → POST create + POST process
}
```

Uses apiClient for both calls. Returns the process result.

### 7.5 Modify NotasSection

**File:** `frontend/src/features/detail/components/sections/NotasSection.jsx`

Changes:
- Accept new props: `portfolioId`, `onSuccess`
- Add "Añadir Nota" button (Plus icon) at the top of the section
- Add edit icon button (Pencil icon) on each nota card
- Import and render `NotaFormModal` with appropriate mode (create/edit)
- Manage modal open/close state internally

### 7.6 Modify DetailPage

**File:** `frontend/src/features/detail/DetailPage.jsx`

Changes:
- Pass `portfolioId` and a refetch function to `NotasSection`
- The refetch function invalidates the TanStack Query cache for the portfolio detail

---

## Phase 8: Documentation

### 8.1 Architecture Backend

**File:** `specs/architecture_backend.md`

- Add `services/` directory to structure listing
- Add `transacciones_json.py` to routers listing
- Add `table_registry.py` to app listing
- Add report endpoints to section 4.4
- Add process endpoint documentation
- Update table listing (Audit category)

### 8.2 Architecture Frontend

**File:** `specs/architecture_frontend.md`

- Add Dialog UI component to component listing
- Add Notas modal documentation
- Add useTransactionSubmit hook
- Update Informes section with Transacciones JSON report

### 8.3 README

**File:** `README.md`

- Add transacciones-json endpoints to API table
- Add Transacciones JSON report to frontend features
- Add Notas edit capability to frontend features
- Add route to routes table

---

## Verification Checklist

1. **Schema:** `sqlite3 db/portfolio.db ".tables"` shows `transacciones_json`
2. **Backend imports:** `cd backend && uv run python -c "from app.routers import transacciones_json; print('OK')"`
3. **Frontend build:** `cd frontend && npm run build` succeeds
4. **Swagger test:**
   - POST `/api/v1/transacciones-json/` — create a test transaction
   - GET `/api/v1/transacciones-json/` — see it in the list
   - GET `/api/v1/transacciones-json/report-filter-options` — filter values populated
   - POST `/api/v1/transacciones-json/search-report` with `{}` — returns results
   - POST `/api/v1/transacciones-json/process` — processes pending transactions
5. **recreate_tables preservation:** run `recreate_tables`, verify transacciones_json data survives
6. **Notas modal E2E test:**
   - Navigate to a detail page with existing notas
   - Click "Añadir Nota" → fill form + commit message → Save
   - Verify nota appears in the list
   - Click edit on the new nota → modify text → Save
   - Verify change reflected
   - Click edit → Delete → Confirm
   - Verify nota removed
   - Check Transacciones JSON report shows all 3 operations

---

## Files Summary

### New Files (9)
- `backend/app/table_registry.py`
- `backend/app/services/__init__.py`
- `backend/app/services/transaction_processor.py`
- `backend/app/routers/transacciones_json.py`
- `frontend/src/components/ui/dialog.jsx`
- `frontend/src/features/detail/components/NotaFormModal.jsx`
- `frontend/src/features/detail/hooks/useTransactionSubmit.js`
- `frontend/src/features/reports/TransaccionesJsonReportPage.jsx`
- `specs/features/feature_019/specs.md`

### Modified Files (14)
- `db/schema.sql`
- `management/src/init/db_init.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/routers/portfolio.py`
- `backend/app/routers/__init__.py`
- `backend/app/main.py`
- `frontend/package.json` (new dependency: @radix-ui/react-dialog)
- `frontend/src/features/detail/components/sections/NotasSection.jsx`
- `frontend/src/features/detail/DetailPage.jsx`
- `frontend/src/features/reports/index.js`
- `frontend/src/App.jsx`
- `frontend/src/components/layout/Navbar.jsx`
- `specs/architecture_backend.md`
- `specs/architecture_frontend.md`
- `README.md`
