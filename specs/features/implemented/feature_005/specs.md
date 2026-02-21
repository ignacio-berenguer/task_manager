# Technical Specification: feature_005

## Search Page UI Improvements — Active Filter Tags & Column Filter Popovers

---

### 1. Overview

This feature makes two UI improvements to the Search page:

1. **Active Filter Tags**: Display removable tags next to the result count showing all currently applied server-side filters, allowing users to quickly see and remove individual filters.
2. **Column Filter Popovers**: Replace the always-visible inline column filter row with funnel icons in column headers that open popovers on click, reclaiming vertical screen space.

Both changes are **frontend-only** — no backend modifications required.

---

### 2. Affected Files

| File | Change Type | Description |
|------|-------------|-------------|
| `frontend/src/features/search/SearchPage.jsx` | Modify | Add filter tags, replace column filter row with popover icons |
| `frontend/src/components/ui/popover.jsx` | **New** | Reusable Popover component (following shadcn/ui pattern) |
| `frontend/src/lib/version.js` | Modify | Bump minor version to 5 |
| `frontend/src/lib/changelog.js` | Modify | Add feature_005 changelog entry |
| `specs/architecture/architecture_frontend.md` | Modify | Document Popover component and Search page changes |
| `README.md` | Modify | Update if needed |

---

### 3. Feature 1: Active Filter Tags

#### 3.1 Behavior

- Tags appear in the results header bar (the row showing `"N resultado(s)"`), between the result count and the ColumnConfigurator button.
- A tag is shown for each **non-empty server-side filter** from the `filters` state object:
  - `tarea_id` — label: "ID", value: the text entered
  - `tarea` — label: "Tarea", value: the text entered
  - `responsable` — label: "Responsable", value: the selected value
  - `tema` — label: "Tema", value: the selected value
  - `estado` — label: "Estado", value: the selected value
