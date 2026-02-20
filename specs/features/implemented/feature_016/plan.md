# Feature 016: Implementation Plan

## Phase 1: Backend - New Report Endpoint

### Step 1.1: Add report-filter-options endpoint to hechos router

**File:** `backend/app/routers/hechos.py`

- Add `GET /hechos/report01-filter-options` endpoint
- Query `datos_relevantes` table for distinct values of: `digital_framework_level_1`, `unidad`, `cluster_2025`, `tipo`
- Return JSON object with arrays of distinct non-null values for each field
- Import `DatosRelevante` model
- Add logging

### Step 1.2: Add search-report endpoint to hechos router

**File:** `backend/app/routers/hechos.py`

- Add a Pydantic schema `HechosReportRequest` for the request body:
  - `fecha_inicio: str` (YYYY-MM-DD format)
  - `fecha_fin: str` (YYYY-MM-DD format)
  - `digital_framework_level_1: list[str] = []`
  - `unidad: list[str] = []`
  - `cluster_2025: list[str] = []`
  - `tipo: list[str] = []`
  - `order_by: str | None = "fecha"`
  - `order_dir: str = "desc"`
  - `limit: int = 50`
  - `offset: int = 0`
- Add `POST /hechos/search-report01` endpoint
- Build SQLAlchemy query joining `hechos` with `datos_relevantes` on `portfolio_id`
- Apply date range filter on `hechos.fecha`
- Apply optional filters on joined `datos_relevantes` fields (only when list is non-empty)
- Select specific columns from both tables
- Apply ordering and pagination
- Return `PaginatedResponse` format
- Add logging

### Step 1.3: Test backend endpoint

- Start backend server
- Test with curl/httpie:
  - `GET /api/v1/hechos/report01-filter-options`
  - `POST /api/v1/hechos/search-report01` with various filter combinations
- Verify pagination, sorting, date filtering

---

## Phase 2: Frontend - Spanish Language Conversion (Requirement 4)

This phase is done early because it affects all pages and is mostly string replacement. Doing it before adding new components avoids having to translate new text twice.

### Step 2.1: Translate Navbar

**File:** `frontend/src/components/layout/Navbar.jsx`

- Change nav item labels: Search → Busqueda, Register → Registro, Jobs → Trabajos
- Change auth buttons: Sign In → Iniciar Sesion, Sign Up → Registrarse

### Step 2.2: Translate Footer

**File:** `frontend/src/components/layout/Footer.jsx`

- Contact → Contacto, Documentation → Documentacion, Privacy Policy → Politica de Privacidad, Terms of Service → Terminos de Servicio
- "All rights reserved." → "Todos los derechos reservados."

### Step 2.3: Translate Landing Page

**Files:** `frontend/src/features/landing/components/*.jsx` (8 files)

- Translate all headings, descriptions, button labels, stat labels
- HeroSection: headline, subtext, CTA buttons, stats
- ProblemSection, FeaturesSection, ProcessSection, AnalyticsSection, SecuritySection, PricingSection, AboutSection: all user-facing text

### Step 2.4: Translate Detail Page

**Files:**
- `frontend/src/features/detail/components/DetailHeader.jsx`: Back → Volver, Edit → Editar, Coming soon → Proximamente, Initiative Detail → Detalle de Iniciativa
- `frontend/src/features/detail/components/SectionAccordion.jsx`: "empty" → "vacio", "No data available" → "Sin datos disponibles"
- `frontend/src/features/detail/DetailPage.jsx`: "Error Loading Initiative" → "Error al Cargar la Iniciativa"

### Step 2.5: Translate Search Page

**File:** `frontend/src/features/search/SearchPage.jsx` and components

- Translate any remaining English labels, placeholders, button text

### Step 2.6: Translate Dashboard Page

**File:** `frontend/src/features/dashboard/DashboardPage.jsx` and components

- Translate any remaining English labels

---

## Phase 3: Detail Page Section Visibility (Requirement 5)

### Step 3.1: Enhance SectionAccordion styling

**File:** `frontend/src/features/detail/components/SectionAccordion.jsx`

- Add `border-l-4 border-primary/50` to the `AccordionItem` for a left accent border
- Add `bg-muted/30` background to `AccordionTrigger`
- Change title font from `font-medium` to `text-base font-semibold`
- Verify styling works in both light and dark mode

---

## Phase 4: Frontend - "Informes" Navbar Dropdown (Requirement 1)

### Step 4.1: Add Informes dropdown to Navbar

**File:** `frontend/src/components/layout/Navbar.jsx`

- Restructure `privateNavItems` to support dropdown items:
  - Dashboard, Busqueda remain as direct links
  - "Informes" becomes a dropdown trigger with sub-items
  - Registro, Trabajos remain as direct links after Informes
- Use existing `DropdownMenu` component for the desktop dropdown
- For mobile menu, show Informes sub-items as indented links
- Active state: highlight "Informes" when any `/informes/*` route is active
- Use `ClipboardList` icon for "Iniciativas Cambiadas" sub-item
- Use `FileBarChart` icon for the "Informes" parent item

