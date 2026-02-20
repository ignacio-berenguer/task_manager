# Implementation Plan — feature_025: Darker Backgrounds for Key UI Elements

## Phase 1: Initial Implementation (bg-muted at opacity levels)

1. Changed `bg-background` to `bg-muted` at graduated opacities across 10 files
2. Initial opacities: 95/60 (navbar), 50 (detail header), 40 (filter bar), 30 (page headers, filter bodies), 20 (sidebar)

## Phase 2: First Feedback — Opacities Too Subtle

1. Bumped all opacities up significantly (20→50, 30→60/70, 40→70, 50→80)
2. Still insufficient contrast because the base `--color-muted` color itself was too light

## Phase 3: Root Cause Fix — Darken CSS Variable

1. Identified root cause: `--color-muted` at 96.1% lightness in light mode is nearly white
2. Changed `--color-muted` in `frontend/src/index.css`:
   - Light mode: `hsl(210 40% 96.1%)` → `hsl(214 32% 88%)`
   - Dark mode: `hsl(217.2 32.6% 17.5%)` → `hsl(217.2 32.6% 30%)`
3. Rebalanced opacities downward since base color is now stronger

## Phase 4: Navbar Active Item Fix

1. Identified that `bg-accent` active state was invisible against darker `bg-muted` navbar
2. Changed active nav link styling from `bg-accent text-accent-foreground` to `bg-primary/15 text-primary font-semibold`
3. Applied to desktop links, mobile links, and Informes dropdown trigger

## Phase 5: Verification

1. `npm run build` — passed at each iteration
2. Visual verification in browser for light and dark modes

## Final File Changes

| Action | File |
|--------|------|
| MODIFY | `frontend/src/index.css` |
| MODIFY | `frontend/src/components/layout/Navbar.jsx` |
| MODIFY | `frontend/src/features/dashboard/components/DashboardNav.jsx` |
| MODIFY | `frontend/src/features/dashboard/DashboardPage.jsx` |
| MODIFY | `frontend/src/features/search/SearchPage.jsx` |
| MODIFY | `frontend/src/features/reports/ReportPage.jsx` |
| MODIFY | `frontend/src/features/reports/components/GenericReportPage.jsx` |
| MODIFY | `frontend/src/features/detail/components/DetailHeader.jsx` |
| MODIFY | `frontend/src/features/dashboard/components/FilterBar.jsx` |
| MODIFY | `frontend/src/features/search/components/FilterPanel.jsx` |
| MODIFY | `frontend/src/features/reports/components/ReportFilterPanel.jsx` |
