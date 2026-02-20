# Feature 054 — Navigation Enhancements: Implementation Plan

## Phase 1: Route Metadata & Breadcrumb Component

**Goal:** Establish the route metadata map and build the breadcrumb UI.

### Step 1.1: Create `routeMeta.js`
- Create `frontend/src/lib/routeMeta.js` with `ROUTE_META` object.
- Each entry: `{ label, parent }` and optional `dynamic: true` for parameterized routes.
- Export a helper `buildBreadcrumbs(pathname, locationState)` that returns an array of `{ label, path }` by walking the parent chain.
- Handle the detail page specially: if `location.state?.from` exists, use that as the parent.

### Step 1.2: Create `Breadcrumb.jsx`
- Create `frontend/src/components/shared/Breadcrumb.jsx`.
- Uses `useLocation()` and `buildBreadcrumbs()` to compute the trail.
- Renders `<nav aria-label="Breadcrumb"><ol>...</ol></nav>` with `<Link>` elements.
- Separators between items (e.g., `ChevronRight` icon from lucide-react).
- Last item is plain text (current page), all others are links.
- Returns `null` if the current route is not in `ROUTE_META` (public pages).
- Style: `text-sm text-muted-foreground`, container with `px-6 sm:px-8 xl:px-12 py-2 border-b`.

### Step 1.3: Integrate into `Layout.jsx`
- Import and render `<Breadcrumb />` between `<Navbar />` and `<main>`.
- No conditional logic needed — the component self-hides on public routes.

### Step 1.4: Test
- Verify breadcrumbs show on Dashboard, Search, Detail, Reports, Parametricas.
- Verify breadcrumbs are hidden on landing, sign-in, sign-up.
- Verify detail page shows dynamic portfolio_id in the trail.
- Verify clicking a breadcrumb navigates correctly.

---

## Phase 2: Enhanced Back Button

**Goal:** Make the Detail page back button context-aware.

### Step 2.1: Update `DetailHeader.jsx`
- Read `location.state?.from` (`{ route, label }`).
- If `from.route` exists, use `navigate(from.route)` instead of `navigate(-1)`.
- Display label: `Volver a ${from.label}` or just `Volver` as fallback.

### Step 2.2: Pass `state.from` from source pages
- **Search page:** Find all `<Link to={/detail/...}>` or `navigate(/detail/...)` calls and add `state: { from: { route: '/search', label: 'Busqueda' } }`.
- **Dashboard:** Find initiative links (recent changes list, top value list, any other links) and add `state.from` with `{ route: '/dashboard', label: 'Dashboard' }`.
- **Report pages:** Find portfolio_id links in report result tables. These likely use a shared cell renderer or column definition. Add `state.from` with `{ route: '/informes/{name}', label: '{Report Name}' }`.
- **Detail page itself:** Links to other initiatives (e.g., in dependencias, grupos-iniciativas sections) should pass `state.from` with `{ route: '/detail/{currentPid}', label: currentPid }`.

### Step 2.3: Test
- Navigate from Search → Detail: back button says "Volver a Busqueda" and returns to Search.
- Navigate from Dashboard → Detail: back button says "Volver a Dashboard".
- Navigate from a Report → Detail: back button says "Volver a Informe Hechos" (etc.).
- Direct URL access: back button says "Volver" and uses browser history.

---

## Phase 3: Recent Initiatives Dropdown

**Goal:** Track recently viewed initiatives and provide quick access from the Navbar.

### Step 3.1: Create `useRecentInitiatives` hook
- Create `frontend/src/features/detail/hooks/useRecentInitiatives.js`.
- Uses `createStorage('portfolio-recent')` for persistence.
- Manages an array of `{ portfolio_id, nombre, timestamp }`, max 10 entries.
- Exports `{ recents, addRecent, clearRecents }`.
- `addRecent(pid, nombre)`: prepend, deduplicate by `portfolio_id`, truncate to 10, save.
- `clearRecents()`: empty array, save.

### Step 3.2: Record visits in DetailPage
- Import `useRecentInitiatives` in `DetailPage.jsx`.
- After data fetch succeeds (TanStack Query `isSuccess`), call `addRecent(portfolioId, nombre)`.
- Only record when data is available (not on error or loading).

