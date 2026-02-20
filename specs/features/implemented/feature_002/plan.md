# Implementation Plan — feature_002

## Customize Tareas Migration: Notas Parsing into Acciones + Parametric Responsables

---

### Phase 1: Schema Changes

**File modified:** `db/schema.sql`

**Steps:**
1. Add `notas_anteriores TEXT` column to the `tareas` table definition (after `estado`)
2. Add `fecha_accion TEXT` column to the `acciones_realizadas` table definition (after `estado`)
3. Add new `responsables` parametric table: `id` (PK), `valor` (TEXT UNIQUE), `orden` (INTEGER)
4. Add index: `CREATE INDEX IF NOT EXISTS idx_acciones_fecha_accion ON acciones_realizadas(fecha_accion)`

**Verification:** Review schema.sql for syntax correctness.

---

### Phase 2: Migration Engine — Notas Parsing

**File modified:** `management/src/migrate/engine.py`

**Steps:**

#### 2.1 Update TAREAS_COLUMN_MAP
- Change `"fecha_siguiente_accion": "fecha_siguiente_accion"` → `"fecha_nba": "fecha_siguiente_accion"`
- Add `"notas": "notas_anteriores"` mapping

#### 2.2 Add `normalize_accion_text()` helper function
- Strip leading whitespace and punctuation (`[\s.,;:\-!?]+`)
- Strip trailing whitespace
- Capitalize first letter, preserve rest
- Return None if empty after cleaning

#### 2.3 Add `parse_notas()` function
- Takes `notas_text: str` → returns `list[dict]` of `{accion, fecha_accion, estado}`
- Splits by newline, skips empty lines
- Tracks `last_year` (default 2025) for DD/MM short format
- For each line:
  - `NBA:` prefix → estado="PENDIENTE", fecha=today+7days
  - `DD/MM/YYYY` or `DD/MM` prefix → estado="COMPLETADO", fecha=parsed date
  - Other → skip with warning log
- Calls `normalize_accion_text()` on extracted text

#### 2.4 Create `migrate_acciones_from_notas()` method
- Query all tareas with non-null `notas_anteriores`
- For each, call `parse_notas()` and batch-insert into `acciones_realizadas`
- Log summary: total acciones, COMPLETADO count, PENDIENTE count, errors

#### 2.5 Create `migrate_responsables()` method
- Query `SELECT DISTINCT responsable FROM tareas WHERE responsable IS NOT NULL AND responsable != ''`
- INSERT OR IGNORE each into `responsables` with sequential `orden`
- Log count

#### 2.6 Update `migrate_tareas()` method
- Add normalization for `notas_anteriores` field (via `normalize_multiline_text`)
- Add normalization for `fecha_siguiente_accion` field (via `normalize_date`) — already present but verify mapping works with new column name

#### 2.7 Update `migrate_all()`
- Replace `self.migrate_acciones()` with:
  1. `self.migrate_acciones_from_notas()`
  2. `self.migrate_responsables()`

#### 2.8 Handle auto-generation of tarea_id
- If `tarea_id` column not found in Excel, auto-generate as `TAREA_001`, `TAREA_002`, etc.
- Log warning about auto-generation

**Verification:** Run `uv run python manage.py complete_process` and check:
- tareas have `notas_anteriores` populated
- `acciones_realizadas` have `fecha_accion` and correct `estado` values
- `responsables` table is seeded
- Logs show correct counts

---

### Phase 3: Backend Model & Schema Updates

**Files modified:**
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/crud.py`

**Steps:**

#### 3.1 Update Tarea model (`models.py`)
- Add `notas_anteriores = Column(Text, nullable=True)` after `estado`

#### 3.2 Update AccionRealizada model (`models.py`)
- Add `fecha_accion = Column(Text, nullable=True)` after `estado`

#### 3.3 Add Responsable model (`models.py`)
```python
class Responsable(Base):
    __tablename__ = "responsables"
    id = Column(Integer, primary_key=True, autoincrement=True)
    valor = Column(Text, nullable=False, unique=True)
    orden = Column(Integer, default=0)
