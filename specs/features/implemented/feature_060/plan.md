# Plan — feature_060: Dashboard Advanced Features (B1, B2, B7)

## Phase 1: Backend — Stats Overview Endpoint (B7)

### Step 1.1: Create Pydantic schema
- **File**: `backend/app/schemas.py`
- Add `StatsOverview` response model with fields: `total_iniciativas`, `presupuesto_total`, `total_tablas`, `iniciativas_aprobadas`, `en_ejecucion`

### Step 1.2: Create stats router
- **File**: `backend/app/routers/stats.py` (NEW)
- Implement `GET /overview` endpoint
- Query `iniciativas` for total count
- Query `datos_relevantes` for budget sum, aprobadas count, en_ejecucion count
- Get table count from `TABLE_MODELS`
- Return `StatsOverview` response

### Step 1.3: Register router in main.py
- **File**: `backend/app/main.py`
- Add `from app.routers import stats`
- Register with `prefix=f"{settings.API_PREFIX}/stats"`, tag `"Stats"`

### Step 1.4: Verify endpoint
- Start backend, hit `GET /api/v1/stats/overview`
- Confirm response shape and values

---

## Phase 2: Frontend — KPI Trend Indicators (B1)

### Step 2.1: Extend KPICard component
- **File**: `frontend/src/features/dashboard/components/KPICard.jsx`
- Add optional `trend` prop: `{ value: number, label: string } | null`
- Render trend indicator below value:
  - Positive → green `TrendingUp` icon + `↑X.X%`
  - Negative → red `TrendingDown` icon + `↓X.X%`
  - Zero → muted `Minus` icon + `Sin cambio`
  - Null → nothing rendered

### Step 2.2: Compute trends in DashboardPage
- **File**: `frontend/src/features/dashboard/DashboardPage.jsx`
- Extend `calculateFilteredKPIs` to compute previous-year financial values (`importe_${year-1}`, `budget_${year-1}`)
- Add `calcTrend(current, previous, prevYear)` helper
- Pass trend objects to the 2 financial KPICards (Importe Total, Budget)
- Pass `null` for count-based KPICards (Total, Aprobadas, En Ejecucion)

---

## Phase 3: Frontend — Chart Export as PNG (B2)

### Step 3.1: Install html2canvas
- Run `npm install html2canvas` in `frontend/`

### Step 3.2: Add export button to BarChartCard
- **File**: `frontend/src/features/dashboard/components/BarChartCard.jsx`
- Add `useRef` for the Card element
- Add `Download` icon button in CardHeader (right side, ghost variant)
- Implement export handler:
  1. `html2canvas(ref, { scale: 2 })` to capture
  2. `canvas.toBlob()` to convert
  3. Create download link, trigger click, cleanup
- Show loading state on button during capture

---

## Phase 4: Frontend — Dynamic Landing Page Stats (B7)

### Step 4.1: Create useOverviewStats hook
- **File**: `frontend/src/features/landing/hooks/useOverviewStats.js` (NEW)
- React Query hook calling `GET /api/v1/stats/overview`
- 10-minute stale time
- Uses `apiClient` (gracefully handles missing auth)

### Step 4.2: Update HeroSection
- **File**: `frontend/src/features/landing/components/HeroSection.jsx`
- Import and use `useOverviewStats` hook
- Replace hardcoded stats with dynamic values
- Loading state: skeleton placeholders
- Error state: fallback to hardcoded values
- Keep "99.9% Disponibilidad" hardcoded (infrastructure metric)

---

## Phase 5: Documentation & Finalization

### Step 5.1: Version bump + changelog
- **File**: `frontend/src/lib/version.js` — set `minor: 60`
- **File**: `frontend/src/lib/changelog.js` — add entry at TOP

### Step 5.2: Update README.md
- Document `GET /api/v1/stats/overview` endpoint
- Mention KPI trends, chart export, dynamic landing stats

### Step 5.3: Update architecture docs
- **File**: `specs/architecture/architecture_backend.md` — add stats router
- **File**: `specs/architecture/architecture_frontend.md` — document new features

### Step 5.4: Build verification
- Run `npm run build` in frontend to verify no errors
- Verify backend starts without errors

---

## Summary

| Phase | Scope | Files Changed |
|-------|-------|---------------|
| 1 | Backend stats endpoint | schemas.py, routers/stats.py (new), main.py |
| 2 | KPI trend indicators | KPICard.jsx, DashboardPage.jsx |
| 3 | Chart export as PNG | package.json, BarChartCard.jsx |
| 4 | Dynamic landing stats | useOverviewStats.js (new), HeroSection.jsx |
| 5 | Docs & finalization | version.js, changelog.js, README.md, arch docs |
