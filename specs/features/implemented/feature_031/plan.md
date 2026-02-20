# Feature 031: Implementation Plan

Status: Planning
Date: February 2026

## Summary

Four frontend-only improvements across 9 files (3 new, 6 modified). No backend changes. Implementation in 4 phases with clear dependencies: Phase 4 (sidebar) is independent, Phase 1 (selection) must precede Phase 2 (copy), Phase 3 (paste) is independent.

## Phase 1: Row Selection with Checkboxes

### Step 1.1: Modify DataGrid.jsx — Add selection column and props

**File:** `frontend/src/features/search/components/DataGrid.jsx`

- Add new props: `rowSelection`, `onRowSelectionChange`
- Prepend a select column to `tableColumns` in `useMemo`:
  - `id: 'select'`, `size: 40`
  - Header: `<input type="checkbox">` wired to `table.getIsAllPageRowsSelected()` and `table.getToggleAllPageRowsSelectedHandler()`
  - Indeterminate: use ref callback `el.indeterminate = table.getIsSomePageRowsSelected()`
  - Cell: `<input type="checkbox">` wired to `row.getIsSelected()` and `row.getToggleSelectedHandler()`
- Update `useReactTable` config:
  - Add `enableRowSelection: true`
  - Add `onRowSelectionChange` from props
  - Add `state: { rowSelection }` from props
  - Add `getRowId: (row) => row.portfolio_id`
- Add selected row highlighting: conditional `bg-primary/5` class on `<tr>` when `row.getIsSelected()`
- Loading skeleton: add an empty `<th>` for the checkbox column, increment `SkeletonTableRow` columns by 1
- Empty state: increment `colSpan` from `columns.length + 1` to `columns.length + 2`
- Checkbox column header in loading/empty states: add `<th className="p-3 w-10"></th>` before column headers

### Step 1.2: Modify SearchPage.jsx — Wire selection state

**File:** `frontend/src/features/search/SearchPage.jsx`

- Add state: `const [rowSelection, setRowSelection] = useState({})`
- Clear selection inside `executeSearch`: add `setRowSelection({})` after `setResults(response)`
- Pass to DataGrid: `rowSelection={rowSelection}` and `onRowSelectionChange={setRowSelection}`
- Compute selected IDs: `const selectedIds = useMemo(() => Object.keys(rowSelection).filter(id => rowSelection[id]), [rowSelection])`

## Phase 2: Copy Selected Portfolio IDs to Clipboard

### Step 2.1: Create CopySelectedButton.jsx

**File:** `frontend/src/features/search/components/CopySelectedButton.jsx` (NEW)

```
Props: { selectedIds: string[] }
- Return null if selectedIds.length === 0
- State: copied (boolean, resets after 2s)
- onClick: navigator.clipboard.writeText(selectedIds.join(', '))
- Success: toast.success(`N Portfolio ID(s) copiado(s) al portapapeles`)
- Error: toast.error('No se pudo copiar al portapapeles')
- Icon: Copy (default) / Check (after copy, 2s)
- Label: "Copiar N IDs"
- Style: Button variant="outline" size="sm"
```

### Step 2.2: Integrate in SearchPage.jsx toolbar

**File:** `frontend/src/features/search/SearchPage.jsx`

- Import `CopySelectedButton`
- Add `<CopySelectedButton selectedIds={selectedIds} />` in toolbar div (alongside ColumnConfigurator and ExportDropdown)
- Optionally show selection count in the right side of toolbar when > 0 selected

## Phase 3: Paste Bulk Portfolio IDs

### Step 3.1: Add onPaste handler in FilterPanel.jsx

**File:** `frontend/src/features/search/components/FilterPanel.jsx`

- Add `handlePaste` function:
  ```
  1. e.preventDefault()
  2. Get pasted text: e.clipboardData.getData('text')
  3. Normalize: replace /[\n\r\t;|]+/g with ','
  4. Split on ',', trim each, filter empty
  5. Deduplicate with new Set()
  6. Merge with existing filter value (split, trim, filter, deduplicate)
  7. updateFilter('portfolioId', mergedIds.join(', '))
  ```
