# Technical Specification: feature_014

## Quick Filter Button "Próxima semana" on Search Page

### 1. Summary

Add a toggle button labeled "Próxima semana" to the Search page filter panel that applies a date range filter on `fecha_siguiente_accion` covering 7 days (today through today+6). The feature is frontend-only — the backend already supports `gte`/`lte` operators on date fields via `POST /api/v1/tareas/search`.

---

### 2. Scope

**In scope:**
- New toggle button in the filter panel (both desktop sidebar and mobile accordion)
- Date range calculation (today to today+6, client-side, local timezone)
- Integration with existing filter system (additive, not replacing other filters)
- Active/inactive visual state for the button
- Filter tag badge when the quick filter is active
- Persistence in the module-level search state cache
- Clearing the quick filter via "Limpiar" button

**Out of scope:**
- Backend changes (none needed)
- Other quick filter buttons (only "Próxima semana" for now)
- Configurable date ranges

---

### 3. Technical Design

#### 3.1 State Management

Add a new boolean state variable `proximaSemana` to track whether the quick filter is active:

```javascript
const [proximaSemana, setProximaSemana] = useState(false)
```

This boolean is the source of truth. The actual date values are computed fresh each time `doSearch` is called, ensuring the range always reflects "today" at the moment of search execution.

#### 3.2 Date Calculation

When `proximaSemana` is `true` and `doSearch` executes, compute:

```javascript
const today = new Date()
const todayStr = today.toISOString().slice(0, 10)  // YYYY-MM-DD
const endDate = new Date(today)
endDate.setDate(endDate.getDate() + 6)
const endStr = endDate.toISOString().slice(0, 10)   // YYYY-MM-DD
```

Then add two filter entries to the `searchFilters` array:

```javascript
searchFilters.push({ field: 'fecha_siguiente_accion', operator: 'gte', value: todayStr })
searchFilters.push({ field: 'fecha_siguiente_accion', operator: 'lte', value: endStr })
```

**Note on timezone:** Use local date parts to construct the ISO string to avoid UTC offset issues. The safer approach:

```javascript
const fmt = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
```

#### 3.3 Filter Panel UI

Place the "Próxima semana" button in the filter panel, between the last filter field (Estado) and the action buttons (Buscar/Limpiar). Use the existing `Button` component with a `Calendar` icon from lucide-react.

**Visual states:**
- **Inactive:** `variant="outline"` — standard outline appearance
- **Active:** `variant="default"` — filled/primary appearance indicating the filter is on

**Toggle behavior:**
- Click when inactive → set `proximaSemana = true`, trigger `doSearch(0)`
- Click when active → set `proximaSemana = false`, trigger `doSearch(0)`

#### 3.4 Integration with Existing Filters

The quick filter is additive. In `doSearch`, the `proximaSemana` date filters are appended to the same `searchFilters` array alongside any active text/dropdown filters. The backend processes all filters with AND logic, which is the desired behavior.

#### 3.5 Clear Filters

The existing `clearFilters` function must also reset `proximaSemana` to `false`.

#### 3.6 Active Filter Tags

When `proximaSemana` is active, add a badge tag to `activeFilterTags` showing:
- **Label:** "Próxima semana"
- **Value:** formatted date range, e.g., "23/02 - 01/03"
- **Dismiss:** clicking X sets `proximaSemana = false` and re-triggers search

#### 3.7 Module-Level Cache

Include `proximaSemana` in the state saved to `searchStateCache` on unmount and restored on mount, consistent with the existing pattern from feature_012.

#### 3.8 Logging

Log the quick filter activation/deactivation using the existing `LOG` (createLogger) instance in SearchPage, at DEBUG level:

```javascript
LOG.debug('Quick filter Próxima semana:', proximaSemana ? 'ON' : 'OFF', { from: todayStr, to: endStr })
```

---

### 4. UI Mockup

**Desktop filter sidebar (after Estado filter, before buttons):**

```
┌─────────────────────┐
│  ID Tarea   [     ] │
│  Tarea      [     ] │
│  Responsable [▼   ] │
│  Tema        [▼   ] │
│  Estado      [▼   ] │
│                     │
│  [📅 Próxima semana]│  ← New toggle button
│                     │
│  [🔍 Buscar]        │
│  [✕ Limpiar]        │
└─────────────────────┘
```

**Active filter tags (when quick filter is on):**

```
Resultados: 12  [Estado: En Curso ✕] [Próxima semana: 23/02 - 01/03 ✕]
```

---

### 5. Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/search/SearchPage.jsx` | Add `proximaSemana` state, toggle button in filter panel, date filter logic in `doSearch`, filter tag, cache integration, clear filter update |
| `frontend/src/lib/version.js` | Bump `APP_VERSION.minor` to 14 |
| `frontend/src/lib/changelog.js` | Add feature_014 changelog entry |

---

### 6. No Backend Changes

The backend search API (`POST /api/v1/tareas/search`) already supports:
- `gte` operator on date fields
- `lte` operator on date fields
- Multiple filters on the same field (AND logic)

No backend modifications are required.

---

### 7. Dependencies

No new npm packages required. Uses existing:
- `lucide-react` (Calendar icon)
- `Button` component from `components/ui/button.jsx`
- `Badge` component from `components/ui/badge.jsx`
