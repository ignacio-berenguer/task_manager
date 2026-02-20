# Feature 015: Initiative Search and Detail Pages

## 1. Overview

This feature implements the initiative search functionality and detail view pages in the frontend. Users can search for initiatives using flexible filter criteria, view results in a configurable data grid with sorting/filtering/export capabilities, and navigate to a comprehensive detail page for any initiative.

---

## 2. Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Data Grid | TanStack Table v8 | Virtualized, feature-rich data grid |
| Export | xlsx, file-saver | Excel/CSV/JSON export |
| Icons | Lucide React | Action icons |
| State | TanStack Query | Server state management |
| Storage | localStorage | Persist user preferences |

---

## 3. Requirements Specification

### 3.1 Search Filter Criteria (Requirement 1)

**Description:** Users can filter initiatives using a combination of criteria displayed in a collapsible filter panel.

**Filter Fields:**

| Field | Component Type | Database Field | Behavior |
|-------|----------------|----------------|----------|
| Portfolio ID | Text input / Combobox | `portfolio_id` | Free text (single, comma-separated list, or dropdown selection showing "Portfolio ID - Nombre") |
| Nombre | Text input | `nombre` | Wildcard search using `ilike` operator |
| Digital Framework | Multi-select | `digital_framework_level_1` | Options: MANDATORY, BUSINESS IMPROVEMENT, RPA/IA, TLC, DISTRIBUTED SERVICES, OPEX CAPITALIZATION, CYBERSECURITY |
| Unidad | Multi-select | `unidad` | Dynamic options from database |
| Estado | Multi-select | `estado_de_la_iniciativa` | Dynamic options from database |
| Cluster | Multi-select | `cluster_2025` | Dynamic options from database |
| Tipo | Multi-select | `tipo` | Dynamic options from database |
| Etiquetas | Multi-select | `etiquetas` (joined) | Dynamic options from `/etiquetas-options` endpoint |

**Filter Panel Behavior:**
- Collapsible panel at the top of the page
- "Apply Filters" button to execute search
- "Clear Filters" button to reset all filters
- Filter state persisted to localStorage
- Default: All multi-selects show "All" (no filter applied)
- **Keyboard shortcuts:**
  - Enter key: Apply filters (from any input)
  - Ctrl+Shift+X: Clear all filters
- **Focus:** Portfolio ID field receives focus on page load

**API Mapping:**
- Portfolio ID (single): `{field: "portfolio_id", operator: "eq", value: "XXX"}`
- Portfolio ID (list): `{field: "portfolio_id", operator: "in", value: ["XXX", "YYY"]}`
- Nombre: `{field: "nombre", operator: "ilike", value: "%searchterm%"}`
- Multi-selects: `{field: "field_name", operator: "in", value: [selected_values]}`
- Etiquetas: `{field: "etiquetas", operator: "in", value: [selected_values]}` - handled specially by backend to join with etiquetas table

---

### 3.2 Output Results Grid (Requirement 2)

**Description:** Search results displayed in a paginated, sortable, configurable data grid.

**Pagination:**
- Page sizes: 25, 50, 100, 200
- Default: 50
- Page size persisted to localStorage
- Display: "Showing X-Y of Z results"
- Navigation: First, Previous, Page numbers, Next, Last
- **Backend limit:** 1000 max per request

**Column Configuration:**
- Users can select which columns to display from all `datos_relevantes` columns
- Users can reorder columns via drag-and-drop
- Column selection and order persisted to localStorage
- "Reset Columns" button to restore defaults

**Default Columns (in order):**
1. portfolio_id
2. nombre
3. unidad
4. digital_framework_level_1
5. estado_de_la_iniciativa
6. fecha_de_ultimo_estado
7. cluster_2025
8. tipo
9. importe_2026

**Available Columns (from datos_relevantes):**

