# Feature 021: Implementation Plan

## Phase 1: Tooltip Dark Mode Fix

Quick win — fix tooltip readability before modifying other components.

### Step 1.1: Fix `StatusChart.jsx` tooltip

**File:** `frontend/src/features/dashboard/components/StatusChart.jsx`

Add `color: 'hsl(var(--card-foreground))'` to `contentStyle`, add `labelStyle` with `fontWeight: 600`, and add `itemStyle` to override Recharts' default of using the bar fill color for value text.

### Step 1.2: Fix `BarChartCard.jsx` tooltip

**File:** `frontend/src/features/dashboard/components/BarChartCard.jsx`

Same tooltip fix: `contentStyle` color, `labelStyle` with fontWeight, `itemStyle` with card-foreground color.

Add `yAxisWidth` prop (default: 100px) to control Y-axis label width. Dynamic truncation threshold: `Math.floor(width / 6)` characters.

---

## Phase 2: Estado Workflow Order (Shared Module)

### Step 2.1: Create shared ESTADO_ORDER module

**File:** `frontend/src/lib/estadoOrder.js` (NEW)

Create a shared module that is the single source of truth for estado ordering across the entire application. Exports:
- `ESTADO_ORDER` — canonical array of 21 estado values in workflow progression order
- `getEstadoIndex(name)` — returns sort index; unknown values go to end
- `sortEstados(arr)` — sorts a string array by workflow order

### Step 2.2: Refactor Dashboard to use shared module

**File:** `frontend/src/features/dashboard/hooks/useDatosRelevantes.js`

- Remove local `ESTADO_ORDER` constant and `getEstadoIndex()` function
- Import from `@/lib/estadoOrder`
- Re-export `ESTADO_ORDER` for backward compatibility

---

## Phase 3: Filter System Changes

### Step 3.1: Update filter defaults and storage

**File:** `frontend/src/features/dashboard/utils/filterStorage.js`

- Update `getDefaultFilters()` to return new schema:
  ```javascript
  {
    year, digitalFramework: ['ALL'], unidad: ['ALL'], cluster: ['ALL'],
    estado: ['ALL'],                   // NEW multi-select
    previstasEsteAno: 'Todos',         // NEW tri-state select
    excluirCanceladas: true,           // NEW checkbox
    excluirEPTs: true,                 // NEW checkbox
    cerradaEconomicamente: 'No',       // NEW tri-state select (replaces includeCerradas/excluirCerradas)
  }
  ```
- Update `initializeFilters()` to handle migration from old formats:
  - `includeCerradas: true/false` → `cerradaEconomicamente: 'Todos'/'No'`
  - `excluirCerradas: true/false` → `cerradaEconomicamente: 'No'/'Todos'`
  - `previstasEsteAno: true/false` → `previstasEsteAno: 'Sí'/'Todos'`

### Step 3.2: Update data fetching hook

**File:** `frontend/src/features/dashboard/hooks/useDatosRelevantes.js`

- **Remove** hardcoded API exclusion filters from `fetchDatosRelevantes()`. API call sends `{ filters: [], limit: 1000, offset: 0 }`.
- Update `extractFilterOptions()` to extract unique `estado` values sorted by `ESTADO_ORDER`
- Update `filterData()` to apply all filter logic client-side:
  1. Always exclude `tipo_agrupacion === 'Grupo Iniciativas'` (unconditional)
  2. `excluirCanceladas` → exclude where `estado_de_la_iniciativa === 'Cancelado'` (masculine)
  3. `excluirEPTs` → exclude where `tipo` includes "EPT" (case-insensitive)
  4. `cerradaEconomicamente` → tri-state: Sí keeps only `'Sí'`/`'Si'`, No excludes them, Todos shows all
  5. `previstasEsteAno` → tri-state: Sí keeps only `'Sí'`/`'Si'`, No keeps only `'No'`, Todos shows all
  6. `estado` → filter by selected values (if not ALL)
  7. Keep existing: digitalFramework, unidad, cluster filters
- Add `sortByName` and `sortByEstado` options to `groupFilteredByField()` and `sumImporteByField()`:
  - `{ sortByEstado: true }` → sort by `getEstadoIndex()`
  - `{ sortByName: true }` → sort alphabetically ascending
  - Default → sort by value descending

