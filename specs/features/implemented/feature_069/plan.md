# Feature 069 — Implementation Plan

## Phase 1: Database & Schema

### Step 1.1: Update DB Schema
**File:** `db/schema.sql`
- Add `activo_ejercicio_actual TEXT` column to `datos_relevantes` table, after `iniciativa_cerrada_economicamente`

### Step 1.2: Update ORM Model
**File:** `backend/app/models.py`
- Add `activo_ejercicio_actual = Column(Text)` to `DatosRelevante` class, after `iniciativa_cerrada_economicamente`

---

## Phase 2: Management Module — Calculation Engine

### Step 2.1: Update `iniciativa_cerrada_economicamente()` function
**File:** `management/src/calculate/helper_functions.py`
- Change return from `"Sí"` to `"Cerrado en año YYYY"`
- Find hecho with `estado = 'Cierre económico iniciativa'`, take the one with highest `id_hecho`
- Extract year from `partida_presupuestaria` (strip `.0` suffix)
- Return `"No"` if no matching hecho found

```python
def iniciativa_cerrada_economicamente(caches: dict, portfolio_id: str) -> str:
    hechos_list = caches['hechos'].get(portfolio_id, [])
    matching = [h for h in hechos_list if h.get('estado') == 'Cierre económico iniciativa']
    if not matching:
        return "No"
    latest = max(matching, key=lambda h: h['id_hecho'])
    partida = latest.get('partida_presupuestaria') or ''
    # Parse year from "2025.0" or "2025" format
    try:
        year = int(float(partida))
        return f"Cerrado en año {year}"
    except (ValueError, TypeError):
        return "Sí"  # Fallback: closed but year unknown
```

### Step 2.2: Add `activo_ejercicio_actual()` function
**File:** `management/src/calculate/helper_functions.py`
- New function after `iniciativa_cerrada_economicamente()`

```python
def activo_ejercicio_actual(cerrada_economicamente: str, importe_anio_actual: float) -> str:
    if cerrada_economicamente == "No" and importe_anio_actual and importe_anio_actual > 0:
        return "Si"
    return "No"
```

### Step 2.3: Register new field in calculation engine
**File:** `management/src/calculate/engine.py`
- Import `activo_ejercicio_actual` from helper_functions
- Add to `calculate_row()` return dict, computing it from already-calculated values in the same row:

```python
# In calculate_row(), after 'iniciativa_cerrada_economicamente':
'activo_ejercicio_actual': activo_ejercicio_actual(
    iniciativa_cerrada_economicamente(caches, portfolio_id),
    importe(caches, portfolio_id, datetime.now().year, "Importe")
),
```

Note: Need to import `datetime` (already imported in engine.py).

---

## Phase 3: Backend — API & Agent

### Step 3.1: Update AI Chat system prompt
**File:** `backend/app/agent/system_prompt.py`
- Update `cerrada_economicamente` field description to reflect new format
- Add `activo_ejercicio_actual` field description

---

## Phase 4: Frontend — Search Page

### Step 4.1: Add `activo_ejercicio_actual` column definition
**File:** `frontend/src/features/search/utils/columnDefinitions.js`
- Add after `iniciativa_cerrada_economicamente` entry:
```javascript
{ id: 'activo_ejercicio_actual', label: 'Activo Ejercicio', type: COLUMN_TYPES.TEXT, category: 'Estado' },
```

### Step 4.2: Update FilterPanel — `cerradaEconomicamente` filter
**File:** `frontend/src/features/search/components/FilterPanel.jsx`
- Replace hardcoded `[{value: 'Sí', label: 'Sí'}, {value: 'No', label: 'No'}]` with dynamic options
- Fetch distinct values from API: `GET /api/v1/datos-relevantes/search` with a group-by or use a dedicated query. Simpler approach: add to the `useSearchInitiatives` hook to fetch distinct values for this field on mount.
- **Practical approach:** Since the number of distinct values is small and predictable, use a fetch to get distinct values from the `iniciativa_cerrada_economicamente` column via the API (similar to how other dynamic filters like `unidad`, `cluster` work).

### Step 4.3: Add `activoEjercicioActual` filter to FilterPanel
**File:** `frontend/src/features/search/components/FilterPanel.jsx`
- Add new MultiSelect filter for `activo_ejercicio_actual` with static options `["Si", "No"]`
- Place after the `cerradaEconomicamente` filter

### Step 4.4: Update search hook — add `activoEjercicioActual` mapping
**File:** `frontend/src/features/search/hooks/useSearchInitiatives.js`
- Add to the multi-select filter fields array:
```javascript
{ key: 'activoEjercicioActual', field: 'activo_ejercicio_actual' },
```

### Step 4.5: Update FilterChips
**File:** `frontend/src/features/search/components/FilterChips.jsx`
- Add label mapping:
```javascript
activoEjercicioActual: 'Activo Ejercicio',
```

### Step 4.6: Update search preferences hook
**File:** `frontend/src/features/search/hooks/useSearchPreferences.js`
- Ensure `activoEjercicioActual` is included in the filter state (follows existing pattern — likely no change needed if the hook handles arbitrary filter keys)

