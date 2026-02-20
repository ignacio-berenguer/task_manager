# Technical Specification — feature_023: Column Ordering in Search & Report Pages

## 1. Overview

Add drag-and-drop column reordering to the Search page and all report pages. Users can rearrange visible columns by dragging them in the Column Selector panel. The custom order is persisted to localStorage per page and can be reset to defaults.

**Scope:** Frontend-only feature. No backend changes required.

## 2. Current State

### Search Page (`/src/features/search/`)
- `useSearchPreferences` already exposes `columnOrder` / `setColumnOrder` state and localStorage persistence (`portfolio-search-column-order`), but this value is never used — the `columns` array (visibility list) is passed directly to `DataGrid`, and its order determines display order.
- `ColumnSelector` only handles show/hide toggling via checkboxes.

### Report Pages (`/src/features/reports/`)
- `useReportPreferences` stores `columns` per prefix (`portfolio-report-{prefix}-columns`). No separate column order storage exists.
- `ReportColumnSelector` handles show/hide toggling only.
- `GenericReportPage` passes `columns` directly to TanStack table definitions.

### Key Insight
In both cases, the **array order of `columns`** already determines display order. The problem is that there's no UI to rearrange this array — new columns are always appended at the end, and the order otherwise matches the definition order.

## 3. Technical Design

### 3.1 Approach: Reorderable List in Column Selector

Add a drag-and-drop reorderable list inside each Column Selector dropdown/panel. This approach:
- Keeps the existing toggle (show/hide) behavior intact
- Adds drag handles to reorder the **selected** columns
- Persists the ordered list to localStorage
- Uses `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, accessible, React-native DnD library)

### 3.2 New Dependency

```
@dnd-kit/core       — Core DnD engine (~12KB gzipped)
@dnd-kit/sortable   — Sortable preset (~5KB gzipped)
@dnd-kit/utilities  — Helper utilities (~1KB gzipped)
```

These are well-maintained, tree-shakeable, and designed for React. They support keyboard accessibility (arrow keys to reorder) out of the box.

### 3.3 Column Selector UI Redesign

Replace the dropdown menu with a **Dialog** (modal) to provide enough space for both column visibility toggles and drag-and-drop reordering.

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Configurar Columnas                    [X] │
│─────────────────────────────────────────────│
│                                             │
│  Columnas Visibles (drag to reorder)        │
│  ┌─────────────────────────────────────┐    │
│  │ ⠿ Portfolio ID                   ✕  │    │
│  │ ⠿ Nombre                         ✕  │    │
│  │ ⠿ Unidad                         ✕  │    │
│  │ ⠿ Estado                         ✕  │    │
│  │ ⠿ Importe 2026                   ✕  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Columnas Disponibles                       │
│  ┌─────────────────────────────────────┐    │
│  │ ▸ Identificación                    │    │
│  │     □ Nombre Corto                  │    │
│  │     □ Código SAP                    │    │
│  │ ▸ Clasificación                     │    │
│  │     □ Cluster                       │    │
│  │     □ Tipo                          │    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Restaurar por defecto]                    │
└─────────────────────────────────────────────┘
```

- **Top section:** "Columnas Visibles" — draggable sorted list of currently visible columns, each with a remove (✕) button and a drag handle (⠿).
- **Bottom section:** "Columnas Disponibles" — grouped by category (accordion/collapsible), with checkboxes to add columns. Adding a column appends it to the bottom of the visible list.
- **Reset button:** Restores both selection and order to defaults.

### 3.4 Shared Component: `ColumnConfigurator`

Create a single shared component that works for both Search and Report pages:

**File:** `frontend/src/components/shared/ColumnConfigurator.jsx`

**Props:**
```javascript
{
  selectedColumns: string[],       // Ordered array of visible column IDs
  onColumnsChange: (cols) => void, // Callback with new ordered array
  onReset: () => void,             // Reset to defaults
  allColumns: Array<{id, label, category}>,  // All available columns
  defaultColumns: string[],        // Default column IDs (for reset)
  triggerLabel?: string,           // Button label (default: "Columnas")
}
```

**Behavior:**
- Opening the dialog shows the current ordered visible columns in the top sortable list.
- Dragging a column in the top list reorders it. Uses `@dnd-kit/sortable` with `verticalListSortingStrategy`.
- Clicking ✕ on a visible column removes it (minimum 1 column must remain).
- Checking a column in the bottom section adds it to the end of the visible list.
- Unchecking a column in the bottom section removes it from the visible list.
- "Restaurar por defecto" resets selection and order to `defaultColumns`.
- Closing the dialog (or clicking done) calls `onColumnsChange` with the final ordered array.

### 3.5 Storage Changes

#### Search Page
- **Remove** the separate `columnOrder` state from `useSearchPreferences`. The `columns` array itself will hold the ordered list. The existing `portfolio-search-column-order` localStorage key becomes unused (can be cleaned up).
- The `columns` array already determines display order — no DataGrid changes needed.

#### Report Pages
- **No storage changes needed.** The `columns` array in `useReportPreferences` already determines order. The reordering simply rearranges this array.

### 3.6 Integration Points

#### Search Page (`SearchPage.jsx`)
- Replace `<ColumnSelector>` with `<ColumnConfigurator>`.
- Pass `ALL_COLUMNS` as the available columns.
- Pass `columns` / `setColumns` / `resetColumns` from `useSearchPreferences`.

#### Generic Report Page (`GenericReportPage.jsx`)
- Replace `<ReportColumnSelector>` with `<ColumnConfigurator>`.
- Pass `[...reportColumns, ...additionalColumns]` as available columns.
- Pass `columns` / `setColumns` / `resetColumns` from `useReportPreferences`.

#### Custom Report Page (Hechos `ReportPage.jsx`)
- Same replacement if it uses `ReportColumnSelector` directly.

### 3.7 Export Behavior

The export functionality (`exportData`) already uses the `columns` array in order, so exports will automatically respect the user's custom column order. No changes needed.

## 4. Files to Create

| File | Description |
|------|-------------|
| `frontend/src/components/shared/ColumnConfigurator.jsx` | Shared column config dialog with DnD reordering |
| `frontend/src/components/shared/SortableColumnItem.jsx` | Individual draggable column item component |

## 5. Files to Modify

| File | Change |
|------|--------|
| `frontend/src/features/search/SearchPage.jsx` | Replace `ColumnSelector` with `ColumnConfigurator` |
| `frontend/src/features/search/hooks/useSearchPreferences.js` | Remove unused `columnOrder` state (optional cleanup) |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Replace `ReportColumnSelector` with `ColumnConfigurator` |
| `frontend/src/features/reports/ReportPage.jsx` | Replace column selector if applicable |
| `frontend/package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |

## 6. Files Unchanged (No Deletion)

The old `ColumnSelector.jsx` and `ReportColumnSelector.jsx` files will no longer be imported but can be kept or removed as a cleanup step. They are not used elsewhere.

## 7. Accessibility

- `@dnd-kit` provides keyboard support: Tab to focus a drag handle, Space/Enter to pick up, Arrow keys to move, Space/Enter to drop.
- The dialog is accessible via the existing `Dialog` component (focus trap, Escape to close).
- Screen reader announcements are built into `@dnd-kit`.

## 8. Constraints

- No backend changes.
- Existing column visibility, filtering, sorting, pagination, and export functionality must continue working exactly as before.
- The feature is purely additive — it adds reordering capability on top of existing show/hide.
