# Technical Specification — feature_004: UI/UX Improvements

## Overview

Frontend-only improvements to the Search and Detail pages focusing on information hierarchy, compactness, colored status tags, and usability enhancements. No backend changes required.

---

## 1. Column Filters on Search Page

### Current State
- Filters exist in a lateral sidebar (xl+) or collapsible accordion (mobile) with 5 fields: tarea_id, tarea, responsable, tema, estado.
- Filtering requires clicking the "Buscar" button or pressing Enter.

### Target State
- Add **inline column filter inputs** directly below each column header in the results table.
- Filter inputs appear as small text inputs or dropdowns inside a second header row.
- Columns with filter inputs: `tarea_id` (text), `tarea` (text), `responsable` (text), `tema` (text), `estado` (dropdown using EstadoBadge colors).
- Date columns (`fecha_siguiente_accion`, etc.) do not get inline filters.
- These are **client-side filters** that filter the already-fetched results (they complement, not replace, the existing server-side filter panel).
- Typing in a column filter immediately narrows the visible rows (debounced ~300ms).
- Column filters are cleared when a new server-side search is performed.

### Technical Approach
- Add a `columnFilters` state object `{ columnKey: filterValue }` to SearchPage.
- Add a filter row `<tr>` after the header `<tr>` in the table `<thead>`.
- Each filterable column gets a small `<Input>` or `<select>` in the filter row.
- Apply `useMemo` to filter `results` before rendering rows: case-insensitive `includes` for text fields, exact match for estado.
- Column filters should be visually subtle (smaller font, muted border).

---

## 2. Information Hierarchy — tarea_id De-emphasis

### Search Results Table
- `tarea_id` column cells: render in `text-xs text-muted-foreground font-mono` (smaller, muted, monospace).
- `tarea` column cells: render in `text-sm font-medium` (normal weight, slightly emphasized).

### Detail Page Header
- Current: tarea_id is the main heading.
- Target: tarea_id displayed as a small, muted label above the tarea name. The tarea name (`tarea`) becomes the primary heading.
- Layout:
  ```
  ← Back
  tarea_id (text-xs text-muted-foreground font-mono)
  Tarea Name (text-2xl font-bold)                   [Estado] [Responsable] [Fecha Sig.]
  ```

### Side Drawer Header
- Current: tarea_id is the SheetTitle.
- Target: Same hierarchy — tarea_id as small muted text, tarea name as the prominent title.
- Layout:
  ```
  tarea_id (text-xs text-muted-foreground font-mono)
  Tarea Name (text-lg font-semibold)
  ```

---

## 3. Compact Acciones Realizadas

### Detail Page
- Current: Table inside a Card with generous spacing.
- Target: More compact table rows with reduced padding (`py-1.5` instead of default `py-3`).
- On wide screens (lg+): the acciones section spans the full container width (remove any max-width constraints).
- Column widths: fecha (narrow, fixed ~100px), accion (flex/grow), estado (narrow ~120px), actions (narrow ~80px).
- Font size: `text-sm` for all cells.

### Side Drawer
- Current: Acciones rendered as a list with date, text, and estado badge.
- Target: More compact list items — reduce spacing between items, use `text-sm`, single-line layout where possible.
- Each accion item: `fecha | accion text | EstadoBadge` in a row with `gap-2`.

---

## 4. Colored Estado Tags (EstadoBadge Enhancements)

### Current EstadoBadge Mapping
```
"En Curso" → destructive (red)
"Completado" / "Continuar en otra tarea" → success (green)
"Cancelado" → secondary (gray)
default → outline
```

### Enhanced Mapping (add accion estados)
The existing mappings are for **tarea estados**. We need to also handle **accion estados** from `estados_acciones`:
```
"Pendiente" → destructive (red)
"En Progreso" → warning (amber/yellow)
"Completada" → success (green)
```

The EstadoBadge component already handles both — we just need to add the missing mappings for accion estados:
- Add `"Pendiente"` → `destructive`
- Add `"En Progreso"` → `warning`
- Add `"Completada"` → `success`

