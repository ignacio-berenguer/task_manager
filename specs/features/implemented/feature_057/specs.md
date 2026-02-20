# Technical Specifications — feature_057

## Detail Page — Tables & Sidebar Improvements

**Feature:** E2 (Section search in sidebar), E3 (Sortable SimpleTable columns), E4 (Per-section data export)

---

## 1. E2 — Section Search in DetailNav Sidebar

### 1.1 Overview

Add a text input at the top of the `SidebarNav` component that filters sidebar links by section name. As the user types, only matching sections remain visible. A clear button resets the filter.

### 1.2 Component: `SidebarNav` (`frontend/src/components/shared/SidebarNav.jsx`)

**Current state:** Renders a `<nav>` with a `<ul>` of section links. No filtering capability. Used by `DetailNav` (which builds the items list from `SECTION_DEFS` and data counts).

**Changes:**

- Add `<input>` element at the top of the `<nav>`, inside the border/rounded container, above the `<ul>`.
- Input placeholder: `"Buscar sección..."`.
- Use local `useState` for the filter text.
- Filter `items` by checking if `item.label.toLowerCase()` includes the normalized input text (case-insensitive, accent-insensitive using `normalize('NFD').replace(/[\u0300-\u036f]/g, '')`).
- Show a small `X` clear button inside the input (right side) when text is non-empty. Clicking clears the filter and returns all items.
- Use `lucide-react` icons: `Search` (left placeholder icon), `X` (clear button).
- When filter is active and no items match, show a small "Sin coincidencias" message.

**Visual design:**

- Input styled consistently with existing Tailwind patterns: `text-xs`, `bg-muted/20`, border, rounded, padding.
- Input width fills the sidebar `w-full`.
- Positioned above the `<ul>` with a small gap (`mb-2`).

**Edge cases:**

- IntersectionObserver: The observer watches DOM elements by `anchor` ID. Filtering only affects **which links are rendered** in the sidebar, NOT which sections exist on the page. The observer continues to track all sections. When the active section is hidden by the filter, no link is highlighted.
- `items` prop changes: The filter should reset when items change (e.g., navigating to a different initiative).

### 1.3 No changes to `DetailNav`

`DetailNav` continues to build the items array as before and passes it to `SidebarNav`. The filtering is entirely within `SidebarNav`.

---

## 2. E3 — Sortable SimpleTable Columns

### 2.1 Overview

Add clickable sort headers to `SimpleTable` so users can sort any column in ascending, descending, or unsorted order. The visual pattern matches the Search DataGrid headers (arrow icons cycling through states).

### 2.2 Component: `SimpleTable` (`frontend/src/features/detail/components/SimpleTable.jsx`)

**Current state:** Renders a static `<table>` with `columns` definitions and `data` array. No sort capability. Headers are plain `<th>` text.

**Changes:**

- Add `sortConfig` and `onSortChange` optional props for controlled sorting from parent (future-proofing for E4 export ordering).
- Also support **internal uncontrolled mode**: if `onSortChange` is not provided, manage sort state internally with `useState`.
- Sort state: `{ key: string | null, direction: 'asc' | 'desc' | null }`.
- Header rendering: Wrap each `<th>` content in a `<button>` that cycles: unsorted → asc → desc → unsorted.
- Icons: Use `ArrowUp`, `ArrowDown`, `ArrowUpDown` from `lucide-react` (same as DataGrid).
- Sort logic:
  - `type === 'currency'` or `type === 'number'`: numeric comparison (`Number(a) - Number(b)`), nulls last.
  - `type === 'date'`: string comparison on ISO dates (already YYYY-MM-DD format), nulls last.
  - Default: `localeCompare('es')` for text, nulls last.
- Apply sorting to a `useMemo`-derived `sortedData` array (never mutate props).
- The `onRowEdit` column (pencil icon) is NOT sortable.

**Visual design:**

- Header buttons: `flex items-center gap-1 hover:text-foreground cursor-pointer`.
- Arrow icons: same size as DataGrid (`h-3.5 w-3.5`).
- Unsorted: `ArrowUpDown` with `opacity-30`.
- Active sort: `ArrowUp` (asc) or `ArrowDown` (desc) with full opacity.

### 2.3 Impact on Section Components

No changes to individual section components. They continue to pass `data` and `columns` to `SimpleTable`. The sorting is self-contained within `SimpleTable`.

**Note:** Some sections pre-sort data before passing (e.g., `HechosSection` sorts by `id_hecho`, `EtiquetasSection` sorts alphabetically, `FacturacionSection` sorts by year/month). The user's interactive sort will override these default orders. This is expected behavior — the user's explicit sort takes priority.

---

## 3. E4 — Per-Section Data Export

### 3.1 Overview

Add an "Export" button to each 1:N section that uses `SimpleTable`. When clicked, export that section's data as CSV. The export respects the current sort order from E3.