- Add `onPaste={handlePaste}` to the Portfolio ID `<Input>` element

## Phase 4: Detail Page Sticky Sidebar Navigation

### Step 4.1: Create shared SidebarNav component

**File:** `frontend/src/components/shared/SidebarNav.jsx` (NEW)

- Extract IntersectionObserver logic from `DashboardNav.jsx`
- Props: `items: Array<{label: string, anchor: string, badge?: number|'exists'}>`
  - `badge: 'exists'` → renders a small filled dot (`h-2 w-2 rounded-full bg-primary`)
  - `badge: number > 0` → renders a count in a rounded pill (`text-[10px] bg-muted rounded-full`)
  - `badge: undefined` → renders nothing
- Link layout changed from `block` to `flex items-center justify-between` to accommodate badge on the right
- IntersectionObserver setup in `useEffect` with dependency on `items`
- Same config: `rootMargin: '-80px 0px -40% 0px'`, `threshold: [0, 0.25, 0.5, 0.75, 1]`
- Same Tailwind classes as DashboardNav (identical visual style)
- handleClick: `el.scrollIntoView({ behavior: 'smooth', block: 'start' })`

### Step 4.2: Refactor DashboardNav.jsx

**File:** `frontend/src/features/dashboard/components/DashboardNav.jsx`

- Import `SidebarNav` from `@/components/shared/SidebarNav`
- Keep `NAV_ITEMS` array (9 items, unchanged)
- Replace entire component body with: `return <SidebarNav items={NAV_ITEMS} />`
- Dashboard behavior must be identical (regression-safe)

### Step 4.3: Create DetailNav.jsx

**File:** `frontend/src/features/detail/components/DetailNav.jsx` (NEW)

- Import `SidebarNav` from `@/components/shared/SidebarNav`
- Define `SECTIONS` array with all 19 sections, each having: `label`, `anchor`, `key` (data key in portfolio response), `type` (`'single'` or `'multi'`)
- Accept `data` prop (the portfolio detail response object)
- Compute badges via `useMemo`: for `'single'` type, badge is `'exists'` if data present; for `'multi'` type, badge is the array length
- Render `<SidebarNav items={items} />`

### Step 4.4: Modify SectionAccordion.jsx — Add id and scroll margin

**File:** `frontend/src/features/detail/components/SectionAccordion.jsx`

- Add `id={id}` to the outer `<Accordion>` element (currently only used as `value`/`defaultValue`)
- Add `scroll-mt-20` to the `className`: change `cn('mb-4', className)` to `cn('mb-4 scroll-mt-20', className)`

### Step 4.5: Modify DetailPage.jsx — Add flex layout with sidebar

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Import `DetailNav` from `./components/DetailNav`
- Wrap the content inside `<div className="container mx-auto py-6">` with flex layout:
  ```jsx
  <div className="flex gap-6">
    <DetailNav data={data} />
    <div className="min-w-0 flex-1">
      {/* All 19 SectionAccordion blocks stay here */}
    </div>
  </div>
  ```
- The modals at the end stay outside the flex wrapper (they're portal-based, position doesn't matter)

## Implementation Order

1. **Phase 4** — Shared SidebarNav + DetailNav (independent, no risk to other phases)
2. **Phase 1** — Row selection (foundation for Phase 2)
3. **Phase 2** — Copy button (depends on Phase 1 selection state)
4. **Phase 3** — Paste normalization (independent)

## Verification

1. `cd frontend && npm run build` — must pass
2. Dashboard sidebar works identically (regression)
3. Detail page: sidebar visible on xl+, click-to-scroll works, active section highlights
4. Search page: checkboxes appear, select-all works, selection clears on search/page/sort
5. Copy: select rows → button appears → click → toast → clipboard has comma-separated IDs
6. Paste: copy multiline text → paste into Portfolio ID → normalizes to comma-separated
