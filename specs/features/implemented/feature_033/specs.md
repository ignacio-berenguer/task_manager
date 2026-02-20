# Feature 033 — Excel Primary Key Columns & Full Transaction Display

## 1. Overview

This feature addresses two critical gaps in the transacciones_json Excel write-back pipeline:

1. **The `clave_primaria` mismatch problem**: The frontend stores database-specific PKs (e.g., `{"id": 647}`) in `clave_primaria`, but the Excel writer needs Excel-specific PKs (e.g., `{"portfolio_id": "P001", "etiqueta": "TAG1"}`) to locate rows in the workbook. These are fundamentally different identifiers.

2. **Incomplete Excel PKs for 1:N entities**: The current `EXCEL_MAPPING` uses `pk_fields: ["portfolio_id"]` for all 1:N entities (etiquetas, justificaciones, descripciones, ltp, wbes, dependencias, acciones, notas), which cannot uniquely identify a row when multiple rows share the same portfolio_id.

3. **Missing fields in Detail page**: The `TransaccionesJsonSection` does not display `fecha_ejecucion_db`, `fecha_ejecucion_excel`, or the new `clave_primaria_excel` field.

## 2. Current State Analysis

### 2.1 How clave_primaria Is Currently Built (Frontend)

**EntityFormModal.jsx** — lines 88–116:
- **INSERT**: `clave_primaria = { portfolio_id: portfolioId }`
- **UPDATE/DELETE (hechos)**: `clave_primaria = { id_hecho: record.id_hecho }`
- **UPDATE/DELETE (all others)**: `clave_primaria = { id: record.id }`

**NotaFormModal.jsx** follows the same pattern for the `notas` entity.

### 2.2 How clave_primaria Is Used

**Transaction Processor** (`transaction_processor.py`) — Uses `clave_primaria` to find the DB record:
- `_find_record(db, model, pk_data)` filters by the fields in pk_data
- Works correctly because pk_data matches the DB model's columns (`id`, `id_hecho`)

**Excel Writer** (`excel_writer.py`) — Uses `clave_primaria` as pk_data for Excel row matching:
- `_find_matching_rows(sheet, header_row, col_index, pk_fields, pk_data)`
- `pk_fields` from EXCEL_MAPPING (e.g., `["portfolio_id"]`)
- `pk_data` from parsed `clave_primaria` (e.g., `{"id": 647}`)
- **PROBLEM**: `pk_data.get("portfolio_id")` returns `None` → matching fails

### 2.3 Current EXCEL_MAPPING pk_fields

| Entity | Current pk_fields | Relationship | Problem |
|--------|------------------|-------------|---------|
| notas | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| hechos | `["id_hecho"]` | 1:N | **OK** — unique numeric ID in Excel |
| etiquetas | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| acciones | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| justificaciones | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| descripciones | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| ltp | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| wbes | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| dependencias | `["portfolio_id"]` | 1:N | Multiple rows per portfolio_id |
| datos_descriptivos | `["portfolio_id"]` | 1:1 | **OK** |
| informacion_economica | `["portfolio_id"]` | 1:1 | **OK** |
| estado_especial | `["portfolio_id"]` | 1:1 | **OK** |
| impacto_aatt | `["portfolio_id"]` | 1:1 | **OK** |
| grupos_iniciativas | `["portfolio_id_grupo", "portfolio_id_componente"]` | N:M | **OK** — composite key |

### 2.4 Fields Not Displayed in TransaccionesJsonSection

Currently displayed in table row: `id`, `entidad`, `tipo_operacion`, `estado_db`, `estado_excel`, `fecha_creacion`, `usuario`, `mensaje_commit`

Currently in expanded detail: `clave_primaria`, `cambios`, `valores_previos_excel`, `error_detalle`

**Not displayed at all**: `fecha_ejecucion_db`, `fecha_ejecucion_excel`

**Will be new**: `clave_primaria_excel`

## 3. Technical Specifications

### 3.1 Database Schema Change

Add a new column `clave_primaria_excel` to the `transacciones_json` table:

```sql
ALTER TABLE transacciones_json ADD COLUMN clave_primaria_excel TEXT;
```

This column stores a JSON object with the Excel-specific primary key values used by the Excel writer to locate the correct row. It is separate from `clave_primaria` (which is used by the transaction processor for DB operations).

**Why a separate column** (not modifying `clave_primaria`):
- `clave_primaria` is consumed by `transaction_processor.py` → must contain DB PK fields
- `clave_primaria_excel` is consumed by `excel_writer.py` → must contain Excel PK fields
- Separation of concerns: each consumer uses its own dedicated field
- Backward compatibility: existing transactions with null `clave_primaria_excel` continue working

### 3.2 Updated EXCEL_MAPPING pk_fields

Update `excel_mapping.py` with proper composite keys for 1:N entities. The chosen composite keys must uniquely identify a row in the Excel sheet:

