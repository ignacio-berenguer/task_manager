# Architecture Document: Frontend

## Task Manager

### 1. Overview

The frontend is a modern React Single Page Application (SPA) built with **Vite**. It consumes a **Remote FastAPI** service for all business logic and data persistence. The UI is built using custom components based on **Shadcn/ui** patterns with **Tailwind CSS** to provide a professional, accessible, and themeable user experience.

**Language:** The entire user interface is in **Spanish**. All labels, buttons, messages, and placeholders use Spanish text.

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
| Data Grid | TanStack Table | 8+ |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | Latest |
| Toast Notifications | Sonner | Latest |
| Markdown Rendering | react-markdown + remark-gfm | Latest |
| Icons | lucide-react | Latest |

---

### 3. System Architecture

The frontend is strictly decoupled from the database. It communicates with two primary external services:

1. **Clerk Auth:** Handles user identity, session management, and JWT acquisition.
2. **Remote API:** A FastAPI instance providing CRUD operations and search for tasks.

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                    │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Landing  │  │  Search  │  │  Detail  │  │   Chat   │ │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │         │
│  ┌────┴─────────────┴─────────────┴─────────────┘         │
│  │              React Router (Routes)                      │
│  └─────────────────────────┬──────────────────────────────┘│
│                            │                               │
│  ┌─────────────────────────┴──────────────────────────────┐│
│  │       Providers (Clerk, Theme, Query, Chat, Toaster)    ││
│  └─────────────────────────┬──────────────────────────────┘│
└────────────────────────────┼───────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            v                v                v
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
│   │   ├── client.js              # Axios instance + Clerk JWT interceptors
│   │   └── admin.js               # Admin API (database export)
│   ├── components/
│   │   ├── ui/                    # 21 shadcn-style UI components
│   │   │   ├── accordion.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── checkbox.jsx
│   │   │   ├── collapsible.jsx
│   │   │   ├── combobox.jsx
│   │   │   ├── confirm-dialog.jsx
│   │   │   ├── currency-input.jsx
│   │   │   ├── datepicker.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── multi-select.jsx
│   │   │   ├── popover.jsx
│   │   │   ├── select.jsx
│   │   │   ├── sheet.jsx
│   │   │   ├── skeleton.jsx
│   │   │   └── tooltip.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx         # Navigation bar
│   │   │   ├── GlobalSearch.jsx   # Global search bar
│   │   │   ├── Footer.jsx         # Footer component
│   │   │   └── Layout.jsx         # Main layout wrapper
│   │   ├── theme/
│   │   │   ├── ThemeProvider.jsx         # Dark/light mode provider (next-themes)
│   │   │   ├── ModeToggle.jsx            # Dark/light toggle button
│   │   │   ├── ColorThemeProvider.jsx    # Color theme context (localStorage)
│   │   │   └── ColorThemeSelector.jsx    # Theme selector dropdown
│   │   └── shared/
│   │       ├── ProtectedRoute.jsx        # Auth guard for routes
│   │       ├── ColumnConfigurator.jsx    # Column visibility + drag-and-drop reordering
│   │       ├── SortableColumnItem.jsx    # Draggable column item (used by ColumnConfigurator)
│   │       ├── EstadoBadge.jsx            # Colored estado badge component
│   │       ├── EmptyState.jsx            # Empty state component
│   │       ├── ErrorBoundary.jsx         # Error boundary with retry
│   │       ├── NotFoundPage.jsx          # 404 page
│   │       └── skeletons/               # Page-specific loading skeletons
│   ├── features/
│   │   ├── landing/
│   │   │   └── LandingPage.jsx    # Public page: HeroSection + ChangelogSection
│   │   ├── search/
│   │   │   └── SearchPage.jsx     # Task search with filters, table, pagination
│   │   ├── detail/
│   │   │   └── DetailPage.jsx     # Task info card + acciones CRUD table
│   │   ├── shared/
│   │   │   └── ActionDialogs.jsx  # Reusable AddAccionDialog + CambiarFechaDialog + CompleteAndScheduleDialog
│   │   └── chat/
│   │       ├── ChatPage.jsx       # AI assistant chat page
│   │       └── ChatContext.jsx    # Chat state provider (conversation persistence)
│   ├── hooks/
│   │   └── usePageTitle.js        # Dynamic document.title hook
│   ├── lib/
│   │   ├── changelog.js           # Version changelog entries
│   │   ├── estadoOrder.js         # Canonical estado ordering
│   │   ├── formatDate.js          # Date format utility (YYYY-MM-DD → DD/MM/YYYY)
│   │   ├── logger.js              # createLogger() utility
│   │   ├── storage.js             # createStorage() localStorage utility
│   │   ├── themes.js              # Color theme definitions
│   │   ├── utils.js               # General utilities (cn, etc.)
│   │   └── version.js             # APP_VERSION constant
│   ├── providers/
│   │   ├── Providers.jsx          # Combined providers wrapper
│   │   └── QueryProvider.jsx      # TanStack Query provider
│   ├── App.jsx                    # Root component with routing
│   ├── main.jsx                   # Application entry point
│   └── index.css                  # Tailwind CSS imports
├── .env / .env.example
├── package.json
└── vite.config.js
```

---

### 5. Routes

| Route | Access | Component | Description |
|-------|--------|-----------|-------------|
| `/` | Public | `LandingPage` | Hero section with auth-conditional CTA + changelog |
| `/sign-in` | Public | Clerk `SignIn` | Authentication |
| `/sign-up` | Public | Clerk `SignUp` | Registration |
| `/search` | Private | `SearchPage` | Task search with filters and data grid |
| `/detail/:tarea_id` | Private | `DetailPage` | Task detail with acciones CRUD |
| `/chat` | Private | `ChatPage` | AI assistant chat |
| `*` | Public | `NotFoundPage` | 404 catch-all |

**Route-Based Code Splitting:** `SearchPage`, `DetailPage`, and `ChatPage` are loaded with `React.lazy()` + `Suspense` with page-specific loading skeletons.

---

### 6. Pages

#### 6.1 Landing Page (`/`)

- **HeroSection**: Application title, description, auth-conditional CTA button ("Ir a Busqueda" for signed-in users, "Iniciar Sesion" for guests)
- **ChangelogSection**: Version history with feature entries from `lib/changelog.js`

#### 6.2 Search Page (`/search`)

- **5 filter criteria** (compact, no labels): tarea_id, tarea (nombre), responsable, tema, estado — using placeholder text instead of visible labels for a condensed layout
- **Lateral filter sidebar** on xl+ screens; collapsible accordion on smaller screens
- **Column filter popovers**: Filterable column headers display a funnel icon that opens a popover with filter input on click; icon turns colored when filter is active
- **Active filter tags**: Removable badge tags next to result count showing all active server-side filters; clicking X removes the filter and re-triggers search
- **Quick date filters**: Two mutually exclusive toggle buttons side by side: "2 dias" (today to today+1) and "Semana" (today to today+6 days). Activating one deactivates the other. Both apply `gte`/`lte` date range on `fecha_siguiente_accion` (computed client-side); active/inactive variant toggle; appear as removable badge tags with DD/MM date range; state preserved in module-level cache; cleared by "Limpiar" button
- **Export to clipboard**: Button in the results bar (clipboard icon) copies visible tasks to clipboard. Format per task: `tarea: action1 / action2` (only non-completed actions). Fetches acciones via API (parallelized, uses existing cache). Shows toast confirmation and brief check-icon feedback.
- **Default filter**: estado defaults to "En Curso"; "Limpiar" resets to "En Curso"
- **Default sort**: fecha_siguiente_accion ascending
- **Auto-search** on initial page load with default filters
- **Keyboard shortcuts**: Ctrl+Shift+F (focus tarea filter), Ctrl+Shift+N (new tarea dialog), Enter (trigger search or submit modal)
- **Sticky title bar**: "Busqueda de Tareas" title and action buttons remain visible when scrolling
- **Sticky results bar & table header** (XL+ only): The results/filters bar (result count, filter chips, column configurator) and the table header row use `position: sticky` to remain visible while scrolling. A `ResizeObserver` dynamically measures the filter bar height to position the table header below it via a CSS custom property (`--thead-top`). The table wrapper uses `max-xl:overflow-x-auto` to remove the scroll context on XL+, allowing viewport-relative sticky positioning.
- **Sortable data grid** with configurable columns and sticky column headers
- **Colored estado tags**: EstadoBadge component renders estado as colored badges (red=En Curso/Pendiente, green=Completado/Completada, amber=En Progreso, gray=Cancelado)
- **Information hierarchy**: tarea_id displayed in small muted monospace font; tarea name displayed with emphasis
- **Reorderable columns** via ColumnConfigurator with drag-and-drop; order persisted to localStorage
- **Inline detail accordion**: Each row has an expand button showing descripcion and acciones inline
- **Side drawer quick view**: PanelRightOpen button opens a Sheet from the right with tarea summary (tarea_id de-emphasized, tarea name as title) and compact acciones list
- **Action buttons**: Each row has icon buttons for "Añadir Accion" (opens AddAccionDialog), "Completar y Programar Siguiente" (opens CompleteAndScheduleDialog), and "Cambiar Fecha Siguiente Accion" (opens CambiarFechaDialog) using shared dialog components from `features/shared/ActionDialogs.jsx`
- **Multi-select checkboxes**: Each row has a checkbox for bulk selection; a header checkbox toggles select-all for the current page
- **Bulk operations toolbar**: Appears when rows are selected. Provides "Cambiar Fecha" (bulk date change), "Completar y Crear Accion" (bulk complete and create action), and "Exportar Seleccion" (export selected tasks to clipboard). Operations call `POST /api/v1/tareas/bulk-update` and display per-task success/failure results
- **Nueva Tarea dialog**: Create new tarea with button (tooltip shows Ctrl+Shift+N shortcut)
- **Full-width layout**: No max-width constraint; uses all available width
- **Server-side pagination** with configurable page size
- **Click-to-detail**: Clicking a row navigates to `/detail/:tarea_id`
- **State preservation**: Search state (filters, results, page, sort, column filters, quick date filters, scroll position) is automatically saved to a module-level cache on unmount and restored on mount. Survives in-app navigation; clears on page refresh.

#### 6.3 Detail Page (`/detail/:tarea_id`)

- **Header**: tarea_id (small muted monospace), tarea name (primary heading, text-2xl), EstadoBadge (colored estado), responsable Badge, fecha_siguiente_accion Badge with Calendar icon, CalendarClock button to change fecha (opens CambiarFechaDialog), edit button
- **Acciones Realizadas** (primary content, first section): Compact CRUD table sorted by fecha_accion descending, with sticky headers and EstadoBadge (size=sm) for estado; "Nueva Accion" button opens AddAccionDialog (creates accion with estado Pendiente and updates tarea's fecha_siguiente_accion); "Completar y Programar" button opens CompleteAndScheduleDialog (atomically completes current action and schedules next); full width on lg+ screens
- **Notas Anteriores** (second section, accordion): Collapsible accordion (closed by default), read-only display of original notas text (shown only when non-empty)
- **Datos de la Tarea** (third section, accordion): Collapsible accordion (collapsed by default) showing all tarea fields with formatted dates and EstadoBadge
- **Keyboard shortcuts**: Ctrl+Shift+F navigates to Search page with focus on tarea filter input
- **"Marcar Completado" button**: Marks the tarea and all non-completed acciones as completed via `POST /api/v1/tareas/{tarea_id}/complete`, with a confirmation dialog before execution
- **Edit tarea dialog**: Responsable uses a dropdown populated from `/api/v1/responsables`; estado uses a dropdown populated from `/api/v1/estados-tareas` (parametric table) instead of free text; Enter submits, Ctrl+Enter submits from anywhere
- **Modal keyboard**: All modals support Enter to submit (except in textareas), +/- keys to adjust dates when DateInput is focused
- **Back navigation**: Uses `navigate(-1)` (browser history) to preserve Search page state

#### 6.4 Chat Page (`/chat`)

- **AI assistant** powered by Claude via the backend agent endpoint
- **SSE streaming**: Real-time token-by-token response rendering
- **Markdown rendering**: Responses formatted with react-markdown + remark-gfm
- **Conversation persistence**: ChatContext provider maintains conversation history across navigation
- **Tool call visibility**: Shows when the agent is calling tools (search, detail, etc.)

---

### 7. Providers

The `Providers.jsx` wrapper composes all context providers:

```
ClerkProvider
  └── ThemeProvider (next-themes)
        └── QueryProvider (TanStack Query)
              └── ChatProvider (conversation persistence)
                    └── {children}
                    └── Toaster (sonner)
