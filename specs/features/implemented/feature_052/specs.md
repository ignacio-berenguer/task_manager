# Specs: feature_052 — UI/UX Audit & Improvement Backlog

## Overview

This feature is a **documentation-only audit**. No code changes are made. The output is a prioritized backlog of 41 UI/UX improvements organized into implementable batches.

## Audit Corrections

During technical analysis, two findings were adjusted:

- **F7 (Multi-select case-insensitive search):** Already implemented. `multi-select.jsx` uses `toLowerCase()` for filtering. The issue is that not all MultiSelect instances pass `searchable={true}`. Fix: enable `searchable` prop on all MultiSelect usages. Reclassified as trivial.
- **A2 (Back button):** `DetailHeader.jsx` already has a back button using `navigate(-1)`. Enhancement: show context text ("Back to Search" / "Back to Dashboard") based on `location.state`. Remains Medium.

## Batch Organization

The 41 items are grouped into **10 implementable batches**, each of which could be a standalone feature.

### Batch 1: Quick Wins — Polish & Fixes
**Items:** F7, C3, E1, F3
**Effort:** < 1 day total
**Files affected:** ~5 files

| Item | Change | File(s) |
|------|--------|---------|
| F7 | Add `searchable` prop to all MultiSelect instances | FilterPanel.jsx, FilterBar.jsx, ReportFilterPanel.jsx |
| C3 | Persist FilterPanel collapsed state to localStorage | features/search/components/FilterPanel.jsx |
| E1 | Add "Collapse All / Expand All" buttons, lift accordion state | features/detail/DetailPage.jsx |
| F3 | Add CTA button to hero: "Go to Dashboard" (auth) / "Sign In" (non-auth) | features/landing/components/HeroSection.jsx |

### Batch 2: Navigation Enhancements
**Items:** A1, A2, A6, A7
**Effort:** 2-3 days
**Files affected:** ~8 files

| Item | Change | File(s) |
|------|--------|---------|
| A1 | Create Breadcrumb component, add to Layout for protected routes | components/shared/Breadcrumb.jsx, Layout.jsx, App.jsx (route metadata) |
| A2 | Enhance DetailHeader back button with context text from location.state | features/detail/components/DetailHeader.jsx |
| A6 | Track recently viewed initiatives in localStorage, add dropdown to Navbar | components/layout/Navbar.jsx, lib/recentInitiatives.js |
| A7 | Update URL hash on section scroll/click, restore on mount | features/detail/DetailPage.jsx, SidebarNav.jsx |

### Batch 3: Search Page — Saved Searches & Filter Chips
**Items:** C1, C2, C6, C7, C8
**Effort:** 2-3 days
**Files affected:** ~6 files

| Item | Change | File(s) |
|------|--------|---------|
| C1 | Save/Load named filter presets to localStorage | SearchPage.jsx, new SavedSearchDropdown.jsx |
| C2 | Show active filters as removable chips above grid | SearchPage.jsx, new FilterChips.jsx |
| C6 | Fix export to respect user's column order and visible selection | features/search/components/ExportDropdown.jsx |
| C7 | Persist row selection as portfolio_id Set across pagination | SearchPage.jsx (selection state) |
| C8 | Validate portfolio_id format on paste, show warning for invalid | FilterPanel.jsx |

### Batch 4: Dashboard Improvements
**Items:** B3, B4, B5
**Effort:** 1-2 days
**Files affected:** ~4 files

| Item | Change | File(s) |
|------|--------|---------|
| B3 | Add percentage of total to chart tooltips | features/dashboard/components/chart components |
| B4 | Add tooltip on truncated bar chart labels | Same chart components |
| B5 | Wrap FilterBar in Collapsible with toggle, persist state | DashboardPage.jsx, FilterBar.jsx |

### Batch 5: Detail Page — Tables & Sidebar
**Items:** A2 (part of Batch 2), E2, E3, E4
**Effort:** 2-3 days
**Files affected:** ~4 files

| Item | Change | File(s) |
|------|--------|---------|
| E2 | Add search input to DetailNav/SidebarNav for filtering section names | SidebarNav.jsx or DetailPage.jsx |
| E3 | Add sortable column headers to SimpleTable | features/detail/components/SimpleTable.jsx |
| E4 | Add "Export" button per section (CSV/JSON) | features/detail/components/SectionAccordion.jsx or per section |

