# Technical Specifications — feature_002

## Customize Tareas Migration: Notas Parsing into Acciones + Parametric Responsables

### 1. Overview

This feature customizes the Excel-to-SQLite migration for tareas to:
- Map the actual Excel columns (Tarea, Responsable, Notas, Fecha NBA, Estado) to the `tareas` DB fields
- Parse multi-line `Notas` into individual `acciones_realizadas` records with date and estado
- Detect "NBA:" prefix lines as future pending actions
- Preserve the original Notas text in a new `notas_anteriores` field on `tareas`
- Create a parametric `responsables` table for dropdowns and filters
- Remove the dedicated Acciones Excel sheet reader (acciones come exclusively from Notas parsing)

---

### 2. Schema Changes

#### 2.1 Add `notas_anteriores` to `tareas`

```sql
-- Added to tareas table definition in schema.sql
notas_anteriores TEXT,
```

The `fecha_siguiente_accion` field already exists and will be mapped from the "Fecha NBA" Excel column. No additional column needed for that.

#### 2.2 Add `fecha_accion` to `acciones_realizadas`

```sql
-- Added to acciones_realizadas table definition in schema.sql
fecha_accion TEXT,  -- ISO 8601 date (YYYY-MM-DD)
```

Stores the date parsed from each Notas line (e.g., "15/01/2025: Did something" → fecha_accion = "2025-01-15").

#### 2.3 Create `responsables` parametric table

```sql
CREATE TABLE IF NOT EXISTS responsables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor TEXT NOT NULL UNIQUE,
    orden INTEGER DEFAULT 0
);
```

Seeded during migration with unique Responsable values extracted from the Excel.

#### 2.4 Updated `schema.sql`

All changes above reflected directly in `db/schema.sql` table definitions (not ALTER TABLE — the schema is recreated from scratch via `init` / `recreate_tables`).

---

### 3. Excel Column Mapping

#### 3.1 Current Excel Columns → DB Fields

| Excel Column (raw) | Normalized name | DB field | Notes |
|---|---|---|---|
| Tarea ID | tarea_id | tarea_id | Primary key (if present) |
| Tarea | tarea | tarea | Task description |
| Responsable | responsable | responsable | Person responsible |
| Notas | notas | (parsed) → `acciones_realizadas` + `notas_anteriores` | Multi-line text |
| Fecha NBA | fecha_nba | fecha_siguiente_accion | Next best action date |
| Estado | estado | estado | Task status |
| Tema | tema | tema | Topic/theme (if present) |
| Descripcion | descripcion | descripcion | Description (if present) |

#### 3.2 Updated TAREAS_COLUMN_MAP

```python
TAREAS_COLUMN_MAP = {
    "tarea_id": "tarea_id",
    "tarea": "tarea",
    "responsable": "responsable",
    "descripcion": "descripcion",
    "fecha_nba": "fecha_siguiente_accion",   # Changed: Excel "Fecha NBA" → "fecha_nba" after normalization
    "tema": "tema",
    "estado": "estado",
    "notas": "notas_anteriores",             # New: raw notas preserved in notas_anteriores
}
```

Key changes:
- `"fecha_nba"` maps to `"fecha_siguiente_accion"` (Excel "Fecha NBA" normalizes to "fecha_nba")
- `"notas"` maps to `"notas_anteriores"` (raw text preserved)

#### 3.3 Auto-generate tarea_id

If the Excel does not contain a `tarea_id` column, auto-generate it as `TAREA_001`, `TAREA_002`, etc. (zero-padded, sequential). Log a warning.

---

### 4. Notas Parsing Logic

#### 4.1 Algorithm

For each tarea row, after storing `notas_anteriores`, parse the `Notas` field line-by-line:

```
Input: multi-line text from Excel "Notas" column
Output: list of (accion_text, fecha_accion, estado) tuples
```

**Steps:**
1. Split text by newlines (`\n`)
2. Skip empty/whitespace-only lines
3. Track `last_year` (initialized to `2025`)
4. For each line:
   - **NBA detection**: If line starts with `NBA:` (case-insensitive):
     - Extract text after "NBA:"
     - Set `fecha_accion = today + 7 days`
     - Set `estado = "PENDIENTE"`
   - **Date-prefixed line**: If line matches `DD/MM/YYYY` or `DD/MM` at start:
     - Parse date, using `last_year` for DD/MM format
     - Update `last_year` from the parsed year (for DD/MM/YYYY)
     - Extract text after the date (skip ":" or " " separator)
     - Set `estado = "COMPLETADO"`
   - **Other lines**: Lines that don't match either pattern are skipped (logged as warnings)
