# Feature 059 — Report Enhancements (D1, D2, D3, D4)

## Overview

Four UI improvements to the GenericReportPage and report system, addressing items D1–D4 from the feature_052 audit. All changes are frontend-only and target the shared report infrastructure used by 10 report pages (LTPs, Acciones, Etiquetas, Transacciones, Transacciones JSON, Justificaciones, Dependencias, Notas, Documentos, Descripciones) plus the custom Hechos ReportPage.

---

## Spec 1: D1 — Aggregation Footer Row

### Current Behavior

GenericReportPage renders a `<table>` with `<thead>` and `<tbody>` only. There is no `<tfoot>` or summary row. Users have no way to see totals, counts, or averages for numeric/currency columns.

### Target Behavior

A sticky footer row at the bottom of the table shows aggregation values for configured columns. Each column can independently show one of: `sum`, `count`, `avg`, or nothing.

### Design Decisions

1. **New config property `aggregations`** — Each report page's config object gains an optional `aggregations` map:
   ```js
   aggregations: {
     importe: 'sum',        // Sum of all values in current page
     id_hecho: 'count',     // Count of non-null values
   }
   ```
   If `aggregations` is not provided or empty, no footer row is rendered. This makes the feature opt-in per report.

2. **Scope: current page only** — Aggregation is computed over `results.data` (the current page of results returned by the API). Computing across all pages would require a separate API endpoint or fetching all data, which is out of scope. The footer label will indicate this: e.g., "Suma (pag.)" to clarify it's page-level.

3. **Rendering** — A `<tfoot>` section with a single `<tr>`. The row has the same column structure as data rows. For aggregated columns, cells show the formatted value directly (no label prefix) with compact `px-3 py-1` padding and `text-xs` font size. For non-aggregated columns, cells are empty. The footer is intentionally minimal to avoid taking vertical space.

4. **Sticky positioning** — The footer row uses `sticky bottom-0 z-10 bg-muted` classes to stay visible when scrolling within the `max-h-[calc(100vh-20rem)]` table container.

5. **Formatting** — Aggregated values use the same `formatCellValue` / `formatReportCellValue` functions already used for data cells. Currency columns format as currency, numbers as numbers.

6. **Aggregation functions:**
   - `sum` — Sum of all numeric values (null/undefined treated as 0)
   - `count` — Count of non-null, non-empty values
   - `avg` — Average of numeric values (excluding null/undefined), formatted to 1 decimal

