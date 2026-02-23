# Technical Specification — feature_012: Search Persistent State

## Overview

Preserve the Search page state (filters, results, pagination, sort, scroll position) across in-app navigation so that when a user navigates away (e.g., to a task detail page) and returns, they find the Search page exactly as they left it. State is cleared on full page refresh or logout.

## Current State Analysis

### Existing Persistence Mechanism

The Search page (`frontend/src/features/search/SearchPage.jsx`) already has a partial session persistence system:

1. **sessionStorage-based** — Uses `search-session-state` key in `sessionStorage`
2. **Saves on detail navigation** — `saveSessionState()` is called in `goToDetail()` (line ~246)
3. **Restores on mount** — Initial state reads from `savedSession.current` via `loadSessionState()`
4. **Clears after one use** — `clearSessionState()` is called after first render (line ~170)
5. **Stores:** `filters`, `results`, `page`, `sortField`, `sortDir`
6. **Does NOT store:** `columnFilters` (client-side), `expandedRows`, scroll position

### Problems with Current Approach

| Issue | Description |
|-------|-------------|
| One-shot restore | State is cleared immediately after restoration — navigating away a second time loses state |
| Explicit save only | State is only saved when clicking "go to detail" — browser back button or other navigation loses state |
| No scroll restoration | Scroll position is not tracked or restored |
| No column filter persistence | Client-side column filters are reset |
| Survives page refresh | `sessionStorage` persists across refresh, which contradicts the requirement to clear on refresh |

## Design Decision: Module-Level Cache

### Approach

Replace `sessionStorage` with a **module-level JavaScript variable** (declared outside the React component, at the top of the module file). This variable:

- **Survives in-app navigation**: The JS module remains in memory as long as the SPA is running. When the component unmounts (user navigates away) and remounts (user returns), the module-level variable retains its value.
- **Clears on page refresh**: A full page reload re-executes the module, resetting the variable to its initial value (`null`).
- **Clears on logout**: Clerk redirects to `/sign-in` which triggers a full navigation or we can explicitly clear the cache on the Clerk sign-out event.

### Why Not Other Approaches

| Alternative | Reason Rejected |
|-------------|----------------|
| `sessionStorage` | Persists across page refreshes — contradicts requirement. Also, serializing large result sets is wasteful. |
| React Context | Requires a new provider component, adds complexity. The state is only used by one page, so a shared context is overkill. |
| URL search params | Good for shareable links but complex to sync bidirectionally; adds noise to URLs for internal navigation. |
| TanStack Query cache | SearchPage doesn't use TanStack Query for search; migrating would be a larger refactor out of scope. |

### Module-Level Cache Structure

```javascript
// Declared at module level (outside component)
let searchStateCache = null

// Shape when populated:
// {
//   filters: { tarea_id, tarea, responsable, tema, estado },
//   results: { data: [...], total: N },
//   page: 0,
//   sortField: 'fecha_siguiente_accion',
//   sortDir: 'asc',
//   columnFilters: { colName: 'filterValue', ... },
//   scrollTop: 0,
// }
```

## Detailed Design

### 1. Save State on Unmount

Use a `useEffect` cleanup function to save all relevant state to the module-level cache when the component unmounts:

```javascript
useEffect(() => {
  return () => {
    searchStateCache = {
      filters,
      results,
      page,
      sortField,
      sortDir,
      columnFilters,
      scrollTop: scrollContainerRef.current?.scrollTop || 0,
    }
  }
}, [filters, results, page, sortField, sortDir, columnFilters])
```

**Important**: The cleanup function captures values via refs or the latest state to avoid stale closures. We will use a ref to track the latest state values.

### 2. Restore State on Mount

On component mount, check if `searchStateCache` is populated. If so, initialize all state from the cache:

```javascript
const cached = searchStateCache  // Read once on mount

const [filters, setFilters] = useState(() => cached?.filters || { ... defaults })
const [results, setResults] = useState(() => cached?.results || null)
const [page, setPage] = useState(() => cached?.page || 0)
const [sortField, setSortField] = useState(() => cached?.sortField || 'fecha_siguiente_accion')
const [sortDir, setSortDir] = useState(() => cached?.sortDir || 'asc')
const [columnFilters, setColumnFilters] = useState(() => cached?.columnFilters || {})
```

### 3. Restore Scroll Position

After results are rendered, restore the scroll position:

```javascript
useEffect(() => {
  if (cached?.scrollTop && results) {
    requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo(0, cached.scrollTop)
    })
  }
}, []) // Only on mount
```

A `ref` to the scrollable container (the main content area or table wrapper) is needed. Use `requestAnimationFrame` to ensure DOM has been painted before scrolling.

### 4. Skip Re-fetch When Restoring

When state is restored from cache, the initial search should be skipped (results are already available). The existing `initialSearchDone` ref logic already handles this — if `results` is non-null on mount, the initial search is skipped.

### 5. Remove Old sessionStorage Mechanism

Remove:
- `SESSION_KEY` constant
- `saveSessionState()` function
- `loadSessionState()` function
- `clearSessionState()` function
- `savedSession` ref
- The explicit `saveSessionState()` call in `goToDetail()`
- The `clearSessionState()` call in the initial `useEffect`

### 6. Clear Cache on Logout

Not strictly necessary since logout typically triggers a full page reload (Clerk redirect), which naturally clears the module-level variable. No explicit clearing needed unless the app implements a soft logout without page reload.

### 7. Logging

Add log entries using the existing `LOG` (`createLogger('Search')`):

- `LOG.debug('Restoring search state from cache')` — when cache is found on mount
- `LOG.debug('Saving search state to cache')` — when unmounting with state
- `LOG.debug('Restoring scroll position', scrollTop)` — when scroll is restored

## State Persistence Summary

| State | Currently Persisted | After Feature |
|-------|-------------------|---------------|
| Server-side filters | Partial (sessionStorage, one-shot) | Yes (module cache) |
| Search results | Partial (sessionStorage, one-shot) | Yes (module cache) |
| Page number | Partial (sessionStorage, one-shot) | Yes (module cache) |
| Sort field/direction | Partial (sessionStorage, one-shot) | Yes (module cache) |
| Column filters (client-side) | No | Yes (module cache) |
| Scroll position | No | Yes (module cache) |
| Column configuration | Yes (localStorage) | Yes (localStorage, unchanged) |
| Expanded rows | No | No (intentionally excluded — low value, complex to serialize) |

## Files Affected

| File | Change |
|------|--------|
| `frontend/src/features/search/SearchPage.jsx` | Replace sessionStorage with module-level cache; add scroll tracking and restoration |

## Non-Goals

- **URL-based state persistence** — Not implementing shareable search URLs (different feature)
- **Cross-tab state sharing** — State is per-tab, per-session only
- **Expanded rows persistence** — Low value relative to complexity (requires caching fetched acciones data)
- **Backend changes** — This is entirely a frontend feature
