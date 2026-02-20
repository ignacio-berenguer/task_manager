# Feature 021: Dashboard Improvements

## 1. Overview

Enhance the existing dashboard page with additional chart pairs, new filter controls, and improved tooltip readability in dark mode. The goal is to provide a comprehensive at-a-glance view of the portfolio status.

**Data Source:** `POST /api/v1/datos-relevantes/search` (unchanged)

---

## 2. Current State

### 2.1 Existing Dashboard

**KPI Cards (4):**
| KPI | Metric |
|-----|--------|
| Total Iniciativas | COUNT of filtered items |
| Budget [Year] | SUM(budget_YYYY) |
| Aprobadas | COUNT where estado_aprobacion = 'Aprobada' |
| En Ejecucion | COUNT where estado_ejecucion contains 'ejecuci' |

**Chart Pairs (3):**
| Pair | Count Chart | Value Chart |
|------|-------------|-------------|
| Estado | Donut (StatusChart) | H-Bar (BarChartCard) |
| Unidad | H-Bar | H-Bar |
| Cluster | H-Bar | H-Bar |

**Filters:**
| Filter | Type | Default |
|--------|------|---------|
| Year | Single Select (2025-2028) | Current year |
| Digital Framework | Multi-Select (6 fixed options) | All |
| Unidad | Multi-Select (dynamic) | All |
| Cluster | Multi-Select (dynamic) | All |
| Incluir cerradas econ. | Checkbox | Off |

**Hardcoded Exclusions (in `useDatosRelevantes.js`):**
- `estado_de_la_iniciativa != 'Cancelada'` (always applied at API level)
- `iniciativa_cerrada_economicamente != 'Si'` (when `includeCerradas = false`)

---

## 3. Requirements

### 3.1 Chart Pairs

The dashboard will display **6 pairs of charts** (12 chart cards total), arranged in a 2-column grid. Each pair consists of a "count" chart (left) and a "value/importe" chart (right).

| # | Pair | Grouping Field | Count Metric | Value Metric | Sort Order |
|---|------|----------------|--------------|--------------|------------|
| 1 | Initiatives (Summary) | — | Total COUNT | Total SUM(importe_YYYY) | — |
| 2 | By Priorizacion | `priorizacion` | COUNT per group | SUM(importe_YYYY) per group | Alphabetical asc |
| 3 | By Unidad | `unidad` | COUNT per group | SUM(importe_YYYY) per group | By value desc |
| 4 | By Framework | `digital_framework_level_1` | COUNT per group | SUM(importe_YYYY) per group | By value desc |
| 5 | By Cluster | `cluster` | COUNT per group | SUM(importe_YYYY) per group | Alphabetical asc |
| 6 | By Estado | `estado_de_la_iniciativa` | COUNT per group | SUM(importe_YYYY) per group | Workflow order |

**Pair 1 (Summary):** Two prominent summary cards showing the total number of initiatives and the total value (importe) for the selected year. These are displayed as large metric cards (similar to KPIs but presented as the first chart row). They do not have a breakdown dimension.

**Pairs 2-6:** Horizontal bar charts using the existing `BarChartCard` component (count on the left, importe on the right).

**Note:** Pair 6 (Estado) currently uses a donut chart (`StatusChart`) for count. This will be changed to a `BarChartCard` for visual consistency across all chart pairs.

### 3.2 Chart Sort Orders

Charts are sorted differently depending on the dimension:

- **Priorizacion, Cluster:** Alphabetical ascending (A→Z, top to bottom)
- **Unidad, Framework:** By value descending (largest first)
- **Estado:** Workflow order (canonical progression, see Section 11)

The `groupFilteredByField` and `sumImporteByField` functions accept `{ sortByName: true }` or `{ sortByEstado: true }` options to control sort order. Default is by value descending.

### 3.3 KPI Cards

The existing 4 KPI cards are **retained** above the chart pairs:
- Total Iniciativas
- Budget [Year]
- Aprobadas
- En Ejecucion

### 3.4 New Filters

The filter bar will be reorganized to include the following controls:

| # | Filter | Type | Field | Default | Notes |
|---|--------|------|-------|---------|-------|
| 1 | Year | Single Select | — | Current year | Existing (unchanged) |
| 2 | Digital Framework | Multi-Select | `digital_framework_level_1` | All | Existing (unchanged) |
| 3 | Unidad | Multi-Select | `unidad` | All | Existing (unchanged) |
| 4 | Cluster | Multi-Select | `cluster` | All | Existing (unchanged) |
| 5 | Estado | Multi-Select | `estado_de_la_iniciativa` | All | New (Req 7). Options in workflow order |
| 6 | Previstas este ano | Tri-state Select | `en_presupuesto_del_ano` | Todos | New (Req 6). Options: Todos, Sí, No |
| 7 | Cerrada Econ. | Tri-state Select | `iniciativa_cerrada_economicamente` | No | New (Req 11). Options: Todos, Sí, No |
| 8 | Excluir Canceladas | Checkbox | `estado_de_la_iniciativa` | ON | New (Req 9). When ON, excludes `estado = 'Cancelado'` |
| 9 | Excluir EPTs | Checkbox | `tipo` | ON | New (Req 10). When ON, excludes items where `tipo` contains "EPT" |
| 10 | Resetear | Button | — | — | Existing (unchanged) |

**Tri-state Filter Behavior:**
- **Todos:** No filter applied (show all items regardless of field value)
- **Sí:** Show only items where field = 'Sí'
- **No:** Show only items where field != 'Sí' (effectively excludes positive matches)

**Filter Logic Changes:**
- The hardcoded API exclusion filters in `useDatosRelevantes.js` are **removed**. The API fetches all records and all filtering happens client-side.
- Items with `tipo_agrupacion = 'Grupo Iniciativas'` are **always excluded** (not configurable via a toggle).
- The estado value for cancelled initiatives is `'Cancelado'` (masculine) in the database.

**Filter Persistence:**
- All new filter keys (`previstasEsteAno`, `estado`, `excluirCanceladas`, `excluirEPTs`, `cerradaEconomicamente`) are added to localStorage persistence.
- Default filter values updated accordingly.
- Backward compatibility: old boolean filter keys (`includeCerradas`, `excluirCerradas`, boolean `previstasEsteAno`) are automatically migrated to the new format.

### 3.5 Tooltip Readability Fix (Req 12)

**Problem:** Recharts tooltip text uses default black color for labels, and the bar's fill color for value text, both unreadable in dark mode.

**Solution:** Add explicit text color to tooltip styles in both `StatusChart.jsx` and `BarChartCard.jsx`:

```javascript
contentStyle={{
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--card-foreground))',
}}
labelStyle={{
  color: 'hsl(var(--card-foreground))',
  fontWeight: 600,
}}
itemStyle={{
  color: 'hsl(var(--card-foreground))',  // Overrides Recharts default of using bar fill color
}}
```

### 3.6 Priorizacion Axis Labels

The priorizacion field has long text values. The `BarChartCard` component accepts a `yAxisWidth` prop (default: 100px). For priorizacion charts, `yAxisWidth={160}` is used to provide more room. The truncation threshold scales dynamically with the axis width (`Math.floor(width / 6)` characters).

---

## 4. Data Flow

```
DashboardPage
├── useDatosRelevantes()
│   └── POST /datos-relevantes/search (no exclusion filters — fetches all)
│       └── { filters: [], limit: 1000, offset: 0 }
│
├── extractFilterOptions(rawData)
│   └── Extracts unique values for: unidad, cluster, estado (workflow order)
│
├── filterData(rawData, filters)
│   ├── Always exclude tipo_agrupacion = 'Grupo Iniciativas'
│   ├── Exclude Cancelado (if excluirCanceladas = true)
│   ├── Exclude EPTs (if excluirEPTs = true)
│   ├── Filter cerradaEconomicamente (tri-state: Sí / No / Todos)
│   ├── Filter previstasEsteAno (tri-state: Sí / No / Todos)
│   ├── Filter by digitalFramework (if not ALL)
│   ├── Filter by unidad (if not ALL)
│   ├── Filter by cluster (if not ALL)
│   └── Filter by estado (if not ALL)
│
├── calculateFilteredKPIs(filteredData, year)
│   └── totalInitiatives, totalBudget, approvedInitiatives, inExecution
│
└── chartData (6 pairs)
    ├── summary: { count, totalImporte }
    ├── priorizacionCount + priorizacionImporte (alphabetical)
    ├── unidadCount + unidadImporte (by value)
    ├── frameworkCount + frameworkImporte (by value)
    ├── clusterCount + clusterImporte (alphabetical)
    └── statusCount + statusImporte (workflow order)
```

