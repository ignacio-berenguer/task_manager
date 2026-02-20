# Implementation Plan — feature_057

## Detail Page — Tables & Sidebar Improvements

---

## Phase 1: E3 — Sortable SimpleTable Columns

**Why first:** E3 is self-contained in a single component and the sort logic is needed before E4 (export should ideally respect sort order).

### Step 1.1: Add sort state and logic to `SimpleTable`

**File:** `frontend/src/features/detail/components/SimpleTable.jsx`

1. Add `useState` for sort config: `{ key: null, direction: null }`.
2. Add sort handler that cycles: unsorted → asc → desc → unsorted.
3. Add `useMemo` that derives `sortedData` from `data` + sort config:
   - `currency` / `number`: numeric comparison, nulls last.
   - `date`: string comparison on ISO format, nulls last.
   - Default: `localeCompare('es')`, nulls last.
4. Render table body from `sortedData` instead of `data`.

### Step 1.2: Add sort icons to headers

**File:** `frontend/src/features/detail/components/SimpleTable.jsx`

1. Import `ArrowUp`, `ArrowDown`, `ArrowUpDown` from `lucide-react`.
2. Wrap each `<th>` content in a `<button>` with click handler.
3. Show appropriate icon based on sort state.
4. Skip sort button for the edit column (`onRowEdit` column has no `col.key`).
5. Style: `flex items-center gap-1 cursor-pointer hover:text-foreground`.

**Verify:** Load a detail page, click column headers in Hechos/Etiquetas/Acciones sections. Confirm sort cycles work correctly for text, date, currency, and longtext columns.

---

## Phase 2: E2 — Section Search in Sidebar

### Step 2.1: Add search input to `SidebarNav`

**File:** `frontend/src/components/shared/SidebarNav.jsx`

1. Add `useState` for search text.
2. Add `useEffect` to reset search text when `items` change (new initiative).
3. Add `useMemo` to filter items by normalized label match.
4. Import `Search`, `X` from `lucide-react`.
5. Render input at top of nav, inside the existing border container, above `<ul>`:
   - `Search` icon on the left (decorative).
   - `X` clear button on the right (visible only when text is non-empty).
   - Placeholder: `"Buscar sección..."`.
6. Render filtered items instead of all items.
7. Show "Sin coincidencias" when filter is active but no items match.

### Step 2.2: Handle IntersectionObserver interaction

**File:** `frontend/src/components/shared/SidebarNav.jsx`

1. The observer continues watching all section DOM elements (no change).
2. When `activeId` points to a section not in the filtered list, no link is highlighted — this is acceptable behavior.
3. When the user clears the search, the currently-active (scrolled-to) section highlights again.

**Verify:** Open a detail page, type in the sidebar search. Sections should filter. Clear should restore all. Scrolling should still update active section highlight.

---

## Phase 3: E4 — Per-Section Data Export

### Step 3.1: Create export utility

**New file:** `frontend/src/features/detail/utils/exportSection.js`

1. Implement `exportSectionCSV(data, columns, filename)`:
   - Build CSV header from column labels.
   - Build rows with formatted values (reuse formatting logic from SimpleTable).
   - Use `;` separator, UTF-8 BOM prefix.
   - Trigger browser download.
2. Extract `formatValue` from `SimpleTable.jsx` into a shared location (or duplicate — it's a small function). Prefer importing from SimpleTable if possible by exporting it.

### Step 3.2: Add export button to `SectionAccordion`

**File:** `frontend/src/features/detail/components/SectionAccordion.jsx`

1. Add optional `onExport` prop.
2. Import `Download` from `lucide-react`.
3. When `onExport` is provided, render a ghost icon button with the Download icon.
4. Position: in the header bar, to the left of `headerAction`.
5. Wrap in `onClick` stopPropagation (same pattern as `headerAction`).

### Step 3.3: Wire export in `DetailPage`

**File:** `frontend/src/features/detail/DetailPage.jsx`

1. Import `exportSectionCSV` utility.
2. Import column definitions from each section component (they'll need to be exported — currently they are `const` inside each file). **Alternative:** Define column arrays in DetailPage (some already have field definitions there) or re-export from sections.
   - **Chosen approach:** Export the `COLUMNS` constant from each section file that uses SimpleTable. This is a minimal change (add `export` keyword to existing `const COLUMNS`).
3. For each of the 11 SimpleTable sections, add `onExport` prop to `SectionAccordion`:
   ```jsx
   onExport={() => exportSectionCSV(hechos, HECHOS_COLUMNS, `Hechos_${portfolio_id}.csv`)}
   ```
4. Sections to wire: Hechos, Etiquetas, Acciones, LTP, Dependencias, WBEs, Justificaciones, Beneficios, Facturacion, DatosEjecucion. (Descripciones uses card layout, not SimpleTable — exclude.)

### Step 3.4: Export column constants from section files

**Files (add `export` to existing COLUMNS const):**
- `HechosSection.jsx`
- `EtiquetasSection.jsx`
- `AccionesSection.jsx`
- `LtpSection.jsx`
- `DependenciasSection.jsx`
- `WbesSection.jsx`
- `JustificacionesSection.jsx`
- `BeneficiosSection.jsx`
- `FacturacionSection.jsx`
- `DatosEjecucionSection.jsx`

**Verify:** Open a detail page, click export button on Hechos section. Confirm CSV downloads with correct filename, proper formatting, semicolon separator, and BOM. Test with Excel to verify encoding.

---

## Phase 4: Post-Implementation

### Step 4.1: Version bump and changelog

- `frontend/src/lib/version.js` → increment `APP_VERSION.minor` to `57`.
- `frontend/src/lib/changelog.js` → add entry at TOP of `CHANGELOG` array.

### Step 4.2: Update documentation

- Update `README.md` with new detail page capabilities.
- Update `specs/architecture/architecture_frontend.md` to document:
  - SidebarNav search filter.
  - SimpleTable sortable columns.
  - Per-section CSV export.

### Step 4.3: Build verification

- Run `npm run build` in `frontend/` to verify no build errors.

---

## Summary

| Phase | Effort | Files Changed |
|-------|--------|---------------|
| Phase 1 (E3 — Sort) | ~1 file | `SimpleTable.jsx` |
| Phase 2 (E2 — Search) | ~1 file | `SidebarNav.jsx` |
| Phase 3 (E4 — Export) | ~13 files | `SectionAccordion.jsx`, `exportSection.js` (new), `DetailPage.jsx`, 10 section files |
| Phase 4 (Docs) | ~4 files | `version.js`, `changelog.js`, `README.md`, `architecture_frontend.md` |
| **Total** | | **~19 files** |
