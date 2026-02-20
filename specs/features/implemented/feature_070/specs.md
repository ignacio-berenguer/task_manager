# Specs for feature_070 — UI Improvements & Chat Agent System Prompt Enhancements

## Overview

Five targeted improvements spanning the Detail page layout, Dashboard chart readability, chatbot agent intelligence, and global search UX.

---

## Requirement 1: Detail Page — Sticky Header Overlapping Fixes

### Current State

The Detail page has three stacked sticky elements:

| Element                        | CSS                  | Offset       |
| ------------------------------ | -------------------- | ------------ |
| Main Navbar                    | `sticky top-0 z-50`  | 0px          |
| DetailHeader                   | `sticky top-16 z-10` | 64px (4rem)  |
| SidebarNav                     | `sticky top-36`      | 144px (9rem) |
| SectionAccordion scroll-margin | `scroll-mt-36`       | 144px (9rem) |

**Problem**: The DetailHeader has grown taller due to status badges (EstadoTag, SM100, SM200, Aprobada) and highlighted etiquetas. The original `top-36` offset (144px) assumed a shorter header. With the taller header:

1. **SidebarNav search is hidden**: The sidebar is positioned at `top-36` (144px), but the DetailHeader extends below that point when it has multiple badge rows, causing the search input to be hidden behind the header.
2. **Section headers scroll behind sticky header**: `scroll-mt-36` (144px) is insufficient. When navigating via sidebar links, sections scroll to a position that puts the section heading behind the sticky header.

### Technical Design

**Files to modify:**

- `frontend/src/components/shared/SidebarNav.jsx` — Increase `top-` offset
- `frontend/src/features/detail/components/SectionAccordion.jsx` — Increase `scroll-mt-` offset
- `frontend/src/features/detail/components/MobileDetailNav.jsx` — Ensure consistency
- `frontend/src/components/shared/SidebarNav.jsx` — Increase IntersectionObserver `rootMargin` top

**Approach**: Increase the sticky offset and scroll margin to account for the taller DetailHeader. The DetailHeader with badges takes approximately 130-140px (navbar 64px + header content ~70-76px). Adding safe margin:

- SidebarNav: Change `sticky top-36` → `sticky top-44` (176px = 11rem)
- SectionAccordion: Change `scroll-mt-36` → `scroll-mt-44` (176px = 11rem)
- IntersectionObserver rootMargin: Change `-80px` → `-140px` to match new offset

This provides ~32px of breathing room below the header.

---

## Requirement 2: Dashboard — Horizontal Bar Chart Axis Labels

### Current State

**File:** `frontend/src/features/dashboard/components/BarChartCard.jsx`

The horizontal bar charts use `layout="vertical"` with a `CustomYAxisTick` component:

- Default `yAxisWidth` = 100px → `maxLen` = 16 characters
- Only 2 of 10 charts override to `yAxisWidth={160}` (Priorizacion charts)
- Left margin = 20px
- Category labels like "Digital Governance", "Technology & Infrastructure" are truncated or hidden

**Problem**: Most labels exceed 16 characters and get truncated. The 100px default + 20px left margin is insufficient for readable labels.

### Technical Design

**Files to modify:**

- `frontend/src/features/dashboard/components/BarChartCard.jsx` — Increase default `yAxisWidth`, adjust margins, improve tick rendering
- `frontend/src/features/dashboard/DashboardPage.jsx` — Remove explicit `yAxisWidth` overrides (no longer needed with better default)

**Approach**:

1. Increase default `yAxisWidth` from 100 to 160 in `BarChartCard.jsx`
2. Increase left margin from 20 to 10 (less needed when YAxis width is wider)
3. Remove the `yAxisWidth={160}` overrides from the 2 Priorizacion charts in DashboardPage (now the default)
4. Keep `CustomYAxisTick` truncation logic as a safety net, but with `maxLen = Math.floor(160/6) = 26` characters, most labels will display fully

---

## Requirement 3: Chatbot Agent — Default to Importe_YYYY Fields

### Current State

**File:** `backend/app/agent/system_prompt.py` (lines 48-54)

The system prompt currently says: "Cuando el usuario pregunte por importes, presupuesto, facturación o cualquier dato económico sin especificar un año concreto, utiliza SIEMPRE los campos del año en curso" — then lists ALL five importe types equally (budget, sm200, aprobado, facturacion, importe).

