# Plan — feature_050: UI Improvements (Themes, Collapsed Sections, Spanish i18n)

## Phase 1: Color Theme System

### Step 1.1: Create theme definitions
**File**: `frontend/src/lib/themes.js`
- Export `THEMES` array with 6 theme objects: `{ id, name, description, isHighContrast, colors: { light: {...}, dark: {...} } }`
- Each theme's `colors` object maps CSS variable names to HSL values
- The `default` theme has empty overrides (uses the base CSS)

### Step 1.2: Add theme CSS variables to index.css
**File**: `frontend/src/index.css`
- Add CSS selectors for each theme: `[data-color-theme="emerald"]` and `[data-color-theme="emerald"].dark`
- Each selector overrides `--color-primary`, `--color-primary-foreground`, `--color-ring`, `--color-chart-0`
- High-contrast themes additionally override `--color-accent`, `--color-secondary`, `--color-muted` variants
- The `default` theme needs no CSS rules (it uses the base variables already defined)

### Step 1.3: Create ColorThemeProvider
**File**: `frontend/src/components/theme/ColorThemeProvider.jsx`
- React context: `ColorThemeContext` with `{ colorTheme, setColorTheme }`
- On mount: read `portfolio-color-theme` from localStorage, apply `data-color-theme` attribute to `<html>`
- On change: update localStorage + `<html>` attribute
- Default: `'default'`

### Step 1.4: Create ColorThemeSelector component
**File**: `frontend/src/components/theme/ColorThemeSelector.jsx`
- Trigger: Button with `Palette` icon (lucide-react), same styling as ModeToggle
- Dropdown: Small popover listing all 6 themes with color swatch + name
- High-contrast themes marked with a label/badge
- Selected theme indicated with a checkmark
- Click → calls `setColorTheme(id)` from context

### Step 1.5: Integrate into app
**Files**:
- `frontend/src/providers/Providers.jsx` — Wrap children with `<ColorThemeProvider>`
- `frontend/src/components/layout/Navbar.jsx` — Add `<ColorThemeSelector />` next to `<ModeToggle />`

### Step 1.6: Test
- Verify all 6 themes render correctly in both light and dark modes
- Verify theme persists across page reloads
- Verify the `default` theme looks identical to current production

## Phase 2: Default Collapsed Sections

### Step 2.1: Update DetailPage.jsx
**File**: `frontend/src/features/detail/DetailPage.jsx`

Change `defaultOpen` for these 5 sections:

1. **Etiquetas** (line ~387): `defaultOpen={getArrayLength(etiquetas) > 0}` → `defaultOpen={false}`
2. **Beneficios** (line ~489): `defaultOpen={getArrayLength(beneficios) > 0}` → `defaultOpen={false}`
3. **WBEs** (line ~597): `defaultOpen={getArrayLength(wbes) > 0}` → `defaultOpen={false}`
4. **Transacciones** (line ~649): `defaultOpen={getArrayLength(transacciones) > 0}` → `defaultOpen={false}`
5. **Transacciones JSON** (line ~659): `defaultOpen={getArrayLength(transaccionesJson) > 0}` → `defaultOpen={false}`

## Phase 3: Spanish Language Review

### Step 3.1: Fix English text in UI components
**Files**:
- `components/ui/combobox.jsx` — `Select...` → `Seleccionar...`, `Search...` → `Buscar...`, `No results found.` → `Sin resultados.`
- `components/ui/dialog.jsx` — `Close` → `Cerrar` (sr-only)
- `components/ui/sheet.jsx` — `Close` → `Cerrar` (sr-only)
- `components/theme/ModeToggle.jsx` — `Toggle theme` → `Cambiar tema` (aria-label + sr-only)
- `dashboard/components/StatusChart.jsx` — `Initiatives by Status` → `Iniciativas por Estado`

### Step 3.2: Fix accents in navigation and page titles
**Files**:
- `components/layout/Navbar.jsx` — `Busqueda` → `Búsqueda`
- `features/search/SearchPage.jsx` — `Busqueda` → `Búsqueda` (page title + heading)
- `components/shared/NotFoundPage.jsx` — `Pagina` → `Página`, `pagina` → `página`
- `features/search/components/Pagination.jsx` — `Pagina` → `Página`

### Step 3.3: Fix accents in Dashboard
**Files**:
- `features/dashboard/DashboardPage.jsx` — Fix: `Ejecucion` → `Ejecución`, `Priorizacion` → `Priorización`, `numero` → `número`, `metricas` → `métricas`, `conexion` → `conexión`
- `features/dashboard/components/RecentChangesCard.jsx` — Fix: `ultimos` → `últimos`, `dias` → `días`

