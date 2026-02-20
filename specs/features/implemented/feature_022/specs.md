# Feature 022: Dashboard Improvements — Chart Navigation & Initiative Lists

## 1. Overview

Enhance the dashboard with two capabilities:
1. **Chart-to-Search navigation:** Double-clicking a bar in any chart navigates to the Search page, pre-filtered to show exactly the initiatives that make up that bar.
2. **Initiative list cards:** Two new cards at the bottom of the dashboard showing relevant initiative subsets with direct navigation.

**Data Source:** Same as existing dashboard — `POST /api/v1/datos-relevantes/search` (no backend changes).

---

## 2. Requirements

### 2.1 Chart-to-Search Navigation (Req 1)

**Interaction:** Double-click on any bar element in any `BarChartCard` chart.

**Behavior:** Navigate to the Search page (`/search`) with filters pre-applied so the Search results show exactly the initiatives included in that bar.

**Filter mapping:** The Search page must receive both:
1. The dashboard's active filters (to reproduce the same filtered dataset)
2. The chart-specific dimension filter (the clicked bar's value applied to the chart's grouping field)

**Chart dimension → Search filter mapping:**

| Chart Pair | Grouping Field | Search Filter Key |
|-----------|----------------|-------------------|
| Priorizacion | `priorizacion` | Not available in Search — use portfolio_id list |
| Unidad | `unidad` | `unidad` |
| Framework | `digital_framework_level_1` | `digitalFramework` |
| Cluster | `cluster` | `cluster` |
| Estado | `estado_de_la_iniciativa` | `estado` |

**Dashboard filter → Search filter mapping:**

| Dashboard Filter | Search Filter | Mapping |
|-----------------|---------------|---------|
| `digitalFramework` | `digitalFramework` | Direct (array) |
| `unidad` | `unidad` | Direct (array) |
| `cluster` | `cluster` | Direct (array) |
| `estado` | `estado` | Direct (array) |
| `cerradaEconomicamente` | `cerradaEconomicamente` | Tri-state → array: `'No'` → `['No']`, `'Sí'` → `['Sí']`, `'Todos'` → `[]` |
| `excluirCanceladas` | — | Cannot be mapped directly; handled via portfolio_id list fallback |
| `excluirEPTs` | — | Cannot be mapped directly; handled via portfolio_id list fallback |
| `previstasEsteAno` | — | Cannot be mapped directly; handled via portfolio_id list fallback |

**Fallback strategy — portfolio_id list:**

Some dashboard filters (excluirCanceladas, excluirEPTs, previstasEsteAno, priorizacion) have no direct Search filter equivalent. To ensure exact result matching, the navigation uses a **portfolio_id list** approach:

1. From the filtered dashboard data, find all items matching the clicked bar's dimension value.
2. Collect their `portfolio_id` values.
3. Pass the portfolio_id list to Search as a comma-separated string in the `portfolioId` filter.

This guarantees the Search results exactly match the bar's initiatives, regardless of which dashboard filters are active.

**Navigation mechanism:** React Router's `useNavigate` with location state:

```javascript
navigate('/search', { state: { filters: { portfolioId: 'ID001,ID002,...', ... } } })
```

The Search page checks `location.state?.filters` on mount. If present, it uses those filters instead of localStorage and triggers an automatic search.

**Double-click implementation:**

Recharts `Bar` component does not natively support `onDoubleClick`. Implementation uses a timer-based approach in the `onClick` handler:
- Track click timestamps per bar
- If two clicks on the same bar occur within 300ms, treat as double-click
- Single clicks are ignored (no action)

**Visual feedback:** On hover, the cursor changes to `pointer` to indicate interactivity.

### 2.2 Top Value Initiatives Card (Req 3a)

**Title:** "Iniciativas mas importantes"

**Location:** Below the chart pairs grid, full width.

**Content:** A table/list showing initiatives from the current filtered dataset whose `importe_YYYY` (for the selected year) exceeds a configurable threshold.

**Columns displayed:**

| Column | Source Field | Format | Behavior |
|--------|-------------|--------|----------|
| Portfolio ID | `portfolio_id` | Text | Link to `/detail/:portfolio_id` |
| Nombre | `nombre` | Text (truncated) | — |
| Importe | `importe_YYYY` | k€ format | — |

**Threshold selector:** A `<select>` dropdown in the card header with options:
- 500 k€
- 1.000 k€ (default, configurable via `VITE_DASHBOARD_TOP_VALUE_THRESHOLD`)
- 2.000 k€
- 5.000 k€

**Sorting:** By importe descending (highest first).

**Empty state:** "No hay iniciativas que superen el umbral seleccionado"

### 2.3 Recent Changes Card (Req 3b)

**Title:** "Iniciativas con cambios recientes"

**Location:** Below the "Iniciativas mas importantes" card, full width.

**Content:** A table/list showing initiatives from the current filtered dataset whose `fecha_de_ultimo_estado` falls within a recent time window.

**Columns displayed:**

| Column | Source Field | Format | Behavior |
|--------|-------------|--------|----------|
| Portfolio ID | `portfolio_id` | Text | Link to `/detail/:portfolio_id` |
| Nombre | `nombre` | Text (truncated) | — |
| Estado | `estado_de_la_iniciativa` | Text | — |
| Fecha Ultimo Estado | `fecha_de_ultimo_estado` | DD/MM/YYYY | — |

**Time window:** Configurable via `VITE_DASHBOARD_RECENT_DAYS` (default: 7 days). Shows initiatives where `fecha_de_ultimo_estado >= today - N days`.

