# Technical Specification — feature_024: Favicon and Dynamic Page Titles

## 1. Overview

Add a custom favicon and dynamic page titles to the frontend application. The favicon replaces the default Vite icon, and page titles update on each route change to reflect the current section.

**Scope:** Frontend-only feature. No backend changes required.

## 2. Current State

- `frontend/index.html` references `/vite.svg` as the favicon
- `frontend/public/` contains only `vite.svg`
- The `<title>` is static: "Portfolio Digital"
- No `document.title` usage anywhere in the codebase

## 3. Technical Design

### 3.1 Favicon

Generate an SVG favicon representing portfolio/project management (e.g., a briefcase or chart icon) using the application's primary color scheme. Place it in `frontend/public/` and update `index.html` to reference it.

Files:
- `frontend/public/favicon.svg` — SVG favicon (scalable, works at all sizes)
- `frontend/index.html` — Update `<link rel="icon">` to point to `/favicon.svg`

The old `vite.svg` can be removed.

### 3.2 Dynamic Page Titles

Create a `usePageTitle` hook that sets `document.title` on mount and when the title argument changes. Each page component calls this hook with its specific title.

**Hook:** `frontend/src/hooks/usePageTitle.js`

```javascript
import { useEffect } from 'react'

const APP_NAME = 'Portfolio Digital'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - ${APP_NAME}` : APP_NAME
  }, [title])
}
```

**Title mapping per route:**

| Route | Title |
|-------|-------|
| `/` | "Portfolio Digital" (no prefix) |
| `/sign-in` | "Iniciar Sesion - Portfolio Digital" |
| `/sign-up` | "Registrarse - Portfolio Digital" |
| `/dashboard` | "Dashboard - Portfolio Digital" |
| `/search` | "Busqueda - Portfolio Digital" |
| `/detail/:id` | "Detalle {portfolio_id} - Portfolio Digital" |
| `/informes/hechos` | "Informe Hechos - Portfolio Digital" |
| `/informes/ltps` | "Informe LTPs - Portfolio Digital" |
| `/informes/acciones` | "Informe Acciones - Portfolio Digital" |
| `/informes/etiquetas` | "Informe Etiquetas - Portfolio Digital" |
| `/informes/transacciones` | "Informe Transacciones - Portfolio Digital" |
| `/informes/transacciones-json` | "Informe Transacciones JSON - Portfolio Digital" |

### 3.3 Integration Points

Each page component adds a single `usePageTitle(...)` call at the top of its function body. For the Detail page, the title includes the `portfolio_id` from the route parameter.

For the sign-in/sign-up routes, `TitledSignIn` and `TitledSignUp` wrapper components in `App.jsx` call `usePageTitle()` and render the Clerk components.

For GenericReportPage, the hook call is `usePageTitle(`Informe ${title}`)` to prefix "Informe" to the config title (e.g., config title "LTPs" becomes page title "Informe LTPs - Portfolio Digital").

## 4. Files to Create

| File | Description |
|------|-------------|
| `frontend/public/favicon.svg` | Custom SVG favicon |
| `frontend/src/hooks/usePageTitle.js` | Hook to set document.title |

## 5. Files to Modify

| File | Change |
|------|--------|
| `frontend/index.html` | Update favicon `<link>` from `vite.svg` to `favicon.svg` |
| `frontend/src/features/landing/LandingPage.jsx` | Add `usePageTitle()` (no prefix) |
| `frontend/src/features/dashboard/DashboardPage.jsx` | Add `usePageTitle('Dashboard')` |
| `frontend/src/features/search/SearchPage.jsx` | Add `usePageTitle('Busqueda')` |
| `frontend/src/features/detail/DetailPage.jsx` | Add `usePageTitle('Detalle ...')` |
| `frontend/src/features/reports/ReportPage.jsx` | Add `usePageTitle('Informe Hechos')` |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Add `usePageTitle(`Informe ${title}`)` using config title with "Informe" prefix |
| `frontend/src/App.jsx` | Add title setting for sign-in/sign-up routes |

## 6. Files to Remove

| File | Reason |
|------|--------|
| `frontend/public/vite.svg` | Replaced by custom favicon |

## 7. Constraints

- No backend changes
- No new dependencies
- All existing functionality unchanged
