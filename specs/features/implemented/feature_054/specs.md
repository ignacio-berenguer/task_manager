# Feature 054 — Navigation Enhancements: Technical Specifications

## Overview

A batch of four UI improvements to navigation and routing, originating from the feature_052 audit (items A1, A2, A6, A7). The goal is to improve wayfinding, reduce clicks, and enable deep-linking within the Portfolio Digital application.

---

## S1. Breadcrumb Navigation (A1)

### Design

A `Breadcrumb` component rendered inside `Layout.jsx`, positioned between the Navbar and the `<main>` content area. Breadcrumbs reflect the current navigation path and provide one-click access to parent routes.

### Route Metadata

Define a `ROUTE_META` map in a new file `frontend/src/lib/routeMeta.js`. Each entry maps a route pattern to its breadcrumb label and parent:

```js
export const ROUTE_META = {
  '/dashboard':                    { label: 'Dashboard',              parent: null },
  '/search':                       { label: 'Busqueda',              parent: '/dashboard' },
  '/detail/:portfolio_id':         { label: ':portfolio_id',          parent: '/search',    dynamic: true },
  '/informes/hechos':              { label: 'Hechos',                 parent: '/dashboard' },
  '/informes/ltps':                { label: 'LTPs',                   parent: '/dashboard' },
  '/informes/acciones':            { label: 'Acciones',               parent: '/dashboard' },
  '/informes/etiquetas':           { label: 'Etiquetas',              parent: '/dashboard' },
  '/informes/justificaciones':     { label: 'Justificaciones',        parent: '/dashboard' },
  '/informes/dependencias':        { label: 'Dependencias',           parent: '/dashboard' },
  '/informes/descripciones':       { label: 'Descripciones',          parent: '/dashboard' },
  '/informes/notas':               { label: 'Notas',                  parent: '/dashboard' },
  '/informes/documentos':          { label: 'Documentos',             parent: '/dashboard' },
  '/informes/transacciones':       { label: 'Transacciones',          parent: '/dashboard' },
  '/informes/transacciones-json':  { label: 'Transacciones JSON',     parent: '/dashboard' },
  '/register':                     { label: 'Registro',               parent: '/dashboard' },
  '/jobs':                         { label: 'Trabajos',               parent: '/dashboard' },
  '/parametricas':                 { label: 'Parametricas',           parent: '/dashboard' },
  '/parametricas/etiquetas-destacadas': { label: 'Etiquetas Destacadas', parent: '/parametricas' },
}
```

### Component: `Breadcrumb.jsx`

- **Location:** `frontend/src/components/shared/Breadcrumb.jsx`
- **Behavior:**
  1. Uses `useLocation()` to get the current path.
  2. Matches the path against `ROUTE_META` (handling dynamic segments like `:portfolio_id`).
  3. Walks the `parent` chain to build the breadcrumb trail.
  4. For the detail page, if `location.state?.from` contains a referrer route, use that as the parent instead of the default `/search`. This integrates with the cross-page navigation pattern already in use.
  5. The last breadcrumb (current page) is plain text; all others are clickable `<Link>` elements.
- **Styling:**
  - Horizontal list with `/` or `>` separator (using `text-muted-foreground`).
  - Small text (`text-sm`), muted colors, matching the graduated-opacity pattern.
  - Container: `w-full px-6 sm:px-8 xl:px-12 py-2 bg-muted/10 border-b`.
- **Visibility:** Only on protected routes (not landing, sign-in, sign-up). The breadcrumb component checks whether the current route is in `ROUTE_META`; if not, it renders nothing.
- **Public routes:** The component renders nothing on `/`, `/sign-in`, `/sign-up`.

### Integration into Layout

Modify `Layout.jsx` to render `<Breadcrumb />` between `<Navbar />` and `<main>`. Since the Breadcrumb only renders on protected routes, no conditional logic is needed in Layout itself.

### Sticky Header Adjustment

Currently `DetailHeader` uses `sticky top-16`. With the breadcrumb bar adding ~36px of height, `DetailHeader` needs `top-[calc(4rem+36px)]` or similar. However, since the breadcrumb scrolls away with content (it is NOT sticky), no adjustment is needed. The breadcrumb sits in the document flow between navbar and content.

