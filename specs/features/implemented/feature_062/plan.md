# Feature 062 — Implementation Plan

## Overview

This feature contains 8 items split into 3 phases. Each phase can be implemented and tested independently. Total estimated: 15-20 development tasks.

---

## Phase 1: Quick Wins (A9, G5, F5)

Isolated changes with no inter-dependencies. Can be done in any order.

### Step 1.1: A9 — GlobalSearch in Mobile Menu
**Files:** `frontend/src/components/layout/Navbar.jsx`

1. In the mobile menu section (`md:hidden`), locate the navigation items area.
2. Add a "Buscar" button with `Search` icon (lucide-react) at the top of the mobile menu, before the main navigation links.
3. On click: call the GlobalSearch open handler and close the mobile menu.
4. Style consistently with other mobile menu items.
5. Verify: open mobile menu → tap Buscar → GlobalSearch overlay appears → search works → selecting result navigates correctly.

### Step 1.2: G5 — Enhanced Focus Ring Visibility
**Files:** `frontend/src/components/ui/input.jsx`, `frontend/src/components/ui/multi-select.jsx`, other UI primitives

1. Read current focus styles in `input.jsx` and identify the `ring-primary/30` pattern.
2. Change to `ring-ring ring-offset-2` to match button focus style (higher contrast).
3. Update border on focus: `focus-visible:border-primary` (full opacity instead of `/50`).
4. Review `multi-select.jsx`, `datepicker.jsx`, `select.jsx` for similar subtle focus styles and standardize.
5. Check accordion trigger elements in `SectionAccordion.jsx` for focus visibility.
6. Add a `@media (forced-colors: active)` rule in `index.css` for Windows High Contrast mode:
   ```css
   @media (forced-colors: active) {
     *:focus-visible { outline: 2px solid CanvasText; }
   }
   ```
7. Verify: tab through the app with keyboard — all interactive elements should show clear focus rings in both light and dark mode.

### Step 1.3: F5 — Page-Specific Loading Skeletons
**Files:** New skeleton components + `frontend/src/App.jsx`

1. Create directory `frontend/src/components/shared/skeletons/`.
2. Create `DashboardSkeleton.jsx`:
   - Wrap in `<Layout>` component.
   - 4 KPI cards as `SkeletonCard` in a row.
   - 6 chart pairs (2-col grid) as taller `Skeleton` blocks.
   - 2 list cards as `SkeletonCard` at bottom.
3. Create `SearchSkeleton.jsx`:
   - Wrap in `<Layout>`.
   - Collapsed filter bar placeholder (single `Skeleton` bar).
   - Toolbar row with button-sized `Skeleton` elements.
   - Table header + 10 `SkeletonTableRow` items.
4. Create `DetailSkeleton.jsx`:
   - Wrap in `<Layout>`.
   - Breadcrumb skeleton + header (title + subtitle placeholders).
   - 5 accordion section skeletons (header bar + collapsed body).
5. Create `ReportSkeleton.jsx`:
   - Wrap in `<Layout>`.
   - Title + subtitle skeleton.
   - Filter panel skeleton.
   - Table header + 8 `SkeletonTableRow` items.
6. Update `App.jsx`:
   - Import the 4 skeleton components.
   - Replace the single generic `<Suspense fallback={spinner}>` with per-route Suspense wrappers.
   - Dashboard route → `<Suspense fallback={<DashboardSkeleton />}>`.
   - Search route → `<Suspense fallback={<SearchSkeleton />}>`.
   - Detail route → `<Suspense fallback={<DetailSkeleton />}>`.
   - Report routes → `<Suspense fallback={<ReportSkeleton />}>`.
   - Other routes (RegisterPage, ParametricasPage, etc.) can keep the generic spinner.
7. Verify: throttle network in DevTools → reload each page → skeleton appears briefly before content loads.

---

## Phase 2: Mobile UX (G1, G2, A8)

New components for mobile experience. G1 and G2 are independent; A8 can be done in parallel.

### Step 2.1: G1 — Card-Based Mobile View for Search

**New files:** `InitiativeCard.jsx`, `CardGrid.jsx`
**Modified:** `SearchPage.jsx`, `searchStorage.js`

