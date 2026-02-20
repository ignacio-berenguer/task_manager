# Feature 016: Informe "Iniciativas Cambiadas en el Periodo"

## 1. Overview

This feature adds a reporting system to the portfolio application. It introduces:

1. **"Informes" navbar dropdown** - A new navigation item with sub-items for reports
2. **"Iniciativas Cambiadas en el Periodo" report page** - A report showing hechos (facts/changes) within a date range, with rich filtering and configurable columns
3. **Spanish language conversion** - Translating English UI text to Spanish across the application
4. **Detail page section visibility improvement** - Making section titles more prominent with larger font and background color

---

## 2. Requirement 1: "Informes" Navbar Item

### 2.1 Behavior

- Add an "Informes" item to the navbar, positioned **after "Busqueda" (Search)** and **before "Registro" (Register)**
- "Informes" uses a **dropdown menu** on desktop
- On mobile, the dropdown items appear as **indented sub-items** in the mobile menu
- All "Informes" sub-items are only visible to **authenticated users** (inside `<SignedIn>`)

### 2.2 Dropdown Items

| Item | Route | Icon |
|------|-------|------|
| Iniciativas Cambiadas | `/informes/iniciativas-cambiadas` | `ClipboardList` |

The dropdown structure allows future report types to be added easily.

### 2.3 Visual Design

- Desktop: The "Informes" label with a chevron-down icon. Clicking opens a dropdown menu using the existing `DropdownMenu` component
- Active state: If any `/informes/*` route is active, the "Informes" nav item shows the active highlight
- Mobile: "Informes" appears as a section label, with sub-items indented below it

---

## 3. Requirement 2: Report "Iniciativas Cambiadas en el Periodo"

### 3.1 Route

- **Path:** `/informes/iniciativas-cambiadas`
- **Access:** Protected (authenticated users only)
- **Page title:** "Iniciativas Cambiadas en el Periodo"

### 3.2 Filter Criteria

The report page has a filter section at the top. All filters are optional except Fecha Inicio and Fecha Fin which have defaults.

| Filter | Type | Source | Behavior |
|--------|------|--------|----------|
| Digital Framework | Multi-Select | Distinct `digital_framework_level_1` values from `datos_relevantes` | Filter on joined datos_relevantes.digital_framework_level_1 |
| Unidad | Multi-Select | Distinct `unidad` values from `datos_relevantes` | Filter on joined datos_relevantes.unidad |
| Cluster | Multi-Select | Distinct `cluster_2025` values from `datos_relevantes` | Filter on joined datos_relevantes.cluster_2025 |
| Tipo | Multi-Select | Distinct `tipo` values from `datos_relevantes` | Filter on joined datos_relevantes.tipo |
| Fecha Inicio | Date Input (DD/MM/YYYY) | User input | hechos.fecha >= fecha_inicio |
| Fecha Fin | Date Input (DD/MM/YYYY) | User input | hechos.fecha <= fecha_fin |

**Default date values:**
- Fecha Inicio: First day of current month (e.g., 01/02/2026)
- Fecha Fin: Today (e.g., 05/02/2026)

**Filter dropdown options** are loaded from the existing `POST /api/v1/datos-relevantes/search` endpoint (same approach as the Search page).

### 3.3 Backend Endpoint

