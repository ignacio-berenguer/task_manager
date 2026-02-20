# Specs: feature_036 — Landing Page Redesign & Changelog

## 1. Overview

Redesign the public landing page to show only the hero section (without action buttons) followed by a new Changelog section. Introduce an application versioning system tied to feature numbers.

## 2. Changes Summary

| Area | Action |
|------|--------|
| LandingPage.jsx | Remove 7 section imports/renders (Problem, Features, Process, Analytics, Security, Pricing, About) |
| HeroSection.jsx | Remove "Solicitar Demo" and "Explorar Funcionalidades" buttons |
| New: ChangelogSection.jsx | New section displaying all implemented features with version numbers |
| New: `src/lib/version.js` | Application version constant + changelog data array |
| architecture_frontend.md | Add section documenting changelog update process |
| README.md | Update landing page description |

## 3. Technical Specifications

### 3.1 Landing Page Simplification

**File:** `frontend/src/features/landing/LandingPage.jsx`

Remove imports and renders of:
- `ProblemSection`
- `FeaturesSection`
- `ProcessSection`
- `AnalyticsSection`
- `SecuritySection`
- `PricingSection`
- `AboutSection`

The component files themselves will NOT be deleted — they remain in the codebase in case they are needed in the future.

Final structure:
```jsx
<Layout>
  <HeroSection />
  <ChangelogSection />
</Layout>
```

### 3.2 Hero Section Button Removal

**File:** `frontend/src/features/landing/components/HeroSection.jsx`

Remove:
- The entire CTA `<div>` block (lines 34-44) containing both buttons
- The `Link` import from `react-router-dom` (if only used by buttons)
- The `ArrowRight` and `Play` imports from `lucide-react`
- The `Button` import from `@/components/ui/button`

Keep:
- Badge
- Main headline
- Subtext / description
- Stats row
- Background decoration

### 3.3 Version File

**File:** `frontend/src/lib/version.js`

```javascript
/**
 * Application version.
 * MAJOR: Incremented for major releases (currently 0).
 * MINOR: Equals the most recent implemented feature number.
 */
export const APP_VERSION = {
  major: 0,
  minor: 36,
}

export const VERSION_STRING = `${APP_VERSION.major}.${String(APP_VERSION.minor).padStart(3, '0')}`
// Result: "0.036"
```

### 3.4 Changelog Data

**File:** `frontend/src/lib/changelog.js`

A structured array of changelog entries, ordered from most recent to oldest:

```javascript
import { APP_VERSION } from './version'

export const CHANGELOG = [
  {
    version: '0.036',
    feature: 36,
    title: 'Landing Page Redesign & Changelog',
    summary: 'Redesigned landing page with simplified hero section and changelog showing all implemented features with version tracking.',
  },
  {
    version: '0.035',
    feature: 35,
    title: 'Detail Page Visual Polish & Badges',
    summary: 'Added data existence indicators to sidebar navigation with count badges for 1:N sections and dots for 1:1 sections.',
  },
  // ... entries for features 34 down to 1
]
```

Each entry has:
- `version` — string in `MAJOR.MINOR` format (e.g., `"0.035"`)
- `feature` — integer feature number
- `title` — short feature name
- `summary` — 1-2 sentence description

### 3.5 Changelog Section Component

**File:** `frontend/src/features/landing/components/ChangelogSection.jsx`

Design:
- Section header: "Change Log" with a `ScrollText` (or similar) icon from lucide-react
- Current version displayed prominently below the header (from `VERSION_STRING`)
- List of changelog entries rendered as cards or timeline items
- Each entry shows:
  - Version badge (e.g., `v0.035`)
  - Feature title
  - Summary text
- Ordered from most recent to oldest (array order)
- Responsive: single column layout
- Styling consistent with the existing landing page design system (uses `font-heading`, `font-body`, `bg-muted/50`, `text-muted-foreground`, etc.)
- No interactivity required (static display)

### 3.6 Architecture Documentation Update

**File:** `specs/architecture/architecture_frontend.md`

Add a new section (after the existing content or as subsection under an appropriate heading):

```markdown
### XX. Changelog & Versioning

**Version File:** `frontend/src/lib/version.js`
- `APP_VERSION.major`: Major version (currently 0)
- `APP_VERSION.minor`: Equals the most recent implemented feature number
- `VERSION_STRING`: Formatted as `"MAJOR.MINOR"` with zero-padded 3-digit minor

**Changelog Data:** `frontend/src/lib/changelog.js`
- Array of `{ version, feature, title, summary }` objects
- Ordered from most recent to oldest

**Release Process — MANDATORY for every new feature:**
1. Increment `APP_VERSION.minor` in `version.js` to the new feature number
2. Add a new entry at the TOP of the `CHANGELOG` array in `changelog.js`
3. Entry must include: version string, feature number, title, and summary
```

### 3.7 README Update

Update the landing page description in `README.md` to reflect the new structure (hero + changelog, no marketing sections).

## 4. Files Changed

| File | Action |
|------|--------|
| `frontend/src/features/landing/LandingPage.jsx` | Modify (remove 7 section imports/renders, add ChangelogSection) |
| `frontend/src/features/landing/components/HeroSection.jsx` | Modify (remove buttons and related imports) |
| `frontend/src/features/landing/components/ChangelogSection.jsx` | **Create** (new changelog section component) |
| `frontend/src/lib/version.js` | **Create** (version constants) |
| `frontend/src/lib/changelog.js` | **Create** (changelog data with 36 entries) |
| `specs/architecture/architecture_frontend.md` | Modify (add changelog & versioning section) |
| `README.md` | Modify (update landing page description) |

## 5. No Backend Changes

This feature is entirely frontend. No API endpoints, database changes, or backend modifications are needed.

## 6. Constraints

- Existing section component files (ProblemSection.jsx, etc.) are NOT deleted
- All other application functionality (dashboard, search, reports, detail) remains unchanged
- The changelog is static data — no API calls needed
- Spanish language for all UI text
