# Technical Specification — feature_053: Quick Wins — Polish & Fixes

## Overview

Four independent UI improvements: (R1) enable searchable on all MultiSelect instances, (R2) persist FilterPanel collapsed state, (R3) Detail page collapse/expand all + empty section consolidation, (R4) landing page CTA button.

---

## R1: Enable `searchable` on all MultiSelect instances

### Current State

The `multi-select.jsx` component accepts `searchable` (default `false`). Audit:

| File | MultiSelect instances | Already searchable |
|------|----------------------|--------------------|
| `FilterPanel.jsx` (Search) | 7 (Digital Framework, Unidad, Estado, Cluster, Tipo, Etiquetas, Cerrada Econ.) | 1 (Etiquetas) |
| `FilterBar.jsx` (Dashboard) | 4 (Framework, Unidad, Cluster, Estado) | 3 (Unidad, Cluster, Estado) |
| `ReportFilterPanel.jsx` (Reports) | Dynamic (all multiselect filterDefs) | 0 |

### Changes

1. **`FilterPanel.jsx`** — Add `searchable` prop to the 6 instances that lack it (lines ~178, ~189, ~200, ~211, ~222, ~245).
2. **`FilterBar.jsx`** — Add `searchable` to the 1 missing instance (Framework, line ~58).
3. **`ReportFilterPanel.jsx`** — Add `searchable` to the `<MultiSelect>` rendered in the `def.type === 'multiselect'` branch (line ~135). This makes all report multiselects searchable.

No changes to `multi-select.jsx` itself.

---

## R2: Persist FilterPanel `isOpen` state

### Current State

`FilterPanel.jsx` uses `useState(true)` for `isOpen`. Resets on every page load.

### Design

- Use the existing `createStorage('portfolio-search')` storage from `searchStorage.js` (already used by the Search page for filter values and column config).
- Add a new key `filterPanelOpen` (boolean).
- Initialize `isOpen` from `storage.loadJSON('filterPanelOpen', true)`.
- On `setIsOpen`, also call `storage.saveJSON('filterPanelOpen', value)`.

Implementation: wrap in a small effect or replace `useState(true)` with a lazy initializer + `useEffect`.

### Files Changed

- `frontend/src/features/search/components/FilterPanel.jsx` — persist `isOpen`
- `frontend/src/features/search/utils/searchStorage.js` — import in FilterPanel (already exported)

---

## R3: Detail Page — Collapse/Expand All + Empty Section Consolidation

This is the most complex requirement. Two sub-features:

### R3a: Collapse All / Expand All Buttons

**Current architecture problem:** Each `SectionAccordion` wraps its own `<Accordion type="single" collapsible>` with internal state via `defaultValue`. There is no parent-level control.

**Solution — Controlled Accordion mode:**

1. **Enhance `accordion.jsx`**: Add support for controlled mode via optional `value` and `onValueChange` props. When `value` is provided, the component ignores internal state and calls `onValueChange` on user clicks. When absent, behavior is unchanged (uncontrolled mode with `defaultValue`).

2. **Enhance `SectionAccordion`**: Accept optional `isOpen` (boolean) and `onToggle(sectionId)` props. When present, pass `value` prop to the underlying `Accordion` instead of `defaultValue`.

3. **Lift state in `DetailPage`**: Maintain a `Set<string>` of open section IDs in state. Initialize from the same default-open logic currently used (data-based). Pass `isOpen` and `onToggle` to each `SectionAccordion`.

4. **Add buttons in `DetailHeader`** (or a new bar below it): "Expandir Todo" and "Contraer Todo" buttons. "Expandir Todo" opens all sections that have data. "Contraer Todo" closes everything.

### R3b: Empty Section Consolidation

**Current behavior:** Empty sections still render as accordion items with "Sin datos disponibles" or "vacío" badges. They clutter the page for initiatives with sparse data.

**New behavior:**

1. **Classify sections** into "with data" and "without data" based on the API response.
2. **Only render `SectionAccordion` for sections that have data.**
3. **At the bottom of the page**, render a "Secciones sin datos" summary panel listing all empty sections by name.
4. For empty sections that support CRUD (have a create action), show an "Añadir" button next to the section name in the summary. Clicking it opens the corresponding create modal.
5. Read-only empty sections (Importes, Beneficios, Facturación, Datos Ejecución, Documentos, Transacciones, Transacciones JSON) are listed without an action button.

**Sidebar nav update:** `DetailNav` should only show sections that have data. This means `DetailPage` computes the "has data" flag per section and passes it to `DetailNav`, which filters accordingly.

### Section Data Classification