### Step 4.2: Add report route

**File:** `frontend/src/App.jsx`

- Add route: `/informes/iniciativas-cambiadas` → `ReportPage` (inside ProtectedRoute)
- Import the new ReportPage component

---

## Phase 5: Frontend - Report Page (Requirements 2 & 3)

### Step 5.1: Create report localStorage utilities

**File:** `frontend/src/features/reports/utils/reportStorage.js`

- Storage keys for report preferences:
  - `portfolio-report-columns` (additional column IDs)
  - `portfolio-report-column-order` (column display order)
  - `portfolio-report-page-size` (page size, default 50)
- Helper functions: `loadReportPreferences()`, `saveReportPreferences()`

### Step 5.2: Create report column definitions

**File:** `frontend/src/features/reports/utils/reportColumnDefinitions.js`

- Define default columns (12 columns from hechos + datos_relevantes)
- Define available additional columns (all datos_relevantes columns not in default set)
- Column metadata: id, label, type (text, date, currency, link, longtext, number)

### Step 5.3: Create useReportFilterOptions hook

**File:** `frontend/src/features/reports/hooks/useReportFilterOptions.js`

- TanStack Query hook calling `GET /api/v1/hechos/report01-filter-options`
- Cache for 10 minutes (same as Search page)
- Returns `{ data, isLoading, error }`

### Step 5.4: Create useReportSearch hook

**File:** `frontend/src/features/reports/hooks/useReportSearch.js`

- TanStack Query mutation calling `POST /api/v1/hechos/search-report01`
- Accepts filter params, pagination, sorting
- Returns `{ data, mutate, isLoading, error }`

### Step 5.5: Create useReportPreferences hook

**File:** `frontend/src/features/reports/hooks/useReportPreferences.js`

- Manages localStorage state for report preferences
- Tracks: additional columns, column order, page size
- Provides: getPreferences, updateColumns, updatePageSize, resetToDefaults

### Step 5.6: Create ReportFilterPanel component

**File:** `frontend/src/features/reports/components/ReportFilterPanel.jsx`

- Collapsible filter panel (similar to Search FilterPanel)
- Multi-select dropdowns for: Digital Framework, Unidad, Cluster, Tipo
- Date inputs for: Fecha Inicio (default: 1st of current month), Fecha Fin (default: today)
- "Buscar" (Apply) and "Limpiar" (Clear) buttons
- Active filter count badge on collapse header

### Step 5.7: Create ReportColumnSelector component

**File:** `frontend/src/features/reports/components/ReportColumnSelector.jsx`

- Dropdown showing available datos_relevantes columns
- Checkboxes to add/remove additional columns
- "Restaurar por defecto" (Reset) button
- Persists to localStorage via useReportPreferences

### Step 5.8: Create ReportPage component

**File:** `frontend/src/features/reports/ReportPage.jsx`

- Page composition:
  1. Page title "Iniciativas Cambiadas en el Periodo"
  2. ReportFilterPanel
  3. Toolbar: ReportColumnSelector, page size selector
  4. DataGrid (reuse from search, or create ReportGrid)
  5. Pagination
- Auto-execute search on page load with default date range
- Re-execute on filter changes
- Handle loading, empty, and error states

---

## Phase 6: Documentation Updates

### Step 6.1: Update architecture_frontend.md

**File:** `specs/architecture_frontend.md`

- Add note: "The application frontend is in Spanish"
- Add "Informes" feature section
- Add report route to routes table
- Update component hierarchy to include reports feature
- Update directory structure

### Step 6.2: Update README.md

**File:** `README.md`

- Add "Informes" feature description
- Mention the report endpoint
- Update any relevant sections

---

## Execution Order

```
Phase 1 (Backend)
  └── Step 1.1 → Step 1.2 → Step 1.3

Phase 2 (Spanish) ← Can run in parallel with Phase 1
  └── Steps 2.1-2.6 (sequential, file by file)

Phase 3 (Section Styling) ← Can run in parallel with Phase 1/2
  └── Step 3.1

Phase 4 (Navbar) ← After Phase 2 (navbar already translated)
  └── Step 4.1 → Step 4.2

Phase 5 (Report Page) ← After Phase 1 (backend ready) and Phase 4 (route added)
  └── Step 5.1 → Step 5.2 → Step 5.3 → Step 5.4 → Step 5.5 → Step 5.6 → Step 5.7 → Step 5.8

Phase 6 (Documentation) ← After all other phases
  └── Step 6.1 → Step 6.2
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Date format mismatch (hechos.fecha is TEXT in SQLite) | Backend handles string comparison on YYYY-MM-DD format; frontend formats to/from DD/MM/YYYY |
| Large result sets (3,452 hechos) | Server-side pagination with configurable page size |
| Missing datos_relevantes for some portfolio_ids | Use LEFT JOIN so hechos without datos_relevantes still appear (with null values) |
| Spanish translation completeness | Systematic file-by-file review of all 8+ landing sections |
