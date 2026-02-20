# Feature 031: Search & Detail Page Improvements — Technical Specification

Version: 1.0
Date: February 2026
Status: Planning

## Overview

Four UX improvements to the Search and Detail pages: row selection with checkboxes, bulk copy of portfolio IDs, smart paste normalization for the portfolio ID filter, and a sticky sidebar navigation for the Detail page.

## Requirement 1: Row Selection with Checkboxes

### Behavior
- A checkbox column is prepended to the Search page data grid (before all data columns)
- Header checkbox: toggles select-all for visible rows on the current page. Shows indeterminate state when some (but not all) rows are selected.
- Row checkbox: toggles individual row selection
- Selected rows have a subtle highlight (`bg-primary/5`)
- Selection state is keyed by `portfolio_id` (not array index) via `getRowId`
- Selection clears when: new search is executed, page changes, sort changes, filters change

### Technical Approach
- Use TanStack React Table v8's built-in row selection: `enableRowSelection`, `onRowSelectionChange`, `state: { rowSelection }`
- `getRowId: (row) => row.portfolio_id` ensures selection keys are portfolio_ids
- Plain `<input type="checkbox">` with Tailwind styling (no additional UI library needed)
- Indeterminate state set via ref callback since it's not an HTML attribute

### Files
- `frontend/src/features/search/components/DataGrid.jsx` — add select column, selection props, row highlight
- `frontend/src/features/search/SearchPage.jsx` — manage `rowSelection` state, clear on search/page/sort

## Requirement 2: Copy Selected Portfolio IDs to Clipboard

### Behavior
- A "Copiar N IDs" button appears in the toolbar when at least 1 row is selected
- On click: copies all selected portfolio_ids as comma-separated string (e.g., `PID001, PID002, PID003`)
- Shows success toast via sonner: "N Portfolio ID(s) copiado(s) al portapapeles"
- Button icon swaps from Copy → Check for 2 seconds after successful copy
- Button hidden when no rows are selected

### Technical Approach
- `navigator.clipboard.writeText()` for clipboard access
- `toast.success()` from `sonner` (already configured in Providers.jsx)
- Selected IDs derived from `rowSelection` object keys (already portfolio_ids thanks to `getRowId`)

### Files
- `frontend/src/features/search/components/CopySelectedButton.jsx` — new component
- `frontend/src/features/search/SearchPage.jsx` — integrate button in toolbar

## Requirement 3: Paste Bulk Portfolio IDs in Search Criteria

### Behavior
- The Portfolio ID input field accepts pasted text containing IDs in mixed formats:
  - Comma-separated: `PID001, PID002, PID003`
  - Newline-separated: `PID001\nPID002\nPID003`
  - Space-separated: `PID001 PID002 PID003`
  - Tab-separated: `PID001\tPID002\tPID003`
  - Semicolon-separated: `PID001;PID002;PID003`
  - Mixed: any combination of the above
- On paste, text is auto-normalized to a clean comma-separated list
- Duplicates are removed (preserving order)
- If the field already contains IDs, pasted IDs are merged (deduplicated)
- Existing manual typing behavior is unchanged (only onPaste is intercepted)

### Technical Approach
- `onPaste` handler with `e.preventDefault()` to control inserted text
- Regex replacement: `[\n\r\t;|]+` → `,`
- Split on commas, trim, filter empty, deduplicate with `Set`
- Merge with existing field value

### Files
- `frontend/src/features/search/components/FilterPanel.jsx` — add `onPaste` handler to Portfolio ID Input

## Requirement 4: Detail Page Sticky Sidebar Navigation

### Behavior
- A sticky sidebar navigation menu appears on the left side of the Detail page on xl+ screens (same breakpoint as Dashboard sidebar)
- Lists all 19 accordion sections with short labels
- Clicking a section link smoothly scrolls to that section
- The currently visible section is highlighted with a left border in primary color
- Sidebar style is identical to the Dashboard sidebar (same Tailwind classes)
- Hidden on screens smaller than xl (1280px)
- **Badges** indicate which sections have data:
  - **1:1 sections** (Datos Descriptivos, Info. Economica, Importes, Estado Especial, Impacto AATT): show a small filled dot (primary color) when data exists
  - **1:N sections** (Hechos, Etiquetas, Acciones, Notas, etc.): show a numeric count badge when records exist
  - Sections with no data show no badge

### Technical Approach
- Extract `DashboardNav.jsx` IntersectionObserver logic into a shared `SidebarNav` component
- `SidebarNav` accepts an `items` prop (array of `{label, anchor, badge?}`)
  - `badge: 'exists'` renders a dot indicator (for 1:1 sections with data)
  - `badge: number` renders a count (for 1:N sections with records)
  - `badge: undefined` renders nothing (no data)
- Refactor `DashboardNav` to use `SidebarNav` (preserves existing behavior, no badges)
- Create `DetailNav` component that accepts `data` prop, computes badges per section based on section type (single vs multi), passes items with badges to `SidebarNav`
- Add HTML `id` attribute to `SectionAccordion` wrapper so `document.getElementById()` works
- Add `scroll-mt-20` class to `SectionAccordion` to offset for sticky DetailHeader
- Wrap Detail page content in flex layout: `<div className="flex gap-6"><DetailNav data={data} /><div className="min-w-0 flex-1">...</div></div>`

### Section IDs, Labels, and Types

| Anchor | Sidebar Label | Data Key | Type |
|--------|--------------|----------|------|
| `datos-descriptivos` | Datos Desc. | `datos_descriptivos` | single |
| `hechos` | Hechos | `hechos` | multi |
| `informacion-economica` | Info. Economica | `informacion_economica` | single |
| `importes` | Importes | `datos_relevantes` | single |
| `etiquetas` | Etiquetas | `etiquetas` | multi |
| `acciones` | Acciones | `acciones` | multi |
| `notas` | Notas | `notas` | multi |
| `justificaciones` | Justificaciones | `justificaciones` | multi |
| `descripciones` | Descripciones | `descripciones` | multi |
| `beneficios` | Beneficios | `beneficios` | multi |
| `ltp` | LTP | `ltp` | multi |
| `facturacion` | Facturacion | `facturacion` | multi |
| `datos-ejecucion` | Datos Ejecucion | `datos_ejecucion` | multi |
| `grupos-iniciativas` | Grupos | `grupos_iniciativas` | multi |
| `estado-especial` | Estado Especial | `estado_especial` | single |
| `impacto-aatt` | Impacto AATT | `impacto_aatt` | single |
| `wbes` | WBEs | `wbes` | multi |
| `dependencias` | Dependencias | `dependencias` | multi |
| `transacciones` | Transacciones | `transacciones` | multi |

### Files
- `frontend/src/components/shared/SidebarNav.jsx` — shared component with optional badge support
- `frontend/src/features/dashboard/components/DashboardNav.jsx` — refactor to use SidebarNav
- `frontend/src/features/detail/components/DetailNav.jsx` — computes badges from portfolio data
- `frontend/src/features/detail/components/SectionAccordion.jsx` — add `id` attr + `scroll-mt-20`
- `frontend/src/features/detail/DetailPage.jsx` — wrap in flex layout with sidebar, pass `data` to DetailNav

## No Backend Changes

All four requirements are frontend-only. No API or database changes needed.
