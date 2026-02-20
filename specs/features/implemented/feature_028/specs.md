# Feature 028 — Frontend Design Overhaul: Fintech Aesthetic

## 1. Overview

Transform the Portfolio Digital frontend from its current generic SaaS appearance into a refined, high-end fintech aesthetic inspired by Bloomberg Terminal meets modern SaaS. The redesign targets typography, color system, micro-interactions, component polish, and data visualization hierarchy — while preserving the existing Tailwind CSS + Shadcn/ui architecture and all current functionality.

**Design Philosophy:** Every pixel should communicate competence and precision. The interface should feel like a tool built for professionals who manage millions in digital initiatives — not a template demo.

---

## 2. Typography System

### 2.1 Font Selection

Replace the current system font stack with distinctive, professional typefaces:

| Role | Font | Weight Range | Source |
|------|------|-------------|--------|
| **Headings** | Space Grotesk | 500–700 | Google Fonts |
| **Body / UI** | Plus Jakarta Sans | 400–600 | Google Fonts |
| **Data / Numbers** | JetBrains Mono | 400–500 | Google Fonts |

**Rationale:**
- **Space Grotesk**: Geometric sans-serif with a technical, authoritative feel. Its sharp letterforms evoke precision — ideal for page titles, card headers, and navigation.
- **Plus Jakarta Sans**: A warm geometric sans-serif that's highly readable at small sizes. More distinctive than Inter/Roboto while remaining neutral enough for long-form UI text.
- **JetBrains Mono**: A monospace font designed for code but equally powerful for financial data. Its clear digit differentiation (distinct 0/O, 1/l) makes it ideal for KPIs, amounts, and table values.

### 2.2 Type Scale

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Page title (h1) | Space Grotesk | `text-3xl` (1.875rem) | 700 | `-0.02em` |
| Section title (h2) | Space Grotesk | `text-xl` (1.25rem) | 600 | `-0.01em` |
| Card title | Space Grotesk | `text-base` (1rem) | 600 | `normal` |
| Body text | Plus Jakarta Sans | `text-sm` (0.875rem) | 400 | `normal` |
| UI labels | Plus Jakarta Sans | `text-sm` (0.875rem) | 500 | `normal` |
| Data values | JetBrains Mono | `text-2xl` (1.5rem) | 500 | `-0.02em` |
| Table data | JetBrains Mono | `text-xs` (0.75rem) | 400 | `normal` |
| Small / badges | Plus Jakarta Sans | `text-xs` (0.75rem) | 500 | `0.02em` |
| Navbar links | Plus Jakarta Sans | `text-sm` (0.875rem) | 500 | `normal` |

### 2.3 Implementation

- Load fonts via `<link>` tags in `index.html` for optimal performance (preconnect + stylesheet)
- Define CSS custom properties for font families in `index.css`
- Apply via Tailwind `@theme` font family extensions: `--font-heading`, `--font-body`, `--font-data`
- Use Tailwind classes: `font-heading`, `font-body`, `font-data`

---

## 3. Color System

### 3.1 Design Tokens

The color system uses HSL values through CSS custom properties, maintaining the existing Shadcn/ui convention.

#### Dark Mode (Primary Experience)

The dark mode is the "hero" experience — optimized for the Bloomberg Terminal aesthetic.

