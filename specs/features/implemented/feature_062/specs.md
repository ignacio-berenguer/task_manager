# Feature 062 — Mobile & Accessibility Improvements

## Technical Specifications

### Overview

This feature implements 8 enhancements across mobile responsiveness, accessibility, and data grid capabilities. The items come from the feature_052 audit (items A8, A9, G1, G2, G3, G5, C4, C5, F5).

Given the scope, this spec organizes the items into 3 implementation phases:
- **Phase 1 (Quick Wins)**: A9, G5, F5 — isolated changes, no new UI paradigms
- **Phase 2 (Mobile UX)**: G1, G2, A8 — new mobile-oriented components
- **Phase 3 (DataGrid Advanced)**: C4, C5 — complex DataGrid extensions

---

## Spec 1: A8 — Cross-Report Navigation

### Current State
- Report tables (GenericReportPage) show data rows with `portfolio_id` linking to the Detail page.
- No way to navigate from one report to another report filtered by the same initiative.

### Design
Add a small "navigation" dropdown or icon-button group per row in report tables that links to related reports for the same `portfolio_id`.

**Approach**: Add a column to GenericReportPage called "Ver en..." (View in...) that renders a dropdown menu with links to other reports, pre-populating the `portfolio_id` filter.

**Implementation Details:**
- Add a new optional config property `crossReportLinks` to GenericReportPage config objects.
- Each link specifies: `{ label, route, filterKey }` — e.g., `{ label: 'Hechos', route: '/informes/hechos', filterKey: 'portfolio_id' }`.
- The link navigates via React Router `navigate()` with `location.state` carrying the filter value, similar to the existing Dashboard→Search navigation pattern.
- The target report page reads `location.state` on mount and applies the filter.
- Display as a small dropdown button (MoreHorizontal icon or ArrowRightFromLine icon) in the last column.

**Files to modify:**
- `frontend/src/features/reports/components/GenericReportPage.jsx` — add cross-report column rendering
- Each report config file (in App.jsx or report page files) — add `crossReportLinks` config
- Report filter panels — read `location.state` to pre-populate filters on arrival

**Cross-report link matrix:**

| From Report | Links To |
|-------------|----------|
| Hechos | Acciones, Etiquetas, LTPs, Notas |
| LTPs | Hechos, Acciones, Etiquetas |
| Acciones | Hechos, LTPs, Etiquetas |
| Etiquetas | Hechos, Acciones, LTPs |
| Notas | Hechos |
| Transacciones | Hechos |
| Transacciones JSON | Hechos |
| Justificaciones | Hechos |
| Dependencias | Hechos |
| Descripciones | Hechos |
| Documentos | Hechos |

All reports also link to Detail (`/detail/{portfolio_id}`) which is already present.

---

## Spec 2: A9 — GlobalSearch in Mobile Menu

### Current State
- `GlobalSearch` component is rendered in the Navbar, but only visible when the desktop nav is shown (`hidden md:flex`).
- Mobile menu (hamburger) has navigation links but no search capability.
- GlobalSearch itself is responsive (fixed overlay with max-width), so it works on mobile screens if triggered.

### Design
Add a "Buscar" (Search) button in the mobile menu that triggers the GlobalSearch overlay.

**Implementation Details:**
- In `Navbar.jsx`, within the mobile menu section (`md:hidden`), add a button styled like the other mobile menu items.
- Button text: "Buscar" with a Search icon.
- On click: set `isSearchOpen(true)` (the existing GlobalSearch state) and close the mobile menu (`setIsMobileMenuOpen(false)`).
- GlobalSearch component already handles the overlay, so no changes needed to GlobalSearch itself.

**Files to modify:**
- `frontend/src/components/layout/Navbar.jsx` — add search button to mobile menu section

---

## Spec 3: G1 — Card-Based Mobile View for Search

### Current State
- Search page DataGrid renders a full HTML table that scrolls horizontally on small screens.
- No alternative view for mobile.

### Design
Create a card-based view that replaces the DataGrid on small screens (< md breakpoint, 768px). Include a toggle to switch between table and card view.

**Card Layout:**
```
┌──────────────────────────────┐
│  SPA_25_001                  │  ← portfolio_id (link to detail)
│  Nombre de la iniciativa...  │  ← nombre (truncated to 2 lines)
│  ┌────────┐  ┌────────────┐  │
│  │ Estado │  │  1.500 k€  │  │  ← EstadoTag + importe
│  └────────┘  └────────────┘  │
│  Unidad: IT  |  Cluster: X  │  ← secondary fields
│                    [→]       │  ← link to detail
└──────────────────────────────┘
```

