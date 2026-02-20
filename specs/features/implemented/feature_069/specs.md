# Feature 069 — Technical Specification

## Overview

Two changes to the `datos_relevantes` computed table:

1. **Change `iniciativa_cerrada_economicamente`** from binary "Sí"/"No" to year-based format: "Cerrado en año YYYY" / "No"
2. **Add new field `activo_ejercicio_actual`** ("Si"/"No") — whether initiative is active in the current fiscal year

Both changes propagate across all 4 modules: management, backend, frontend, and MCP server / AI chat agent.

---

## 1. Change: `iniciativa_cerrada_economicamente`

### 1.1 Current Behavior

| Aspect | Current |
|--------|---------|
| Calculation | Checks if any `hechos` record has `estado = 'Cierre económico iniciativa'` |
| Return values | `"Sí"` or `"No"` |
| `partida_presupuestaria` | Not examined |
| Source file | `management/src/calculate/helper_functions.py:252-263` |

### 1.2 New Behavior

| Aspect | New |
|--------|-----|
| Calculation | Find `hechos` record with `estado = 'Cierre económico iniciativa'`, extract `partida_presupuestaria` |
| Return values | `"Cerrado en año YYYY"` or `"No"` |
| Year extraction | `partida_presupuestaria` stored as `"YYYY.0"` in DB → extract integer year → format `"Cerrado en año YYYY"` |
| Multiple records | If multiple "Cierre económico" records exist (different years), use the one with the highest `id_hecho` (latest) |

### 1.3 `partida_presupuestaria` Format

The `partida_presupuestaria` field in the `hechos` table stores years as float-strings (e.g., `"2025.0"`, `"2026.0"`). This is consistent with how `calidad_valoracion()` and `importe_functions.py` handle this field. The function must:
1. Find the matching hechos record
2. Parse `"2025.0"` → `2025` (strip `.0` suffix)
3. Return `"Cerrado en año 2025"`

If `partida_presupuestaria` is null/empty for the matching record, fall back to `"Cerrado en año ???"` or simply `"Sí"` — but this edge case is unlikely in practice.

### 1.4 Impact Analysis — `iniciativa_cerrada_economicamente`

| Module | File | Change |
|--------|------|--------|
| **Management** | `management/src/calculate/helper_functions.py` | Update function to extract year from `partida_presupuestaria` |
| **Backend** | No code change needed | Field is TEXT in schema, stored as-is from datos_relevantes. No calculated_fields override exists for this field. |
| **Frontend — Search FilterPanel** | `frontend/src/features/search/components/FilterPanel.jsx` | Replace hardcoded `["Sí", "No"]` MultiSelect with dynamic options fetched from API (or use a broader set of options) |
| **Frontend — Search hooks** | `frontend/src/features/search/hooks/useSearchInitiatives.js` | No change — already uses `'in'` operator which works with new values |
| **Frontend — Search storage** | `frontend/src/features/search/utils/searchStorage.js` | Update `DEFAULT_FILTERS.cerradaEconomicamente` from `['No']` to `['No']` (no change needed — "No" remains a valid value) |
| **Frontend — Search columns** | `frontend/src/features/search/utils/columnDefinitions.js` | No change — already type TEXT |
| **Frontend — Search FilterChips** | `frontend/src/features/search/components/FilterChips.jsx` | No change — chip label "Cerrada Econ." works for all values |
| **Frontend — Dashboard FilterBar** | `frontend/src/features/dashboard/components/FilterBar.jsx` | Update select options: "Todos" / "Sí" (any closed) / "No" → "Todos" / "Cerrado" (any year) / "No" |
| **Frontend — Dashboard hook** | `frontend/src/features/dashboard/hooks/useDatosRelevantes.js` | Update tri-state filter logic: instead of checking `val === 'Si'/'Sí'`, check `val.startsWith('Cerrado')` |
| **Frontend — Dashboard filterStorage** | `frontend/src/features/dashboard/utils/filterStorage.js` | Update default value from `'No'` to `'No'` (unchanged). Add migration for old `'Sí'` → `'Cerrado'` |
| **Frontend — Detail ImportesSection** | `frontend/src/features/detail/components/sections/ImportesSection.jsx` | No change — `KeyValuePair` displays text as-is, new format works |
| **MCP Server** | `mcp_server/src/mcp_portfolio/table_metadata.py` | No direct reference, no change |
| **AI Chat — system_prompt** | `backend/app/agent/system_prompt.py` | Update field description from `"Si"/"No"` to new format |
| **Excel export** | `management/src/export/excel_export.py` | No change — column mapping already exists, TEXT values exported as-is |
| **DB Schema** | `db/schema.sql` | No change — already `TEXT` type |
| **ORM Model** | `backend/app/models.py` | No change — already `Column(Text)` |

