# Feature 014: Dashboard Improvements - Filters and Charts

## 1. Overview

This feature enhances the Portfolio Digital dashboard with interactive filter selectors (Year, Digital Framework, Business Unit, Cluster) and improved chart visualizations. All dashboard data will be dynamically filtered based on user selections, with preferences persisted to browser storage.

---

## 2. Technology Stack (Existing)

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Styling | Tailwind CSS | 4.1.18 |
| UI Components | Shadcn/ui | Latest |
| Data Fetching | TanStack Query | 5.90.20 |
| HTTP Client | Axios | 1.13.4 |
| Charting | Recharts | 3.7.0 |
| State Persistence | localStorage | Native |

---

## 3. Requirements Specification

### 3.1 Year Selector (Requirement 1)

**Description:** Dropdown selector for filtering dashboard data by year.

**Specifications:**
- **Position:** Upper part of dashboard (filter bar)
- **Options:** 2025, 2026, 2027, 2028
- **Default:** Current year (2025 or 2026 depending on runtime date)
- **Behavior:** Single selection only
- **Impact:** Filters all charts and affects which `importe_YYYY` column is used

**Data Mapping:**
| Year Selected | Importe Column Used |
|---------------|---------------------|
| 2025 | `importe_2025` |
| 2026 | `importe_2026` |
| 2027 | `importe_2027` |
| 2028 | `importe_2028` |

---

### 3.2 Digital Framework Level 1 Selector (Requirement 2)

**Description:** Multi-select filter for `digital_framework_level_1` field.

**Specifications:**
- **Position:** Upper part of dashboard (filter bar)
- **Options:**
  - MANDATORY
  - BUSINESS IMPROVEMENT
  - TLC
  - DISTRIBUTED SERVICES
  - OPEX CAPITALIZATION
  - CYBERSECURITY
- **Default:** All selected
- **Behavior:** Multi-select (one or more values, or all)
- **UI Component:** Multi-select dropdown with checkboxes

**Filter Logic:**
```javascript
// When all selected: no filter applied
// When subset selected: filter WHERE digital_framework_level_1 IN (selected values)
```

---

### 3.3 Business Unit Selector (Requirement 3)

**Description:** Multi-select filter for `unidad` field.

**Specifications:**
- **Position:** Upper part of dashboard (filter bar)
- **Options:** Dynamic from database (distinct values from `unidad` column)
- **Default:** All selected
- **Behavior:** Multi-select (one or more values, or all)
- **UI Component:** Multi-select dropdown with checkboxes and search

**Data Source:** Fetched via API endpoint or extracted from datos_relevantes response

---

### 3.4 Cluster Selector (Requirement 4)

**Description:** Multi-select filter for `cluster_2025` field.

**Specifications:**
- **Position:** Upper part of dashboard (filter bar)
- **Options:** Dynamic from database (distinct values from `cluster_2025` column)
- **Default:** All selected
- **Behavior:** Multi-select (one or more values, or all)
- **UI Component:** Multi-select dropdown with checkboxes and search

**Data Source:** Fetched via API endpoint or extracted from datos_relevantes response

---

### 3.5 Initiatives by Status - Number (Requirement 5)

**Description:** Existing donut chart showing count of initiatives by status.

**Specifications:**
- **Title:** "Iniciativas por Estado (numero)"
- **Chart Type:** Donut chart (existing StatusChart component)
- **Data Source:** `datos_relevantes` table
- **Grouping Field:** `estado_de_la_iniciativa`
- **Metric:** COUNT of initiatives
- **Filters Applied:** All active selectors (Year, Digital Framework, Unidad, Cluster)

**Current Implementation:** Already exists, needs filter integration and title update.

---

### 3.6 Initiatives by Status - Value (Requirement 6)

**Description:** New horizontal bar chart showing total importe by status.