1. Create `frontend/src/features/search/components/InitiativeCard.jsx`:
   - Props: `initiative` (data row), `onQuickView` (open drawer), `onNavigate` (go to detail).
   - Render card with: portfolio_id (link), nombre (2-line clamp), EstadoTag, CurrencyCell (importe), unidad, cluster.
   - Responsive card: full-width on mobile, max-w-sm.
   - Accessible: card as `<article>`, link as primary action.

2. Create `frontend/src/features/search/components/CardGrid.jsx`:
   - Props: `data` (array), `loading`, `onQuickView`.
   - Renders a grid of `InitiativeCard` components.
   - Loading state: 6 `SkeletonCard` placeholders.
   - Empty state: reuse `EmptyState` component.

3. Modify `SearchPage.jsx`:
   - Add `viewMode` state: `'table' | 'cards'`, persisted via `searchStorage`.
   - Add toggle buttons in toolbar: `LayoutGrid` and `LayoutList` icons.
   - Auto-detect initial mode based on screen width (< md → cards, >= md → table).
   - Conditionally render `<DataGrid>` or `<CardGrid>` based on viewMode.
   - Pagination component shared between both views.

4. Verify: resize browser to < 768px → cards appear by default. Toggle between views. Cards show correct data. Quick-view drawer works from cards.

### Step 2.2: G2 — Mobile Detail Page Navigation

**New file:** `MobileDetailNav.jsx`
**Modified:** `DetailPage.jsx`

1. Create `frontend/src/features/detail/components/MobileDetailNav.jsx`:
   - Renders a FAB (floating action button) fixed at bottom-right.
   - Visibility: `xl:hidden` (hidden when sidebar is visible).
   - FAB icon: `List` icon from lucide-react.
   - On click: opens a Sheet component (`side="bottom"`).
   - Sheet content: scrollable list of section links with badges (mirroring DetailNav).
   - Props: `sections` (same data as DetailNav), `activeSection`, `onSectionClick`.
   - Clicking a section: smooth scroll + close sheet.
   - Badge rendering: same as SidebarNav (dot for 1:1 data, count for 1:N).

2. Modify `DetailPage.jsx`:
   - Import and render `<MobileDetailNav>` alongside the existing layout.
   - Pass the same section data and active section state.
   - Verify the existing IntersectionObserver `onActiveSectionChange` callback works for both SidebarNav and MobileDetailNav.

3. Verify: view Detail page on < 1280px → FAB visible → tap → bottom sheet shows sections → tap section → scrolls to section and sheet closes.

### Step 2.3: A8 — Cross-Report Navigation

**Modified:** `GenericReportPage.jsx`, report config files, `ReportFilterPanel.jsx`

1. Define a cross-report link configuration:
   ```js
   const CROSS_REPORT_LINKS = {
     hechos: [
       { label: 'Acciones', route: '/informes/acciones' },
       { label: 'Etiquetas', route: '/informes/etiquetas' },
       { label: 'LTPs', route: '/informes/ltps' },
       { label: 'Notas', route: '/informes/notas' },
     ],
     ltps: [
       { label: 'Hechos', route: '/informes/hechos' },
       { label: 'Acciones', route: '/informes/acciones' },
       { label: 'Etiquetas', route: '/informes/etiquetas' },
     ],
     // ... etc
   }
   ```

2. Add `crossReportLinks` to each GenericReportPage config object.

3. In `GenericReportPage.jsx`:
   - If `crossReportLinks` is configured, add a "Ver en..." column as the last column.
   - Column renders a dropdown button (MoreHorizontal icon) with menu items for each link.
   - Each menu item: `navigate(route, { state: { portfolio_id: row.portfolio_id } })`.

4. In `ReportFilterPanel.jsx` or the individual report hooks:
   - On mount, check `location.state?.portfolio_id`.
   - If present, pre-populate the portfolio_id filter and trigger a search.
   - Clear the state after applying (use `navigate(location.pathname, { replace: true })`) to avoid re-applying on refresh.

5. Verify: open Hechos report → click "Ver en..." on a row → select "Acciones" → Acciones report opens filtered to that portfolio_id.

---

## Phase 3: DataGrid Advanced (C4, C5)

More complex features that extend the DataGrid. C4 and C5 are independent but both modify DataGrid, so implement sequentially.

