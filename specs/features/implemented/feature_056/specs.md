# Feature 056 — Search Page Enhancements: Technical Specifications

## 1. Overview

Five UI enhancements to the Search page, identified in the feature_052 audit (items C1, C2, C6, C7, C8). All changes are frontend-only — no backend modifications required.

---

## 2. Requirement Analysis

### 2.1 C1 — Saved Searches

**Goal:** Allow users to name, save, load, and delete filter configurations.

**Current State:** Filters are persisted to `localStorage` via `portfolio-search-filters`, but only one "current" state is stored. There is no mechanism for multiple named presets.

**Design:**

- **Storage:** New localStorage key `portfolio-search-saved-searches` stores an array of `{ id, name, filters, createdAt }` objects via `createStorage('portfolio-search')`.
- **UI — Save:** A "Guardar Busqueda" button in the FilterPanel header (next to existing Aplicar/Limpiar). Clicking opens a small dialog or inline input to name the search. If the name already exists, prompt to overwrite.
- **UI — Load:** A dropdown/popover button "Busquedas Guardadas" in the FilterPanel header. Shows list of saved searches with name and creation date. Clicking a saved search loads its filters into the FilterPanel and triggers a search.
- **UI — Delete:** Each item in the saved-searches dropdown has a trash icon to delete it.
- **Constraints:** Max 20 saved searches (prevent localStorage bloat). Names must be non-empty, trimmed, max 50 chars.

**New files:**
- `frontend/src/features/search/components/SavedSearches.jsx` — SavedSearches component (save dialog + load dropdown)
- `frontend/src/features/search/hooks/useSavedSearches.js` — Hook managing saved searches CRUD in localStorage

**Modified files:**
- `frontend/src/features/search/components/FilterPanel.jsx` — Add SavedSearches button to header area
- `frontend/src/features/search/utils/searchStorage.js` — Add save/load/delete functions for saved searches

### 2.2 C2 — Filter Chips Bar

**Goal:** Show active filters as removable chip/badge elements above the data grid.

**Current State:** Active filter count is shown as a number badge in the FilterPanel header. There is no visual indication of _which_ filters are active when the panel is collapsed.

**Design:**

- **Position:** Between the FilterPanel and the Toolbar (above the DataGrid).
- **Visibility:** Only rendered when at least one filter is active.
- **Chip format:** Each chip shows `<FilterLabel>: <Value>` with an X button.
  - Text filters (portfolioId, nombre): Show truncated value (max 30 chars).
  - Multi-select filters: Show `<Label>: <count> seleccionados` if >2 values, or comma-separated values if ≤2.
  - Single-value multi-selects: Show `<Label>: <value>`.
- **Removal:** Clicking X clears that specific filter (sets to empty string for text, empty array for multi-select) and triggers `onApply()` to re-search.
- **"Limpiar todo" link:** Shown after the last chip to clear all filters at once.

**New files:**
- `frontend/src/features/search/components/FilterChips.jsx` — FilterChips component

**Modified files:**
- `frontend/src/features/search/SearchPage.jsx` — Insert FilterChips between FilterPanel and Toolbar

### 2.3 C6 — Export Respects Column Configuration

**Goal:** Ensure exports use the user's current column order and selection.

**Current State Analysis:** The current code in `SearchPage.jsx` line 212 already passes the user's `columns` (from `useSearchPreferences`) to `exportData()`. The `prepareExportData()` function in `exportHelpers.js` iterates over those columns. **The current implementation already appears to respect column configuration.**

**Verification needed:** Confirm that:
1. Column order in export matches the ColumnConfigurator order.
2. Only selected columns are exported (not all fields from the API response).
3. Export works correctly after column reorder via drag-and-drop.

**Potential issue found:** The `useExportInitiatives` hook receives only `searchRequest.filters` (not the full request with sort), so exported data might not match the visible sort order. This is worth fixing as part of this requirement — exports should respect the current sort configuration.

**Design:**
- Verify the existing export pipeline preserves column order and selection.
- Fix the export mutation to also pass `order_by` and `order_dir` so exported rows match the grid's current sort.
- Add integration test: configure columns, export, verify output columns match.

**Modified files:**
- `frontend/src/features/search/SearchPage.jsx` — Pass sort config to export mutation
- `frontend/src/features/search/hooks/useSearchInitiatives.js` — Update `useExportInitiatives` to accept sort config

### 2.4 C7 — Persistent Row Selection Across Pagination

**Goal:** Selected rows persist when changing pages, enabling multi-page selection.

**Current State:** `executeSearch()` calls `setRowSelection({})` on every search, including page changes. The `useEffect([currentPage])` triggers `executeSearch(false)` which clears selection.

**Design:**