### Step 3.3: Update FilterBar component

**File:** `frontend/src/features/dashboard/components/FilterBar.jsx`

- **Remove** "Incluir cerradas econ." checkbox
- **Add** Estado multi-select (accepts `estadoOptions` prop, options pre-sorted by workflow order)
- **Add** two tri-state `<select>` dropdowns: "Previstas este ano" (Todos/Sí/No) and "Cerrada Econ." (Todos/Sí/No)
- **Add** two checkboxes: "Excluir Canceladas" (default ON) and "Excluir EPTs" (default ON)

### Step 3.4: Wire filters in DashboardPage

**File:** `frontend/src/features/dashboard/DashboardPage.jsx`

- Remove `includeCerradas` parameter from `useDatosRelevantes()` call
- Pass `estadoOptions` from `extractFilterOptions()` to `<FilterBar>`
- All new filter state flows through `filterData()` automatically

---

## Phase 4: Apply Estado Order to Search and Reports

### Step 4.1: Update Search filter options

**File:** `frontend/src/features/search/hooks/useFilterOptions.js`

- Import `sortEstados` from `@/lib/estadoOrder`
- Replace `extractUnique('estado_de_la_iniciativa')` (alphabetical sort) with `sortEstados(extractUnique('estado_de_la_iniciativa'))` (workflow order sort)

### Step 4.2: Update ReportFilterPanel to support sortByEstado

**File:** `frontend/src/features/reports/components/ReportFilterPanel.jsx`

- Import `sortEstados` from `@/lib/estadoOrder`
- In the multiselect rendering block, check for `def.sortByEstado` flag
- When `sortByEstado: true`, sort the raw options through `sortEstados()` before mapping to label/value pairs

### Step 4.3: Add sortByEstado to Hechos report estado filter

**File:** `frontend/src/features/reports/ReportPage.jsx`

- Add `sortByEstado: true` to the estado filter definition:
  ```javascript
  { key: 'estado', label: 'Estado del Hecho', type: 'multiselect', optionsKey: 'estado', placeholder: 'Todos los estados', sortByEstado: true }
  ```

### Step 4.4: Add sortByEstado to Acciones report estado filter

**File:** `frontend/src/features/reports/AccionesReportPage.jsx`

- Add `sortByEstado: true` to the estado filter definition:
  ```javascript
  { key: 'estadoIniciativa', label: 'Estado de la Iniciativa', type: 'multiselect', optionsKey: 'estado_de_la_iniciativa', placeholder: 'Todos los estados', sortByEstado: true }
  ```

---

## Phase 5: New Chart Pairs

### Step 5.1: Create SummaryCard component

**File:** `frontend/src/features/dashboard/components/SummaryCard.jsx` (NEW)

A simple card displaying a large metric value with a title. Props: `title`, `value`, `isLoading`. Uses the existing `Card` UI component.

### Step 5.2: Add new chart data computations

**File:** `frontend/src/features/dashboard/DashboardPage.jsx`

Add to the `chartData` useMemo:
```javascript
// Pair 1: Summary
summaryCount: filteredData.length,
summaryImporte: sum of importe_YYYY,

// Pair 2: Priorizacion (alphabetical)
priorityCount: groupFilteredByField(filteredData, 'priorizacion', { sortByName: true }),
priorityImporte: sumImporteByField(filteredData, 'priorizacion', year, { sortByName: true }),

// Pair 4: Framework
frameworkCount: groupFilteredByField(filteredData, 'digital_framework_level_1'),
frameworkImporte: sumImporteByField(filteredData, 'digital_framework_level_1', year),

// Pair 5: Cluster (alphabetical)
clusterCount: groupFilteredByField(filteredData, 'cluster', { sortByName: true }),
clusterImporte: sumImporteByField(filteredData, 'cluster', year, { sortByName: true }),

// Pair 6: Estado (workflow order)
statusCount: groupFilteredByField(filteredData, 'estado_de_la_iniciativa', { sortByEstado: true }),
statusImporte: sumImporteByField(filteredData, 'estado_de_la_iniciativa', year, { sortByEstado: true }),
```

### Step 5.3: Update chart grid in DashboardPage