| Entity | New pk_fields | Rationale |
|--------|--------------|-----------|
| notas | `["portfolio_id", "fecha", "registrado_por"]` | Each person creates max 1 note per date per initiative |
| etiquetas | `["portfolio_id", "etiqueta"]` | Each tag name is unique per initiative |
| acciones | `["portfolio_id", "siguiente_accion"]` | Each action type is unique per initiative |
| justificaciones | `["portfolio_id", "tipo_justificacion"]` | Each justification type is unique per initiative |
| descripciones | `["portfolio_id", "tipo_descripcion"]` | Each description type is unique per initiative |
| ltp | `["portfolio_id", "tarea"]` | Each task description is unique per initiative |
| wbes | `["portfolio_id", "anio", "wbe_pyb"]` | Each WBE is unique per year per initiative |
| dependencias | `["portfolio_id", "descripcion_dependencia"]` | Each dependency is unique per initiative |

Entities that remain unchanged (already correct):
- `hechos`: `["id_hecho"]` — unique numeric ID in both DB and Excel
- `datos_descriptivos`, `informacion_economica`, `estado_especial`, `impacto_aatt`: `["portfolio_id"]` — 1:1 relationship
- `grupos_iniciativas`: `["portfolio_id_grupo", "portfolio_id_componente"]` — already composite

### 3.3 Backend: Excel PK Resolution Service

Create a new service module `backend/app/services/excel_pk_resolver.py` that resolves the Excel primary key values for a transaction at creation time.

**Core function**: `resolve_excel_primary_key(db, entidad, tipo_operacion, clave_primaria, cambios) -> dict | None`

**Logic by operation type**:

1. **INSERT**: Extract Excel pk_fields values from `cambios` (which contains all fields being inserted, including portfolio_id).

2. **UPDATE**: Use `clave_primaria` (DB PK) to look up the current DB record. Extract the Excel pk_fields values from the current record state. This captures the **old values** before the update is applied — which is exactly what the Excel writer needs to FIND the row.

3. **DELETE**: Same as UPDATE — look up the current DB record, extract Excel pk_fields values. The record still exists at creation time (before processing).

**Why resolve at creation time (not at Excel processing time)**:
- For DELETE: the record is already deleted from DB by the time Excel processing runs
- For UPDATE: the field values may have changed by the time Excel processing runs
- Creation time captures the correct "find-by" values in all cases

**Edge case — PK field change on UPDATE**: When `cambios` modifies a field that is part of the Excel PK (e.g., changing `etiqueta` from "OLD" to "NEW"):
- `clave_primaria_excel` stores the **old** values (from current DB): `{"portfolio_id": "P001", "etiqueta": "OLD"}`
- `cambios` contains the **new** value: `{"etiqueta": "NEW"}`
- The Excel writer uses `clave_primaria_excel` to find the row (with "OLD") and applies `cambios` to update it (to "NEW")
- This naturally handles PK changes with no special code path needed

**Entity not in EXCEL_MAPPING**: Return `None` — no Excel write-back configured for this entity.

### 3.4 Backend: Transaction Creation Enhancement

Modify the `POST /transacciones-json/` endpoint in `transacciones_json.py` to auto-resolve and populate `clave_primaria_excel` at creation time:

```python
@router.post("/")
def create_transaccion_json(data: TransaccionJsonCreate, db: Session = Depends(get_db)):
    obj_data = data.model_dump()
    # Auto-resolve Excel PK
    excel_pk = resolve_excel_primary_key(
        db, data.entidad, data.tipo_operacion, data.clave_primaria, data.cambios
    )
    if excel_pk is not None:
        obj_data["clave_primaria_excel"] = json.dumps(excel_pk)
    obj = crud.create(db, obj_data)
    return model_to_dict(obj)
```

### 3.5 Backend: Excel Writer Update

Modify `_process_single_transaction()` in `excel_writer.py` to use `clave_primaria_excel` for row matching instead of `clave_primaria`:

```python
# Current (line 434):
pk_data = json.loads(txn.clave_primaria)

# New:
if txn.clave_primaria_excel:
    pk_data = json.loads(txn.clave_primaria_excel)
else:
    pk_data = json.loads(txn.clave_primaria)  # Backward compatibility
```

This is the only change needed in `excel_writer.py`. The `_find_matching_rows`, `_apply_excel_update`, `_apply_excel_delete`, and `_apply_excel_insert` functions continue to work as-is because they already use `pk_data` + `pk_fields` from EXCEL_MAPPING.

**INSERT special case**: For INSERT operations, `_apply_excel_insert` uses both `pk_data` and `cambios` to build the row data (`all_data = {**pk_data, **(cambios or {})}`). When `clave_primaria_excel` is used as pk_data, the pk fields (e.g., `portfolio_id`, `etiqueta`) will already be in both pk_data and cambios, which is fine — the merge just keeps the cambios value (identical).

