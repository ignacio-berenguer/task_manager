# Implementation Plan — feature_002

## Customize Tareas Migration: Notas Parsing into Acciones + Parametric Responsables

---

### Phase 1: Schema Changes

**Files modified:**
- `db/schema.sql`

**Steps:**
1. Add `notas_anteriores TEXT` column to `tareas` table definition
2. Add `fecha_accion TEXT` column to `acciones_realizadas` table definition
3. Add `CREATE TABLE IF NOT EXISTS responsables` with fields: `id`, `valor` (UNIQUE), `orden`
4. Add index on `acciones_realizadas.fecha_accion`

**Verification:** Review schema.sql for syntax correctness.

---

### Phase 2: Migration Engine — Notas Parsing

**Files modified:**
- `management/src/migrate/engine.py`

**Steps:**

#### 2.1 Update TAREAS_COLUMN_MAP
- Add `"fecha_nba": "fecha_siguiente_accion"` mapping (Excel "Fecha NBA" → DB "fecha_siguiente_accion")
- Add `"notas": "notas_anteriores"` mapping (raw Notas preserved)
- Keep existing mappings for tarea_id, tarea, responsable, descripcion, tema, estado

#### 2.2 Add Notas parsing function
- Create `parse_notas(notas_text: str) -> list[dict]` function in engine.py
  - Splits by newline
  - For each line:
    - Check NBA prefix → estado="PENDIENTE", fecha=today+7
    - Check date prefix (DD/MM/YYYY or DD/MM) → estado="COMPLETADO", fecha=parsed
    - Track last_year for DD/MM short format (default 2025)
  - Normalize accion text: strip leading whitespace/punctuation, capitalize first letter
  - Return list of `{"accion": str, "fecha_accion": str, "estado": str}` dicts

#### 2.3 Add `normalize_accion_text()` helper
- Strip leading `[\s.,;:\-!?]+`
- Strip trailing whitespace
- Capitalize first letter
- Return None if empty after cleaning

#### 2.4 Create `migrate_acciones_from_notas()` method
- Query all tareas from DB: `SELECT tarea_id, notas_anteriores FROM tareas WHERE notas_anteriores IS NOT NULL`
- For each tarea, call `parse_notas(notas_anteriores)`
- Batch-insert results into `acciones_realizadas` (tarea_id, accion, fecha_accion, estado)
- Log summary: total, COMPLETADO count, PENDIENTE count, errors

#### 2.5 Create `migrate_responsables()` method
- Query `SELECT DISTINCT responsable FROM tareas WHERE responsable IS NOT NULL`
- Insert each into `responsables` table with sequential `orden`
- Use INSERT OR IGNORE to handle duplicates

#### 2.6 Update `migrate_all()`
- Replace `self.migrate_acciones()` with `self.migrate_acciones_from_notas()` + `self.migrate_responsables()`
- Keep `self.migrate_tareas()` as first step

#### 2.7 Handle auto-generation of tarea_id
- If `tarea_id` column not found in Excel, auto-generate as `TAREA_001`, `TAREA_002`, etc.
- Log warning about auto-generation

**Verification:** Run `uv run python manage.py complete_process` and check:
- tareas have notas_anteriores populated
- acciones_realizadas have fecha_accion and correct estado values
- responsables table is seeded
- Logs show correct counts

---

### Phase 3: Backend Model & Schema Updates

**Files modified:**
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/crud.py`

**Steps:**

#### 3.1 Update Tarea model
- Add `notas_anteriores = Column(Text, nullable=True)` to Tarea class

#### 3.2 Update AccionRealizada model
- Add `fecha_accion = Column(Text, nullable=True)` to AccionRealizada class

#### 3.3 Add Responsable model
- Create `Responsable` class with id, valor, orden
- Table name: "responsables"

#### 3.4 Update Pydantic schemas
- `TareaCreate`: add `notas_anteriores: Optional[str] = None`
- `TareaUpdate`: add `notas_anteriores: Optional[str] = None`
- `AccionCreate`: add `fecha_accion: Optional[str] = None`
- `AccionUpdate`: add `fecha_accion: Optional[str] = None`
- Add `ResponsableCreate(BaseModel)`: valor (required), orden (default 0)
- Add `ResponsableUpdate(BaseModel)`: valor (optional), orden (optional)

#### 3.5 Update CRUD instances
- Add `crud_responsables = CRUDBase(Responsable)`

**Verification:** Backend starts without errors. Swagger UI shows updated schemas.

---

### Phase 4: Backend Router — Responsables

**Files created:**
- `backend/app/routers/responsables.py`

**Files modified:**
- `backend/app/main.py`

**Steps:**

#### 4.1 Create responsables router
- Follow same pattern as `estados.py` router
- Endpoints:
  - `GET /` — List all ordered by `orden`
  - `POST /` — Create (409 if duplicate valor)
  - `PUT /{id}` — Update (404 if not found)
  - `DELETE /{id}` — Delete (404 if not found)

#### 4.2 Register in main.py
- Import responsables router
- Add `app.include_router(responsables.router, prefix=f"{settings.API_PREFIX}/responsables")`

**Verification:** `GET /api/v1/responsables` returns seeded data. CRUD operations work via Swagger.

---

### Phase 5: Frontend — Display Changes

**Files modified:**
- `frontend/src/features/detail/components/sections/AccionesSection.jsx`
- `frontend/src/features/detail/DetailPage.jsx`

**Steps:**

#### 5.1 Update AccionesSection columns
- Add `fecha_accion` column to COLUMNS array:
  ```js
  { key: 'fecha_accion', label: 'Fecha', type: 'date' }
  ```
- Position it as the first column for chronological context

#### 5.2 Display notas_anteriores in Detail Page
- The `tareas` data is available via the tarea detail endpoint
- Add a read-only display of `notas_anteriores` in the tarea detail view
- Use a collapsible/accordion section with `<pre>` or `whitespace-pre-wrap` styling
- Label: "Notas Anteriores (Original)"

#### 5.3 Add responsable parametric field support
- Ensure the `useParametricOptions` hook (or equivalent) can fetch from `/responsables`
- Add `{ parametric: 'responsable' }` to tarea form field definitions where responsable is used

**Verification:** Tarea detail shows notas_anteriores. AccionesSection shows fecha_accion column. Responsable dropdown populates from API.

---

### Phase 6: Version & Documentation

**Files modified:**
- `frontend/src/lib/version.js`
- `frontend/src/lib/changelog.js`
- `README.md`
- `specs/architecture/architecture_backend.md`

**Steps:**

#### 6.1 Update version
- Set `APP_VERSION.minor` to `71` in version.js

#### 6.2 Add changelog entry
- Add entry at TOP of CHANGELOG array:
  ```js
  { version: '0.071', feature: 71, title: 'Tareas Migration: Notas → Acciones', summary: 'Customized tareas migration to parse Notas into individual acciones with dates and estados. Added parametric responsables table.' }
  ```

#### 6.3 Update README.md
- Document the new migration behavior (Notas parsing)
- Document the responsables parametric table
- Note the notas_anteriores field

#### 6.4 Update architecture docs
- Add responsables router to backend architecture
- Document Notas parsing in management architecture

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