**Specifications:**
- **Title:** "Iniciativas por Estado (importe)"
- **Chart Type:** Horizontal bar chart
- **Data Source:** `datos_relevantes` table
- **Grouping Field:** `estado_de_la_iniciativa`
- **Metric:** SUM of `importe_YYYY` (based on selected year)
- **Filters Applied:** All active selectors
- **Value Axis Format:** Thousands of EUR (k EUR) with "." as thousands separator

---

### 3.7 Initiatives by Unit - Number (Requirement 7)

**Description:** Existing horizontal bar chart showing count of initiatives by unit.

**Specifications:**
- **Title:** "Iniciativas por Unidad (numero)"
- **Chart Type:** Horizontal bar chart (existing BarChartCard component)
- **Data Source:** `datos_relevantes` table
- **Grouping Field:** `unidad`
- **Metric:** COUNT of initiatives
- **Filters Applied:** All active selectors

**Current Implementation:** Already exists, needs filter integration and title update.

---

### 3.8 Initiatives by Unit - Value (Requirement 8)

**Description:** New horizontal bar chart showing total importe by unit.

**Specifications:**
- **Title:** "Iniciativas por Unidad (importe)"
- **Chart Type:** Horizontal bar chart
- **Data Source:** `datos_relevantes` table
- **Grouping Field:** `unidad`
- **Metric:** SUM of `importe_YYYY` (based on selected year)
- **Filters Applied:** All active selectors
- **Value Axis Format:** Thousands of EUR (k EUR) with "." as thousands separator

---

### 3.9 Initiatives by Cluster - Number (Requirement 9)

**Description:** New horizontal bar chart showing count of initiatives by cluster.

**Specifications:**
- **Title:** "Iniciativas por Cluster (numero)"
- **Chart Type:** Horizontal bar chart
- **Data Source:** `datos_relevantes` table
- **Grouping Field:** `cluster_2025`
- **Metric:** COUNT of initiatives
- **Filters Applied:** All active selectors

**Note:** Replaces/modifies existing cluster pie chart.

---

### 3.10 Initiatives by Cluster - Value (Requirement 10)

**Description:** New horizontal bar chart showing total importe by cluster.

**Specifications:**
- **Title:** "Iniciativas por Cluster (importe)"
- **Chart Type:** Horizontal bar chart
- **Data Source:** `datos_relevantes` table
- **Grouping Field:** `cluster_2025`
- **Metric:** SUM of `importe_YYYY` (based on selected year)
- **Filters Applied:** All active selectors
- **Value Axis Format:** Thousands of EUR (k EUR) with "." as thousands separator

---

### 3.11 Filter Persistence (Requirement 11)

**Description:** All filter selections persist across browser sessions.

**Specifications:**
- **Storage:** Browser localStorage
- **Storage Key:** `portfolio-dashboard-filters`
- **Data Structure:**
```javascript
{
  year: 2025,
  digitalFramework: ["MANDATORY", "BUSINESS IMPROVEMENT", ...],
  unidad: ["ALL"], // or array of selected values
  cluster: ["ALL"]  // or array of selected values
}
```
- **Initialization:**
  - Check localStorage on mount
  - If exists, restore saved filters
  - If not, use defaults (current year, all values selected)

---

### 3.12 Axis Formatting (Requirement 12)

**Description:** Consistent number formatting across all charts.

**Specifications:**

| Axis Type | Format | Example |
|-----------|--------|---------|
| Importe (value) | Thousands of EUR (k EUR) | 1.250 k EUR |
| Numero (count) | Units with "." separator | 1.250 |
| Year | YYYY format, no separators | 2025 |