5. **Text normalization** on the extracted text:
   - Strip leading whitespace and punctuation marks (`.,;:-!?`)
   - Capitalize first letter
   - Skip empty results after trimming

#### 4.2 Date Parsing Regex

```python
import re

DATE_FULL_RE = re.compile(r'^(\d{1,2})/(\d{1,2})/(\d{4})')    # DD/MM/YYYY
DATE_SHORT_RE = re.compile(r'^(\d{1,2})/(\d{1,2})(?![/\d])')   # DD/MM (not followed by more digits)
NBA_RE = re.compile(r'^NBA\s*:', re.IGNORECASE)                  # NBA: prefix
```

#### 4.3 Text Normalization

```python
def normalize_accion_text(text: str) -> str | None:
    """Strip leading spaces/punctuation, capitalize first letter."""
    # Strip leading whitespace + punctuation
    cleaned = re.sub(r'^[\s.,;:\-!?]+', '', text)
    # Strip trailing whitespace
    cleaned = cleaned.rstrip()
    if not cleaned:
        return None
    # Capitalize first letter (preserve rest)
    return cleaned[0].upper() + cleaned[1:]
```

#### 4.4 Example

```
Input Notas:
15/01/2025: Reunión con equipo de desarrollo
20/01 Revisión de documentación
NBA: Preparar presentación para comité

Output acciones:
1. accion="Reunión con equipo de desarrollo", fecha_accion="2025-01-15", estado="COMPLETADO"
2. accion="Revisión de documentación", fecha_accion="2025-01-20", estado="COMPLETADO"
3. accion="Preparar presentación para comité", fecha_accion="2025-02-27", estado="PENDIENTE"
```

---

### 5. Migration Engine Changes

#### 5.1 `migrate_all()` flow

```
1. migrate_tareas()                — reads Excel, maps columns, inserts tareas (including notas_anteriores)
2. migrate_acciones_from_notas()   — parses notas_anteriores from DB, inserts acciones_realizadas
3. migrate_responsables()          — extracts unique responsables, seeds parametric table
```

The existing `migrate_acciones()` (which reads a dedicated Acciones sheet) is **removed**.

#### 5.2 `migrate_acciones_from_notas()`

New method that:
1. Queries all tareas from DB: `SELECT tarea_id, notas_anteriores FROM tareas WHERE notas_anteriores IS NOT NULL`
2. For each tarea with non-null notas_anteriores:
   - Parse lines using the algorithm from Section 4
   - Insert each parsed accion into `acciones_realizadas` (tarea_id, accion, fecha_accion, estado)
3. Batch-commit with `BATCH_COMMIT_SIZE`
4. Log summary: total acciones created, COMPLETADO count, PENDIENTE count, errors

#### 5.3 `migrate_responsables()`

New method that:
1. Queries `SELECT DISTINCT responsable FROM tareas WHERE responsable IS NOT NULL AND responsable != ''`
2. Inserts each into `responsables` table with sequential `orden`
3. Uses INSERT OR IGNORE to handle duplicates
4. Logs count of unique responsables seeded

---

### 6. Backend Changes

#### 6.1 Models (`backend/app/models.py`)

**Tarea model** — add field:
```python
notas_anteriores = Column(Text, nullable=True)
```

**AccionRealizada model** — add field:
```python
fecha_accion = Column(Text, nullable=True)  # ISO 8601 date
```

**New Responsable model**:
```python
class Responsable(Base):
    __tablename__ = "responsables"
    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)
```

#### 6.2 Schemas (`backend/app/schemas.py`)

**TareaCreate/TareaUpdate** — add:
```python
notas_anteriores: Optional[str] = None
```

**AccionCreate/AccionUpdate** — add:
```python
fecha_accion: Optional[str] = None
```

**New ResponsableCreate/ResponsableUpdate**:
```python
class ResponsableCreate(BaseModel):
    valor: str
    orden: int = 0

class ResponsableUpdate(BaseModel):
    valor: Optional[str] = None
    orden: Optional[int] = None
```

#### 6.3 CRUD (`backend/app/crud.py`)

