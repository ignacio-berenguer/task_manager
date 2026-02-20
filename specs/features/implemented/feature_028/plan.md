# Implementation Plan — Feature 028: Frontend Design Overhaul

## Phase Overview

| Phase | Description | Files | Risk |
|-------|-------------|-------|------|
| 1 | Foundation — fonts, colors, CSS tokens, animations | 2 files | Low |
| 2 | Core UI components — button, card, badge, input, etc. | ~12 files | Low |
| 3 | Layout — Navbar, Footer | 2 files | Low |
| 4 | Dashboard — KPIs, charts, filters, nav | ~8 files | Medium |
| 5 | Search — grid, filters, pagination | ~4 files | Low |
| 6 | Reports — GenericReportPage, filter panels | ~3 files | Low |
| 7 | Detail — accordions, tables, key-value displays | ~5 files | Low |
| 8 | Landing page — hero, sections | ~8 files | Low |
| 9 | Final polish — consistency pass, build verify | All | Low |
| 10 | Documentation — README, architecture docs | 3 files | None |

---

## Phase 1: Foundation (fonts, colors, CSS tokens, animations)

### Step 1.1: Add Google Fonts to index.html

**File:** `frontend/index.html`

Add `<link>` tags in `<head>` for:
- Space Grotesk (500, 600, 700)
- Plus Jakarta Sans (400, 500, 600)
- JetBrains Mono (400, 500)

Use `preconnect` and `font-display=swap` for performance.

### Step 1.2: Update CSS design tokens

**File:** `frontend/src/index.css`

1. Add font family CSS custom properties via `@theme`:
   ```
   --font-heading: 'Space Grotesk', sans-serif
   --font-body: 'Plus Jakarta Sans', sans-serif
   --font-data: 'JetBrains Mono', monospace
   ```

2. Update light mode color tokens in `@theme` block (see specs Section 3.1)

3. Update dark mode color tokens in `.dark` block (see specs Section 3.1)

4. Add semantic status color tokens (`--color-success`, `--color-warning`, `--color-info`)

5. Add chart color palette tokens (`--chart-0` through `--chart-7`)

6. Update `body` font-family to use `var(--font-body)` with system font fallback

7. Update global transition rule to include `color` and `box-shadow`, increase to 0.2s

8. Add new animation keyframes:
   - `fade-in-up` (page section reveal)
   - `shimmer` (loading skeleton)

9. Add `prefers-reduced-motion` media query to disable animations

### Step 1.3: Verify build

Run `npm run build` to confirm no Tailwind compilation issues.

---

## Phase 2: Core UI Components

### Step 2.1: Button

**File:** `frontend/src/components/ui/button.jsx`

- Add `active:scale-[0.98]` to base classes
- Add `transition-all duration-150` (replace `transition-colors`)
- Primary variant: add hover glow shadow
- Outline variant: add `hover:border-primary/60`

### Step 2.2: Card

**File:** `frontend/src/components/ui/card.jsx`

- Update border: `border-border/50 hover:border-border`
- Add `transition-all duration-200`
- Add dark mode top highlight: conditional `dark:border-t-white/[0.04]`
- CardTitle: add `font-heading` class

### Step 2.3: Badge

**File:** `frontend/src/components/ui/badge.jsx`

- Update font to `font-body` with `tracking-wide`
- Add `success` and `warning` variants using new semantic colors

### Step 2.4: Input

**File:** `frontend/src/components/ui/input.jsx`

- Update focus border: `focus-visible:border-primary/50`
- Add `dark:bg-muted/20` background for dark mode differentiation
- Update ring: `focus-visible:ring-primary/30`

### Step 2.5: Skeleton

**File:** `frontend/src/components/ui/skeleton.jsx`

- Add `animate-shimmer` variant alongside existing `animate-pulse`
- Use shimmer as default for a more polished loading state

### Step 2.6: Dialog

**File:** `frontend/src/components/ui/dialog.jsx`

- Add `backdrop-blur-sm` to overlay
- Add scale-in animation to dialog content

### Step 2.7: Accordion

**File:** `frontend/src/components/ui/accordion.jsx`

- Update trigger: add `font-heading` class
- Ensure smooth transition on chevron rotation

### Step 2.8: Select, MultiSelect, Combobox

