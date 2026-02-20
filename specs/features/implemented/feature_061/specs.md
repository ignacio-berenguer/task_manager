# Feature 061 — Detail Page Advanced Features (E6, E7, E8)

## Overview

Three advanced detail page improvements identified in the feature_052 audit:
- **E6**: Section edit history modal
- **E7**: Related initiatives widget
- **E8**: Unified activity timeline

---

## E6 — Section Edit History

### Concept

Add a "History" button (clock icon) to each editable section's accordion header. When clicked, open a modal showing all `transacciones_json` records for that specific entity type and portfolio_id.

### Backend: New Endpoint

**Endpoint:** `GET /api/v1/portfolio/{portfolio_id}/history?entity={entity_name}`

History merges data from two sources:
1. **`transacciones_json`** — app-level CRUD changes (filtered by `entidad`)
2. **`transacciones`** — legacy Excel audit trail (mapped from Excel sheet names via `_LEGACY_TABLE_MAP`)

Each record includes a `source` field (`"app"` or `"excel"`) so the frontend can display origin badges.

**Route placement:** In `routers/portfolio.py`, defined BEFORE the existing `GET /{portfolio_id}` route.

### Frontend Design

**History Button Placement:**
- Add a clock icon button (`Clock` from lucide-react) in each editable section's `SectionAccordion` header, next to the existing action buttons (Plus/Pencil/Export)
- Only show on sections that have `crudAction` defined (editable sections)
- Button style: ghost/outline, same size as existing header action buttons

**SectionHistoryModal Component:**
- New component: `frontend/src/features/detail/components/SectionHistoryModal.jsx`
- Props: `open`, `onOpenChange`, `portfolioId`, `entityName`, `entityLabel`
- Fetches data on-demand via `useQuery` from `GET /portfolio/{pid}/history?entity={entityName}`
- Content:
  - Title: "Historial — {entityLabel}"
  - Table columns: `fecha_creacion`, `source` (App/Excel badge), `usuario`, `tipo_operacion` (colored badge), `estado_db` (badge), `mensaje_commit`
  - Expandable rows: clicking a row reveals JSON diff view showing `cambios` and `clave_primaria`
  - Empty state: "No hay cambios registrados para esta sección"
  - Sort: Most recent first (descending by fecha_creacion, done server-side)

### Affected Files

| File | Change |
|------|--------|
| `backend/app/routers/portfolio.py` | Add `GET /{pid}/history` endpoint with legacy table mapping |
| `SectionAccordion.jsx` | Add `onHistory` prop for clock button |
| `DetailPage.jsx` | Pass history handler + modal state for each section |
| `SectionHistoryModal.jsx` | **New** — Modal component with on-demand data fetching |
| `components/index.js` | Export new component |

---

## E7 — Related Initiatives Widget

### Concept

Add a "Iniciativas Relacionadas" section at the bottom of the Detail page (before the audit sections). Shows initiatives related by shared highlighted etiquetas or grupo membership.

### Backend: New Endpoint

**Endpoint:** `GET /api/v1/portfolio/{portfolio_id}/related`

**Relatedness Criteria (refined after initial implementation):**
- ~~Cluster, unidad~~ — **excluded** (too many matches, not meaningful)
- ~~All etiquetas~~ — **excluded** (too broad)
- **Shared etiquetas destacadas** — only etiquetas that are in the `etiquetas_destacadas` parametric table
- **Same grupo de iniciativas** — initiatives sharing a parent grupo, sibling components, or child components via the `grupos_iniciativas` table

**Logic:**
1. Query `etiquetas_destacadas` to get the set of highlighted tag names
2. Get current initiative's etiquetas, filter to only those in the destacadas set
3. Find other initiatives sharing those highlighted etiquetas
4. Query `grupos_iniciativas` for current initiative (as grupo and as componente)
5. Collect parent grupo, sibling components, and child components as related
6. Deduplicate by portfolio_id, aggregate reasons
7. Enrich with `nombre` from `datos_descriptivos`
8. Return sorted by number of shared attributes (most related first)

**Response Schema:**
```json
{
  "portfolio_id": "SPA_25_001",
  "related": [
    {
      "portfolio_id": "SPA_25_042",
      "nombre": "Initiative Name",
      "reasons": [
        {"type": "etiqueta", "value": "Plan de Eficiencias 2025"},
        {"type": "grupo", "value": "Mismo grupo: PIC"}
      ]
    }
  ]
}
```

**Limits:**
- Max 20 related initiatives returned (to avoid overwhelming the UI)
- Exclude the current initiative from results

**Route placement:** In `routers/portfolio.py`, define BEFORE the existing `GET /{portfolio_id}` route (static before dynamic rule).

### Frontend Design

**RelatedInitiativesSection Component:**
- New component: `frontend/src/features/detail/components/sections/RelatedInitiativesSection.jsx`
- Displayed as a new accordion section with id `'related-initiatives'`
- Position: After all entity sections, before `transacciones` audit sections
- Content:
  - Table with columns: `portfolio_id` (link to detail), `nombre`, `razones` (badges)
  - Badges: etiqueta=blue, grupo=purple
  - Empty state: "No se encontraron iniciativas relacionadas"
- Read-only section (no CRUD)

**Data Fetching:**
- New hook: `useRelatedInitiatives(portfolio_id)` in `hooks/`
- Query key: `['portfolio-related', portfolio_id]`
- Stale time: 5 minutes (same as portfolio detail)
- Fetched independently from portfolio detail data

### Affected Files