**Sorting:** By `fecha_de_ultimo_estado` descending (most recent first).

**Navigation button:** "Ver en Informe Hechos" button in the card header. Clicking navigates to `/informes/hechos` with location state containing:
- `fechaInicio`: today minus N days (same window as the card)
- `fechaFin`: today
- Dashboard filters mapped to Hechos filters (digitalFramework, unidad, cluster, tipo, estado)

The Hechos ReportPage checks `location.state?.filters` on mount. If present, uses those instead of defaults.

**Empty state:** "No hay iniciativas con cambios en los ultimos N dias"

---

## 3. Data Flow

### 3.1 Chart Double-Click Flow

```
User double-clicks bar in BarChartCard
  ↓
BarChartCard calls onBarDoubleClick({ name, value, field })
  ↓
DashboardPage handler:
  1. Filters filteredData by bar's field === name
  2. Collects portfolio_ids
  3. Builds Search filter object with portfolioId list
  4. navigate('/search', { state: { filters } })
  ↓
SearchPage mount:
  1. Checks location.state?.filters
  2. Sets filters from state (overrides localStorage)
  3. Auto-executes search
  4. Clears location state to prevent stale re-renders
```

### 3.2 Top Value Card Flow

```
DashboardPage
  ├── filteredData (already computed)
  ├── topValueThreshold (state, default from env)
  └── topValueItems = filteredData
        .filter(item => item[`importe_${year}`] > threshold)
        .sort(by importe desc)
        .slice(0, 20)
```

### 3.3 Recent Changes Card Flow

```
DashboardPage
  ├── filteredData (already computed)
  ├── recentDays (from env)
  └── recentItems = filteredData
        .filter(item => item.fecha_de_ultimo_estado >= cutoffDate)
        .sort(by fecha_de_ultimo_estado desc)
        .slice(0, 20)
```

---

## 4. Component Changes

### 4.1 Modified Components

| Component | Changes |
|-----------|---------|
| `BarChartCard.jsx` | Add `onBarDoubleClick` prop, `field` prop; implement double-click detection on `<Bar>` onClick; cursor pointer on hover |
| `DashboardPage.jsx` | Add double-click handler for chart navigation; add top value card with threshold state; add recent changes card; pass `field` and `onBarDoubleClick` to each BarChartCard |
| `SearchPage.jsx` | Check `location.state?.filters` on mount; override localStorage filters when present; auto-search |
| `ReportPage.jsx` (Hechos) | Check `location.state?.filters` on mount; override default filters when present |

### 4.2 New Components

| Component | Description |
|-----------|-------------|
| `TopValueCard.jsx` | Card with threshold selector and initiative list table. Links portfolio_id to detail page. |
| `RecentChangesCard.jsx` | Card with initiative list table and "Ver en Informe Hechos" navigation button. Links portfolio_id to detail page. |

### 4.3 No Backend Changes

All data is already available in the datos_relevantes response. No new API endpoints required.

---

## 5. Environment Variables

Added to `frontend/.env`:

```bash
# Dashboard: Top Value Initiatives threshold in EUR (default: 1000000)
VITE_DASHBOARD_TOP_VALUE_THRESHOLD=1000000

# Dashboard: Recent Changes time window in days (default: 7)
VITE_DASHBOARD_RECENT_DAYS=7
```

---

## 6. UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                                                │
├──────────────────────────────────────────────────────────┤
│ [Filters]                                                │
├──────────────────────────────────────────────────────────┤
│ [KPI Cards (5)]                                          │
├──────────────────────────────────────────────────────────┤
│ Charts Grid (5 pairs, double-click navigates to Search)  │
│ ┌───────────────────────┐ ┌───────────────────────┐     │
│ │  Priorizacion (num)   │ │  Priorizacion (imp)   │     │
│ │  ▓▓▓▓▓▓▓▓ ← dblclick │ │  ▓▓▓▓▓▓▓▓ ← dblclick │     │
│ └───────────────────────┘ └───────────────────────┘     │
│ ... (4 more pairs)                                       │
├──────────────────────────────────────────────────────────┤
│ Iniciativas mas importantes              [Umbral: ▼ 1M€]│
│ ┌──────────┬──────────────────────────┬─────────────┐   │
│ │ Port. ID │ Nombre                   │ Importe     │   │
│ │ P001     │ Proyecto Alpha           │ 2.500 k€    │   │
│ │ P002     │ Proyecto Beta            │ 1.800 k€    │   │
│ └──────────┴──────────────────────────┴─────────────┘   │
├──────────────────────────────────────────────────────────┤
│ Iniciativas con cambios recientes    [Ver Informe Hechos]│
│ ┌──────────┬─────────────────┬──────────┬────────────┐  │
│ │ Port. ID │ Nombre          │ Estado   │ Fecha      │  │
│ │ P003     │ Proyecto Gamma  │ Aprobada │ 05/02/2026 │  │
│ │ P004     │ Proyecto Delta  │ En ejec. │ 03/02/2026 │  │
│ └──────────┴─────────────────┴──────────┴────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Constraints

- No backend changes required
- All data comes from the existing datos_relevantes response (already fetched by dashboard)
- Double-click detection must be reliable (300ms window, same bar check)
- Location state for Search/Hechos navigation must not interfere with normal page behavior
- Portfolio_id list approach ensures exact match between chart bar and Search results
- Max 20 items displayed in each card to avoid excessive DOM rendering
- Existing dashboard functionality preserved