**Case-insensitive matching:** The comparison is normalized to lowercase so that database values in any case (e.g., "COMPLETADO", "Completado", "completado") all resolve correctly.

This ensures colored tags appear consistently in:
- Side drawer acciones list
- Detail page acciones table
- Search page inline expanded acciones

---

## 5. fecha_siguiente_accion in Detail Header

### Current State
- `fecha_siguiente_accion` only appears in the "Datos de la Tarea" accordion (collapsed by default).

### Target State
- Display `fecha_siguiente_accion` prominently in the Detail page header, alongside estado and responsable.
- Render as a Badge with `outline` variant and a `Calendar` icon prefix.
- Format using `formatDate()` utility.
- If null/empty, do not display (skip the badge entirely).

### Layout
```
tarea_id (small)
Tarea Name (large)              [EstadoBadge] [Responsable Badge] [📅 DD/MM/YYYY]
```

---

## 6. Notas Anteriores Accordion

### Current State (Detail Page)
- Rendered as a Card with heading and plain text content, always visible when notas exist.

### Target State
- Convert to a collapsible Accordion section, **closed by default**.
- Use the existing `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` components from `components/ui/accordion.jsx`.
- Trigger text: "Notas Anteriores" with chevron indicator.
- Content: whitespace-preserved text display (same as current).
- Only render the accordion if `notas_anteriores` is non-empty (same condition as current).

---

## 7. Keyboard Shortcut — Ctrl+Shift+F

### Current State
- SearchPage already has `Ctrl+Shift+F` to focus the tarea filter input.
- DetailPage has no keyboard shortcuts.

### Target State
- On DetailPage, register `Ctrl+Shift+F`:
  - Navigate to `/search`
  - After navigation, focus the tarea filter input.
- Implementation: Use `useEffect` to register `keydown` listener on mount, clean up on unmount.
- Navigation: Use `navigate('/search', { state: { focusTareaInput: true } })`.
- SearchPage: Check `location.state?.focusTareaInput` on mount — if true, focus the tarea input ref.

---

## 8. Sticky Search Page Title

### Current State
- The "Busqueda de Tareas" title scrolls away with the page content.
- The table column headers are already sticky.

### Target State
- Make the title row sticky at the top (below the Navbar).
- Use `sticky top-16 z-30 bg-background` (top-16 to account for the Navbar height).
- The title bar should include the title and the action buttons (column configurator, new tarea button).
- Add a subtle bottom border or shadow when sticky to visually separate from content below.

---

## 9. Placeholder Action Buttons in Search Results

### Target State
- For each tarea row in the search results table, add a new "Acciones" column on the far right.
- Two icon buttons per row:
  1. **Añadir Accion**: `Plus` icon from lucide-react (or `ListPlus`).
  2. **Cambiar Fecha Siguiente Accion**: `CalendarClock` icon from lucide-react.
- Buttons use `variant="ghost" size="icon"` styling with Tooltip labels.
- Buttons are **non-functional** for now — clicking shows a `toast.info("Proximamente")` notification.
- Buttons should not interfere with the row click-to-navigate behavior (use `e.stopPropagation()`).

---

## Component Changes Summary

| File | Changes |
|------|---------|
| `SearchPage.jsx` | Column filters row, tarea_id styling, sticky title, action buttons column, focus on nav state |
| `DetailPage.jsx` | Header hierarchy (sticky), fecha_siguiente_accion badge, notas accordion, compact acciones, Ctrl+Shift+F |
| `EstadoBadge.jsx` | Add Pendiente/En Progreso/Completada mappings, case-insensitive matching |
| `formatDate.js` | No changes needed |
| `version.js` | Bump minor version |
| `changelog.js` | Add feature_004 entry |

---

## Files NOT Changed

- No backend changes
- No database changes
- No new dependencies needed (all icons from lucide-react, all UI components already exist)
