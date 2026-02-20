# Feature 013: Frontend Application Skeleton

## 1. Overview

This feature implements the foundational skeleton for the Portfolio Digital frontend application. It establishes the core architecture, authentication system, navigation, theming, and initial pages including a public landing page and a private dashboard.

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18+ |
| Build Tool | Vite | 5+ |
| Styling | Tailwind CSS | 3.4+ |
| UI Components | Shadcn/ui | Latest |
| Authentication | Clerk | Latest |
| Data Fetching | TanStack Query | 5+ |
| HTTP Client | Axios | 1.6+ |
| Theme Management | next-themes | Latest |
| Routing | React Router DOM | 6+ |
| Charting | Recharts | 2+ |

---

## 3. Requirements Specification

### 3.1 Dark/Light Mode (Requirement 2)

**Description:** The application supports system-aware theming with manual override.

**Specifications:**
- Default behavior: Follow system preference
- Manual toggle: Available in navigation bar
- Persistence: Store selection in localStorage
- Implementation: Use `next-themes` with Shadcn/ui CSS variables
- Transitions: Smooth color transitions (150ms)

**Technical Details:**
```javascript
// Theme values: "light" | "dark" | "system"
// Storage key: "portfolio-theme"
// CSS variables defined in globals.css for both modes
```

---

### 3.2 Public Landing Page (Requirement 3)

**Route:** `/`

**Description:** Marketing-focused landing page accessible to all users.

**Sections (from contents_home_page.md):**

| Section | Component | Description |
|---------|-----------|-------------|
| Hero | `HeroSection` | Value proposition, subtext, CTAs (Get a Demo, Explore Features) |
| Problem | `ProblemSection` | Describes challenges solved by the platform |
| Features | `FeaturesSection` | 8 key features with icons in grid layout |
| How It Works | `ProcessSection` | 4-step process: Capture → Evaluate → Prioritize → Execute |
| Analytics | `AnalyticsSection` | Portfolio analytics capabilities |
| Alignment | `AlignmentSection` | Strategic alignment features |
| Security | `SecuritySection` | Security & compliance features |
| Social Proof | `SocialProofSection` | Testimonials placeholder |
| Pricing | `PricingSection` | Tiered plans overview |
| About | `AboutSection` | Mission statement |
| Footer | `Footer` | Navigation links, legal, contact |

**Design Guidelines:**
- Full-width sections with alternating backgrounds
- Responsive design (mobile-first)
- Smooth scroll navigation for internal links
- CTA buttons use primary color scheme

---

### 3.3 Navigation Bar (Requirement 4)

**Component:** `Navbar`

**Position:** Fixed/sticky at top of viewport

