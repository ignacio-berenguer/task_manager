# Implementation Plan: feature_014

## Quick Filter Button "Próxima semana" on Search Page

---

### Phase 1: Add State and Toggle Logic

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add `proximaSemana` state variable (boolean, default `false`) alongside existing filter state
2. Add a helper function `formatLocalDate(date)` that returns `YYYY-MM-DD` from a local Date object (avoids UTC issues with `toISOString()`)
3. Add a `toggleProximaSemana` handler that:
   - Flips the `proximaSemana` boolean
   - Calls `doSearch(0)` to re-execute with page reset

---

### Phase 2: Integrate Date Filters into doSearch

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Inside `doSearch`, after building the existing `searchFilters` array, add a conditional block:
   - If `proximaSemana` is `true`, compute `today` and `today+6` using `formatLocalDate`
   - Push two filter objects: `{field: 'fecha_siguiente_accion', operator: 'gte', value: todayStr}` and `{field: 'fecha_siguiente_accion', operator: 'lte', value: endStr}`
   - Log the date range at DEBUG level

---

### Phase 3: Add Button to Filter Panel

**File:** `frontend/src/features/search/SearchPage.jsx`

1. In `renderFilterPanel()`, add a "Próxima semana" button between the Estado filter and the Buscar/Limpiar buttons
2. Use `Button` component with `Calendar` icon from lucide-react
3. Toggle `variant` between `"outline"` (inactive) and `"default"` (active) based on `proximaSemana` state
4. Attach `toggleProximaSemana` as the `onClick` handler
5. Ensure the button renders in both the desktop sidebar and the mobile accordion layouts (since `renderFilterPanel()` is shared)

---

### Phase 4: Update Filter Tags and Clear

**File:** `frontend/src/features/search/SearchPage.jsx`

1. In the `activeFilterTags` computation, when `proximaSemana` is `true`:
   - Add a tag with label "Próxima semana" and value showing the date range in DD/MM format (e.g., "23/02 - 01/03")
   - Tag dismiss action: set `proximaSemana = false` and call `doSearch(0)`
2. In `clearFilters`, add `setProximaSemana(false)` to reset the quick filter

---

### Phase 5: Persist in Module-Level Cache

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add `proximaSemana` to the state saved in `searchStateCache` on component unmount
2. Restore `proximaSemana` from cache on component mount (default to `false` if not present)
3. Include `proximaSemana` in the `stateRef` pattern to avoid stale closures

---

### Phase 6: Version and Changelog

**File:** `frontend/src/lib/version.js`
1. Bump `APP_VERSION.minor` to `14`

**File:** `frontend/src/lib/changelog.js`
1. Add new entry at the TOP of the `CHANGELOG` array:
   - version: "0.14.0"
   - feature: "feature_014"
   - title: "Filtro rápido: Próxima semana"
   - summary: Brief description of the quick filter feature

---

### Phase 7: Documentation Updates

1. Update `README.md` — mention quick filter in the Search page description
2. Update `specs/architecture/architecture_frontend.md` — add quick filter to the Search Page section (6.2)

---

### Implementation Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
```

All phases modify frontend code only. No backend changes required.

---

### Testing

1. Click "Próxima semana" → verify search executes with correct date range filters
2. Verify the button shows active state when filter is on
3. Click again → verify filter is removed and search re-executes
4. Verify the active filter tag appears with correct date range
5. Click X on the filter tag → verify filter is removed
6. Click "Limpiar" → verify the quick filter is also cleared
7. Navigate to a detail page and back → verify the quick filter state is preserved
8. Verify the quick filter works alongside other filters (responsable, estado, etc.)
9. Verify the button renders correctly on both desktop and mobile layouts
