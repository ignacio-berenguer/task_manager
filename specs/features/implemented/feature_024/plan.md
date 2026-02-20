# Implementation Plan — feature_024: Favicon and Dynamic Page Titles

## Phase 1: Favicon

1. Create `frontend/public/favicon.svg` — an SVG icon representing portfolio management
2. Update `frontend/index.html` — change `<link rel="icon">` from `vite.svg` to `favicon.svg`
3. Remove `frontend/public/vite.svg`

## Phase 2: usePageTitle Hook

1. Create `frontend/src/hooks/usePageTitle.js`
   - `usePageTitle(title)` sets `document.title` to `"{title} - Portfolio Digital"` or just `"Portfolio Digital"` if no title provided
   - Uses `useEffect` with `[title]` dependency

## Phase 3: Add Hook to All Pages

1. `LandingPage.jsx` — `usePageTitle()` (no argument, shows just "Portfolio Digital")
2. `DashboardPage.jsx` — `usePageTitle('Dashboard')`
3. `SearchPage.jsx` — `usePageTitle('Busqueda')`
4. `DetailPage.jsx` — `usePageTitle(\`Detalle ${portfolio_id}\`)` using route param
5. `ReportPage.jsx` (Hechos) — `usePageTitle('Informe Hechos')`
6. `GenericReportPage.jsx` — `usePageTitle(title)` using the config title
7. `App.jsx` — Add title-setting wrapper for sign-in/sign-up routes

## Phase 4: Documentation

1. Update `specs/architecture_frontend.md`
2. Update `README.md`

## Estimated File Changes

| Action | File |
|--------|------|
| CREATE | `frontend/public/favicon.svg` |
| CREATE | `frontend/src/hooks/usePageTitle.js` |
| MODIFY | `frontend/index.html` |
| MODIFY | `frontend/src/App.jsx` |
| MODIFY | `frontend/src/features/landing/LandingPage.jsx` |
| MODIFY | `frontend/src/features/dashboard/DashboardPage.jsx` |
| MODIFY | `frontend/src/features/search/SearchPage.jsx` |
| MODIFY | `frontend/src/features/detail/DetailPage.jsx` |
| MODIFY | `frontend/src/features/reports/ReportPage.jsx` |
| MODIFY | `frontend/src/features/reports/components/GenericReportPage.jsx` |
| DELETE | `frontend/public/vite.svg` |
| MODIFY | `specs/architecture_frontend.md` |
| MODIFY | `README.md` |
