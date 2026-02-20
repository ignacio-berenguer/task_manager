# Implementation Plan: Feature 013 - Frontend Application Skeleton

## Overview

This document outlines the step-by-step implementation plan for the Portfolio Digital frontend skeleton.

---

## Phase 1: Project Setup

### Step 1.1: Initialize Vite React Project

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
```

**Files Created:**
- `package.json`
- `vite.config.js`
- `index.html`
- `src/main.jsx`
- `src/App.jsx`

### Step 1.2: Install Core Dependencies

```bash
npm install react-router-dom@6 axios @tanstack/react-query next-themes lucide-react recharts
npm install @clerk/clerk-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 1.3: Configure Tailwind CSS

**Update `tailwind.config.js`:**
- Add content paths
- Configure dark mode: `class`
- Add custom colors for Shadcn compatibility

**Create `src/globals.css`:**
- Tailwind directives
- CSS variables for light/dark themes
- Base styles

### Step 1.4: Setup Shadcn/ui

```bash
npx shadcn@latest init
```

**Configuration:**
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Path aliases: `@/` → `src/`

**Install initial components:**
```bash
npx shadcn@latest add button card navigation-menu dropdown-menu avatar
```

### Step 1.5: Create Environment Configuration

**Create `.env.example`:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Portfolio Digital
```

**Create `.env`** (gitignored)

### Step 1.6: Configure Path Aliases

**Update `vite.config.js`:**
```javascript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