| Section | Data key | Has data check | CRUD support |
|---------|----------|---------------|-------------|
| Datos Descriptivos | `datos_descriptivos` | `!!getFirstOrSelf(data.datos_descriptivos)` | Edit/Create |
| Hechos | `hechos` | `getArrayLength(data.hechos) > 0` | Create |
| Info. Económica | `informacion_economica` | `!!getFirstOrSelf(data.informacion_economica)` | Edit/Create |
| Importes | `datos_relevantes` | `!!getFirstOrSelf(data.datos_relevantes)` | Read-only |
| Etiquetas | `etiquetas` | `getArrayLength(data.etiquetas) > 0` | Create |
| Acciones | `acciones` | `getArrayLength(data.acciones) > 0` | Create |
| Notas | `notas` | `getArrayLength(data.notas) > 0` | Create |
| Justificaciones | `justificaciones` | `getArrayLength(data.justificaciones) > 0` | Create |
| Descripciones | `descripciones` | `getArrayLength(data.descripciones) > 0` | Create |
| Beneficios | `beneficios` | `getArrayLength(data.beneficios) > 0` | Read-only |
| LTP | `ltp` | `getArrayLength(data.ltp) > 0` | Create |
| Facturación | `facturacion` | `getArrayLength(data.facturacion) > 0` | Read-only |
| Datos Ejecución | `datos_ejecucion` | `getArrayLength(data.datos_ejecucion) > 0` | Read-only |
| Grupos Iniciativas | `grupos_iniciativas` | sum of `as_grupo` + `as_componente` > 0 | Create |
| Estado Especial | `estado_especial` | `!!getFirstOrSelf(data.estado_especial)` | Edit/Create |
| Impacto AATT | `impacto_aatt` | `!!getFirstOrSelf(data.impacto_aatt)` | Edit/Create |
| WBEs | `wbes` | `getArrayLength(data.wbes) > 0` | Create |
| Dependencias | `dependencias` | `getArrayLength(data.dependencias) > 0` | Create |
| Documentos | `documentos` | `getArrayLength(data.documentos) > 0` | Read-only |
| Transacciones | `transacciones` | `getArrayLength(data.transacciones) > 0` | Read-only |
| Trans. JSON | `transacciones_json` | `transaccionesJson?.length > 0` | Read-only |

### Files Changed

- `frontend/src/components/ui/accordion.jsx` — Add controlled mode (`value` + `onValueChange`)
- `frontend/src/features/detail/components/SectionAccordion.jsx` — Accept `isOpen` + `onToggle` props
- `frontend/src/features/detail/DetailPage.jsx` — Lift accordion state, add section classification, render empty sections summary panel, add Expand/Collapse buttons
- `frontend/src/features/detail/components/DetailNav.jsx` — Filter out empty sections
- `frontend/src/features/detail/components/EmptySectionsPanel.jsx` — New component for the summary at the bottom

---

## R4: CTA Button on Landing Page Hero

### Current State

`HeroSection.jsx` has no buttons — just badge, headline, subtext, stats.

### Design

Add a CTA button between the subtext paragraph and the stats grid:

- **Authenticated users** (Clerk `SignedIn`): "Ir al Dashboard" → links to `/dashboard`
- **Unauthenticated users** (Clerk `SignedOut`): "Iniciar Sesión" → links to `/sign-in`

Use Clerk's `<SignedIn>` and `<SignedOut>` wrapper components (already used in `Navbar.jsx`).

Button styling: `Button` component with primary variant, large size, centered.

### Files Changed

- `frontend/src/features/landing/components/HeroSection.jsx` — Add CTA button with auth-conditional rendering

---

## Summary of All Files Changed

| File | Requirements |
|------|-------------|
| `frontend/src/features/search/components/FilterPanel.jsx` | R1, R2 |
| `frontend/src/features/dashboard/components/FilterBar.jsx` | R1 |
| `frontend/src/features/reports/components/ReportFilterPanel.jsx` | R1 |
| `frontend/src/components/ui/accordion.jsx` | R3 |
| `frontend/src/features/detail/components/SectionAccordion.jsx` | R3 |
| `frontend/src/features/detail/DetailPage.jsx` | R3 |
| `frontend/src/features/detail/components/DetailNav.jsx` | R3 |
| `frontend/src/features/detail/components/EmptySectionsPanel.jsx` | R3 (new) |
| `frontend/src/features/landing/components/HeroSection.jsx` | R4 |
| `frontend/src/lib/version.js` | Post-feature checklist |
| `frontend/src/lib/changelog.js` | Post-feature checklist |