- The default filter `estado: "En Curso"` IS shown as a tag (it's an active filter the user should be aware of).
- Each tag displays: `Label: Value` with a small `X` button.
- Clicking the `X` button:
  1. Sets that filter field to `''` (empty string) in the `filters` state
  2. Triggers `doSearch(0)` to re-execute the search without that filter
- Tags wrap to a new line if needed (flex-wrap).
- Tags use the existing `Badge` component with `variant="outline"` for a subtle appearance, plus a clickable `X` icon from lucide-react.

#### 3.2 Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ 42 resultados  [Estado: En Curso ×] [Responsable: Juan ×]  [⚙ Columns] │
├─────────────────────────────────────────────────────────────────────┤
│ Column headers...                                                    │
```

The tags area sits between the count text and the ColumnConfigurator, using `flex-wrap` and `gap-2` for layout.

#### 3.3 Implementation

- Derive active filter tags from the `filters` state using a `useMemo`:
  ```js
  const activeFilterTags = useMemo(() => {
    const labels = { tarea_id: 'ID', tarea: 'Tarea', responsable: 'Responsable', tema: 'Tema', estado: 'Estado' }
    return Object.entries(filters)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, label: labels[key], value }))
  }, [filters])
  ```
- The `removeFilter` handler:
  ```js
  const removeFilter = useCallback((key) => {
    setFilters(f => ({ ...f, [key]: '' }))
    // doSearch will be triggered after state update
  }, [])
  ```
- Use a `useEffect` that watches for filter removal and triggers search. Alternatively, call `doSearch(0)` directly after state update using a functional approach.

---

### 4. Feature 2: Column Filter Popovers

#### 4.1 Current Behavior (to be replaced)

The current `<thead>` has two rows:
1. Column headers with sort controls
2. A dedicated filter row with `<Input>` or `<select>` elements for each filterable column (`tarea_id`, `tarea`, `responsable`, `tema`, `estado`)

This second row takes permanent vertical space.

#### 4.2 New Behavior

- The second `<tr>` (filter row) is **removed entirely**.
- Each filterable column header gains a small **funnel icon** (`Filter` from lucide-react) next to the column label text.
- Clicking the funnel icon opens a **Popover** positioned below the icon, containing the filter input for that column.
- **Visual indicator**: When a column filter is active (non-empty value), the funnel icon uses a distinct color (e.g., `text-primary`) instead of `text-muted-foreground`.
- The Popover closes when:
  - Clicking outside the popover
  - Pressing `Escape`
- Non-filterable columns (dates, descripcion) show no funnel icon — same as current behavior where those columns had no filter input.
- The `columnFilters` state and `filteredData` memo remain unchanged — only the UI presentation changes.

#### 4.3 Filterable Columns

| Column | Filter Type | Current | New (in popover) |
|--------|-------------|---------|------------------|
| `tarea_id` | Text input | `<Input>` | Same `<Input>` inside popover |
| `tarea` | Text input | `<Input>` | Same `<Input>` inside popover |
| `responsable` | Text input | `<Input>` | Same `<Input>` inside popover |
| `tema` | Text input | `<Input>` | Same `<Input>` inside popover |
| `estado` | Select dropdown | `<select>` | Same `<select>` inside popover |

#### 4.4 Popover Component (`components/ui/popover.jsx`)

A new reusable Popover component following the same context-based pattern as `DropdownMenu` and `Tooltip`:

- **Popover** — context wrapper, manages open/close state
- **PopoverTrigger** — the element that toggles the popover (click)
- **PopoverContent** — the floating content panel

Key behaviors:
- Click-outside-to-close (via `mousedown` event listener on document)
- Escape-to-close (via `keydown` event listener)
- Positioned below the trigger using CSS `absolute` positioning
- Uses `align` prop (`start`, `center`, `end`) for horizontal alignment
- Styled with `bg-popover`, `border`, `shadow-md`, `rounded-md` (consistent with dropdown-menu)
- `z-50` to layer above table content

#### 4.5 Column Header Layout

```jsx
<th onClick={() => handleSort(col)}>
  <div className="flex items-center gap-1">
    <span>{COLUMN_LABELS[col]}</span>
    {sortField === col && (sortDir === 'asc' ? ' ↑' : ' ↓')}
    {isFilterable(col) && (
      <Popover>
        <PopoverTrigger onClick={e => e.stopPropagation()}>
          <Filter className={cn("h-3 w-3", columnFilters[col] ? "text-primary" : "text-muted-foreground")} />
        </PopoverTrigger>
        <PopoverContent>
          {/* filter input for this column */}
        </PopoverContent>
      </Popover>
    )}
  </div>
</th>
```

The `e.stopPropagation()` on the PopoverTrigger prevents the click from also triggering column sort.

---

### 5. Design Decisions

1. **No new dependencies**: The Popover component is built from scratch following the existing component patterns (DropdownMenu, Tooltip). No third-party popover library needed.

2. **Server-side filter tags only**: The tags show the 5 server-side filters from the sidebar panel. Client-side column filters are a separate concern and are not displayed as tags (they are transient, per-page-result filters).

3. **Immediate search on tag removal**: When a user removes a filter tag, the search is re-triggered immediately. This provides instant feedback.

4. **Popover alignment**: Column filter popovers align to `start` (left edge of the column header) to stay within the table bounds.

5. **Badge styling for tags**: Using `Badge variant="outline"` with a small X icon keeps the tags subtle and consistent with the existing design system.

---

### 6. Edge Cases

- **No active filters**: When all filters are empty, no tags are shown. The result count stands alone.
- **All filters active**: Tags wrap to multiple lines using `flex-wrap`.
- **Default estado filter**: The default "En Curso" estado filter is shown as a tag. Removing it clears the filter (sets to empty) and re-searches.
- **Popover and scroll**: Since the popover is `position: absolute` within the `<th>`, it may clip inside `overflow-x-auto`. The popover should use `z-50` and the table header is already `sticky`, which avoids most clipping issues. If needed, the popover can be rendered with higher z-index.
- **Multiple popovers**: Only one column filter popover should be open at a time. The Popover component manages its own state independently, but since each is in its own context, clicking a different funnel icon will open that popover while the previous one closes via click-outside behavior.
