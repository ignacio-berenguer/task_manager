# Implementation Plan: feature_005

## Search Page UI Improvements — Active Filter Tags & Column Filter Popovers

---

### Phase 1: Create Popover UI Component

**File:** `frontend/src/components/ui/popover.jsx` (new)

1. Create a new `Popover` component following the same context-based pattern as `DropdownMenu`:
   - `Popover` — wrapper with context (open state, ref for click-outside)
   - `PopoverTrigger` — click handler to toggle, supports `asChild`
   - `PopoverContent` — absolutely-positioned floating panel with:
     - Click-outside-to-close (`mousedown` listener)
     - Escape-to-close (`keydown` listener)
     - `align` prop (start/center/end)
     - Consistent styling: `bg-popover`, `border`, `shadow-md`, `rounded-md`, `z-50`

**Verification:** Component can be imported and renders correctly in isolation.

---

### Phase 2: Add Active Filter Tags to Results Header

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add `Filter` icon import from `lucide-react` (for Phase 3, but import now).
2. Create a `useMemo` hook `activeFilterTags` that derives tags from the `filters` state:
   - Maps each non-empty filter to `{ key, label, value }`
   - Labels: `tarea_id→"ID"`, `tarea→"Tarea"`, `responsable→"Responsable"`, `tema→"Tema"`, `estado→"Estado"`
3. Create a `removeFilter` callback:
   - Sets the specified filter key to `''`
   - Immediately calls `doSearch(0)` after updating state (use a ref or direct call pattern to ensure search runs with the updated filter)
4. Modify the results header bar (the `<div>` containing result count and ColumnConfigurator):
   - Change layout to `flex flex-wrap items-center gap-2`
   - After the result count `<span>`, render the filter tags:
     - Each tag: `<Badge variant="outline">` containing the label, value text, and a clickable `<X>` icon (h-3 w-3)
     - Clicking the `X` calls `removeFilter(key)`
   - ColumnConfigurator remains at the end with `ml-auto`

**Verification:**
- Tags appear for each active filter after a search
- Clicking X removes the filter and re-triggers search
- Default "En Curso" tag appears and can be removed
- Tags wrap properly when many filters are active

---

### Phase 3: Replace Column Filter Row with Popover Icons

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Import the new `Popover`, `PopoverTrigger`, `PopoverContent` components.
2. Define a helper set or array: `FILTERABLE_COLUMNS = ['tarea_id', 'tarea', 'responsable', 'tema', 'estado']`
3. **Remove** the second `<tr>` (the filter row) from `<thead>`.
4. **Modify** the column header `<th>` elements:
   - Wrap content in a `<div className="flex items-center gap-1">` for layout
   - For filterable columns, add a `Popover` with:
     - `PopoverTrigger`: a small `Filter` icon (h-3.5 w-3.5) with `e.stopPropagation()` to prevent sort
     - Icon color: `text-primary` when `columnFilters[col]` is non-empty, `text-muted-foreground` otherwise
     - `PopoverContent`: the same filter input that was previously in the filter row (text `<Input>` or `<select>` for estado)
   - For non-filterable columns, no icon is added
5. Ensure sort arrow indicators still display correctly alongside the new layout.

**Verification:**
- The filter row no longer appears below column headers
- Funnel icons appear on filterable columns
- Clicking a funnel icon opens a popover with the filter input
- Funnel icon turns colored when a filter is active
- Clicking outside or pressing Escape closes the popover
- Column sorting still works when clicking the header text
- Client-side filtering still works identically

---

### Phase 4: Version & Changelog

**Files:**
- `frontend/src/lib/version.js` — bump `minor` to `5`
- `frontend/src/lib/changelog.js` — add entry at the TOP of the array:
  ```js
  {
    version: '0.5.0',
    feature: 'feature_005',
    title: 'Mejoras en la Busqueda: Tags de Filtros y Filtros por Columna',
    summary: 'Los filtros activos se muestran como tags removibles junto al conteo de resultados. Los filtros por columna ahora se acceden mediante un icono de embudo en el encabezado de cada columna.'
  }
  ```

---

### Phase 5: Documentation Updates

1. **`specs/architecture/architecture_frontend.md`**:
   - Add `popover.jsx` to the UI Components table (Section 8.1)
   - Update Search Page description (Section 6.2) to reflect:
     - Active filter tags in results header
     - Column filter popovers replacing the inline filter row

2. **`README.md`**: Update if any user-facing workflow descriptions mention the search page filters.

---

### Implementation Order

```
Phase 1 (Popover component)
  → Phase 2 (Filter tags)
  → Phase 3 (Column filter popovers)
  → Phase 4 (Version & changelog)
  → Phase 5 (Documentation)
```

Phases 2 and 3 could be done in either order since they are independent UI changes in the same file, but doing Phase 2 first allows verifying the filter removal logic before Phase 3 modifies the column headers.

---

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Popover clips inside `overflow-x-auto` table container | Use `z-50` and verify visually; popover is in sticky `<thead>` which helps |
| Removing a filter tag doesn't trigger search (stale closure) | Use a pattern where `removeFilter` calls `doSearch` after state update, or use `useEffect` watching specific filter keys |
| Sort indicator misaligned after adding flex layout to `<th>` | Test all column header layouts; ensure flex container doesn't break text alignment |