| File | Change |
|------|--------|
| `backend/app/routers/portfolio.py` | Add `GET /{pid}/related` endpoint |
| `RelatedInitiativesSection.jsx` | **New** — Section component |
| `useRelatedInitiatives.js` | **New** — Data fetching hook |
| `DetailPage.jsx` | Add section definition, render section |
| `sections/index.js` | Export new component |
| `hooks/index.js` | Export new hook |

---

## E8 — Unified Activity Timeline

### Concept

Add an "Actividad" accordion section that combines hechos, notas, and transacciones_json into a single chronological timeline, providing a unified view of all activity for an initiative.

### Backend: New Endpoint

**Endpoint:** `GET /api/v1/portfolio/{portfolio_id}/timeline`

**Logic:**
1. Query `hechos` WHERE `portfolio_id = pid` → extract `fecha`, type="hecho", summary from `notas` or `estado` field
2. Query `notas` WHERE `portfolio_id = pid` → extract `fecha`, type="nota", summary from `nota` field
3. Query `transacciones_json` WHERE `portfolio_id = pid` → extract `fecha_creacion`, type="transaccion", summary from `entidad` + `tipo_operacion`
4. Merge all into unified list, sort by date descending
5. Return paginated (default limit=50)

**Response Schema:**
```json
{
  "portfolio_id": "SPA_25_001",
  "total": 45,
  "timeline": [
    {
      "date": "2025-12-15T10:30:00",
      "type": "transaccion",
      "summary": "UPDATE en notas",
      "detail": "Actualizado campo 'nota'",
      "user": "John Doe",
      "badge": "UPDATE",
      "source_id": 123
    },
    {
      "date": "2025-12-10",
      "type": "hecho",
      "summary": "APROBADO — 150.000 EUR",
      "detail": "Partida: IT-2025-001",
      "user": null,
      "badge": "APROBADO",
      "source_id": 456
    },
    {
      "date": "2025-12-05",
      "type": "nota",
      "summary": "Reunión con el equipo de infraestructura...",
      "detail": null,
      "user": "Jane Smith",
      "badge": null,
      "source_id": 789
    }
  ]
}
```

**Query Parameters:**
- `limit` (default 50, max 200)
- `offset` (default 0)

**Route placement:** In `routers/portfolio.py`, define BEFORE the existing `GET /{portfolio_id}` route.

### Frontend Design

**ActivityTimelineSection Component:**
- New component: `frontend/src/features/detail/components/sections/ActivityTimelineSection.jsx`
- Displayed as a new accordion section with id `'activity-timeline'`
- Position: After "Related Initiatives", before audit sections
- Content:
  - Vertical timeline layout (not table — each entry is a card/row)
  - Each entry shows:
    - Date (formatted DD/MM/YYYY HH:mm or DD/MM/YYYY)
    - Type icon: `FileText` for hecho, `StickyNote` for nota, `ArrowRightLeft` for transaccion
    - Type badge with color: hecho=amber, nota=sky, transaccion=violet
    - Summary text (truncated to ~200 chars with ellipsis)
    - User name (if available)
    - Optional state change badge (e.g., "APROBADO", "INSERT", "DELETE")
  - "Cargar más" button at bottom for pagination (load next 50)
  - Empty state: "No hay actividad registrada"
- Read-only section (no CRUD)

**Data Fetching:**
- New hook: `useActivityTimeline(portfolio_id)` in `hooks/`
- Query key: `['portfolio-timeline', portfolio_id]`
- Supports pagination via `limit`/`offset` parameters
- Uses `useInfiniteQuery` or manual offset tracking for "load more" pattern

### Affected Files

| File | Change |
|------|--------|
| `backend/app/routers/portfolio.py` | Add `GET /{pid}/timeline` endpoint |
| `ActivityTimelineSection.jsx` | **New** — Section component |
| `useActivityTimeline.js` | **New** — Data fetching hook |
| `DetailPage.jsx` | Add section definition, render section |
| `sections/index.js` | Export new component |
| `hooks/index.js` | Export new hook |

---

## Section Ordering in Detail Page

Updated section order (new sections marked with *):

1. Datos Descriptivos
2. Informacion Economica
3. Importes
4. Notas
5. Hechos
6. Etiquetas
7. Acciones
8. Justificaciones
9. Descripciones
10. LTP
11. WBEs
12. Dependencias
13. Grupos Iniciativas
14. Estado Especial
15. Impacto AATT
16. Beneficios
17. Facturacion
18. Datos Ejecucion
19. Documentos
20. Secciones sin datos
21. **Related Initiatives** *(new)*
22. **Activity Timeline** *(new)*
23. Transacciones (audit)
24. Transacciones JSON (audit)

---

## Additional Fix: EstadoTag in KeyValueDisplay

During implementation, the `estado_de_la_iniciativa` field in the Datos Descriptivos section was found to render as plain text instead of a styled tag. Fixed by:
- Adding `EstadoTag` support to `KeyValueDisplay.jsx` for `type: 'estado'` fields
- Changing the field type in `DatosDescriptivosSection.jsx` from `'text'` to `'estado'`

---

## Non-Functional Requirements

- **Performance**: Related initiatives endpoint should respond within 500ms (3 queries + dedup)
- **Performance**: Timeline endpoint should respond within 300ms (3 queries + merge + sort)
- **Accessibility**: All new buttons have `aria-label` attributes
- **Responsive**: Timeline and related sections work on mobile (stack vertically)
- **Error handling**: Each new section handles loading/error states independently
- **No breaking changes**: Existing detail page behavior unchanged
