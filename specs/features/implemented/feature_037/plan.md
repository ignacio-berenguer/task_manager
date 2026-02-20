# Implementation Plan — feature_037: Parametric Tables

## Phase 1: Database Schema

**Goal:** Add the `parametros` table to the schema.

### Step 1.1: Update `db/schema.sql`
- Add the `parametros` table DDL before the `-- END OF SCHEMA` marker
- Include CREATE INDEX for `nombre_parametro`

**Files:** `db/schema.sql`

---

## Phase 2: Management Module — Migration

**Goal:** Populate parametros from actual data during migration.

### Step 2.1: Add `populate_parametros()` to `MigrationEngine`
- Define `PARAMETRIC_SOURCES` list mapping (parameter_name, source_table, source_column)
- Define `ESTADO_ORDER` list with the 21 canonical estado values and their sort positions
- Implement `populate_parametros()` method:
  1. DELETE FROM parametros (truncate)
  2. For each source (except estado): SELECT DISTINCT non-NULL, non-empty values → INSERT with `orden = NULL`
  3. For `estado`: INSERT all 21 canonical values with `orden = 1..21`, then INSERT any additional values from `hechos.estado` not in the canonical list with `orden = NULL`
  4. Special handling for `anio`: CAST integer to text
  5. Log per-parameter counts and total

### Step 2.2: Call `populate_parametros()` in `migrate_all()`
- Add Phase 9 after Phase 8 (Fichas)
- Include in results summary: `results['parametros'] = self.populate_parametros()`

**Files:** `management/src/migrate/engine.py`

---

## Phase 3: Backend — Model and API

**Goal:** Expose parametric values via a read-only API endpoint.

### Step 3.1: Add `Parametro` model to `models.py`
- Define SQLAlchemy model with columns: id, nombre_parametro, valor, orden, fecha_creacion

### Step 3.2: Create `routers/parametros.py`
- Single GET endpoint: `/parametros/{nombre_parametro}`
- Returns `{ "nombre_parametro": str, "valores": list[str] }`
- Sorted by: orden (if set), then alphabetically by valor
- Returns empty list if no values found (not 404)

### Step 3.3: Register router in `main.py`
- Import and include router with API_PREFIX

### Step 3.4: Export from `routers/__init__.py`
- Add parametros to the router imports/exports

**Files:** `backend/app/models.py`, `backend/app/routers/parametros.py`, `backend/app/routers/__init__.py`, `backend/app/main.py`

---

## Phase 4: Frontend — Hook and EntityFormModal

**Goal:** Fetch parametric values and render dropdowns in edit/create forms.

### Step 4.1: Create `useParametricOptions.js` hook
- New file in `frontend/src/features/detail/hooks/`
- Export `useParametricFields(fields)` — accepts field array, uses `useQueries` to fetch all parametric values in parallel
- Returns `{ optionsMap: { [fieldKey]: string[] }, isLoading: boolean }`

### Step 4.2: Update `EntityFormModal.jsx`
- Import and call `useParametricFields(fields)` at the top of the component
- In `renderField()`: if `optionsMap[field.key]` has values, render `<select>` with those options
- Priority: parametric options > hardcoded SELECT_OPTIONS > default input
- Add disabled placeholder option "Seleccionar..."
- Preserve current value even if not in options list (legacy data protection)

### Step 4.3: Update field definitions in `DetailPage.jsx`
Add `parametric` property to these fields:

- **DATOS_DESCRIPTIVOS_FIELDS:** unidad, origen, digital_framework_level_1, tipo_proyecto, prioridad_descriptiva_bi, priorizacion, referente_bi, it_partner, tipo_agrupacion (9 fields)
- **INFO_ECONOMICA_FIELDS:** capex_opex, cluster (2 fields)
- **IMPACTO_AATT_FIELDS:** unidad, referente_bi, it_partner (3 fields — only if this entity has edit forms; verify first)

### Step 4.4: Update field definitions in section components
Add `parametric` property in these section files:

- **HechosSection.jsx:** estado → `parametric: 'estado'`
- **GruposIniciativasSection.jsx:** tipo_agrupacion_grupo, tipo_agrupacion_componente → `parametric: 'tipo_agrupacion'`
- **WbesSection.jsx:** anio → `parametric: 'anio'`

### Step 4.5: Clean up hardcoded options
- Remove `capex_opex` from `SELECT_OPTIONS` in `entityFieldConfig.js`
- Keep the `getSelectOptions()` function for potential future hardcoded fields

**Files:**
- `frontend/src/features/detail/hooks/useParametricOptions.js` (new)
- `frontend/src/features/detail/components/EntityFormModal.jsx`
- `frontend/src/features/detail/DetailPage.jsx`
- `frontend/src/features/detail/components/sections/HechosSection.jsx`
- `frontend/src/features/detail/components/sections/GruposIniciativasSection.jsx`
- `frontend/src/features/detail/components/sections/WbesSection.jsx`
- `frontend/src/features/detail/config/entityFieldConfig.js`

---

## Phase 5: Testing

**Goal:** Verify end-to-end functionality.

### Step 5.1: Test migration
- Run `uv run python main.py full_calculation_datos_relevantes` from management/
- Verify parametros table is populated with correct values
- Verify log output shows Phase 9 with counts per parameter

### Step 5.2: Test backend endpoint
- Start backend: `uv run uvicorn app.main:app --reload --port 8000`
- Test: `GET /api/v1/parametros/cluster` → returns list of cluster values
- Test: `GET /api/v1/parametros/nonexistent` → returns empty list
- Check Swagger UI at /api/v1/docs

### Step 5.3: Test frontend
- Start frontend: `npm run dev`
- Navigate to a detail page
- Open edit modal for Datos Descriptivos → verify dropdown fields
- Open edit modal for Informacion Economica → verify capex_opex and cluster dropdowns
- Open create modal for Hechos → verify estado dropdown
- Verify build: `npm run build`

---

## Phase 6: Documentation

**Goal:** Update all documentation.

### Step 6.1: Update `README.md`
- Add parametros table to the database schema section (update table count to 26)
- Mention parametric endpoint

### Step 6.2: Update `specs/architecture/architecture_backend.md`
- Add parametros router documentation
- Add Parametro model to models list

### Step 6.3: Update `specs/architecture/architecture_frontend.md`
- Document parametric field pattern and useParametricFields hook
- Document how to add new parametric dropdowns

---

## Implementation Order

1. Phase 1 (Schema) — no dependencies
2. Phase 2 (Migration) — depends on Phase 1
3. Phase 3 (Backend) — depends on Phase 1
4. Phase 4 (Frontend) — depends on Phase 3
5. Phase 5 (Testing) — depends on Phases 2, 3, 4
6. Phase 6 (Documentation) — after all code changes

Phases 2 and 3 can be done in parallel after Phase 1.

## Estimated Scope

| Phase | New Files | Modified Files |
|-------|-----------|----------------|
| 1 | 0 | 1 |
| 2 | 0 | 1 |
| 3 | 1 | 3 |
| 4 | 1 | 6 |
| 5 | 0 | 0 |
| 6 | 0 | 3 |
| **Total** | **2** | **14** |