```

| Provider | Purpose |
|----------|---------|
| `ClerkProvider` | Authentication, JWT tokens |
| `ThemeProvider` | Dark/light mode (system-aware with manual toggle) |
| `QueryProvider` | TanStack Query client for data fetching |
| `ChatProvider` | Chat conversation state persistence across navigation |
| `Toaster` | Toast notification rendering (sonner) |

---

### 8. Component Library

#### 8.1 UI Components (`components/ui/`)

21 reusable components following Shadcn/ui patterns:

| Component | Description |
|-----------|-------------|
| `accordion.jsx` | Collapsible content sections |
| `badge.jsx` | Status badges with soft color variants (lighter/pastel tones for destructive, success, warning) |
| `button.jsx` | Button with size/variant props |
| `card.jsx` | Card container (Card, CardHeader, CardContent, etc.) |
| `checkbox.jsx` | Checkbox input |
| `collapsible.jsx` | Collapsible wrapper |
| `combobox.jsx` | Searchable select dropdown |
| `confirm-dialog.jsx` | Confirmation dialog with cancel/confirm actions |
| `currency-input.jsx` | Monetary input with locale formatting |
| `date-input.jsx` | Date input with +/- day buttons, keyboard accelerators (+/=/-), wraps DatePicker |
| `datepicker.jsx` | Date picker with calendar popup (used internally by DateInput) |
| `dialog.jsx` | Modal dialog (X button and overlay click to close) |
| `dropdown-menu.jsx` | Dropdown menu with items |
| `input.jsx` | Text input field |
| `label.jsx` | Form label |
| `multi-select.jsx` | Multi-select dropdown with checkboxes |
| `popover.jsx` | Click-triggered floating panel with click-outside and Escape-to-close |
| `select.jsx` | Single-select dropdown |
| `sheet.jsx` | Sliding side panel (portal-based) |
| `skeleton.jsx` | Loading skeleton placeholder |
| `tooltip.jsx` | Hover tooltip |

#### 8.2 Layout Components (`components/layout/`)

| Component | Description |
|-----------|-------------|
| `Navbar.jsx` | Top navigation bar with links, Administrador dropdown, auth controls, GlobalSearch |
| `GlobalSearch.jsx` | Navbar search bar for quick task lookup |
| `Layout.jsx` | Main layout wrapper (Navbar + content + Footer) |
| `Footer.jsx` | Page footer |

#### 8.3 Shared Components (`components/shared/`)

| Component | Description |
|-----------|-------------|
| `ProtectedRoute.jsx` | Auth guard, redirects unauthenticated users |
| `ColumnConfigurator.jsx` | Column visibility + drag-and-drop reordering dialog |
| `SortableColumnItem.jsx` | Draggable column item for ColumnConfigurator |
| `EstadoBadge.jsx` | Colored estado badge: maps tarea estados (En Curso→red, Completado→green, Cancelado→gray) and accion estados (Pendiente→red, En Progreso→amber, Completada→green) to Badge variants |
| `EmptyState.jsx` | Styled empty state with icon and message |
| `ErrorBoundary.jsx` | Error boundary with retry button |
| `NotFoundPage.jsx` | 404 page |
| `skeletons/` | Page-specific loading skeletons (SearchSkeleton, DetailSkeleton) |

#### 8.4 Theme Components (`components/theme/`)

| Component | Description |
|-----------|-------------|
| `ThemeProvider.jsx` | Dark/light mode via next-themes |
| `ModeToggle.jsx` | Dark/light toggle button |
| `ColorThemeProvider.jsx` | Color theme context with localStorage persistence |
| `ColorThemeSelector.jsx` | Theme selector dropdown in navbar |

---

### 9. Lib Utilities

| Module | Description |
|--------|-------------|
| `changelog.js` | Array of version entries `{version, feature, title, summary}` displayed on landing page |
| `estadoOrder.js` | Canonical workflow order for estado dropdowns (not alphabetical) |
| `formatDate.js` | Converts YYYY-MM-DD date strings to DD/MM/YYYY display format |
| `logger.js` | `createLogger('ContextName')` factory for browser console logging (color-coded, timestamped, level-configurable) |
| `storage.js` | `createStorage(prefix)` factory for namespaced localStorage access (`saveJSON`, `loadJSON`, `saveString`, `loadString`, `remove`) |
| `themes.js` | Color theme definitions for the application |
| `utils.js` | General utilities including `cn()` for className merging |
| `version.js` | `APP_VERSION` constant for the application |

---

### 10. API Client

#### `api/client.js`
- Axios instance configured with `VITE_API_BASE_URL`
- Request interceptor automatically injects Clerk JWT token in `Authorization` header
- Centralized error handling

#### `api/admin.js`
- `exportDatabase()` — Calls `GET /admin/export`, creates a Blob from the JSON response (pretty-printed), and triggers a browser file download with a timestamped filename

---

### 11. Data Fetching

- **TanStack Query 5** for server state management (caching, refetching, stale-while-revalidate)
- Query keys follow pattern: `['tareas', 'search', filters]`, `['tareas', tareaId]`, etc.
- Mutations for create/update/delete operations with automatic cache invalidation

---

### 12. Authentication

- **Clerk** provides sign-in/sign-up flows
- JWT tokens auto-injected via Axios interceptors
- `ProtectedRoute` wrapper redirects unauthenticated users to `/sign-in`
- After sign-in/sign-up, users are redirected to `/search`

---

### 13. Theming

- **Dark/Light mode**: System-aware with manual toggle via `ModeToggle`
- **Color themes**: Multiple selectable color themes via `ColorThemeSelector`, persisted in localStorage
- **CSS variables**: Theme colors defined as CSS custom properties, consumed by Tailwind

---

### 14. Configuration (.env)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Task Manager
```