### Step 3.1: C4 — Column-Level Filtering in DataGrid

**New files:** `ColumnFilter.jsx` and sub-components
**Modified:** `DataGrid.jsx`, `SearchPage.jsx`

1. Create `frontend/src/features/search/components/ColumnFilter.jsx`:
   - Wrapper component that renders the appropriate filter type based on column metadata.
   - Props: `column` (column definition), `value` (current filter value), `onChange`, `data` (for extracting unique values).
   - Sub-sections for each filter type (inline, not separate files to keep it simple):
     - **Text filter**: Input with "contiene..." placeholder. Filters rows where value includes the input (case-insensitive).
     - **Select filter**: Checkbox list of unique values extracted from current data. "Seleccionar todo" / "Deseleccionar todo" buttons.
     - **Number range filter**: Min and max inputs. Filters rows in range.
   - Column type detection: use existing column definition `type` field (currency → range, estado/unidad/cluster → select, default → text).

2. Modify `DataGrid.jsx` header rendering:
   - Add `Filter` (funnel) icon next to sort indicator.
   - On click: toggle a popover (use existing Popover component or simple absolute-positioned div).
   - Show `ColumnFilter` inside the popover.
   - Track column filter state: `columnFilters` as `{ [columnId]: filterValue }`.
   - Apply column filters client-side: filter the `data` prop using a `useMemo` before passing to TanStack table.
   - Visual indicator: filled funnel icon when column has active filter.

3. Modify `SearchPage.jsx`:
   - Add "Limpiar filtros de columna" button visible when any column filter is active.
   - Pass column filter state down to DataGrid.

4. Verify: click funnel icon on a column → filter popover appears → type/select values → rows filter in real-time → clear filter → all rows return.

### Step 3.2: C5 — Row Grouping in DataGrid

**New file:** `GroupBySelector.jsx`
**Modified:** `DataGrid.jsx`, `SearchPage.jsx`

1. Create `frontend/src/features/search/components/GroupBySelector.jsx`:
   - Dropdown component with options: "Sin agrupar", "Estado", "Unidad", "Cluster", "Digital Framework", "Tipo".
   - Each option maps to a data field key.
   - Props: `value`, `onChange`.

2. Modify `SearchPage.jsx`:
   - Add `groupByField` state (null or field key).
   - Render `<GroupBySelector>` in toolbar, next to view mode toggle.
   - Only enabled in table view (disabled when cards are active).
   - Pass `groupByField` to DataGrid.

3. Modify `DataGrid.jsx`:
   - When `groupByField` is set:
     - Use `useMemo` to partition `data` into groups: `Map<string, row[]>`.
     - Track expanded groups: `expandedGroups` as `Set<string>` (default: all expanded).
     - Render group header rows: colored background, group value, row count, total importe.
     - Group headers are clickable to collapse/expand.
     - "Expandir todo" / "Contraer todo" buttons near the group selector.
   - When `groupByField` is null: render flat rows (existing behavior).

4. Verify: select "Estado" from group dropdown → rows grouped by estado with headers → click header to collapse → "Sin agrupar" returns to flat view.

---

## Post-Implementation Checklist

After all phases are complete:

1. **Version bump**: `frontend/src/lib/version.js` → increment `APP_VERSION.minor` to 62.
2. **Changelog entry**: `frontend/src/lib/changelog.js` → add entry for feature 062 with title "Mejoras de Accesibilidad y Experiencia Movil" and summary covering the 8 items.
3. **Update README.md** — mention new mobile features, card view, column filters, row grouping.
4. **Update architecture doc** — `specs/architecture/architecture_frontend.md`: add sections for CardGrid, MobileDetailNav, ColumnFilter, GroupBySelector, skeletons.
5. Run `npm run build` to verify no build errors.
6. Use `/close_feature feature_062` to move to implemented and commit.

---

## Implementation Order Recommendation

Given the scope, it's recommended to implement this as a single feature but in the phased order:

1. **Phase 1** first — quick wins give immediate value with low risk.
2. **Phase 2** next — new mobile components are standalone.
3. **Phase 3** last — DataGrid extensions are the most complex and benefit from having the other improvements stable first.

Each phase can be verified independently before moving to the next.