### Batch 6: Report Enhancements
**Items:** D1, D2, D3, D4
**Effort:** 3-4 days
**Files affected:** ~4 files

| Item | Change | File(s) |
|------|--------|---------|
| D1 | Add configurable aggregation footer row to GenericReportPage | GenericReportPage.jsx, report configs |
| D2 | Add date preset buttons (Last 7 days, This Month, etc.) to date filters | ReportFilterPanel.jsx |
| D3 | Improve empty state with context-specific suggestions | GenericReportPage.jsx |
| D4 | Add saved report template management (Save/Load named configs) | GenericReportPage.jsx, new ReportTemplateDropdown.jsx |

### Batch 7: UI Components
**Items:** F1, F2, F4, F6
**Effort:** 2-3 days
**Files affected:** ~5 files

| Item | Change | File(s) |
|------|--------|---------|
| F1 | Add datepicker component (react-day-picker or similar) | new components/ui/datepicker.jsx, EntityFormModal.jsx |
| F2 | Add size variants to Dialog (sm/md/lg/xl/full) | components/ui/dialog.jsx |
| F4 | Add collapsible version ranges or search to changelog | features/landing/components/ChangelogSection.jsx |
| F6 | Create EmptyState component with icon + message + optional action | new components/shared/EmptyState.jsx |

### Batch 8: Dashboard — Advanced
**Items:** B1, B2, B7
**Effort:** 3-5 days
**Files affected:** ~6 files (+ new API endpoint)

| Item | Change | File(s) |
|------|--------|---------|
| B1 | KPI trend indicators: fetch previous period data, show deltas | DashboardPage.jsx, KPI components, new API endpoint |
| B2 | Chart export as PNG (html2canvas or recharts export) | Chart card components |
| B7 | Dynamic KPI stats from API (replace hardcoded landing page stats) | HeroSection.jsx or DashboardPage.jsx, new API endpoint |

### Batch 9: Detail Page — Advanced
**Items:** E6, E7, E8
**Effort:** 4-6 days
**Files affected:** ~6 files (+ new API endpoints)

| Item | Change | File(s) |
|------|--------|---------|
| E6 | Section edit history modal (query transacciones_json by entity) | New SectionHistoryModal.jsx, API query |
| E7 | Related initiatives widget (same cluster/tags) | New RelatedInitiatives.jsx, new API endpoint |
| E8 | Unified activity timeline (combine hechos + notas + transacciones) | New ActivityTimeline.jsx, new API endpoint |

### Batch 10: Mobile & Accessibility
**Items:** A8, A9, G1, G2, G3, G5, C4, C5, F5
**Effort:** 5-8 days
**Files affected:** many

| Item | Change | File(s) |
|------|--------|---------|
| A8 | Cross-report navigation links per row | GenericReportPage.jsx, report configs |
| A9 | GlobalSearch in mobile menu | Navbar.jsx |
| G1 | Card-based mobile view for Search DataGrid | New MobileDataGrid.jsx |
| G2 | Floating section menu button for mobile detail page | DetailPage.jsx, SidebarNav.jsx |
| G3 | Colorblind-safe chart palette with optional patterns | Theme system, chart components |
| G5 | Enhanced focus ring visibility across components | Global CSS / Tailwind config |
| C4 | Column-level filtering in DataGrid headers | DataGrid components |
| C5 | Row grouping toggle (Group by Estado/Unidad/Cluster) | DataGrid components |
| F5 | Page-specific loading skeletons | New skeleton components per page |

## Implementation Priority

```
Priority 1 (do first):   Batch 1 (Quick Wins)
Priority 2:              Batch 2 (Navigation) + Batch 4 (Dashboard basic)
Priority 3:              Batch 3 (Search) + Batch 5 (Detail tables)
Priority 4:              Batch 6 (Reports) + Batch 7 (UI Components)
Priority 5:              Batch 8 (Dashboard advanced) + Batch 9 (Detail advanced)
Priority 6 (do last):    Batch 10 (Mobile & A11y)
```

## Dependencies

- Batch 7 (F1 datepicker) should be done before Batch 6 (D2 date presets) if both are picked
- Batch 7 (F6 EmptyState) should be done before Batch 6 (D3 improved empty states)
- Batch 2 (A1 breadcrumbs) is standalone, no backend dependency
- Batches 8, 9 require **new API endpoints** (backend work)
- Batch 10 items are largely independent and can be cherry-picked
