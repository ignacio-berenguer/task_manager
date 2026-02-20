# Implementation Plan — feature_023: Column Ordering in Search & Report Pages

## Phase 1: Install Dependencies

1. Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` to frontend:
   ```bash
   cd frontend && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

## Phase 2: Create Shared ColumnConfigurator Component

### Step 2.1: Create `SortableColumnItem.jsx`
- **File:** `frontend/src/components/shared/SortableColumnItem.jsx`
- A single draggable row in the "Columnas Visibles" list.
- Uses `useSortable` from `@dnd-kit/sortable`.
- Renders: drag handle icon (GripVertical) + column label + remove button (X icon).
- Prevents removal if it's the last column.

### Step 2.2: Create `ColumnConfigurator.jsx`
- **File:** `frontend/src/components/shared/ColumnConfigurator.jsx`
- Trigger: Button with Settings2 icon + "Columnas" label + badge count (same look as current selectors).
- Opens a `Dialog` with two sections:
  - **Top:** "Columnas Visibles" — `DndContext` + `SortableContext` wrapping `SortableColumnItem` list. Uses `verticalListSortingStrategy` and `closestCenter` collision detection.
  - **Bottom:** "Columnas Disponibles" — Grouped by category using collapsible sections. Each column has a checkbox. Checked = visible. Clicking adds to end of visible list or removes.
- **Footer:** "Restaurar por defecto" button.
- On `onDragEnd`, reorder the `selectedColumns` array and call `onColumnsChange`.
- On toggle/remove, update the array and call `onColumnsChange`.

## Phase 3: Integrate into Search Page

### Step 3.1: Update `SearchPage.jsx`
- Replace import of `ColumnSelector` with `ColumnConfigurator`.
- Replace `<ColumnSelector ... />` in JSX with:
  ```jsx
  <ColumnConfigurator
    selectedColumns={columns}
    onColumnsChange={setColumns}
    onReset={resetColumns}
    allColumns={ALL_COLUMNS}
    defaultColumns={DEFAULT_COLUMNS}
  />
  ```
- Import `ALL_COLUMNS` from `columnDefinitions` and `DEFAULT_COLUMNS` from `searchStorage`.

### Step 3.2: Clean up `useSearchPreferences.js` (optional)
- Remove `columnOrder` / `setColumnOrder` / `setColumnOrderState` state since it's unused.
- Remove `loadColumnOrder` / `saveColumnOrder` imports.
- Update `resetColumns` to only reset `columns` (remove `columnOrder` reset).

## Phase 4: Integrate into Report Pages

### Step 4.1: Update `GenericReportPage.jsx`
- Replace import of `ReportColumnSelector` with `ColumnConfigurator`.
- Replace `<ReportColumnSelector ... />` in JSX with:
  ```jsx
  <ColumnConfigurator
    selectedColumns={columns}
    onColumnsChange={setColumns}
    onReset={resetColumns}
    allColumns={[...reportColumns, ...additionalColumns]}
    defaultColumns={defaultColumnIds}
  />
  ```

### Step 4.2: Update custom `ReportPage.jsx` (Hechos)
- Check if this page uses `ReportColumnSelector` directly.
- If so, apply the same replacement pattern as Step 4.1.

## Phase 5: Testing

1. **Search page:**
   - Open column configurator dialog
   - Verify all visible columns appear in top section in current order
   - Drag a column to reorder — verify table updates immediately
   - Remove a column — verify it disappears from table and appears unchecked in available list
   - Add a column from available list — verify it appears at bottom of visible list and in table
   - Click "Restaurar por defecto" — verify default columns and order restored
   - Reload page — verify custom order persists from localStorage
   - Verify sorting, pagination, filters, export all still work

2. **Report pages (each variant):**
   - Same tests as search page
   - Verify report-specific columns appear correctly
   - Verify per-report localStorage isolation (changing order in Hechos doesn't affect LTPs)

3. **Edge cases:**
   - Try to remove all columns — should prevent removing the last one
   - Reset with no changes — should work without errors
   - Very many columns selected — scrolling should work in both sections

## Phase 6: Documentation

1. Update `specs/architecture_frontend.md` — document the ColumnConfigurator component and DnD dependency.
2. Update `README.md` — mention column reordering in the frontend features section.

## Estimated File Changes

| Action | File |
|--------|------|
| CREATE | `frontend/src/components/shared/ColumnConfigurator.jsx` |
| CREATE | `frontend/src/components/shared/SortableColumnItem.jsx` |
| MODIFY | `frontend/src/features/search/SearchPage.jsx` |
| MODIFY | `frontend/src/features/search/hooks/useSearchPreferences.js` |
| MODIFY | `frontend/src/features/reports/components/GenericReportPage.jsx` |
| MODIFY | `frontend/src/features/reports/ReportPage.jsx` (if applicable) |
| MODIFY | `frontend/package.json` (new dependencies) |
| MODIFY | `specs/architecture_frontend.md` |
| MODIFY | `README.md` |