---

## 5. Component Changes

### 5.1 Files Modified

| File | Changes |
|------|---------|
| `DashboardPage.jsx` | Add new chart pairs (summary, priorizacion, framework); reorganize chart grid; update chartData computation with sort options; update filter handling; pass `yAxisWidth` to priorizacion charts |
| `FilterBar.jsx` | Add tri-state selects (Previstas este ano, Cerrada Econ.); add checkbox filters (Excluir Canceladas, Excluir EPTs); add Estado multi-select; remove old "Incluir cerradas econ." checkbox |
| `useDatosRelevantes.js` | Remove hardcoded API exclusion filters; add `ESTADO_ORDER` constant; add `getEstadoIndex()` helper; add `estado` to `extractFilterOptions` (workflow order); add tri-state filter logic; add `sortByName` and `sortByEstado` options to grouping/summing functions |
| `filterStorage.js` | Update default filters with new keys (`cerradaEconomicamente`, `previstasEsteAno` as strings); add backward compatibility migration for old boolean and `includeCerradas` formats |
| `StatusChart.jsx` | Add `color`, `labelStyle`, and `itemStyle` to tooltip for dark mode readability |
| `BarChartCard.jsx` | Add `color`, `labelStyle`, and `itemStyle` to tooltip; add `yAxisWidth` prop with dynamic truncation |

### 5.2 New Components

| Component | Description |
|-----------|-------------|
| `SummaryCard.jsx` | Large metric card for Pair 1 (total count / total importe). Displays a single large value with title, using the existing Card UI component. |

### 5.3 No Backend Changes

All new functionality is implemented client-side. The existing `POST /datos-relevantes/search` endpoint provides all needed data. No new API endpoints are required.

---

## 6. Filter State Schema

```javascript
// Default filters
{
  year: 2026,                       // Current year
  digitalFramework: ['ALL'],        // All selected
  unidad: ['ALL'],                  // All selected
  cluster: ['ALL'],                 // All selected
  estado: ['ALL'],                  // All selected (workflow order in dropdown)
  previstasEsteAno: 'Todos',        // Tri-state: 'Todos' | 'Sí' | 'No'
  excluirCanceladas: true,          // Checkbox: ON by default
  excluirEPTs: true,                // Checkbox: ON by default
  cerradaEconomicamente: 'No',      // Tri-state: 'Todos' | 'Sí' | 'No' (default 'No' = exclude cerradas)
}
```

**Migration from old formats:**
- `includeCerradas: true/false` → `cerradaEconomicamente: 'Todos'/'No'`
- `excluirCerradas: true/false` → `cerradaEconomicamente: 'No'/'Todos'`
- `previstasEsteAno: true/false` → `previstasEsteAno: 'Sí'/'Todos'`

---

## 7. UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
│ Vista general del portfolio y metricas clave             │
├──────────────────────────────────────────────────────────┤
│ [Year ▼] [Framework ▼] [Unidad ▼] [Cluster ▼]          │
│ [Estado ▼] [Previstas ▼] [Cerrada Econ. ▼]             │
│ [✓ Excluir Canceladas] [✓ Excluir EPTs]   [Resetear]   │
├──────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │  Total  │ │ Budget  │ │Aprobadas│ │  En     │       │
│ │ Inic.   │ │  2026   │ │         │ │ Ejec.   │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├──────────────────────────────────────────────────────────┤
│ Pair 1: Summary                                          │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  Total Iniciativas    │ │  Importe Total        │     │
│ │       374             │ │     125.432 k€        │     │
│ └───────────────────────┘ └───────────────────────┘     │
│                                                          │
│ Pair 2: By Priorizacion (alphabetical)                   │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  By Prioriz. (num)    │ │  By Prioriz. (imp)    │     │
│ │  ████████████         │ │  ████████████         │     │
│ └───────────────────────┘ └───────────────────────┘     │
│                                                          │
│ Pair 3: By Unidad                                        │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  By Unidad (num)      │ │  By Unidad (imp)      │     │
│ └───────────────────────┘ └───────────────────────┘     │
│                                                          │
│ Pair 4: By Framework                                     │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  By Framework (num)   │ │  By Framework (imp)   │     │
│ └───────────────────────┘ └───────────────────────┘     │
│                                                          │
│ Pair 5: By Cluster (alphabetical)                        │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  By Cluster (num)     │ │  By Cluster (imp)     │     │
│ └───────────────────────┘ └───────────────────────┘     │
│                                                          │
│ Pair 6: By Estado (workflow order)                        │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  By Estado (num)      │ │  By Estado (imp)      │     │
│ └───────────────────────┘ └───────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Chart Colors

