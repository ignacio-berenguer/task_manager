# Feature 038 — UI Improvements: Tags, Expandable Rows, Side Drawer, Parametricas CRUD

## Overview

Six UI enhancements across reports, detail page, and a new admin page:

1. **Hechos Report — Side Drawer**: Reuse the Search page's InitiativeDrawer pattern
2. **Estado Tag Component**: Reusable tag/badge for estado fields across pages
3. **Hechos Report — Expandable Rows**: Show full hecho details on row expand
4. **LTP Report — Estado Tag**: Render estado as tag in LTP report
5. **LTP Report — Expandable Rows**: Expand to show comentarios
6. **Parametricas Page**: New CRUD page for managing the `parametros` table

---

## 1. Hechos Report — Side Drawer

### Current State
- `ReportPage.jsx` (Hechos) is a **custom** component (does NOT use GenericReportPage)
- No drawer or row actions exist; rows are static table rows
- The Search page has a working pattern: `RowActions` button → `handleOpenDrawer(portfolioId)` → `InitiativeDrawer` (Sheet component)

### Design

**Approach**: Extract InitiativeDrawer to a shared component and add a row action button to the Hechos report table.

**Changes**:
- Move `InitiativeDrawer` from `features/search/components/` to `components/shared/InitiativeDrawer.jsx` so it can be reused
- Update SearchPage imports to point to the new shared location
- Add drawer state to `ReportPage.jsx` (`drawerData: { isOpen, rowData }`)
- Add a "Quick View" button (PanelRightOpen icon) in each row's portfolio_id cell or as a dedicated actions column
- Wire the button to open the InitiativeDrawer with the row's data

**Data Flow**:
- The Hechos report search response already contains `portfolio_id` and joined datos_relevantes fields (nombre, digital_framework, estado, unidad, cluster, etc.)
- The InitiativeDrawer receives `rowData` (the full row object) and fetches hechos internally
- No additional API changes needed

### Files Modified
- `frontend/src/components/shared/InitiativeDrawer.jsx` (new shared location)
- `frontend/src/features/search/SearchPage.jsx` (update import)
- `frontend/src/features/reports/ReportPage.jsx` (add drawer state + button + component)

---

## 2. Estado Tag Component

### Current State
- Estado is rendered as plain text everywhere (Hechos report, Etiquetas report, Detail/Hechos, LTP report)
- `badgeColors.js` has a color-mapping pattern used for transacciones badges
- `estadoOrder.js` defines 21 canonical estados but has NO color mappings
- `Badge` component exists in `components/ui/badge.jsx` with variants
- `TransactionBadge` exists in `badgeColors.js` as an inline badge

### Design

**Create `EstadoTag` component** (`frontend/src/components/shared/EstadoTag.jsx`):
- Renders a styled inline badge with a color based on the estado value
- Uses the same `rounded-full px-2 py-0.5 text-xs font-medium` pattern as TransactionBadge
- Null/empty values render as `"—"` (no badge)
- Unknown values get a neutral gray color

**Color Mapping** (`frontend/src/lib/estadoColors.js`):

The 21 estados grouped into semantic color categories:

| Category | Color | Estados |
|----------|-------|---------|
| Reception/Draft | Slate | Recepción |
| Documentation (SM100/SM200) | Blue | SM100 Redacción, SM100 Final, SM200 En Revisión, SM200 Final |
| Review/Analysis | Amber | Análisis BI, Pendiente de Unidad Solicitante, Revisión Regulación, En Revisión P&C |
| Approval | Indigo | En Aprobación, Encolada por Prioridad |
| Approved | Emerald | Aprobada, Aprobada con CCT |
| Execution | Cyan | En ejecución |
| Completed | Green | Finalizado |
| Administrative | Gray | Pendiente PES, Facturación cierre año, Cierre económico iniciativa |
| Planning | Violet | Importe Estimado, Importe Planificado |
| Cancelled | Red | Cancelado |

