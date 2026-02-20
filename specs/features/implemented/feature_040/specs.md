# Specs — feature_040: UI Improvements (Sticky Headers, Drawer Data, Estado Tags)

## Overview

Three independent UI improvements: (1) sticky table header in Search, (2) additional data tables in the InitiativeDrawer, (3) consistent fixed-width centered EstadoTag styling.

## Change 1: Sticky Table Header in Search

### Current State

`DataGrid.jsx` (line 239): `<thead>` is a normal table header that scrolls away with the table content. The table is inside `<div className="rounded-lg border overflow-x-auto">`.

`Navbar.jsx` (line 68): Sticky at top, `z-50`, height `h-16` (64px).

### Implementation

Add `sticky top-0 z-10` to `<thead>` rows, with solid background matching the theme. Since the page scrolls vertically (not just the table), the sticky offset must account for the navbar height.

**Approach**: Apply `sticky` positioning to each `<th>` element (CSS limitation: `<thead>` and `<tr>` don't support sticky in all browsers, but `<th>` does). Set `top: 4rem` (64px = navbar height) and add `z-10` so it stays above table body content.

**Files**: `frontend/src/features/search/components/DataGrid.jsx`

- On the main data `<thead>` `<tr>` (line 242): add sticky-compatible styles to each `<th>`
- On the loading skeleton `<thead>` (line 184) and empty state `<thead>` (line 210): same treatment for consistency
- The `<th>` elements need `sticky top-16 z-10 bg-muted/60` (or opaque `bg-muted` to prevent content bleeding through)
- Since `bg-muted/60` is semi-transparent, change to a fully opaque background: `bg-muted` for the sticky header

**Important**: The parent `<div>` has `overflow-x-auto` which creates a new stacking context on the x-axis. Sticky works on the y-axis as long as the scroll container is the viewport (page-level scroll), which it is in this layout. The `overflow-x-auto` on the wrapper does NOT break y-axis sticky because it only constrains the x-axis.

## Change 2: Additional Data Tables in InitiativeDrawer

### Current State

`InitiativeDrawer.jsx` shows: key-value grid (6 fields), importe current year, hechos table (fetched via `/hechos/search`), and a "Go to Initiative" button.

### Implementation

Add 4 new data sections: Notas, Justificaciones, Descripciones, Dependencias. Fetch from `GET /api/v1/portfolio/{pid}` which returns all tables for a portfolio in one call.

**Data Fetching Strategy**:
- Replace (or supplement) the current `/hechos/search` call with a single `GET /api/v1/portfolio/{pid}` call
- This endpoint returns `{ notas: [...], justificaciones: [...], descripciones: [...], dependencias: [...], hechos: [...], ... }`
- Benefits: one API call instead of five, simpler code
- Replace the separate hechos fetch with data from the portfolio response

**New Sections** (inserted after Hechos, before the button):

| Section | Fields Displayed | Sort |
|---------|-----------------|------|
| Notas | fecha, registrado_por, nota | fecha desc |
| Justificaciones | tipo_justificacion, valor, comentarios | tipo_justificacion asc |
| Descripciones | tipo_descripcion, descripcion | tipo_descripcion asc |
| Dependencias | descripcion_dependencia, fecha_dependencia, comentarios | descripcion_dependencia asc |

Each section:
- Has a heading with count badge: `"Notas (5)"`
- Only renders the table if data exists (count > 0), otherwise shows "Sin {entity} registradas."
- Uses the same compact table styling as the existing Hechos table
- The `nota` and `descripcion` fields can be long text — show with `whitespace-pre-wrap` and limited height

**File**: `frontend/src/components/shared/InitiativeDrawer.jsx`

## Change 3: Fixed-Width Centered EstadoTag

### Current State

`EstadoTag.jsx` (line 13): `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium` — auto-sizes to content, left-aligned within parent.

### Implementation

Add a minimum width and center alignment so all tags look consistent regardless of text length.

The longest estado value is "Pendiente de Unidad Solicitante" (31 chars). At `text-xs` (12px font), this is approximately 190px. However, in the Hechos table within the drawer and in report tables, the estado values are shorter (e.g., "SM200 Final", "En Aprobación"). A single fixed width for all contexts would be too wide for compact tables.

**Approach**: Add `min-w-[8.5rem] justify-center text-center` to the `EstadoTag` span. This sets a minimum width of 136px which fits most values and provides visual alignment. Longer values like "Pendiente de Unidad Solicitante" will naturally expand beyond the minimum. The `justify-center` + `text-center` centers the text within the tag.

**File**: `frontend/src/components/shared/EstadoTag.jsx`

- Change: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium`
- To: `inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium min-w-[8.5rem] text-center`

## Additional Changes (implemented during development)

### Change 4: Estado Tags in Search DataGrid

Added `ESTADO` type to `COLUMN_TYPES` in `columnDefinitions.js`. Updated 7 estado columns to use this type. DataGrid cell renderer renders `<EstadoTag>` for ESTADO-typed columns.

### Change 5: Sticky Headers Across All Report Pages

Applied the same sticky header pattern (`overflow-auto max-h-[calc(100vh-20rem)]` on wrapper, `sticky top-0 z-10 bg-muted` on `<th>`) to:
- GenericReportPage standard table
- GenericReportPage CollapsibleReportTable
- Hechos ReportPage

This affects all 6 report pages: LTPs, Acciones, Etiquetas, Transacciones, Transacciones JSON, and Hechos.

### Change 6: Estado Tags in Acciones Report

Changed `siguiente_accion` and `estado_de_la_iniciativa` column types from `text` to `estado` in AccionesReportPage so they render as colored tags.

### Change 7: LTP Estado Colors + Longtext Nombre

Added `Completado` (GREEN) and `Pendiente` (RED) to `estadoColors.js`. Changed `nombre` column type to `longtext` in LTPsReportPage. Added `longtext` rendering case in CollapsibleRow main columns.

### Change 8: Drawer Button as Dedicated Column

Moved the quick-view drawer button from inside RowActions (Search) and inline in portfolio_id cell (Hechos) to a dedicated column placed just before portfolio_id. Added drawer support to GenericReportPage via `showDrawer` config option, enabled for LTPs and Acciones.

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/search/components/DataGrid.jsx` | Sticky `<th>` with `top-0 z-10`, drawer column before portfolio_id, ESTADO type rendering |
| `frontend/src/features/search/components/RowActions.jsx` | Removed drawer button (moved to dedicated column) |
| `frontend/src/features/search/utils/columnDefinitions.js` | Added `ESTADO` type, updated 7 estado columns |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Replace hechos-only fetch with portfolio endpoint, add 4 data tables |
| `frontend/src/components/shared/EstadoTag.jsx` | Add `min-w-[8.5rem] justify-center text-center` |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Sticky headers, drawer column support (`showDrawer`), longtext in collapsible rows |
| `frontend/src/features/reports/ReportPage.jsx` | Sticky headers, drawer column before portfolio_id |
| `frontend/src/features/reports/LTPsReportPage.jsx` | `nombre` as longtext, `showDrawer: true` |
| `frontend/src/features/reports/AccionesReportPage.jsx` | `siguiente_accion` and `estado_de_la_iniciativa` as estado, `showDrawer: true` |
| `frontend/src/lib/estadoColors.js` | Added Completado (GREEN), Pendiente (RED) |

## No Backend Changes

All data is already available from existing API endpoints. No new endpoints or modifications needed.