**hechos reconciliation**: The `insert_pk_reconcile` logic updates `txn.clave_primaria` (for DB PK audit). It should also update `txn.clave_primaria_excel` to reflect the reconciled id_hecho.

### 3.6 SQLAlchemy Model Update

Add `clave_primaria_excel` column to the `TransaccionJson` model in `models.py`:

```python
clave_primaria_excel = Column(Text, nullable=True)
```

### 3.7 Pydantic Schema Update

Add `clave_primaria_excel` to `TransaccionJsonCreate` in `schemas.py` as optional:

```python
clave_primaria_excel: str | None = None
```

Note: The frontend will NOT send this field. It's auto-populated by the backend. But it should be in the schema for completeness and future use.

### 3.8 Frontend: TransaccionesJsonSection Enhancement

Update `TransaccionesJsonSection.jsx` to display all fields:

**Add to expanded detail view**:
- `fecha_ejecucion_db` — Formatted as date with `formatDate()`
- `fecha_ejecucion_excel` — Formatted as date with `formatDate()`
- `clave_primaria_excel` — Formatted as JSON with `formatJson()`, similar to `clave_primaria`

**Layout in ExpandedDetail component** (order):
1. Clave Primaria (DB) — existing
2. Clave Primaria Excel — new (if not null)
3. Cambios — existing
4. Valores Previos Excel — existing (if not null)
5. Fecha Ejecucion DB — new (if not null)
6. Fecha Ejecucion Excel — new (if not null)
7. Error — existing (if not null)

### 3.9 Schema DDL Update

Update `db/schema.sql` to include the new column in the CREATE TABLE statement (for fresh database creation):

```sql
CREATE TABLE transacciones_json (
    ...
    clave_primaria_excel TEXT,  -- JSON: Excel-specific PK for row matching
    ...
);
```

## 4. Edge Cases and Error Handling

### 4.1 Backward Compatibility
- Existing transactions have `clave_primaria_excel = NULL`
- The Excel writer falls back to `clave_primaria` when `clave_primaria_excel` is null
- No migration of existing data is needed (old transactions may fail Excel write-back if their pk_data doesn't match Excel pk_fields, but this is the current behavior)

### 4.2 Entity Not in EXCEL_MAPPING
- `resolve_excel_primary_key()` returns `None`
- `clave_primaria_excel` remains null
- Excel writer already handles unconfigured entities (marks as ERROR)

### 4.3 DB Record Not Found During Resolution
- For UPDATE/DELETE, if the DB record can't be found by `clave_primaria`, log a warning and set `clave_primaria_excel = None`
- The transaction is still created (it may fail during processing, but that's independent)

### 4.4 Missing pk_fields Values
- If the DB record doesn't have a value for one of the Excel pk_fields (e.g., `etiqueta` is null), include it as null in the JSON
- The Excel writer will attempt matching with null, which may fail — this is correct behavior (can't match an incomplete key)

### 4.5 hechos INSERT Reconciliation
- The `insert_pk_reconcile` logic in `_apply_excel_insert` currently updates `txn.clave_primaria`
- Must also update `txn.clave_primaria_excel` with the reconciled id_hecho value

## 5. Files to Modify

### Backend
| File | Change |
|------|--------|
| `db/schema.sql` | Add `clave_primaria_excel TEXT` column to CREATE TABLE |
| `backend/app/models.py` | Add `clave_primaria_excel` column to TransaccionJson model |
| `backend/app/schemas.py` | Add `clave_primaria_excel` to TransaccionJsonCreate schema |
| `backend/app/services/excel_mapping.py` | Update pk_fields for 8 entities with composite keys |
| `backend/app/services/excel_pk_resolver.py` | **NEW** — Excel PK resolution service |
| `backend/app/services/excel_writer.py` | Use clave_primaria_excel for pk_data; update hechos reconciliation |
| `backend/app/routers/transacciones_json.py` | Call resolve_excel_primary_key at creation time |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx` | Add fecha_ejecucion_db, fecha_ejecucion_excel, clave_primaria_excel to display |

### Database
| File | Change |
|------|--------|
| `db/schema.sql` | Add column to DDL |
| `db/portfolio.db` | ALTER TABLE at runtime (migration) |

## 6. Testing Strategy

1. **Unit test: Excel PK resolution** — Verify resolve_excel_primary_key returns correct values for INSERT/UPDATE/DELETE across entity types
2. **Integration test: Transaction creation** — Create a transaction via API, verify clave_primaria_excel is auto-populated
3. **End-to-end: Excel write-back** — Create transaction → process DB → process Excel → verify correct row matched
4. **Backward compat**: Process an existing transaction (null clave_primaria_excel) → verify fallback to clave_primaria
5. **PK change scenario**: UPDATE that changes an Excel PK field → verify old values used for finding, new values written
6. **Frontend verification**: Open Detail page → expand a transaction → verify all fields displayed
