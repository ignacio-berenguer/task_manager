# Specs — feature_060: Dashboard Advanced Features (B1, B2, B7)

## 1. Overview

Three advanced dashboard improvements from the feature_052 audit:
- **B1**: KPI trend indicators (delta arrows + percentages vs previous year)
- **B2**: Chart export as PNG (download button on each chart card)
- **B7**: Dynamic landing page stats (replace hardcoded hero stats with API data)

---

## 2. B1 — KPI Trend Indicators

### 2.1 Design Decision: Client-Side Trend Computation

The current dashboard fetches ALL ~837 `datos_relevantes` rows via `POST /datos-relevantes/search`. Each row already contains multi-year financial fields (`importe_2024`, `importe_2025`, `budget_2024`, `budget_2025`, etc.). Therefore, **financial KPI trends can be computed entirely client-side** by comparing `field_${year}` vs `field_${year-1}` on the same filtered dataset — no new API endpoint needed for this.

**Deviation from requirement**: The requirement mentions "a new API endpoint to fetch previous-period KPI values." Since the datos_relevantes response already includes all year columns, creating a separate endpoint would duplicate data already available on the client. The new endpoint described in section 3 (B7) provides server-side aggregated stats for the landing page, which is a genuinely new capability.

### 2.2 Which KPIs Get Trends

| KPI | Has Year Dependency | Trend Source |
|-----|-------------------|--------------|
| Total Iniciativas | No (count of filtered items) | No trend — count doesn't vary by year |
| Importe Total `${year}` | Yes (`importe_${year}`) | Compare `importe_${year}` vs `importe_${year-1}` |
| Budget `${year}` | Yes (`budget_${year}`) | Compare `budget_${year}` vs `budget_${year-1}` |
| Aprobadas | No (status-based count) | No trend — status doesn't vary by year |
| En Ejecucion | No (status-based count) | No trend — status doesn't vary by year |

### 2.3 KPICard Component Changes

Current `KPICard` props: `{ title, value, icon, description, className }`

New props added:
```
trend: {
  value: number,      // percentage change (e.g., 5.2 or -3.1)
  label: string,      // e.g., "vs 2024"
} | null
```

**Display rules:**
- `trend.value > 0` → green text, `TrendingUp` icon, `↑5.2%`
- `trend.value < 0` → red text, `TrendingDown` icon, `↓3.1%`
- `trend.value === 0` → muted text, `Minus` icon, `Sin cambio`
- `trend === null` → no trend indicator shown (for count-based KPIs)

**Layout**: The trend indicator appears below the main value, inline with the description area. Small text (`text-xs`), with the arrow icon inline.

### 2.4 Trend Calculation Logic

In `DashboardPage.jsx`, extend `calculateFilteredKPIs` to also return previous-year values:

```javascript
function calculateFilteredKPIs(items, year) {
  const prevYear = year - 1
  const budgetField = `budget_${year}`
  const prevBudgetField = `budget_${prevYear}`
  const importeField = `importe_${year}`
  const prevImporteField = `importe_${prevYear}`

  // ... existing calculations ...

  return {
    totalInitiatives,
    totalBudget,
    prevTotalBudget,      // NEW
    approvedInitiatives,
    inExecution,
    totalImporte,         // NEW (moved from chartData.summaryImporte)
    prevTotalImporte,     // NEW
  }
}
```

**Percentage calculation** (in DashboardPage, as a helper):
```javascript
function calcTrend(current, previous) {
  if (previous === 0) return current > 0 ? { value: 100, label: `vs ${prevYear}` } : null
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return { value: Math.round(pct * 10) / 10, label: `vs ${prevYear}` }
}
```

### 2.5 Edge Cases

- **Year 2024 selected**: `prevYear = 2023`. If `importe_2023` / `budget_2023` columns don't exist in datos_relevantes, previous values will be 0 → trend shows "100%" or is hidden. The function should check if previous-year data exists (sum > 0) and return `null` if not.
- **All values zero**: No trend shown (`null`).
- **Very large changes**: Cap display at ±999% for readability.

---

## 3. B7 — Dynamic Landing Page Stats (New API Endpoint)

### 3.1 New Backend Endpoint

**Router**: `backend/app/routers/stats.py`

**Endpoint**: `GET /api/v1/stats/overview`