### 3.2 Approach: Export Button in `SectionAccordion` Header

Add an optional `onExport` prop to `SectionAccordion`. When provided, render a download icon button in the header area (next to the existing `headerAction` plus/edit button).

**Component: `SectionAccordion` (`frontend/src/features/detail/components/SectionAccordion.jsx`)**

- New optional prop: `onExport: () => void`.
- Render a `Download` (lucide-react) icon button when `onExport` is provided.
- Position: to the left of the existing `headerAction`, in the same row.
- Button style: `variant="ghost" size="icon" className="h-7 w-7"`, same as add/edit buttons.
- Tooltip: "Exportar datos".

### 3.3 Export Utility

Create a small utility function `exportSectionCSV(data, columns, filename)` in a new file `frontend/src/features/detail/utils/exportSection.js`.

**Logic:**

1. Build header row from `columns.map(c => c.label)`.
2. Build data rows: for each row, for each column, format value using the same `formatValue` logic from SimpleTable (date → DD/MM/YYYY, currency → number, etc.).
3. Join with `;` separator (semicolon — better for Spanish locale where comma is the decimal separator).
4. Add UTF-8 BOM (`\uFEFF`) prefix for Excel compatibility.
5. Create Blob with `type: 'text/csv;charset=utf-8'`.
6. Trigger download using an `<a>` element trick (create, click, remove).
7. Filename pattern: `{sectionTitle}_{portfolioId}.csv` (e.g., `Hechos_SPA_25_001.csv`).

### 3.4 Integration in `DetailPage`

For each section that uses `SimpleTable` (11 sections), pass an `onExport` callback to `SectionAccordion`. The callback:

1. Gets the current data (same array passed to the section component).
2. Gets the column definitions (same as passed to `SimpleTable`).
3. Calls `exportSectionCSV(data, columns, filename)`.

**Sections receiving export:** Hechos, Etiquetas, Acciones, LTP, Dependencias, WBEs, Justificaciones, Descripciones, Beneficios, Facturacion, DatosEjecucion.

**Sections NOT receiving export (non-SimpleTable):** DatosDescriptivos, InformacionEconomica, Importes, EstadoEspecial, ImpactoAatt, Notas, Documentos, Transacciones, TransaccionesJSON, GruposIniciativas.

**Sort order:** The export should respect the user's current sort from E3. To achieve this, `SimpleTable` will expose its current sorted data via a ref or callback. Simpler approach: the export function in `DetailPage` will sort the data using the same sort logic. However, since `SimpleTable` manages sort state internally, the cleanest approach is:

- `SimpleTable` accepts an optional `onSortedDataChange` callback.
- When the sorted data changes, it calls this callback with the sorted array.
- `DetailPage` stores the latest sorted data per section and uses it for export.

**Alternatively (simpler):** Since `SimpleTable`'s sort is internal and the data is small (tens of rows at most), we can re-sort at export time. But this requires knowing the current sort state from outside.

**Chosen approach:** Keep it simple. The `exportSectionCSV` function receives the raw data. The sort order in the export matches the data as-passed (pre-sorted by the section component). The interactive sort in E3 is a visual-only feature. This avoids complex state lifting. If the user wants sorted exports, they can use the Search page's full export capability. This is acceptable because:
- Detail sections have small datasets (typically <50 rows).
- The pre-sorted order from section components is already meaningful.
- Adding sort-state lifting across 11 sections adds significant complexity for minimal value.

### 3.5 Sections with Custom Tables (GruposIniciativas)

`GruposIniciativasSection` renders two sub-tables ("Como Grupo" and "Como Componente"). Export for this section would need special handling (two datasets). Exclude it from the initial implementation to keep scope manageable.

---

## 4. Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/shared/SidebarNav.jsx` | Add search input with filter logic |
| `frontend/src/features/detail/components/SimpleTable.jsx` | Add sortable column headers |
| `frontend/src/features/detail/components/SectionAccordion.jsx` | Add optional `onExport` prop + download button |
| `frontend/src/features/detail/utils/exportSection.js` | **New file** — CSV export utility |
| `frontend/src/features/detail/DetailPage.jsx` | Wire `onExport` callbacks for 11 sections |

---

## 5. Dependencies

- No new npm packages. Uses existing `lucide-react` icons (`Search`, `X`, `ArrowUp`, `ArrowDown`, `ArrowUpDown`, `Download`).
- No backend changes.
- No new API calls.

---

## 6. Non-Goals

- JSON export option (CSV only for simplicity; the Search page already has JSON/Excel export).
- Export for custom/non-SimpleTable sections (Documentos, Transacciones, TransaccionesJSON, Notas, Descripciones with cards, etc.).
- Persisting sort state to localStorage (sort resets on page navigation — acceptable for detail view).
- Multi-column sort (single column only, matching DataGrid behavior).
