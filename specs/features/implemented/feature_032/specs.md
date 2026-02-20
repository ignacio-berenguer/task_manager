# Technical Specifications — feature_032

## Excel Write-Back from transacciones_json + Detail Page Transaction Section

---

## 1. Overview

This feature adds two capabilities:

1. **Excel Write-Back**: Process pending `transacciones_json` records to update the original Excel source files (`management/excel_source/`), with parameterized DB-to-Excel field mapping, safety validations, async backend processing, and frontend notification.
2. **Detail Page Transaction Section**: A new accordion section in the initiative detail page showing all `transacciones_json` records for a given `portfolio_id`.

---

## 2. Current State Analysis

### 2.1 transacciones_json Table (Already Exists)

The schema already supports dual state tracking:

| Field | Values | Purpose |
|-------|--------|---------|
| `estado_db` | PENDIENTE, EJECUTADO, ERROR | Database operation status |
| `estado_excel` | PENDIENTE, EJECUTADO, ERROR, NO_APLICA | Excel operation status |
| `fecha_ejecucion_excel` | DATETIME | When Excel operation completed |
| `error_detalle` | TEXT | Error details |

The existing `/process` endpoint only processes `estado_db`. The `estado_excel` field is set to `NO_APLICA` for CRUD operations created from the frontend (see `EntityFormModal.jsx`). This feature implements the Excel processing pipeline.

### 2.2 Excel Source Files

| Workbook | Tables |
|----------|--------|
| `PortfolioDigital_Master.xlsm` | iniciativas, datos_descriptivos, informacion_economica, facturacion, datos_ejecucion, hechos, etiquetas, justificaciones, ltp, wbes, dependencias, notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt, grupos_iniciativas |
| `PortfolioDigital_Beneficios.xlsm` | beneficios |
| `PortfolioDigital_Facturado.xlsx` | facturacion (monthly) |
| `PortfolioDigital_Transacciones.xlsm` | transacciones |
| `PortfolioDigital_Fichas.xlsm` | fichas |

### 2.3 No Async Infrastructure

The project currently has no background task system, no WebSockets, and no SSE. All operations are synchronous request-response.

---

## 3. Design Decisions

### 3.1 Async Processing Strategy: FastAPI BackgroundTasks + Polling

**Chosen approach**: FastAPI `BackgroundTasks` for fire-and-forget processing + frontend polling for status.

**Rationale**:
- No additional infrastructure (no Redis, no Celery)
- Consistent with existing architecture patterns
- Simple to implement and maintain
- Frontend uses React Query refetching to poll for updates

**Flow**:
1. Frontend calls `POST /transacciones-json/process-excel`
2. Backend validates there are pending records, enqueues a background task, returns immediately with `{ "status": "processing", "count": N }`
3. Background task processes each record sequentially (file I/O is not parallelizable per workbook)
4. Updates `estado_excel`, `fecha_ejecucion_excel`, `error_detalle`, and new `valores_previos_excel` for each record
5. Frontend polls `GET /transacciones-json/process-excel-status` to check progress
6. Shows toast notifications on completion

### 3.2 Excel Modification Library: xlwings

**Chosen approach**: Use `xlwings` to interact with Excel files through the Excel application (COM on Windows).

**Rationale**:
- The Excel source files may be **open simultaneously** by other users on SharePoint or on the local machine.
- `openpyxl` requires exclusive file access and **will fail** with write errors in these co-authoring / open-file scenarios.
- `xlwings` interacts through the Excel COM API, which handles file locking, co-authoring, and open files gracefully.
- `xlwings` can modify individual cells without rewriting the entire sheet, preserving macros, formatting, and formulas.
- The backend runs on **WSL2** with access to a Windows Excel installation. xlwings can bridge WSL2 → Windows Excel via COM.

