# Implementation Plan: Feature 014 - Dashboard Improvements

## Overview

This document outlines the step-by-step implementation plan for adding interactive filters and enhanced charts to the Portfolio Digital dashboard.

---

## Phase 1: Multi-Select Component

### Step 1.1: Create Multi-Select UI Component

**File:** `src/components/ui/multi-select.jsx`

**Implementation:**
- Build on Shadcn/ui Popover and Command components
- Checkboxes for each option
- "Select All" toggle
- Badge showing selection count
- Search input for filtering options

**Features:**
```jsx
<MultiSelect
  options={[{ value: 'MANDATORY', label: 'Mandatory' }]}
  selected={['MANDATORY']}
  onChange={(values) => handleChange(values)}
  placeholder="Seleccionar..."
  searchable={true}
/>
```

### Step 1.2: Add Required Shadcn Components

**Commands:**
```bash
cd frontend
npx shadcn@latest add popover
npx shadcn@latest add command
npx shadcn@latest add checkbox
npx shadcn@latest add badge
```

---

## Phase 2: Utility Functions

### Step 2.1: Add Formatting Functions

**File:** `src/lib/utils.js`

**Add functions:**
```javascript
// Format importe in thousands of EUR
export const formatImporte = (value) => {
  if (value == null || isNaN(value)) return '0 k€';
  const kValue = value / 1000;
  return `${kValue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} k€`;
};

// Format year without thousand separator
export const formatYear = (year) => {
  return String(year);
};
```

### Step 2.2: Create Filter Storage Utility

**File:** `src/features/dashboard/utils/filterStorage.js`

**Implementation:**
```javascript
const STORAGE_KEY = 'portfolio-dashboard-filters';

export const saveFilters = (filters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.warn('Failed to save filters to localStorage');
  }
};

export const loadFilters = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Failed to load filters from localStorage');
    return null;
  }
};

export const getDefaultFilters = () => ({
  year: new Date().getFullYear(),
  digitalFramework: ['ALL'],
  unidad: ['ALL'],
  cluster: ['ALL'],
});
```

---

## Phase 3: Filter Bar Component

### Step 3.1: Create Year Selector Component

**File:** `src/features/dashboard/components/YearSelector.jsx`

**Implementation:**
- Simple dropdown using Shadcn Select
- Options: 2025, 2026, 2027, 2028
- Controlled component receiving value and onChange

### Step 3.2: Create Filter Bar Component

**File:** `src/features/dashboard/components/FilterBar.jsx`

**Implementation:**
```jsx
const FilterBar = ({ filters, onFilterChange, options }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border mb-6">
      <YearSelector
        value={filters.year}
        onChange={(year) => onFilterChange({ ...filters, year })}
      />
      <MultiSelect
        label="Framework"
        options={options.digitalFramework}
        selected={filters.digitalFramework}
        onChange={(values) => onFilterChange({ ...filters, digitalFramework: values })}
      />
      <MultiSelect
        label="Unidad"
        options={options.unidad}
        selected={filters.unidad}
        onChange={(values) => onFilterChange({ ...filters, unidad: values })}
        searchable
      />
      <MultiSelect
        label="Cluster"
        options={options.cluster}
        selected={filters.cluster}
        onChange={(values) => onFilterChange({ ...filters, cluster: values })}
        searchable
      />
      <Button variant="outline" onClick={onReset}>
        Resetear
      </Button>
    </div>
  );
};
```

---

## Phase 4: Data Layer Updates

### Step 4.1: Update useDatosRelevantes Hook

**File:** `src/features/dashboard/hooks/useDatosRelevantes.js`

**Modifications:**

1. Extract unique values for filter options:
```javascript
export const extractFilterOptions = (data) => ({
  digitalFramework: [
    { value: 'MANDATORY', label: 'Mandatory' },
    { value: 'BUSINESS IMPROVEMENT', label: 'Business Improvement' },
    { value: 'TLC', label: 'TLC' },
    { value: 'DISTRIBUTED SERVICES', label: 'Distributed Services' },
    { value: 'OPEX CAPITALIZATION', label: 'Opex Capitalization' },
    { value: 'CYBERSECURITY', label: 'Cybersecurity' },
  ],
  unidad: [...new Set(data.map(d => d.unidad).filter(Boolean))]
    .sort()
    .map(v => ({ value: v, label: v })),
  cluster: [...new Set(data.map(d => d.cluster_2025).filter(Boolean))]
    .sort()
    .map(v => ({ value: v, label: v })),
});
```

