# Feature 019: JSON Transaction Diff System

## Overview

This feature introduces the infrastructure for modifying data entities through a JSON-based transaction diff system. Changes are captured as JSON diffs, stored in a `transacciones_json` table, and processed by a backend service that applies them to the database. An Excel processor is planned for a future feature.

## Architecture

### Data Flow

```
User Action → JSON Diff Created → Stored in transacciones_json (PENDIENTE)
                                        ↓
                              Process Endpoint Triggered
                                        ↓
                              Apply to Database (INSERT/UPDATE/DELETE)
                                        ↓
                              Update estado_db → EJECUTADO | ERROR
```

### JSON Diff Format

Each transaction record contains:

- **entidad**: Target table name (e.g., `"hechos"`, `"acciones"`)
- **tipo_operacion**: `INSERT` | `UPDATE` | `DELETE`
- **clave_primaria**: JSON string identifying the record
  - Single PK: `{"id_hecho": 1}` or `{"portfolio_id": "P001"}`
  - Compound PK: `{"portfolio_id": "P001", "etiqueta": "Tag1"}`
- **cambios**: JSON string with field changes
  - INSERT: full record (all fields)
  - UPDATE: only changed fields
  - DELETE: null/empty
- **mensaje_commit**: User explanation of the change

### Example Transactions

**UPDATE a hecho:**
```json
{
  "entidad": "hechos",
  "tipo_operacion": "UPDATE",
  "clave_primaria": "{\"id_hecho\": 1234}",
  "cambios": "{\"notas\": \"Updated note\", \"estado\": \"Cerrado\"}",
  "usuario": "nacho",
  "mensaje_commit": "Closing hecho after resolution"
}
```

**INSERT a new nota:**
```json
{
  "entidad": "notas",
  "tipo_operacion": "INSERT",
  "clave_primaria": "{\"portfolio_id\": \"P001\"}",
  "cambios": "{\"portfolio_id\": \"P001\", \"nota\": \"New note text\", \"tipo\": \"General\"}",
  "usuario": "nacho",
  "mensaje_commit": "Adding project status note"
}
```

**DELETE a dependencia:**
```json
{
  "entidad": "dependencias",
  "tipo_operacion": "DELETE",
  "clave_primaria": "{\"id\": 42}",
  "cambios": null,
  "usuario": "nacho",
  "mensaje_commit": "Removing obsolete dependency"
}
```

## Database Schema

### transacciones_json Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK AUTOINCREMENT | Auto-generated ID |
| entidad | TEXT | NOT NULL | Target table name |
| tipo_operacion | TEXT | NOT NULL, CHECK | INSERT / UPDATE / DELETE |
| clave_primaria | TEXT | NOT NULL | JSON: primary key fields |
| cambios | TEXT | | JSON: changed fields |
| usuario | TEXT | | Who requested the change |
| mensaje_commit | TEXT | | Explanation of the change |
| estado_db | TEXT | NOT NULL, DEFAULT 'PENDIENTE' | PENDIENTE / EJECUTADO / ERROR |
| estado_excel | TEXT | NOT NULL, DEFAULT 'PENDIENTE' | PENDIENTE / EJECUTADO / ERROR / NO_APLICA |
| fecha_creacion | DATETIME | DEFAULT CURRENT_TIMESTAMP | When created |
| fecha_ejecucion_db | DATETIME | | When applied to DB |
| fecha_ejecucion_excel | DATETIME | | When applied to Excel (future) |
| error_detalle | TEXT | | Error message if failed |

### Indexes

- `idx_tj_estado_db` on `estado_db` — for processor queries
- `idx_tj_entidad` on `entidad` — for report filtering
- `idx_tj_fecha` on `fecha_creacion` — for report ordering

### Table Preservation

The `transacciones_json` table is **preserved** during `recreate_tables`. Unlike other tables that are dropped and recreated from Excel data, transaction diffs represent user-initiated changes that must survive pipeline reruns. The `recreate_tables` function backs up and restores this table's data.

## API Endpoints

### CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transacciones-json/` | List paginated |
| GET | `/api/v1/transacciones-json/{id}` | Get by ID |
| POST | `/api/v1/transacciones-json/` | Create new transaction |
| DELETE | `/api/v1/transacciones-json/{id}` | Delete transaction |

### Report

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transacciones-json/report-filter-options` | Distinct filter values |
| POST | `/api/v1/transacciones-json/search-report` | Filtered search |

### Processor

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/transacciones-json/process` | Process all PENDIENTE transactions |

**Process Response:**
```json
{
  "processed": 5,
  "success": 4,
  "errors": 1,
  "details": [
    {"id": 1, "status": "EJECUTADO", "entidad": "hechos"},
    {"id": 2, "status": "ERROR", "entidad": "notas", "error": "Record not found"}
  ]
}
```

### Report Filter Options

```json
{
  "entidad": ["acciones", "hechos", "notas"],
  "tipo_operacion": ["INSERT", "UPDATE", "DELETE"],
  "estado_db": ["PENDIENTE", "EJECUTADO", "ERROR"],
  "estado_excel": ["PENDIENTE", "NO_APLICA"],
  "usuario": ["nacho", "admin"]
}
```

### Report Search Request

```json
{
  "entidad": ["hechos"],
  "tipo_operacion": [],
  "estado_db": ["PENDIENTE"],
  "estado_excel": [],
  "usuario": null,
  "fecha_creacion_inicio": "2026-01-01",
  "fecha_creacion_fin": null,
  "order_by": "fecha_creacion",
  "order_dir": "desc",
  "limit": 50,
  "offset": 0
}
```

## Frontend Report

### Route

`/informes/transacciones-json` — accessible from Navbar Informes dropdown

### Columns

**Default visible (10):** id, entidad, tipo_operacion, clave_primaria, cambios, usuario, mensaje_commit, estado_db, estado_excel, fecha_creacion

**Additional (3):** fecha_ejecucion_db, fecha_ejecucion_excel, error_detalle

### Filters

| Filter | Type | Options Source |
|--------|------|---------------|
| Entidad | multiselect | filter-options API |
| Tipo Operacion | multiselect | filter-options API |
| Estado DB | multiselect | filter-options API |
| Estado Excel | multiselect | filter-options API |
| Usuario | text input | free text |
| Fecha Creacion (desde) | date | date picker |
| Fecha Creacion (hasta) | date | date picker |

### Default Sort

`fecha_creacion` descending (most recent first)

## Processor Service

### Behavior

1. Queries all records with `estado_db = 'PENDIENTE'` ordered by `id` (FIFO)
2. For each transaction:
   - Resolves `entidad` → SQLAlchemy model via TABLE_MODELS registry
   - Parses `clave_primaria` JSON to identify target record
   - Parses `cambios` JSON for field changes
   - Applies operation via existing CRUDBase methods
   - Updates `estado_db` and `fecha_ejecucion_db`
   - On error: sets `estado_db = 'ERROR'`, stores error in `error_detalle`