Each color follows the light/dark pattern: `bg-{color}-100 text-{color}-800 dark:bg-{color}-900/30 dark:text-{color}-400`

**Note on Hechos estado vs Initiative estado**: The `hechos.estado` field contains hecho-specific status values (not the 21 initiative estados from `estadoOrder.js`). The EstadoTag component will handle both by applying the defined color mapping for known values and a neutral gray for unrecognized values. This makes it safe to use for any estado-like field across the app.

### Where to Apply

| Location | Column | Source Field |
|----------|--------|-------------|
| Hechos Report (`ReportPage.jsx`) | Estado | `hechos.estado` |
| Etiquetas Report (`EtiquetasReportPage.jsx`) | Estado | New joined column from datos_relevantes |
| Detail Page Hechos Table (`HechosSection.jsx`) | Estado | `hechos.estado` |
| LTP Report (`LTPsReportPage.jsx`) | Estado | `ltp.estado` |

### Etiquetas Report — Adding Estado Column

The Etiquetas table does NOT have its own `estado` field. To display estado in the Etiquetas report:
- Add `estado_de_la_iniciativa` as a joined column from `datos_relevantes` in the backend (`search-report-etiquetas` endpoint)
- Add `estado_de_la_iniciativa` column to `REPORT_COLUMNS` and `ADDITIONAL_COLUMNS` in `EtiquetasReportPage.jsx`
- Render it with `EstadoTag`

### Files Created
- `frontend/src/components/shared/EstadoTag.jsx`
- `frontend/src/lib/estadoColors.js`

### Files Modified
- `frontend/src/features/reports/ReportPage.jsx` — Use EstadoTag for estado cell
- `frontend/src/features/reports/EtiquetasReportPage.jsx` — Add estado column with EstadoTag
- `frontend/src/features/reports/LTPsReportPage.jsx` — Use EstadoTag for estado cell
- `frontend/src/features/detail/components/sections/HechosSection.jsx` — Use EstadoTag for estado cell
- `frontend/src/features/detail/components/SimpleTable.jsx` — Support `type: 'estado'` rendering
- `backend/app/routers/etiquetas.py` — Join estado_de_la_iniciativa from datos_relevantes
- `frontend/src/features/reports/components/GenericReportPage.jsx` — Support `type: 'estado'` in cell rendering

---

## 3. Hechos Report — Expandable Rows

### Current State
- Hechos report uses a standard flat table with TanStack React Table
- No expand/collapse capability
- All hecho fields: id_hecho, portfolio_id, partida_presupuestaria, importe, estado, fecha, importe_ri, importe_re, notas, racional, calidad_estimacion

### Design

**Approach**: Add row expansion to the custom `ReportPage.jsx`.

**Implementation**:
- Add `expandedRowId` state (tracks which row is expanded, one at a time)
- Add a chevron column (first column) that toggles expansion
- Clicking a row toggles its expanded state
- Expanded area shows a detail panel with all hecho fields not in the visible columns

**Expanded Detail Panel Layout**:
```
┌─────────────────────────────────────────────────────┐
│ [Chevron] | portfolio_id | fecha | estado | ...     │  ← Main row
├─────────────────────────────────────────────────────┤
│   Partida Presupuestaria: [value]                   │
│   Importe RI: [formatted]  |  Importe RE: [formatted] │
│   Calidad Estimación: [value]                       │
│   Racional:                                         │
│   [full text in pre block]                          │
│   Notas:                                            │
│   [full text in pre block]                          │
└─────────────────────────────────────────────────────┘
```

- Detail fields shown in expanded area: any fields not already visible as columns
- Long text fields (notas, racional) rendered with `whitespace-pre-wrap` in a styled block
- Currency fields (importe_ri, importe_re) formatted with CurrencyCell-style formatting

### Files Modified
- `frontend/src/features/reports/ReportPage.jsx` — Add expand state, chevron column, detail row rendering

---