**Files:** `select.jsx`, `multi-select.jsx`, `combobox.jsx`

- Update focus states to match Input changes
- Ensure `font-body` is applied

### Step 2.9: Dropdown Menu

**File:** `frontend/src/components/ui/dropdown-menu.jsx`

- Add entrance animation: `animate-in fade-in-0 slide-in-from-top-1`
- Update background to `bg-popover` with `border-border/50`

### Step 2.10: Tooltip

**File:** `frontend/src/components/ui/tooltip.jsx`

- Update to use `font-body text-xs`
- Ensure contrast in both modes

### Step 2.11: Verify build

Run `npm run build`.

---

## Phase 3: Layout Components

### Step 3.1: Navbar

**File:** `frontend/src/components/layout/Navbar.jsx`

- Update background: `bg-background/80 backdrop-blur-xl border-b border-border/50`
- Logo mark: add subtle gradient treatment
- Active link: change from `bg-primary/15` background to bottom border accent approach
- Navigation text: apply `font-body`
- Brand text: apply `font-heading`

### Step 3.2: Footer

**File:** `frontend/src/components/layout/Footer.jsx`

- Apply `font-body` to text
- Update styling to match new color tokens

### Step 3.3: Verify build

Run `npm run build`.

---

## Phase 4: Dashboard

### Step 4.1: DashboardPage

**File:** `frontend/src/features/dashboard/DashboardPage.jsx`

- Page title: `font-heading text-3xl font-bold tracking-tight`
- Section description: `font-body text-muted-foreground`
- Add `animate-fade-in-up` to main content sections with stagger

### Step 4.2: KPICard

**File:** `frontend/src/features/dashboard/components/KPICard.jsx`

- Value: `font-data text-2xl font-medium`
- Title: `font-body text-xs font-medium uppercase tracking-wider text-muted-foreground`
- Add left accent bar: `border-l-2 border-l-primary`
- Icon background: gradient treatment `bg-gradient-to-br from-primary/15 to-primary/5`

### Step 4.3: BarChartCard

**File:** `frontend/src/features/dashboard/components/BarChartCard.jsx`

- Title: `font-heading text-sm font-semibold`
- Apply chart colors from `--chart-N` tokens (each chart pair uses a dedicated color)
- Grid lines: reduce opacity (0.15 dark, 0.2 light)
- Tooltip: use `font-data` for values, `font-body` for labels

### Step 4.4: TopValueCard & RecentChangesCard

**Files:** `TopValueCard.jsx`, `RecentChangesCard.jsx`

- Apply `font-data` to numeric values
- Apply `font-heading` to card titles
- Apply `font-body` to text content

### Step 4.5: FilterBar

**File:** `frontend/src/features/dashboard/components/FilterBar.jsx`

- Update background: `bg-muted/40`
- Labels: `font-body text-xs font-medium uppercase tracking-wider`

### Step 4.6: DashboardNav

**File:** `frontend/src/features/dashboard/components/DashboardNav.jsx`

- Update background: `bg-muted/20`
- Labels: `font-heading text-xs font-semibold uppercase tracking-wider`

### Step 4.7: YearSelector

**File:** `frontend/src/features/dashboard/components/YearSelector.jsx`

- Apply font classes

### Step 4.8: Verify build + visual check

Run `npm run build`. Start dev server and visually inspect dashboard.

---

## Phase 5: Search Page

### Step 5.1: SearchPage

**File:** `frontend/src/features/search/SearchPage.jsx`

- Page header: `font-heading` for title
- Apply `animate-fade-in-up` to content

### Step 5.2: DataGrid

**File:** `frontend/src/features/search/components/DataGrid.jsx`

- Header cells: `font-heading text-xs font-semibold uppercase tracking-wider bg-muted/60`
- Data cells: `font-data text-xs` for numeric columns, `font-body text-sm` for text
- Row hover: `hover:bg-accent/50 transition-colors`

### Step 5.3: FilterPanel

**File:** `frontend/src/features/search/components/FilterPanel.jsx`

- Update background: `bg-muted/30`
- Labels: `font-body text-xs font-medium`

### Step 5.4: Pagination

**File:** `frontend/src/features/search/components/Pagination.jsx`

- Apply `font-body` to text, `font-data` to page numbers

### Step 5.5: Verify build

