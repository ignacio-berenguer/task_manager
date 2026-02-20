# Feature 033 — Implementation Plan

## Phase 1: Database & Model Changes

### Step 1.1: Update schema.sql DDL
- **File**: `db/schema.sql`
- Add `clave_primaria_excel TEXT` column to the `transacciones_json` CREATE TABLE statement
- Place it after `clave_primaria` for logical grouping

### Step 1.2: Alter existing database
- **File**: `db/portfolio.db`
- Run `ALTER TABLE transacciones_json ADD COLUMN clave_primaria_excel TEXT;`
- This is a non-destructive change — existing rows get NULL

### Step 1.3: Update SQLAlchemy model
- **File**: `backend/app/models.py`
- Add `clave_primaria_excel = Column(Text, nullable=True)` to `TransaccionJson` class

### Step 1.4: Update Pydantic schema
- **File**: `backend/app/schemas.py`
- Add `clave_primaria_excel: str | None = None` to `TransaccionJsonCreate`

## Phase 2: Excel Mapping Enhancement

### Step 2.1: Update pk_fields for 1:N entities
- **File**: `backend/app/services/excel_mapping.py`
- Update composite keys for 8 entities:

```python
"notas":           pk_fields: ["portfolio_id", "fecha", "registrado_por"]
"etiquetas":       pk_fields: ["portfolio_id", "etiqueta"]
"acciones":        pk_fields: ["portfolio_id", "siguiente_accion"]
"justificaciones": pk_fields: ["portfolio_id", "tipo_justificacion"]
"descripciones":   pk_fields: ["portfolio_id", "tipo_descripcion"]
"ltp":             pk_fields: ["portfolio_id", "tarea"]
"wbes":            pk_fields: ["portfolio_id", "anio", "wbe_pyb"]
"dependencias":    pk_fields: ["portfolio_id", "descripcion_dependencia"]
```

- Leave unchanged: hechos, datos_descriptivos, informacion_economica, estado_especial, impacto_aatt, grupos_iniciativas

## Phase 3: Backend Excel PK Resolution

### Step 3.1: Create excel_pk_resolver.py
- **File**: `backend/app/services/excel_pk_resolver.py` (NEW)
- Implement `resolve_excel_primary_key(db, entidad, tipo_operacion, clave_primaria_json, cambios_json) -> dict | None`
- Logic:
  1. Look up entity in EXCEL_MAPPING → if not found, return None
  2. Get `pk_fields` from mapping
  3. For INSERT: parse `cambios_json`, extract pk_fields values
  4. For UPDATE/DELETE: parse `clave_primaria_json`, find DB record, extract pk_fields values from record
  5. Return dict with pk_field → value mapping
- Error handling: if DB record not found, log warning and return None
- Logging: log resolved Excel PK at INFO level

### Step 3.2: Integrate into transaction creation endpoint
- **File**: `backend/app/routers/transacciones_json.py`
- Import `resolve_excel_primary_key`
- In `create_transaccion_json()`: call resolver after `data.model_dump()`, set `clave_primaria_excel` on the object data before creating

## Phase 4: Excel Writer Update

### Step 4.1: Use clave_primaria_excel for pk_data
- **File**: `backend/app/services/excel_writer.py`
- In `_process_single_transaction()`: prefer `txn.clave_primaria_excel` over `txn.clave_primaria` for `pk_data`
- Fall back to `clave_primaria` when `clave_primaria_excel` is null (backward compatibility)

### Step 4.2: Update hechos reconciliation
- **File**: `backend/app/services/excel_writer.py`
- In `_apply_excel_insert()`: when reconciling id_hecho, also update `txn.clave_primaria_excel` with the new ID

## Phase 5: Frontend Display Enhancement

### Step 5.1: Update ExpandedDetail component
- **File**: `frontend/src/features/detail/components/sections/TransaccionesJsonSection.jsx`
- Add `clave_primaria_excel` display (formatted JSON, similar to clave_primaria)
- Add `fecha_ejecucion_db` display (formatted date)
- Add `fecha_ejecucion_excel` display (formatted date)
- Order: Clave Primaria → Clave Primaria Excel → Cambios → Valores Previos Excel → Fecha Ejecucion DB → Fecha Ejecucion Excel → Error

## Phase 6: Testing & Verification

### Step 6.1: Build verification
- Run `cd frontend && npm run build` to verify no build errors
- Run `cd backend && uv run python -c "from app.services.excel_pk_resolver import resolve_excel_primary_key; print('OK')"` to verify import

### Step 6.2: Manual testing
- Start backend (`uv run uvicorn app.main:app --reload`)
- Verify Swagger shows `clave_primaria_excel` in TransaccionJsonCreate schema
- Create a transaction via API → verify `clave_primaria_excel` is auto-populated
- Open Detail page → expand a transaction → verify new fields are displayed

## Phase 7: Documentation

### Step 7.1: Update architecture docs
- **File**: `specs/architecture/architecture_backend.md` — Document excel_pk_resolver service, updated EXCEL_MAPPING composite keys
- **File**: `specs/architecture/architecture_frontend.md` — Document updated TransaccionesJsonSection fields

### Step 7.2: Update README.md
- **File**: `README.md` — Add mention of Excel PK resolution in the transaction processing section (if applicable)

## Dependency Graph

```
Phase 1 (Schema/Model) ─┬─→ Phase 3 (Resolver) ──→ Phase 4 (Writer Update)
                         │
Phase 2 (Mapping) ───────┘
                                                      Phase 5 (Frontend)
```

Phases 1 and 2 are independent of each other.
Phase 3 depends on Phases 1 and 2.
Phase 4 depends on Phase 3.
Phase 5 is independent of backend phases.
Phase 6 depends on all previous phases.
Phase 7 depends on Phase 6.