- **Global selection state:** Replace the simple `rowSelection` state with a persistent set that survives pagination.
- **Behavior changes:**
  - Page change: Do NOT clear `rowSelection`. Pass the existing selection state to TanStack Table.
  - New search (filter apply, sort change): DO clear selection (since the result set changes).
  - TanStack Table with `getRowId: (row) => row.portfolio_id` already supports this — rows on different pages with different portfolio_ids can coexist in the selection map.
- **Selection indicator:** Show count of total selected items in the toolbar: "X seleccionados (Y en esta pagina)".
- **"Select all" checkbox behavior:** Only toggles rows on the current page (not all pages), matching common UX patterns.
- **CopySelectedButton:** Already uses `selectedIds` derived from `rowSelection`, so it will automatically work with cross-page selections.

**Modified files:**
- `frontend/src/features/search/SearchPage.jsx` — Split `executeSearch` to only clear selection on filter/sort changes, not on page changes. Add selection count to toolbar.
- `frontend/src/features/search/components/DataGrid.jsx` — No changes needed (TanStack Table handles it natively with `getRowId`).

### 2.5 C8 — Portfolio ID Paste Validation

**Goal:** Validate pasted portfolio IDs against expected format and warn on mismatches.

**Current State:** The `handlePortfolioIdPaste` function in `FilterPanel.jsx` normalizes separators and deduplicates, but performs no format validation.

**Design:**

- **Expected pattern:** Must start with `SPA_` or `INDEDSPAIN-`, followed by alphanumeric characters, hyphens, and underscores. Regex: `/^(SPA_[\w][\w-]*|INDEDSPAIN-\d+)$/i`. Covers all known formats: `SPA_YY_NNN`, `SPA_XX-YYY_NNNN`, `SPA_XX-YYY_N_GR`, `INDEDSPAIN-NNNNN`, etc.
- **Validation trigger:** On paste event, after normalization and dedup.
- **Warning display:** Show a dismissible warning message below the Portfolio ID input listing the invalid IDs. Format: "Los siguientes IDs no coinciden con el formato esperado de portfolio: ABC_001, XYZ_99". Use amber/warning styling.
- **Non-blocking:** Invalid IDs are still included in the filter — the warning is informational only.
- **Clearing:** Warning disappears when: (a) user types/clears the input manually, (b) user dismisses it with X, (c) filters are cleared.

**Modified files:**
- `frontend/src/features/search/components/FilterPanel.jsx` — Add validation logic in paste handler, add warning UI below input

---

## 3. Component Architecture

```
SearchPage.jsx
├── FilterPanel.jsx
│   ├── SavedSearches.jsx (NEW — C1)
│   │   └── useSavedSearches.js (NEW — C1)
│   └── [Portfolio ID validation warning] (C8)
├── FilterChips.jsx (NEW — C2)
├── Toolbar (columns, export, copy, favorites)
│   └── [Selection count indicator] (C7)
├── DataGrid.jsx
├── Pagination.jsx
├── InitiativeDrawer
└── LtpModal
```

---

## 4. State Management Summary

| Feature | State Location | Storage |
|---------|---------------|---------|
| C1 Saved searches | `useSavedSearches` hook | `portfolio-search-saved-searches` in localStorage |
| C2 Filter chips | Derived from `filters` (no new state) | None |
| C6 Export columns | Uses existing `columns` from `useSearchPreferences` | Already persisted |
| C7 Row selection | Existing `rowSelection` in SearchPage | In-memory (resets on navigation) |
| C8 Paste validation | Local state in FilterPanel (`invalidIds`) | None |

---

## 5. localStorage Keys (New)

| Key | Format | Max Size |
|-----|--------|----------|
| `portfolio-search-saved-searches` | `[{ id, name, filters, createdAt }]` | 20 entries max |

---

## 6. UI Text (Spanish)

| Element | Text |
|---------|------|
| Save button | "Guardar Busqueda" |
| Load dropdown | "Busquedas Guardadas" |
| Save dialog title | "Guardar Busqueda" |
| Save dialog placeholder | "Nombre de la busqueda..." |
| Save dialog confirm | "Guardar" |
| Overwrite confirm | "Ya existe una busqueda con este nombre. ¿Desea reemplazarla?" |
| Delete confirm | "¿Eliminar esta busqueda guardada?" |
| No saved searches | "No hay busquedas guardadas" |
| Max searches reached | "Maximo de 20 busquedas guardadas alcanzado" |
| Filter chip clear all | "Limpiar todo" |
| Selection count | "{X} seleccionados" |
| Paste validation warning | "Los siguientes IDs no coinciden con el formato esperado de portfolio:" |

---

## 7. Constraints

- No backend changes required.
- All new state uses localStorage (via existing `createStorage` factory) or in-memory React state.
- Existing functionality must be preserved — all changes are additive or behavioral refinements.
- UI language: Spanish (matching existing app convention).