| Category | Columns |
|----------|---------|
| Identificación | portfolio_id, nombre, unidad, origen, jira_id |
| Clasificación | digital_framework_level_1, prioridad_descriptiva, cluster_2025, priorizacion, tipo, tipo_agrupacion, etiquetas (longtext) |
| Referentes | referente_negocio, referente_bi, it_partner, referente_ict |
| Económico | capex_opex, cini |
| Estado | estado_de_la_iniciativa, fecha_de_ultimo_estado, estado_de_la_iniciativa_2026, estado_aprobacion, estado_ejecucion, estado_agrupado, estado_dashboard, estado_requisito_legal |
| Financiero 2024 | budget_2024, importe_sm200_24, importe_aprobado_2024, importe_citetic_24, importe_facturacion_2024, importe_2024 |
| Financiero 2025 | budget_2025, importe_sm200_2025, importe_aprobado_2025, importe_facturacion_2025, importe_2025, importe_2025_cc_re, nuevo_importe_2025 |
| Financiero 2026 | budget_2026, importe_sm200_2026, importe_aprobado_2026, importe_facturacion_2026, importe_2026 |
| Financiero 2027 | budget_2027, importe_sm200_2027, importe_aprobado_2027, importe_facturacion_2027, importe_2027 |
| Financiero 2028 | importe_2028 |
| Otros | en_presupuesto_del_ano, calidad_valoracion, siguiente_accion, esta_en_los_206_me_de_2026, diferencia_apr_eje_exc_ept, cluster_de_antes_de_1906 |
| Fechas | fecha_prevista_pes, fecha_sm100, fecha_aprobada_con_cct, fecha_en_ejecucion, fecha_limite, fecha_limite_comentarios |

**Sorting:**
- Click column header to sort ascending
- Click again for descending
- Click again to remove sort
- Server-side sorting via API `order_by` and `order_dir` parameters

**Column Formatting:**
| Type | Format | Example |
|------|--------|---------|
| Currency (REAL) | Thousands with "." separator + " k€" | 1.250 k€ |
| Date (TEXT) | DD/MM/YYYY | 15/02/2026 |
| Text | As-is | - |
| Longtext | Wrapped, min 150px, max 400px width | (multi-line) |

**Special Cell Behaviors:**
- **portfolio_id column**: Rendered as a clickable link to `/detail/{portfolio_id}`
- **longtext columns**: Display with word-wrap enabled

---

### 3.3 Row Actions (Requirement 3)

**Description:** Each row has action buttons for operations on that initiative.

**Current Actions:**

| Action | Icon | Behavior |
|--------|------|----------|
| View | Eye | Navigate to `/detail/{portfolio_id}` |

**Future Actions (placeholders, not implemented):**

| Action | Icon | Description |
|--------|------|-------------|
| Edit | Pencil | Edit initiative |
| Add Hecho | Plus | Register new hecho |
| Add Justificacion | FileText | Add justification |
| Add Descripcion | AlignLeft | Add description |
| Add Nota | StickyNote | Add note |
| Documentation | FileCode | View documentation |

**Implementation:**
- Actions displayed in a fixed-width column on the right
- Tooltip on hover showing action name
- Future actions shown as disabled/grayed out icons with "Coming soon" tooltip

---

### 3.4 Bulk Export (Requirement 4)

**Description:** Export the current filtered/displayed data to various formats.

**Export Formats:**

| Format | Extension | Library | Description |
|--------|-----------|---------|-------------|
| Tab-delimited | .tsv | Native | Tab-separated values |
| CSV | .csv | Native | Comma-separated values |
| JSON | .json | Native | JSON array |
| Excel | .xlsx | xlsx | Excel workbook with formatting |

**Export Behavior:**
- Export ALL rows matching current filters (not just current page)
- **Pagination:** Backend max limit is 1000, so export fetches multiple pages if needed
- Filename: `iniciativas_export_YYYYMMDD_HHMMSS.{ext}`
- Excel export includes:
  - Header row with column names (bold)
  - Currency columns formatted as numbers
  - Date columns formatted as dates

