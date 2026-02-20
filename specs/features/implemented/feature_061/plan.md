# Feature 061 — Implementation Plan

## Phase 1: E6 — Section Edit History (Frontend only)

### Step 1.1: Create SectionHistoryModal component
- **File**: `frontend/src/features/detail/components/SectionHistoryModal.jsx` (new)
- Create modal with Dialog component (same pattern as EntityFormModal)
- Table with columns: fecha_creacion, usuario, tipo_operacion (colored badge), estado_db (badge), mensaje_commit
- Expandable row detail: parsed JSON view of `cambios` and `clave_primaria`
- Props: `open`, `onOpenChange`, `entityName`, `entityLabel`, `transactions`
- Filter logic: receives pre-filtered transactions array
- Sort by fecha_creacion descending
- Empty state message

### Step 1.2: Add history button to SectionAccordion
- **File**: `frontend/src/features/detail/components/SectionAccordion.jsx`
- Add optional `onHistory` prop
- Render Clock icon button in header actions area (between existing action buttons and export)
- Only renders when `onHistory` is provided

### Step 1.3: Wire history modal in DetailPage
- **File**: `frontend/src/features/detail/DetailPage.jsx`
- Add state: `historyModal` with `{ open: false, entityName: '', entityLabel: '' }`
- Create `openHistory(entityName, entityLabel)` handler
- Filter `transaccionesJson` data by `entidad === entityName` when passing to modal
- Pass `onHistory` callback to each editable section's SectionAccordion
- Render `SectionHistoryModal` once (shared across all sections)

### Step 1.4: Export new component
- **File**: `frontend/src/features/detail/components/index.js`
- Add SectionHistoryModal export

---

## Phase 2: E7 — Related Initiatives

### Step 2.1: Create backend endpoint
- **File**: `backend/app/routers/portfolio.py`
- Add `GET /portfolio/{portfolio_id}/related` endpoint
- Place BEFORE the existing `GET /{portfolio_id}` route
- Implementation:
  1. Query `datos_descriptivos` for current initiative's `cluster` and `unidad`
  2. Query `etiquetas` for current initiative's tag list
  3. Find matching initiatives by cluster (datos_descriptivos)
  4. Find matching initiatives by unidad (datos_descriptivos)
  5. Find matching initiatives by shared etiquetas (etiquetas table)
  6. Deduplicate by portfolio_id, collect reasons
  7. Enrich with `nombre` from datos_descriptivos
  8. Sort by number of reasons (descending), limit to 20
  9. Return response

### Step 2.2: Create useRelatedInitiatives hook
- **File**: `frontend/src/features/detail/hooks/useRelatedInitiatives.js` (new)
- Use `useQuery` with key `['portfolio-related', portfolioId]`
- Fetch from `GET /portfolio/{portfolioId}/related`
- Stale time: 5 minutes
- Export from `hooks/index.js`

### Step 2.3: Create RelatedInitiativesSection component
- **File**: `frontend/src/features/detail/components/sections/RelatedInitiativesSection.jsx` (new)
- Table with columns: portfolio_id (link), nombre, razones (badges)
- Badge colors: cluster=purple, etiqueta=blue, unidad=green
- Loading spinner while fetching
- Empty state message
- Export from `sections/index.js`

### Step 2.4: Integrate into DetailPage
- **File**: `frontend/src/features/detail/DetailPage.jsx`
- Add section definition to SECTION_DEFS: `{ id: 'related-initiatives', title: 'Iniciativas Relacionadas', ... }`
- Call `useRelatedInitiatives(portfolio_id)` hook
- Render RelatedInitiativesSection in the appropriate position (after entity sections, before audit)
- Add to DetailNav sidebar

---

## Phase 3: E8 — Unified Activity Timeline

### Step 3.1: Create backend endpoint
- **File**: `backend/app/routers/portfolio.py`
- Add `GET /portfolio/{portfolio_id}/timeline` endpoint
- Place BEFORE the existing `GET /{portfolio_id}` route (alongside related)
- Implementation:
  1. Query `hechos` for portfolio_id → map to timeline entries
  2. Query `notas` for portfolio_id → map to timeline entries
  3. Query `transacciones_json` for portfolio_id → map to timeline entries
  4. Merge all entries into single list
  5. Sort by date descending
  6. Apply pagination (limit/offset)
  7. Return with total count

### Step 3.2: Create useActivityTimeline hook
- **File**: `frontend/src/features/detail/hooks/useActivityTimeline.js` (new)
- Use `useQuery` with key `['portfolio-timeline', portfolioId, page]`
- Fetch from `GET /portfolio/{portfolioId}/timeline?limit=50&offset=0`
- Support "load more" via offset increment
- Export from `hooks/index.js`

### Step 3.3: Create ActivityTimelineSection component
- **File**: `frontend/src/features/detail/components/sections/ActivityTimelineSection.jsx` (new)
- Vertical timeline layout with cards
- Each entry: date, type icon+badge, summary, user, optional state badge
- Type icons: FileText (hecho), StickyNote (nota), ArrowRightLeft (transaccion)
- Type badge colors: hecho=amber, nota=sky, transaccion=violet
- "Cargar más" button for pagination
- Loading/empty states
- Export from `sections/index.js`

### Step 3.4: Integrate into DetailPage
- **File**: `frontend/src/features/detail/DetailPage.jsx`
- Add section definition to SECTION_DEFS
- Call `useActivityTimeline(portfolio_id)` hook
- Render ActivityTimelineSection after RelatedInitiatives, before audit sections
- Add to DetailNav sidebar

---

## Phase 4: Post-Implementation

### Step 4.1: Version bump and changelog
- **File**: `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 61
- **File**: `frontend/src/lib/changelog.js` — add entry at TOP of CHANGELOG array

### Step 4.2: Update documentation
- **File**: `README.md` — update detail page section to mention new features
- **File**: `specs/architecture/architecture_backend.md` — document new endpoints
- **File**: `specs/architecture/architecture_frontend.md` — document new components

---

## File Summary

### New Files (7)
| File | Phase |
|------|-------|
| `frontend/src/features/detail/components/SectionHistoryModal.jsx` | 1 |
| `frontend/src/features/detail/hooks/useRelatedInitiatives.js` | 2 |
| `frontend/src/features/detail/components/sections/RelatedInitiativesSection.jsx` | 2 |
| `frontend/src/features/detail/hooks/useActivityTimeline.js` | 3 |
| `frontend/src/features/detail/components/sections/ActivityTimelineSection.jsx` | 3 |

### Modified Files (7)
| File | Phase |
|------|-------|
| `frontend/src/features/detail/components/SectionAccordion.jsx` | 1 |
| `frontend/src/features/detail/DetailPage.jsx` | 1, 2, 3 |
| `frontend/src/features/detail/components/index.js` | 1 |
| `frontend/src/features/detail/components/sections/index.js` | 2, 3 |
| `frontend/src/features/detail/hooks/index.js` | 2, 3 |
| `backend/app/routers/portfolio.py` | 2, 3 |
| Post-implementation docs (version, changelog, README, architecture) | 4 |

### Dependencies Between Phases
- Phases 1, 2, and 3 are **independent** — can be developed in any order
- Phase 4 runs after all three are complete
- Within each phase, steps are sequential
