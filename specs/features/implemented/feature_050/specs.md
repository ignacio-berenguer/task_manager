# Specs — feature_050: UI Improvements (Themes, Collapsed Sections, Spanish i18n)

## 1. Overview

Three UI improvements to the Portfolio Digital frontend:

1. **Color Theme Selector** — Multiple color themes (including high-contrast options) selectable from the navbar
2. **Default Collapsed Sections** — Five Detail page accordion sections collapsed by default
3. **Spanish Language Review** — Fix all remaining English text and missing accents in Spanish words

## 2. Requirement 1: Color Theme Selector

### 2.1 Current State

- Dark/light mode uses `next-themes` library with `class` attribute on `<html>`
- CSS custom properties defined in `frontend/src/index.css` via Tailwind CSS v4 `@theme` directive (light) and `.dark` selector (dark)
- `ModeToggle` component in `frontend/src/components/theme/ModeToggle.jsx` toggles between light/dark
- Located in Navbar between GlobalSearch and UserButton
- Theme persisted in localStorage key `portfolio-theme`

### 2.2 Design: Theme Architecture

The color theme system will be **orthogonal** to the light/dark mode system:

- **Light/Dark mode** (existing): Controls whether the base palette is light or dark. Stays as-is with `next-themes`.
- **Color theme** (new): Controls the accent/primary colors, button styles, and overall color personality. Each theme defines colors for **both** light and dark modes.

This means: a user can pick "Ocean" theme in dark mode, or "Ocean" theme in light mode — they combine.

### 2.3 Theme Definitions

**6 themes** (2 standard + 4 high-contrast):

| Theme ID | Name | Description | Primary (Light) | Primary (Dark) |
|----------|------|-------------|-----------------|----------------|
| `default` | Clasico | Current blue theme (preserved exactly) | `hsl(220 80% 50%)` | `hsl(210 100% 56%)` |
| `slate` | Pizarra | Neutral gray-blue, professional | `hsl(215 20% 40%)` | `hsl(215 25% 60%)` |
| `emerald` | Esmeralda (Alto Contraste) | Vivid green accents | `hsl(160 84% 36%)` | `hsl(160 84% 45%)` |
| `amber` | Ambar (Alto Contraste) | Vivid amber/orange accents | `hsl(38 92% 45%)` | `hsl(38 92% 55%)` |
| `rose` | Rosa (Alto Contraste) | Vivid pink/rose accents | `hsl(350 85% 50%)` | `hsl(350 89% 60%)` |
| `violet` | Violeta (Alto Contraste) | Vivid purple accents | `hsl(270 70% 50%)` | `hsl(270 76% 60%)` |

Each theme overrides these CSS variables:
- `--color-primary` / `--color-primary-foreground`
- `--color-ring`
- `--color-chart-0` (primary chart color aligned with theme)

High-contrast themes additionally override:
- `--color-accent` / `--color-accent-foreground` (vivid tint instead of gray)
- `--color-secondary` / `--color-secondary-foreground` (slightly tinted)
- `--color-muted` / `--color-muted-foreground` (tinted muted)

### 2.4 Implementation Approach

1. **Theme definitions file**: New `frontend/src/lib/themes.js` — exports `THEMES` array with theme metadata and CSS variable overrides for light + dark modes.

2. **Theme application**: New `frontend/src/components/theme/ColorThemeProvider.jsx`:
   - React context providing `{ colorTheme, setColorTheme }`
   - On mount/change: applies a `data-color-theme="<themeId>"` attribute on `<html>` element
   - Persists to localStorage key `portfolio-color-theme`
   - Default: `default` (current look preserved)

3. **CSS in `index.css`**: Add `[data-color-theme="emerald"]` selectors (and same with `.dark` combination) that override the relevant CSS custom properties. This keeps all color definitions in CSS where they belong.

4. **Theme Selector UI**: New `frontend/src/components/theme/ColorThemeSelector.jsx`:
   - Small dropdown/popover positioned next to the ModeToggle in the Navbar
   - Shows theme name + small color swatch preview
   - Click to select → applies immediately
   - Uses `Palette` icon from lucide-react as trigger button (consistent style with ModeToggle)

5. **Navbar integration**: Add `ColorThemeSelector` next to `ModeToggle` in `frontend/src/components/layout/Navbar.jsx`