### Step 3.3: Add Navbar dropdown
- In `Navbar.jsx`, add a "Recientes" dropdown between "Busqueda" nav item and the "Informes" dropdown.
- Trigger: `Clock` icon from lucide-react + "Recientes" text.
- Dropdown content: list of recent initiatives, each as `portfolio_id — nombre` (truncate nombre if needed).
- Click navigates to `/detail/{pid}`.
- Empty state: "Sin iniciativas recientes" grayed out.
- Footer: "Limpiar historial" button.
- Mobile: include in hamburger menu.
- Follow the exact same dropdown pattern used by "Informes", "Trabajos", and "Parametricas" for consistency.

### Step 3.4: Test
- Visit 3 initiatives → dropdown shows 3 entries in reverse chronological order.
- Visit same initiative again → it moves to top, no duplicates.
- Visit 11 initiatives → oldest is dropped (max 10).
- Click "Limpiar historial" → dropdown is empty.
- Refresh page → recents persist from localStorage.

---

## Phase 4: Section URL Anchors in Detail Page

**Goal:** Deep-linkable sections via URL hash, with bidirectional sync.

### Step 4.1: Lift accordion state in DetailPage
- Currently each `SectionAccordion` manages its own open/closed state.
- Create a `openSections` state array in `DetailPage.jsx`.
- Initialize it based on data presence (current `defaultOpen` logic).
- Pass `open` (boolean) and `onToggle` (callback) props to each `SectionAccordion`.
- Modify `SectionAccordion.jsx` to accept controlled props: use Radix `value` + `onValueChange` with the controlled pattern.

### Step 4.2: Hash → scroll on mount
- Add a `useEffect` in `DetailPage.jsx` that runs after data loads.
- Read `window.location.hash` (strip `#`).
- If the hash matches a section ID:
  - Add the section to `openSections` (force-expand it).
  - After a short `requestAnimationFrame` delay (to let the accordion animate open), scroll the section into view.

### Step 4.3: Scroll → hash sync
- Modify `SidebarNav.jsx` to accept an `onActiveSectionChange(sectionId)` callback.
- In the IntersectionObserver callback, when the active section changes, invoke the callback.
- In `DetailPage.jsx`, handle the callback by calling `window.history.replaceState(null, '', '#' + sectionId)`.
- When no section is visible, remove the hash: `window.history.replaceState(null, '', location.pathname + location.search)`.

### Step 4.4: Sidebar click → hash update
- When a sidebar item is clicked, immediately update the hash (don't wait for observer).
- This is already part of SidebarNav's click handler; just add the `replaceState` call there.

### Step 4.5: Test
- Load `/detail/SPA_25_11#hechos` directly → page scrolls to and expands the Hechos section.
- Scroll through sections → URL hash updates to reflect the visible section.
- Click a sidebar nav item → hash updates immediately.
- Share the URL with hash → recipient sees the correct section.
- Toggle sections open/closed → no unexpected scroll or hash changes.

---

## Phase 5: Post-Implementation Checklist

### Step 5.1: Version bump
- Increment `APP_VERSION.minor` to `54` in `frontend/src/lib/version.js`.

### Step 5.2: Changelog entry
- Add entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`:
  - Version matching new APP_VERSION
  - Feature: "feature_054"
  - Title: "Navigation Enhancements"
  - Summary: "Breadcrumb navigation, context-aware back button, recent initiatives dropdown, and deep-linkable detail sections."

### Step 5.3: Update README.md
- Add navigation features to the Frontend section.

### Step 5.4: Update architecture docs
- Update `specs/architecture/architecture_frontend.md` with:
  - Breadcrumb component and route metadata pattern.
  - Recent initiatives storage pattern.
  - URL hash sync in Detail page.
  - Enhanced back button with `location.state.from` contract.

### Step 5.5: Close feature
- Use `/close_feature feature_054` to move to implemented and commit.

---

## Dependency Graph

```
Phase 1 (Breadcrumbs) ─────────────┐
Phase 2 (Back Button) ─────────────├── Phase 5 (Checklist)
Phase 3 (Recent Initiatives) ──────┤
Phase 4 (Section URL Anchors) ─────┘
```

Phases 1–4 are independent of each other and can be implemented in any order. Phase 5 runs after all four are complete.

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Lifting accordion state breaks existing behavior | Test all 21 sections toggle correctly after refactor |
| IntersectionObserver hash updates cause jank | Use `replaceState` (not `pushState`) to avoid history pollution; debounce if needed |
| `location.state.from` lost on page refresh | Fallback to `navigate(-1)` already handles this; breadcrumbs still work via route metadata |
| Navbar crowded with new dropdown | "Recientes" dropdown is compact (icon + text); visually consistent with existing dropdowns |
| Mobile breadcrumb overflow | Truncate middle items or hide breadcrumbs on small screens if space is insufficient |
