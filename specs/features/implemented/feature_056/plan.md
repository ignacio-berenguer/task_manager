# Feature 056 — Search Page Enhancements: Implementation Plan

## Phase 1: C7 — Persistent Row Selection Across Pagination

**Rationale:** Start here because it touches core SearchPage state management and is the simplest change. It also unblocks testing of multi-page selection in later phases.

### Steps:

1. **Modify `SearchPage.jsx`** — Split the `executeSearch` function into two variants:
   - `executeSearch(resetPage)` — called by filter apply, sort change, page size change → clears `rowSelection`
   - Page change `useEffect([currentPage])` — calls search WITHOUT clearing `rowSelection`
   - Move `setRowSelection({})` out of `executeSearch` and into the callers that need it (handleApplyFilters, handleClearFilters, sort/pageSize effects)

2. **Add selection count to toolbar** — In the toolbar area (where "X iniciativas encontradas" is shown), add a selection indicator: `"{selectedIds.length} seleccionados"` when selectedIds.length > 0, using a Badge component.

3. **Test:** Select rows on page 1, navigate to page 2, verify page 1 selections persist. Apply a new filter, verify selections clear. Change sort, verify selections clear.

**Files modified:** `SearchPage.jsx`

---

## Phase 2: C8 — Portfolio ID Paste Validation

**Rationale:** Small, self-contained change within FilterPanel only.

### Steps:

1. **Add validation logic to `FilterPanel.jsx`** — After the paste normalization in `handlePortfolioIdPaste`:
   - Define regex: `const PORTFOLIO_ID_PATTERN = /^SPA_\d{2}_\d{1,3}$/i`
   - Filter pasted+merged IDs to find those not matching the pattern
   - Store invalid IDs in local state: `const [invalidIds, setInvalidIds] = useState([])`

2. **Add warning UI** — Below the Portfolio ID input field, render a warning block when `invalidIds.length > 0`:
   - Amber/yellow background, small text
   - List invalid IDs
   - X button to dismiss (sets `invalidIds` to `[]`)

3. **Clear warning** — Reset `invalidIds` when:
   - User types in the input (onChange handler)
   - Filters are cleared (add effect or callback)
   - New paste overwrites (re-evaluated each paste)

**Files modified:** `FilterPanel.jsx`

---

## Phase 3: C6 — Export Respects Column Configuration (Verification + Sort Fix)

**Rationale:** Mostly a verification pass since the code appears correct, plus a small fix for sort order in exports.

### Steps:

1. **Verify current behavior** — Read through the export pipeline and confirm column order/selection is respected:
   - `handleExport` passes `columns` from `useSearchPreferences`
   - `exportData` → `prepareExportData` iterates over `columns`
   - Column labels come from `getColumnDef(colId).label`

2. **Fix sort order in exports** — Currently `handleExport` builds `searchRequest` with sort config but only passes `searchRequest.filters` to `exportMutation`. Update to pass the full sort config:
   - Modify `useExportInitiatives` to accept an optional `{ order_by, order_dir }` parameter
   - Update `handleExport` to pass sort config through to the export mutation
   - This ensures exported rows match the visible grid order

3. **Test:** Configure columns (reorder, remove some), sort by a column, export in each format. Verify output matches visible configuration.

**Files modified:** `SearchPage.jsx`, `hooks/useSearchInitiatives.js`

---

## Phase 4: C2 — Filter Chips Bar

**Rationale:** New component, depends on understanding the filter structure established in previous phases.

### Steps:

1. **Create `FilterChips.jsx`** — New component that receives:
   - `filters` — current filter state object
   - `onRemoveFilter(key)` — callback to clear a specific filter
   - `onClearAll()` — callback to clear all filters

2. **Implement chip rendering logic:**
   - Map over filter keys, skip empty values
   - For each active filter, create a chip with:
     - Label mapping: `portfolioId` → "Portfolio ID", `nombre` → "Nombre", `digitalFramework` → "Digital Framework", etc.
     - Value formatting: text fields show value (truncated), multi-selects show count or values
   - Each chip has an X button calling `onRemoveFilter(filterKey)`
   - "Limpiar todo" link at the end

3. **Integrate in `SearchPage.jsx`:**
   - Import and place `FilterChips` between FilterPanel and Toolbar
   - Pass `filters`, remove handler, clear handler
   - The remove handler should: update filters (set key to empty/[]), then trigger `executeSearch(true)`

**Files created:** `components/FilterChips.jsx`
**Files modified:** `SearchPage.jsx`

---

## Phase 5: C1 — Saved Searches

**Rationale:** Most complex feature, done last. Builds on stable filter/search infrastructure.

### Steps:

1. **Create `useSavedSearches.js` hook:**
   - Uses `createStorage('portfolio-search')` with key `saved-searches`
   - State: `savedSearches` array of `{ id, name, filters, createdAt }`
   - Methods: `saveSearch(name, filters)`, `loadSearch(id)`, `deleteSearch(id)`, `renameSearch(id, newName)`
   - ID generation: `Date.now().toString(36)` for simple unique IDs
   - Max 20 entries enforcement
   - Duplicate name detection (for overwrite prompt)

2. **Create `SavedSearches.jsx` component:**
   - **Save button:** Small button (Bookmark or Save icon) in FilterPanel header area. On click:
     - Opens a small popover/dialog with a text input for the search name
     - "Guardar" button saves current filters
     - If name exists, show overwrite confirmation
   - **Load dropdown:** DropdownMenu button showing saved searches list. Each item shows:
     - Name (clickable to load)
     - Date (small muted text)
     - Trash icon (delete with confirmation)
   - Empty state: "No hay busquedas guardadas"

3. **Integrate in `FilterPanel.jsx`:**
   - Import `SavedSearches` and add to the header buttons area
   - Pass `filters` (for saving) and `onFiltersChange` + `onApply` (for loading)

4. **Add storage functions to `searchStorage.js`:**
   - `saveSavedSearches(searches)`, `loadSavedSearches()`

**Files created:** `hooks/useSavedSearches.js`, `components/SavedSearches.jsx`
**Files modified:** `FilterPanel.jsx`, `utils/searchStorage.js`

---

## Phase 6: Post-Implementation Checklist

1. **Version bump:** Increment `APP_VERSION.minor` to `56` in `frontend/src/lib/version.js`
2. **Changelog entry:** Add entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`
3. **Update `README.md`** — Add mention of saved searches, filter chips, cross-page selection
4. **Update `specs/architecture/architecture_frontend.md`** — Update Search Page section (13.x) with new features
5. **Build verification:** Run `npm run build` to ensure no errors
6. **Use `/close_feature feature_056`** to move to implemented and commit

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `SearchPage.jsx` | Modify | 1, 3, 4 |
| `components/FilterPanel.jsx` | Modify | 2, 5 |
| `hooks/useSearchInitiatives.js` | Modify | 3 |
| `components/FilterChips.jsx` | Create | 4 |
| `hooks/useSavedSearches.js` | Create | 5 |
| `components/SavedSearches.jsx` | Create | 5 |
| `utils/searchStorage.js` | Modify | 5 |
| `frontend/src/lib/version.js` | Modify | 6 |
| `frontend/src/lib/changelog.js` | Modify | 6 |
| `README.md` | Modify | 6 |
| `specs/architecture/architecture_frontend.md` | Modify | 6 |

**Estimated new files:** 3
**Estimated modified files:** 8 (including docs)