**UI:**
- Export dropdown button in toolbar above grid
- Shows loading indicator during export generation
- Downloads file automatically when ready

---

### 3.5 Initiative Detail Page (Requirement 5)

**Route:** `/detail/:portfolio_id`

**Access:** Authenticated users only (protected route)

**Page Structure:**

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Back]                                        [Actions...]      │
├──────────────────────────────────────────────────────────────────┤
│ Portfolio ID: XXX                                                 │
│ Nombre: Initiative Name                                          │
├──────────────────────────────────────────────────────────────────┤
│ [Accordion Sections - expand by default if data present]          │
│                                                                   │
│ ▼ Datos Descriptivos                                             │
│   ├─ Field: Value (3-column layout)                              │
│   └─ ...                                                         │
│                                                                   │
│ ▼ Hechos (15)                                                    │
│   └─ [Table sorted by id ascending, longtext fields]             │
│                                                                   │
│ ▼ Informacion Economica                                          │
│   └─ [Economic data fields]                                      │
│                                                                   │
│ ▼ Importes                                                       │
│   └─ [Table format: Years 2024-2028 as rows, columns for         │
│       Budget, SM200, Aprobado, CITETIC, Facturación, Importe]    │
│                                                                   │
│ ▼ Etiquetas (7)                                                  │
│   └─ [Table: etiqueta, valor, fecha_modificacion,                │
│       origen_registro (longtext), comentarios (longtext)]        │
│                                                                   │
│ ▼ Acciones (3)                                                   │
│ ▼ Notas (2)                                                      │
│ ▼ Justificaciones (1)                                            │
│ ▼ Descripciones (0) - collapsed if empty                         │
│ ▼ Beneficios (45)                                                │
│ ▼ LTP (0)                                                        │
│ ▼ Facturacion (5)                                                │
│ ▼ Datos Ejecucion (1)                                            │
│ ▼ Grupos Iniciativas                                             │
│   ├─ As Component Of: (links to parent groups)                   │
│   └─ Components: (links to child initiatives)                    │
│ ▼ Estado Especial (0)                                            │
│ ▼ Transacciones (23) - uses clave1 field                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Data Sections (in order):**

| Section | Source Table | Display |
|---------|--------------|---------|
| Datos Descriptivos | datos_descriptivos | Key-value pairs, always expanded |
| Hechos | hechos | Sortable table (id, fecha, partida, importe, estado, notas as longtext) |
| Informacion Economica | informacion_economica | Key-value pairs |
| Importes | datos_relevantes | **Table format** with years as rows (2024-2028) and financial metrics as columns |
| Etiquetas | etiquetas | Table (etiqueta, valor, fecha_modificacion, origen_registro, comentarios) |
| Acciones | acciones | Table with longtext fields |
| Notas | notas | List (fecha, registrado_por, nota) |
| Justificaciones | justificaciones | Table with longtext fields |
| Descripciones | descripciones | List (tipo, descripcion) |
| Beneficios | beneficios | Grouped table with longtext fields |
| LTP | ltp | Table with longtext fields |
| Facturacion | facturacion | Table (ano, mes, importe, concepto) |
| Datos Ejecucion | datos_ejecucion | Key-value pairs |
| Grupos Iniciativas | grupos_iniciativas | **Dual display**: "As Component Of" (parent groups) and "Components" (child initiatives) with links |
| Estado Especial | estado_especial | Key-value pairs |
| Transacciones | transacciones | Table (uses `clave1` field, not portfolio_id) with longtext fields |

**Section Behavior:**
- Accordion-style collapsible sections
- Section title shows count of items: "Hechos (15)"
- **Default open:** Sections with data are expanded by default
- Empty sections: collapsed by default, show "(empty)" badge
- Click to expand/collapse