2. Add filter function:
```javascript
export const filterData = (data, filters) => {
  return data.filter(item => {
    // Digital Framework filter
    if (!filters.digitalFramework.includes('ALL') &&
        !filters.digitalFramework.includes(item.digital_framework_level_1)) {
      return false;
    }
    // Unidad filter
    if (!filters.unidad.includes('ALL') &&
        !filters.unidad.includes(item.unidad)) {
      return false;
    }
    // Cluster filter
    if (!filters.cluster.includes('ALL') &&
        !filters.cluster.includes(item.cluster_2025)) {
      return false;
    }
    return true;
  });
};
```

3. Add importe aggregation by year:
```javascript
export const getImporteColumn = (year) => `importe_${year}`;

export const sumImporteByField = (data, groupField, year) => {
  const importeCol = getImporteColumn(year);
  const groups = {};

  data.forEach(item => {
    const key = item[groupField] || 'Sin definir';
    const value = item[importeCol] || 0;
    groups[key] = (groups[key] || 0) + value;
  });

  return Object.entries(groups)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
```

---

## Phase 5: Chart Components Updates

### Step 5.1: Update BarChartCard Component

**File:** `src/features/dashboard/components/BarChartCard.jsx`

**Modifications:**
- Add `valueFormatter` prop for custom axis formatting
- Add `isImporte` prop to switch between count and currency formatting
- Update tooltip formatting based on data type

```jsx
const BarChartCard = ({
  title,
  data,
  dataKey = 'value',
  isLoading,
  isImporte = false,
  maxItems = 8,
}) => {
  const formatValue = isImporte ? formatImporte : formatNumber;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, maxItems)} layout="vertical">
            <XAxis
              type="number"
              tickFormatter={formatValue}
            />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip formatter={(value) => formatValue(value)} />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

### Step 5.2: Update StatusChart Component

**File:** `src/features/dashboard/components/StatusChart.jsx`

**Modifications:**
- Accept filtered data as prop
- Update chart title to match requirements

---

## Phase 6: Dashboard Page Integration

### Step 6.1: Add Filter State Management

**File:** `src/features/dashboard/DashboardPage.jsx`

**Implementation:**

```jsx
import { useState, useEffect, useMemo } from 'react';
import { loadFilters, saveFilters, getDefaultFilters } from './utils/filterStorage';

const DashboardPage = () => {
  // Initialize filters from localStorage or defaults
  const [filters, setFilters] = useState(() => {
    const stored = loadFilters();
    return stored || getDefaultFilters();
  });

  // Save filters to localStorage on change
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Fetch raw data
  const { data: rawData, isLoading, error } = useDatosRelevantes();

  // Extract filter options from data
  const filterOptions = useMemo(() =>
    rawData ? extractFilterOptions(rawData) : {},
    [rawData]
  );

  // Apply filters to data
  const filteredData = useMemo(() =>
    rawData ? filterData(rawData, filters) : [],
    [rawData, filters]
  );

  // Calculate chart data
  const chartData = useMemo(() => ({
    statusCount: groupByField(filteredData, 'estado_de_la_iniciativa'),
    statusImporte: sumImporteByField(filteredData, 'estado_de_la_iniciativa', filters.year),
    unidadCount: groupByField(filteredData, 'unidad'),
    unidadImporte: sumImporteByField(filteredData, 'unidad', filters.year),
    clusterCount: groupByField(filteredData, 'cluster_2025'),
    clusterImporte: sumImporteByField(filteredData, 'cluster_2025', filters.year),
  }), [filteredData, filters.year]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    logger.debug('Filters updated', newFilters);
  };

  const handleReset = () => {
    setFilters(getDefaultFilters());
    logger.info('Filters reset to defaults');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          options={filterOptions}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* ... existing KPI cards ... */}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1: Status */}
          <StatusChart
            title="Iniciativas por Estado (numero)"
            data={chartData.statusCount}
            isLoading={isLoading}
          />
          <BarChartCard
            title="Iniciativas por Estado (importe)"
            data={chartData.statusImporte}
            isLoading={isLoading}
            isImporte
          />

          {/* Row 2: Unidad */}
          <BarChartCard
            title="Iniciativas por Unidad (numero)"
            data={chartData.unidadCount}
            isLoading={isLoading}
          />
          <BarChartCard
            title="Iniciativas por Unidad (importe)"
            data={chartData.unidadImporte}
            isLoading={isLoading}
            isImporte
          />

          {/* Row 3: Cluster */}
          <BarChartCard
            title="Iniciativas por Cluster (numero)"
            data={chartData.clusterCount}
            isLoading={isLoading}
          />
          <BarChartCard
            title="Iniciativas por Cluster (importe)"
            data={chartData.clusterImporte}
            isLoading={isLoading}
            isImporte
          />
        </div>
      </div>
    </Layout>
  );
};
```

---

## Phase 7: Logging Integration

### Step 7.1: Add Dashboard Logging

**Updates to DashboardPage.jsx:**

```javascript
import { createLogger } from '@/lib/logger';

