# Feature 017: Implementation Plan

## Phase 1: `recreate_tables` Command (Requirement 1)

### Step 1.1: Add `recreate_tables()` function
- **File**: `management/src/init/db_init.py`
- Add `recreate_tables(db_path)` function:
  - Connect to existing DB (error if doesn't exist)
  - Query `sqlite_master` for all table names
  - Execute `DROP TABLE IF EXISTS` for each table
  - Read and execute `schema.sql`
  - Log each step to file and console
- Export from `management/src/init/__init__.py`

### Step 1.2: Add CLI command
- **File**: `management/main.py`
- Add `recreate_tables` to `choices` list
- Add handler block for the new command
- Update `full_calculation_datos_relevantes` to call `recreate_tables()` instead of `create_database(force_overwrite=True)`
- Update step numbering in log messages

### Step 1.3: Test
- Run `uv run python main.py recreate_tables` standalone
- Run `uv run python main.py full_calculation_datos_relevantes` end-to-end

---

## Phase 2: Rename `cluster_2025` to `cluster` (Requirement 3)

> Done before Requirement 2 because Req 2 removes columns; easier to rename first, then remove.

### Step 2.1: Database schema
- **File**: `db/schema.sql`
- Rename `cluster_2025` to `cluster` in: `iniciativas`, `datos_descriptivos`, `datos_relevantes`, `acciones`
- Rename indexes: `idx_iniciativas_cluster`, `idx_datos_relevantes_cluster`
- Note: `informacion_economica.cluster_2025` is removed in Phase 3 (it's a calculated field)

### Step 2.2: Migration engine
- **File**: `management/src/migrate/engine.py`
- Update INSERT column lists and data extraction where `cluster_2025` is referenced
- Tables affected: `iniciativas`, `datos_descriptivos`, `acciones`

### Step 2.3: Excel readers
- **File**: `management/src/migrate/excel_readers.py`
- Check if column normalization maps `Cluster 2025` -> `cluster_2025`. Update to map to `cluster` instead.

### Step 2.4: Calculate engine
- **Files**: `management/src/calculate/engine.py`, `lookup_functions.py`, `helper_functions.py`
- Update any `cluster_2025` references in lookup dictionaries and SQL queries

### Step 2.4b: Export process (special case)
- **File**: `management/src/export/excel_export.py`
- The export must keep using `cluster_2025` as the output column name (Excel compatibility)
- Map the DB column `cluster` back to `cluster_2025` during export

### Step 2.5: Backend models
- **File**: `backend/app/models.py`
- Rename `cluster_2025` Column to `cluster` in: `Iniciativa`, `DatosDescriptivo`, `DatosRelevante`, `Accion`

### Step 2.6: Backend schemas
- **File**: `backend/app/schemas.py`
- Rename `cluster_2025` to `cluster` in Pydantic schemas

### Step 2.7: Backend calculated_fields
- **File**: `backend/app/calculated_fields/definitions.py`
- Update `CALCULATED_FIELDS`: rename `cluster_2025` references to `cluster`
- Update `FIELD_CALCULATORS`: rename `cluster_2025` key to `cluster`, update source field

### Step 2.8: Backend routers
- **File**: `backend/app/routers/hechos.py` (report endpoints)
- Update `cluster_2025` references in filter options and search queries

### Step 2.9: Frontend
- **Files**: ~12 files across dashboard, search, reports, detail features
- Global find-and-replace `cluster_2025` -> `cluster` in frontend source

### Step 2.10: Test
- Run full pipeline to verify migration works
- Start backend, verify API responses use `cluster`
- Start frontend, verify all pages display correctly

---

## Phase 3: Remove Redundant Fields (Requirement 2)

### Step 3.1: Update database schema
- **File**: `db/schema.sql`
- Remove redundant columns from each table as specified in specs.md
- Remove associated CHECK constraints where applicable

### Step 3.2: Update migration engine
- **File**: `management/src/migrate/engine.py`
- For each `migrate_*` method, remove the redundant field extraction and INSERT column references
- Tables affected: informacion_economica, datos_ejecucion, hechos, beneficios, etiquetas, justificaciones, ltp, wbes, notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt, facturacion, datos_descriptivos, grupos_iniciativas
- Note: `acciones` keeps `siguiente_accion` and `siguiente_accion_comentarios` (not redundant per review)

### Step 3.3: Update backend models
- **File**: `backend/app/models.py`
- Remove Column definitions for all redundant fields across ~18 models

### Step 3.4: Fix portfolio router
- **File**: `backend/app/routers/portfolio.py`
- Replace `model_to_dict()` with `model_to_dict_with_calculated()` so calculated fields are populated in API responses
- Import `model_to_dict_with_calculated` from `crud.py`
- This ensures the API response is unchanged even though fields are no longer stored

### Step 3.5: Test
- Run full pipeline (recreate_tables -> migrate -> calculate -> export)
- Start backend, verify API responses still include all fields (now computed on-the-fly)
- Verify portfolio endpoint includes calculated fields
- Verify frontend detail page and search still work correctly

---

## Phase 4: `dependencias` Table (Requirement 5)

### Step 4.1: Discover Excel structure
- Inspect `PortfolioDigital_Master.xlsm` sheet "Dependencias" to discover columns
- This step must be done at implementation time by reading the Excel file

### Step 4.2: Create database table
- **File**: `db/schema.sql`
- Add `CREATE TABLE dependencias` with discovered columns + portfolio_id FK + audit fields

### Step 4.3: Add Excel reader
- **File**: `management/src/migrate/excel_readers.py`
- Add `read_dependencias()` method to `MasterReader` class

### Step 4.4: Add migration
- **File**: `management/src/migrate/engine.py`
- Add `migrate_dependencias()` method
- Include in migration phase ordering (Phase 6 with other additional tables)

### Step 4.5: Backend model
- **File**: `backend/app/models.py`
- Add `Dependencia` SQLAlchemy model

### Step 4.6: Backend router
- **File**: `backend/app/routers/dependencias.py` (new file)
- Standard CRUD endpoints following existing router pattern
- Register in `backend/app/main.py`

### Step 4.7: Portfolio router
- **File**: `backend/app/routers/portfolio.py`
- Add `Dependencia` import and `"dependencias": Dependencia` to `TABLE_MODELS`

### Step 4.8: Frontend section
- **File**: `frontend/src/features/detail/components/sections/DependenciasSection.jsx` (new)
- Follow pattern of `LtpSection.jsx` — define columns, use `SimpleTable`
- **File**: `frontend/src/features/detail/components/sections/index.js` — add export
- **File**: `frontend/src/features/detail/DetailPage.jsx` — add section at bottom of page

### Step 4.9: Test
- Run migration, verify dependencias data populates
- Verify API endpoint returns data
- Verify frontend displays section

---

## Phase 5: WBEs Section in Frontend (Requirement 6)

### Step 5.1: Create WbesSection component
- **File**: `frontend/src/features/detail/components/sections/WbesSection.jsx` (new)
- Columns: anio, wbe_pyb, descripcion_pyb, wbe_can, descripcion_can
- Use `SimpleTable` component

### Step 5.2: Register and display
- **File**: `frontend/src/features/detail/components/sections/index.js` — add export
- **File**: `frontend/src/features/detail/DetailPage.jsx` — extract `wbes` data and add section at bottom

### Step 5.3: Test
- Verify WBEs section appears in detail page with correct data

---

## Phase 6: `instructions.md` File (Requirement 4)

### Step 6.1: Create file
- **File**: `instructions.md` (project root)
- Include: migration commands, backend startup, frontend startup, debugging instructions

---

## Phase 7: Documentation Updates

### Step 7.1: Update README.md
- Update command list (add `recreate_tables`)
- Update `full_calculation_datos_relevantes` description
- Update table count and column descriptions
- Add `dependencias` table to schema section
- Update project structure if needed

### Step 7.2: Update architecture docs
- **File**: `specs/architecture_frontend.md` — add WbesSection, DependenciasSection
- **File**: `specs/architecture_backend.md` — add dependencias router, note schema changes

---

## Execution Order Summary

| Phase | Requirement | Dependency |
|-------|-------------|------------|
| 1 | recreate_tables command | None |
| 2 | Rename cluster_2025 -> cluster | Phase 1 (need recreate_tables to test) |
| 3 | Remove redundant fields | Phase 2 (rename first, then remove) |
| 4 | dependencias table | Phase 3 (schema should be clean) |
| 5 | WBEs frontend section | None (can run in parallel with Phase 4) |
| 6 | instructions.md | After Phase 1-5 (references final commands) |
| 7 | Documentation updates | After all other phases |

---

## Risk Mitigation

- **API backward compatibility**: The `calculated_fields` module already computes redundant fields on read. After fixing the portfolio router to use `model_to_dict_with_calculated()`, the API response remains identical.
- **datos_relevantes calculation**: Reads from `datos_descriptivos` and `informacion_economica` core fields (not the redundant ones), so removing redundant fields from other tables does not affect it.
- **Frontend stability**: Only field name change is `cluster_2025` -> `cluster`. All other API response shapes remain the same.
- **Dependencias**: New table — no existing functionality affected.