### Step 3.4: Fix accents in Detail page field labels
**File**: `features/detail/DetailPage.jsx` — Fix all field label strings:
- `Priorizacion` → `Priorización`
- `Clasificacion` → `Clasificación`
- `Tipo Justificacion` → `Tipo Justificación`
- `Fecha Modificacion` → `Fecha Modificación`
- `Tipo Descripcion` → `Tipo Descripción`
- `Descripcion` → `Descripción`
- `Descripcion PyB` → `Descripción PyB`
- `Descripcion CAN` → `Descripción CAN`
- `Descripcion Dependencia` → `Descripción Dependencia`
- `Siguiente Accion` → `Siguiente Acción`
- `Calidad Estimacion` → `Calidad Estimación`
- `Añadir Descripcion` → `Añadir Descripción`
- `entityLabel="Descripcion"` → `entityLabel="Descripción"`
- `Comentarios Siguiente Accion` → `Comentarios Siguiente Acción`
- `Descripcion del cambio` (EntityFormModal, NotaFormModal) → `Descripción del cambio`

### Step 3.5: Fix accents in Detail section components
**Files**:
- `features/detail/components/sections/DescripcionesSection.jsx` — `Tipo Descripcion`, `Descripcion`, `entityLabel`
- `features/detail/components/sections/WbesSection.jsx` — `Descripcion PyB`, `Descripcion CAN`
- `features/detail/components/sections/DependenciasSection.jsx` — `Descripcion Dependencia`
- `features/detail/components/sections/LtpSection.jsx` — `Siguiente Accion`
- `features/detail/components/sections/AccionesSection.jsx` — `Comentarios Siguiente Accion`, `entityLabel="Accion"`
- `features/detail/components/sections/HechosSection.jsx` — `Calidad Estimacion`
- `features/detail/components/sections/TransaccionesJsonSection.jsx` — `Fecha Ejecucion DB`, `Fecha Ejecucion Excel`
- `features/detail/components/SectionAccordion.jsx` — `vacio` → `vacío`

### Step 3.6: Fix accents in shared components
**Files**:
- `components/shared/InitiativeDrawer.jsx` — `Priorizacion`, `Descripcion`
- `features/detail/components/EntityFormModal.jsx` — `Descripcion del cambio`
- `features/detail/components/NotaFormModal.jsx` — `Descripcion del cambio`

### Step 3.7: Fix accents in Report pages
**Files**:
- `features/reports/DescripcionesReportPage.jsx` — `Descripcion`, `Tipo Descripcion`
- `features/reports/AccionesReportPage.jsx` — `Siguiente Accion`, `Siguiente Accion Comentarios`, `Siguiente Accion (desde)`, `Siguiente Accion (hasta)`
- `features/reports/LTPsReportPage.jsx` — `Siguiente Accion`
- `features/reports/TransaccionesReportPage.jsx` — `Fecha Ejecucion Cambio`, `Fecha Ejecucion (desde)`, `Fecha Ejecucion (hasta)`
- `features/reports/TransaccionesJsonReportPage.jsx` — `Fecha Ejecucion DB`, `Fecha Ejecucion Excel`
- `features/reports/ReportPage.jsx` — `Calidad Estimacion`

### Step 3.8: Fix accents in Parametric pages
**Files**:
- `features/parametricas/ParametroFormDialog.jsx` — `numero` → `número`
- `features/parametricas/EtiquetaDestacadaFormDialog.jsx` — `numero` → `número`

## Phase 4: Post-Implementation

### Step 4.1: Build verification
- Run `npm run build` to verify no compilation errors

### Step 4.2: Version bump and changelog
- Increment `APP_VERSION.minor` in `frontend/src/lib/version.js`
- Add changelog entry in `frontend/src/lib/changelog.js`

### Step 4.3: Update documentation
- Update `README.md` with theme system info
- Update `specs/architecture/architecture_frontend.md` with theme architecture

### Step 4.4: Close feature
- Use `/close_feature feature_050`

## Summary

| Phase | Steps | Files Created | Files Modified |
|-------|-------|---------------|----------------|
| 1. Color Themes | 6 | 3 | 3 |
| 2. Collapsed Sections | 1 | 0 | 1 |
| 3. Spanish Review | 8 | 0 | ~30 |
| 4. Post-Implementation | 4 | 0 | 4 |
| **Total** | **19** | **3** | **~35** |
