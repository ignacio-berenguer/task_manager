# Technical Specification — feature_025: Darker Backgrounds for Key UI Elements

## 1. Overview

Apply darker backgrounds to structural UI elements (navbar, dashboard sidebar, page headers, filter panels) to improve visual hierarchy and section separation. The implementation required both darkening the base `--color-muted` CSS variable and applying `bg-muted` at graduated opacity levels. Additionally, the navbar active item styling was changed to use a primary-tinted highlight for clear visibility.

**Scope:** Frontend-only feature. No backend changes required.

## 2. CSS Variable Changes

The root cause of insufficient contrast was that `--color-muted` was too close to `--color-background` in both modes. The base color was darkened in `index.css`:

### Light Mode (`@theme`)

| Variable | Before | After |
|----------|--------|-------|
| `--color-muted` | `hsl(210 40% 96.1%)` (96% lightness, nearly white) | `hsl(214 32% 88%)` (88% lightness, visible gray) |

### Dark Mode (`.dark`)

| Variable | Before | After |
|----------|--------|-------|
| `--color-muted` | `hsl(217.2 32.6% 17.5%)` (17.5% lightness) | `hsl(217.2 32.6% 30%)` (30% lightness, more contrast vs 4.9% background) |

Other color variables (`--color-secondary`, `--color-accent`, `--color-border`, etc.) were left unchanged.

## 3. Navbar Active Item Styling

The navbar active item was barely visible because it used `bg-accent` (nearly white in light mode, very dark in dark mode) against the now-darker `bg-muted` navbar. Changed to a primary-tinted highlight:

**Before:** `bg-accent text-accent-foreground`
**After:** `bg-primary/15 text-primary font-semibold`

This applies to:
- Desktop nav links (`navLinkClass`)
- Mobile nav links (`mobileNavLinkClass`)
- Informes dropdown trigger (`isInformesActive`)

## 4. Element Background Changes

### Visual Hierarchy (opacity scale)

| Element | Class | Rationale |
|---------|-------|-----------|
| Navbar | `bg-muted/80` / `bg-muted/60` (blur) | Most prominent, always visible |
| DetailHeader | `bg-muted/60` | Sticky, overlaps content on scroll |
| Page headers (4 pages) | `bg-muted/50` | Visible band for title area |
| Dashboard FilterBar | `bg-muted/50` | Single container |
| Filter panel headers | `bg-muted/50` | Already styled (unchanged) |
| Filter panel bodies | `bg-muted/40` | Darker than page, lighter than header |
| DashboardNav sidebar | `bg-muted/30` | Gentle, doesn't compete with content |

### Detailed Changes

| File | Element | Before | After |
|------|---------|--------|-------|
| `Navbar.jsx` | `<nav>` | `bg-background/95 ... bg-background/60` | `bg-muted/80 ... bg-muted/60` |
| `DashboardNav.jsx` | `<ul>` | `space-y-1 border-l border-border` | + `bg-muted/30 rounded-lg py-2` |
| `DashboardPage.jsx` | Header div | `mb-8` | + `bg-muted/50 rounded-lg px-4 py-4` |
| `SearchPage.jsx` | Header div | `mb-6` | + `bg-muted/50 rounded-lg px-4 py-4` |
| `ReportPage.jsx` | Header div | `mb-6` | + `bg-muted/50 rounded-lg px-4 py-4` |
| `GenericReportPage.jsx` | Header div | `mb-6` | + `bg-muted/50 rounded-lg px-4 py-4` |
| `DetailHeader.jsx` | Container | `bg-background border-b` | `bg-muted/60 border-b` |
| `FilterBar.jsx` | Container | `bg-card` | `bg-muted/50` |
| `FilterPanel.jsx` | Body | `bg-background` | `bg-muted/40` |
| `ReportFilterPanel.jsx` | Body | `bg-background` | `bg-muted/40` |

## 5. Files Modified

| File | Change |
|------|--------|
| `frontend/src/index.css` | Darkened `--color-muted` in both light and dark modes |
| `frontend/src/components/layout/Navbar.jsx` | `bg-muted` navbar + `bg-primary/15` active state |
| `frontend/src/features/dashboard/components/DashboardNav.jsx` | `bg-muted/30` sidebar |
| `frontend/src/features/dashboard/DashboardPage.jsx` | `bg-muted/50` page header |
| `frontend/src/features/search/SearchPage.jsx` | `bg-muted/50` page header |
| `frontend/src/features/reports/ReportPage.jsx` | `bg-muted/50` page header |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | `bg-muted/50` page header |
| `frontend/src/features/detail/components/DetailHeader.jsx` | `bg-muted/60` sticky header |
| `frontend/src/features/dashboard/components/FilterBar.jsx` | `bg-muted/50` filter bar |
| `frontend/src/features/search/components/FilterPanel.jsx` | `bg-muted/40` filter body |
| `frontend/src/features/reports/components/ReportFilterPanel.jsx` | `bg-muted/40` filter body |

## 6. Constraints

- Uses existing Tailwind CSS `bg-muted` at various opacities — no new CSS classes
- Only `--color-muted` CSS variable modified; all other theme variables unchanged
- Both light and dark modes tested and visually validated
- All existing functionality unchanged