**Implementation Details:**
- Create `frontend/src/features/search/components/InitiativeCard.jsx` — single card component.
- Create `frontend/src/features/search/components/CardGrid.jsx` — grid of cards with pagination.
- Modify `SearchPage.jsx` to:
  - Add a `viewMode` state: `'table' | 'cards'`
  - Store preference in localStorage via searchStorage
  - Show toggle buttons (LayoutGrid / LayoutList icons) next to ColumnConfigurator
  - On `< md` screens, default to `'cards'`; on `>= md`, default to `'table'`
  - Render either DataGrid or CardGrid based on viewMode
- Card fields: portfolio_id (link), nombre, estado (EstadoTag), importe (CurrencyCell), unidad, cluster
- Cards support the existing row actions (quick-view drawer, navigate to detail)
- Pagination component shared with table view

**Files to create:**
- `frontend/src/features/search/components/InitiativeCard.jsx`
- `frontend/src/features/search/components/CardGrid.jsx`

**Files to modify:**
- `frontend/src/features/search/SearchPage.jsx` — add view mode toggle and conditional rendering

---

## Spec 4: G2 — Mobile Detail Page Navigation

### Current State
- Detail page has `DetailNav` (wrapping `SidebarNav`) visible only on `xl:` screens (1280px+).
- On smaller screens, users must scroll through all 20 sections with no section-jump navigation.

### Design
Add a Floating Action Button (FAB) on non-xl screens that opens a bottom sheet with section links.

**Implementation Details:**
- Create `frontend/src/features/detail/components/MobileDetailNav.jsx`:
  - Renders a FAB in the bottom-right corner (fixed position) on screens < xl.
  - FAB icon: `List` or `Menu` (lucide-react).
  - On click, opens a bottom sheet (slide-up panel) with section links.
  - Section links match the existing `DetailNav` items (with badges).
  - Clicking a section link: smooth scrolls to section, closes the sheet, updates hash.
  - Active section tracking via the same IntersectionObserver mechanism.
- Use the existing `Sheet` component (`components/ui/sheet.jsx`) configured to slide from the bottom (`side="bottom"`).
- Sheet shows: search input + scrollable section list (reuse SidebarNav content pattern).
- Hide FAB on `xl:` screens where the sidebar is visible.

**Files to create:**
- `frontend/src/features/detail/components/MobileDetailNav.jsx`

**Files to modify:**
- `frontend/src/features/detail/DetailPage.jsx` — render MobileDetailNav alongside existing layout

---

## Spec 5: G5 — Enhanced Focus Ring Visibility

### Current State
- Components use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- Some inputs use `focus-visible:ring-primary/30` which is subtle (30% opacity).
- Ring color comes from the CSS variable `--ring` which may be too subtle in some themes.

### Design
Standardize and enhance focus indicators across all interactive components.

**Changes:**
1. **Inputs**: Change from `ring-primary/30` to `ring-ring` (the standard ring color) with `ring-offset-2`. Increase border highlight from `border-primary/50` to `border-primary`.
2. **Buttons**: Already use `ring-ring` — no change needed. Verify all button variants.
3. **Select/Multi-Select**: Verify and align with input focus style.
4. **Custom Interactive Elements**: Review accordion triggers, tabs, dropdown items, and ensure they have visible focus-visible styles.
5. **Global CSS**: Optionally add a high-contrast outline fallback for forced-colors mode (Windows High Contrast).

**Files to modify:**
- `frontend/src/components/ui/input.jsx` — enhance focus ring
- `frontend/src/components/ui/multi-select.jsx` — verify focus ring
- `frontend/src/components/ui/select.jsx` — verify focus ring (if exists)
- `frontend/src/index.css` — add forced-colors fallback if needed
- Any other UI primitives with insufficient focus indicators

---

## Spec 6: C4 — Column-Level Filtering in DataGrid

### Current State
- DataGrid columns support sorting (click header) but no per-column filtering.
- Filtering is done via the FilterPanel above the grid.

### Design
Add inline column filters that appear when clicking a funnel icon in column headers.

**Implementation Details:**
- Add a `Filter` (funnel) icon next to the sort indicator in column headers.
- On click, show a popover/dropdown anchored to the header cell:
  - **Text columns**: Text input with "contains" filter.
  - **Select columns** (estado, unidad, cluster, etc.): Checkbox list of unique values.
  - **Number columns** (importes): Min/max range inputs.
  - **Date columns**: Date range picker.
- Column filters are applied **client-side** as an additional layer on top of server-side filters.
  - Rationale: Server already returns the filtered dataset. Column filters refine within that result set.
  - This avoids adding per-column filter support to every backend search endpoint.
- Visual indicator: Funnel icon is filled/highlighted when a column filter is active.
- "Clear filter" button in each popover. "Clear all column filters" button in the toolbar.
- Filter state stored in component state (not localStorage — too volatile for persistence).

**New Components:**
- `frontend/src/features/search/components/ColumnFilter.jsx` — filter popover component
- `frontend/src/features/search/components/ColumnFilterText.jsx` — text filter
- `frontend/src/features/search/components/ColumnFilterSelect.jsx` — multi-value select filter
- `frontend/src/features/search/components/ColumnFilterRange.jsx` — numeric range filter