**Header Actions (placeholders for future):**
- Edit button (disabled, "Coming soon")
- Add Hecho button (disabled)
- Add Justificacion button (disabled)
- Add Descripcion button (disabled)
- Add Nota button (disabled)
- Documentation button (disabled)

**Back Button:**
- Returns to previous page (using browser history)
- Icon: ArrowLeft

**API Endpoint:**
- `GET /api/v1/portfolio/{portfolio_id}`
- Returns all related data in single request
- **Special handling:**
  - `transacciones`: Uses `clave1` field instead of `portfolio_id`
  - `grupos_iniciativas`: Returns `{ as_grupo: [], as_componente: [] }` for dual relationships

**Compact Display Guidelines:**
- Use 2-3 column layouts for key-value pairs where space permits
- Tables use condensed row height
- Avoid excessive whitespace
- Responsive: Single column on mobile

---

## 4. Data Flow

### 4.1 Search Page Data Flow

```
User enters filters
       │
       ▼
FilterPanel component (with forwardRef)
       │
       ├── Build SearchRequest from filters
       │
       ▼
POST /api/v1/datos-relevantes/search
       │
       ├── { filters: [...], order_by, order_dir, limit: 1000, offset }
       │
       ▼
API Response (includes aggregated etiquetas)
       │
       ├── { total, data: [...with etiquetas field], limit, offset }
       │
       ▼
DataGrid component renders results
       │
       ├── Column visibility from localStorage
       ├── Column order from localStorage
       ├── Page size from localStorage
       └── portfolio_id as clickable link
```

### 4.2 Detail Page Data Flow

```
Navigate to /detail/{portfolio_id}
       │
       ▼
GET /api/v1/portfolio/{portfolio_id}
       │
       ▼
API Response (with special handling)
       │
       ├── { datos_descriptivos, datos_relevantes, hechos, ... }
       ├── transacciones: filtered by clave1
       └── grupos_iniciativas: { as_grupo, as_componente }
       │
       ▼
DetailPage renders all sections
       │
       ├── Each section as Accordion item
       ├── Default open based on data presence
       └── Tables/lists for related data
```

---

## 5. Component Architecture

### 5.1 Search Feature Components

```
src/features/search/
├── SearchPage.jsx                 # Main search page (with filterPanelRef)
├── components/
│   ├── FilterPanel.jsx           # Collapsible filter form (forwardRef with focus method)
│   ├── DataGrid.jsx              # Results table with TanStack Table (portfolio_id link)
│   ├── ColumnSelector.jsx        # Column visibility/order modal
│   ├── ExportDropdown.jsx        # Export format selector
│   ├── RowActions.jsx            # Action buttons for each row
│   └── Pagination.jsx            # Page navigation controls
├── hooks/
│   ├── useSearchInitiatives.js   # Search API hook (with pagination for export)
│   ├── useFilterOptions.js       # Fetch filter dropdown options (includes etiquetas)
│   └── useSearchPreferences.js   # localStorage persistence
└── utils/
    ├── searchStorage.js          # localStorage helpers
    ├── exportHelpers.js          # Export format generators
    └── columnDefinitions.js      # Column config and formatters (includes longtext type)
```

### 5.2 Detail Feature Components