**xlwings specifics**:
- Open workbook: `xw.Book(path)` — opens in running Excel instance or launches one
- Access sheet: `wb.sheets['SheetName']`
- Read cell: `sheet.range('A1').value` or `sheet.range((row, col)).value`
- Write cell: `sheet.range((row, col)).value = new_value`
- Save: `wb.save()` — saves in place, respects co-authoring
- Close: `wb.close()` — releases the workbook
- App management: `xw.App(visible=False)` for headless operation

**Dependency**: Add `xlwings` to `backend/pyproject.toml`

### 3.3 Mapping Configuration: Python Dict in a Dedicated Module

**Chosen approach**: A Python module (`backend/app/services/excel_mapping.py`) with a `EXCEL_MAPPING` dict.

**Rationale**:
- Easy to modify (plain Python dict)
- Can be validated at startup
- Keeps mapping close to the code that uses it
- No need for JSON file parsing or external config management

### 3.4 Previous Values Storage: New Column

**Chosen approach**: Add `valores_previos_excel TEXT` column to `transacciones_json` table.

**Rationale**:
- Stores the Excel cell values as JSON before modification
- Clean separation from `cambios` (new values) and `error_detalle` (errors)
- Enables audit trail and rollback capability

### 3.5 INSERT Blocked for datos_descriptivos

**Rule**: INSERT operations on `datos_descriptivos` are **not written back to Excel**.

**Rationale**:
- The Excel workbook is the **master source** for new initiatives. Each new `portfolio_id` originates in Excel.
- If the web app inserts a new `datos_descriptivos` record and writes it to Excel, the Excel may already have a different record with that `portfolio_id` (or it could conflict with future manual entries).
- The `estado_excel` for INSERT transactions targeting `datos_descriptivos` must be set to `NO_APLICA` at creation time (in `EntityFormModal` / transaction processor), bypassing Excel write-back entirely.

**Implementation**:
- In the Excel writer, if `entidad == "datos_descriptivos"` and `tipo_operacion == "INSERT"`, skip and set `estado_excel = "NO_APLICA"` (defensive check).
- In the frontend `EntityFormModal`, when creating a new `datos_descriptivos` record, set `estado_excel: "NO_APLICA"` in the transaction payload.
- UPDATE and DELETE on `datos_descriptivos` remain allowed for Excel write-back.

### 3.6 INSERT on hechos — id_hecho Reconciliation

**Rule**: When inserting a `hechos` record into Excel, the `id_hecho` must be reconciled to avoid PK conflicts.

**Problem**:
- The database auto-generates `id_hecho = max(id_hecho) + 1` when processing an INSERT transaction.
- Between the DB insert and the Excel write-back, new hechos may have been added directly in Excel with higher `id_hecho` values.
- Writing the DB-generated `id_hecho` to Excel would create a duplicate PK.

**Solution**:
1. Before inserting into Excel, read the current max `id_hecho` from the Excel "Hechos" sheet.
2. If `excel_max_id >= db_id_hecho`, assign `new_id = excel_max_id + 1`.
3. Write the row to Excel with `new_id`.
4. **Update the database record** (`hechos.id_hecho`) to match `new_id`, keeping both in sync.
5. Also update the `clave_primaria` JSON in the `transacciones_json` record to reflect the new `id_hecho`.
6. Log the id reconciliation at INFO level.

**Implementation**: Special-case logic in `_apply_insert` when `entidad == "hechos"`.

### 3.7 Detail Page Transaction Query: Dedicated portfolio_id Column

**Chosen approach**: Added a dedicated `portfolio_id TEXT` column to `transacciones_json` table with an index (`idx_tj_portfolio`).

**Rationale**:
- `json_extract(clave_primaria, '$.portfolio_id')` was initially considered, but UPDATE/DELETE operations store entity-specific PKs (e.g., `{"id": 647}`, `{"id_hecho": 3844}`), not `portfolio_id`
- A dedicated column is simpler, faster (indexed), and always populated by the frontend at transaction creation time
- The `by-portfolio` endpoint uses a straightforward `WHERE portfolio_id = :portfolio_id` filter

---

## 4. Schema Changes