```

#### 3.4 Update Pydantic schemas (`schemas.py`)
- `TareaCreate`: add `notas_anteriores: Optional[str] = None`
- `TareaUpdate`: add `notas_anteriores: Optional[str] = None`
- `AccionCreate`: add `fecha_accion: Optional[str] = None`
- `AccionUpdate`: add `fecha_accion: Optional[str] = None`
- Add `ResponsableCreate`: `valor` (required), `orden` (default 0)
- Add `ResponsableUpdate`: `valor` (optional), `orden` (optional)

#### 3.5 Update CRUD instances (`crud.py`)
- Add `crud_responsables = CRUDBase(Responsable)`

**Verification:** Backend starts without import errors.

---

### Phase 4: Backend Router — Responsables

**File created:** `backend/app/routers/responsables.py`
**File modified:** `backend/app/main.py`

**Steps:**

#### 4.1 Create responsables router
- Follow `estados.py` pattern
- Endpoints: `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`
- GET returns all responsables ordered by `orden`

#### 4.2 Register in main.py
- Import and include router with prefix `/responsables`

**Verification:** `GET /api/v1/responsables` returns seeded data after migration. CRUD operations work via Swagger.

---

### Phase 5: Frontend — Detail Page Changes

**File modified:** `frontend/src/features/detail/DetailPage.jsx`

**Steps:**

#### 5.1 Add `notas_anteriores` display
- Add a new Card section between "Datos de la Tarea" and "Acciones Realizadas"
- Title: "Notas Anteriores"
- Content: `tarea.notas_anteriores` rendered with `whitespace-pre-wrap` styling
- Only show if `notas_anteriores` is non-null/non-empty
- Read-only (no edit button)

#### 5.2 Add `fecha_accion` column to acciones table
- Add "Fecha" column header to the acciones table
- Display `acc.fecha_accion` formatted as DD/MM/YYYY in each row
- Position as first column (before "Accion")

#### 5.3 Responsable dropdown in Edit Tarea modal
- Fetch responsables from `GET /api/v1/responsables` on mount (or when dialog opens)
- Replace the Responsable `<Input>` with a `<select>` dropdown
- Options: empty option + responsable values from API
- If API fails, fall back to text input

#### 5.4 Responsable dropdown in Accion modal — add `fecha_accion` field
- Add a date `<Input type="date">` for `fecha_accion` in the Accion create/edit dialog
- Pre-populate when editing an existing accion

**Verification:** Detail page shows notas_anteriores card, acciones table has fecha column, responsable uses dropdown.

---

### Phase 6: Version & Documentation

**Files modified:**
- `frontend/src/lib/version.js`
- `frontend/src/lib/changelog.js`
- `README.md`
- `specs/architecture/architecture_backend.md` (if exists)

**Steps:**

#### 6.1 Update version
- Set `APP_VERSION` to `{ major: 1, minor: 2 }`

#### 6.2 Add changelog entry
- Add at TOP of CHANGELOG array:
  ```js
  { version: "1.002", feature: 2, title: "Migración Tareas: Notas → Acciones", summary: "..." }
  ```

#### 6.3 Update README.md
- Document the new migration behavior (Notas parsing into acciones)
- Document the `responsables` parametric table
- Note the `notas_anteriores` field on tareas

#### 6.4 Update architecture docs
- Add responsables router to backend architecture (if doc exists)
- Document Notas parsing in management architecture (if doc exists)

---

### Implementation Order & Dependencies

```
Phase 1 (Schema)
  ↓
Phase 2 (Migration Engine)
  ↓
Phase 3 (Backend Models/Schemas)
  ↓
Phase 4 (Backend Router)
  ↓
Phase 5 (Frontend)
  ↓
Phase 6 (Version & Docs)
```

Phases 3-4 can be done in parallel with Phase 2 testing. Phase 5 depends on Phases 3-4.

---

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Notas format varies across tareas | Robust regex + warning logs for unparseable lines |
| DD/MM year ambiguity | Default to 2025, inherit from previous line's year |
| Empty Notas field | Skip gracefully, no acciones created |
| Missing tarea_id in Excel | Auto-generate sequential IDs with warning |
| Large Notas text (many lines) | Batch insert respects BATCH_COMMIT_SIZE |
| Existing data in acciones_realizadas | `recreate_tables` clears all data; `complete_process` does recreate first |
