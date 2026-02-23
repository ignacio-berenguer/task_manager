# Implementation Plan — feature_012: Search Persistent State

## Summary

Replace the existing one-shot `sessionStorage` persistence in SearchPage with a module-level cache that automatically saves all search state on unmount and restores it on mount, including scroll position restoration.

## Single File Change

**File:** `frontend/src/features/search/SearchPage.jsx`

This is a self-contained refactor within a single file. No new files, no new dependencies, no backend changes.

## Implementation Steps

### Step 1: Add module-level cache variable

At the top of `SearchPage.jsx` (outside the component function, after imports), declare:

```javascript
let searchStateCache = null
```

### Step 2: Remove old sessionStorage functions

Delete the following:
- `SESSION_KEY` constant
- `saveSessionState()` function
- `loadSessionState()` function
- `clearSessionState()` function
- `savedSession` ref (`useRef(loadSessionState())`)

### Step 3: Update state initializers to read from module cache

Replace all `savedSession.current?.X` references in `useState` initializers with `searchStateCache?.X`:

```javascript
const [filters, setFilters] = useState(() =>
  searchStateCache?.filters || { tarea_id: '', tarea: '', responsable: '', tema: '', estado: 'En Curso' }
)
const [results, setResults] = useState(() => searchStateCache?.results || null)
const [page, setPage] = useState(() => searchStateCache?.page || 0)
const [sortField, setSortField] = useState(() => searchStateCache?.sortField || 'fecha_siguiente_accion')
const [sortDir, setSortDir] = useState(() => searchStateCache?.sortDir || 'asc')
const [columnFilters, setColumnFilters] = useState(() => searchStateCache?.columnFilters || {})
```

### Step 4: Add a scroll container ref

Add a `ref` to the scrollable content area (the `<main>` element or the table's scroll wrapper) to track and restore scroll position:

```javascript
const scrollRef = useRef(null)
```

Attach it to the appropriate scrollable DOM element in the JSX.

### Step 5: Add state ref for unmount capture

Since `useEffect` cleanup captures stale closures, use a ref that always holds the latest state:

```javascript
const stateRef = useRef()
stateRef.current = { filters, results, page, sortField, sortDir, columnFilters }
```

### Step 6: Save state on unmount via useEffect cleanup

```javascript
useEffect(() => {
  const scrollEl = scrollRef.current
  return () => {
    searchStateCache = {
      ...stateRef.current,
      scrollTop: scrollEl?.scrollTop || 0,
    }
    LOG.debug('Search state saved to cache')
  }
}, [])
```

This runs only on unmount (empty dependency array). Uses `stateRef.current` to capture the latest values.

### Step 7: Restore scroll position after mount

```javascript
const cachedScrollTop = useRef(searchStateCache?.scrollTop || 0)

useEffect(() => {
  if (cachedScrollTop.current && results && scrollRef.current) {
    requestAnimationFrame(() => {
      scrollRef.current.scrollTo(0, cachedScrollTop.current)
      cachedScrollTop.current = 0  // Only restore once
    })
  }
}, [results])
```

### Step 8: Update initialSearchDone logic

Replace:
```javascript
const initialSearchDone = useRef(!!savedSession.current?.results)
```
With:
```javascript
const initialSearchDone = useRef(!!searchStateCache?.results)
```

### Step 9: Remove explicit save call in goToDetail

Remove the `saveSessionState({ filters, results, page, sortField, sortDir })` call from `goToDetail()`. State is now automatically saved on unmount — no need to save explicitly before navigation.

### Step 10: Remove clearSessionState call

Remove the `clearSessionState()` call from the initial render `useEffect`. The module cache doesn't need explicit clearing — it naturally resets on page refresh.

### Step 11: Add debug logging

Add log statements:
- On mount when cache is found: `LOG.debug('Restoring search state from cache')`
- On unmount when saving: `LOG.debug('Search state saved to cache')`
- On scroll restore: `LOG.debug('Restoring scroll position:', scrollTop)`

### Step 12: Update version and changelog

Per project conventions:
- Increment `APP_VERSION.minor` to `12` in `frontend/src/lib/version.js`
- Add changelog entry at the top of `CHANGELOG` array in `frontend/src/lib/changelog.js`

### Step 13: Update documentation

- Update `README.md` with mention of search state persistence
- Update `specs/architecture/architecture_frontend.md` with the module-level cache pattern

## Testing Plan

1. **Basic persistence**: Go to Search → apply filters → click a task to view detail → press browser back or click Search in navbar → verify filters, results, and page are restored
2. **Scroll restoration**: Search with many results → scroll down → navigate to detail → return → verify scroll position is restored
3. **Column filters**: Apply client-side column filters → navigate away → return → verify column filters are restored
4. **Sort persistence**: Change sort field/direction → navigate away → return → verify sort is maintained
5. **Page refresh clears state**: Apply filters → refresh the page (F5) → verify default state is shown
6. **No duplicate fetch**: When restoring from cache, verify no unnecessary API call is made (check Network tab)
7. **New search works**: After restoration, verify that changing filters and searching still works correctly
8. **Clear filters**: Verify the "clear filter" functionality still works after a restore
