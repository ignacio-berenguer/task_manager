# Feature 020: Cierre Económico Iniciativa - Implementation Plan

## Phase 1: Database Schema

### Step 1.1: Add column to datos_relevantes table
**File:** `db/schema.sql`
- Add `iniciativa_cerrada_economicamente TEXT` after `estado_requisito_legal TEXT`
- No index needed (low cardinality: only "Si"/"No")

## Phase 2: Management - Calculation Module

### Step 2.1: Add helper function
**File:** `management/src/calculate/helper_functions.py`
- Add `iniciativa_cerrada_economicamente(conn, portfolio_id)` function
- Pattern: query hechos for `estado = 'Cierre económico iniciativa'`, return "Si"/"No"
- Place after `esta_en_los_206_me_de_2026()` for logical grouping

### Step 2.2: Update excluded states in helper functions
**File:** `management/src/calculate/helper_functions.py`
- Add `'Cierre económico iniciativa'` to `ultimo_id()` default `excluded_states` parameter
- Add `'Cierre económico iniciativa'` to `ultimo_id_aprobado()` default `excluded_states` parameter

### Step 2.3: Update excluded states in estado functions
**File:** `management/src/calculate/estado_functions.py`
- Add `'Cierre económico iniciativa'` to `excluded_states` in:
  - `estado_iniciativa()`
  - `fecha_de_ultimo_estado()`
  - `estado_aprobacion_iniciativa()`
  - `estado_ejecucion_iniciativa()`

### Step 2.4: Integrate into calculation engine
**File:** `management/src/calculate/engine.py`
- Import `iniciativa_cerrada_economicamente` from `.helper_functions`
- Add `'iniciativa_cerrada_economicamente': iniciativa_cerrada_economicamente(conn, portfolio_id)` to `calculate_row()` return dict

### Step 2.5: Add Excel export mapping
**File:** `management/src/export/excel_export.py`
- Add `'iniciativa_cerrada_economicamente': 'Iniciativa cerrada económicamente'` to `DATOS_RELEVANTES_COLUMN_MAPPING`

## Phase 3: Backend API

### Step 3.1: Update SQLAlchemy model
**File:** `backend/app/models.py`
- Add `iniciativa_cerrada_economicamente = Column(Text)` to `DatosRelevante` class, after `estado_requisito_legal`

No other backend changes needed - the router, CRUD, and search are generic and will automatically include the new column.

## Phase 4: Frontend

### Step 4.1: Add column definition
**File:** `frontend/src/features/search/utils/columnDefinitions.js`
- Add entry to `ALL_COLUMNS` in the Estado category:
  ```javascript
  { id: 'iniciativa_cerrada_economicamente', label: 'Cerrada Econ.', type: 'text', category: 'Estado' }
  ```

### Step 4.2: Dashboard - add default filter
**File:** `frontend/src/features/dashboard/hooks/useDatosRelevantes.js`
- Add filter: `{ field: 'iniciativa_cerrada_economicamente', operator: 'ne', value: 'Si' }`
- Keep existing `estado_de_la_iniciativa != 'Cancelada'` filter

**File:** `frontend/src/features/dashboard/components/FilterBar.jsx`
- Add checkbox toggle: "Incluir cerradas econ." (unchecked by default)
- When checked, remove the `iniciativa_cerrada_economicamente` filter from the API request
- Store preference in localStorage with existing dashboard filters

### Step 4.3: Search page - add default filter and filter control
**File:** `frontend/src/features/search/hooks/useSearchInitiatives.js`
- Add `cerradaEconomicamente` to filter state with default `['No']`
- Add to `buildSearchRequest()` multi-select fields array
- Add to `multiSelectFields` list: `{ key: 'cerradaEconomicamente', field: 'iniciativa_cerrada_economicamente' }`

**File:** `frontend/src/features/search/components/FilterPanel.jsx`
- Add filter control for "Cerrada Econ." - multi-select or checkbox with options ["Si", "No"]
- Default: "No" selected (only show non-closed initiatives)

### Step 4.4: Detail page - display field
**File:** `frontend/src/features/detail/components/sections/ImportesSection.jsx`
- Add field to the "Other fields" section displayed via KeyValueDisplay:
  ```javascript
  { key: 'iniciativa_cerrada_economicamente', label: 'Cerrada Económicamente', type: 'text' }
  ```

## Phase 5: Testing

### Step 5.1: Run full pipeline
```bash
cd management
uv run python main.py recreate_tables
uv run python main.py migrate
uv run python main.py calculate_datos_relevantes
```

### Step 5.2: Verify calculation
```sql
-- Check if any initiatives are marked as cerrada económicamente
SELECT portfolio_id, iniciativa_cerrada_economicamente
FROM datos_relevantes
WHERE iniciativa_cerrada_economicamente = 'Si';

-- Verify excluded states work: estado_de_la_iniciativa should never be "Cierre económico iniciativa"
SELECT portfolio_id, estado_de_la_iniciativa
FROM datos_relevantes
WHERE estado_de_la_iniciativa = 'Cierre económico iniciativa';
-- Should return 0 rows
```

### Step 5.3: Verify backend
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
# Test: GET /api/v1/datos-relevantes/?limit=5 - should include new field
# Test: POST /api/v1/datos-relevantes/search with filter on new field
```

### Step 5.4: Verify frontend
- Dashboard: should exclude cerrada económicamente by default; toggle should work
- Search: should exclude cerrada económicamente by default; filter should work
- Detail: should show the field value

## Phase 6: Documentation

### Step 6.1: Update architecture_frontend.md
- Document the new filter in dashboard and search sections
- Document the new field in detail page section

### Step 6.2: Update README.md
- Add feature_020 to the feature list / changelog if applicable

## Execution Order

```
Phase 1 (DB Schema)
    |
Phase 2 (Calculation - Steps 2.1 through 2.5)
    |
Phase 3 (Backend)
    |
Phase 4 (Frontend - Steps 4.1 through 4.4)
    |
Phase 5 (Testing)
    |
Phase 6 (Documentation)
```

All phases are sequential. Within Phase 2, steps must be done in order (helper function first, then engine integration). Within Phase 4, step 4.1 should be done first, then the rest can be done in any order.

## Risk Assessment

- **Low risk:** Schema change (additive column, no migration needed - table is always recreated)
- **Low risk:** Calculation function (follows exact existing pattern)
- **Low risk:** Backend model (additive column, no API contract change)
- **Medium risk:** Frontend filters (default filter behavior change - users may notice different result counts)
  - Mitigation: Toggle/checkbox allows users to include closed initiatives when needed
