# Feature 055 — Implementation Plan

## Phase 1: B4 — Truncated Label Tooltips

**Why first:** Isolated change in `BarChartCard.jsx`, no new props or data flow changes. Sets the stage for Phase 2 changes in the same file.

### Steps

1. **Create `CustomYAxisTick` component** inside `BarChartCard.jsx`
   - Receives recharts tick props: `x`, `y`, `payload`, plus custom `maxLen`
   - Computes truncated text using existing logic (`value.length > maxLen`)
   - Renders `<text>` SVG element with `<title>` child when truncated
   - Styling: `fontSize: 11`, `fill: currentColor`, `textAnchor: "end"`

2. **Create `CustomXAxisTick` component** for vertical layout
   - Same pattern but `textAnchor: "middle"`, truncation at 10 chars
   - Only used when `horizontal = false`

3. **Replace `tickFormatter` on YAxis** (horizontal layout) with `tick={<CustomYAxisTick maxLen={maxLen} />}`

4. **Replace `tickFormatter` on XAxis** (vertical layout) with `tick={<CustomXAxisTick />}`

### Verification
- Hover truncated Y-axis label → native tooltip shows full text
- Non-truncated labels → no tooltip
- Chart click/double-click behavior unchanged
- Both horizontal and vertical layouts work

---

## Phase 2: B3 — Chart Tooltip Percentages

**Why second:** Requires both `BarChartCard.jsx` changes and `DashboardPage.jsx` data flow changes.

### Steps

1. **Add `total` prop to `BarChartCard`**
   - Type: number (optional)
   - Used for percentage calculation in tooltip

2. **Create `ChartTooltip` custom component** inside `BarChartCard.jsx`
   - Receives recharts tooltip props: `active`, `payload`, `label`
   - Also receives (via closure): `valueFormatter`, `isImporte`, `total`
   - Renders:
     - Label (bold)
     - Value line: formatted value + percentage if total > 0
   - Percentage format: `(XX.X% del total)` — one decimal, "—" if total is 0

3. **Replace `<Tooltip formatter={...}>` with `<Tooltip content={<ChartTooltip />} />`**
   - Remove `formatter`, `contentStyle`, `labelStyle`, `itemStyle` props (all handled in custom component)

4. **Compute chart totals in `DashboardPage.jsx`**
   - In the `chartData` useMemo, compute totals for each chart pair:
     ```
     priorityCountTotal: sum of all priorityCount values (before maxItems slice)
     priorityImporteTotal: sum of all priorityImporte values
     ... (repeat for all 5 pairs)
     ```
   - Pass as `total` prop to each `<BarChartCard>`

### Verification
- Hover any bar → tooltip shows value + percentage
- Percentage adds up correctly across all bars in a chart
- Formatting consistent: count charts show "42 (15.3% del total)", importe charts show "2.500 k€ (22.1% del total)"
- Charts with no data show no tooltip
- Dark/light mode tooltip styling correct

---

## Phase 3: B5 — Collapsible FilterBar

**Why last:** New component + localStorage changes. Independent of chart changes.

### Steps

1. **Add persistence functions to `filterStorage.js`**
   - `saveFilterBarCollapsed(collapsed: boolean)` — saves to `portfolio-dashboard-filtersCollapsed`
   - `loadFilterBarCollapsed(): boolean` — loads from localStorage, defaults to `false`

2. **Create `CollapsibleFilterBar.jsx`**
   - Import `FilterBar` and collapse persistence functions
   - Props: same as `FilterBar` + `filters` (for active count calculation)
   - State: `isCollapsed` initialized from `loadFilterBarCollapsed()`
   - Active filter count logic:
     - Compare each filter against its default value
     - Count non-default filters (exclude `year`)
   - Render:
     ```
     <div>  // outer wrapper
       <button>  // toggle header
         <span>"Filtros" + badge if collapsed && activeCount > 0</span>
         <ChevronDown/ChevronUp icon>
       </button>
       <div className="overflow-hidden transition-all duration-300 {collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}">
         <FilterBar {...filterBarProps} />
       </div>
     </div>
     ```
   - On toggle: flip state + save to localStorage

3. **Update `DashboardPage.jsx`**
   - Import `CollapsibleFilterBar` instead of `FilterBar`
   - Replace `<FilterBar>` with `<CollapsibleFilterBar>`, passing all existing props
   - Keep `id="filters"` and `scroll-mt-20` on the wrapper div

### Verification
- Click toggle → FilterBar collapses/expands smoothly
- Badge shows correct active filter count when collapsed
- Collapse state persists across page navigation and reload
- Sidebar "Filtros" nav link still scrolls to correct position
- Reset button still works when expanded
- All filter controls still function normally

---

## Phase 4: Post-Implementation

1. Bump `APP_VERSION.minor` in `frontend/src/lib/version.js`
2. Add changelog entry in `frontend/src/lib/changelog.js`
3. Update `README.md`
4. Update `specs/architecture/architecture_frontend.md` (dashboard section)
5. Build check: `npm run build` passes without errors
6. Use `/close_feature feature_055`