| Token | HSL Value | Description |
|-------|-----------|-------------|
| `--color-background` | `hsl(225 20% 7%)` | Deep midnight navy, near-black with blue tint |
| `--color-foreground` | `hsl(210 20% 93%)` | Crisp off-white |
| `--color-card` | `hsl(224 18% 10%)` | Elevated surface, slightly lighter |
| `--color-card-foreground` | `hsl(210 20% 93%)` | Same as foreground |
| `--color-popover` | `hsl(224 18% 12%)` | Dropdown / popover surface |
| `--color-popover-foreground` | `hsl(210 20% 93%)` | Same as foreground |
| `--color-primary` | `hsl(210 100% 56%)` | Electric blue — the signature accent |
| `--color-primary-foreground` | `hsl(225 20% 7%)` | Dark text on primary |
| `--color-secondary` | `hsl(220 15% 16%)` | Muted surface for secondary actions |
| `--color-secondary-foreground` | `hsl(210 20% 90%)` | Light text |
| `--color-muted` | `hsl(220 15% 20%)` | Structural backgrounds, dividers |
| `--color-muted-foreground` | `hsl(215 15% 55%)` | Subdued text |
| `--color-accent` | `hsl(220 15% 16%)` | Hover backgrounds |
| `--color-accent-foreground` | `hsl(210 20% 93%)` | Accent text |
| `--color-destructive` | `hsl(350 89% 60%)` | Vivid rose-red |
| `--color-destructive-foreground` | `hsl(210 20% 98%)` | White on destructive |
| `--color-border` | `hsl(220 15% 18%)` | Subtle border |
| `--color-input` | `hsl(220 15% 18%)` | Input border |
| `--color-ring` | `hsl(210 100% 56%)` | Focus ring (matches primary) |

#### Light Mode

Clean and bright with blue-tinted neutrals for a professional, modern feel.

| Token | HSL Value | Description |
|-------|-----------|-------------|
| `--color-background` | `hsl(220 20% 98%)` | Very subtle blue-white |
| `--color-foreground` | `hsl(224 25% 10%)` | Near-black with blue tint |
| `--color-card` | `hsl(0 0% 100%)` | Pure white cards |
| `--color-card-foreground` | `hsl(224 25% 10%)` | Dark text |
| `--color-popover` | `hsl(0 0% 100%)` | White popovers |
| `--color-popover-foreground` | `hsl(224 25% 10%)` | Dark text |
| `--color-primary` | `hsl(220 80% 50%)` | Deep vibrant blue |
| `--color-primary-foreground` | `hsl(0 0% 100%)` | White on primary |
| `--color-secondary` | `hsl(220 20% 95%)` | Light blue-gray |
| `--color-secondary-foreground` | `hsl(224 25% 15%)` | Dark text |
| `--color-muted` | `hsl(220 15% 91%)` | Structural gray |
| `--color-muted-foreground` | `hsl(220 10% 45%)` | Medium gray text |
| `--color-accent` | `hsl(220 20% 95%)` | Hover backgrounds |
| `--color-accent-foreground` | `hsl(224 25% 15%)` | Accent text |
| `--color-destructive` | `hsl(0 84% 60%)` | Bright red |
| `--color-destructive-foreground` | `hsl(0 0% 100%)` | White on destructive |
| `--color-border` | `hsl(220 15% 90%)` | Subtle border |
| `--color-input` | `hsl(220 15% 90%)` | Input border |
| `--color-ring` | `hsl(220 80% 50%)` | Focus ring |

### 3.2 Semantic Status Colors

Add dedicated CSS custom properties for status indicators used across charts and badges:

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `--color-success` | `hsl(160 84% 39%)` | `hsl(160 84% 36%)` | Approved, completed |
| `--color-warning` | `hsl(38 92% 50%)` | `hsl(38 92% 45%)` | Pending, attention |
| `--color-info` | `hsl(200 98% 48%)` | `hsl(200 98% 42%)` | Informational |

### 3.3 Chart Color Palette

A curated 8-color palette for data visualization, designed for maximum distinction in both modes:

| Index | Name | Dark HSL | Light HSL |
|-------|------|----------|-----------|
| 0 | Electric Blue | `hsl(210 100% 56%)` | `hsl(220 80% 50%)` |
| 1 | Emerald | `hsl(160 84% 39%)` | `hsl(160 84% 36%)` |
| 2 | Amber | `hsl(38 92% 50%)` | `hsl(38 92% 45%)` |
| 3 | Rose | `hsl(350 89% 60%)` | `hsl(350 85% 55%)` |
| 4 | Violet | `hsl(270 76% 60%)` | `hsl(270 70% 55%)` |
| 5 | Cyan | `hsl(185 96% 45%)` | `hsl(185 90% 38%)` |
| 6 | Orange | `hsl(24 95% 53%)` | `hsl(24 90% 48%)` |
| 7 | Pink | `hsl(330 80% 60%)` | `hsl(330 75% 52%)` |