### 2.5 Storage

- localStorage key: `portfolio-color-theme`
- Values: `default`, `slate`, `emerald`, `amber`, `rose`, `violet`
- Fallback: `default` if missing or invalid

## 3. Requirement 2: Default Collapsed Sections

### 3.1 Current State

In `DetailPage.jsx`, each `SectionAccordion` receives `defaultOpen` as a prop:
- 1:1 sections: `defaultOpen={!!data}` (open if data exists)
- 1:N sections: `defaultOpen={getArrayLength(data) > 0}` (open if non-empty)

### 3.2 Change

Five sections should be **collapsed by default** regardless of whether they have data:

| Section | ID | Current `defaultOpen` | New `defaultOpen` |
|---------|----|--------------------|-----------------|
| Beneficios | `beneficios` | `getArrayLength(beneficios) > 0` | `false` |
| Etiquetas | `etiquetas` | `getArrayLength(etiquetas) > 0` | `false` |
| WBEs | `wbes` | `getArrayLength(wbes) > 0` | `false` |
| Transacciones | `transacciones` | `getArrayLength(transacciones) > 0` | `false` |
| Transacciones JSON | `transacciones-json` | `getArrayLength(transaccionesJson) > 0` | `false` |

All other sections keep their current behavior. Users can still manually expand any section.

### 3.3 Implementation

Direct edit in `DetailPage.jsx` — change the `defaultOpen` prop on these 5 `SectionAccordion` instances from their current expression to `{false}`.

## 4. Requirement 3: Spanish Language Review

### 4.1 English Text to Translate

| File | Current (English) | New (Spanish) |
|------|-------------------|---------------|
| `components/ui/combobox.jsx` | `placeholder = 'Select...'` | `'Seleccionar...'` |
| `components/ui/combobox.jsx` | `searchPlaceholder = 'Search...'` | `'Buscar...'` |
| `components/ui/combobox.jsx` | `No results found.` | `Sin resultados.` |
| `components/ui/dialog.jsx` | `<span className="sr-only">Close</span>` | `<span className="sr-only">Cerrar</span>` |
| `components/ui/sheet.jsx` | `<span className="sr-only">Close</span>` | `<span className="sr-only">Cerrar</span>` |
| `components/theme/ModeToggle.jsx` | `aria-label="Toggle theme"` | `aria-label="Cambiar tema"` |
| `components/theme/ModeToggle.jsx` | `<span className="sr-only">Toggle theme</span>` | `<span className="sr-only">Cambiar tema</span>` |
| `dashboard/components/StatusChart.jsx` | `title = 'Initiatives by Status'` | `title = 'Iniciativas por Estado'` |

### 4.2 Spanish Words Missing Accents (Complete List)

Words requiring accent corrections across the codebase (UI-visible `label` strings, titles, placeholders, and messages only — **not** database column names or variable names):

| Word | Correct | Locations (approximate) |
|------|---------|----------------------|
| Busqueda | Busqueda → no accent needed on 'u'? Actually: **Busqueda → Busqueda** | Wait — "Busqueda" should be "**Búsqueda**" |
| Pagina | **Página** | 2 locations |
| Priorizacion | **Priorización** | 8+ locations |
| Ejecucion | **Ejecución** | 7+ locations |
| numero | **número** | 5+ locations |
| Descripcion | **Descripción** | 18+ locations |
| Accion | **Acción** | 7+ locations |
| Clasificacion | **Clasificación** | 1 location |
| Justificacion | **Justificación** | 1 location |
| Modificacion | **Modificación** | 2 locations |
| Estimacion | **Estimación** | 5+ locations |
| Informacion | **Información** (some already correct) | 2 locations |
| ultimos | **últimos** | 1 location |
| dias | **días** | 1 location |
| metricas | **métricas** | 1 location |
| conexion | **conexión** | 1 location |

**Files affected** (grouped):