A new dedicated search endpoint is needed because the report joins data from `hechos` with data from `datos_relevantes` (to get digital_framework_level_1, unidad, cluster_2025, tipo for each hecho's portfolio_id).

**New endpoint:** `POST /api/v1/hechos/search-report01`

**Request body:**
```json
{
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-02-05",
  "digital_framework_level_1": ["MANDATORY", "TLC"],
  "unidad": ["DSO"],
  "cluster_2025": [],
  "tipo": [],
  "order_by": "fecha",
  "order_dir": "desc",
  "limit": 50,
  "offset": 0
}
```

**Response:** `PaginatedResponse` format — each row contains all fields from `hechos` plus all fields from `datos_relevantes` (merged, with duplicate `portfolio_id` removed from datos_relevantes):
```json
{
  "total": 245,
  "data": [
    {
      "portfolio_id": "P001",
      "fecha": "2026-01-15",
      "estado": "Aprobada",
      "nombre": "Nombre del hecho",
      "notas": "Nota text",
      "importe": 50000.0,
      "id_hecho": 1234,
      "referente_bi": "Ref BI value",
      "digital_framework_level_1": "MANDATORY",
      "unidad": "DSO",
      "cluster_2025": "Digital",
      "tipo": "Proyecto",
      "estado_de_la_iniciativa": "Aprobada",
      "...": "all other datos_relevantes fields"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

**Backend logic:**
1. Start from `hechos` table
2. Query full `Hecho` and `DatosRelevante` model objects with LEFT JOIN on `portfolio_id`
3. Filter `hechos.fecha` between `fecha_inicio` and `fecha_fin` (inclusive, both bounds)
4. Apply optional filters on the joined `datos_relevantes` fields
5. Return paginated results with **all columns from both tables** merged into each row (datos_relevantes fields supplement hechos fields, enabling the frontend column selector to display any datos_relevantes column)

**Important:** The `report01-filter-options` and `search-report01` endpoints must be defined **before** the `/{id_hecho}` dynamic path route in the router to avoid FastAPI route conflicts (422 errors).

### 3.4 Filter Options Endpoint

Reuse the existing approach from the Search page:
- Digital Framework options: hardcoded list (same as Search page FilterPanel)
- Unidad, Cluster, Tipo options: fetched dynamically from the API using a lightweight query on `datos_relevantes`

A new endpoint is needed to fetch distinct filter values:

**New endpoint:** `GET /api/v1/hechos/report01-filter-options`

**Response:**
```json
{
  "unidad": ["DSO", "DGR", ...],
  "cluster_2025": ["Digital", "Cloud", ...],
  "tipo": ["Proyecto", "Servicio", ...],
  "digital_framework_level_1": ["MANDATORY", "BUSINESS IMPROVEMENT", ...]
}
```

This queries `datos_relevantes` for distinct values of each field.

---

## 4. Requirement 3: Output Results Grid

### 4.1 Default Columns

| Column | Source | Type | Notes |
|--------|--------|------|-------|
| Portfolio ID | hechos.portfolio_id | link | Links to `/detail/{portfolio_id}` |
| Fecha | hechos.fecha | date | DD/MM/YYYY format |
| Estado | hechos.estado | text | |
| Nombre | hechos.nombre | text | |
| Nota | hechos.notas | longtext | Word-wrap |
| Importe | hechos.importe | currency | k EUR format |
| ID | hechos.id_hecho | number | |
| Referente BI | hechos.referente_bi | text | |
| Digital Framework | datos_relevantes.digital_framework_level_1 | text | |
| Unidad | datos_relevantes.unidad | text | |
| Cluster | datos_relevantes.cluster_2025 | text | |
| Tipo | datos_relevantes.tipo | text | |

### 4.2 Additional Columns

The user can toggle **all columns** (both default and additional) via a column selector dropdown. The selector groups columns by category (Hechos, Portfolio, and additional datos_relevantes categories). The dropdown stays open when toggling columns (`e.preventDefault()` on `onSelect`). A "Restaurar por defecto" button resets to the 12 default columns.

### 4.3 Column Configuration Persistence

| Key | Data | Default |
|-----|------|---------|
| `portfolio-report-columns` | Selected additional column IDs | [] (default columns only) |
| `portfolio-report-column-order` | Column display order | Default order |
| `portfolio-report-page-size` | Page size | 50 |

The user can **reset** column selection and order to defaults via a reset button.

### 4.4 Page Size

- Options: 25, 50, 100, 200
- Default: 50
- Persisted to localStorage (`portfolio-report-page-size`)

### 4.5 Sorting

- Click any column header to sort ascending, click again for descending, click again to clear
- Sorting is server-side (passed in the search request)
- Default sort: `fecha` descending

### 4.6 Pagination

- Standard pagination component (same as Search page)
- Shows current page, total results, page navigation

### 4.7 Grid Component

Reuse the existing `DataGrid` component from the Search feature, or create a similar `ReportGrid` component that follows the same patterns (TanStack Table, column formatting, sortable headers, etc.).

---

## 5. Requirement 4: Spanish Language Conversion

### 5.1 Scope

Translate all user-facing English text to Spanish. This includes:

**Navbar:**
| Current (English) | New (Spanish) |
|-------------------|---------------|
| Dashboard | Dashboard (keep, established term) |
| Search | Busqueda |
| Register | Registro |
| Jobs | Trabajos |
| Sign In | Iniciar Sesion |
| Sign Up | Registrarse |

**Footer:**
| Current (English) | New (Spanish) |
|-------------------|---------------|
| Contact | Contacto |
| Documentation | Documentacion |
| Privacy Policy | Politica de Privacidad |
| Terms of Service | Terminos de Servicio |
| All rights reserved. | Todos los derechos reservados. |

**Landing Page sections** (all English text in HeroSection, ProblemSection, FeaturesSection, ProcessSection, AnalyticsSection, SecuritySection, PricingSection, AboutSection):
- Translate all headings, descriptions, button labels, stat labels, etc.

**Detail Page:**
| Current (English) | New (Spanish) |
|-------------------|---------------|
| Back | Volver |
| Initiative Detail | Detalle de Iniciativa |
| Edit | Editar |
| Coming soon | Proximamente |
| No data available | Sin datos disponibles |
| empty (badge) | vacio |
| Error Loading Initiative | Error al Cargar la Iniciativa |

**Search Page:**
- Translate any remaining English labels, button text, placeholders

**Dashboard Page:**
- Translate any remaining English labels

### 5.2 Approach

- Direct string replacement in JSX components
- No i18n library needed (single-language application)
- Code comments remain in English

---

## 6. Requirement 5: Detail Page Section Visibility

### 6.1 Current State

The `SectionAccordion` component uses `font-medium` for section titles with no background highlighting. The sections look "flat" against the page background.

### 6.2 Desired State

Section titles should be more prominent with:
- **Larger font size**: `text-lg` or `text-base font-semibold` (up from `font-medium`)
- **Background color on the trigger**: A subtle but visible background that works in both light and dark modes
- **Left border accent**: A colored left border on the accordion item for visual distinction

### 6.3 Implementation

Modify `SectionAccordion.jsx`:
- Add `bg-muted/30` background to the `AccordionTrigger`
- Add a left border accent using `border-l-4 border-primary/50`
- Increase title font to `text-base font-semibold`
- Keep the existing hover behavior (`hover:bg-muted/50`)
- Ensure the styling works with both light and dark themes

---

## 7. Frontend File Structure (New/Modified)

### New Files

```
frontend/src/
├── features/
│   └── reports/                              # New feature module
│       ├── ReportPage.jsx                    # Report page composition
│       ├── components/
│       │   ├── ReportFilterPanel.jsx         # Filter panel for reports
│       │   ├── ReportGrid.jsx                # Results grid (or reuse DataGrid)
│       │   ├── ReportColumnSelector.jsx      # Column selector for additional columns
│       │   └── ReportPagination.jsx          # Pagination (or reuse existing)
│       ├── hooks/
│       │   ├── useReportSearch.js            # TanStack Query hook for report API
│       │   ├── useReportFilterOptions.js     # Hook to fetch filter options
│       │   └── useReportPreferences.js       # localStorage preferences
│       └── utils/
│           ├── reportColumnDefinitions.js    # Column metadata for report
│           └── reportStorage.js              # localStorage keys/helpers
```

### Modified Files

```
frontend/src/
├── components/layout/
│   ├── Navbar.jsx                            # Add Informes dropdown
│   └── Footer.jsx                            # Translate to Spanish
├── features/
│   ├── landing/components/*.jsx              # Translate to Spanish
│   ├── detail/
│   │   ├── components/
│   │   │   ├── SectionAccordion.jsx          # Enhanced section styling
│   │   │   └── DetailHeader.jsx              # Translate to Spanish
│   │   └── DetailPage.jsx                    # Translate to Spanish
│   ├── search/
│   │   └── SearchPage.jsx                    # Translate any English text
│   └── dashboard/
│       └── DashboardPage.jsx                 # Translate any English text
├── App.jsx                                   # Add report route
```

### Backend New/Modified Files

```
backend/app/
├── routers/
│   └── hechos.py                             # Add search-report and report-filter-options endpoints
```

---

## 8. API Changes Summary

| Method | Endpoint | Type | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/hechos/search-report01` | New | Search hechos with date range and datos_relevantes filters |
| GET | `/api/v1/hechos/report01-filter-options` | New | Get distinct filter values for report |

---

## 9. localStorage Keys Summary

| Key | Feature | Default |
|-----|---------|---------|
| `portfolio-report-columns` | Report additional columns | [] |
| `portfolio-report-column-order` | Report column order | Default order |
| `portfolio-report-page-size` | Report page size | 50 |

---

## 10. Dependencies

No new npm or Python packages are required. All functionality can be built with existing dependencies:
- Frontend: React, TanStack Table, TanStack Query, Lucide icons, Shadcn/ui components
- Backend: FastAPI, SQLAlchemy