```
src/features/detail/
├── DetailPage.jsx                 # Main detail page (conditional defaultOpen)
├── components/
│   ├── DetailHeader.jsx          # Portfolio ID, nombre, actions
│   ├── SectionAccordion.jsx      # Reusable accordion wrapper
│   ├── SimpleTable.jsx           # Reusable table with link and longtext types
│   ├── sections/
│   │   ├── DatosDescriptivosSection.jsx
│   │   ├── HechosSection.jsx      # Sorted by id ascending, longtext fields
│   │   ├── InformacionEconomicaSection.jsx
│   │   ├── ImportesSection.jsx    # Table format (years as rows)
│   │   ├── EtiquetasSection.jsx   # New section for etiquetas
│   │   ├── AccionesSection.jsx    # Longtext fields
│   │   ├── NotasSection.jsx
│   │   ├── JustificacionesSection.jsx  # Longtext fields
│   │   ├── DescripcionesSection.jsx
│   │   ├── BeneficiosSection.jsx  # Longtext fields
│   │   ├── LtpSection.jsx         # Longtext fields
│   │   ├── FacturacionSection.jsx
│   │   ├── DatosEjecucionSection.jsx
│   │   ├── GruposIniciativasSection.jsx  # Dual view (as_grupo/as_componente with links)
│   │   ├── EstadoEspecialSection.jsx
│   │   └── TransaccionesSection.jsx  # Uses clave1, longtext fields
│   └── KeyValueDisplay.jsx       # Key-value pair renderer
└── hooks/
    └── usePortfolioDetail.js     # Fetch portfolio data
```

---

## 6. localStorage Keys

| Key | Data Stored | Default |
|-----|-------------|---------|
| `portfolio-search-filters` | Current filter values | {} |
| `portfolio-search-columns` | Selected column IDs | [...default columns] |
| `portfolio-search-column-order` | Column order array | [...default order] |
| `portfolio-search-page-size` | Selected page size | 50 |

---

## 7. Route Configuration

**New Routes:**

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/search` | SearchPage | Private | Initiative search with grid |
| `/detail/:portfolio_id` | DetailPage | Private | Initiative detail view |

**Update App.jsx:**
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/search" element={<SearchPage />} />
  <Route path="/detail/:portfolio_id" element={<DetailPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/jobs" element={<JobsPage />} />
</Route>
```

---

## 8. API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/datos-relevantes/search` | Search initiatives (includes etiquetas aggregation) |
| GET | `/api/v1/datos-relevantes/etiquetas-options` | Get unique etiquetas for filter dropdown |
| GET | `/api/v1/portfolio/{portfolio_id}` | Get all initiative data (special handling for transacciones/grupos) |

**Search Request Example:**
```json
{
  "filters": [
    {"field": "unidad", "operator": "in", "value": ["DSO", "DGR"]},
    {"field": "nombre", "operator": "ilike", "value": "%digital%"},
    {"field": "etiquetas", "operator": "in", "value": ["Etiqueta1", "Etiqueta2"]}
  ],
  "order_by": "importe_2026",
  "order_dir": "desc",
  "limit": 1000,
  "offset": 0
}
```

**Portfolio Response Structure (grupos_iniciativas):**
```json
{
  "grupos_iniciativas": {
    "as_grupo": [
      {"portfolio_id_grupo": "SPA_XX_XXX", "portfolio_id_componente": "SPA_YY_YYY", ...}
    ],
    "as_componente": [
      {"portfolio_id_grupo": "SPA_ZZ_ZZZ", "portfolio_id_componente": "SPA_XX_XXX", ...}
    ]
  }
}
```

---

## 9. UI Components

### 9.1 UI Components Used

| Component | Location | Purpose |
|-----------|----------|---------|
| Accordion | `src/components/ui/accordion.jsx` | Collapsible sections |
| Collapsible | `src/components/ui/collapsible.jsx` | Filter panel (z-index fixed) |
| Badge | `src/components/ui/badge.jsx` | Status/count badges |
| Tooltip | `src/components/ui/tooltip.jsx` | Action tooltips |
| DropdownMenu | `src/components/ui/dropdown-menu.jsx` | Export menu |
| Input | `src/components/ui/input.jsx` | Text inputs |
| Label | `src/components/ui/label.jsx` | Form labels |
| Skeleton | `src/components/ui/skeleton.jsx` | Loading states |
| Button | `src/components/ui/button.jsx` | Actions |
| Card | `src/components/ui/card.jsx` | Content containers |
| MultiSelect | `src/components/ui/multi-select.jsx` | Filter dropdowns |