---

## S2. Enhanced Back Button in DetailHeader (A2)

### Design

Enhance the existing back button in `DetailHeader.jsx` to display context-aware text based on `location.state`.

### Navigation State Contract

Pages that link to the Detail page must include a `from` object in `location.state`:

```js
// From Search page
navigate(`/detail/${pid}`, { state: { from: { route: '/search', label: 'Busqueda' } } })

// From Dashboard
navigate(`/detail/${pid}`, { state: { from: { route: '/dashboard', label: 'Dashboard' } } })

// From a Report page
navigate(`/detail/${pid}`, { state: { from: { route: '/informes/hechos', label: 'Informe Hechos' } } })
```

### DetailHeader Changes

```jsx
const location = useLocation();
const navigate = useNavigate();
const fromState = location.state?.from;

const handleBack = () => {
  if (fromState?.route) {
    navigate(fromState.route);
  } else {
    navigate(-1);
  }
};

const backLabel = fromState?.label ? `Volver a ${fromState.label}` : 'Volver';
```

### Source Pages to Update

All places that create `<Link to={/detail/...}>` or `navigate(/detail/...)` need to pass `state.from`:

1. **SearchPage** — Result table rows linking to detail.
2. **Dashboard** — "Recent Changes" list, "Top Value" list, any initiative links.
3. **Report pages** — Any portfolio_id link in report results.
4. **Detail page itself** — Links to other initiatives (dependencias, grupos) should carry `from` with the current detail route.

The approach: identify all places where `/detail/` links are generated and add the `state` parameter. A shared helper `detailLink(pid, fromRoute, fromLabel)` can standardize this.

### Fallback Behavior

If `location.state` is absent (e.g., direct URL entry, bookmark), the button shows "Volver" and uses `navigate(-1)`.

---

## S3. Recent Initiatives Dropdown (A6)

### Storage

- **Key:** `recentStorage = createStorage('portfolio-recent')`
- **Data shape:** Array of `{ portfolio_id, nombre, timestamp }`, max 10 entries.
- **Storage key:** `recentStorage.saveJSON('initiatives', [...])`

### Hook: `useRecentInitiatives`

A custom hook in `frontend/src/features/detail/hooks/useRecentInitiatives.js`:

```js
export function useRecentInitiatives() {
  const [recents, setRecents] = ...;

  const addRecent = (portfolio_id, nombre) => { ... };
  const clearRecents = () => { ... };

  return { recents, addRecent, clearRecents };
}
```

- **addRecent:** Prepends the initiative, removes duplicates (by `portfolio_id`), truncates to 10.
- **clearRecents:** Empties the list.
- **Initialization:** Loads from localStorage on mount.

### Integration in DetailPage

When the Detail page loads (data fetch succeeds), call `addRecent(portfolioId, nombre)` to record the visit.

### Navbar Dropdown

Add a new dropdown in the Navbar (between "Busqueda" and the "Informes" dropdown) displaying recent initiatives:

- **Trigger:** Clock/History icon (`Clock` from lucide-react) + "Recientes" label.
- **Dropdown items:** Up to 10 entries, each showing `portfolio_id — nombre` (truncated).
- **Click:** Navigates to `/detail/{portfolio_id}` with `state.from = { route: location.pathname, label: 'Recientes' }`.
- **Empty state:** "Sin iniciativas recientes" disabled item.
- **Footer:** "Limpiar historial" button that calls `clearRecents()`.
- **Mobile:** Include in the mobile hamburger menu as a collapsible section.

### Styling

Follow the existing Navbar dropdown pattern (used by Informes, Trabajos, Parametricas). Same hover states, padding, font sizes.

---

## S4. Section URL Anchors in Detail Page (A7)

### Hash → Scroll on Mount

When the Detail page loads with a URL hash (e.g., `/detail/SPA_25_11#hechos`):

