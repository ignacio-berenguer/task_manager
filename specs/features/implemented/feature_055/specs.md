# Feature 055 — Dashboard Polish (B3, B4, B5)

## Overview

Three targeted UI improvements to the Dashboard page, addressing items B3, B4, and B5 from the feature_052 audit. All changes are frontend-only, limited to the dashboard feature.

## Spec 1: B3 — Chart Tooltip Percentages

### Current Behavior

`BarChartCard.jsx` uses recharts' built-in `<Tooltip>` with a `formatter` function that displays only the formatted value and a label ("Importe" or "Cantidad"):

```jsx
formatter={(value) => [valueFormatter(value), isImporte ? 'Importe' : 'Cantidad']}
```

### Target Behavior

The tooltip should additionally show the percentage that the hovered bar represents of the chart's total. For example:

- **Count chart:** "42 (15.3% del total)"
- **Importe chart:** "2.500 k€ (22.1% del total)"

### Design Decisions

1. **Total computation** — Each `BarChartCard` receives a new `total` prop (number). The total is computed in `DashboardPage.jsx` at the `chartData` memo level as the sum of all values in the full dataset for that chart (before the `maxItems` slice). This ensures the percentage reflects the complete dataset, not just the visible top-N bars.

2. **Custom tooltip component** — Replace the recharts default `<Tooltip>` with a custom component `ChartTooltip` defined inside `BarChartCard.jsx`. This gives full control over the layout:
   - Line 1: **Label** (the bar name/category) — bold
   - Line 2: **Value** and **percentage** — e.g., "42 (15.3% del total)"
   - Same CSS-variable-based styling as current tooltip (`--card`, `--border`, `--card-foreground`)

3. **Percentage formatting** — One decimal place (`15.3%`). If total is 0, show "—" instead of percentage. If percentage rounds to 100.0%, show "100%".

4. **Backward compatibility** — If `total` prop is not provided or is 0, the tooltip falls back to showing only the value (no percentage). This makes the enhancement opt-in at the call site.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/dashboard/components/BarChartCard.jsx` | Add `total` prop, custom tooltip component |
| `frontend/src/features/dashboard/DashboardPage.jsx` | Compute totals per chart, pass `total` prop to each `BarChartCard` |

---

## Spec 2: B4 — Truncated Label Tooltips

### Current Behavior

Y-axis labels in horizontal `BarChartCard` are truncated by character count (`Math.floor(yAxisWidth / 6)`) and an ellipsis ("...") appended. The full text is only visible in the recharts tooltip when hovering the bar itself, not the label.

```jsx
tickFormatter={(value) => {
  const maxLen = Math.floor(yAxisWidth / 6)
  return value.length > maxLen ? `${value.slice(0, maxLen)}...` : value
}}
```

### Target Behavior

When a Y-axis label is truncated, hovering over it should show the full text in a native browser tooltip. Non-truncated labels should show no tooltip.

### Design Decisions

1. **Recharts custom tick component** — Replace the YAxis `tickFormatter` with a `<CustomYAxisTick>` component rendered via the `tick` prop. This component renders an SVG `<text>` element with a `<title>` child (native SVG tooltip) when the label is truncated.

2. **Truncation logic** — Same as current: `maxLen = Math.floor(yAxisWidth / 6)`. If `value.length > maxLen`, truncate and add ellipsis; wrap in `<title>` for full text on hover.

3. **SVG `<title>` vs HTML tooltip** — SVG `<title>` is chosen because recharts renders in SVG. No external library needed, native browser tooltip behavior, zero-dependency solution.

4. **Vertical layout only** — The custom tick is only used for the horizontal layout's YAxis (category axis). The vertical layout's XAxis truncation (at 10 chars) also gets the same treatment for consistency.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/dashboard/components/BarChartCard.jsx` | Replace `tickFormatter` with custom tick components for both layouts |

---

## Spec 3: B5 — Collapsible FilterBar

### Current Behavior

The `FilterBar` is always visible, occupying significant vertical space (especially on narrow screens where controls wrap). There is no way to collapse it.

### Target Behavior

The FilterBar is wrapped in a collapsible panel:
- A toggle button above the filter bar allows collapsing/expanding
- When collapsed, the filter controls are hidden with a smooth animation
- A badge shows the count of active (non-default) filters when collapsed
- Collapsed/expanded state is persisted to localStorage

### Design Decisions

1. **New wrapper component** — Create a `CollapsibleFilterBar` component in `frontend/src/features/dashboard/components/CollapsibleFilterBar.jsx`. This wraps the existing `FilterBar` component and manages the collapse state. The `FilterBar` component itself remains unchanged.

2. **Toggle button design** — A single row above the FilterBar containing:
   - Left side: "Filtros" label + active filter count badge (only when collapsed and filters are active)
   - Right side: Chevron icon button (ChevronDown when collapsed, ChevronUp when expanded)
   - Same `bg-muted/40 rounded-lg border border-border/50` styling to visually connect with FilterBar

3. **Active filter count logic** — Count filters that differ from defaults:
   - Multi-select filters (`digitalFramework`, `unidad`, `cluster`, `estado`): active if not `['ALL']`
   - Tri-state selects (`previstasEsteAno`): active if not `'Todos'`
   - Tri-state select (`cerradaEconomicamente`): active if not `'No'` (default is 'No')
   - Checkboxes (`excluirCanceladas`, `excluirEPTs`): active if not `true` (default is true)
   - Year is NOT counted (always has a value, always "active")
   - Badge shows count as a small rounded pill next to "Filtros" label, e.g., "(3)"

4. **Animation** — CSS transition on max-height + opacity for smooth collapse/expand. Tailwind classes: `overflow-hidden transition-all duration-300`. When collapsed: `max-h-0 opacity-0`. When expanded: `max-h-[500px] opacity-100`.

5. **localStorage persistence** — Add a new key `portfolio-dashboard-filtersCollapsed` (boolean) via the existing `filterStorage.js` module. Two new functions: `saveFilterBarCollapsed(boolean)` and `loadFilterBarCollapsed()` (default: `false` = expanded).

6. **Integration in DashboardPage** — Replace the direct `<FilterBar>` usage with `<CollapsibleFilterBar>`, passing all the same props. The `id="filters"` anchor and `scroll-mt-20` class remain on the wrapper for sidebar nav compatibility.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/dashboard/components/CollapsibleFilterBar.jsx` | New component |
| `frontend/src/features/dashboard/utils/filterStorage.js` | Add `saveFilterBarCollapsed` / `loadFilterBarCollapsed` functions |
| `frontend/src/features/dashboard/DashboardPage.jsx` | Replace `FilterBar` with `CollapsibleFilterBar` |

---

## Summary of All Files Modified

| File | Specs |
|------|-------|
| `frontend/src/features/dashboard/components/BarChartCard.jsx` | B3, B4 |
| `frontend/src/features/dashboard/DashboardPage.jsx` | B3, B5 |
| `frontend/src/features/dashboard/components/CollapsibleFilterBar.jsx` | B5 (new) |
| `frontend/src/features/dashboard/utils/filterStorage.js` | B5 |

**No backend changes required.** All changes are frontend-only.

## Non-Functional Requirements

- All existing dashboard behavior (KPIs, chart navigation, filter persistence, sidebar nav) must remain unchanged
- Dark/light mode must continue to work correctly with the new tooltip and collapsible UI
- Responsive behavior must be preserved (filter wrapping on small screens)