**Files to modify:**
- `frontend/src/features/search/components/DataGrid.jsx` — add filter icon to headers, apply client-side filters
- `frontend/src/features/search/SearchPage.jsx` — add "Clear column filters" toolbar action

**Scope**: Initially for the Search DataGrid only. Report DataGrids can adopt later.

---

## Spec 7: C5 — Row Grouping in DataGrid

### Current State
- DataGrid renders a flat list of rows.
- No grouping capability.

### Design
Add a "Group by" feature to the Search page that groups rows by a selected field.

**Implementation Details:**
- Add a "Agrupar por" (Group by) dropdown to the Search toolbar, next to the view mode toggle.
- Options: "Sin agrupar" (None), "Estado", "Unidad", "Cluster", "Digital Framework", "Tipo".
- When a group field is selected:
  - Rows are grouped client-side (after server response).
  - Group headers show: field value, row count, optional aggregate (sum of importe).
  - Groups are collapsible (click header to toggle).
  - Default: all groups expanded.
- Group state (which field, which groups are collapsed) is stored in component state.
- Grouping is compatible with the table view only (cards don't group).
- When grouping is active, the ColumnConfigurator hides the grouped field from visible columns (it's redundant in the header).

**Implementation approach:**
- Use TanStack Table's built-in `getGroupedRowModel()` and `getExpandedRowModel()`.
- Or implement a simpler client-side grouping outside TanStack if the built-in API is too complex for the existing setup.
- Recommended: Simple client-side grouping with a `useMemo` that partitions `data` into `{ [groupValue]: rows[] }`, then renders group headers as special rows.

**Files to create:**
- `frontend/src/features/search/components/GroupBySelector.jsx` — group field dropdown

**Files to modify:**
- `frontend/src/features/search/SearchPage.jsx` — add group by state and selector
- `frontend/src/features/search/components/DataGrid.jsx` — render grouped rows with headers

---

## Spec 8: F5 — Page-Specific Loading Skeletons

### Current State
- All lazy-loaded routes use the same spinner fallback:
  ```jsx
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  ```
- Skeleton primitives exist: `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTableRow`.

### Design
Create page-specific skeleton screens for the main routes.

**Skeleton screens to create:**

1. **DashboardSkeleton**: 4 KPI card skeletons + 6 chart pair skeletons (2-col grid) + 2 list card skeletons.
2. **SearchSkeleton**: Filter panel skeleton (collapsed) + toolbar skeleton (buttons) + DataGrid skeleton (header + 10 rows).
3. **DetailSkeleton**: Header skeleton (breadcrumb + title) + sidebar placeholder + 5 accordion skeletons.
4. **ReportSkeleton**: Title + filter panel skeleton + DataGrid skeleton (header + 8 rows). Reusable for all report pages.

**Implementation Details:**
- Create skeleton components in `frontend/src/components/shared/skeletons/`:
  - `DashboardSkeleton.jsx`
  - `SearchSkeleton.jsx`
  - `DetailSkeleton.jsx`
  - `ReportSkeleton.jsx`
- Each skeleton uses the existing `Skeleton`, `SkeletonCard`, `SkeletonTableRow` primitives.
- Skeleton components are wrapped in `<Layout>` to show the Navbar during loading.
- Update `App.jsx` to use page-specific skeletons in Suspense fallback per route (or a mapping function).

**Files to create:**
- `frontend/src/components/shared/skeletons/DashboardSkeleton.jsx`
- `frontend/src/components/shared/skeletons/SearchSkeleton.jsx`
- `frontend/src/components/shared/skeletons/DetailSkeleton.jsx`
- `frontend/src/components/shared/skeletons/ReportSkeleton.jsx`

**Files to modify:**
- `frontend/src/App.jsx` — replace generic spinner with page-specific skeletons

---

## Cross-Cutting Concerns

### Responsive Breakpoints (Tailwind)
- `sm`: 640px (small tablets)
- `md`: 768px (tablets, mobile menu threshold)
- `lg`: 1024px
- `xl`: 1280px (sidebar nav threshold)

### No Backend Changes
All 8 items are frontend-only. No API endpoint changes or database modifications required. Cross-report navigation uses `location.state` (client-side routing).

### Accessibility Standards
- All new interactive elements must have appropriate ARIA attributes.
- Focus management: when modals/sheets open, focus moves to the content; when closed, focus returns to the trigger.
- All icons used as buttons must have `aria-label` or adjacent `sr-only` text.
- Keyboard navigation: all new features must be operable via keyboard.

### Testing
- Verify all changes with `npm run build` (no build errors).
- Manual testing at breakpoints: 375px (phone), 768px (tablet), 1024px (laptop), 1440px (desktop).