Replace the existing chart grid with 6 chart pairs:

| Row | Left (count) | Right (importe) | Color |
|-----|-------------|-----------------|-------|
| 1 Summary | SummaryCard | SummaryCard | — |
| 2 Priorizacion | BarChartCard (`yAxisWidth={160}`) | BarChartCard (`yAxisWidth={160}`) | Orange |
| 3 Unidad | BarChartCard | BarChartCard | Green |
| 4 Framework | BarChartCard | BarChartCard | Pink |
| 5 Cluster | BarChartCard | BarChartCard | Purple |
| 6 Estado | BarChartCard | BarChartCard | Red |

Both charts in each pair use the same color.

---

## Phase 6: Documentation Updates

### Step 6.1: Update architecture_frontend.md

- Add `estadoOrder.js` to shared lib section
- Add Section on Estado Workflow Order convention
- Fix dashboard section: update filter types (tri-state selects, not checkboxes), fix priorizacion field name, update chart colors
- Document `sortByEstado` flag in ReportFilterPanel filter defs

### Step 6.2: Update README.md

- Update dashboard description with new features

### Step 6.3: Update specs.md and plan.md

- Keep in sync with all implementation changes

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `lib/estadoOrder.js` | **Create** (shared ESTADO_ORDER module) | 2 |
| `components/StatusChart.jsx` | Modify (tooltip fix) | 1 |
| `components/BarChartCard.jsx` | Modify (tooltip fix, yAxisWidth prop) | 1 |
| `utils/filterStorage.js` | Modify (new defaults, migration) | 3 |
| `hooks/useDatosRelevantes.js` | Modify (import shared module, client-side filters, sort options) | 2 + 3 |
| `components/FilterBar.jsx` | Modify (tri-state selects, checkboxes, Estado multi-select) | 3 |
| `DashboardPage.jsx` | Modify (wire filters, chart data, chart grid, colors, yAxisWidth) | 3 + 5 |
| `search/hooks/useFilterOptions.js` | Modify (sortEstados for estado options) | 4 |
| `reports/components/ReportFilterPanel.jsx` | Modify (import sortEstados, sortByEstado flag) | 4 |
| `reports/ReportPage.jsx` | Modify (add sortByEstado to estado filter def) | 4 |
| `reports/AccionesReportPage.jsx` | Modify (add sortByEstado to estado filter def) | 4 |
| `components/SummaryCard.jsx` | **Create** (summary metric card) | 5 |
| `specs/architecture_frontend.md` | Modify (docs) | 6 |
| `README.md` | Modify (docs) | 6 |

**Total: 12 files modified, 2 files created**

---

## Testing Checklist

- [x] Tooltip text is readable in both light and dark mode (contentStyle, labelStyle, itemStyle)
- [x] All 6 chart pairs render correctly with data
- [x] Items with tipo_agrupacion = 'Grupo Iniciativas' are excluded from all views
- [x] "Excluir Canceladas" checkbox excludes `estado_de_la_iniciativa = 'Cancelado'` (masculine)
- [x] "Excluir EPTs" checkbox excludes items where `tipo` contains "EPT"
- [x] "Previstas este ano" tri-state select: Todos/Sí/No works correctly
- [x] "Cerrada Econ." tri-state select: Todos/Sí/No works correctly (default: No)
- [x] Estado multi-select options in workflow order (Dashboard)
- [x] Estado multi-select options in workflow order (Search)
- [x] Estado multi-select options in workflow order (Informe Hechos)
- [x] Estado multi-select options in workflow order (Informe Acciones)
- [x] Filter reset restores all defaults
- [x] Filters persist to localStorage and restore on page reload
- [x] Old localStorage format migrates correctly
- [x] KPI cards calculate correctly with new filter flow
- [x] Summary cards show correct total count and importe
- [x] Priorizacion charts sorted alphabetically (A→Z)
- [x] Cluster charts sorted alphabetically (A→Z)
- [x] Estado charts sorted by workflow order
- [x] Priorizacion charts use yAxisWidth={160} for long labels
- [x] Both charts in each pair use the same color
- [x] Charts with no data show "No hay datos disponibles"
- [x] Loading states work for all chart types
- [x] Build succeeds without errors