1. **DetailPage.jsx** — Field labels: Priorizacion, Clasificacion, Tipo Justificacion, Fecha Modificacion, Tipo Descripcion, Descripcion, Descripcion PyB, Descripcion CAN, Descripcion Dependencia, Siguiente Accion, Calidad Estimacion, Fecha Modificacion, Añadir Descripcion, entityLabel="Descripcion"
2. **Navbar.jsx** — `Busqueda` → `Búsqueda`
3. **SearchPage.jsx** — `usePageTitle('Busqueda')`, heading `Busqueda de Iniciativas`
4. **NotFoundPage.jsx** — `Pagina no encontrada`, `La pagina que busca no existe`
5. **DashboardPage.jsx** — `En Ejecucion`, `Priorizacion (numero)`, `metricas`, `conexion`
6. **RecentChangesCard.jsx** — `ultimos`, `dias`
7. **InitiativeDrawer.jsx** — `Priorizacion`, `Descripcion`
8. **EntityFormModal.jsx** — `Descripcion del cambio`
9. **NotaFormModal.jsx** — `Descripcion del cambio`
10. **Pagination.jsx** — `Pagina X de Y`
11. **Section files**: DescripcionesSection.jsx, WbesSection.jsx, DependenciasSection.jsx, LtpSection.jsx, AccionesSection.jsx, HechosSection.jsx, TransaccionesJsonSection.jsx
12. **Report files**: DescripcionesReportPage.jsx, AccionesReportPage.jsx, LTPsReportPage.jsx, TransaccionesReportPage.jsx, TransaccionesJsonReportPage.jsx, ReportPage.jsx
13. **Parametric pages**: ParametroFormDialog.jsx, EtiquetaDestacadaFormDialog.jsx — `numero`
14. **SectionAccordion.jsx** — `vacio` → `vacío`

### 4.3 Scope Boundaries

- **DO change**: All user-visible UI text (labels, titles, placeholders, tooltips, error messages, button text, aria-labels, sr-only text, badge text)
- **DO NOT change**: Database column names, API field names, variable names, CSS class names, localStorage keys, route paths, component names

## 5. Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/lib/themes.js` | Theme definitions (metadata + CSS variable overrides) |
| `frontend/src/components/theme/ColorThemeProvider.jsx` | React context for color theme |
| `frontend/src/components/theme/ColorThemeSelector.jsx` | Theme selector dropdown UI |

## 6. Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/index.css` | Add `[data-color-theme]` CSS selectors for each theme (light + dark) |
| `frontend/src/providers/Providers.jsx` | Wrap with `ColorThemeProvider` |
| `frontend/src/components/layout/Navbar.jsx` | Add `ColorThemeSelector` next to `ModeToggle`; fix `Busqueda` accent |
| `frontend/src/features/detail/DetailPage.jsx` | Change 5 `defaultOpen` props to `false`; fix accent labels |
| `frontend/src/components/ui/combobox.jsx` | Translate English defaults to Spanish |
| `frontend/src/components/ui/dialog.jsx` | Translate `Close` → `Cerrar` |
| `frontend/src/components/ui/sheet.jsx` | Translate `Close` → `Cerrar` |
| `frontend/src/components/theme/ModeToggle.jsx` | Translate aria-label and sr-only |
| `frontend/src/features/dashboard/components/StatusChart.jsx` | Translate default title |
| `frontend/src/features/search/SearchPage.jsx` | Fix `Busqueda` accents |
| `frontend/src/components/shared/NotFoundPage.jsx` | Fix `Pagina` accents |
| `frontend/src/features/dashboard/DashboardPage.jsx` | Fix multiple accent issues |
| `frontend/src/features/dashboard/components/RecentChangesCard.jsx` | Fix `ultimos`, `dias` |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Fix accent labels |
| `frontend/src/features/detail/components/EntityFormModal.jsx` | Fix placeholder accent |
| `frontend/src/features/detail/components/NotaFormModal.jsx` | Fix placeholder accent |
| `frontend/src/features/search/components/Pagination.jsx` | Fix `Pagina` accent |
| `frontend/src/features/detail/components/SectionAccordion.jsx` | Fix `vacio` → `vacío` |
| `frontend/src/features/detail/components/sections/*.jsx` | Fix labels with missing accents (6 files) |
| `frontend/src/features/reports/*.jsx` | Fix labels with missing accents (6 files) |
| `frontend/src/features/parametricas/*.jsx` | Fix `numero` accent (2 files) |

## 7. Non-Goals

- No backend changes needed
- No database/schema changes
- No new .env variables needed (themes are purely frontend, stored in localStorage)
- No new npm dependencies (using existing Tailwind + lucide-react + next-themes)
