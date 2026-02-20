# Implementation Plan — feature_004: UI/UX Improvements

## Phase Overview

| Phase | Description | Files Modified |
|-------|-------------|----------------|
| 1 | EstadoBadge enhancements | `EstadoBadge.jsx` |
| 2 | Detail page: header hierarchy + fecha_siguiente_accion | `DetailPage.jsx` |
| 3 | Detail page: notas accordion + compact acciones | `DetailPage.jsx` |
| 4 | Detail page: Ctrl+Shift+F keyboard shortcut | `DetailPage.jsx` |
| 5 | Search page: tarea_id styling + sticky title | `SearchPage.jsx` |
| 6 | Search page: column filters | `SearchPage.jsx` |
| 7 | Search page: placeholder action buttons | `SearchPage.jsx` |
| 8 | Search page: side drawer header hierarchy + compact acciones | `SearchPage.jsx` |
| 9 | Version bump + changelog + docs | `version.js`, `changelog.js`, `README.md`, architecture docs |
| 10 | Build verification | — |

---

## Phase 1: EstadoBadge Enhancements

**File:** `frontend/src/components/shared/EstadoBadge.jsx`

Add accion estado mappings to the variant lookup:

```
"Pendiente" → "destructive"   (red)
"En Progreso" → "warning"     (amber)
"Completada" → "success"      (green)
```

These complement the existing tarea estado mappings (En Curso, Completado, Cancelado, Continuar en otra tarea). The component works the same way — it just recognizes more estado values now.

**Verification:** Existing estado displays should not change. New values get proper colors.

---

## Phase 2: Detail Page — Header Hierarchy + fecha_siguiente_accion

**File:** `frontend/src/features/detail/DetailPage.jsx`

### Header Restructure

Current header layout:
```
← Back   tarea_id (h1)   [EstadoBadge] [Responsable]
          tarea name (subtitle)
```

New header layout:
```
← Back
tarea_id (text-xs text-muted-foreground font-mono)
Tarea Name (text-2xl font-bold)       [EstadoBadge] [Responsable] [📅 fecha_sig]
```

### Steps:
1. Move the back button to its own row at the top.
2. Display `tarea_id` as a small muted label (not a heading).
3. Display `tarea` as the primary heading (`text-2xl font-bold`).
4. Keep EstadoBadge and Responsable badge in a flex row to the right (or below on mobile).
5. Add `fecha_siguiente_accion` as a Badge with `outline` variant and `Calendar` icon prefix, formatted with `formatDate()`. Only show if value exists.

---

## Phase 3: Detail Page — Notas Accordion + Compact Acciones

**File:** `frontend/src/features/detail/DetailPage.jsx`

### Notas Anteriores → Accordion
1. Replace the Card-based notas section with an Accordion component.
2. Use `type="single"` and `collapsible` props (closed by default — no `defaultValue`).
3. AccordionTrigger text: "Notas Anteriores".
4. AccordionContent: the same whitespace-preserved text display.
5. Only render if `tarea.notas_anteriores` is non-empty.

### Compact Acciones Table
1. Reduce row padding: apply `py-1.5 px-2` to `<td>` cells instead of default padding.
2. Use `text-sm` for all table cells.
3. Set column widths: fecha ~100px fixed, accion flex-grow, estado ~120px, actions ~80px.
4. On lg+ screens: ensure the acciones section uses full available width.
5. Ensure EstadoBadge in the estado column uses `size="sm"`.

---

## Phase 4: Detail Page — Ctrl+Shift+F Keyboard Shortcut

**File:** `frontend/src/features/detail/DetailPage.jsx`