### 4.1 transacciones_json Table — Add Column

```sql
ALTER TABLE transacciones_json ADD COLUMN valores_previos_excel TEXT;
```

This column stores a JSON string with the previous Excel cell values before modification:
```json
{"nota": "Old note text", "fecha": "2025-01-15"}
```

### 4.2 transacciones_json Table — Add portfolio_id Column

```sql
ALTER TABLE transacciones_json ADD COLUMN portfolio_id TEXT;
CREATE INDEX idx_tj_portfolio ON transacciones_json (portfolio_id);
```

Links each transaction to its initiative for the detail page query. Populated by the frontend at transaction creation time.

### 4.3 No New Tables Required

The existing `transacciones_json` table already has all necessary status tracking fields (`estado_excel`, `fecha_ejecucion_excel`, `error_detalle`).

---

## 5. Backend Specifications

### 5.1 Excel Mapping Module — `backend/app/services/excel_mapping.py`

```python
EXCEL_MAPPING = {
    "notas": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Notas",
        "header_row": 4,       # 1-indexed row where headers are (skiprows=3 means row 4)
        "pk_fields": ["portfolio_id"],
        "column_mapping": {
            # db_column_name: excel_column_name
            "portfolio_id": "Portfolio ID",
            "registrado_por": "Registrado por",
            "fecha": "Fecha",
            "nota": "Nota",
            "fecha_actualizacion": "Fecha actualización",
        }
    },
    "hechos": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Hechos",
        "header_row": 3,
        "pk_fields": ["id_hecho"],
        "insert_pk_reconcile": {"pk_field": "id_hecho", "strategy": "excel_max_plus_one"},
        "column_mapping": {
            "id_hecho": "ID Hecho",
            "portfolio_id": "Portfolio ID",
            # ... all hechos columns
        }
    },
    "datos_descriptivos": {
        "excel_file": "PortfolioDigital_Master.xlsm",
        "sheet_name": "Datos descriptivos",
        "header_row": 3,
        "pk_fields": ["portfolio_id"],
        "insert_blocked": True,  # Excel is master for new initiatives
        "column_mapping": {
            "portfolio_id": "Portfolio ID",
            # ... all datos_descriptivos columns
        }
    },
    # ... entries for all CRUD-enabled tables
}
```

**Fields per mapping entry:**

| Field | Type | Description |
|-------|------|-------------|
| `excel_file` | str | Filename of the workbook in `EXCEL_SOURCE_DIR` |
| `sheet_name` | str | Exact Excel worksheet name |
| `header_row` | int | 1-indexed row number where column headers are |
| `pk_fields` | list[str] | DB column names used as primary key for row lookup |
| `column_mapping` | dict | `{db_column: excel_column_header}` — only mapped columns are read/written |
| `insert_blocked` | bool (optional) | If `True`, INSERT operations set `estado_excel = NO_APLICA` and are skipped. Default: `False` |
| `insert_pk_reconcile` | dict (optional) | PK reconciliation config for INSERT. Keys: `pk_field` (column name), `strategy` (`"excel_max_plus_one"`). When present, reads Excel max PK value and reassigns if conflict detected, updating both Excel and DB |

### 5.2 Excel Writer Service — `backend/app/services/excel_writer.py`

**Class: `ExcelWriterService`**

Core methods:

#### `process_pending_excel_transactions(db: Session) -> dict`
- Fetches all records where `estado_db == 'EJECUTADO'` AND `estado_excel == 'PENDIENTE'`
- Groups records by `excel_file` (to minimize workbook open/close cycles)
- Opens an xlwings App instance (`xw.App(visible=False)`) for headless operation
- For each workbook group: opens workbook via `xw.Book(path)`, processes all records, saves via `wb.save()`
- Updates each record's `estado_excel`, `fecha_ejecucion_excel`, `valores_previos_excel`, `error_detalle`
- Closes the App instance in a `finally` block to prevent orphaned Excel processes
- Returns summary: `{ processed, success, errors, details: [...] }`