Add:
```python
crud_responsables = CRUDBase(Responsable)
```

#### 6.4 Router — `backend/app/routers/responsables.py`

New router with prefix `/responsables`, tags `["responsables"]`:
- `GET /` — List all responsables ordered by `orden`
- `POST /` — Create new responsable (409 if duplicate)
- `PUT /{id}` — Update (404 if not found)
- `DELETE /{id}` — Delete (404 if not found)

Follow the same pattern as `estados.py`.

#### 6.5 Register in `main.py`

```python
from app.routers import responsables
app.include_router(responsables.router, prefix=f"{settings.API_PREFIX}/responsables")
```

#### 6.6 Acciones router — no route changes needed

The `GET /tarea/{tarea_id}` endpoint already returns all acciones for a tarea. The new `fecha_accion` field is automatically included via `model_to_dict()` since it reads all columns. Same for CRUD operations.

---

### 7. Frontend Changes

#### 7.1 Display `notas_anteriores` in Detail Page

The Detail Page (`frontend/src/features/detail/DetailPage.jsx`) currently shows:
1. Header (tarea_id, estado badge, tarea title, edit button)
2. "Datos de la Tarea" card — 9 fields in a 2-column grid
3. "Acciones Realizadas" card — table of acciones with edit/delete

**Changes:**
- Add `notas_anteriores` to `FIELD_LABELS` and `DISPLAY_FIELDS` in DetailPage.jsx
- Display it with `whitespace-pre-wrap` styling since it's multi-line text
- Alternatively, add a dedicated "Notas Anteriores" card between the Datos card and Acciones card, with read-only `<pre>`-style rendering for better readability of multi-line content

#### 7.2 Acciones table — show `fecha_accion`

Update the acciones `<table>` in DetailPage.jsx to add a "Fecha" column:
- Add `<th>` for "Fecha" in the table header
- Add `<td>` showing `acc.fecha_accion` (formatted as DD/MM/YYYY) in each row
- Position as the first column for chronological context

#### 7.3 Responsable dropdown in Edit Tarea form

Currently the "Responsable" field in the Edit Tarea dialog is a plain `<Input>` text field. Change it to a `<select>` dropdown that:
- Fetches values from `GET /api/v1/responsables`
- Shows all parametric values as `<option>` elements
- Includes an empty option for clearing the value
- Falls back gracefully if the API call fails (show text input)

#### 7.4 Responsable filter in Search Page

The Search Page (`frontend/src/features/search/SearchPage.jsx`) already has a "Responsable" dropdown filter populated from `/tareas/filter-options`. No change needed here — the existing filter-options endpoint returns distinct responsable values from the tareas table.

#### 7.5 Version & Changelog

- Set `APP_VERSION` to `{ major: 1, minor: 2 }` in `frontend/src/lib/version.js`
- Add changelog entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`:
  ```js
  {
    version: "1.002",
    feature: 2,
    title: "Migración Tareas: Notas → Acciones",
    summary: "Migración personalizada de tareas: parseo de Notas en acciones individuales con fechas y estados, tabla paramétrica de responsables, y campo notas_anteriores."
  }
  ```

---

### 8. Configuration

No new `.env` variables needed. The existing configuration covers:
- `EXCEL_SOURCE_FILE` — Excel file name (default: `tareas.xlsx`)
- `EXCEL_SHEET_TAREAS` — Sheet name for tareas (default: `Tareas`)
- `BATCH_COMMIT_SIZE` — Batch insert size (default: `100`)

The `EXCEL_SHEET_ACCIONES` setting becomes unused (but kept for backward compatibility — the `migrate_acciones()` method that used it is removed).

---

### 9. Logging

All operations logged via existing `task_manager_migration` logger:

| Level | Messages |
|---|---|
| INFO | Migration start/end, row counts, accion counts by estado, responsables count |
| WARNING | Lines that can't be parsed (no date, no NBA prefix), missing columns |
| DEBUG | Individual line parsing details, date conversions |
| ERROR | Insert failures, Excel read failures |

---

### 10. Error Handling

- Invalid date in Notas line → log warning, skip line, continue
- Empty Notas → no acciones created, not an error
- Missing tarea_id column → auto-generate with warning
- Duplicate responsable → INSERT OR IGNORE
- Foreign key violation (accion for non-existent tarea) → log error, skip