**Implementation:**
```javascript
// formatImporte: value in EUR → display in k EUR
const formatImporte = (value) => {
  const kValue = value / 1000;
  return `${kValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`;
};

// formatNumero: count → display with thousands separator
const formatNumero = (value) => {
  return value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
};

// formatYear: year number → YYYY string without separators
const formatYear = (year) => year.toString();
```

---

## 4. Filter Bar Component

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Filter Bar                                                                  │
├─────────────┬─────────────────┬─────────────────┬─────────────────┬────────┤
│ Ano: [2025▼]│ Framework: [All▼]│ Unidad: [All▼] │ Cluster: [All▼] │[Reset] │
└─────────────┴─────────────────┴─────────────────┴─────────────────┴────────┘
```

### 4.2 Component Specifications

**File:** `src/features/dashboard/components/FilterBar.jsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| filters | object | Current filter state |
| onFilterChange | function | Callback when filters change |
| availableOptions | object | Available values for each filter |

**State Management:**
- Filters managed at DashboardPage level
- Passed down to FilterBar and chart components
- Changes trigger data re-filtering

---

## 5. Multi-Select Component

### 5.1 Component Specifications

**File:** `src/components/ui/multi-select.jsx`

**Features:**
- Dropdown with checkboxes
- "Select All" option
- Search/filter within options (for large lists)
- Badge showing count of selected items
- Clear selection button

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| options | array | `[{ value: string, label: string }]` |
| selected | array | Currently selected values |
| onChange | function | Callback with new selection |
| placeholder | string | Display when nothing selected |
| searchable | boolean | Enable search within options |

---

## 6. Data Flow Architecture

### 6.1 Filter State Flow

```
┌─────────────────┐
│  localStorage   │ ◄──── Initial load / Save on change
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DashboardPage  │ ◄──── Filter state holder
│    (filters)    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌──────────┐
│FilterBar│ │useDatosRelevantes│
│       │ │  (hook)  │
└───────┘ └────┬─────┘
               │
               ▼
         ┌───────────┐
         │ API Data  │
         └─────┬─────┘
               │
               ▼
         ┌───────────┐
         │filterData()│ ◄──── Client-side filtering
         └─────┬─────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Chart 1 │ │Chart 2 │ │Chart N │
└────────┘ └────────┘ └────────┘
```

### 6.2 Data Filtering Logic

**Location:** `src/features/dashboard/hooks/useDatosRelevantes.js`

```javascript
const filterData = (data, filters) => {
  return data.filter(item => {
    // Year filter doesn't filter rows, it determines which importe column to use

    // Digital Framework filter
    if (filters.digitalFramework.length > 0 &&
        !filters.digitalFramework.includes('ALL')) {
      if (!filters.digitalFramework.includes(item.digital_framework_level_1)) {
        return false;
      }
    }

    // Unidad filter
    if (filters.unidad.length > 0 &&
        !filters.unidad.includes('ALL')) {
      if (!filters.unidad.includes(item.unidad)) {
        return false;
      }
    }

    // Cluster filter
    if (filters.cluster.length > 0 &&
        !filters.cluster.includes('ALL')) {
      if (!filters.cluster.includes(item.cluster_2025)) {
        return false;
      }
    }

    return true;
  });
};
```

---

## 7. Dashboard Layout

### 7.1 Updated Grid Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Filter Bar                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   KPI 1     │ │   KPI 2     │ │   KPI 3     │ │   KPI 4     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
├──────────────────────────────────┬──────────────────────────────────────────┤
│                                  │                                          │
│  Iniciativas por Estado (numero) │  Iniciativas por Estado (importe)        │
│  [Donut Chart]                   │  [Horizontal Bar Chart]                  │
│                                  │                                          │
├──────────────────────────────────┼──────────────────────────────────────────┤
│                                  │                                          │
│  Iniciativas por Unidad (numero) │  Iniciativas por Unidad (importe)        │
│  [Horizontal Bar Chart]          │  [Horizontal Bar Chart]                  │
│                                  │                                          │
├──────────────────────────────────┼──────────────────────────────────────────┤
│                                  │                                          │
│  Iniciativas por Cluster (numero)│  Iniciativas por Cluster (importe)       │
│  [Horizontal Bar Chart]          │  [Horizontal Bar Chart]                  │
│                                  │                                          │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

### 7.2 Charts Summary

| Position | Chart Title | Type | Grouping | Metric |
|----------|-------------|------|----------|--------|
| Row 1, Col 1 | Iniciativas por Estado (numero) | Donut | estado_de_la_iniciativa | COUNT |
| Row 1, Col 2 | Iniciativas por Estado (importe) | H-Bar | estado_de_la_iniciativa | SUM importe |
| Row 2, Col 1 | Iniciativas por Unidad (numero) | H-Bar | unidad | COUNT |
| Row 2, Col 2 | Iniciativas por Unidad (importe) | H-Bar | unidad | SUM importe |
| Row 3, Col 1 | Iniciativas por Cluster (numero) | H-Bar | cluster_2025 | COUNT |
| Row 3, Col 2 | Iniciativas por Cluster (importe) | H-Bar | cluster_2025 | SUM importe |

---

## 8. Environment Variables

**Existing Variables (unchanged):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Portfolio Digital
```

**No new environment variables required** - filter persistence uses localStorage.

---

## 9. Logging

### 9.1 Log Events

| Event | Level | Message |
|-------|-------|---------|
| Filters initialized from localStorage | INFO | "Restored filters from storage" |
| Filters initialized with defaults | INFO | "Using default filters" |
| Filter changed | DEBUG | "Filter changed: {filterName} = {value}" |
| Filters saved to localStorage | DEBUG | "Filters saved to storage" |
| Data filtered | DEBUG | "Filtered {count} items from {total}" |

### 9.2 Console Logging

Important operations logged to console (as per General Requirements):
- Filter initialization
- API data fetch success/failure
- Filter persistence save/restore

---

## 10. Component Hierarchy (Updated)

```
DashboardPage
├── FilterBar
│   ├── YearSelector (single select)
│   ├── MultiSelect (Digital Framework)
│   ├── MultiSelect (Unidad)
│   ├── MultiSelect (Cluster)
│   └── ResetButton
├── KPICard x4
├── StatusChart (Iniciativas por Estado - numero)
├── BarChartCard (Iniciativas por Estado - importe) [NEW]
├── BarChartCard (Iniciativas por Unidad - numero)
├── BarChartCard (Iniciativas por Unidad - importe) [NEW]
├── BarChartCard (Iniciativas por Cluster - numero) [NEW/MODIFIED]
└── BarChartCard (Iniciativas por Cluster - importe) [NEW]
```

---

## 11. Backward Compatibility

### 11.1 Preserved Functionality

- All existing routes remain unchanged
- Authentication flow unchanged
- Theme switching unchanged
- API integration patterns unchanged
- Existing chart components reused

### 11.2 Modified Components

| Component | Modification |
|-----------|-------------|
| DashboardPage | Add filter state, filter bar, additional charts |
| StatusChart | Add filter props, update title |
| BarChartCard | Add filter props, enhance for importe display |
| useDatosRelevantes | Add filterData utility function |

---

## 12. Accessibility Considerations

- Filter dropdowns accessible via keyboard
- ARIA labels on all filter controls
- Focus management for multi-select
- Screen reader announcements for filter changes

---

## 13. Error Handling

| Scenario | Handling |
|----------|----------|
| localStorage unavailable | Use defaults, log warning |
| Invalid stored filters | Reset to defaults, log warning |
| API fetch failure | Show error message, keep last filters |
| Empty filter results | Show "No data matches filters" message |

---

## 14. Performance Considerations

- Filter operations performed client-side (data already fetched)
- Debounce rapid filter changes (300ms)
- Memoize filtered data calculations
- Virtualize long dropdown lists (>50 items)

---

## 15. Future Considerations

- Export filtered data to Excel
- Save filter presets
- Share filter configuration via URL
- Additional chart types (trends, comparisons)