#### `_build_column_index(sheet, header_row, column_mapping) -> dict`
- Read the header row from the xlwings sheet: `sheet.range((header_row, 1), (header_row, last_col)).value`
- Build `{db_column: col_number}` by matching `column_mapping` values against header values
- Raise if any mapped column is not found in the header row

#### `_find_matching_rows(sheet, header_row, col_index, pk_fields, pk_data) -> list[int]`
- Scan data rows (from `header_row + 1` to last used row)
- Read PK columns for each row and compare to `pk_data`
- Return list of matching row numbers

#### `_apply_update(sheet, mapping, col_index, pk_data, cambios) -> dict`
1. Call `_find_matching_rows` to locate rows matching PK
2. If 0 matches → raise `ValueError("No matching row found")`
3. If >1 matches → raise `ValueError("Multiple rows match primary key — expected exactly 1")`
4. Read current values of changed columns via `sheet.range((row, col)).value` → store as `previous_values`
5. Write only the changed cells via `sheet.range((row, col)).value = new_value`
6. Return `previous_values` dict

#### `_apply_insert(sheet, mapping, col_index, pk_data, cambios, db, txn) -> None`
1. **Blocked entities check**: If `entidad == "datos_descriptivos"`, set `estado_excel = NO_APLICA` and skip.
2. **hechos id_hecho reconciliation**: If `entidad == "hechos"`:
   a. Read all values in the `id_hecho` column (PK column) from Excel
   b. Compute `excel_max_id = max(id_hecho values)`
   c. If `excel_max_id >= pk_data["id_hecho"]`, set `new_id = excel_max_id + 1`
   d. Update `pk_data["id_hecho"]` to `new_id`
   e. Update the DB `hechos` record to the new `id_hecho`
   f. Update the `clave_primaria` JSON in the `transacciones_json` record
   g. Log: `"Reconciled id_hecho: {old_id} → {new_id}"`
3. Call `_find_matching_rows` to verify **0 rows** match the (possibly updated) primary key
4. If any match → raise `ValueError("Record already exists with this primary key")`
5. Find the last used row, insert new row after it
6. Write all fields (pk + cambios) to the appropriate columns via `sheet.range((new_row, col)).value = value`

#### `_apply_delete(sheet, mapping, col_index, pk_data) -> dict`
1. Call `_find_matching_rows` to locate rows matching PK
2. If 0 matches → raise `ValueError("No matching row found")`
3. If >1 matches → raise `ValueError("Multiple rows match primary key — expected exactly 1")`
4. Read all current values → store as `previous_values`
5. Delete the row via `sheet.range(f'{row}:{row}').delete()`
6. Return `previous_values` dict

### 5.3 New API Endpoints

#### `POST /api/v1/transacciones-json/process-excel`
- Checks for pending Excel transactions
- If none → returns `{ "status": "no_pending", "count": 0 }`
- If pending → enqueues `BackgroundTasks` job, returns `{ "status": "processing", "count": N }`

#### `GET /api/v1/transacciones-json/process-excel-status`
- Returns current processing state:
  - `{ "status": "idle" }` — no processing running
  - `{ "status": "processing", "processed": X, "total": Y }` — in progress
  - `{ "status": "completed", "processed": N, "success": S, "errors": E, "details": [...] }` — last run results

#### `GET /api/v1/transacciones-json/by-portfolio/{portfolio_id}`
- Returns all `transacciones_json` records where `json_extract(clave_primaria, '$.portfolio_id') = :portfolio_id`
- Ordered by `fecha_creacion DESC`
- Used by the detail page's new section

### 5.4 Backend Configuration (.env additions)

```env
# Excel Write-Back Configuration
EXCEL_SOURCE_DIR=../management/excel_source  # Path relative to backend/ directory
```

### 5.5 Logging

All Excel write operations logged with the existing `portfolio_backend` logger:

| Level | Events |
|-------|--------|
| INFO | Process started (count of pending), each operation start/success, process completed (summary) |
| ERROR | Each operation failure (with full error details) |
| DEBUG | File open/close, row search details, cell value changes |

### 5.6 Processing State Management

Use a module-level dict to track processing state (simple, no persistence needed):

```python
_processing_state = {
    "status": "idle",  # idle | processing | completed
    "total": 0,
    "processed": 0,
    "success": 0,
    "errors": 0,
    "details": [],
    "started_at": None,
    "completed_at": None,
}
```

Reset to "idle" on new `/process-excel` call. Updated during processing. Frontend polls `/process-excel-status`.

---

## 6. Frontend Specifications

### 6.1 Detail Page — Transacciones JSON Section

**New component**: `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx`

**Display**: A table showing transaction records for the initiative with columns:
- ID
- Entidad
- Tipo Operación (badge-styled: INSERT=green, UPDATE=blue, DELETE=red)
- Estado DB (badge: PENDIENTE=yellow, EJECUTADO=green, ERROR=red)
- Estado Excel (badge: same color scheme + NO_APLICA=gray)
- Fecha Creación
- Usuario
- Mensaje Commit

**Expandable row detail**: Click to expand a row to see:
- `clave_primaria` (formatted JSON)
- `cambios` (formatted JSON)
- `valores_previos_excel` (formatted JSON, if present)
- `error_detalle` (if present, highlighted in red)

**Data source**: `GET /api/v1/transacciones-json/by-portfolio/{portfolio_id}`

**Position in detail page**: After the existing `TransaccionesSection` (the read-only audit trail), as the last accordion section.

### 6.2 Process Excel Button

**Location**: In the Transacciones JSON section header (next to the section title).

**Behavior**:
1. Button labeled "Sincronizar Excel" with a refresh icon
2. Disabled if no records with `estado_excel == 'PENDIENTE'`
3. On click → call `POST /transacciones-json/process-excel`
4. Show loading spinner on button
5. Start polling `GET /transacciones-json/process-excel-status` every 2 seconds
6. On completion:
   - Show toast: "Excel sync complete: X success, Y errors"
   - Refetch the section data
   - Stop polling

### 6.3 Async Notification

**Library**: `sonner` (already used in the project)

**Toast messages**:
- Start: `toast.info("Sincronizando con Excel... (N pendientes)")`
- Success: `toast.success("Excel sincronizado: N operaciones correctas")`
- Partial: `toast.warning("Excel sincronizado: X correctas, Y errores")`
- Error: `toast.error("Error al sincronizar con Excel")`

### 6.4 Data Fetching

New React Query hook: `useTransaccionesJson(portfolioId)`

```javascript
useQuery({
  queryKey: ['transacciones-json', portfolioId],
  queryFn: () => apiClient.get(`/transacciones-json/by-portfolio/${portfolioId}`),
  enabled: !!portfolioId,
})
```

### 6.5 Process Excel Status Hook

New React Query hook: `useExcelProcessStatus(enabled)`

```javascript
useQuery({
  queryKey: ['excel-process-status'],
  queryFn: () => apiClient.get('/transacciones-json/process-excel-status'),
  enabled,
  refetchInterval: enabled ? 2000 : false,  // Poll every 2s when processing
})
```

---

## 7. Security Considerations

1. **Previous value capture**: Before any Excel modification, read and store the current cell values in `valores_previos_excel` (JSON). This enables audit and potential rollback.
2. **Single-row validation**: All UPDATE/DELETE operations verify exactly 1 row matches the PK. Prevents accidental bulk modifications.
3. **Insert uniqueness**: INSERT verifies no existing row has the same PK. Prevents duplicates.
4. **File backup**: The original Excel files are in `management/excel_source/` which could be under version control or backed up externally.
5. **Error isolation**: Each transaction is processed independently. One failure doesn't prevent others from succeeding.
6. **datos_descriptivos INSERT blocked**: New initiatives can only be created from Excel (the master source). INSERT on `datos_descriptivos` sets `estado_excel = NO_APLICA`.
7. **hechos id_hecho reconciliation**: On INSERT, the system reads the Excel max `id_hecho` and reassigns if needed, updating both Excel and DB to keep them in sync. Prevents PK collisions.

