# Feature 022: Implementation Plan

## Phase 1: Chart Double-Click Navigation

### Step 1.1: Add double-click support to BarChartCard

**File:** `frontend/src/features/dashboard/components/BarChartCard.jsx`

- Add new props: `onBarDoubleClick` (callback), `field` (string — the datos_relevantes field this chart groups by)
- Implement double-click detection using a `useRef` timer on `<Bar onClick>`:
  - On first click, store timestamp and bar name in ref
  - On second click within 300ms on the same bar, call `onBarDoubleClick({ name, value, field })`
  - Reset timer after 300ms
- Add `cursor: 'pointer'` style to bars when `onBarDoubleClick` is provided

### Step 1.2: Add location state support to SearchPage

**File:** `frontend/src/features/search/SearchPage.jsx`

- Import `useLocation` from React Router
- On mount, check `location.state?.filters`
- If present, override `filters` state with the received filters (merge with defaults)
- Trigger `executeSearch(true)` after applying state filters
- Clear location state after consuming it (via `navigate('/search', { replace: true })`) to prevent stale re-renders on browser back/forward

### Step 1.3: Wire chart double-click in DashboardPage

**File:** `frontend/src/features/dashboard/DashboardPage.jsx`

- Import `useNavigate` from React Router
- Create `handleBarDoubleClick(field, barName)` handler:
  1. Filter `filteredData` to items where `item[field] === barName`
  2. Collect `portfolio_id` values as comma-separated string
  3. Build Search filter object: `{ portfolioId: 'ID1,ID2,...' }`
  4. Call `navigate('/search', { state: { filters: searchFilters } })`
- Pass `onBarDoubleClick` and `field` props to each BarChartCard:
  - Priorizacion: `field="priorizacion"`
  - Unidad: `field="unidad"`
  - Framework: `field="digital_framework_level_1"`
  - Cluster: `field="cluster"`
  - Estado: `field="estado_de_la_iniciativa"`

---

## Phase 2: Top Value Initiatives Card

### Step 2.1: Create TopValueCard component

**File:** `frontend/src/features/dashboard/components/TopValueCard.jsx` (NEW)

- Props: `items` (array), `year` (number), `threshold` (number), `onThresholdChange` (callback), `isLoading` (boolean)
- Renders a Card with:
  - Header: title + threshold `<select>` dropdown (500k, 1M, 2M, 5M)
  - Body: table with columns portfolio_id (Link), nombre, importe
  - portfolio_id rendered as `<Link to={/detail/${id}}>` using React Router
  - Importe formatted with `formatImporte()`
  - Nombre truncated to ~60 chars
  - Max 20 rows displayed
  - Empty state message when no items exceed threshold

### Step 2.2: Wire TopValueCard in DashboardPage

**File:** `frontend/src/features/dashboard/DashboardPage.jsx`

- Add `topValueThreshold` state, initialized from `VITE_DASHBOARD_TOP_VALUE_THRESHOLD` env var (default 1000000)
- Compute `topValueItems` in useMemo: filter `filteredData` by `importe_YYYY > threshold`, sort desc, slice(0, 20)
- Render `<TopValueCard>` below the charts grid

---

## Phase 3: Recent Changes Card

### Step 3.1: Create RecentChangesCard component

**File:** `frontend/src/features/dashboard/components/RecentChangesCard.jsx` (NEW)

- Props: `items` (array), `recentDays` (number), `onNavigateToHechos` (callback), `isLoading` (boolean)
- Renders a Card with:
  - Header: title + "Ver en Informe Hechos" button
  - Body: table with columns portfolio_id (Link), nombre, estado, fecha_ultimo_estado
  - portfolio_id rendered as `<Link>`
  - fecha_de_ultimo_estado formatted as DD/MM/YYYY
  - Max 20 rows displayed
  - Empty state message when no recent changes

### Step 3.2: Add location state support to ReportPage (Hechos)

**File:** `frontend/src/features/reports/ReportPage.jsx`

- Import `useLocation` from React Router
- On mount, check `location.state?.filters`
- If present, override filter state with received filters
- Auto-search with those filters
- Clear location state after consuming

### Step 3.3: Wire RecentChangesCard in DashboardPage

**File:** `frontend/src/features/dashboard/DashboardPage.jsx`

- Read `VITE_DASHBOARD_RECENT_DAYS` env var (default 7)
- Compute `recentItems` in useMemo: filter `filteredData` by `fecha_de_ultimo_estado >= cutoffDate`, sort desc, slice(0, 20)
- Create `handleNavigateToHechos` handler:
  1. Build Hechos filter object with date range (cutoff → today) and dashboard dimension filters
  2. `navigate('/informes/hechos', { state: { filters } })`
- Render `<RecentChangesCard>` below TopValueCard

---

## Phase 4: Environment Variables

### Step 4.1: Add env variables

**File:** `frontend/.env`

```bash
VITE_DASHBOARD_TOP_VALUE_THRESHOLD=1000000
VITE_DASHBOARD_RECENT_DAYS=7
```

**File:** `frontend/.env.example`

Add the same variables with documentation comments.

---

## Phase 5: Documentation Updates

### Step 5.1: Update architecture_frontend.md

- Add TopValueCard and RecentChangesCard to dashboard component hierarchy
- Document chart double-click navigation pattern
- Document location state navigation pattern for Search and Hechos
- Add env variables documentation

### Step 5.2: Update README.md

- Update dashboard description with new features

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `components/BarChartCard.jsx` | Modify (double-click, field prop, cursor) | 1 |
| `SearchPage.jsx` | Modify (location state filter support) | 1 |
| `DashboardPage.jsx` | Modify (double-click handler, new cards, env vars) | 1 + 2 + 3 |
| `components/TopValueCard.jsx` | **Create** | 2 |
| `components/RecentChangesCard.jsx` | **Create** | 3 |
| `reports/ReportPage.jsx` | Modify (location state filter support) | 3 |
| `frontend/.env` | Modify (add 2 vars) | 4 |
| `frontend/.env.example` | Modify (add 2 vars) | 4 |
| `specs/architecture_frontend.md` | Modify (docs) | 5 |
| `README.md` | Modify (docs) | 5 |

**Total: 8 files modified, 2 files created**

---

## Testing Checklist

- [ ] Double-clicking a bar in any chart navigates to Search
- [ ] Search results match exactly the initiatives in the clicked bar
- [ ] Single-clicking a bar does NOT navigate (only double-click)
- [ ] Cursor shows pointer on bar hover
- [ ] Normal Search page behavior (from nav link) is unchanged
- [ ] TopValueCard shows initiatives above threshold sorted by importe desc
- [ ] Threshold selector changes the displayed list
- [ ] Portfolio ID links in both cards navigate to detail page
- [ ] RecentChangesCard shows initiatives changed within N days
- [ ] "Ver en Informe Hechos" button navigates to Hechos with correct filters
- [ ] Hechos report loads with pre-filled filters from navigation
- [ ] Normal Hechos page behavior (from nav link) is unchanged
- [ ] Empty states display correctly in both cards
- [ ] Environment variables are respected (threshold, recent days)
- [ ] Build succeeds without errors