---

## 2. New Field: `activo_ejercicio_actual`

### 2.1 Calculation Logic

```
IF iniciativa_cerrada_economicamente == "No"   (not closed)
   AND any importe in current year > 0          (has money allocated)
THEN "Si"
ELSE "No"
```

**Interpretation of `<> "Cerrada*"`:** The requirement uses `<> "Cerrada*"` but with the new format, values are `"No"` or `"Cerrado en año YYYY"`. Since `"Cerrado"` ≠ `"Cerrada"`, the condition `<> "Cerrada*"` would always be true. The intent is clearly: "if the initiative is NOT economically closed". With the new format, this translates to: `iniciativa_cerrada_economicamente == "No"`. An initiative that has a "Cerrado en año YYYY" value IS closed and should NOT be considered active.

**"Any importe expected in current year":** The current year is determined dynamically (2026 in the current year). An initiative has importes if `importe_{current_year} > 0`. We use `importe_YYYY` (the main consolidated importe) as the definitive measure. This is the field calculated by `importe(caches, portfolio_id, year, "Importe")` which uses the priority-based hecho lookup.

### 2.2 Implementation Details

| Module | File | Change |
|--------|------|--------|
| **DB Schema** | `db/schema.sql` | Add `activo_ejercicio_actual TEXT` to `datos_relevantes` table |
| **ORM Model** | `backend/app/models.py` | Add `activo_ejercicio_actual = Column(Text)` to `DatosRelevante` |
| **Management — helper_functions** | `management/src/calculate/helper_functions.py` | Add `activo_ejercicio_actual()` function |
| **Management — engine** | `management/src/calculate/engine.py` | Call `activo_ejercicio_actual()` in `calculate_row()`, import from helper_functions |
| **Frontend — Search FilterPanel** | `frontend/src/features/search/components/FilterPanel.jsx` | Add "Activo Ejercicio Actual" multi-select filter with ["Si", "No"] options |
| **Frontend — Search hooks** | `frontend/src/features/search/hooks/useSearchInitiatives.js` | Add `activoEjercicioActual` → `activo_ejercicio_actual` mapping |
| **Frontend — Search FilterChips** | `frontend/src/features/search/components/FilterChips.jsx` | Add `activoEjercicioActual: 'Activo Ejercicio'` label |
| **Frontend — Search columns** | `frontend/src/features/search/utils/columnDefinitions.js` | Add column definition for `activo_ejercicio_actual` |
| **Frontend — Detail DatosDescriptivosSection** | `frontend/src/features/detail/components/sections/DatosDescriptivosSection.jsx` | Add field to FIELDS array |
| **AI Chat — system_prompt** | `backend/app/agent/system_prompt.py` | Add field description |
| **Excel export** | `management/src/export/excel_export.py` | Add `'activo_ejercicio_actual': 'Activo en el ejercicio actual'` |

### 2.3 Current Year Handling

In the management module, the current year should be determined at calculation time using `datetime.now().year`. This is consistent with how other year-dependent calculations work (e.g., `en_presupuesto_del_ano` defaults to a specific year).

In the management module, `activo_ejercicio_actual` will receive the already-computed `importe_YYYY` from the same row being calculated (since `calculate_row()` builds all fields for a row). The function can receive the relevant importe value directly.

---

## 3. Search Page Filter Design

### 3.1 `iniciativa_cerrada_economicamente` Filter

**Current:** Hardcoded `["Sí", "No"]` MultiSelect.