---

## 8. Error Handling

| Scenario | Behavior |
|----------|----------|
| Excel file not found | Set `estado_excel=ERROR`, store error in `error_detalle` |
| Sheet not found in workbook | Set `estado_excel=ERROR`, store error |
| No matching row for UPDATE/DELETE | Set `estado_excel=ERROR`, store error |
| Multiple rows match PK | Set `estado_excel=ERROR`, store error |
| Duplicate PK on INSERT | Set `estado_excel=ERROR`, store error |
| Entity not in EXCEL_MAPPING | Set `estado_excel=ERROR`, store "Entity not configured for Excel write-back" |
| INSERT on datos_descriptivos | Set `estado_excel=NO_APLICA`, skip (INSERT blocked — Excel is master for new initiatives) |
| INSERT on hechos with id conflict | Reconcile `id_hecho` (Excel max + 1), update DB + txn record, then insert |
| File permission error | Set `estado_excel=ERROR`, store error |
| xlwings save error | Set `estado_excel=ERROR`, store error, workbook not saved |
| Excel app not available | Set `estado_excel=ERROR`, store "Excel application not found (required for xlwings)" |
| File locked by another process | xlwings handles gracefully via COM — save waits for lock release |

---

## 9. Tables to Map (Initial Scope)

All tables currently editable via the detail page CRUD:

| DB Table | Excel File | Sheet | PK | INSERT Restriction |
|----------|-----------|-------|-----|---------------------|
| notas | Master | Notas | portfolio_id (+ fecha + nota for uniqueness) | — |
| hechos | Master | Hechos | id_hecho | id_hecho reconciliation (see 3.6) |
| etiquetas | Master | Etiquetas | portfolio_id | — |
| acciones | Master | Acciones | portfolio_id | — |
| datos_descriptivos | Master | Datos descriptivos | portfolio_id | **BLOCKED** — Excel is master (see 3.5) |
| informacion_economica | Master | Información Económica | portfolio_id | — |
| estado_especial | Master | Estado Especial | portfolio_id | — |
| impacto_aatt | Master | Impacto AATT | portfolio_id | — |
| justificaciones | Master | Justificaciones | portfolio_id | — |
| descripciones | Master | Descripciones | portfolio_id | — |
| ltp | Master | LTP | portfolio_id | — |
| wbes | Master | WBEs | portfolio_id | — |
| dependencias | Master | Dependencias | portfolio_id | — |
| grupos_iniciativas | Master | Grupos Iniciativas | portfolio_id_grupo + portfolio_id_componente | — |

Additional tables can be added later by extending `EXCEL_MAPPING`.

---

## 10. File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `backend/app/services/excel_mapping.py` | DB-to-Excel mapping configuration |
| `backend/app/services/excel_writer.py` | Excel write-back service |
| `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx` | Detail page section |
| `frontend/src/features/detail/hooks/useTransaccionesJson.js` | Data fetching hook |
| `frontend/src/features/detail/hooks/useExcelProcessStatus.js` | Process status polling hook |

### Modified Files
| File | Changes |
|------|---------|
| `db/schema.sql` | Add `valores_previos_excel` column to `transacciones_json` |
| `backend/app/models.py` | Add `valores_previos_excel` to `TransaccionJson` model |
| `backend/app/schemas.py` | Update schemas for new field |
| `backend/app/routers/transacciones_json.py` | Add 3 new endpoints |
| `backend/app/config.py` | Add `EXCEL_SOURCE_DIR` setting |
| `backend/.env` | Add `EXCEL_SOURCE_DIR` |
| `frontend/src/features/detail/DetailPage.jsx` | Add TransaccionesJsonSection |
| `frontend/src/features/detail/components/DetailNav.jsx` | Add nav entry |