**Create `jsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## Phase 2: Core Infrastructure

### Step 2.1: Create Logger Utility

**File:** `src/lib/logger.js`

**Implementation:**
- Log levels: DEBUG, INFO, WARNING, ERROR
- Console output with timestamps
- Color-coded output
- Remote logging for WARNING/ERROR (future)

### Step 2.2: Create Utility Functions

**File:** `src/lib/utils.js`

**Functions:**
- `cn()` - Tailwind class merging (clsx + tailwind-merge)
- `formatCurrency()` - Euro formatting
- `formatNumber()` - Number formatting with locale

### Step 2.3: Setup Axios Client

**File:** `src/api/client.js`

**Implementation:**
- Create Axios instance with base URL
- Request interceptor for Clerk token
- Response interceptor for error handling
- Logging integration

### Step 2.4: Create Provider Components

**File:** `src/providers/QueryProvider.jsx`
- TanStack Query client setup
- Default options configuration

**File:** `src/providers/Providers.jsx`
- Combined provider component
- Wraps: ClerkProvider, QueryProvider, ThemeProvider

---

## Phase 3: Theme System

### Step 3.1: Create Theme Provider

**File:** `src/components/theme/ThemeProvider.jsx`

**Implementation:**
- Wrap `next-themes` ThemeProvider
- Configure storage key
- Default to system theme

### Step 3.2: Create Mode Toggle

**File:** `src/components/theme/ModeToggle.jsx`

**Implementation:**
- Button component with icon
- Toggle between light/dark/system
- Dropdown menu for options

### Step 3.3: Define Theme CSS Variables

**Update `src/globals.css`:**
- Light mode variables under `:root`
- Dark mode variables under `.dark`
- Transition properties for smooth switching

---

## Phase 4: Layout Components

### Step 4.1: Create Layout Component

**File:** `src/components/layout/Layout.jsx`

**Implementation:**
- Flex container with min-height
- Navbar at top
- Main content area
- Footer (optional)

### Step 4.2: Create Navbar Component

**File:** `src/components/layout/Navbar.jsx`

**Sections:**
1. Logo (left) → links to `/`
2. Navigation links (center/left)
3. Theme toggle (right)
4. Auth section (right)

**Features:**
- Responsive design
- Mobile menu toggle
- Conditional rendering based on auth state
- Sticky positioning

**Sub-components:**
- `NavLink` - Individual navigation item
- `MobileMenu` - Hamburger menu content

### Step 4.3: Create Footer Component

**File:** `src/components/layout/Footer.jsx`

**Sections:**
- Copyright
- Navigation links
- Social links (placeholder)

### Step 4.4: Create Protected Route Component

**File:** `src/components/shared/ProtectedRoute.jsx`

**Implementation:**
- Use Clerk's `useAuth()` hook
- Redirect to sign-in if not authenticated
- Show loading state during auth check

---

## Phase 5: Landing Page

### Step 5.1: Create Hero Section

**File:** `src/features/landing/components/HeroSection.jsx`

**Content:**
- Main headline
- Subtext
- CTA buttons (Get a Demo, Explore Features)
- Background gradient/pattern

### Step 5.2: Create Problem Section

**File:** `src/features/landing/components/ProblemSection.jsx`

**Content:**
- Problem statement text
- Visual representation (icons/illustration)

### Step 5.3: Create Features Section

**File:** `src/features/landing/components/FeaturesSection.jsx`

**Content:**
- 8 feature cards in grid
- Icons + titles + descriptions
- Responsive layout (4→2→1 columns)

### Step 5.4: Create Process Section

**File:** `src/features/landing/components/ProcessSection.jsx`

**Content:**
- 4 steps: Capture → Evaluate → Prioritize → Execute
- Step numbers/icons
- Connecting lines/arrows

### Step 5.5: Create Additional Sections

**Files:**
- `src/features/landing/components/AnalyticsSection.jsx`
- `src/features/landing/components/AlignmentSection.jsx`
- `src/features/landing/components/SecuritySection.jsx`
- `src/features/landing/components/SocialProofSection.jsx`
- `src/features/landing/components/PricingSection.jsx`
- `src/features/landing/components/AboutSection.jsx`

### Step 5.6: Assemble Landing Page

**File:** `src/features/landing/LandingPage.jsx`

**Implementation:**
- Import all sections
- Compose in order
- Add smooth scroll behavior

---

## Phase 6: Dashboard Page

### Step 6.1: Create Data Hook

**File:** `src/features/dashboard/hooks/useDatosRelevantes.js`

**Implementation:**
- TanStack Query hook
- Fetch from `/datos-relevantes/search`
- Filter: exclude 'Cancelada'
- Return: data, isLoading, error

### Step 6.2: Create KPI Card Component

**File:** `src/features/dashboard/components/KPICard.jsx`

**Props:** title, value, icon, description

**Design:**
- Card with shadow
- Icon on left
- Value prominent
- Title below

### Step 6.3: Create Status Chart

**File:** `src/features/dashboard/components/StatusChart.jsx`

**Type:** Donut/Pie chart

**Data:** Count by `estado_de_la_iniciativa`

### Step 6.4: Create Unit Chart

**File:** `src/features/dashboard/components/UnitChart.jsx`

**Type:** Horizontal bar chart

**Data:** Count by `unidad`

### Step 6.5: Create Budget Chart

**File:** `src/features/dashboard/components/BudgetChart.jsx`

**Type:** Stacked bar chart

**Data:** Sum of budget_2024 through budget_2027 by unit

### Step 6.6: Create Cluster Chart

**File:** `src/features/dashboard/components/ClusterChart.jsx`

**Type:** Pie chart

**Data:** Count by `cluster_2025`

### Step 6.7: Create Execution Status Chart

**File:** `src/features/dashboard/components/ExecutionChart.jsx`

**Type:** Horizontal bar chart

**Data:** Count by `estado_ejecucion`

### Step 6.8: Assemble Dashboard Page

**File:** `src/features/dashboard/DashboardPage.jsx`

**Layout:**
- KPI cards row (4 cards)
- Charts grid (2x3)
- Loading states
- Error handling

---

## Phase 7: Placeholder Pages

### Step 7.1: Create Search Page

**File:** `src/pages/SearchPage.jsx`

**Content:**
- "Coming Soon" message
- Brief description
- Back to dashboard link

### Step 7.2: Create Register Page

**File:** `src/pages/RegisterPage.jsx`

**Content:**
- "Coming Soon" message
- Brief description

### Step 7.3: Create Jobs Page

**File:** `src/pages/JobsPage.jsx`

**Content:**
- "Coming Soon" message
- Brief description

---

## Phase 8: Routing

### Step 8.1: Configure React Router

**File:** `src/App.jsx`

**Routes:**
```jsx
<Routes>
  {/* Public */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
  <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />

  {/* Private */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/jobs" element={<JobsPage />} />
  </Route>
</Routes>
```

### Step 8.2: Configure Clerk Redirects

**Implementation:**
- `afterSignInUrl="/dashboard"`
- `afterSignUpUrl="/dashboard"`
- `afterSignOutUrl="/"`

---

## Phase 9: Integration & Testing

### Step 9.1: Test Authentication Flow

1. Sign up new user
2. Sign in existing user
3. Sign out
4. Verify redirects
5. Test protected route access

### Step 9.2: Test Theme Switching

1. Toggle light/dark mode
2. Verify persistence
3. Test system preference detection

### Step 9.3: Test Dashboard Data

1. Verify API connection
2. Check KPI calculations
3. Validate chart data
4. Test loading states
5. Test error handling

### Step 9.4: Test Responsive Design

1. Desktop (1920px, 1440px, 1024px)
2. Tablet (768px)
3. Mobile (375px, 320px)

---

## Phase 10: Documentation

### Step 10.1: Update README.md

**Add sections:**
- Frontend overview
- Setup instructions
- Running development server
- Environment configuration
- Available scripts

### Step 10.2: Update architecture_frontend.md

**Update with:**
- Actual implemented structure
- Component hierarchy
- State management details
- API integration patterns

### Step 10.3: Create .env.example

Ensure all required variables are documented.

---

## Implementation Order Summary

| Phase | Steps | Estimated Files |
|-------|-------|-----------------|
| 1. Project Setup | 1.1 - 1.6 | 8 |
| 2. Core Infrastructure | 2.1 - 2.4 | 4 |
| 3. Theme System | 3.1 - 3.3 | 3 |
| 4. Layout Components | 4.1 - 4.4 | 4 |
| 5. Landing Page | 5.1 - 5.6 | 11 |
| 6. Dashboard Page | 6.1 - 6.8 | 8 |
| 7. Placeholder Pages | 7.1 - 7.3 | 3 |
| 8. Routing | 8.1 - 8.2 | 1 |
| 9. Integration & Testing | 9.1 - 9.4 | 0 |
| 10. Documentation | 10.1 - 10.3 | 3 |

**Total estimated files:** ~45 files

---

## Dependencies Between Phases

```
Phase 1 (Setup)
    │
    ├──► Phase 2 (Infrastructure)
    │        │
    │        ├──► Phase 3 (Theme)
    │        │        │
    │        │        └──► Phase 4 (Layout)
    │        │                 │
    │        │                 ├──► Phase 5 (Landing)
    │        │                 │
    │        │                 └──► Phase 6 (Dashboard)
    │        │                          │
    │        └──────────────────────────┤
    │                                   │
    └───────────────────────────────────┴──► Phase 7 (Placeholders)
                                                │
                                                └──► Phase 8 (Routing)
                                                        │
                                                        └──► Phase 9 (Testing)
                                                                │
                                                                └──► Phase 10 (Docs)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Clerk configuration issues | Test with development keys first |
| API CORS errors | Ensure backend has proper CORS config |
| Chart library complexity | Start with simple charts, iterate |
| Theme inconsistencies | Follow Shadcn CSS variable conventions |
| Mobile responsiveness | Test early and often |

---

## Definition of Done

- [ ] All 10 phases completed
- [ ] Authentication working (sign-up, sign-in, sign-out)
- [ ] Theme switching functional
- [ ] Landing page renders all sections
- [ ] Dashboard displays real data from API
- [ ] All routes protected appropriately
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] README.md updated
- [ ] architecture_frontend.md updated
- [ ] .env.example complete