1. Add a `useEffect` that registers a `keydown` event listener.
2. On `Ctrl+Shift+F`:
   - `e.preventDefault()` (prevent browser's Find dialog).
   - `navigate('/search', { state: { focusTareaInput: true } })`.
3. Clean up the listener on unmount.

**File:** `frontend/src/features/search/SearchPage.jsx`

4. In SearchPage, check `location.state?.focusTareaInput` on mount.
5. If true, focus the tarea input ref and clear the state (use `navigate(location.pathname, { replace: true, state: {} })`).

---

## Phase 5: Search Page — tarea_id Styling + Sticky Title

**File:** `frontend/src/features/search/SearchPage.jsx`

### tarea_id Cell Styling
1. In the table body cell renderer, when the column is `tarea_id`, apply: `text-xs text-muted-foreground font-mono`.

### Sticky Title Bar
1. Wrap the title row (containing "Busqueda de Tareas", column configurator button, new tarea button) in a div with:
   ```
   sticky top-16 z-30 bg-background border-b py-3
   ```
2. `top-16` accounts for the 64px Navbar height.
3. Adjust z-index to be below the Navbar (z-50) but above table content.

---

## Phase 6: Search Page — Column Filters

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add state: `const [columnFilters, setColumnFilters] = useState({})`.
2. After the header `<tr>`, add a filter `<tr>` with a small Input for each visible column:
   - Text columns (`tarea_id`, `tarea`, `responsable`, `tema`): `<Input>` with `placeholder="Filtrar..."` and `className="h-7 text-xs"`.
   - `estado` column: small `<select>` with options from the fetched estado values.
   - Date and other columns: empty cell (no filter).
3. Filter the results array before rendering using `useMemo`:
   ```javascript
   const filteredResults = useMemo(() => {
     return results.filter(row => {
       return Object.entries(columnFilters).every(([key, value]) => {
         if (!value) return true;
         const cellValue = row[key] || '';
         return cellValue.toString().toLowerCase().includes(value.toLowerCase());
       });
     });
   }, [results, columnFilters]);
   ```
4. Use `filteredResults` instead of `results` for rendering rows.
5. Clear column filters when performing a new server-side search (in the search handler).
6. Style the filter inputs to be subtle: muted border, small height.

---

## Phase 7: Search Page — Placeholder Action Buttons

**File:** `frontend/src/features/search/SearchPage.jsx`

1. Add a fixed "Acciones" column at the far right of the table (not configurable, always visible).
2. For each row, render two icon buttons:
   - `ListPlus` icon — tooltip: "Añadir Accion"
   - `CalendarClock` icon — tooltip: "Cambiar Fecha Siguiente Accion"
3. Buttons: `variant="ghost" size="icon"` with `h-7 w-7` sizing.
4. On click: `e.stopPropagation()` (prevent row navigation) + `toast.info("Proximamente")`.
5. Add the Acciones header to the fixed header row (and filter row as empty cell).

---

## Phase 8: Search Page — Side Drawer Improvements

**File:** `frontend/src/features/search/SearchPage.jsx`

### Header Hierarchy
1. In the Sheet content, change the header:
   - `tarea_id` as `text-xs text-muted-foreground font-mono` (not the SheetTitle).
   - Tarea name as the SheetTitle (`text-lg font-semibold`).

### Compact Acciones in Drawer
1. Reduce spacing between accion items (use `gap-1` or `space-y-1`).
2. Use `text-sm` for accion text.
3. Display each accion as a compact row: `fecha | accion | EstadoBadge(size="sm")`.
4. Ensure EstadoBadge uses the enhanced mappings from Phase 1.

---

## Phase 9: Version Bump + Changelog + Docs

### Version
**File:** `frontend/src/lib/version.js`
- Bump `APP_VERSION.minor` to `4` (matching feature_004).

### Changelog
**File:** `frontend/src/lib/changelog.js`
- Add entry at TOP of CHANGELOG array:
  ```javascript
  {
    version: "0.4.0",
    feature: "feature_004",
    title: "Mejoras de Interfaz",
    summary: "Filtros por columna, jerarquia visual mejorada, etiquetas de estado con colores, acciones compactas, notas en acordeon, atajo Ctrl+Shift+F, y titulo fijo en busqueda."
  }
  ```

### Architecture Docs
**File:** `specs/architecture/architecture_frontend.md`
- Update Section 6.2 (Search Page) to mention column filters, sticky title, placeholder action buttons.
- Update Section 6.3 (Detail Page) to mention header hierarchy changes, fecha_siguiente_accion in header, notas accordion.

### README
**File:** `README.md`
- Update if there are any user-facing changes worth documenting.

---

## Phase 10: Build Verification

1. Run `cd frontend && npm run build` to verify no build errors.
2. Review all changed files against specs.md for completeness.

---

## Dependencies Between Phases

```
Phase 1 (EstadoBadge) ─────┬──→ Phase 2, 3 (Detail page uses EstadoBadge)
                            └──→ Phase 5-8 (Search page uses EstadoBadge)

Phases 2, 3, 4 are sequential (all modify DetailPage.jsx)
Phases 5, 6, 7, 8 are sequential (all modify SearchPage.jsx)

Phase 9 (docs) depends on all implementation phases
Phase 10 (build) depends on Phase 9
```

## Risk Assessment

- **Low risk**: All changes are frontend-only, no API or database changes.
- **Existing behavior preserved**: The server-side filter panel remains unchanged; column filters are additive client-side filtering.
- **No new dependencies**: All icons (ListPlus, CalendarClock, Calendar) are from lucide-react (already installed). All UI components (Accordion, Badge, Tooltip) already exist.