### Step 4.7: Handle localStorage migration for `cerradaEconomicamente`
**File:** `frontend/src/features/search/utils/searchStorage.js`
- The `DEFAULT_FILTERS.cerradaEconomicamente` stays `['No']` (unchanged)
- Add migration logic: if stored filter contains `"Sí"`, clear it (let user re-select from dynamic options)

---

## Phase 5: Frontend — Dashboard

### Step 5.1: Update dashboard filter bar options
**File:** `frontend/src/features/dashboard/components/FilterBar.jsx`
- Change `cerradaEconomicamente` select options:
  - `"Todos"` → Show all
  - `"Cerrado"` → Show only closed (any year)
  - `"No"` → Show only not closed

### Step 5.2: Update dashboard filter logic
**File:** `frontend/src/features/dashboard/hooks/useDatosRelevantes.js`
- Update the client-side filter for `cerradaEconomicamente`:
  - `"Cerrado"` → `val.startsWith('Cerrado')` must be true
  - `"No"` → `val === 'No'` must be true (or `!val.startsWith('Cerrado')`)

### Step 5.3: Update dashboard filter count
**File:** `frontend/src/features/dashboard/components/CollapsibleFilterBar.jsx`
- No change needed — already counts when `cerradaEconomicamente !== 'No'`

### Step 5.4: Add localStorage migration
**File:** `frontend/src/features/dashboard/utils/filterStorage.js`
- In `migrateFilters()`: convert old `"Sí"` value to `"Cerrado"`

---

## Phase 6: Frontend — Detail Page

### Step 6.1: Add `activo_ejercicio_actual` to DatosDescriptivosSection
**File:** `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx`
- Add field to FIELDS array:
```javascript
{ key: 'activo_ejercicio_actual', label: 'Activo Ejercicio Actual', type: 'text' },
```
- Update component to accept `datosRelevantes` prop for datos_relevantes fields
- Source `activo_ejercicio_actual` from `datosRelevantes` data

### Step 6.2: Pass datosRelevantes to DatosDescriptivosSection
**File:** `frontend/src/features/detail/DetailPage.jsx`
- Extract `datos_relevantes` from portfolio data (similar to how `datos_descriptivos` is extracted)
- Pass as prop: `<DatosDescriptivosSection data={datos_descriptivos} datosRelevantes={datos_relevantes} />`

---

## Phase 7: Excel Export

### Step 7.1: Add column mapping
**File:** `management/src/export/excel_export.py`
- Add to `DATOS_RELEVANTES_COLUMN_MAPPING`:
```python
'activo_ejercicio_actual': 'Activo en el ejercicio actual',
```

---

## Phase 8: Documentation & Version

### Step 8.1: Update version and changelog
**File:** `frontend/src/lib/version.js` — Increment minor to 69
**File:** `frontend/src/lib/changelog.js` — Add entry for feature 069

### Step 8.2: Update architecture docs
**File:** `specs/architecture/architecture_frontend.md` — Update search filters list, detail page fields
**File:** `specs/architecture/architecture_backend.md` — Update datos_relevantes field descriptions

### Step 8.3: Update README.md
- Update datos_relevantes description if needed

---

## Summary of Files Changed

| # | File | Change Type |
|---|------|-------------|
| 1 | `db/schema.sql` | Add column |
| 2 | `backend/app/models.py` | Add column |
| 3 | `management/src/calculate/helper_functions.py` | Modify function + add function |
| 4 | `management/src/calculate/engine.py` | Add field to calculate_row |
| 5 | `management/src/export/excel_export.py` | Add column mapping |
| 6 | `backend/app/agent/system_prompt.py` | Update field descriptions |
| 7 | `frontend/src/features/search/utils/columnDefinitions.js` | Add column |
| 8 | `frontend/src/features/search/components/FilterPanel.jsx` | Dynamic cerrada filter + new activo filter |
| 9 | `frontend/src/features/search/hooks/useSearchInitiatives.js` | Add filter mapping |
| 10 | `frontend/src/features/search/components/FilterChips.jsx` | Add label |
| 11 | `frontend/src/features/search/utils/searchStorage.js` | Migration |
| 12 | `frontend/src/features/dashboard/components/FilterBar.jsx` | Update options |
| 13 | `frontend/src/features/dashboard/hooks/useDatosRelevantes.js` | Update filter logic |
| 14 | `frontend/src/features/dashboard/utils/filterStorage.js` | Add migration |
| 15 | `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx` | Add field |
| 16 | `frontend/src/features/detail/DetailPage.jsx` | Pass datosRelevantes prop |
| 17 | `frontend/src/lib/version.js` | Version bump |
| 18 | `frontend/src/lib/changelog.js` | Changelog entry |
| 19 | `specs/architecture/architecture_frontend.md` | Doc update |
| 20 | `specs/architecture/architecture_backend.md` | Doc update |
| 21 | `README.md` | Doc update |

## Verification

After implementation:
1. Run `cd management && uv run python manage.py calculate_datos_relevantes` to verify calculation
2. Run `cd frontend && npm run build` to verify no build errors
3. Manual testing: check search filters, dashboard, detail page, and exported Excel