1. After data loads and sections render, read `window.location.hash`.
2. Find the corresponding `SectionAccordion` by ID.
3. If the accordion is collapsed, expand it.
4. Scroll the element into view with `scrollIntoView({ behavior: 'smooth' })`.

**Implementation:**
- Add a `useEffect` in `DetailPage.jsx` that runs after data is loaded.
- Use `document.getElementById(hash)` to find the section.
- The `SectionAccordion` component needs to support a controlled `open` prop or an imperative `expand()` method. Since it uses Radix Accordion, we can control `value` (the open items) at the `DetailPage` level.

### Scroll → Hash Sync

When the user scrolls or clicks a sidebar nav item, update the URL hash:

- **SidebarNav** already tracks the active section via IntersectionObserver.
- When the active section changes, call `window.history.replaceState(null, '', '#' + sectionId)` (using `replaceState` to avoid polluting browser history).
- When no section is in view (e.g., user scrolled to the very top above all sections), remove the hash.

**Implementation:**
- Modify `SidebarNav.jsx` to accept an `onActiveSectionChange` callback.
- In `DetailPage.jsx`, use that callback to update the URL hash.

### Sidebar Click → Hash

When the user clicks a sidebar nav item:
- SidebarNav already scrolls to the section. Additionally, update the URL hash immediately (don't wait for IntersectionObserver).

### Controlled Accordion State

Currently, `SectionAccordion` manages its own open/closed state internally (uncontrolled Radix Accordion). To support hash-driven expansion:

- Lift the accordion state to `DetailPage.jsx` using a `openSections` state (array of section IDs).
- Pass `open` and `onToggle` props to each `SectionAccordion`.
- `defaultOpen` sections are computed on initial render based on data presence (existing behavior).
- Hash-targeted sections are force-opened on mount.
- User can still toggle sections freely after mount.

### Copyable Section Links

When hovering over a section title in the accordion, show a small link icon. Clicking it copies the deep-link URL (`/detail/{pid}#sectionId`) to the clipboard. This is a nice-to-have enhancement.

---

## Cross-Cutting Concerns

### Performance

- Breadcrumb: Pure computation from route metadata, no API calls. Negligible overhead.
- Recent initiatives: localStorage reads are synchronous but fast. The hook initializes once per Navbar render.
- URL hash sync: `replaceState` is a no-op for the browser (no navigation). IntersectionObserver is already running.

### Accessibility

- Breadcrumb: Use `<nav aria-label="Breadcrumb">` with `<ol>` list structure.
- Back button: Clear text label (not just an icon).
- Recent dropdown: Standard dropdown keyboard navigation (already provided by the Navbar dropdown pattern).
- Section anchors: `aria-expanded` already managed by Radix Accordion.

### Mobile

- Breadcrumb: Truncate middle items with `...` if the trail exceeds available width. Always show first and last.
- Recent dropdown: Visible in the mobile hamburger menu.
- URL hash: Works the same on mobile; sidebar is hidden but hash still functions for direct links.

### Files Created

| File | Purpose |
|------|---------|
| `frontend/src/lib/routeMeta.js` | Route metadata for breadcrumbs |
| `frontend/src/components/shared/Breadcrumb.jsx` | Breadcrumb component |
| `frontend/src/features/detail/hooks/useRecentInitiatives.js` | Recent initiatives hook |

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/components/layout/Layout.jsx` | Add `<Breadcrumb />` |
| `frontend/src/components/layout/Navbar.jsx` | Add Recent Initiatives dropdown |
| `frontend/src/features/detail/components/DetailHeader.jsx` | Enhanced back button |
| `frontend/src/features/detail/DetailPage.jsx` | Hash-driven scroll, controlled accordion state, addRecent call |
| `frontend/src/features/detail/components/SectionAccordion.jsx` | Controlled open/close support |
| `frontend/src/components/shared/SidebarNav.jsx` | Hash sync callback |
| `frontend/src/features/search/SearchPage.jsx` (or relevant link component) | Pass `state.from` |
| `frontend/src/features/dashboard/DashboardPage.jsx` (or subcomponents) | Pass `state.from` |
| Various report pages | Pass `state.from` on detail links |
