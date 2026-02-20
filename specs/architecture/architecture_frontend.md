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
│   │   └── client.js              # Axios instance + Clerk JWT interceptors
│   ├── components/
│   │   ├── ui/                    # 20 shadcn-style UI components
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
│   │   └── chat/
│   │       ├── ChatPage.jsx       # AI assistant chat page
│   │       └── ChatContext.jsx    # Chat state provider (conversation persistence)
│   ├── hooks/
│   │   └── usePageTitle.js        # Dynamic document.title hook
│   ├── lib/
│   │   ├── changelog.js           # Version changelog entries
│   │   ├── estadoOrder.js         # Canonical estado ordering
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

- **5 filter criteria**: tarea_id, tarea (nombre), responsable, tema, estado
- **Sortable data grid** using TanStack Table with configurable columns
- **Server-side pagination** with configurable page size
- **Click-to-detail**: Clicking a row navigates to `/detail/:tarea_id`
- **Column configurator**: Select and reorder visible columns via drag-and-drop
- **Filter and column preferences** persisted to localStorage

#### 6.3 Detail Page (`/detail/:tarea_id`)

- **Task info card**: Displays all tarea fields (tarea_id, tarea, responsable, descripcion, tema, estado, fecha_siguiente_accion, timestamps)
- **Acciones CRUD table**: Lists all acciones for the tarea with create, edit, and delete operations
- **Navigation back** to search page

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

20 reusable components following Shadcn/ui patterns:

| Component | Description |
|-----------|-------------|
| `accordion.jsx` | Collapsible content sections |
| `badge.jsx` | Status badges with color variants |
| `button.jsx` | Button with size/variant props |
| `card.jsx` | Card container (Card, CardHeader, CardContent, etc.) |
| `checkbox.jsx` | Checkbox input |
| `collapsible.jsx` | Collapsible wrapper |
| `combobox.jsx` | Searchable select dropdown |
| `confirm-dialog.jsx` | Confirmation dialog with cancel/confirm actions |
| `currency-input.jsx` | Monetary input with locale formatting |
| `datepicker.jsx` | Date picker with calendar popup |
| `dialog.jsx` | Modal dialog |
| `dropdown-menu.jsx` | Dropdown menu with items |
| `input.jsx` | Text input field |
| `label.jsx` | Form label |
| `multi-select.jsx` | Multi-select dropdown with checkboxes |
| `select.jsx` | Single-select dropdown |
| `sheet.jsx` | Sliding side panel (portal-based) |
| `skeleton.jsx` | Loading skeleton placeholder |
| `tooltip.jsx` | Hover tooltip |

#### 8.2 Layout Components (`components/layout/`)

| Component | Description |
|-----------|-------------|
| `Navbar.jsx` | Top navigation bar with links, auth controls, GlobalSearch |
| `GlobalSearch.jsx` | Navbar search bar for quick task lookup |
| `Layout.jsx` | Main layout wrapper (Navbar + content + Footer) |
| `Footer.jsx` | Page footer |

#### 8.3 Shared Components (`components/shared/`)

| Component | Description |
|-----------|-------------|
| `ProtectedRoute.jsx` | Auth guard, redirects unauthenticated users |
| `ColumnConfigurator.jsx` | Column visibility + drag-and-drop reordering dialog |
| `SortableColumnItem.jsx` | Draggable column item for ColumnConfigurator |
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
| `logger.js` | `createLogger('ContextName')` factory for browser console logging (color-coded, timestamped, level-configurable) |
| `storage.js` | `createStorage(prefix)` factory for namespaced localStorage access (`saveJSON`, `loadJSON`, `saveString`, `loadString`, `remove`) |
| `themes.js` | Color theme definitions for the application |
| `utils.js` | General utilities including `cn()` for className merging |
| `version.js` | `APP_VERSION` constant for the application |

---

### 10. API Client (`api/client.js`)

- Axios instance configured with `VITE_API_BASE_URL`
- Request interceptor automatically injects Clerk JWT token in `Authorization` header
- Centralized error handling

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
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_LOG_LEVEL=INFO
VITE_APP_NAME=Task Manager
```

---

### 15. Key Patterns

**Estado Workflow Order:** All estado dropdowns use the canonical order from `lib/estadoOrder.js`, not alphabetical sorting.

**localStorage Persistence:** Search filters, column configurations, page sizes, and theme preferences are persisted via the `createStorage()` utility.

**Spanish UI:** All user-facing text is in Spanish. Code identifiers use Spanish column names without accents (e.g., `descripcion`, `accion`).

**Error Handling:** `ErrorBoundary` wraps each protected route for graceful error recovery with a retry button.

**Code Splitting:** All protected routes use `React.lazy()` with `Suspense` and page-specific skeleton fallbacks for optimal loading performance.