**New:** Dynamic options fetched from the API using `obtener_valores_campo` pattern (GET distinct values). This handles the variable "Cerrado en año YYYY" values automatically. Alternatively, use a simplified approach:
- Keep as a MultiSelect with options fetched from the API (preferred — follows existing pattern for dynamic values)
- The search hook already sends these values with `operator: 'in'` to the API

**Decision:** Fetch distinct values from the API for this filter. This is the cleanest approach — no hardcoded values, automatically adapts to data. Use the existing pattern where `useSearchInitiatives` fetches distinct values for dynamic filters.

### 3.2 `activo_ejercicio_actual` Filter

**New filter:** MultiSelect with static options `["Si", "No"]` (same pattern as other binary filters). Add below the existing `cerradaEconomicamente` filter.

---

## 4. Dashboard Filter Adaptation

### 4.1 Current Dashboard Filter: `cerradaEconomicamente`

The dashboard has a `<select>` with options: "Todos", "Sí", "No". The filter logic is client-side.

**New behavior:**
- Options: "Todos", "Cerrado" (any closed), "No" (not closed)
- Filter logic: "Cerrado" → include only items where `val.startsWith('Cerrado')`; "No" → include only items where `val === 'No'`
- Migration: old stored value `"Sí"` in localStorage → migrate to `"Cerrado"`

---

## 5. Detail Page Changes

### 5.1 `activo_ejercicio_actual` in DatosDescriptivosSection

Add after existing fields (e.g., after `falta_justificacion_regulatoria`):
```javascript
{ key: 'activo_ejercicio_actual', label: 'Activo Ejercicio Actual', type: 'text' }
```

**Note:** This field is NOT from the `datos_descriptivos` table — it's from `datos_relevantes`. The section retrieves `datos_descriptivos` data. We need to source this field from `datos_relevantes` via the portfolio endpoint. Looking at how the detail page works: `GET /api/v1/portfolio/{pid}` returns ALL tables including `datos_relevantes`. The `DatosDescriptivosSection` receives `data={datos_descriptivos}`, but `datos_relevantes` is also available on the page. We have two options:
1. Pass `datos_relevantes` data to the section and display `activo_ejercicio_actual` from there
2. Add it to a different section (e.g., ImportesSection where `iniciativa_cerrada_economicamente` already lives)

**Decision:** Since the requirement explicitly says "Datos Descriptivos section", add a `datosRelevantes` prop to `DatosDescriptivosSection` and display `activo_ejercicio_actual` from it. This follows a similar pattern to how other sections combine data from multiple tables.

---

## 6. AI Chat & MCP Server

### 6.1 System Prompt Update

Update the field description in `backend/app/agent/system_prompt.py`:

**Before:**
```
- `cerrada_economicamente` — Si está cerrada económicamente ("Si"/"No")
```

**After:**
```
- `iniciativa_cerrada_economicamente` — Si la iniciativa está cerrada económicamente. Valores: "No" (no cerrada) o "Cerrado en año YYYY" (cerrada en el año YYYY)
- `activo_ejercicio_actual` — Si la iniciativa está activa en el ejercicio actual ("Si"/"No"). Es "Si" cuando NO está cerrada económicamente Y tiene importe en el año en curso
```

### 6.2 MCP Server

No direct code changes needed in `table_metadata.py` as the field descriptions are not hardcoded there for individual columns. The MCP tools use the backend API which will automatically return the new field values and the new column.

---

## 7. Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Multiple "Cierre económico" hechos for same initiative | Use highest `id_hecho` (latest) — extract year from that record |
| `partida_presupuestaria` is null on the matching hecho | Return `"Sí"` as fallback (closed but year unknown) |
| `partida_presupuestaria` format is not `"YYYY.0"` | Try to parse as integer, fall back to raw string |
| Current year changes (2026 → 2027) | `activo_ejercicio_actual` uses `datetime.now().year` dynamically |
| Initiative has importe but is closed | `activo_ejercicio_actual = "No"` (closed takes precedence) |
| Initiative not closed but importe = 0 | `activo_ejercicio_actual = "No"` (no money allocated) |
| Dashboard localStorage has old `"Sí"` value | Migration function converts to `"Cerrado"` |
| Search page localStorage has old `["Sí"]` filter | Migration: replace `"Sí"` with fetched dynamic values or let user re-select |