### 9.2 Styling Fixes Applied

- **z-index:** FilterPanel uses `relative z-20` to ensure dropdowns appear above grid
- **Collapsible overflow:** Only applies `overflow-hidden` when closed, not when open
- **Longtext cells:** Use `whitespace-pre-wrap` with min/max width constraints

---

## 10. Dependencies

```bash
npm install @tanstack/react-table xlsx file-saver
```

| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-table | ^8.x | Data grid functionality |
| xlsx | ^0.18.x | Excel export |
| file-saver | ^2.x | Browser file download |

---

## 11. Backend Modifications

### 11.1 datos_relevantes Router Changes

**File:** `/backend/app/routers/datos_relevantes.py`

- Added `get_etiquetas_for_portfolios()` function to aggregate etiquetas with GROUP_CONCAT
- Added `get_unique_etiquetas()` function for filter options
- Added `/etiquetas-options` endpoint
- Modified search to:
  - Handle special "etiquetas" filter by joining with etiquetas table
  - Include aggregated etiquetas in response

### 11.2 Portfolio Router Changes

**File:** `/backend/app/routers/portfolio.py`

- Added Descripcion, Transaccion, GrupoIniciativa models
- Added special case for `transacciones`: filters by `clave1` instead of `portfolio_id`
- Added special case for `grupos_iniciativas`: returns dual structure:
  ```python
  {
    "as_grupo": [...],      # Records where this initiative is the parent
    "as_componente": [...]  # Records where this initiative is a component
  }
  ```

---

## 12. Error Handling

| Scenario | Handling |
|----------|----------|
| Search API error | Show error toast, keep last results |
| Detail API 404 | Show "Initiative not found" message |
| Export failure | Show error toast with message |
| Network error | Show retry button |

---

## 13. Loading States

| Component | Loading Display |
|-----------|-----------------|
| Search results | Skeleton rows (5 rows) |
| Detail page | Skeleton for each section |
| Export | Button shows spinner + "Exporting..." |
| Filter options | Skeleton in dropdowns |

---

## 14. Accessibility

- All interactive elements keyboard navigable
- ARIA labels on icon-only buttons
- Focus visible indicators
- Screen reader announcements for search results count
- Accessible accordion pattern
- Keyboard shortcuts (Enter, Ctrl+Shift+X)

---

## 15. Performance Considerations

- Server-side pagination (max 1000 per request)
- Server-side sorting (avoid client-side sort on large datasets)
- Lazy load filter options on panel open
- Memoize column definitions
- Debounce text input filters (300ms)
- Paginated export for large datasets

---

## 16. Implementation Status

**Completed:**
- [x] All filter types working (including etiquetas)
- [x] Column selection/ordering persisted
- [x] Pagination with configurable page size
- [x] Sorting on all columns
- [x] Export to all 4 formats (TSV, CSV, JSON, Excel)
- [x] Detail page shows all 16 sections (including Etiquetas)
- [x] Accordion expand/collapse working
- [x] Sections default open when data present
- [x] Empty sections handled gracefully
- [x] Future action buttons visible but disabled
- [x] Back navigation working
- [x] Portfolio ID as clickable link
- [x] Keyboard shortcuts (Enter, Ctrl+Shift+X)
- [x] Focus on portfolio_id field on load
- [x] Longtext field handling
- [x] Grupos Iniciativas dual view (as_grupo/as_componente)
- [x] Transacciones using clave1
- [x] Importes as table format
- [x] z-index fixes for filter dropdowns
- [x] Responsive on mobile/tablet/desktop
- [x] Backend etiquetas aggregation and filtering

---

## 17. Known Issues and Notes

1. **Backend restart required:** After modifying backend routes, restart the server for changes to take effect
2. **Backend limit:** Max 1000 rows per search request - export paginates automatically
3. **Etiquetas filter:** Requires the `/etiquetas-options` endpoint to be available