**Problem**: The user wants `importe_YYYY` to be the **default** field for financial queries. The other fields (budget, sm200, aprobado, facturacion) should only be used when the user explicitly asks for them.

### Technical Design

**File to modify:** `backend/app/agent/system_prompt.py`

**Approach**: Add a new rule immediately after the existing importe rule clarifying:

> REGLA DE CAMPO DE IMPORTE POR DEFECTO: Cuando el usuario pregunte por "importe", "coste", "inversión", "cuánto cuesta" o cualquier referencia genérica a dinero, utiliza SIEMPRE el campo `importe_YYYY` (importe total del año). Los campos budget_YYYY, importe_sm200_YYYY, importe_aprobado_YYYY e importe_facturacion_YYYY solo deben utilizarse cuando el usuario los solicite explícitamente (ej: "presupuesto", "SM200", "aprobado", "facturación").

This keeps the existing year-default rule intact and adds a field-type hierarchy.

---

## Requirement 4: Chatbot Agent — "Fuera de Budget" Query Handling

### Current State

**File:** `backend/app/agent/system_prompt.py`

The `datos_relevantes` table has a `cluster` field (looked up from `datos_descriptivos.cluster` via calculated fields). This is the current cluster value and may contain values like "extrabudget" or "fuera de budget" for off-budget initiatives.

**Deprecated field:** `cluster_2025_antes_de_19062025` exists in `datos_descriptivos` (schema, model, migration only). It is **never used** in any calculation, frontend display, MCP tool, or chatbot logic. It is a historical field to be deprecated and must NOT be referenced by the chatbot agent.

**Problem**: When users ask about "iniciativas fuera de budget", the chatbot doesn't know how to find them.

### Technical Design

**File to modify:** `backend/app/agent/system_prompt.py`

**Approach**: Add a new section to the system prompt (similar to the Canceladas rule) instructing the agent how to handle "fuera de budget" queries using the `cluster` field from `datos_relevantes`:

> REGLA DE CONSULTA "FUERA DE BUDGET": Cuando el usuario pregunte por "iniciativas fuera de budget", "extrabudget" o "fuera de presupuesto", debes filtrar por el campo `cluster` de la tabla `datos_relevantes` usando el operador `ilike` con los patrones `%extrabudget%` o `%fuera de budget%`. Usa la herramienta `buscar_iniciativas` con filtro sobre el campo `cluster`. NUNCA uses el campo `cluster_2025_antes_de_19062025` de datos_descriptivos — es un campo histórico deprecado.

---

## Requirement 5: QuickSearch — Partial Portfolio ID Search

### Current State

**File:** `frontend/src/components/layout/GlobalSearch.jsx`

The GlobalSearch already performs two parallel searches:

1. `portfolio_id` with `ilike` and `%query%` pattern (partial match)
2. `nombre` with `ilike` and `%query%` pattern (partial match)

Results are merged with portfolio_id matches first, deduplicated, capped at 15.

**Analysis**: The backend already supports partial portfolio_id matching via `ilike` with wildcard. However, the portfolio_id display column in results is only `w-20` (80px), which may truncate IDs and make it hard to see matches. The result display could also highlight which field matched.

### Technical Design

**File to modify:** `frontend/src/components/layout/GlobalSearch.jsx`

**Approach**: The search logic already works for partial portfolio_id. Improvements:

1. Widen the portfolio_id display from `w-20` to `w-28` for better readability
2. Add visual distinction for results that matched by portfolio_id vs nombre (e.g., highlight the matching text or show a small "ID" badge)
3. Update placeholder text to explicitly mention partial ID search: "Buscar por Portfolio ID (parcial) o Nombre..."

---

## Files Summary

| File                                                           | Requirements |
| -------------------------------------------------------------- | ------------ |
| `frontend/src/components/shared/SidebarNav.jsx`                | R1           |
| `frontend/src/features/detail/components/SectionAccordion.jsx` | R1           |
| `frontend/src/features/detail/components/MobileDetailNav.jsx`  | R1           |
| `frontend/src/features/dashboard/components/BarChartCard.jsx`  | R2           |
| `frontend/src/features/dashboard/DashboardPage.jsx`            | R2           |
| `backend/app/agent/system_prompt.py`                           | R3, R4       |
| `frontend/src/components/layout/GlobalSearch.jsx`              | R5           |