**Structure:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo] │ Dashboard │ Search │ Register │ Jobs │ ... │ [Theme] │ [User] │
└─────────────────────────────────────────────────────────────────────┘
```

**Public Elements (always visible):**
- Portfolio logo (left) → links to `/`
- Theme toggle (right)

**Authentication Elements (right side):**
- **Logged out:** Sign In, Sign Up buttons (Clerk components)
- **Logged in:** User menu with avatar (Clerk UserButton)

**Private Menu Items (visible when authenticated):**
- Dashboard → `/dashboard`
- Search → `/search`
- Register → `/register`
- Jobs → `/jobs`

**Technical Details:**
- Use Shadcn/ui `NavigationMenu` component
- Support for dropdown menus (future expansion)
- Z-index: 50 (above page content)
- Height: 64px (h-16)
- Background: Blur effect with semi-transparent background

---

### 3.4 Authentication (Requirements 5, 6)

**Provider:** Clerk

**Features:**
- Sign up flow
- Sign in flow
- Sign out
- User profile/avatar via `<UserButton />`
- Session management via `<ClerkProvider />`

**Clerk Components Used:**
| Component | Usage |
|-----------|-------|
| `<ClerkProvider>` | Root provider wrapping entire app |
| `<SignInButton>` | Trigger sign-in flow |
| `<SignUpButton>` | Trigger sign-up flow |
| `<UserButton>` | User avatar with dropdown menu |
| `<SignedIn>` | Conditional render for authenticated users |
| `<SignedOut>` | Conditional render for unauthenticated users |
| `<RedirectToSignIn>` | Redirect helper for protected routes |

**Configuration:**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

### 3.5 Private Menu Items (Requirement 7)

**Authenticated Navigation:**

| Item | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | KPIs and portfolio charts |
| Search | `/search` | Initiative search (placeholder) |
| Register | `/register` | New initiative registration (placeholder) |
| Jobs | `/jobs` | Background jobs (placeholder) |

**Placeholder Pages:**
- Search, Register, Jobs pages show "Coming Soon" message
- Consistent layout with Navbar

---

### 3.6 Dashboard (Requirement 8)

**Route:** `/dashboard`

**Data Source:** `datos_relevantes` table via API

**Filter:** Exclude all initiatives where `estado_de_la_iniciativa = 'Cancelada'`

**KPI Cards:**

| KPI | Calculation | Icon |
|-----|-------------|------|
| Total Initiatives | COUNT(*) where estado != 'Cancelada' | Briefcase |
| Total Budget 2025 | SUM(budget_2025) | Euro |
| Approved Initiatives | COUNT(*) where estado_aprobacion = 'Aprobada' | CheckCircle |
| In Execution | COUNT(*) where estado_ejecucion contains 'Ejecución' | Play |

**Charts:**

1. **Initiatives by Status (Donut Chart)**
   - Field: `estado_de_la_iniciativa`
   - Exclude: 'Cancelada'
   - Display: Count per status

2. **Initiatives by Unit (Bar Chart)**
   - Field: `unidad`
   - Exclude: Cancelada
   - Display: Count per unit

3. **Budget by Year (Stacked Bar Chart)**
   - Fields: `budget_2024`, `budget_2025`, `budget_2026`, `budget_2027`
   - Group by: `unidad`
   - Display: Sum per year per unit

4. **Initiatives by Cluster (Pie Chart)**
   - Field: `cluster_2025`
   - Exclude: Cancelada, NULL
   - Display: Count per cluster

5. **Budget vs Approved (Comparison Bar)**
   - Fields: `budget_2025` vs `importe_aprobado_2025`
   - Aggregation: SUM totals

6. **Execution Status (Horizontal Bar)**
   - Field: `estado_ejecucion`
   - Exclude: Cancelada
   - Display: Count per status

**Layout:**
- Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- KPI cards at top (4 cards)
- Charts below in 2-column grid

---

### 3.7 Route Protection (Requirement 9)

**Public Routes:**
- `/` - Landing page
- `/sign-in/*` - Clerk sign-in
- `/sign-up/*` - Clerk sign-up

**Private Routes (require authentication):**
- `/dashboard`
- `/search`
- `/register`
- `/jobs`

**Implementation:**
- `ProtectedRoute` component wrapping private routes
- Redirect to `/sign-in` if unauthenticated
- Use Clerk's `useAuth()` hook for state

---

### 3.8 Redirects (Requirement 10)

**Post Sign-In:**
- Redirect to `/dashboard`
- Configure via Clerk dashboard or `afterSignInUrl` prop

**Post Sign-Out:**
- Redirect to `/`
- Configure via `afterSignOutUrl` prop

---

### 3.9 Logging (General Requirement)

**Implementation:** Custom logger utility (`lib/logger.js`)

**Log Levels:**
| Level | Console | Remote API | Description |
|-------|---------|------------|-------------|
| DEBUG | Yes (if enabled) | No | Development details |
| INFO | Yes | No | App milestones, navigation |
| WARNING | Yes | Yes | Non-critical issues |
| ERROR | Yes | Yes | Critical failures + toast |

**Configuration:**
```env
VITE_LOG_LEVEL=INFO
VITE_API_BASE_URL=http://localhost:8000
```

**Log Format:**
```
[2026-02-01T10:30:00.000Z] [INFO] [Dashboard] Loaded 814 initiatives
```

---

## 4. API Integration

### 4.1 Axios Client Configuration

**File:** `src/api/client.js`

**Features:**
- Base URL from environment
- Clerk token injection via interceptor
- Request/response logging
- Error handling with toast notifications

**Interceptor Flow:**
```
Request → Get Clerk token → Add Authorization header → Send
Response → Log → Return data or handle error
```

### 4.2 TanStack Query Setup

**File:** `src/providers/QueryProvider.jsx`

**Configuration:**
```javascript
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
}
```

### 4.3 Dashboard Data Fetching

**Hook:** `useDatosRelevantes()`

**Endpoint:** `POST /api/v1/datos-relevantes/search`

**Request:**
```json
{
  "filters": [
    {"field": "estado_de_la_iniciativa", "operator": "ne", "value": "Cancelada"}
  ],
  "limit": 1000,
  "offset": 0
}
```

---

## 5. Directory Structure

```
frontend/
├── public/
│   └── logo.svg
├── src/
│   ├── api/
│   │   └── client.js              # Axios instance + interceptors
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── navigation-menu.jsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   ├── theme/
│   │   │   ├── ThemeProvider.jsx
│   │   │   └── ModeToggle.jsx
│   │   └── shared/
│   │       └── ProtectedRoute.jsx
│   ├── features/
│   │   ├── landing/
│   │   │   ├── components/
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── FeaturesSection.jsx
│   │   │   │   ├── ProcessSection.jsx
│   │   │   │   └── ...
│   │   │   └── LandingPage.jsx
│   │   └── dashboard/
│   │       ├── components/
│   │       │   ├── KPICard.jsx
│   │       │   ├── StatusChart.jsx
│   │       │   ├── UnitChart.jsx
│   │       │   └── BudgetChart.jsx
│   │       ├── hooks/
│   │       │   └── useDatosRelevantes.js
│   │       └── DashboardPage.jsx
│   ├── lib/
│   │   ├── logger.js              # Logging utility
│   │   └── utils.js               # cn() helper
│   ├── pages/
│   │   ├── SearchPage.jsx         # Placeholder
│   │   ├── RegisterPage.jsx       # Placeholder
│   │   └── JobsPage.jsx           # Placeholder
│   ├── providers/
│   │   ├── ClerkProvider.jsx
│   │   ├── QueryProvider.jsx
│   │   └── Providers.jsx          # Combined providers
│   ├── App.jsx                    # Router setup
│   ├── main.jsx                   # Entry point
│   └── globals.css                # Tailwind + theme variables
├── .env.example
├── .env                           # Local config (gitignored)
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── jsconfig.json                  # Path aliases
└── components.json                # Shadcn config
```

---

## 6. Environment Variables

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Logging
VITE_LOG_LEVEL=INFO

# Application
VITE_APP_NAME=Portfolio Digital
```

---

## 7. Component Specifications

### 7.1 Navbar Component

**Props:** None (uses context for auth state)

**State:**
- `isMobileMenuOpen`: Boolean for mobile menu toggle

**Behavior:**
- Sticky positioning
- Responsive: hamburger menu on mobile
- Conditional rendering based on auth state

### 7.2 KPICard Component

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| title | string | KPI label |
| value | string/number | Main value |
| icon | ReactNode | Lucide icon |
| trend | number | Optional change percentage |

### 7.3 Chart Components

**Common Props:**
| Prop | Type | Description |
|------|------|-------------|
| data | array | Processed data for chart |
| isLoading | boolean | Loading state |
| title | string | Chart title |

---

## 8. Styling Guidelines

### 8.1 Color Palette

**Light Mode:**
- Background: `hsl(0 0% 100%)`
- Foreground: `hsl(222.2 84% 4.9%)`
- Primary: `hsl(221.2 83.2% 53.3%)` (Blue)
- Accent: `hsl(210 40% 96.1%)`

**Dark Mode:**
- Background: `hsl(222.2 84% 4.9%)`
- Foreground: `hsl(210 40% 98%)`
- Primary: `hsl(217.2 91.2% 59.8%)` (Blue)
- Accent: `hsl(217.2 32.6% 17.5%)`

### 8.2 Typography

- Font: System font stack (Inter recommended)
- Headings: Bold, tracking-tight
- Body: Normal weight, leading-relaxed

### 8.3 Spacing

- Section padding: `py-16` to `py-24`
- Container max-width: `max-w-7xl`
- Card padding: `p-6`
- Gap between elements: `gap-4` to `gap-8`

---

## 9. Security Considerations

- **Token Handling:** Clerk manages JWT tokens securely
- **API Authorization:** All private API calls include Bearer token
- **Route Protection:** Client-side + API-side validation
- **Environment Variables:** Sensitive keys use VITE_ prefix (client-side safe)

---

## 10. Performance Considerations

- **Code Splitting:** Route-based lazy loading
- **Data Caching:** TanStack Query with 5-minute stale time
- **Image Optimization:** WebP format, lazy loading
- **Bundle Size:** Tree-shaking, minimal dependencies

---

## 11. Accessibility

- **Keyboard Navigation:** Full support via Shadcn/ui
- **Screen Readers:** Semantic HTML, ARIA labels
- **Color Contrast:** WCAG 2.1 AA compliance
- **Focus Indicators:** Visible focus rings

---

## 12. Future Considerations

- **Search Page:** Full-text search with filters
- **Register Page:** Initiative creation form
- **Jobs Page:** Background task monitoring
- **Internationalization:** i18n support (Spanish/English)