3. Each transaction is committed independently (one failure doesn't rollback others)

### Error Handling

- Unknown entity → ERROR with "Unknown entity: {name}"
- Record not found (UPDATE/DELETE) → ERROR with "Record not found in {entity}"
- Invalid JSON → ERROR with parse error message
- Empty cambios on UPDATE → ERROR with "UPDATE requires non-empty cambios"
- Database constraint violation → ERROR with constraint message

## Logging

All operations logged to `logs/portfolio_backend.log`:
- INFO: processor start/end, each transaction applied, summary counts
- ERROR: each transaction failure with full error detail
- DEBUG: JSON parsing details, query construction

## Notas Modal Edit Form

### Overview

A modal dialog for creating, editing, and deleting Notas from the Detail Page. This is the first entity to use the transacciones_json infrastructure, serving as a proof-of-concept for future entity modals.

### Data Flow

```
User clicks "Add Nota" or "Edit" → Modal opens with form
  → User fills fields + commit message → Submit
  → POST /api/v1/transacciones-json/ (creates PENDIENTE record)
  → POST /api/v1/transacciones-json/process (applies immediately)
  → Refetch portfolio detail data → UI updates
```

### UI Components

**New dependency:** `@radix-ui/react-dialog` (for accessible modal implementation)

**New UI component:** `frontend/src/components/ui/dialog.jsx` — shadcn/ui-style Dialog built on Radix

**Modal component:** `frontend/src/features/detail/components/NotaFormModal.jsx`

### Modal Layout

```
┌─────────────────────────────────────────────┐
│  ✕  Añadir Nota  /  Editar Nota             │
├─────────────────────────────────────────────┤
│                                             │
│  Fecha          [____/____/________]        │
│                                             │
│  Registrado por [__________________]        │
│                                             │
│  Nota                                       │
│  [                                   ]      │
│  [          textarea (4 rows)        ]      │
│  [                                   ]      │
│                                             │
│  ─────────────────────────────────────      │
│  Mensaje de commit *                        │
│  [__________________________________]       │
│                                             │
├─────────────────────────────────────────────┤
│  [Eliminar]              [Cancelar] [Guardar]│
│  (only in edit mode)                         │
└─────────────────────────────────────────────┘
```

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fecha | date input | No | Defaults to today (YYYY-MM-DD) |
| registrado_por | text input | No | Free text |
| nota | textarea (4 rows) | No | The note content |
| mensaje_commit | text input | Yes | Separator line above, explains the change |

### Behavior

**Create mode** (triggered by "Add Nota" button):
- Title: "Añadir Nota"
- All fields empty except fecha (defaults to today)
- portfolio_id auto-filled from current detail page context
- On submit: creates INSERT transaction, processes it, refetches data
- Delete button hidden

**Edit mode** (triggered by edit icon on existing nota card):
- Title: "Editar Nota"
- Fields pre-populated from existing nota data
- On submit: creates UPDATE transaction with only changed fields, processes, refetches
- Delete button visible (red, left-aligned)
- Delete triggers confirmation: "¿Está seguro de que desea eliminar esta nota?"

**Validation:**
- mensaje_commit is required (button disabled until filled)
- At least one field must differ from original for UPDATE

### Integration Points

**NotasSection.jsx** — modified to add:
- "Add Nota" button in section header (next to accordion trigger)
- Edit icon button on each nota card
- Both open NotaFormModal with appropriate mode

**DetailPage.jsx** — modified to:
- Pass `portfolio_id` and a refetch callback to NotasSection

### Transaction Examples

**Create nota:**
```json
{
  "entidad": "notas",
  "tipo_operacion": "INSERT",
  "clave_primaria": "{\"portfolio_id\": \"P001\"}",
  "cambios": "{\"portfolio_id\": \"P001\", \"fecha\": \"2026-02-06\", \"registrado_por\": \"Nacho\", \"nota\": \"Updated project status\"}",
  "usuario": "user",
  "mensaje_commit": "Adding weekly status note"
}
```

**Edit nota:**
```json
{
  "entidad": "notas",
  "tipo_operacion": "UPDATE",
  "clave_primaria": "{\"id\": 42}",
  "cambios": "{\"nota\": \"Corrected note text\"}",
  "usuario": "user",
  "mensaje_commit": "Fixing typo in note"
}
```

**Delete nota:**
```json
{
  "entidad": "notas",
  "tipo_operacion": "DELETE",
  "clave_primaria": "{\"id\": 42}",
  "cambios": null,
  "usuario": "user",
  "mensaje_commit": "Removing duplicate note"
}
```

## Scope Boundaries

### In Scope (this feature)
- transacciones_json table (schema + model + CRUD)
- Transaction processor (DB execution only)
- Report page (frontend)
- Table preservation during recreate_tables
- Notas modal edit form (create/edit/delete via transacciones_json)
- Dialog UI component (reusable for future entity modals)

### Out of Scope (future features)
- Edit modal forms for other entities (will follow the Notas pattern)
- Excel processor (applying diffs to Excel files)
- Undo/rollback mechanism
- Batch transaction creation
- Authentication/authorization on process endpoint