**No authentication required** (landing page is public; backend doesn't enforce auth).

**Response schema** (`StatsOverview`):
```json
{
  "total_iniciativas": 832,
  "presupuesto_total": 52340000.50,
  "total_tablas": 28,
  "iniciativas_aprobadas": 412,
  "en_ejecucion": 187
}
```

**Implementation**:
- Query `iniciativas` table: `SELECT COUNT(*) FROM iniciativas` → `total_iniciativas`
- Query `datos_relevantes` for budget: `SELECT SUM(budget_2025) FROM datos_relevantes` → `presupuesto_total` (use current year, hardcoded or configurable)
- Query `datos_relevantes` for estados: count where `estado_aprobacion = 'Aprobada'` and where `estado_ejecucion LIKE '%ejecuci%'`
- Use SQLAlchemy `func.count()` and `func.sum()`
- `total_tablas`: Return the count from `TABLE_MODELS` dict (already available in `table_registry.py`)

**Pydantic schema**: Add `StatsOverview` to `backend/app/schemas.py`.

**Router registration**: Add to `backend/app/main.py` with the other routers. Static route `/stats/overview` must be registered as its own router (prefix `/stats`), so no conflict with `/{id}` patterns.

### 3.2 Frontend: HeroSection Changes

**New hook**: `frontend/src/features/landing/hooks/useOverviewStats.js`
- Uses `@tanstack/react-query` with query key `['stats-overview']`
- Calls `GET /api/v1/stats/overview`
- `staleTime: 10 * 60 * 1000` (10 minutes — landing page data doesn't need to be fresh)
- Does NOT use Clerk JWT (public endpoint; use plain `axios` or the existing `apiClient` which gracefully handles missing auth)

**HeroSection update**:
- Replace hardcoded stats array with dynamic values from the hook
- While loading: show skeleton placeholders (pulsing `bg-muted` blocks)
- On error: fall back to hardcoded values (graceful degradation)
- Format values: `formatNumber(total_iniciativas)` → "832", `formatImporte(presupuesto_total)` → "52.340 k€" or similar marketing-friendly format

**Stats mapping**:
| Current Hardcoded | Dynamic Value | Source Field |
|---|---|---|
| `800+` | `total_iniciativas` | `stats.total_iniciativas` |
| `€50M+` | Formatted budget | `stats.presupuesto_total` |
| `24` | Table count | `stats.total_tablas` |
| `99.9%` | Keep hardcoded | Static (infrastructure metric) |

Note: The 4th stat ("Disponibilidad 99.9%") remains hardcoded since it's an infrastructure SLA metric, not a database-derived value.

---

## 4. B2 — Chart Export as PNG

### 4.1 Library Choice

**`html2canvas`** (v1.4+): Captures any DOM element as a canvas, then converts to PNG for download. Mature, widely-used library. Recharts doesn't have built-in export, so DOM capture is the standard approach.

**New dependency**: `npm install html2canvas`

### 4.2 BarChartCard Changes

**New prop**: None needed — export is self-contained within the card.

**UI Change**: Add a download button in the `CardHeader`, next to the title:
- Icon: `Download` from lucide-react
- Position: Right side of CardHeader, aligned with the title
- Style: Ghost variant, small size, muted color
- Tooltip: "Exportar como PNG"

**Export logic** (within BarChartCard):
1. Use `useRef` to get a reference to the chart `<Card>` element
2. On button click:
   a. Call `html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })` (2x scale for crisp images)
   b. Convert canvas to blob: `canvas.toBlob()`
   c. Create download link with `URL.createObjectURL(blob)`
   d. Trigger download with filename: `${title.replace(/\s+/g, '_')}.png`
   e. Revoke object URL

**Loading state**: Show a spinner on the download button during capture (typically ~200-500ms).

### 4.3 Theme Handling

`html2canvas` captures the current DOM state, so dark/light theme is automatically captured correctly. The `backgroundColor: null` option ensures transparency (the card's own background is used).

### 4.4 Export for KPI Cards

The requirement focuses on chart cards. KPI cards are not charts and don't need export functionality in this iteration.

---

## 5. Files to Create

| File | Purpose |
|------|---------|
| `backend/app/routers/stats.py` | New router with `GET /stats/overview` |
| `frontend/src/features/landing/hooks/useOverviewStats.js` | React Query hook for landing page stats |

## 6. Files to Modify

| File | Changes |
|------|---------|
| `backend/app/main.py` | Register new `stats` router |
| `backend/app/schemas.py` | Add `StatsOverview` Pydantic model |
| `frontend/package.json` | Add `html2canvas` dependency |
| `frontend/src/features/dashboard/components/KPICard.jsx` | Add trend indicator display |
| `frontend/src/features/dashboard/components/BarChartCard.jsx` | Add export PNG button + logic |
| `frontend/src/features/dashboard/DashboardPage.jsx` | Compute trend values, pass to KPICard |
| `frontend/src/features/landing/components/HeroSection.jsx` | Replace hardcoded stats with dynamic values |
| `frontend/src/lib/version.js` | Version bump |
| `frontend/src/lib/changelog.js` | Changelog entry |
| `README.md` | Document new endpoint and features |
| `specs/architecture/architecture_backend.md` | Document stats router |
| `specs/architecture/architecture_frontend.md` | Document KPI trends, chart export, dynamic stats |