These will be defined as CSS custom properties (`--chart-0` through `--chart-7`) and referenced by Recharts components.

---

## 4. Component Refinements

### 4.1 Cards

**Current:** `rounded-lg border bg-card shadow-sm`

**New:**
- Add subtle border gradient effect: `border-border/50` with `hover:border-border` transition
- Slightly stronger shadow in light mode: `shadow-sm` → `shadow-[0_1px_3px_0_rgb(0,0,0,0.08)]`
- Dark mode: faint inset highlight on top edge to suggest depth (1px `border-t border-t-white/[0.04]`)
- Hover state: subtle elevation increase via `hover:shadow-md` + `transition-shadow duration-200`

### 4.2 KPI Cards

**Current:** Icon in `bg-primary/10` circle, simple layout.

**New:**
- Add a left-side accent bar: `border-l-2 border-l-primary`
- Display values using `font-data` (JetBrains Mono) for financial precision
- Add a subtle gradient shimmer on the icon background: `bg-gradient-to-br from-primary/15 to-primary/5`
- Animate value changes with a brief number pulse (CSS scale 1 → 1.02 → 1 over 150ms on data change)

### 4.3 Buttons

**Keep** all existing variants. **Add:**
- Subtle active state: `active:scale-[0.98]` for tactile feedback
- Primary buttons: add a faint glow on hover: `hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]`
- Outline buttons: brighter border on hover (`hover:border-primary/60`)
- All buttons: `transition-all duration-150` (already has `transition-colors`, expand to `transition-all`)

### 4.4 Tables (DataGrid, Report tables, Detail tables)

- **Header row**: Use `bg-muted/60` with `font-heading text-xs font-semibold uppercase tracking-wider` for a more authoritative look
- **Data cells**: Use `font-data text-xs` for numeric columns; `font-body text-sm` for text columns
- **Row hover**: `hover:bg-accent/50` with smooth transition
- **Alternating rows**: Remove if present; instead use consistent `border-b border-border/50` for clean horizontal lines
- **Sort indicators**: Slightly larger, use primary color when active

### 4.5 Navbar

**Current:** `bg-muted/80 backdrop-blur`

**New:**
- Dark mode: `bg-background/80 backdrop-blur-xl border-b border-border/50` — near-transparent with strong blur
- Light mode: `bg-white/80 backdrop-blur-xl border-b border-border/50`
- Logo: Replace the rounded-lg box with a more refined treatment — subtle gradient on the "P" mark
- Active link indicator: Replace `bg-primary/15` background with a bottom border accent: `border-b-2 border-b-primary` below the active item (more fintech-like)

### 4.6 Accordion (Detail Page)

- **Trigger**: `font-heading text-base font-semibold` with `hover:bg-muted/40` transition
- **Left border accent**: Keep `border-l-4 border-l-primary/50`, change to `border-l-primary/40` in dark mode
- **Chevron**: Rotate animation stays; add `text-muted-foreground` color and `hover:text-foreground` transition

### 4.7 Badges

- Add `backdrop-blur-sm` for semi-transparent variants
- Font: `font-body text-xs font-medium tracking-wide`
- Success/Warning variants: use the new semantic status colors

### 4.8 Inputs & Selects

- Border: `border-border/60` default → `border-primary/50` on focus (more visible focus transition)
- Add subtle `bg-muted/20` background in dark mode for inputs (to differentiate from card surface)
- Focus ring: `ring-primary/30` instead of full `ring-ring`

### 4.9 Dialogs/Modals

- Add `backdrop-blur-sm` to overlay
- Slight scale-in animation: `animate-in zoom-in-[0.97] fade-in-0`
- Dark mode: dialog surface uses `bg-popover` with `border border-border/50`