const logger = createLogger('Dashboard');

// On mount
useEffect(() => {
  const stored = loadFilters();
  if (stored) {
    logger.info('Restored filters from storage', stored);
  } else {
    logger.info('Using default filters');
  }
}, []);

// On filter change
const handleFilterChange = (newFilters) => {
  setFilters(newFilters);
  logger.debug('Filter changed', newFilters);
};

// On data filtered
useEffect(() => {
  if (rawData && filteredData) {
    logger.debug(`Filtered ${filteredData.length} items from ${rawData.length}`);
  }
}, [filteredData, rawData]);
```

---

## Phase 8: Testing

### Step 8.1: Manual Testing Checklist

**Filter Functionality:**
- [ ] Year selector changes affect importe charts
- [ ] Digital Framework multi-select filters data correctly
- [ ] Unidad multi-select filters data correctly
- [ ] Cluster multi-select filters data correctly
- [ ] "Select All" works for each multi-select
- [ ] Reset button restores default filters
- [ ] Filters persist after page refresh
- [ ] Filters persist after browser close/reopen

**Chart Display:**
- [ ] "Iniciativas por Estado (numero)" shows count by status
- [ ] "Iniciativas por Estado (importe)" shows sum by status
- [ ] "Iniciativas por Unidad (numero)" shows count by unit
- [ ] "Iniciativas por Unidad (importe)" shows sum by unit
- [ ] "Iniciativas por Cluster (numero)" shows count by cluster
- [ ] "Iniciativas por Cluster (importe)" shows sum by cluster

**Formatting:**
- [ ] Importe values show in k€ format with "." separator
- [ ] Count values show with "." as thousands separator
- [ ] Year shows as YYYY without separators

**Edge Cases:**
- [ ] Empty filter results show appropriate message
- [ ] localStorage unavailable handled gracefully
- [ ] Invalid stored filters reset to defaults

### Step 8.2: Responsive Testing

- [ ] Desktop (1920px, 1440px, 1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

## Phase 9: Documentation

### Step 9.1: Update README.md

**Add sections:**
- Dashboard filter functionality
- Filter persistence behavior
- Chart descriptions

### Step 9.2: Update architecture_frontend.md

**Update:**
- Component hierarchy with new components
- State management section (filter state)
- localStorage usage
- Chart specifications

---

## Implementation Order Summary

| Phase | Steps | Files |
|-------|-------|-------|
| 1. Multi-Select Component | 1.1 - 1.2 | 1 |
| 2. Utility Functions | 2.1 - 2.2 | 2 |
| 3. Filter Bar Component | 3.1 - 3.2 | 2 |
| 4. Data Layer Updates | 4.1 | 1 |
| 5. Chart Components Updates | 5.1 - 5.2 | 2 |
| 6. Dashboard Integration | 6.1 | 1 |
| 7. Logging Integration | 7.1 | 0 |
| 8. Testing | 8.1 - 8.2 | 0 |
| 9. Documentation | 9.1 - 9.2 | 2 |

**Total files to create/modify:** ~11 files

---

## Dependencies Between Phases

```
Phase 1 (Multi-Select)
    │
    └──► Phase 3 (Filter Bar)
              │
Phase 2 (Utilities) ───┤
    │                  │
    └──► Phase 4 (Data Layer)
              │
              └──► Phase 5 (Chart Updates)
                        │
                        └──► Phase 6 (Dashboard Integration)
                                  │
                                  └──► Phase 7 (Logging)
                                            │
                                            └──► Phase 8 (Testing)
                                                      │
                                                      └──► Phase 9 (Documentation)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Multi-select performance with many options | Add virtualization for lists > 50 items |
| Filter state sync issues | Debounce filter changes (300ms) |
| localStorage quota exceeded | Limit stored data, handle errors gracefully |
| Chart rendering performance | Memoize calculations, limit displayed items |
| Breaking existing functionality | Keep existing components, add new props |

---

## Definition of Done

- [ ] All 9 phases completed
- [ ] Year selector working (2025-2028)
- [ ] Digital Framework multi-select working
- [ ] Unidad multi-select working with search
- [ ] Cluster multi-select working with search
- [ ] All 6 charts displaying correctly
- [ ] Filters persist to localStorage
- [ ] Importe formatted as k€ with "." separator
- [ ] Counts formatted with "." separator
- [ ] Years formatted as YYYY (no separator)
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] README.md updated
- [ ] architecture_frontend.md updated
- [ ] Existing functionality preserved
