# Architecture Document: Frontend

## Digital Initiative Portfolio Manager

### 1. Overview

The frontend is a modern React Single Page Application (SPA) built with **Vite**. It is designed to consume a **Remote FastAPI** service for all business logic and data persistence. The UI is built using custom components based on **Shadcn/ui** patterns with **Tailwind CSS** to provide a professional, accessible, and themeable user experience.

**Language:** The entire user interface is in **Spanish**. All labels, buttons, messages, placeholders, and landing page content use Spanish text (without accents in code identifiers).

---

### 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19+ |
| Build Tool | Vite | 7+ |
| Styling | Tailwind CSS | 4+ |
| UI Components | Custom (Shadcn/ui patterns) | - |
| Authentication | Clerk | Latest |
| Data Fetching | TanStack Query + Axios | 5+ |
| Theme Management | next-themes | Latest |
| Routing | React Router DOM | 6+ |
| Charts | Recharts | 2+ |
| Data Grid | TanStack Table | 8+ |
| Toast Notifications | Sonner | Latest |
| Export | xlsx, file-saver | Latest |
| Markdown Rendering | react-markdown + remark-gfm | 9+, 4+ |
| Typography | Space Grotesk, Plus Jakarta Sans, JetBrains Mono | Google Fonts CDN |

---

### 3. System Architecture

The frontend is strictly decoupled from the database. It communicates with two primary external services:

1. **Clerk Auth:** Handles user identity, session management, and JWT acquisition.
2. **Remote API:** A FastAPI instance providing CRUD operations and business logic for Digital Initiatives.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React SPA)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Landing  │  │Dashboard │  │  Search  │  │ Reports  │  │ Register │ │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │  │   Page   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │           │
│  ┌────┴─────────────┴─────────────┴─────────────┴─────┐    │
│  │              React Router (Routes)                  │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                            │                                │
│  ┌─────────────────────────┴───────────────────────────┐    │
│  │              Providers (Clerk, Query, Theme)         │    │
│  └─────────────────────────┬───────────────────────────┘    │
└────────────────────────────┼────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
     ┌──────────┐     ┌──────────┐     ┌──────────┐
     │  Clerk   │     │ FastAPI  │     │  Theme   │
     │   Auth   │     │   API    │     │ Storage  │
     └──────────┘     └──────────┘     └──────────┘