## 4. LTP Report — Estado Tag

Already covered in Section 2. The LTP report (`LTPsReportPage.jsx`) uses GenericReportPage, so the change is:
- Add `type: 'estado'` to the estado column definition in LTPsReportPage.jsx
- GenericReportPage renders `EstadoTag` for columns with `type: 'estado'`

---

## 5. LTP Report — Expandable Rows

### Current State
- LTP report uses `GenericReportPage` (standard table, not collapsible mode)
- `comentarios` is already a default visible column with `type: 'longtext'`
- GenericReportPage already supports `collapsibleConfig` for expandable rows (used by transacciones reports)

### Design

**Approach**: Use GenericReportPage's existing `collapsibleConfig` pattern.

**Implementation**:
- Add `collapsibleConfig` to the LTP report config:
  ```javascript
  collapsibleConfig: {
    mainColumnIds: ['portfolio_id', 'nombre', 'tarea', 'siguiente_accion', 'estado'],
    badgeColumns: {},  // estado handled by EstadoTag via type:'estado'
    detailColumnIds: ['comentarios', 'responsable'],
  }
  ```
- The `comentarios` column remains available as a normal table column too (user choice via ColumnConfigurator)
- When using collapsible mode, rows show the main columns and expand to reveal comentarios

**Note**: The `collapsibleConfig` in GenericReportPage currently renders its own table (not TanStack). The badge rendering in collapsible mode uses `badgeColumns` with color maps. For estado, we'll enhance the collapsible renderer to also support the `type: 'estado'` rendering via EstadoTag.

### Files Modified
- `frontend/src/features/reports/LTPsReportPage.jsx` — Add collapsibleConfig
- `frontend/src/features/reports/components/GenericReportPage.jsx` — Support `type: 'estado'` in CollapsibleRow rendering

---

## 6. Parametricas Page — CRUD

### Current State
- **Database**: `parametros` table exists (id, nombre_parametro, valor, orden, fecha_creacion) with unique(nombre_parametro, valor)
- **Backend**: Read-only router at `/parametros/{nombre_parametro}` (Feature 037)
- **Frontend**: No admin page for parametros; values are only consumed as dropdown options

### Design

#### Backend — CRUD Endpoints

Add to `backend/app/routers/parametros.py`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parametros/` | List all parametros (grouped by nombre_parametro) |
| POST | `/parametros/` | Create a new parametro |
| PUT | `/parametros/{id}` | Update a parametro |
| DELETE | `/parametros/{id}` | Delete a parametro |

**Important**: The existing `GET /parametros/{nombre_parametro}` endpoint must remain (used by entity forms). New routes must be defined BEFORE it to avoid FastAPI route conflicts.

**Schemas** (add to `schemas.py`):
```python
class ParametroCreate(BaseModel):
    nombre_parametro: str
    valor: str
    orden: int | None = None

class ParametroUpdate(BaseModel):
    nombre_parametro: str | None = None
    valor: str | None = None
    orden: int | None = None
