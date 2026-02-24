# Implementation Plan — feature_016

## Search Page UI Improvements

### Phase 1: Quick Filter "Proximos 2 dias"

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add state variable `proximosDias` (boolean, default false), initialized from `searchStateCache`.
2. Add `proximosDias` to `stateRef.current` (line ~98).
3. Add `proximosDias` to `searchStateCache` save (unmount effect, line ~106).
4. In `doSearch()`, add date filter block for `proximosDias` (same pattern as `proximaSemana` but with `today + 1`).
5. Create `toggleProximosDias()` — sets `proximosDias(true)` and `proximaSemana(false)`.
6. Update `toggleProximaSemana()` — also sets `proximosDias(false)`.
7. Add `useEffect` watcher for `proximosDias` to auto-trigger search (same pattern as `proximaSemana` watcher).
8. In `clearFilters()`, add `setProximosDias(false)`.
9. In `activeFilterTags` memo, add tag for `_proximosDias`.
10. In `removeFilterTag()`, handle `_proximosDias` key.
11. In `renderFilterPanel()`, add "Proximos 2 dias" button next to "Proxima semana" in a flex row.

### Phase 2: Condense Filter Section

**File:** `frontend/src/features/search/SearchPage.jsx`

1. In `renderFilterPanel()`:
   - Remove the `<label>` elements above each input/select.
   - Add placeholder text to each input/select to compensate for removed labels.
   - Change outer `space-y-3` to `space-y-2`.
   - Render quick filter buttons ("Proximos 2 dias" + "Proxima semana") in a single `flex gap-2` row with `size="sm"`.

### Phase 3: Export to Clipboard

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add import for `ClipboardCopy` and `Check` from lucide-react.
2. Add state `copying` (null | 'loading' | 'done').
3. Create `exportToClipboard` async function:
   - Map over `filteredData`, fetch acciones for each task (use `accionesCache` or API).
   - Filter non-completed actions per task.
   - Build formatted string.
   - Copy to clipboard with `navigator.clipboard.writeText()`.
   - Toast success message.
   - Set `copying` to 'done', reset after 2 seconds.
4. Add button in results bar (between filter tags area and ColumnConfigurator):
   - Outline button with `ClipboardCopy` icon (or `Check` when done).
   - Tooltip: "Copiar tareas al portapapeles".
   - Disabled when `copying === 'loading'` or no results.

### Phase 4: Version, Changelog & Docs

1. **`frontend/src/lib/version.js`**: Set `minor: 16`.
2. **`frontend/src/lib/changelog.js`**: Add entry at top of CHANGELOG array.
3. **`specs/architecture/architecture_frontend.md`**: Update Search Page section to document:
   - New "Proximos 2 dias" quick filter
   - Condensed filter layout (no labels)
   - Export to clipboard button
4. **`README.md`**: Update if applicable.

### Implementation Order

1. Phase 1 (quick filter) — extends existing pattern, low risk
2. Phase 2 (condense) — UI-only changes to filter panel
3. Phase 3 (clipboard export) — new feature with API calls
4. Phase 4 (docs) — version bump, changelog, architecture update
