# Technical Specification — feature_016

## Search Page UI Improvements

### Overview

Three frontend-only enhancements to the Search page (`SearchPage.jsx`):

1. **Quick filter "Proximos 2 dias"** — New date-range quick filter button
2. **Condensed filter section** — Reduce vertical space used by filters
3. **Export to clipboard** — Copy visible task summaries with pending actions

No backend changes are required. All three changes are confined to the frontend Search page.

---

### 1. Quick Filter "Proximos 2 dias"

**Behavior:**
- Add a new quick filter button labeled **"Proximos 2 dias"** alongside the existing "Proxima semana" button.
- When active, filters tareas where `fecha_siguiente_accion` is between **today** and **today + 1 day** (2-day window: today and tomorrow).
- Uses the same `gte`/`lte` operator pair as "Proxima semana", just with `today + 1` instead of `today + 6`.
- Toggle behavior: clicking the button activates/deactivates it. Only one date quick filter can be active at a time — activating "Proximos 2 dias" deactivates "Proxima semana" and vice versa.
- State is preserved in the module-level cache (`searchStateCache`).
- Appears as a removable badge tag in the results bar when active, showing the DD/MM date range.
- Cleared by the "Limpiar" button.

**Implementation:**
- Add a new state variable `proximosDias` (boolean, default `false`).
- Add to `stateRef.current` and `searchStateCache` for persistence.
- In `doSearch()`, when `proximosDias` is true, add `gte`/`lte` filters for `fecha_siguiente_accion` using `today` and `today + 1`.
- In `toggleProximosDias()`, set `proximosDias` to true and `proximaSemana` to false (mutual exclusion).
- In `toggleProximaSemana()`, set `proximaSemana` to true and `proximosDias` to false.
- Add a `useEffect` watcher for `proximosDias` (same pattern as `proximaSemana`) to auto-search on toggle.
- In `activeFilterTags`, add a tag for `_proximosDias` with label "Proximos 2 dias" and DD/MM range.
- In `removeFilterTag`, handle `_proximosDias` key.
- In `clearFilters`, reset `proximosDias` to false.

**UI placement:**
- Both quick filter buttons rendered side by side in the filter panel, between the Estado dropdown and the Buscar/Limpiar buttons.

---

### 2. Condensed Filter Section

**Goal:** Reduce the vertical footprint of the filter panel (both sidebar on xl+ and mobile accordion) while keeping all functionality accessible.

**Strategy — Compact layout adjustments:**

1. **Remove individual labels**: Replace the visible `<label>` elements above each input/select with `placeholder` text inside each input/select. The fields are self-explanatory (ID, Tarea name, dropdowns).
2. **Reduce spacing**: Change `space-y-3` to `space-y-2` for the filter group.
3. **Quick filter buttons side by side**: Render "Proximos 2 dias" and "Proxima semana" as two compact buttons in a single row (flex, gap-2).
4. **Smaller quick filter buttons**: Use `size="sm"` on quick filter buttons and shorter labels.

**Expected savings:** ~40-60px vertical space on the sidebar, noticeable improvement on mobile.

---

### 3. Export to Clipboard

**Behavior:**
- A button with a clipboard icon appears in the results bar (next to the result count and column configurator).
- When clicked:
  1. For each task currently visible in `filteredData`, fetch its acciones (use existing `accionesCache` if available, otherwise fetch from API).
  2. Filter acciones to only those where `estado !== 'Completada'`.
  3. Build a string per task: `tarea_name: action1 / action2 / ...`
  4. If a task has no non-completed actions, output just `tarea_name` (no colon).
  5. Join all lines with newline `\n`.
  6. Copy to clipboard using `navigator.clipboard.writeText()`.
  7. Show a toast notification ("Copiado al portapapeles") via sonner.
  8. Button shows a brief visual state change (e.g., check icon for 2 seconds).

**Implementation:**
- Add an `exportToClipboard` async function.
- For each task in `filteredData`, call `GET /acciones/tarea/{tarea_id}` (or use cache).
- Use `Promise.all` to parallelize API calls.
- Format and copy to clipboard.
- Add a `copying` state to track loading/success state.
- Use `ClipboardCopy` and `Check` icons from lucide-react.

**UI placement:**
- In the results bar, between the filter tags and the ColumnConfigurator (right side).
- Small outline button with clipboard icon, tooltip "Copiar tareas al portapapeles".

---

### State Changes Summary

New state variables:
| Variable | Type | Default | Cache | Description |
|----------|------|---------|-------|-------------|
| `proximosDias` | boolean | false | Yes | Quick filter: next 2 days active |
| `copying` | string\|null | null | No | Clipboard export state: null, 'loading', 'done' |

Modified state/cache:
- `stateRef.current` — add `proximosDias`
- `searchStateCache` — add `proximosDias`
- `clearFilters()` — reset `proximosDias`

---

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/features/search/SearchPage.jsx` | All three features |
| `frontend/src/lib/version.js` | Bump to 1.016 |
| `frontend/src/lib/changelog.js` | Add feature_016 entry |
| `specs/architecture/architecture_frontend.md` | Update SearchPage docs |
| `README.md` | Update if needed |