Each chart pair uses a single consistent color for both charts:

| Pair | Color (HSL) | Description |
|------|-------------|-------------|
| Summary | — | Primary text color (SummaryCard) |
| Priorizacion | `hsl(24.6, 95%, 53.1%)` | Orange |
| Unidad | `hsl(142.1, 76.2%, 36.3%)` | Green |
| Framework | `hsl(330, 80%, 55%)` | Pink |
| Cluster | `hsl(262.1, 83.3%, 57.8%)` | Purple |
| Estado | `hsl(0, 84.2%, 60.2%)` | Red |

---

## 9. Logging

All filter changes, data loading events, and chart rendering are logged using the existing `createLogger('Dashboard')` pattern:

```javascript
logger.info('Dashboard rendered', { itemCount, year })
logger.info('Filters updated', { ...filters })
logger.debug('Filtered data', { totalRaw, totalFiltered })
```

---

## 10. Constraints

- No backend changes required
- Existing dashboard functionality preserved (KPI cards, chart behavior)
- All new filtering is client-side
- Items with `tipo_agrupacion = 'Grupo Iniciativas'` are always excluded from all dashboard views
- The cancelled estado value in the database is `'Cancelado'` (masculine)
- Filter persistence maintains backward compatibility with localStorage (multiple migration paths)
- All UI text in Spanish (without accents in code identifiers)
- Dark mode tooltip fix applies to all chart components (contentStyle, labelStyle, itemStyle)

---

## 11. Estado Workflow Order

A canonical ordering of estado values is stored as the `ESTADO_ORDER` constant in the shared module `@/lib/estadoOrder.js`. This order represents the logical workflow progression:

```
010 Recepción
020 SM100 Redacción
030 SM100 Final
040 SM200 En Revisión
050 SM200 Final
060 Análisis BI
070 Pendiente de Unidad Solicitante
080 Revisión Regulación
090 En Revisión P&C
100 En Aprobación
110 Encolada por Prioridad
120 Aprobada
130 Aprobada con CCT
140 En ejecución
150 Finalizado
160 Pendiente PES
170 Facturación cierre año
180 Cierre económico iniciativa
190 Importe Estimado
200 Importe Planificado
210 Cancelado
```

This order is used across the entire application:
- **Dashboard:** Estado chart bar ordering (top to bottom) and Estado filter dropdown option ordering
- **Search:** `estado_de_la_iniciativa` filter dropdown option ordering (via `useFilterOptions.js`)
- **Informe Hechos:** `estado` (Estado del Hecho) filter dropdown option ordering (via `ReportFilterPanel` `sortByEstado` flag)
- **Informe Acciones:** `estado_de_la_iniciativa` filter dropdown option ordering (via `ReportFilterPanel` `sortByEstado` flag)
- Available for future use via the exported `ESTADO_ORDER`, `getEstadoIndex`, and `sortEstados` functions from `@/lib/estadoOrder.js`

**Shared Module:** `frontend/src/lib/estadoOrder.js` exports:
- `ESTADO_ORDER` — the canonical array
- `getEstadoIndex(name)` — returns sort index (unknown values → end)
- `sortEstados(arr)` — sorts an array of estado strings by workflow order

**Integration Pattern:**
- For filter defs in `ReportFilterPanel`, add `sortByEstado: true` to any multiselect filter definition to sort its options by workflow order
- For custom hooks, import `sortEstados` and apply it to the options array before returning