```

**List Endpoint Response**:
```json
{
  "data": [
    { "id": 1, "nombre_parametro": "estado", "valor": "Recepción", "orden": 1, "fecha_creacion": "..." },
    ...
  ],
  "total": 150
}
```

**CRUD through transacciones_json**: The requirement says CRUD should go through transacciones_json. However, parametros are configuration data (not initiative data), so direct CRUD is more appropriate. The transacciones_json system is designed for initiative-level changes that need Excel write-back. Parametros have no Excel counterpart. We'll use **direct CRUD** for parametros.

#### Frontend — Parametricas Page

**Route**: `/parametricas` (protected)
**Nav Item**: Add "Parametricas" to Navbar between "Trabajos" and auth controls (or in Informes dropdown)

**Page Structure** (`frontend/src/features/parametricas/ParametricasPage.jsx`):

```
┌──────────────────────────────────────────────────┐
│ Layout (Navbar + Footer)                          │
│ ┌──────────────────────────────────────────────┐ │
│ │ Title: "Parametricas"                         │ │
│ │ Subtitle: "Gestione los valores parametricos" │ │
│ ├──────────────────────────────────────────────┤ │
│ │ Filter: [nombre_parametro dropdown]           │ │
│ │ [+ Nuevo Parametro] button                    │ │
│ ├──────────────────────────────────────────────┤ │
│ │ Table:                                        │ │
│ │ | Nombre Parametro | Valor | Orden | Actions | │ │
│ │ | estado           | Rec.  | 1     | ✏️ 🗑️  | │ │
│ │ | estado           | SM100 | 2     | ✏️ 🗑️  | │ │
│ │ | ...              |       |       |         | │ │
│ └──────────────────────────────────────────────┘ │
│                                                    │
│ [Create/Edit Dialog]                               │
│ ┌──────────────────────┐                           │
│ │ Nombre Parametro: [_]│                           │
│ │ Valor:           [_] │                           │
│ │ Orden:           [_] │                           │
│ │ [Cancel] [Save]      │                           │
│ └──────────────────────┘                           │
│                                                    │
│ [Delete Confirmation Dialog]                       │
│ "¿Eliminar este parametro?"                        │
│ [Cancel] [Delete]                                  │
└──────────────────────────────────────────────────┘
```

**Features**:
- List all parametros, optionally filtered by nombre_parametro
- Group display: nombre_parametro as section headers or as a filter
- Create: Dialog with nombre_parametro (text or dropdown of existing names), valor, orden
- Edit: Same dialog pre-filled with existing values
- Delete: Confirmation dialog
- Client-side sorting by orden → valor within each nombre_parametro group

**Components**:
- `ParametricasPage.jsx` — Main page with table and state
- `ParametroFormDialog.jsx` — Create/Edit dialog (reuses Dialog from `components/ui/`)

### Files Created
- `frontend/src/features/parametricas/ParametricasPage.jsx`
- `frontend/src/features/parametricas/ParametroFormDialog.jsx`

### Files Modified
- `backend/app/routers/parametros.py` — Add CRUD endpoints
- `backend/app/schemas.py` — Add ParametroCreate, ParametroUpdate schemas
- `frontend/src/App.jsx` — Add `/parametricas` route
- `frontend/src/components/layout/Navbar.jsx` — Add "Parametricas" nav item

---

## Summary of All Files

### New Files
| File | Purpose |
|------|---------|
| `frontend/src/components/shared/EstadoTag.jsx` | Reusable estado tag/badge component |
| `frontend/src/lib/estadoColors.js` | Color mapping for estado values |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Shared drawer (moved from search) |
| `frontend/src/features/parametricas/ParametricasPage.jsx` | Parametricas CRUD page |
| `frontend/src/features/parametricas/ParametroFormDialog.jsx` | Create/Edit dialog |

### Modified Files
| File | Changes |
|------|---------|
| `frontend/src/features/reports/ReportPage.jsx` | Drawer + expandable rows + EstadoTag |
| `frontend/src/features/reports/EtiquetasReportPage.jsx` | Add estado column + EstadoTag |
| `frontend/src/features/reports/LTPsReportPage.jsx` | collapsibleConfig + EstadoTag |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Support `type: 'estado'` rendering |
| `frontend/src/features/detail/components/sections/HechosSection.jsx` | EstadoTag for estado column |
| `frontend/src/features/detail/components/SimpleTable.jsx` | Support `type: 'estado'` |
| `frontend/src/features/search/SearchPage.jsx` | Update drawer import path |
| `backend/app/routers/parametros.py` | Add CRUD endpoints |
| `backend/app/routers/etiquetas.py` | Join estado_de_la_iniciativa |
| `backend/app/schemas.py` | Add Parametro schemas |
| `frontend/src/App.jsx` | Add `/parametricas` route |
| `frontend/src/components/layout/Navbar.jsx` | Add nav item |