---

### 15. Key Patterns

**Estado Workflow Order:** All estado dropdowns use the canonical order from `lib/estadoOrder.js`, not alphabetical sorting.

**localStorage Persistence:** Column configurations, page sizes, and theme preferences are persisted via the `createStorage()` utility.

**Module-Level State Cache:** The Search page uses a module-level JavaScript variable (`searchStateCache`) to preserve state (filters, results, pagination, sort, column filters, scroll position) across in-app navigation. The variable survives component unmount/remount within the SPA but resets on full page refresh. State is saved via `useEffect` cleanup on unmount and restored via `useState` initializers on mount. A `stateRef` pattern avoids stale closures in the cleanup function.

**Spanish UI:** All user-facing text is in Spanish. Code identifiers use Spanish column names without accents (e.g., `descripcion`, `accion`).

**Administrador Dropdown:** The Navbar includes an "Administrador" dropdown menu (desktop: click-toggle popover with click-outside/Escape dismiss; mobile: accordion in drawer). Currently contains "Exportar base de datos" which downloads the entire database as a JSON file.

**Error Handling:** `ErrorBoundary` wraps each protected route for graceful error recovery with a retry button.

**Shared Feature Components:** Reusable dialog components in `features/shared/ActionDialogs.jsx` are used by both SearchPage and DetailPage for "Añadir Accion", "Cambiar Fecha Siguiente Accion", and "Completar y Programar Siguiente" operations. Each dialog manages its own form state, API calls, and toast notifications, and accepts an `onSuccess` callback to refresh the parent page's data. The CompleteAndScheduleDialog atomically completes an action (estado Completada, fecha today) and schedules the next one (estado Pendiente, future date), updating the tarea's fecha_siguiente_accion via a single backend endpoint.

**Code Splitting:** All protected routes use `React.lazy()` with `Suspense` and page-specific skeleton fallbacks for optimal loading performance.

**Mobile Responsive Design:** The frontend uses a mobile-first approach with Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`, `xl:`). Key patterns:
- **Buttons**: Text labels hidden on mobile with `hidden sm:inline`, showing icon-only on small screens (e.g., "Nueva Tarea", "Editar")
- **Dialogs**: All dialogs constrained with `max-w-[calc(100vw-2rem)]` and responsive padding `p-4 sm:p-6` to prevent overflow on any screen
- **Detail acciones**: Responsive card layout on mobile (`sm:hidden`) vs table on desktop (`hidden sm:block`)
- **Drawer/Sheet**: Full-screen on mobile, side-slide panel on desktop. Content uses responsive grid (`grid-cols-1 sm:grid-cols-2`)
- **Padding**: Components use responsive padding (`px-4 sm:px-6`) to reduce whitespace on small screens
- **Touch targets**: Interactive elements (buttons, icons) use minimum `p-1.5` padding for adequate tap areas