```

---

### 4. Directory Structure

```text
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── client.js              # Axios instance + interceptors
│   ├── components/
│   │   ├── ui/                    # UI components
│   │   │   ├── button.jsx         # Button with variants
│   │   │   ├── card.jsx           # Card components
│   │   │   ├── multi-select.jsx   # Multi-select dropdown
│   │   │   ├── datepicker.jsx     # DatePicker with calendar popup (react-day-picker, Spanish locale)
│   │   │   └── sheet.jsx          # Side sheet/drawer (portal-based, slide-in from right)
│   │   ├── layout/
│   │   │   ├── Navbar.jsx         # Navigation bar
│   │   │   ├── GlobalSearch.jsx   # Global search bar (Ctrl+Shift+F, searches by portfolio_id/nombre)
│   │   │   ├── Footer.jsx         # Footer component
│   │   │   └── Layout.jsx         # Main layout wrapper
│   │   ├── theme/
│   │   │   ├── ThemeProvider.jsx         # Dark/light mode provider (next-themes)
│   │   │   ├── ModeToggle.jsx            # Dark/light toggle button
│   │   │   ├── ColorThemeProvider.jsx    # Color theme context (6 themes, localStorage)
│   │   │   └── ColorThemeSelector.jsx    # Theme selector dropdown (Palette icon)
│   │   └── shared/
│   │       ├── Breadcrumb.jsx     # Breadcrumb navigation bar (route metadata + parent chain)
│   │       ├── ProtectedRoute.jsx # Auth guard for routes
│   │       ├── SidebarNav.jsx     # Reusable sticky sidebar nav with IntersectionObserver + optional badges + onActiveSectionChange + search filter
│   │       ├── ColumnConfigurator.jsx # Column visibility + drag-and-drop reordering dialog
│   │       ├── SortableColumnItem.jsx # Draggable column item (@dnd-kit/sortable)
│   │       ├── CurrencyCell.jsx  # Currency value with hover tooltip (full precision)
│   │       ├── EstadoTag.jsx     # Estado colored badge (min-width, centered, uses lib/estadoColors.js)
│   │       ├── InitiativeDrawer.jsx # Quick-view side drawer (summary + hechos/notas/justif/descripciones/dependencias)
│   │       ├── JsonViewerModal.jsx # JSON viewer modal with syntax highlighting
│   │       ├── SummaryViewerModal.jsx # Summary viewer modal (JSON → formatted HTML)
│   │       ├── EmptyState.jsx   # Reusable empty state (icon, title, description, action, compact variant)
│   │       ├── ConsoleDialog.jsx # Terminal-like SSE streaming dialog for management jobs
│   │       ├── ErrorBoundary.jsx # React error boundary with retry button
│   │       └── NotFoundPage.jsx  # 404 page with link to dashboard
│   ├── hooks/
│   │   └── usePageTitle.js          # Dynamic document.title hook
│   ├── features/
│   │   ├── landing/
│   │   │   ├── components/        # Landing page sections
│   │   │   │   ├── HeroSection.jsx  # Dynamic stats from API + loading skeletons
│   │   │   │   └── ChangelogSection.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useOverviewStats.js  # Fetches GET /stats/overview for landing page
│   │   │   └── LandingPage.jsx    # Landing page composition
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── KPICard.jsx    # KPI display card (optional trend indicator)
│   │   │   │   ├── SummaryCard.jsx # Large summary metric card
│   │   │   │   ├── StatusChart.jsx # Donut/pie chart
│   │   │   │   ├── BarChartCard.jsx # Bar chart (double-click navigation, PNG export)
│   │   │   │   ├── FilterBar.jsx  # Filter bar with selectors
│   │   │   │   ├── TopValueCard.jsx # Top value initiatives list
│   │   │   │   ├── RecentChangesCard.jsx # Recent changes list
│   │   │   │   ├── DashboardNav.jsx # Sidebar navigation (uses shared/SidebarNav)
│   │   │   │   └── YearSelector.jsx # Year dropdown selector
│   │   │   ├── hooks/
│   │   │   │   └── useDatosRelevantes.js # Data fetching + filtering
│   │   │   ├── utils/
│   │   │   │   └── filterStorage.js # localStorage persistence
│   │   │   └── DashboardPage.jsx  # Dashboard composition
│   │   ├── search/                # Initiative search feature
│   │   │   ├── components/
│   │   │   │   ├── FilterPanel.jsx    # Collapsible filter form (paste normalization for Portfolio ID)
│   │   │   │   ├── DataGrid.jsx       # TanStack Table grid (row selection, favorites star, sticky header)
│   │   │   │   ├── CopySelectedButton.jsx # Copy selected portfolio IDs to clipboard
│   │   │   │   ├── FavoritesToolbar.jsx   # Favorites dropdown (copy IDs, edit, clear)
│   │   │   │   ├── FavoritesDialog.jsx    # Favorites edit modal dialog
│   │   │   │   ├── InitiativeDrawer.jsx   # MOVED to components/shared/InitiativeDrawer.jsx
│   │   │   │   ├── ColumnSelector.jsx # Column visibility (legacy, replaced by shared/ColumnConfigurator)
│   │   │   │   ├── ExportDropdown.jsx # Export format menu
│   │   │   │   ├── RowActions.jsx     # Row action buttons (quick-view, view detail)
│   │   │   │   ├── LtpModal.jsx      # LTP quick edit modal (CRUD via transacciones_json)
│   │   │   │   └── Pagination.jsx     # Page navigation
│   │   │   ├── hooks/
│   │   │   │   ├── useSearchInitiatives.js
│   │   │   │   ├── useFilterOptions.js
│   │   │   │   ├── useFavorites.js     # Favorites localStorage hook
│   │   │   │   └── useSearchPreferences.js
│   │   │   ├── utils/
│   │   │   │   ├── searchStorage.js   # localStorage persistence
│   │   │   │   ├── columnDefinitions.js # Column metadata
│   │   │   │   └── exportHelpers.js   # Export functions
│   │   │   └── SearchPage.jsx     # Search page composition
│   │   ├── reports/               # Reports feature (Informes)
│   │   │   ├── components/
│   │   │   │   ├── ReportFilterPanel.jsx  # Collapsible filter form with date range presets
│   │   │   │   ├── ReportTemplates.jsx    # Save/load/delete named report templates
│   │   │   │   ├── ReportColumnSelector.jsx # Additional column selector (legacy, replaced by shared/ColumnConfigurator)
│   │   │   │   └── GenericReportPage.jsx    # Config-driven reusable report page (aggregation footer, empty state, templates)
│   │   │   ├── hooks/
│   │   │   │   ├── useReportSearch.js     # POST /hechos/search-report01
│   │   │   │   ├── useReportFilterOptions.js # GET /hechos/report01-filter-options
│   │   │   │   └── useReportPreferences.js  # localStorage persistence (columns, pageSize, templates)
│   │   │   ├── utils/
│   │   │   │   ├── reportStorage.js       # localStorage keys & helpers
│   │   │   │   └── reportColumnDefinitions.js # Column metadata
│   │   │   ├── ReportPage.jsx             # Report page composition
│   │   │   └── index.js                   # Barrel export
│   │   ├── parametricas/           # Parametric values management
│   │   │   ├── ParametricasPage.jsx      # Full CRUD page for parametros table
│   │   │   └── ParametroFormDialog.jsx   # Create/edit dialog for parametro records
│   │   ├── etiquetas-destacadas/   # Etiquetas Destacadas management
│   │   │   ├── EtiquetasDestacadasPage.jsx  # Full CRUD page for etiquetas_destacadas table
│   │   │   ├── EtiquetaDestacadaFormDialog.jsx  # Create/edit dialog
│   │   │   └── hooks/
│   │   │       └── useEtiquetasDestacadas.js  # CRUD hook (list, create, update, delete)
│   │   ├── chat/                  # AI Chat Assistant feature
│   │   │   ├── ChatContext.jsx          # Chat state provider (messages, streaming, tool steps, clearChat with abort race condition fix)
│   │   │   ├── components/
│   │   │   │   ├── ChatInput.jsx        # Message input with unified container, focus glow, UP/DOWN history
│   │   │   │   ├── MessageList.jsx      # Scrollable message list with gradient empty state
│   │   │   │   ├── MessageBubble.jsx    # Message bubble (gradient user, frosted glass assistant)
│   │   │   │   ├── MarkdownRenderer.jsx # react-markdown + remark-gfm + portfolio_id linkification + chart image rendering
│   │   │   │   └── ToolCallBlock.jsx    # Collapsible tool call display
│   │   │   ├── hooks/
│   │   │   │   ├── useChatStream.js     # SSE streaming hook (POST /agent/chat)
│   │   │   │   └── useCommandHistory.js # Command history with UP/DOWN arrow navigation (ref-based)
│   │   │   └── ChatPage.jsx             # Chat page with gradient accent header
│   │   └── detail/                # Initiative detail feature
│   │       ├── components/
│   │       │   ├── DetailHeader.jsx   # Header with back/actions and sticky status badges (includes SmBadge helper)
│   │       │   ├── DetailNav.jsx      # Sidebar navigation with data badges (uses shared/SidebarNav)
│   │       │   ├── SectionAccordion.jsx # Collapsible section (controlled/uncontrolled, headerAction prop, onExport prop, onHistory prop)
│   │       │   ├── SectionHistoryModal.jsx # Modal showing transacciones_json filtered by entity type with expandable JSON diff
│   │       │   ├── EmptySectionsPanel.jsx # Summary panel for sections without data (with CRUD buttons)
│   │       │   ├── KeyValueDisplay.jsx  # Key-value pairs
│   │       │   ├── SimpleTable.jsx    # Data table (with link/longtext types, sortable columns)
│   │       │   utils/
│   │       │   └── exportSection.js  # CSV export utility for section data
│   │       │   ├── NotaFormModal.jsx  # Modal form for create/edit/delete notas
│   │       │   └── sections/          # 23 section components
│   │       │       ├── DatosDescriptivosSection.jsx
│   │       │       ├── HechosSection.jsx
│   │       │       ├── InformacionEconomicaSection.jsx
│   │       │       ├── ImportesSection.jsx  # Table format (years as rows)
│   │       │       ├── EtiquetasSection.jsx # New: etiquetas table
│   │       │       ├── AccionesSection.jsx
│   │       │       ├── NotasSection.jsx
│   │       │       ├── JustificacionesSection.jsx
│   │       │       ├── DescripcionesSection.jsx
│   │       │       ├── BeneficiosSection.jsx
│   │       │       ├── LtpSection.jsx
│   │       │       ├── FacturacionSection.jsx
│   │       │       ├── DatosEjecucionSection.jsx
│   │       │       ├── GruposIniciativasSection.jsx # Dual view
│   │       │       ├── WbesSection.jsx
│   │       │       ├── DependenciasSection.jsx
│   │       │       ├── EstadoEspecialSection.jsx
│   │       │       ├── TransaccionesSection.jsx # Collapsible rows with badges (uses badgeColors)
│   │       │       ├── TransaccionesJsonSection.jsx # Excel sync + expandable rows (uses badgeColors)
│   │       │       ├── DocumentosSection.jsx # Expandable rows with estado tags, summary JSON viewers
│   │       │       ├── RelatedInitiativesSection.jsx # Related initiatives table with reason badges
│   │       │       └── ActivityTimelineSection.jsx # Vertical timeline with type icons and load more
│   │       ├── hooks/
│   │       │   ├── usePortfolioDetail.js
│   │       │   ├── useTransaccionesJson.js      # Fetch txn_json by portfolio_id
│   │       │   ├── useExcelProcessStatus.js     # Poll Excel processing status
│   │       │   ├── useParametricOptions.js      # Fetch parametric dropdown values
│   │       │   ├── useRecentInitiatives.js      # Track recently viewed initiatives (localStorage, max 10)
│   │       │   ├── useRelatedInitiatives.js     # Fetch related initiatives (GET /portfolio/{pid}/related)
│   │       │   └── useActivityTimeline.js       # Fetch unified activity timeline (GET /portfolio/{pid}/timeline)
│   │       └── DetailPage.jsx     # Detail page composition
│   ├── lib/
│   │   ├── badgeColors.jsx        # Shared badge color maps + TransactionBadge component
│   │   ├── changelog.js           # Changelog entries array (version, feature, title, summary)
│   │   ├── estadoColors.js         # Estado-to-color mapping for EstadoTag component
│   │   ├── estadoOrder.js         # Shared ESTADO_ORDER constant + helpers
│   │   ├── logger.js              # Logging utility
│   │   ├── routeMeta.js           # Route metadata for breadcrumb navigation (ROUTE_META, buildBreadcrumbs)
│   │   ├── storage.js             # Shared localStorage factory (createStorage)
│   │   ├── themes.js              # Color theme definitions (6 themes, CSS variable overrides)
│   │   ├── utils.js               # Utility functions (cn, formatCurrency, formatCurrencyFull)
│   │   └── version.js             # APP_VERSION + VERSION_STRING constants
│   ├── pages/
│   │   └── RegisterPage.jsx       # Register placeholder
│   ├── providers/
│   │   ├── QueryProvider.jsx      # TanStack Query setup
│   │   └── Providers.jsx          # Combined providers
│   ├── App.jsx                    # Router and main app
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles + Tailwind
├── .env                           # Local config (gitignored)
├── .env.example                   # Config template
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
└── jsconfig.json                  # Path aliases
```

---

### 5. Core Architectural Pillars

#### A. Authentication (Clerk)

- **Session Management:** Clerk handles the login/logout lifecycle and user profile management.
- **API Security:** Every request to the Remote API is intercepted by Axios to include the `Authorization: Bearer <JWT>` token retrieved from the active Clerk session.
- **Protected Routes:** The `ProtectedRoute` component guards private routes and redirects unauthenticated users to sign-in.

**Clerk Components Used:**
| Component | Usage |
|-----------|-------|
| `<ClerkProvider>` | Root provider wrapping entire app |
| `<SignInButton>` | Trigger sign-in flow |
| `<SignUpButton>` | Trigger sign-up flow |
| `<SignIn>` | Sign-in page component |
| `<SignUp>` | Sign-up page component |
| `<UserButton>` | User avatar with dropdown menu |
| `<SignedIn>` | Conditional render for authenticated users |
| `<SignedOut>` | Conditional render for unauthenticated users |
| `useAuth()` | Hook for auth state |

#### B. Remote API Integration

- **Asynchronous State:** **TanStack Query** is used to manage the server state. It handles caching, background refetching, and optimistic UI updates for a high-performance user experience.
- **Decoupling:** No database drivers or direct SQL logic exist on the frontend; all data is fetched via REST endpoints defined in the `VITE_API_BASE_URL`.
- **Axios Client:** Centralized HTTP client with request/response interceptors.

#### C. Standardized Logging

The application uses a custom logger (`lib/logger.js`) to ensure visibility into the application's health.

- **Log Levels:** `DEBUG`, `INFO` (Default), `WARNING`, `ERROR`.
- **Console Output:** Color-coded and timestamped logs filtered by the configured log level.
- **Context-based:** Each logger instance is created with a context name for easy filtering.

#### D. Theme & Mode Support

- **Dark/Light Mode:** Detects and follows system preference by default. Native integration via `next-themes` and CSS custom properties. Persisted in `localStorage` with key `portfolio-theme`.
- **Color Themes:** 6 color themes (Clásico, Pizarra, Esmeralda, Ámbar, Rosa, Violeta) orthogonal to dark/light mode. 4 high-contrast themes with vivid primary/accent/secondary colors. Implemented via `data-color-theme` attribute on `<html>` with CSS variable overrides in `index.css`. Persisted in `localStorage` with key `portfolio-color-theme`.
- **Theme Components:** `ColorThemeProvider` (React context) + `ColorThemeSelector` (Palette icon dropdown in Navbar). Theme definitions in `src/lib/themes.js`.

---

### 6. Routes

| Route | Access | Component | Page Title | Description |
|-------|--------|-----------|------------|-------------|
| `/` | Public | `LandingPage` | Portfolio Digital | Marketing landing page |
| `/sign-in/*` | Public | `TitledSignIn` | Iniciar Sesion - Portfolio Digital | Clerk sign-in page |
| `/sign-up/*` | Public | `TitledSignUp` | Registrarse - Portfolio Digital | Clerk sign-up page |
| `/dashboard` | Private | `DashboardPage` | Dashboard - Portfolio Digital | Portfolio dashboard with KPIs |
| `/search` | Private | `SearchPage` | Busqueda - Portfolio Digital | Initiative search with filters and grid |
| `/informes/hechos` | Private | `ReportPage` | Informe Hechos - Portfolio Digital | Hechos report |
| `/informes/ltps` | Private | `LTPsReportPage` | Informe LTPs - Portfolio Digital | LTPs report |
| `/informes/acciones` | Private | `AccionesReportPage` | Informe Acciones - Portfolio Digital | Acciones report |
| `/informes/etiquetas` | Private | `EtiquetasReportPage` | Informe Etiquetas - Portfolio Digital | Etiquetas report |
| `/informes/justificaciones` | Private | `JustificacionesReportPage` | Informe Justificaciones - Portfolio Digital | Justificaciones report |
| `/informes/dependencias` | Private | `DependenciasReportPage` | Informe Dependencias - Portfolio Digital | Dependencias report |
| `/informes/descripciones` | Private | `DescripcionesReportPage` | Informe Descripciones - Portfolio Digital | Descripciones report |
| `/informes/notas` | Private | `NotasReportPage` | Informe Notas - Portfolio Digital | Notas report |
| `/informes/transacciones` | Private | `TransaccionesReportPage` | Informe Transacciones - Portfolio Digital | Transacciones report |
| `/informes/transacciones-json` | Private | `TransaccionesJsonReportPage` | Informe Transacciones JSON - Portfolio Digital | Transacciones JSON report |
| `/informes/documentos` | Private | `DocumentosReportPage` | Informe Documentos - Portfolio Digital | Documentos report (supports side drawer) |
| `/parametricas` | Private | `ParametricasPage` | Parametricas - Portfolio Digital | CRUD management for parametric values (parametros table) |
| `/parametricas/etiquetas-destacadas` | Private | `EtiquetasDestacadasPage` | Etiquetas Destacadas - Portfolio Digital | Management of highlighted tags displayed as badges |
| `/detail/:portfolio_id` | Private | `DetailPage` | Detalle {id} - Portfolio Digital | Initiative detail view |
| `/chat` | Private | `ChatPage` | Asistente IA - Portfolio Digital | AI chat assistant for portfolio queries |
| `/register` | Private | `RegisterPage` | — | Initiative registration (placeholder) |
| `*` | Public | `NotFoundPage` | — | 404 catch-all for undefined routes |

---

### 7. Dashboard

The dashboard displays key portfolio metrics using data from the `datos_relevantes` API endpoint with interactive filtering capabilities.

**Data Source:** `POST /api/v1/datos-relevantes/search`

**Filtering:** All exclusion filters are applied client-side. The API fetches all records without server-side exclusion.

#### 7.1 Interactive Filters

The dashboard includes a filter bar with multi-selects and toggle filters:

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Year | Single Select | 2025, 2026, 2027, 2028 | Current year |
| Digital Framework | Multi-Select | MANDATORY, BUSINESS IMPROVEMENT, TLC, DISTRIBUTED SERVICES, OPEX CAPITALIZATION, CYBERSECURITY | All |
| Unidad | Multi-Select | Dynamic from database | All |
| Cluster | Multi-Select | Dynamic from database | All |
| Estado | Multi-Select | Dynamic from database (workflow order) | All |
| Previstas este ano | Tri-state Select | Todos / Sí / No | Todos |
| Cerrada Econ. | Tri-state Select | Todos / Cerrado / No | No |
| Excluir Canceladas | Checkbox | On/Off | On (excluded by default) |
| Excluir EPTs | Checkbox | On/Off | On (excluded by default) |

**Tri-state Filter Details:**
- **Previstas este ano:** Todos = no filter, Sí = show only items where `en_presupuesto_del_ano = 'Sí'`, No = show only items where `en_presupuesto_del_ano = 'No'`
- **Cerrada Econ.:** Todos = no filter, Cerrado = show only closed (matches `val.startsWith('Cerrado')`), No = exclude closed (default)

**Checkbox Filter Details:**
- **Excluir Canceladas:** When ON, excludes items where `estado_de_la_iniciativa = 'Cancelado'` (masculine)
- **Excluir EPTs:** When ON, excludes items where `tipo` contains "EPT"

**Filter Persistence:** Selections are stored in `localStorage` with key `portfolio-dashboard-filters` and restored on page load. Old filter formats (with `includeCerradas`) are automatically migrated to the new schema.

**Collapsible Filter Bar:** The `FilterBar` is wrapped in a `CollapsibleFilterBar` component that provides:
- Toggle button to expand/collapse the filter controls with smooth CSS transition (max-height + opacity)
- Active filter count badge displayed when collapsed (counts filters that differ from defaults, excluding year)
- Collapsed/expanded state persisted to `localStorage` with key `portfolio-dashboard-filtersCollapsed`

#### 7.2 KPIs

| KPI | Calculation | Dynamic |
|-----|-------------|---------|
| Total Initiatives | COUNT(*) of filtered items | Yes |
| Budget [Year] | SUM(budget_YYYY) based on selected year | Yes |
| Approved Initiatives | COUNT(*) where estado_aprobacion = 'Aprobada' | Yes |
| In Execution | COUNT(*) where estado_ejecucion contains 'Ejecucion' | Yes |

**KPI Trend Indicators:** Financial KPIs (Budget, Importe Total) display an optional year-over-year trend via the `trend` prop on `KPICard`. The trend compares the current year's value against the previous year's and renders a `TrendIndicator` component: green upward arrow for positive change, red downward arrow for negative change, with the percentage difference. Trends are computed in `DashboardPage` using the filtered dataset.

#### 7.3 Charts

The dashboard displays 6 pairs of charts (12 total) in a 2-column grid. Each pair has a count chart (left) and a value/importe chart (right).

| Pair | Count Chart | Value Chart | Grouping Field |
|------|-------------|-------------|----------------|
| 1. Priority | H-Bar (count) | H-Bar (importe) | priorizacion |
| 2. Unidad | H-Bar (count) | H-Bar (importe) | unidad |
| 3. Framework | H-Bar (count) | H-Bar (importe) | digital_framework_level_1 |
| 4. Cluster | H-Bar (count) | H-Bar (importe) | cluster |
| 5. Estado | H-Bar (count) | H-Bar (importe) | estado_de_la_iniciativa |

**Chart-to-Search Navigation:** Double-clicking any bar in a chart navigates to the Search page showing exactly the matching initiatives. The `BarChartCard` component accepts `field` and `onBarDoubleClick` props for this. Double-click is detected via a 300ms timer on the `onClick` handler.

**Chart PNG Export:** Each `BarChartCard` includes an export button that captures the chart as a PNG image using `html2canvas` (dynamically imported to minimize bundle size). The exported file is named after the chart title.

#### 7.4 Initiative List Cards

Below the chart grid, two full-width cards display initiative subsets:

| Card | Content | Controls |
|------|---------|----------|
| Iniciativas mas importantes | Top initiatives by importe above threshold | Threshold selector (500k, 1M, 2M, 5M EUR) |
| Iniciativas con cambios recientes | Initiatives with recent `fecha_de_ultimo_estado` | "Ver en Informe Hechos" button |

Both cards show max 20 rows with portfolio_id links to the detail page.

#### 7.5 Sidebar Navigation

The dashboard and detail pages include sticky sidebar navigation visible only on `xl:` screens. Both use the shared `SidebarNav` component (`src/components/shared/SidebarNav.jsx`) which provides IntersectionObserver-based active section highlighting and smooth scroll-to-section on click. `DashboardNav` wraps `SidebarNav` with 9 dashboard section items. `DetailNav` wraps `SidebarNav` with 20 accordion section items and adds data badges (dot for 1:1 sections with data, count for 1:N sections with records).

| Label | Section ID | Target |
|-------|-----------|--------|
| Filtros | `filters` | Filter bar |
| KPIs | `kpis` | KPI cards row |
| Priorizacion | `chart-priority` | Priority chart pair |
| Unidad | `chart-unidad` | Unidad chart pair |
| Framework | `chart-framework` | Framework chart pair |
| Cluster | `chart-cluster` | Cluster chart pair |
| Estado | `chart-estado` | Estado chart pair |
| Top Iniciativas | `top-value` | Top value card |
| Cambios Recientes | `recent-changes` | Recent changes card |

**Implementation details:**
- Uses `IntersectionObserver` to highlight the currently visible section
- Smooth scroll on click via `scrollIntoView({ behavior: 'smooth' })`
- Sections use `scroll-mt-20` for proper scroll offset under sticky navbar
- Layout uses flex with `DashboardNav` (sticky, `top-20`) + main content (`min-w-0 flex-1`)

#### 7.6 Value Formatting

| Type | Format | Example |
|------|--------|---------|
| Importe | Thousands of EUR (k EUR) with "." separator | 1.250 k EUR |
| Numero | Units with "." as thousands separator | 1.250 |
| Year | YYYY without separators | 2025 |

#### 7.7 Chart Tooltip & Label Enhancements

**Custom Tooltip with Percentages:** `BarChartCard` uses a custom `ChartTooltip` component (replacing the default recharts tooltip `formatter`). The tooltip shows the bar label (bold), formatted value, and percentage of the chart total (e.g., "42 (15.3% del total)"). The `total` prop is computed in `DashboardPage` as the sum of all values in the chart dataset (before `maxItems` slicing). Styling uses CSS variables for dark/light mode: `hsl(var(--card))` background, `hsl(var(--card-foreground))` text, `hsl(var(--border))` border.

**Truncated Label Tooltips:** Y-axis labels (horizontal layout) and X-axis labels (vertical layout) use custom SVG tick components (`CustomYAxisTick`, `CustomXAxisTick`). The default `yAxisWidth` is 160 (prop on `BarChartCard`). When a label is truncated (exceeds `yAxisWidth / 6` characters), the full text is shown via an SVG `<title>` element (native browser tooltip on hover).

---

### 7b. Estado Workflow Order Convention

**IMPORTANT:** All `estado_de_la_iniciativa` filter dropdowns across the application MUST use the canonical workflow order defined in `@/lib/estadoOrder.js`, NOT alphabetical sorting. This applies to:

- Dashboard Estado filter and charts
- Search page Estado filter
- Report filter panels (any filter with `sortByEstado: true`)
- Any future feature that displays estado options

**Shared Module:** `frontend/src/lib/estadoOrder.js`

```javascript
import { ESTADO_ORDER, getEstadoIndex, sortEstados } from '@/lib/estadoOrder'
```

**Integration patterns:**

1. **Custom hooks** (e.g., `useFilterOptions.js`):
   ```javascript
   estados: sortEstados(extractUnique('estado_de_la_iniciativa'))
   ```

2. **ReportFilterPanel filter defs** — add `sortByEstado: true` to any multiselect filter definition:
   ```javascript
   { key: 'estado', type: 'multiselect', optionsKey: 'estado', sortByEstado: true }
   ```

3. **Dashboard grouping functions** — use `{ sortByEstado: true }` option:
   ```javascript
   groupFilteredByField(data, 'estado_de_la_iniciativa', { sortByEstado: true })
   ```

---

### 7c. Cross-Page Navigation with Location State

Pages can receive pre-filled filters via React Router's `location.state`. This is used for:

- **Dashboard → Search:** Double-clicking a chart bar passes `{ portfolioId: 'ID1,ID2,...' }` via location state
- **Dashboard → Informe Hechos:** "Ver en Informe Hechos" button passes date range and dimension filters

**Pattern:**
```javascript
// Sender (e.g., DashboardPage)
navigate('/search', { state: { filters: { portfolioId: 'ID1,ID2' } } })

// Receiver (e.g., SearchPage)
const location = useLocation()
const locationFiltersRef = useRef(location.state?.filters || null)
const pendingLocationSearchRef = useRef(false)

// Mount effect: apply filters + set pending flag
useEffect(() => {
  if (locationFiltersRef.current) {
    const stateFilters = locationFiltersRef.current
    locationFiltersRef.current = null
    setFilters(stateFilters)
    navigate('/search', { replace: true })  // Clear state
    pendingLocationSearchRef.current = true // Flag for deferred search
  }
}, [])

// Deferred search: runs after setFilters re-render so executeSearch has correct filters
useEffect(() => {
  if (pendingLocationSearchRef.current) {
    pendingLocationSearchRef.current = false
    executeSearch(true)
  }
}, [filters])
```

**Important:** The search must NOT be called in the mount effect because `executeSearch` (via `useCallback`) captures stale filter state from the first render. Instead, a `pendingLocationSearchRef` flag defers the search to a `[filters]` effect that runs after `setFilters` triggers a re-render, at which point `executeSearch` has been recreated with the correct filters in its closure.

**Currently supported by:** SearchPage, ReportPage (Hechos)

### 7c-ii. Breadcrumb Navigation

A `Breadcrumb` component renders between the Navbar and main content on all protected routes, showing the navigation path (e.g., "Dashboard > Busqueda > SPA_25_11").

**Architecture:**
- **Route metadata** (`lib/routeMeta.js`): `ROUTE_META` maps each route pattern to `{ label, parent }`. Dynamic routes (e.g., `/detail/:portfolio_id`) are supported via pattern matching.
- **`buildBreadcrumbs(pathname, locationState)`**: Walks the parent chain to produce an array of `{ label, path }` crumbs. For the Detail page, if `location.state.from` is set, it overrides the default parent with the actual referrer route.
- **`Breadcrumb.jsx`** (`components/shared/`): Uses `useLocation()` and `buildBreadcrumbs()`. Returns `null` on public routes (landing, sign-in, sign-up). Last crumb is plain text; others are `<Link>` elements.
- **Integration**: Rendered in `Layout.jsx` between `<Navbar />` and `<main>`. Not sticky — scrolls with content.

### 7c-iii. Enhanced Back Button (DetailHeader)

The back button in `DetailHeader.jsx` is context-aware:
- Reads `location.state?.from` (`{ route, label }`).
- If present, navigates to `from.route` and displays "Volver a {label}".
- Fallback: "Volver" with `navigate(-1)`.

All pages that link to detail pass `state: { from: { route, label } }` via `<Link state={...}>` or `navigate(url, { state })`.

### 7c-iv. Sticky Status Badges (DetailHeader & InitiativeDrawer - Feature 068)

The `DetailHeader` component displays four status badges below the initiative name, always visible in the sticky header. The same badges are also shown in `InitiativeDrawer` for quick-view consistency.

| Badge | Source Field | Style |
|-------|--------------|-------|
| Estado de la iniciativa | `datos_descriptivos.estado_de_la_iniciativa` | `EstadoTag` with colors from `parametros` table via `useParametroColors()` |
| SM100 status | `datos_descriptivos.estado_sm100` | See SM badge logic below |
| SM200 status | `datos_descriptivos.estado_sm200` | See SM badge logic below |
| Aprobada / No Aprobada | `datos_descriptivos.iniciativa_aprobada` | Green if "Sí", red otherwise |

**SM100/SM200 Badge Logic** (values may include prefix like "SM100 Pendiente"):
| Condition | Text | Color |
|-----------|------|-------|
| Empty/null | "Sin SM100" / "Sin SM200" | Red |
| Contains "Cancelada" or "Cancelado" | "Cancelada" | Red |
| Contains "Pendiente" | "SM100 Pendiente" / "SM200 Pendiente" | Amber |
| Any other value | "Tiene SM100" / "Tiene SM200" | Green |

**Implementation:**
- `SmBadge` helper component inline in `DetailHeader.jsx` and `InitiativeDrawer.jsx` - displays green/red/amber badge
- `getSmBadgeProps(value, label)` helper determines badge text and color using case-insensitive `includes()` matching
- Props passed from `DetailPage` to `DetailHeader`: `estadoIniciativa`, `estadoSm100`, `estadoSm200`, `iniciativaAprobada`
- `InitiativeDrawer` fetches status fields from `portfolioData.datos_descriptivos[0]`

### 7c-iv. Recent Initiatives Dropdown

Tracks the last 10 viewed initiatives in localStorage for quick access.

- **Hook** (`features/detail/hooks/useRecentInitiatives.js`): Uses `createStorage('portfolio-recent')`. Stores `[{ portfolio_id, nombre, timestamp }]`, max 10. Exposes `{ recents, addRecent, clearRecents }`.
- **Recording**: `DetailPage.jsx` calls `addRecent()` after data fetch succeeds.
- **Navbar dropdown**: "Recientes" dropdown between Busqueda and Informes. Shows up to 10 entries with `portfolio_id — nombre`. Includes "Limpiar historial" action. Also in mobile hamburger menu (capped to 5).

### 7c-v. Section URL Anchors (Detail Page)

Deep-linkable sections via URL hash (e.g., `/detail/SPA_25_11#hechos`).

- **Hash → scroll on mount**: After data loads, reads `window.location.hash`, force-expands the target section in `openSections`, and scrolls to it via `scrollIntoView()`.
- **Scroll → hash sync**: `SidebarNav` accepts `onActiveSectionChange` callback. When the IntersectionObserver detects a new active section, calls the callback. `DetailPage` handles it with `window.history.replaceState()` to update the hash without polluting browser history.
- **Sidebar click → hash**: `SidebarNav.handleClick` immediately updates hash via `replaceState` on click.
- **Guard**: Hash sync is delayed until initial scroll completes to avoid the observer overwriting the target hash during mount.

---

### 7d. Currency Hover Tooltips

All monetary fields formatted as "k\u20AC" (thousands of euros) display the full precision value on hover using the `CurrencyCell` component.

**Component:** `frontend/src/components/shared/CurrencyCell.jsx`

```jsx
<CurrencyCell value={rawValue} formattedValue="1.500 k\u20AC" />
// Hover shows tooltip: "1.500.000,00 \u20AC"
```

**Utility:** `formatCurrencyFull(value)` in `frontend/src/lib/utils.js` returns `es-ES` locale with 2 decimal places.

**Integrated in:** DataGrid (Search), GenericReportPage, SimpleTable (Detail), ImportesSection (Detail), KeyValueDisplay (Detail).

---

### 7e. Badge Color Constants

Shared badge color maps for transaction-related tables:

**File:** `frontend/src/lib/badgeColors.jsx`

| Map | Values | Usage |
|-----|--------|-------|
| `TIPO_CAMBIO_COLORS` | ALTA (green), MODIFICACION (blue), BAJA (red) | TransaccionesSection, TransaccionesReportPage |
| `ESTADO_CAMBIO_COLORS` | PENDIENTE (yellow), EJECUTADO (green), ERROR (red) | TransaccionesSection, TransaccionesReportPage |
| `TIPO_OPERACION_COLORS` | INSERT (green), UPDATE (blue), DELETE (red) | TransaccionesJsonSection, TransaccionesJsonReportPage |
| `ESTADO_DB_COLORS` | PENDIENTE (yellow), EJECUTADO (green), ERROR (red), NO_APLICA (gray) | TransaccionesJsonSection, TransaccionesJsonReportPage |

Also exports `TransactionBadge` component (rounded-full pill badge).

#### Estado Color Mapping

**File:** `frontend/src/lib/estadoColors.js`

Maps `estado_de_la_iniciativa` values to Tailwind color classes for consistent visual representation across the app. Each estado value is assigned a distinct background/text color combination.

**Component:** `frontend/src/components/shared/EstadoTag.jsx`

Renders an estado value as a colored badge pill with consistent minimum width (`min-w-[8.5rem]`) and centered text. Accepts an `estado` string prop and an optional `colorMap` prop. Color resolution order: (1) `colorMap` from parametros API, (2) hardcoded `estadoColors.js`, (3) neutral gray fallback.

**Used in:** SimpleTable (Detail page), GenericReportPage, ReportPage (Hechos), InitiativeDrawer, DataGrid (Search).

**Parametro Colors Hook:** `frontend/src/hooks/useParametroColors.js` — Fetches parametro colors from `GET /api/v1/parametros/{nombre_parametro}` and returns a `valor → color` map. Used to pass `colorMap` to `EstadoTag` for dynamically configured colors from the parametros table.

**estadoColors.js mapping** includes workflow progression colors: Recepción (Slate), SM100/SM200 (Blue), Análisis/Revisión (Amber), Aprobación (Indigo), Aprobada (Emerald), En ejecución (Cyan), Finalizado/Completado (Green), Pendiente (Red), Administrative (Gray), Planning (Violet), Cancelado (Red).

---

### 7f. Collapsible Report Table Mode

`GenericReportPage` supports an optional `collapsibleConfig` for reports that benefit from expandable row details (e.g., Transacciones):

```javascript
collapsibleConfig: {
  mainColumnIds: ['id', 'clave1', 'tabla', ...],
  badgeColumns: { tipo_cambio: TIPO_CAMBIO_COLORS, estado_cambio: ESTADO_CAMBIO_COLORS },
  detailColumnIds: ['valor_nuevo', 'valor_antes_del_cambio', ...],
}
```

### 7g. Initiative Quick-View Drawer Column

The initiative drawer button is rendered as a dedicated column placed just before the `portfolio_id` column in tables. This provides quick access to the `InitiativeDrawer` side panel without navigating away from the current page.

**Search DataGrid:** Drawer column added after select + favorite columns, before data columns. Column order: `[select, favorite, drawer, ...data columns, actions]`.

**Hechos ReportPage:** Drawer column added after the chevron expand column, before data columns.

**GenericReportPage:** Supports `showDrawer: true` config option that adds a drawer column before the first data column in both standard and collapsible table modes. Manages drawer state internally and renders `InitiativeDrawer`. Currently enabled for LTPs, Acciones, Justificaciones, Dependencias, Descripciones, and Notas reports.

When present, rows render with chevron expand/collapse, badge-colored fields, and an expanded detail panel showing longtext/JSON fields. The standard TanStack Table mode is used when `collapsibleConfig` is not set.

**Used by:** LTPsReportPage (comentarios detail), TransaccionesReportPage, TransaccionesJsonReportPage.

---

### 7g. Favorites System

Allows users to mark initiatives as favorites in the Search page. Persisted to `localStorage` via `createStorage('search-favorites')`.

**Hook:** `useFavorites()` in `frontend/src/features/search/hooks/useFavorites.js`
- State: array of `{ portfolioId, nombre }` objects
- Methods: `isFavorite()`, `toggleFavorite()`, `removeFavorite()`, `clearAll()`, `copyToClipboard()`

**UI Components:**
- Star icon column in DataGrid (filled yellow when favorite, outline when not)
- `FavoritesToolbar` — dropdown button with count badge, copy IDs, edit dialog, clear all
- `FavoritesDialog` — modal listing all favorites with individual remove and clear all

---

### 7h. Initiative Quick-View Drawer

Side panel that slides in from the right showing initiative summary and hechos list.

**Components:**
- `Sheet` / `SheetContent` — portal-based side panel UI (`frontend/src/components/ui/sheet.jsx`), supports `side="right"` (default), `"left"`, and `"bottom"` (Feature 062)
- `InitiativeDrawer` — shared content component (`frontend/src/components/shared/InitiativeDrawer.jsx`, moved from `features/search/components/`)

**Data Flow:**
- Basic fields (portfolio_id, nombre, origen, etc.) from `rowData` (already loaded in search/report results)
- Full portfolio data fetched via `GET /portfolio/{pid}` when drawer opens (hechos, notas, justificaciones, descripciones, dependencias)

**Trigger:** `PanelRightOpen` icon button in `RowActions` component (Search page) or row click action (Hechos report).

**Used by:** SearchPage, ReportPage (Hechos).

---

### 7i. Global Search

A global search component embedded in the Navbar that allows quick searching and navigation to initiatives from any page.

**Component:** `frontend/src/components/layout/GlobalSearch.jsx`

**Features:**
- Keyboard shortcut: `Ctrl+Shift+F` to focus the search input from any page
- Mobile menu "Buscar" button dispatches `CustomEvent('open-global-search')` to open search overlay (Feature 062)
- Searches by `portfolio_id` (partial match via `ilike`) and `nombre` (ilike wildcard) via `POST /api/v1/datos-relevantes/search`
- Dropdown results appear below the search input with portfolio_id, nombre, and estado. Results matched by portfolio_id display a visual "ID" badge to distinguish them from nombre matches.
- Clicking a result navigates to `/detail/{portfolio_id}`
- Debounced API calls to avoid excessive requests
- Integrated into the Navbar between the navigation links and the user menu

---

### 7j. Full-Width Layout

All pages (except Landing) use full viewport width with responsive horizontal padding:
- `w-full mx-auto px-6 sm:px-8 xl:px-12` (replaces former `container mx-auto` / `max-w-7xl`)
- Navbar and Footer use `w-full` instead of `max-w-7xl`

---

### 8. Logging Implementation

| Level | Description | Destination |
|-------|-------------|-------------|
| **DEBUG** | Development details, API calls | Browser Console (if enabled) |
| **INFO** | App milestones (Auth success, Data loaded) | Browser Console |
| **WARNING** | Non-critical issues (Validation errors) | Browser Console |
| **ERROR** | Critical failures (API errors, Auth crash) | Browser Console |

**Logger Usage:**
```javascript
import { createLogger } from '@/lib/logger'
const logger = createLogger('Dashboard')

logger.info('Dashboard loaded', { count: 814 })
logger.warning('Slow API response')
logger.error('Failed to fetch data', error)
```

---

### 9. Environment Variables (`.env`)

```bash
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Logging Configuration
# Options: DEBUG, INFO, WARNING, ERROR
VITE_LOG_LEVEL=INFO

# Application
VITE_APP_NAME=Portfolio Digital

# Dashboard Configuration
VITE_DASHBOARD_TOP_VALUE_THRESHOLD=1000000
VITE_DASHBOARD_RECENT_DAYS=7
```

---

### 10. Running the Application

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

### 11. Component Hierarchy

```
App
├── Providers (Clerk + Theme + Query)
│   └── BrowserRouter
│       └── Suspense (loading spinner)
│           └── Routes
│               ├── LandingPage (/)
│               │   └── Layout
│           │       ├── Navbar
│           │       ├── HeroSection
│           │       ├── ChangelogSection
│           │       └── Footer
│           │
│           ├── SignIn (/sign-in)
│           ├── SignUp (/sign-up)
│           │
│           └── ProtectedRoute
│               ├── DashboardPage (/dashboard)
│               │   └── Layout
│               │       ├── Navbar
│               │       ├── FilterBar
│               │       │   ├── YearSelector
│               │       │   ├── MultiSelect (x4: Framework, Unidad, Cluster, Estado)
│               │       │   ├── Tri-state Selects (x2: Previstas, Cerrada Econ.)
│               │       │   └── Checkboxes (x2: Canceladas, EPTs)
│               │       ├── [Flex Layout]
│               │       │   ├── DashboardNav (sticky sidebar, xl+ only)
│               │       │   └── [Main Content]
│               │       │       ├── KPICards (x5)
│               │       │       ├── BarCharts (x10: Priority, Unidad, Framework, Cluster, Estado)
│               │       │       ├── TopValueCard (threshold selector + table)
│               │       │       └── RecentChangesCard (table + Hechos nav button, ascending sort)
│               │
│               ├── SearchPage (/search)
│               │   └── Layout
│               │       ├── Navbar (includes GlobalSearch)
│               │       ├── FilterPanel (paste normalization on Portfolio ID)
│               │       ├── Toolbar (ColumnConfigurator, ExportDropdown, CopySelectedButton, FavoritesToolbar)
│               │       ├── DataGrid (row selection, favorites star column, sticky header)
│               │       │   └── RowActions (quick-view drawer, view detail, LTP edit)
│               │       ├── LtpModal (LTP CRUD via transacciones_json)
│               │       ├── Pagination
│               │       └── InitiativeDrawer (side sheet with summary + hechos/notas/justif/descrip/depend)
│               │
│               ├── ReportPage (/informes/hechos)
│               │   └── Layout
│               │       ├── Navbar (Informes dropdown)
│               │       ├── ReportFilterPanel
│               │       ├── Toolbar (ReportColumnSelector)
│               │       ├── TanStack Table (expandable rows with chevron toggle, EstadoTag badges)
│               │       ├── Pagination
│               │       └── InitiativeDrawer (shared, side sheet with summary + hechos/notas/justif/descrip/depend)
│               │
│               ├── GenericReportPage (/informes/ltps, /acciones, /etiquetas, /justificaciones, /dependencias, /descripciones, /notas, /transacciones, /transacciones-json, /documentos)
│               │   └── Layout
│               │       ├── Navbar (Informes dropdown with 11 items)
│               │       ├── ReportFilterPanel (data-driven from config)
│               │       ├── Toolbar (ColumnConfigurator)
│               │       ├── TanStack Table (optional collapsible rows, optional drawer column)
│               │       ├── Pagination
│               │       └── InitiativeDrawer (when showDrawer: true)
│               │
│               ├── DetailPage (/detail/:portfolio_id)
│               │   └── Layout
│               │       ├── Navbar
│               │       ├── DetailHeader
│               │       ├── [Flex Layout]
│               │       │   ├── DetailNav (sticky sidebar with data badges, xl+ only)
│               │       │   └── SectionAccordions (x23)
│               │       │       ├── DatosDescriptivosSection
│               │       │       ├── HechosSection
│               │       │       ├── InformacionEconomicaSection
│               │       │       ├── ImportesSection
│               │       │       ├── EtiquetasSection
│               │       │       ├── ... (15 more sections, incl. DocumentosSection)
│               │       │       ├── RelatedInitiativesSection
│               │       │       └── ActivityTimelineSection
│               │       ├── SectionHistoryModal (shared, triggered via onHistory prop)
│               │
│               ├── ParametricasPage (/parametricas)
│               │   └── Layout
│               │       ├── Navbar
│               │       ├── Parametros Table (list with search/filter)
│               │       └── ParametroFormDialog (create/edit)
│               │
│               ├── EtiquetasDestacadasPage (/parametricas/etiquetas-destacadas)
│               │   └── Layout
│               │       ├── Navbar (Parametricas dropdown)
│               │       ├── Etiquetas Destacadas Table (list with CRUD)
│               │       └── EtiquetaDestacadaFormDialog (create/edit)
│               │
│               ├── ChatPage (/chat)
│               │   └── Layout
│               │       ├── Navbar (Asistente IA nav link)
│               │       ├── ChatMessageList (scrollable, auto-scroll)
│               │       │   ├── ChatMessage (user/assistant bubbles)
│               │       │   │   └── MarkdownRenderer (markdown + chart images + portfolio_id links)
│               │       │   └── ToolCallBlock (collapsible tool call display)
│               │       └── ChatInput (message input with send button)
│               │
│               └── RegisterPage (/register)
│
│           └── NotFoundPage (*)         # 404 catch-all
```

**Note:** All protected route components use `React.lazy()` for on-demand loading. Each is wrapped in an `ErrorBoundary` for graceful error handling.

---

### 12. Styling

**CSS Custom Properties (Theme Variables):**
- Defined in `src/index.css`
- Light mode under `@theme` directive
- Dark mode under `.dark` class
- Color themes via `[data-color-theme="<id>"]` selectors (5 themes override primary/ring/chart-0; high-contrast themes also override accent/secondary)
- Colors follow Shadcn/ui naming convention
- Design direction: high-end fintech aesthetic (Bloomberg Terminal meets modern SaaS)

**Tailwind CSS v4:**
- Uses `@import "tailwindcss"` syntax
- Vite plugin for processing: `@tailwindcss/vite`

**Typography System:**

Three font families loaded via Google Fonts in `index.html`, defined as `@theme` CSS custom properties:

| Role | Font | Tailwind Class | Usage |
|------|------|---------------|-------|
| Headings | Space Grotesk | `font-heading` | Page titles, section headers, card titles, nav brand |
| Body / UI | Plus Jakarta Sans | `font-body` | Body text, labels, buttons, descriptions |
| Data / Numbers | JetBrains Mono | `font-data` | KPI values, financial amounts, table numeric data, page numbers |

**Color System:**

Dark mode is the primary "hero" experience with deep midnight navy backgrounds and electric blue accents. Light mode uses blue-tinted neutrals for a professional feel.

Semantic status colors: `--color-success`, `--color-warning`, `--color-info`

Chart palette: 8 dedicated colors (`--color-chart-0` through `--color-chart-7`) for data visualization.

**Key Classes:**
- `bg-background` / `text-foreground` - Base colors
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-card` / `text-card-foreground` - Card surfaces
- `bg-muted` / `text-muted-foreground` - Subdued elements and structural backgrounds

**Structural Element Backgrounds:**

Structural UI elements use `bg-muted` at graduated opacities with backdrop blur for visual hierarchy:

| Element | Class | File |
|---------|-------|------|
| Navbar | `bg-background/80 backdrop-blur-xl` | `Navbar.jsx` |
| Detail sticky header | `bg-muted/50 backdrop-blur-sm` | `DetailHeader.jsx` |
| Page headers | `bg-muted/40` | `DashboardPage`, `SearchPage`, `ReportPage`, `GenericReportPage` |
| Dashboard filter bar | `bg-muted/40` | `FilterBar.jsx` |
| Filter panel bodies | `bg-muted/30` | `FilterPanel.jsx`, `ReportFilterPanel.jsx` |
| Sidebar nav (Dashboard, Detail) | `bg-muted/20` | `SidebarNav.jsx` |

**Navbar Active Item:** Uses `text-primary font-semibold border-b-2 border-b-primary` bottom border accent for active state.

**Micro-Interactions & Animations:**

| Animation | Class | Usage |
|-----------|-------|-------|
| Page load stagger | `animate-fade-in-up` | Page headers, content sections |
| Loading skeleton shimmer | `animate-shimmer` | Skeleton placeholders |
| Button press feedback | `active:scale-[0.98]` | All buttons |
| Card hover elevation | `hover:shadow-md hover:border-border` | Cards |
| Primary button glow | `hover:shadow-[0_0_15px_-3px_...]` | Primary buttons |
| Dialog backdrop | `backdrop-blur-sm` | Modal overlays |

All animations respect `prefers-reduced-motion` media query.

**Accessibility — Focus Rings (Feature 062):**
- All form inputs (input, select, multi-select, datepicker, currency-input) use `ring-2 ring-ring ring-offset-2 ring-offset-background` on focus-visible, replacing the previous `ring-primary/30` pattern.
- SidebarNav items and EntityFormModal fields follow the same pattern.
- `index.css` includes a `@media (forced-colors: active)` rule for Windows High Contrast mode: `*:focus-visible { outline: 2px solid CanvasText; outline-offset: 2px; }`.

**Page-Specific Loading Skeletons (Feature 062):**
- Each major route has a dedicated skeleton component in `src/components/shared/skeletons/` used as `Suspense` fallback in `App.jsx`: `DashboardSkeleton`, `SearchSkeleton`, `DetailSkeleton`, `ReportSkeleton`. All wrap in `<Layout>` for consistent chrome during loading.

---

### 13. Search Page

The search page allows users to find and explore initiatives with flexible filtering and a configurable data grid.

**Data Source:** `POST /api/v1/datos-relevantes/search`

#### 13.1 Filter Criteria

| Filter | Type | Database Field | Behavior |
|--------|------|----------------|----------|
| Portfolio ID | Text/Combobox | `portfolio_id` | Single, comma-separated list, or dropdown |
| Nombre | Text Input | `nombre` | Wildcard search (`ilike`) |
| Digital Framework | Multi-Select | `digital_framework_level_1` | 7 options |
| Unidad | Multi-Select | `unidad` | Dynamic from database |
| Estado | Multi-Select | `estado_de_la_iniciativa` | Dynamic from database |
| Cluster | Multi-Select | `cluster` | Dynamic from database |
| Tipo | Multi-Select | `tipo` | Dynamic from database |
| Etiquetas | Multi-Select | `etiquetas` (joined) | Dynamic from `/etiquetas-options` endpoint |
| Cerrada Econ. | Multi-Select | `iniciativa_cerrada_economicamente` | Dynamic from API (default: No - excludes closed) |
| Activo Ejercicio Actual | Multi-Select | `activo_ejercicio_actual` | Si/No |

**Keyboard Shortcuts:**
- **Enter:** Apply filters (from any input field)
- **Ctrl+Shift+X:** Clear all filters
- **Auto-focus:** Portfolio ID field receives focus on page load

#### 13.2 Data Grid Features

- **Row Selection:** Checkbox column (first column) with select-all in header; selected rows highlighted with `bg-primary/5`; selection persists across page changes but clears on new search or sort change; uses TanStack Table's `enableRowSelection` with `getRowId: (row) => row.portfolio_id`; selection count displayed in toolbar when > 0
- **Copy Selected IDs:** `CopySelectedButton` appears in toolbar when ≥1 row selected; copies comma-separated portfolio_ids to clipboard via `navigator.clipboard.writeText()`; shows toast via sonner
- **Pagination:** 25, 50, 100, 200 rows per page (default: 50, backend max: 1000)
- **Column Selection:** Users choose which columns to display from 60+ available via ColumnConfigurator dialog (includes `activo_ejercicio_actual`)
- **Column Ordering:** Drag-and-drop reordering via @dnd-kit in the ColumnConfigurator dialog; order persisted to localStorage
- **Sorting:** Click column header to sort (server-side)
- **Actions:** View detail, future actions (Edit, Add Hecho, etc.)
- **Portfolio ID Link:** The portfolio_id column is a clickable link to the detail page
- **Longtext Support:** Columns like etiquetas use word-wrap with min/max width constraints

#### 13.2.1 Portfolio ID Paste Normalization & Validation

The Portfolio ID input in `FilterPanel` intercepts `onPaste` events to normalize pasted text. Separators (newlines, tabs, semicolons, pipes) are replaced with commas, values are trimmed, empty entries removed, and duplicates eliminated. Pasted IDs are merged with any existing IDs in the field. After normalization, pasted IDs are validated against the expected format (must start with `SPA_` or `INDEDSPAIN-`, regex: `/^(SPA_[\w][\w-]*|INDEDSPAIN-\d+)$/i`). Invalid IDs trigger an amber warning below the input listing the mismatched IDs; the warning is non-blocking (search still proceeds) and dismissible. Warning clears on manual typing, filter clear, or dismissal.

**Default Columns:** portfolio_id, nombre, unidad, digital_framework_level_1, estado_de_la_iniciativa, fecha_de_ultimo_estado, cluster, tipo, importe_2026

#### 13.2.2 LTP Quick Edit Modal

The Search page includes a modal for editing LTP records directly from search results. Available via a row action button on initiatives that have LTP data.

**Component:** `frontend/src/features/search/components/LtpModal.jsx`

**Features:**
- CRUD operations on LTP records via `transacciones_json` system (create, edit, delete)
- Lists existing LTP records for the selected initiative
- Inline editing of LTP fields (tarea, siguiente_accion, comentarios, estado, responsable)
- Follows the same transaction payload pattern as EntityFormModal (INSERT/UPDATE/DELETE via `POST /transacciones-json/` + `POST /transacciones-json/process`)

#### 13.3 Export Formats

| Format | Extension | Library |
|--------|-----------|---------|
| Tab-delimited | .tsv | Native |
| CSV | .csv | Native |
| JSON | .json | Native |
| Excel | .xlsx | xlsx |

Exports respect the user's current column selection and order from the ColumnConfigurator, and the current sort order (order_by/order_dir passed to the export API calls).

#### 13.4 Filter Chips

Active filters are displayed as removable chip/badge elements between the FilterPanel and the toolbar. Each chip shows `<FilterLabel>: <Value>` with an X button to remove that specific filter and re-trigger the search. Multi-select filters with > 2 values show "N seleccionados". A "Limpiar todo" link appears when multiple chips are active. Component: `FilterChips.jsx`.

#### 13.4.1 Cancelled Initiatives Filter (Feature 068)

The FilterPanel includes an "Incluir Iniciativas Canceladas" checkbox below the main filter grid. By default, this is **unchecked**, which adds a filter `estado_de_la_iniciativa not_in ['Cancelada', 'Cancelado']` to exclude cancelled initiatives (both masculine and feminine variants exist in the database). When checked, cancelled initiatives are included. The checkbox state is persisted to localStorage via `includeCancelled` in the filters object and resets to `false` (unchecked) when "Limpiar Filtros" is clicked. The filter chip "Excl. Canceladas: Sí" appears when `includeCancelled === false` (exclusion is active); clicking the chip removes it and includes cancelled initiatives.

#### 13.5 Saved Searches

Users can save, load, and delete named filter configurations. Up to 20 saved searches stored in localStorage via `portfolio-search-saved-searches` key. UI integrated into the FilterPanel header with a "Guardar" button (opens inline name input) and a "Busquedas" dropdown listing saved searches with name, date, and delete button. Loading a saved search replaces the current filters and triggers a search.

**Components:** `SavedSearches.jsx`, `useSavedSearches.js` hook.

#### 13.6 View Mode Toggle (Feature 062)

SearchPage supports two view modes: `table` (default on desktop) and `cards` (default on mobile < 768px). Toggle buttons in toolbar (`LayoutList`/`LayoutGrid` icons). Persisted to localStorage via `portfolio-search` / `view-mode` key.

**Card View:** `CardGrid.jsx` renders `InitiativeCard.jsx` in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Each card shows portfolio_id (link), nombre (2-line clamp), EstadoTag, CurrencyCell importe, unidad, cluster, and a quick-view button. ColumnConfigurator and row grouping are hidden in card mode.

#### 13.7 Column-Level Filtering (Feature 062)

Client-side column filters applied on top of server-filtered results. Each column header in DataGrid renders a `ColumnFilterButton` (funnel icon) that opens a popover with filter type determined by column type:

| Column Type | Filter UI | Matching |
|-------------|-----------|----------|
| text | Text input | Case-insensitive contains |
| estado | Checkbox list of unique values | Exact match (multi-select) |
| currency | Min/Max numeric inputs | Range (inclusive) |

**Components:** `ColumnFilter.jsx` exports `ColumnFilterButton` and `applyColumnFilters()`. Active filter indicator: filled funnel icon in primary color. "Limpiar filtros columna" button in toolbar when any column filter is active.

#### 13.8 Row Grouping (Feature 062)

Client-side row grouping via `GroupBySelector.jsx` dropdown in toolbar. Options: Sin agrupar, Estado, Unidad, Cluster, Digital Framework, Tipo. When active, DataGrid partitions `filteredData` into a `Map<string, row[]>` and renders `GroupSection` header rows (colored background, group value, row count) that are collapsible. Only available in table view.

#### 13.9 Persistence

| Key | Data | Default |
|-----|------|---------|
| `portfolio-search-filters` | Filter values | `{ cerradaEconomicamente: ['No'], activoEjercicioActual: [], includeCancelled: false }` |
| `portfolio-search-columns` | Selected columns (order preserved) | Default 9 columns |
| `portfolio-search-page-size` | Page size | 50 |
| `portfolio-search-saved-searches` | Array of `{ id, name, filters, createdAt }` | `[]` |
| `portfolio-search-view-mode` | `'table'` or `'cards'` | Auto-detect by screen width |

---

### 14. Detail Page

The detail page displays comprehensive information about a single initiative in a controlled accordion layout with "Expandir Todo" / "Contraer Todo" buttons. A sticky sidebar navigation (xl+ screens) shows data badges and highlights the active section. On mobile/tablet (< xl), a floating action button opens a bottom sheet with section navigation (Feature 062). Sections without data are hidden from the accordion list and consolidated into a "Secciones sin datos" summary panel at the bottom. Includes Related Initiatives and Activity Timeline sections (Feature 061), plus section-level edit history modals.

**Mobile Detail Navigation (Feature 062):** `MobileDetailNav.jsx` renders a FAB (`xl:hidden`) in the bottom-right corner. Tapping it opens a `Sheet` (`side="bottom"`) with the section list (same items as sidebar), search input, active section highlighting, and badges. Selecting a section closes the sheet and scrolls to the target accordion section.

**Data Source:** `GET /api/v1/portfolio/{portfolio_id}`

**Route:** `/detail/:portfolio_id`

#### 14.0 Accordion State Management

All 23 section accordions are controlled from `DetailPage` via a centralized `SECTION_DEFS` metadata array and a `Set<string>` of open section IDs:

- **SECTION_DEFS**: Static array defining each section's `id`, `title`, `dataKey`, `type` (single/multi), `navLabel`, `crudAction`, and `forceClosedByDefault` flag.
- **sectionHasData**: Computed `useMemo` map (`{sectionId: boolean}`) derived from API response.
- **openSections / effectiveOpenSections**: Controlled accordion state. Initialized from default-open logic (sections with data open, unless `forceClosedByDefault`). User clicks toggle individual sections via `toggleSection(id)`.
- **expandAll / collapseAll**: Opens all sections with data, or closes all.
- **EmptySectionsPanel**: Renders at the bottom, listing sections without data. CRUD-enabled sections show inline "Añadir" buttons that open the corresponding create modal.
- **DetailNav**: Receives `sectionHasData` map and filters sidebar items to only show sections with data, plus a "Sin datos" link to the summary panel.

The `Accordion` UI component (`components/ui/accordion.jsx`) supports both uncontrolled (`defaultValue`) and controlled (`value` + `onValueChange`) modes. `SectionAccordion` passes `isOpen` and `onToggle` props through to the controlled Accordion.

#### 14.1 Sections

**Default State Rule:** Sections with data are expanded by default (unless `forceClosedByDefault`). Sections without data are hidden and listed in the EmptySectionsPanel.

| Section | Source Table | Display Type | Notes |
|---------|--------------|--------------|-------|
| Datos Descriptivos | datos_descriptivos | Key-Value Grid (3 columns) | Always expanded. Also displays `activo_ejercicio_actual` from datos_relevantes. |
| Hechos | hechos | Sortable Table (by id asc) | Longtext fields for notas |
| Información Económica | informacion_economica | Key-Value Grid | |
| Importes | datos_relevantes | **Table** (years as rows) | Budget, SM200, Aprobado, CITETIC, Facturación, Importe, CC RE. Also shows: Cerrada Económicamente ("Cerrado en año YYYY"/"No") |
| Etiquetas | etiquetas | Table | Longtext for origen_registro, comentarios |
| Acciones | acciones | Table | Longtext fields |
| Notas | notas | Card List | CRUD via modal (create/edit/delete) |
| Justificaciones | justificaciones | Table | Longtext fields |
| Descripciones | descripciones | Card List | |
| Beneficios | beneficios | Table | Longtext fields |
| LTP | ltp | Table | Longtext fields |
| WBEs | wbes | Table | Columns: anio, wbe_pyb, descripcion_pyb, wbe_can, descripcion_can |
| Dependencias | dependencias | Table | Columns: portfolio_id, descripcion_dependencia, fecha_dependencia, comentarios |
| Facturación | facturacion | Table | |
| Datos Ejecución | datos_ejecucion | Key-Value/Table | |
| Grupos Iniciativas | grupos_iniciativas | **Dual View** | "As Component Of" (parent) + "Components" (children) with links |
| Estado Especial | estado_especial | Key-Value | |
| Impacto AATT | impacto_aatt | Key-Value | AATT impact flags & comments |
| Documentos | documentos | Expandable Table | Documents table with expandable rows (chevron icon). Main row shows portfolio_id (link), nombre_fichero (SharePoint link), tipo_documento, estado_proceso_documento (EstadoTag), fecha_documento. Expanded detail shows ruta_documento, fecha_creacion, fecha_actualizacion, tokens_input, tokens_output, and resumen_documento viewers (JSON + formatted). Estado tags use colors from estadoColors.js (Error=red, Ignorado=gray, etc.). |
| Transacciones | transacciones | Table | Uses `clave1` field, not portfolio_id |
| Transacciones JSON | transacciones_json | Expandable Table | Fetched separately via `useTransaccionesJson`, Excel sync button. Expanded detail shows: Clave Primaria (DB), Clave Primaria Excel, Cambios, Valores Previos Excel, Fecha Ejecucion DB, Fecha Ejecucion Excel, Error |
| Related Initiatives | (cross-table) | Table with badges | Fetched via `useRelatedInitiatives` (`GET /portfolio/{pid}/related`). Shows related initiatives with reason badges (cluster, unidad, etiqueta). Max 20 results. `forceClosedByDefault: true` |
| Activity Timeline | (multi-table) | Vertical timeline | Fetched via `useActivityTimeline` (`GET /portfolio/{pid}/timeline`). Merges hechos, notas, transacciones_json. Type icons per entry, "load more" pagination. `forceClosedByDefault: true` |

#### 14.2 Section Styling

Section accordion titles use enhanced visibility styling:
- **Left border accent**: `border-l-4 border-l-primary/50` on each accordion item
- **Background**: `bg-muted/30` on accordion trigger
- **Font**: `text-base font-semibold` for section titles

#### 14.3 Header Actions

| Action | Status | Description |
|--------|--------|-------------|
| Edit | Disabled | Edit initiative |
| Add Hecho | Disabled | Register new hecho |
| Add Nota | **Active** | Create/edit/delete notas via transacciones_json |

#### 14.4 Entity CRUD Modal Pattern (Template for All CUD Operations)

The detail page supports inline create/edit/delete of entity records via the **transacciones_json** system. The Notas implementation serves as the canonical template for replicating CUD operations on other entities.

**Architecture:**

```
SectionAccordion (headerAction = Plus button)
├── EntitySection (data cards with Pencil edit icons)
│   └── EntityFormModal (mode="edit", per-card)
└── EntityFormModal (mode="create", from header Plus button)
```

**Components involved:**

| Component | Role |
|-----------|------|
| `SectionAccordion` | Renders `headerAction` prop in the accordion trigger (with `stopPropagation`). When section is empty but `headerAction` is set, renders children instead of the generic "Sin datos disponibles" message. |
| `NotaFormModal` | Controlled modal (`open`/`onOpenChange`) with create, edit, and delete modes. Uses `Dialog` portal component. |
| `NotasSection` | Manages edit modal state internally (one per card). Receives `portfolioId` and `onRefetch` props. |
| `DetailPage` | Manages add modal state (triggered from `headerAction`). Passes `refetch` from `usePortfolioDetail` as `onRefetch`. |
| `ConfirmDialog` | Reusable confirmation dialog for destructive actions (delete). Located at `@/components/ui/confirm-dialog`. |

**State ownership:**

- **Add action** — `DetailPage` owns the modal open state (since the Plus button lives in the `SectionAccordion` header).
- **Edit action** — `NotasSection` owns the modal open state (since Pencil icons live inside each card).
- Both use the same `NotaFormModal` component.

**API flow (create/edit/delete):**

1. Build transaction payload: `{ entidad, tipo_operacion, clave_primaria, cambios, usuario, mensaje_commit, estado_excel }`
2. `POST /api/v1/transacciones-json/` — creates a PENDIENTE transaction record
3. `POST /api/v1/transacciones-json/process` — processes all pending transactions (applies DB changes)
4. Call `refetch()` on the portfolio detail query to reload the UI
5. Show toast notification (success or error) via Sonner

**Transaction payload per operation:**

| Operation | `tipo_operacion` | `clave_primaria` | `cambios` |
|-----------|------------------|------------------|-----------|
| Create | `INSERT` | `{"portfolio_id": "..."}` | All fields including `portfolio_id` |
| Update | `UPDATE` | `{"id": <nota_id>}` | Only changed fields |
| Delete | `DELETE` | `{"id": <nota_id>}` | `null` |

**Modal form fields (Notas):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fecha` | date input | Yes | Defaults to today on create |
| `registrado_por` | disabled input | N/A | Auto-set from Clerk `useUser()`, read-only |
| `nota` | textarea (4 rows) | Yes | Note content |
| `mensaje_commit` | text input | Yes | Separated by `<hr>`, describes the change |

**Key patterns used:**

1. **User identity:** `useUser()` from `@clerk/clerk-react` provides `user.fullName` for the `registrado_por` field (read-only) and `usuario` in the transaction payload
2. **Toast notifications:** `toast.success()` / `toast.error()` from `sonner` after each CUD operation
3. **Delete confirmation:** `ConfirmDialog` component (not browser `confirm()`) with destructive variant. Commit message must be validated before opening the confirmation dialog.
4. **Auto timestamps:** Backend `transaction_processor.py` auto-sets `fecha_actualizacion` on INSERT/UPDATE for entities that have the column
5. **Required fields:** HTML5 `required` attribute on mandatory form fields
6. **Form state reset on open:** Since the create modal stays mounted (always rendered in `DetailPage`), `useState` initializers only run once. A `useEffect` on `open` must reset all fields to their defaults (empty for create, entity values for edit) every time the dialog opens. Without this, stale values from the previous session leak into the next one.
7. **Focus management:** Auto-focus the primary content field (e.g., Nota textarea) when the dialog opens using a `ref` + `setTimeout(..., 50)` to allow dialog animation to complete.
8. **Tab order:** The submit button ("Guardar Cambios" / "Crear") must be the next Tab stop after the last form input (commit message). Set `tabIndex={-1}` on secondary buttons (Eliminar, Cancelar) so they are mouse-clickable but skipped in Tab navigation.

**Extending to other entities:**

To add CRUD for another entity (e.g., hechos, acciones):
1. Create `<Entity>FormModal.jsx` following the `NotaFormModal` pattern:
   - Use `useUser()` for `registrado_por` / `usuario` (read-only)
   - Add `required` attribute to mandatory fields
   - Use `toast.success()` / `toast.error()` for feedback
   - Use `ConfirmDialog` for delete confirmation (validate commit message first)
   - Build transaction payload with `entidad` set to the target table name
   - **Reset all form fields in a `useEffect` on `open`** — do not rely on `useState` initializers
   - **Auto-focus the primary content field** when dialog opens (ref + setTimeout)
   - **Set `tabIndex={-1}`** on Eliminar and Cancelar buttons so Tab goes: fields → commit → submit
2. Add `portfolioId` and `onRefetch` props to the entity's section component
3. Add `headerAction` (Plus button) to the entity's `SectionAccordion` in `DetailPage`
4. Wire modal state: add-modal in `DetailPage`, edit-modal in the section component
5. Backend handles `fecha_actualizacion` automatically via `transaction_processor.py`

#### 14.5 Entity CUD Configuration System (Feature 030)

**Central Configuration Files** (`frontend/src/features/detail/config/`):

| File | Purpose |
|------|---------|
| `entityDefaults.js` | Default values per entity for create mode. Static values as strings, dynamic values as functions (e.g., current date). Use `resolveDefaults(entityName)` to get resolved defaults. |
| `entityFieldConfig.js` | Field type configuration: `LONG_TEXT_FIELDS` (textarea vs input), `MONETARY_FIELDS` (currency mask), `SELECT_OPTIONS` (dropdown choices), `AUTO_DATE_FIELDS` (auto-set on save). |

**Generic EntityFormModal** (`frontend/src/features/detail/components/EntityFormModal.jsx`):

Data-driven modal component that renders forms for any entity based on a field configuration array. Props:
- `entityName` — table name for transaction (e.g., 'hechos')
- `entityLabel` — display name (e.g., 'Hecho')
- `fields` — array of `{ key, label, type, required, readOnly, readOnlyOnEdit }`
- `mode` — 'create' | 'edit'

Supported field types: `text` (default), `longtext` (textarea), `date` (date picker), `datetime` (datetime-local picker), `number`, `currency` (CurrencyInput with euro mask), `select` (from SELECT_OPTIONS config).

**CurrencyInput Component** (`frontend/src/components/ui/currency-input.jsx`):

Masked input for monetary fields. Displays Spanish locale format (1.234,56 €), stores raw float internally. Right-aligned with € suffix.

**CUD-Enabled Entities** (Feature 030):

| Entity | Relationship | Display Pattern | CUD Status |
|--------|-------------|-----------------|------------|
| datos_descriptivos | 1:1 | KeyValueDisplay | Create/Edit/Delete |
| informacion_economica | 1:1 | KeyValueDisplay | Create/Edit/Delete |
| estado_especial | 1:1 | KeyValueDisplay | Create/Edit/Delete |
| impacto_aatt | 1:1 | KeyValueDisplay | Create/Edit/Delete |
| hechos | 1:N | SimpleTable | Create/Edit/Delete |
| etiquetas | 1:N | SimpleTable | Create/Edit/Delete |
| justificaciones | 1:N | SimpleTable | Create/Edit/Delete |
| descripciones | 1:N | Card layout | Create/Edit/Delete |
| acciones | 1:N | SimpleTable | Create/Edit/Delete |
| ltp | 1:N | SimpleTable | Create/Edit/Delete |
| wbes | 1:N | SimpleTable | Create/Edit/Delete |
| dependencias | 1:N | SimpleTable | Create/Edit/Delete |
| grupos_iniciativas | 1:N | Dual display | Create/Edit/Delete |
| notas | 1:N | Card layout | Create/Edit/Delete (Feature 029) |

**SimpleTable Edit Support**: The `SimpleTable` component accepts an optional `onRowEdit` callback. When provided, each row displays a Pencil edit button in the first column.

**SimpleTable Sortable Columns** (Feature 057): All column headers are clickable buttons that cycle through ascending, descending, and unsorted states. Sort icons (ArrowUp/ArrowDown/ArrowUpDown) match the Search DataGrid pattern. Sort logic is type-aware: numeric comparison for `currency`/`number`, ISO string comparison for `date`, and `localeCompare('es')` for text. Null/empty values sort last regardless of direction.

**Per-Section CSV Export** (Feature 057): `SectionAccordion` accepts an optional `onExport` callback. When provided, a Download icon button appears in the accordion header. 10 SimpleTable sections (Hechos, Etiquetas, Acciones, LTP, Justificaciones, Beneficios, Facturacion, DatosEjecucion, WBEs, Dependencias) have export wired in DetailPage. The `exportSectionCSV` utility (`detail/utils/exportSection.js`) generates semicolon-separated CSV with UTF-8 BOM for Excel compatibility.

**1:1 Entity Pattern**: For single-record entities, the SectionAccordion headerAction shows a Pencil (edit) if data exists, or Plus (create) if no data exists. The modal state is managed in DetailPage with `{ open, mode, record }` objects.

**1:N Entity Pattern**: For multi-record entities, the SectionAccordion headerAction always shows Plus (create). Each row has a Pencil button managed by the section component's internal state. Create modals are rendered in DetailPage; edit modals are rendered inside the section component.

#### 14.5b Section Edit History (Feature 061)

**SectionHistoryModal** (`features/detail/components/SectionHistoryModal.jsx`): A shared modal component that displays `transacciones_json` records filtered by a specific entity type (e.g., "notas", "hechos"). Shows a chronological list of transactions with expandable JSON diff views for each record. Used across all CRUD-enabled sections to provide audit trail visibility.

**`onHistory` prop on SectionAccordion**: `SectionAccordion` accepts an optional `onHistory` callback. When provided, a Clock icon button (from lucide-react) appears in the accordion header alongside any existing `headerAction` and `onExport` buttons. Clicking the Clock icon triggers the `onHistory` callback, which opens the `SectionHistoryModal` for that section's entity type.

#### 14.5c Related Initiatives Section (Feature 061)

**RelatedInitiativesSection** (`features/detail/components/sections/RelatedInitiativesSection.jsx`): Displays a table of initiatives related to the current one by shared cluster, unidad, or etiquetas. Each row shows the related initiative's `portfolio_id` (as a link to its detail page), `nombre`, and reason badges indicating why it is related (type: cluster, unidad, or etiqueta with the matching value). Maximum 20 results.

**useRelatedInitiatives Hook** (`features/detail/hooks/useRelatedInitiatives.js`): Fetches data from `GET /api/v1/portfolio/{portfolio_id}/related`. Returns `{ data, isLoading, error }`.

**SECTION_DEFS entry**: `id: 'related-initiatives'`, `forceClosedByDefault: true`.

#### 14.5d Activity Timeline Section (Feature 061)

**ActivityTimelineSection** (`features/detail/components/sections/ActivityTimelineSection.jsx`): Renders a vertical timeline merging hechos, notas, and transacciones_json records into a single chronological view. Each entry displays a type-specific icon, date, summary, detail text, user, and a colored badge. Supports "load more" pagination to incrementally fetch older entries.

**useActivityTimeline Hook** (`features/detail/hooks/useActivityTimeline.js`): Fetches data from `GET /api/v1/portfolio/{portfolio_id}/timeline` with `limit` and `offset` query parameters. Returns `{ data, isLoading, error, fetchMore, hasMore }`.

**SECTION_DEFS entry**: `id: 'activity-timeline'`, `forceClosedByDefault: true`.

#### 14.6 Parametric Field Pattern (Feature 037)

Fields in entity forms can use dynamic dropdown values from the `parametros` API instead of hardcoded options. This allows dropdown choices to be managed centrally in the database and updated via the migration CLI without code changes.

**Field Configuration:**

Add `parametric: 'parameter_name'` to any field definition in the relevant FIELDS array (in `entityFieldConfig.js` or section-specific config). When `EntityFormModal` encounters a field with the `parametric` property, it renders a `<select>` dropdown populated from `GET /api/v1/parametros/{parameter_name}` instead of using hardcoded `SELECT_OPTIONS`.

```javascript
{ key: 'estado_de_la_iniciativa', label: 'Estado', type: 'select', parametric: 'estado_de_la_iniciativa' }
```

**useParametricOptions Hook** (`frontend/src/features/detail/hooks/useParametricOptions.js`):

Accepts a fields array, extracts all fields with a `parametric` property, and fetches their allowed values in parallel using `useQueries` from TanStack Query.

```javascript
const { optionsMap, isLoading } = useParametricOptions(fields)
// optionsMap = { 'parameter_name': ['Value1', 'Value2', ...], ... }
```

- Uses `useQueries` for parallel fetching of multiple parameter lists
- 10-minute stale time to minimize API calls
- Returns `optionsMap` (keyed by parameter name) and `isLoading` flag
- `EntityFormModal` merges `optionsMap` into select field options, falling back to `SELECT_OPTIONS` for non-parametric fields

**How to add a new parametric field:**

1. Add `parametric: 'parameter_name'` to the field definition in the relevant FIELDS array
2. Ensure the parameter is populated during migration by adding an entry to `PARAMETRIC_SOURCES` in `management/src/migrate/engine.py`
3. Run the migration CLI to populate the `parametros` table with values from the source data

---

### 14b. Parametricas Page

**Route:** `/parametricas`

**Data Source:** `GET /api/v1/parametros`, `POST /api/v1/parametros`, `PUT /api/v1/parametros/{id}`, `DELETE /api/v1/parametros/{id}`

The Parametricas page provides full CRUD management for the `parametros` table. This table stores allowed values for parametric dropdown fields used in entity forms (see section 14.6 Parametric Field Pattern).

**Components:**

| Component | File | Description |
|-----------|------|-------------|
| ParametricasPage | `features/parametricas/ParametricasPage.jsx` | Main page with table listing all parametros, search/filter, and action buttons |
| ParametroFormDialog | `features/parametricas/ParametroFormDialog.jsx` | Dialog for creating and editing parametro records |

**Features:**
- Lists all parametro records with columns for parameter name, value, color (circle preview), and metadata
- Create new parametro via dialog form (includes color dropdown with 17 palette colors)
- Edit existing parametro via dialog form (includes color dropdown)
- Delete parametro with confirmation
- Direct API calls (not via transacciones_json system, since parametros is a supporting/configuration table)
- The `estado_de_la_iniciativa` parameter group is pre-seeded with 21 color values for workflow states

**Navigation:** Accessible via the "Parametricas" dropdown menu in the Navbar's trailing nav items section.

### 14c. Etiquetas Destacadas Page

**Route:** `/parametricas/etiquetas-destacadas`

**Data Source:** `GET /api/v1/etiquetas-destacadas`, `POST /api/v1/etiquetas-destacadas`, `PUT /api/v1/etiquetas-destacadas/{id}`, `DELETE /api/v1/etiquetas-destacadas/{id}`

The Etiquetas Destacadas page provides full CRUD management for highlighted tags. Tags configured here are displayed as colored badges in the `DetailHeader` and `InitiativeDrawer` components for initiatives that have matching etiquetas.

**Components:**

| Component | File | Description |
|-----------|------|-------------|
| EtiquetasDestacadasPage | `features/etiquetas-destacadas/EtiquetasDestacadasPage.jsx` | Main page with table listing all etiquetas destacadas, action buttons |
| EtiquetaDestacadaFormDialog | `features/etiquetas-destacadas/EtiquetaDestacadaFormDialog.jsx` | Dialog for creating and editing etiqueta destacada records |

**Hook:** `useEtiquetasDestacadas()` in `features/etiquetas-destacadas/hooks/useEtiquetasDestacadas.js`
- Provides `list`, `create`, `update`, `delete` operations via TanStack Query
- Uses `GET /api/v1/etiquetas-destacadas/` for listing
- Mutations invalidate the query cache on success

**Badge Display:**
- `DetailHeader` and `InitiativeDrawer` fetch the etiquetas destacadas list and compare against the initiative's etiquetas
- Matching etiquetas are rendered as colored badges using the configured color from the `etiquetas_destacadas` table

**Navigation:** Accessible via the "Parametricas" dropdown menu in the Navbar (alongside the Parametricas page link).

### 14d. Parametricas Navbar Dropdown

The Navbar's trailing items section includes a "Parametricas" dropdown (Settings/gear icon) that groups parametric management pages:

| Label | Route | Description |
|-------|-------|-------------|
| Parametricas | `/parametricas` | Parametric values CRUD |
| Etiquetas Destacadas | `/parametricas/etiquetas-destacadas` | Highlighted tags management |

This replaces the previous single "Parametricas" nav link with a dropdown menu.

### 14e. Trabajos Navbar Dropdown

The Navbar includes a "Trabajos" dropdown menu (Briefcase icon) that allows launching management CLI jobs directly from the web UI. Each menu item triggers a backend endpoint and opens a `ConsoleDialog` that streams real-time output.

| Label | Backend Endpoint | CLI Command | Icon |
|-------|-----------------|-------------|------|
| Proceso completo | `POST /trabajos/proceso-completo` | `complete_process` | Play |
| Escanear documentos | `POST /trabajos/escanear-documentos` | `scan_documents` | FolderSearch |
| Sumarizar documentos | `POST /trabajos/sumarizar-documentos` | `summarize_documentos` | FileText |

**Implementation:**
- `trabajosItems` array in Navbar defines the dropdown items with `command` property (not `href`)
- Clicking an item sets `activeJob` state and opens the `ConsoleDialog`
- `ConsoleDialog` receives the endpoint path (`/trabajos/{command}`) and manages the SSE connection lifecycle
- Only one job can run at a time (enforced by backend singleton guard, HTTP 409 if busy)

---

### 15. Reports (Informes)

The reports section groups report pages under the `/informes` URL prefix. Navigation uses an **Informes** dropdown menu in the Navbar (between Busqueda and Registro).

**Navbar Trailing Items:** The Navbar includes an "Asistente IA" nav link (Bot icon, route `/chat`) for the AI chat assistant, a "Trabajos" dropdown (Briefcase icon) for launching management CLI jobs, and a "Parametricas" dropdown (Settings/gear icon) in the `trailingNavItems` section (right side, before user menu). Parametricas contains links to `/parametricas` and `/parametricas/etiquetas-destacadas`.

There are 11 report pages:

| Report | Route | Icon | Description |
|--------|-------|------|-------------|
| Hechos | `/informes/hechos` | ClipboardList | Hechos with date range and portfolio filters |
| LTPs | `/informes/ltps` | ListTodo | Pending tasks by responsable/estado |
| Acciones | `/informes/acciones` | Zap | Actions with date range and estado filters |
| Etiquetas | `/informes/etiquetas` | Tags | Tags by portfolio/nombre/etiqueta |
| Justificaciones | `/informes/justificaciones` | Scale | Justifications with tipo/portfolio filters |
| Dependencias | `/informes/dependencias` | GitBranch | Dependencies with portfolio/descripcion filters |
| Descripciones | `/informes/descripciones` | FileText | Descriptions with tipo/portfolio filters |
| Notas | `/informes/notas` | StickyNote | Notes with registrado_por/portfolio filters |
| Transacciones | `/informes/transacciones` | ArrowLeftRight | Audit trail with multi-criteria filters |
| Transacciones JSON | `/informes/transacciones-json` | FileJson | JSON transaction diffs with status tracking |
| Documentos | `/informes/documentos` | FileCheck | Documents with tipo/estado filters, external SharePoint links |

All reports share a common architecture:
- **Sticky table headers** across all pages: wrapper `overflow-auto max-h-[calc(100vh-20rem)]`, `<th>` elements with `sticky top-0 z-10 bg-muted`
- **GenericReportPage** component handles table rendering, pagination, sorting, column selection
- **Parameterized hooks**: `useReportSearch(endpoint)`, `useReportFilterOptions(endpoint, queryKey)`, `useReportPreferences(prefix, defaults)`
- **Data-driven ReportFilterPanel**: Accepts `filterDefs` array to render date, multiselect, text, and number filters. Multiselect defs support `sortByEstado: true` to sort options by workflow order. Date filter pairs with matching `dateRangeGroup` property display quick-select preset buttons (last 7/30 days, this month, quarter, year).
- **Configurable ReportColumnSelector**: Accepts report-specific column definitions
- **Aggregation footer**: Optional sticky `<tfoot>` row showing sum/count/avg aggregations for configured columns on the current page. Configured via `aggregations` object in the report config (e.g., `{ importe: 'sum', count: 'count' }`). Uses `computeAgg()` utility. First non-aggregated cell shows "Totales (página)" label.
- **Improved empty state**: Filter-aware `ReportEmptyState` component replaces generic EmptyState in reports. Shows active filter badges with values and contextual suggestions to adjust filters when no results are found.
- **Saved report templates**: `ReportTemplates` component allows saving, loading, and deleting named filter/column/sort configurations per report (max 10, FIFO, stored in localStorage via `useReportPreferences`). Dropdown menu with hover display for template list.
- **Cross-report navigation (Feature 062)**: Optional `crossReportLinks` config per report page adds a "__cross_report" column with an `ExternalLink` icon dropdown menu. Each link navigates to another report with `location.state.crossReportPortfolioId` pre-populating the portfolio_id filter. Target reports read this state on mount and apply it. All 10 GenericReportPage reports have crossReportLinks configured.

#### 15.1 Filter Behavior Convention

All report filters across the application follow these conventions:

**Multi-Select Filters:**
- "Todos" option = no filter applied. Frontend converts `['ALL']` to `[]` before sending to API
- Empty array `[]` means "do not filter on this field"
- Options fetched from dedicated `*-filter-options` endpoints (distinct non-null, non-empty, alphabetically sorted by default; estado fields sorted by workflow order via `sortByEstado: true`)

**Text Input Filters:**
- Portfolio ID uses exact match (`=`)
- Name/text fields use ILIKE wildcard (`%value%`)
- Empty string = no filter applied

**Date Range Filters:**
- Frontend: `DD/MM/YYYY` display, sends `YYYY-MM-DD` (ISO 8601) to API
- Inclusive bounds: `>=` start and `<=` end
- Both dates optional; if omitted, that bound is not applied

**Filter Panel UX:**
- Collapsible with active filter count badge (excludes date fields from count)
- Keyboard shortcuts: Enter to search, Ctrl+Shift+X to clear all
- "Buscar" button triggers search, "Limpiar" resets to defaults
- Auto-search on page load with default filters

**Pagination & Sorting:**
- Server-side pagination and sorting
- Page sizes: 25, 50, 100, 200 (default: 50), persisted to localStorage
- Sort: click header for asc, click again for desc, click again to clear
- Page resets to 1 when filters or sort change

#### 15.2 Hechos Report

**Route:** `/informes/hechos`

**Data Source:** `POST /api/v1/hechos/search-report-hechos` (joins `hechos` with `datos_relevantes`)

**Filter Options Source:** `GET /api/v1/hechos/report-hechos-filter-options`

##### Filter Criteria

| Filter | Type | Default | Backend Field |
|--------|------|---------|---------------|
| Fecha Inicio | Date Input | First day of current month | `fecha_inicio` |
| Fecha Fin | Date Input | Today | `fecha_fin` |
| Estado del Hecho | Multi-Select | All | `estado` |
| Digital Framework | Multi-Select | All | `digital_framework_level_1` |
| Unidad | Multi-Select | All | `unidad` |
| Cluster | Multi-Select | All | `cluster` |
| Tipo | Multi-Select | All | `tipo` |

##### Default Columns (12)

portfolio_id (link), fecha, estado, nombre, notas, importe, id_hecho, referente_bi, digital_framework_level_1, unidad, cluster, tipo

Additional columns from datos_relevantes available via column selector.

##### Expandable Rows

Rows in the Hechos report support expand/collapse via a chevron toggle icon. Clicking the chevron reveals a detail panel below the row showing hecho detail fields (e.g., notas full text and additional context). Estado values are rendered using the `EstadoTag` component for color-coded badges.

##### Initiative Drawer Integration

The Hechos report integrates the shared `InitiativeDrawer` component. Clicking a row action opens the side drawer showing the initiative summary and related hechos, providing quick context without navigating away from the report.

#### 15.3 LTPs Report

**Route:** `/informes/ltps`

**Data Source:** `POST /api/v1/ltp/search-report-ltps` (joins `ltp` with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/ltp/report-ltps-filter-options`

**Filters:** Responsable (multi-select), Estado (multi-select, default: "Pendiente")

**Default Columns:** portfolio_id (link), nombre, tarea (longtext), siguiente_accion (date), comentarios (longtext), estado

**Default Sort:** siguiente_accion ascending

**Expandable Rows:** Uses `GenericReportPage`'s `collapsibleConfig` to provide expandable rows. Clicking the chevron reveals a detail panel showing the full `comentarios` text for each LTP entry.

#### 15.4 Acciones Report

**Route:** `/informes/acciones`

**Data Source:** `POST /api/v1/acciones/search-report-acciones` (joins with `datos_descriptivos` and `iniciativas`)

**Filter Options:** `GET /api/v1/acciones/report-acciones-filter-options`

**Filters:** Siguiente Accion date range, Estado de la Iniciativa (multi-select)

**Default Columns:** portfolio_id (link), nombre, siguiente_accion, siguiente_accion_comentarios (longtext), estado_de_la_iniciativa

**Default Sort:** siguiente_accion ascending

#### 15.5 Etiquetas Report

**Route:** `/informes/etiquetas`

**Data Source:** `POST /api/v1/etiquetas/search-report-etiquetas` (joins with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/etiquetas/report-etiquetas-filter-options`

**Filters:** Portfolio ID (text exact), Nombre (text wildcard), Etiqueta (multi-select)

**Default Columns:** portfolio_id (link), nombre, etiqueta (longtext), valor (longtext), origen_registro (longtext), comentarios (longtext)

**Default Sort:** portfolio_id ascending, then etiqueta ascending

#### 15.6 Transacciones Report

**Route:** `/informes/transacciones`

**Data Source:** `POST /api/v1/transacciones/search-report-transacciones` (no joins)

**Filter Options:** `GET /api/v1/transacciones/report-transacciones-filter-options`

**Filters:** Portfolio ID/clave1 (text), Estado Cambio (multi-select), Fecha Registro Cambio (date range), Fecha Ejecucion Cambio (date range), ID (number)

**Default Columns:** All 14 columns (id, clave1 as link, clave2, tabla, campo_tabla, valor_nuevo, tipo_cambio, estado_cambio, fecha_registro_cambio, fecha_ejecucion_cambio, valor_antes_del_cambio, comentarios, fecha_creacion, fecha_actualizacion)

**Default Sort:** id ascending

#### 15.7 Transacciones JSON Report

**Route:** `/informes/transacciones-json`

**Data Source:** `POST /api/v1/transacciones-json/search-report` (no joins)

**Filter Options:** `GET /api/v1/transacciones-json/report-filter-options`

**Filters:** Entidad (multi-select), Tipo Operacion (multi-select), Estado DB (multi-select), Estado Excel (multi-select), Usuario (text), Fecha Creacion (date range)

**Default Columns (10):** id, entidad, tipo_operacion, clave_primaria (longtext), cambios (longtext), usuario, mensaje_commit (longtext), estado_db, estado_excel, fecha_creacion

**Additional Columns (3):** fecha_ejecucion_db, fecha_ejecucion_excel, error_detalle (longtext)

**Default Sort:** fecha_creacion descending

**Link Field:** None (no navigation to detail page)

#### 15.8 Justificaciones Report

**Route:** `/informes/justificaciones`

**Data Source:** `POST /api/v1/justificaciones/search-report-justificaciones` (joins with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/justificaciones/report-justificaciones-filter-options`

**Filters:** Portfolio ID (text exact), Tipo Justificacion (multi-select)

**Default Columns:** portfolio_id (link), nombre, tipo_justificacion, valor (longtext), comentarios (longtext)

**Default Sort:** portfolio_id ascending

**Drawer:** `showDrawer: true`

#### 15.9 Dependencias Report

**Route:** `/informes/dependencias`

**Data Source:** `POST /api/v1/dependencias/search-report-dependencias` (joins with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/dependencias/report-dependencias-filter-options`

**Filters:** Portfolio ID (text exact), Dependencia (text wildcard)

**Default Columns:** portfolio_id (link), nombre, descripcion_dependencia (longtext), fecha_dependencia (date), comentarios (longtext)

**Default Sort:** portfolio_id ascending

**Drawer:** `showDrawer: true`

#### 15.10 Descripciones Report

**Route:** `/informes/descripciones`

**Data Source:** `POST /api/v1/descripciones/search-report-descripciones` (joins with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/descripciones/report-descripciones-filter-options`

**Filters:** Portfolio ID (text exact), Tipo Descripcion (multi-select)

**Default Columns:** portfolio_id (link), nombre, tipo_descripcion, descripcion (longtext)

**Default Sort:** portfolio_id ascending

**Drawer:** `showDrawer: true`

#### 15.11 Notas Report

**Route:** `/informes/notas`

**Data Source:** `POST /api/v1/notas/search-report-notas` (joins with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/notas/report-notas-filter-options`

**Filters:** Portfolio ID (text exact), Autor/Registrado Por (multi-select), Fecha date range

**Default Columns:** portfolio_id (link), nombre, registrado_por, fecha (date), nota (longtext)

**Default Sort:** fecha descending

**Drawer:** `showDrawer: true`

#### 15.12 Documentos Report

**Route:** `/informes/documentos`

**Data Source:** `POST /api/v1/documentos/search-report-documentos` (joins with `datos_descriptivos`)

**Filter Options:** `GET /api/v1/documentos/report-documentos-filter-options`

**Filters:** Portfolio ID (text exact), Tipo Documento (multi-select), Estado Proceso Documento (multi-select)

**Default Columns:** portfolio_id (link), nombre, nombre_fichero (external link), tipo_documento, estado_proceso_documento, fecha_documento

**Default Sort:** portfolio_id ascending

**Custom renderCell:** The `nombre_fichero` column uses a custom `renderCell` function that renders the file name as an external link (`<a>` with `target="_blank"`) pointing to the `enlace_documento` URL (SharePoint). If `enlace_documento` is empty/null, the file name is rendered as plain text.

**Document Summary Viewer Columns:** Two additional custom `renderCell` columns provide document summary viewing:
- **JSON column** (Code2 icon): Opens `JsonViewerModal` to display the raw `resumen_documento` JSON with syntax highlighting (color-coded keys, strings, numbers, booleans/null).
- **Summary column** (FileText icon): Opens `SummaryViewerModal` to display the `resumen_documento` as formatted HTML (snake_case keys as Title Case headings, strings as paragraphs, arrays as bullet lists).

Both buttons only render when `resumen_documento` exists for the row. Both modals include a SharePoint link button when `enlace_documento` is available.

**Uses:** `GenericReportPage` with `tipo_documento` and `estado_proceso_documento` as multi-select filters in the `filterDefs` configuration.

#### 15.13 Persistence

| Key | Report | Default |
|-----|--------|---------|
| `portfolio-report-hechos-columns` | Hechos | 12 default columns |
| `portfolio-report-hechos-page-size` | Hechos | 50 |
| `portfolio-report-ltps-columns` | LTPs | 6 default columns |
| `portfolio-report-ltps-page-size` | LTPs | 50 |
| `portfolio-report-acciones-columns` | Acciones | 5 default columns |
| `portfolio-report-acciones-page-size` | Acciones | 50 |
| `portfolio-report-etiquetas-columns` | Etiquetas | 6 default columns |
| `portfolio-report-etiquetas-page-size` | Etiquetas | 50 |
| `portfolio-report-justificaciones-columns` | Justificaciones | 5 default columns |
| `portfolio-report-justificaciones-page-size` | Justificaciones | 50 |
| `portfolio-report-dependencias-columns` | Dependencias | 5 default columns |
| `portfolio-report-dependencias-page-size` | Dependencias | 50 |
| `portfolio-report-descripciones-columns` | Descripciones | 4 default columns |
| `portfolio-report-descripciones-page-size` | Descripciones | 50 |
| `portfolio-report-notas-columns` | Notas | 5 default columns |
| `portfolio-report-notas-page-size` | Notas | 50 |
| `portfolio-report-transacciones-columns` | Transacciones | 14 (all) columns |
| `portfolio-report-transacciones-page-size` | Transacciones | 50 |
| `portfolio-report-transacciones-json-columns` | Transacciones JSON | 10 default columns |
| `portfolio-report-transacciones-json-page-size` | Transacciones JSON | 50 |
| `portfolio-report-documentos-columns` | Documentos | 6 default columns |
| `portfolio-report-documentos-page-size` | Documentos | 50 |
| `portfolio-report-{prefix}-templates` | All reports | Saved report templates (max 10) |

---

### 16. UI Components

#### 16.1 Base Components (src/components/ui/)

| Component | File | Description |
|-----------|------|-------------|
| Button | button.jsx | Button with variants (default, outline, ghost, etc.) |
| Card | card.jsx | Card container with header, content, footer |
| Checkbox | checkbox.jsx | Checkbox component with checked/unchecked states (Feature 068) |
| MultiSelect | multi-select.jsx | Multi-select dropdown with checkboxes |
| Accordion | accordion.jsx | Collapsible content sections. Supports uncontrolled (`defaultValue`) and controlled (`value` + `onValueChange`) modes |
| Dialog | dialog.jsx | Modal dialog via React portal (overlay + Escape to close). `DialogContent` supports `size` prop: `sm` (max-w-sm), `md` (max-w-lg, default), `lg` (max-w-3xl), `xl` (max-w-5xl), `full` (max-w-[95vw]) |
| DatePicker | datepicker.jsx | Calendar popup date picker using react-day-picker v9 with Spanish locale (date-fns). Receives/returns ISO YYYY-MM-DD strings. Displays DD/MM/YYYY. Features: calendar navigation, clear button, click-outside/Escape close. Used in EntityFormModal for date-type fields |
| ConfirmDialog | confirm-dialog.jsx | Reusable confirmation dialog for destructive actions (uses Dialog) |
| Badge | badge.jsx | Status/count badges |
| Input | input.jsx | Text input field |
| Label | label.jsx | Form label |
| Select | select.jsx | Native select dropdown |
| Combobox | combobox.jsx | Searchable dropdown |
| Collapsible | collapsible.jsx | Collapsible container |
| Tooltip | tooltip.jsx | Hover tooltips |
| DropdownMenu | dropdown-menu.jsx | Dropdown menu |
| Skeleton | skeleton.jsx | Loading placeholders |

#### 16.2 Shared Components (src/components/shared/)

| Component | File | Description |
|-----------|------|-------------|
| ProtectedRoute | ProtectedRoute.jsx | Auth guard for routes |
| SidebarNav | SidebarNav.jsx | Reusable sticky sidebar navigation (`hidden xl:block sticky top-44`). Accepts `items` array with `{label, anchor, badge?}` and optional `onActiveSectionChange` callback. Uses IntersectionObserver to track visible section and notify parent. Optional badges: `'exists'` renders a dot, number renders a count pill. Includes search input at the top for accent-insensitive section filtering with clear button and "Sin coincidencias" fallback (Feature 057). Used by DashboardNav and DetailNav. |
| ColumnConfigurator | ColumnConfigurator.jsx | Dialog for column visibility and drag-and-drop reordering. Uses @dnd-kit/core + @dnd-kit/sortable. Shows a sortable list of visible columns (top) and categorized available columns (bottom). Replaces both ColumnSelector and ReportColumnSelector. |
| SortableColumnItem | SortableColumnItem.jsx | Individual draggable column row used inside ColumnConfigurator. Renders drag handle, label, and remove button. |
| ErrorBoundary | ErrorBoundary.jsx | React class-based error boundary. Catches rendering errors, shows fallback UI with "Algo salio mal" message and reload button. Wraps each protected route in App.jsx. |
| NotFoundPage | NotFoundPage.jsx | 404 page displayed for undefined routes. Shows "Pagina no encontrada" with link back to dashboard. Used as catch-all route `<Route path="*">`. |
| EstadoTag | EstadoTag.jsx | Renders estado values as colored badge pills with consistent min-width and centered text. Color mapping sourced from `lib/estadoColors.js`. Used in SimpleTable, GenericReportPage, ReportPage (Hechos), DataGrid, and InitiativeDrawer. |
| InitiativeDrawer | InitiativeDrawer.jsx | Quick-view side panel for initiative summary + hechos, notas, justificaciones, descripciones, dependencias. Fetches via `GET /portfolio/{pid}`. Uses `DrawerSection` helper for consistent table rendering. Top section uses portfolioData as fallback for fields missing from report results. Used by SearchPage, Hechos ReportPage, and GenericReportPage (LTPs, Acciones, Justificaciones, Dependencias, Descripciones, Notas when `showDrawer: true`). |
| JsonViewerModal | JsonViewerModal.jsx | Reusable modal for displaying JSON content with syntax highlighting. Color-codes keys, strings, numbers, booleans, and null values for readability. Uses Dialog pattern with optional SharePoint link button. Handles null, empty, and JSON parse errors gracefully. Used by DocumentosSection (Detail) and DocumentosReportPage (Informe Documentos). |
| SummaryViewerModal | SummaryViewerModal.jsx | Reusable modal for rendering JSON summary data as formatted HTML. Converts snake_case keys to Title Case headings, renders strings as paragraphs, and arrays as bullet lists. Uses Dialog pattern with optional SharePoint link button. Handles null, empty, and parse errors. Used by DocumentosSection (Detail) and DocumentosReportPage (Informe Documentos). |
| EmptyState | EmptyState.jsx | Reusable empty state component for when there is no data to display. Props: `icon` (Lucide component, default: Inbox), `title`, `description`, `action` ({ label, onClick, variant }), `compact` (boolean). Standard mode: py-12, 48px icon, text-lg title. Compact mode: py-4, 32px icon, text-base title. Used in DataGrid (Search), GenericReportPage (Reports), and InitiativeDrawer sections. |
| ConsoleDialog | ConsoleDialog.jsx | Terminal-like modal dialog that streams real-time output from backend trabajo endpoints via SSE. Displays stdout (white) and stderr (red) lines with auto-scroll, elapsed timer, status badges (Ejecutando/Completado/Error), exit code, and duration. Uses `fetch` + `ReadableStream` for SSE parsing. Triggered from the Navbar Trabajos dropdown menu. |
| DashboardSkeleton | skeletons/DashboardSkeleton.jsx | Layout-wrapped skeleton for dashboard: 4 KPI cards + 6 chart pairs + 2 list cards (Feature 062) |
| SearchSkeleton | skeletons/SearchSkeleton.jsx | Layout-wrapped skeleton for search: filter bar + toolbar + table rows (Feature 062) |
| DetailSkeleton | skeletons/DetailSkeleton.jsx | Layout-wrapped skeleton for detail: header + sidebar + accordion sections (Feature 062) |
| ReportSkeleton | skeletons/ReportSkeleton.jsx | Layout-wrapped skeleton for reports: title + filter panel + table rows (Feature 062) |

---

### 17. Changelog & Versioning

**Version File:** `frontend/src/lib/version.js`
- `APP_VERSION.major`: Major version number (currently 0)
- `APP_VERSION.minor`: Equals the most recent implemented feature number
- `VERSION_STRING`: Formatted as `"MAJOR.MINOR"` with zero-padded 3-digit minor (e.g., `"0.036"`)

**Changelog Data:** `frontend/src/lib/changelog.js`
- Array of `{ version, feature, title, summary }` objects
- Ordered from most recent to oldest

**Changelog UI:** `frontend/src/features/landing/components/ChangelogSection.jsx`
- Displayed on the public landing page below the hero section
- Timeline layout with version badges, feature titles, and summaries

**Release Process — MANDATORY for every new feature (do NOT skip):**
1. Increment `APP_VERSION.minor` in `frontend/src/lib/version.js` to the new feature number
2. Add a new entry at the TOP of the `CHANGELOG` array in `frontend/src/lib/changelog.js`
3. Entry must include: version string (e.g. `'0.037'`), feature number, title, and summary
4. These are displayed on the landing page — skipping this step means the feature is invisible to users

---

### 18. Landing Page Structure

The landing page (`/`) is a public page with two sections:

1. **HeroSection** — Value proposition with badge, headline, description, and dynamic stats fetched from `GET /api/v1/stats/overview` (initiative count, total budget, table count) with loading skeletons and hardcoded fallback values
2. **ChangelogSection** — Searchable changelog with collapsible version groups (ranges of 10). Search input filters by title/summary. Most recent group expanded by default; older groups collapsed. During search, all groups with matches expand automatically. Each group preserves the timeline dot+line visual pattern

Component files for removed marketing sections (ProblemSection, FeaturesSection, ProcessSection, AnalyticsSection, SecuritySection, PricingSection, AboutSection) remain in the codebase but are not rendered.