7. **Implementation location** — New `AggregationFooter` component inside GenericReportPage.jsx (not a separate file, since it's tightly coupled to the table structure). Receives `data`, `columns`, `aggregations` config, and column definition lookup function.

8. **Collapsible table mode** — The `CollapsibleReportTable` component also gets a footer row when `aggregations` is configured.

### Reports with aggregations (initial)

Only reports with numeric/currency columns will define aggregations initially:
- **Hechos ReportPage** (custom): `importe: 'sum'` — This is the custom ReportPage, so it would need its own footer implementation. For consistency, extract the aggregation logic into a shared utility.
- Other reports can add aggregations later as needed by adding the config property.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Add `AggregationFooter` component, render `<tfoot>` when config has `aggregations` |
| Report pages (as needed) | Add `aggregations` to config object |

---

## Spec 2: D2 — Date Range Presets

### Current Behavior

Date filters in `ReportFilterPanel` use native HTML5 `<input type="date">` elements. Users must manually type or pick start and end dates.

### Target Behavior

Date filter pairs gain a row of preset buttons that populate both start and end dates with one click.

### Design Decisions

1. **Preset definitions:**
   | Label | Start Date | End Date |
   |-------|-----------|----------|
   | Últimos 7 días | today - 7 days | today |
   | Últimos 30 días | today - 30 days | today |
   | Este mes | 1st of current month | today |
   | Este trimestre | 1st of current quarter | today |
   | Este año | Jan 1 of current year | today |

2. **Date filter pairing** — Presets only apply to date filter **pairs** (start + end). In `filterDefs`, date pairs are identified by a new optional property `dateRangeGroup`:
   ```js
   { key: 'siguienteAccionInicio', label: 'Desde', type: 'date', dateRangeGroup: 'siguienteAccion' },
   { key: 'siguienteAccionFin', label: 'Hasta', type: 'date', dateRangeGroup: 'siguienteAccion' },
   ```
   When two date filters share the same `dateRangeGroup`, preset buttons are rendered below the pair. If a date filter has no `dateRangeGroup`, no presets are shown (it's a standalone date filter).

3. **Rendering** — Small pill-style buttons rendered in a `flex flex-wrap gap-1` container below the date input pair. Uses `variant="outline" size="xs"` styling. Buttons are rendered once per group, spanning both date columns.

4. **Implementation** — Inside `ReportFilterPanel.jsx`, after rendering each filter group's date inputs. The preset buttons call `onFiltersChange` with both start and end keys set simultaneously.

5. **No dependency on feature_058** — The requirements mention datepicker (F1) as an "ideal" dependency, but F1 targets EntityFormModal, not report filters. Report date filters remain as native HTML5 date inputs. The presets work independently of the input type.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/reports/components/ReportFilterPanel.jsx` | Add `DateRangePresets` sub-component, detect paired date filters, render preset buttons |
| Report pages with date filters | Add `dateRangeGroup` to paired date filter defs (AccionesReportPage, Hechos ReportPage) |

---

## Spec 3: D3 — Improved Empty State

### Current Behavior

When a report search returns no results, GenericReportPage shows the `emptyMessage` string from config (e.g., "No se encontraron LTPs. Intente ajustar los filtros.") in a plain `<td>` cell.

### Target Behavior

The empty state shows context-specific suggestions based on which filters are active, helping users understand why results are empty and how to get results.

### Design Decisions

1. **New config property `filterLabels`** — A map from filter key to human-readable label:
   ```js
   filterLabels: {
     estadoIniciativa: 'Estado de la Iniciativa',
     siguienteAccionInicio: 'Fecha desde',
   }
   ```
   This is already available from `filterDefs[].label`, so we'll derive it automatically from `filterDefs` — no extra config needed.

2. **Suggestion generation** — When results are empty and filters are active, generate suggestions:
   - List each active filter with its current value
   - Suggest removing or changing specific filters
   - Format: icon + title + list of active filters + suggestion text

3. **Rendering** — Replace the simple `<td>{emptyMessage}</td>` with a richer empty state block:
   - Icon: `SearchX` from lucide-react (centered, muted)
   - Title: The existing `emptyMessage` text
   - Active filters list (if any): "Filtros activos:" followed by pill badges showing each active filter and its value
   - Suggestion: "Intente eliminar o modificar alguno de los filtros activos."
   - If no filters are active: just show the title + "No hay datos disponibles para este informe."

4. **No dependency on feature_058** — The requirements mention EmptyState component (F6) as an "ideal" dependency, but since F6 is not yet implemented, we build the empty state inline within GenericReportPage. If F6 is implemented later, it can be refactored to use the shared component.

5. **Active filter detection** — Reuse the same logic from ReportFilterPanel's `activeFilterCount`: filters with non-empty, non-default values (excluding date filter keys from count but including them in suggestions).

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Replace empty state `<td>` with `ReportEmptyState` sub-component |

---

## Spec 4: D4 — Saved Report Templates

### Current Behavior

Report configurations (filters + column selection + sort order) are persisted per-report in localStorage via `useReportPreferences`. There is no way to save multiple named configurations or share setups.

### Target Behavior

Users can save the current report configuration as a named template and recall it later from a dropdown.

### Design Decisions

1. **Template data structure:**
   ```js
   {
     name: "My Template",
     createdAt: "2026-02-15T12:00:00Z",
     filters: { ... },          // Full filter state object
     columns: ["col1", "col2"], // Visible column IDs in order
     sortConfig: { field: "fecha", direction: "desc" },
     pageSize: 50,
   }
   ```

2. **Storage** — Templates stored in localStorage under key `portfolio-report-{prefix}-templates` as a JSON array. Each report type has its own template list. Maximum 10 templates per report (oldest deleted when limit exceeded).

3. **UI — Template controls** — A new `ReportTemplates` component rendered inside the `ReportFilterPanel` header bar (right side, before "Buscar" button) via `templateProps` passed to the panel. Contains:
   - **"Guardar plantilla"** button (Save icon) — Opens a small inline input to name the template. Saves current filters + columns + sort + pageSize.
   - **Template dropdown** (if templates exist) — Hover-activated dropdown showing saved template names. Uses `pt-1` padding bridge to prevent hover gap disconnect.
   - **Delete button** per template — Small X icon next to each template name in the dropdown.

4. **Restore behavior** — When a template is loaded:
   - `filters` → calls `setFilters(template.filters)`
   - `columns` → calls `setColumns(template.columns)`
   - `sortConfig` → calls `setSortConfig(template.sortConfig)`
   - `pageSize` → calls `setPageSize(template.pageSize)`
   - Triggers a new search with the restored configuration

5. **Template storage in `useReportPreferences`** — Extend the hook to manage templates:
   - `templates` — Array of saved templates
   - `saveTemplate(name)` — Saves current state as named template
   - `loadTemplate(index)` — Returns template data at index
   - `deleteTemplate(index)` — Removes template at index
   - Templates persisted to localStorage alongside existing columns/pageSize

6. **Config integration** — `GenericReportPage` accesses templates through the existing `useReportPreferences` hook. No new config property needed — all reports automatically get template functionality.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/reports/hooks/useReportPreferences.js` | Add template management (save, load, delete, list) |
| `frontend/src/features/reports/components/ReportTemplates.jsx` | **New** — Template save/load/delete UI component |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Integrate `ReportTemplates` component, wire template load to state setters |

---

## Summary of All Files Modified

| File | Specs |
|------|-------|
| `frontend/src/features/reports/components/GenericReportPage.jsx` | D1, D3, D4 |
| `frontend/src/features/reports/components/ReportFilterPanel.jsx` | D2, D4 (template controls in header) |
| `frontend/src/features/reports/components/ReportTemplates.jsx` | D4 (new) |
| `frontend/src/features/reports/hooks/useReportPreferences.js` | D4 |
| `frontend/src/features/reports/ReportPage.jsx` (Hechos) | D1 (aggregation footer for currency columns), D2 (dateRangeGroup), D4 (templates via filter panel) |
| `frontend/src/features/reports/AccionesReportPage.jsx` | D2 (add `dateRangeGroup`) |

**No backend changes required.** All changes are frontend-only.

## Non-Functional Requirements

- All existing report functionality (search, pagination, sorting, column config, drawer, collapsible rows) must remain unchanged
- Dark/light mode must work correctly with all new UI elements
- localStorage usage must handle corrupted/missing data gracefully (try/catch patterns)
- Feature is independent of feature_058 (datepicker, EmptyState) — no hard dependencies
