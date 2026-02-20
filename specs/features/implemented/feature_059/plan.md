# Feature 059 — Implementation Plan

## Phase 1: D1 — Aggregation Footer Row

**Why first:** Self-contained change in GenericReportPage, no new config patterns to establish. Sets the foundation for understanding the table rendering pipeline.

### Steps

1. **Create `computeAggregations` utility function** inside GenericReportPage.jsx
   - Input: `data` (array of row objects), `columns` (visible column IDs), `aggregations` config, `getColDef` lookup
   - Output: Object mapping column ID → `{ label, formattedValue }` or null
   - Implements `sum`, `count`, `avg` aggregation functions
   - Uses `formatCellValue` / `formatReportCellValue` for formatting

2. **Create `AggregationFooter` sub-component** inside GenericReportPage.jsx
   - Renders a `<tfoot>` with a single `<tr>`
   - Sticky positioning: `sticky bottom-0 z-10 bg-muted border-t`
   - First cell shows "Totales (página)" label
   - Aggregated cells show prefix label + formatted value (e.g., "Suma: 1.250 k€")
   - Non-aggregated cells are empty

3. **Integrate into normal table mode** (lines 360-397)
   - Add `<AggregationFooter>` after `</tbody>` inside the `<table>` element
   - Only render if `config.aggregations` is defined and non-empty

4. **Integrate into CollapsibleReportTable** (if feasible)
   - Same footer component reused in the collapsible table's `<table>` element

5. **Add sample aggregations** to one report page for testing
   - Hechos ReportPage: `aggregations: { importe: 'sum' }` — note: ReportPage.jsx is custom, so add aggregation footer directly there as well

### Verification
- Table with `aggregations` config shows sticky footer row
- Footer values match manual calculation of visible page data
- Reports without `aggregations` show no footer (backward compatible)
- Footer scrolls horizontally with table but stays at bottom vertically

---

## Phase 2: D2 — Date Range Presets

**Why second:** Modifies ReportFilterPanel (shared) and individual report configs. Independent of D1.

### Steps

1. **Define preset date ranges** as a constant array
   - Each preset: `{ label, getRange: () => ({ start, end }) }`
   - 5 presets: Últimos 7 días, Últimos 30 días, Este mes, Este trimestre, Este año
   - Date math using plain JavaScript Date API (no library needed)

2. **Create `DateRangePresets` sub-component** inside ReportFilterPanel.jsx
   - Renders a row of small pill buttons
   - On click: calls `onFiltersChange` with both start and end date keys set
   - Props: `startKey`, `endKey`, `filters`, `onFiltersChange`

3. **Add `dateRangeGroup` support to ReportFilterPanel rendering**
   - When rendering date filters, detect paired groups
   - For each unique `dateRangeGroup`, render the two date inputs side-by-side followed by the preset buttons
   - Solo date filters (no group) render as before, no presets

4. **Update report page filter definitions**
   - `AccionesReportPage.jsx`: Add `dateRangeGroup: 'siguienteAccion'` to both date filters
   - `ReportPage.jsx` (Hechos): Add `dateRangeGroup: 'fecha'` to fechaInicio/fechaFin filters — note: Hechos uses a custom filter implementation, so presets may need to be added directly there

### Verification
- Date pair filters show preset buttons below them
- Clicking a preset fills both start and end dates
- Solo date filters (if any) show no presets
- Manually typed dates still work as before
- Presets calculate correct dates (quarter boundaries, month start, etc.)

---

## Phase 3: D3 — Improved Empty State

**Why third:** Changes the empty state rendering in GenericReportPage. Independent of D1/D2 but benefits from understanding the component after D1 changes.

### Steps

1. **Create `ReportEmptyState` sub-component** inside GenericReportPage.jsx
   - Props: `emptyMessage`, `filters`, `filterDefs`, `dateFilterKeys`
   - Derives active filters from `filters` + `filterDefs` (reuses label from filterDefs)
   - Renders:
     - `SearchX` icon (centered, large, muted)
     - Title: `emptyMessage` text
     - If active filters: "Filtros activos:" + list of filter badges with name:value pairs
     - Suggestion text: "Intente eliminar o modificar alguno de los filtros activos."
     - If no active filters: "No hay datos disponibles para este informe."

2. **Replace empty state block** in GenericReportPage
   - Replace the current `<td colSpan>{emptyMessage}</td>` (lines 326-345) with:
     ```jsx
     <td colSpan={...}>
       <ReportEmptyState
         emptyMessage={emptyMessage}
         filters={filters}
         filterDefs={filterDefs}
         dateFilterKeys={config.dateFilterKeys}
       />
     </td>
     ```

3. **Format filter values for display**
   - Multi-select arrays: Join with ", " (truncate if > 3 values)
   - Date strings: Format as DD/MM/YYYY
   - Text/number: Show as-is
   - Empty arrays / empty strings: Skip (not active)

### Verification
- Empty state with no active filters shows generic message
- Empty state with active filters lists them as badges
- Suggestion text appears when filters are active
- Layout centered and visually appealing in both light/dark mode
- Reports without filters still show the basic empty message

---

## Phase 4: D4 — Saved Report Templates

**Why last:** Most complex feature, touches hooks + new component + GenericReportPage integration. Benefits from all prior phases being stable.

### Steps

1. **Extend `useReportPreferences` hook**
   - Add `templates` state (loaded from localStorage)
   - Add `saveTemplate(name, filters, sortConfig)` — saves current filters + columns + sort + pageSize
   - Add `deleteTemplate(index)` — removes template at index
   - Add `getTemplates()` — returns template list
   - localStorage key: `portfolio-report-{prefix}-templates`
   - Limit: 10 templates per report (FIFO when exceeded)

2. **Create `ReportTemplates.jsx` component**
   - Props: `templates`, `onSave`, `onLoad`, `onDelete`
   - UI: Inline row with:
     - Dropdown/select showing saved template names (if any)
     - "Guardar" button (Save icon) — toggles inline name input + confirm
     - Delete (X) button per template in dropdown
   - Loading a template calls `onLoad(templateData)`
   - Saving prompts for name via inline `<Input>` + confirm button

3. **Integrate `ReportTemplates` into GenericReportPage**
   - Render between subtitle and filter panel
   - Wire `onSave` to `saveTemplate(name, filters, sortConfig)`
   - Wire `onLoad` to restore filters + columns + sort + pageSize + trigger search
   - Wire `onDelete` to `deleteTemplate(index)`

4. **Handle template loading state changes**
   - When template loaded, batch all state updates:
     - `setFilters(template.filters)`
     - `setColumns(template.columns)`
     - `setSortConfig(template.sortConfig)`
     - `setPageSize(template.pageSize)`
   - Trigger search after state updates settle (via useEffect or callback)

### Verification
- Save button opens inline input, saves template on confirm
- Saved templates appear in dropdown
- Loading a template restores all settings and triggers search
- Delete removes template from dropdown and localStorage
- Templates persist across page reloads
- Maximum 10 templates enforced
- Each report type has independent templates

---

## Phase 5: Post-Implementation

1. Bump `APP_VERSION.minor` in `frontend/src/lib/version.js`
2. Add changelog entry in `frontend/src/lib/changelog.js`
3. Update `README.md`
4. Update `specs/architecture/architecture_frontend.md` (report sections)
5. Build check: `npm run build` passes without errors
6. Use `/close_feature feature_059`