Run `npm run build`.

---

## Phase 6: Reports

### Step 6.1: GenericReportPage

**File:** `frontend/src/features/reports/components/GenericReportPage.jsx`

- Page header: `font-heading`
- Table headers: match DataGrid styling from Phase 5
- Apply same table styling conventions

### Step 6.2: ReportFilterPanel

**File:** `frontend/src/features/reports/components/ReportFilterPanel.jsx`

- Background: `bg-muted/30`
- Labels: `font-body text-xs font-medium`

### Step 6.3: ReportPage (Hechos)

**File:** `frontend/src/features/reports/ReportPage.jsx`

- Apply typography updates

### Step 6.4: Verify build

Run `npm run build`.

---

## Phase 7: Detail Page

### Step 7.1: DetailPage

**File:** `frontend/src/features/detail/DetailPage.jsx`

- Apply `font-heading` to portfolio ID title
- Add `animate-fade-in-up` to content

### Step 7.2: DetailHeader

**File:** `frontend/src/features/detail/components/DetailHeader.jsx`

- Typography: `font-heading` for ID, `font-body` for subtitle
- Background: `bg-muted/50 backdrop-blur-sm`

### Step 7.3: SectionAccordion

**File:** `frontend/src/features/detail/components/SectionAccordion.jsx`

- Title: `font-heading text-base font-semibold`
- Hover state: `hover:bg-muted/40`

### Step 7.4: SimpleTable & KeyValueDisplay

**Files:** `SimpleTable.jsx`, `KeyValueDisplay.jsx`

- Table headers: `font-heading text-xs font-semibold uppercase tracking-wider`
- Data: `font-data text-xs` for numeric, `font-body text-sm` for text
- Key labels: `font-body text-sm font-medium text-muted-foreground`

### Step 7.5: Verify build

Run `npm run build`.

---

## Phase 8: Landing Page

### Step 8.1: HeroSection

**File:** `frontend/src/features/landing/components/HeroSection.jsx`

- Headline: `font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter`
- Stats: `font-data text-3xl font-medium text-primary`
- Gradient: update background treatment per specs Section 7.1
- Badge: `font-body text-xs font-medium`

### Step 8.2: Other Landing Sections

**Files:** `ProblemSection.jsx`, `FeaturesSection.jsx`, `ProcessSection.jsx`, `AnalyticsSection.jsx`, `SecuritySection.jsx`, `PricingSection.jsx`, `AboutSection.jsx`

- Section titles: `font-heading`
- Body text: `font-body`
- Stat values: `font-data`
- Icon containers: gradient backgrounds where appropriate

### Step 8.3: Verify build

Run `npm run build`.

---

## Phase 9: Final Polish

### Step 9.1: Consistency Audit

- Review every page visually in both dark and light mode
- Check font usage consistency (no stray system fonts)
- Verify color contrast meets WCAG AA
- Test responsive layouts at all breakpoints (320px, 640px, 768px, 1024px, 1280px)

### Step 9.2: Performance Check

- Verify font loading doesn't cause layout shift (check `font-display: swap`)
- Confirm build size hasn't increased significantly
- Test page load performance

### Step 9.3: Animation Accessibility

- Verify `prefers-reduced-motion` disables all animations
- Test keyboard navigation focus states

### Step 9.4: Final Build

Run `npm run build` — confirm clean build with no warnings.

---

## Phase 10: Documentation

### Step 10.1: Update architecture_frontend.md

**File:** `specs/architecture/architecture_frontend.md`

- Section 2: Add font dependencies to technology stack table
- Section 12 (Styling): Document new font families, updated color tokens, animation classes
- Document the `font-heading`, `font-body`, `font-data` convention

### Step 10.2: Update README.md

**File:** `README.md`

- Note the design overhaul in the frontend section
- Mention the typography system (Space Grotesk / Plus Jakarta Sans / JetBrains Mono)

### Step 10.3: Close feature

Use `/close_feature feature_028` to move to implemented and commit.

---

## Estimated Impact

- **~45 files** modified (mostly CSS class updates)
- **0 new files** created
- **0 npm dependencies** added (fonts via CDN)
- **0 functional changes** — pure visual/CSS layer
- **Build size impact**: Minimal (CSS-only changes; fonts loaded externally)