---

## 5. Micro-Interactions & Transitions

### 5.1 Global Transitions

Update the global transition rule in `index.css`:

```css
* {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
```

Increase from 0.15s to 0.2s for smoother feel; add `color` and `box-shadow`.

### 5.2 Card Interactions

- **Hover lift**: Cards with interactive content get `hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`
- **KPI cards**: Slight scale on hover: `hover:scale-[1.01]`
- **Chart cards**: Subtle border brightening on hover

### 5.3 Page Load Animations

Add staggered fade-in for main content sections using CSS:

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}
```

Apply to page sections with increasing `animation-delay` (0ms, 50ms, 100ms, etc.) for a staggered reveal effect.

### 5.4 Loading States

- Replace basic `animate-pulse` skeletons with shimmer effect:

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, var(--color-muted) 25%, var(--color-muted-foreground)/10 50%, var(--color-muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 5.5 Navigation Transitions

- Mobile menu: slide-down with fade instead of instant show/hide
- Dropdown menus: `animate-in fade-in-0 slide-in-from-top-1 duration-150`

### 5.6 Chart Interactions

- Bar hover: bars brighten slightly (Recharts `activeBar` prop with lighter fill)
- Tooltip: appears with subtle fade animation (already supported by Recharts)

---

## 6. Data Visualization Hierarchy

### 6.1 KPI Section

- KPI values in `font-data text-3xl font-medium` — large, monospaced, immediately scannable
- KPI labels in `font-body text-xs font-medium uppercase tracking-wider text-muted-foreground`
- Clear visual separation: KPI row gets subtle top/bottom borders or contained in a distinct section

### 6.2 Charts

- Chart titles: `font-heading text-sm font-semibold`
- Axis labels: `font-data text-xs` for numeric values
- Grid lines: very subtle (`opacity: 0.15` in dark mode, `0.2` in light mode)
- Chart colors: Use the curated 8-color palette from Section 3.3 — each chart pair gets a dedicated color
- Tooltip: Refined styling with `font-data` for values, `font-body` for labels

### 6.3 Dashboard Layout

- Clear section hierarchy: KPIs → Charts → Lists
- Section dividers: subtle `border-t border-border/50` between chart pairs
- Section labels in sidebar nav: `font-heading text-xs font-semibold uppercase tracking-wider`

---

## 7. Landing Page Refinements

### 7.1 Hero Section

- Replace generic gradient (`from-primary/5 to-background`) with a more dramatic treatment:
  - Dark mode: Radial gradient from `primary/10` center fading to `background`
  - Light mode: Subtle mesh gradient with `primary/5` and `primary/3`
- Hero headline: `font-heading text-5xl font-bold tracking-tighter`
- Stats row: Use `font-data` for stat values with `text-primary` color
- Background decoration: Refine the blob shape, reduce opacity

### 7.2 Feature Sections

- Use `font-heading` for all section titles
- Icon containers: Gradient backgrounds instead of flat color
- Maintain current section structure but apply new color tokens

---

## 8. Structural Backgrounds

Preserve the graduated opacity pattern for structural elements but use the new color tokens:

| Element | Dark Class | Light Class |
|---------|-----------|-------------|
| Navbar | `bg-background/80 backdrop-blur-xl` | `bg-white/80 backdrop-blur-xl` |
| Page headers | `bg-muted/40` | `bg-muted/30` |
| Filter bar | `bg-muted/40` | `bg-muted/30` |
| Filter panel body | `bg-muted/30` | `bg-muted/20` |
| Sidebar nav | `bg-muted/20` | `bg-muted/15` |
| Detail sticky header | `bg-muted/50 backdrop-blur-sm` | `bg-muted/40 backdrop-blur-sm` |

---

## 9. Responsive Considerations

No changes to breakpoints or responsive layout strategy. The existing responsive patterns (`sm:`, `md:`, `lg:`, `xl:`) remain as-is. The design changes are purely visual (colors, fonts, transitions) and apply uniformly across all breakpoints.

Font sizes may need minor responsive adjustments:
- Hero title: `text-3xl sm:text-4xl lg:text-5xl` (slightly reduced from current `text-4xl sm:text-5xl lg:text-6xl` to fit Space Grotesk's wider glyphs)

---

## 10. Files Affected

### Core Design Files (modify)
- `frontend/index.html` — Add Google Fonts `<link>` tags
- `frontend/src/index.css` — New color tokens, font families, animations, transitions

### UI Components (modify)
- `frontend/src/components/ui/button.jsx` — Active state, glow effects
- `frontend/src/components/ui/card.jsx` — Border, shadow, hover refinements
- `frontend/src/components/ui/badge.jsx` — Font, color updates
- `frontend/src/components/ui/input.jsx` — Focus state improvements
- `frontend/src/components/ui/skeleton.jsx` — Shimmer animation
- `frontend/src/components/ui/dialog.jsx` — Backdrop blur, scale animation
- `frontend/src/components/ui/accordion.jsx` — Font, transition updates
- `frontend/src/components/ui/select.jsx` — Focus improvements
- `frontend/src/components/ui/multi-select.jsx` — Focus improvements
- `frontend/src/components/ui/dropdown-menu.jsx` — Animation, styling

### Layout Components (modify)
- `frontend/src/components/layout/Navbar.jsx` — New styling, active indicator
- `frontend/src/components/layout/Footer.jsx` — Font updates

### Feature Components (modify)
- `frontend/src/features/landing/components/HeroSection.jsx` — Typography, gradient
- `frontend/src/features/landing/components/*.jsx` — Typography updates (all 7 sections)
- `frontend/src/features/dashboard/DashboardPage.jsx` — Typography classes
- `frontend/src/features/dashboard/components/KPICard.jsx` — Accent bar, font-data
- `frontend/src/features/dashboard/components/BarChartCard.jsx` — Chart colors, font
- `frontend/src/features/dashboard/components/FilterBar.jsx` — Background update
- `frontend/src/features/dashboard/components/DashboardNav.jsx` — Font, styling
- `frontend/src/features/dashboard/components/TopValueCard.jsx` — Font-data for values
- `frontend/src/features/dashboard/components/RecentChangesCard.jsx` — Typography
- `frontend/src/features/search/SearchPage.jsx` — Typography classes
- `frontend/src/features/search/components/DataGrid.jsx` — Table styling, fonts
- `frontend/src/features/search/components/FilterPanel.jsx` — Background update
- `frontend/src/features/reports/components/GenericReportPage.jsx` — Typography
- `frontend/src/features/reports/components/ReportFilterPanel.jsx` — Background update
- `frontend/src/features/detail/DetailPage.jsx` — Typography
- `frontend/src/features/detail/components/DetailHeader.jsx` — Typography
- `frontend/src/features/detail/components/SectionAccordion.jsx` — Font updates
- `frontend/src/features/detail/components/SimpleTable.jsx` — Table font styling
- `frontend/src/features/detail/components/KeyValueDisplay.jsx` — Font updates

### Utility Files (modify)
- `frontend/src/lib/utils.js` — Add chart color utility if needed

### No Changes
- All hooks, data fetching, routing, state management, localStorage — untouched
- Backend — no changes
- Management module — no changes

---

## 11. Constraints

- **Zero functional changes**: All existing behavior, data flows, and interactions preserved exactly
- **Same tech stack**: Tailwind CSS 4, Shadcn/ui patterns, React 19, Recharts, next-themes, Lucide icons
- **No new npm dependencies** except potentially a Google Fonts loader (but `<link>` tags in HTML are preferred)
- **Spanish UI text**: All labels remain in Spanish
- **Performance**: Font loading must use `font-display: swap` to avoid layout shift. No heavy animation libraries — CSS only.
- **Accessibility**: Maintain WCAG AA contrast ratios. Focus states remain visible. No motion for users with `prefers-reduced-motion`.
