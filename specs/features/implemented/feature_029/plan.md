# Implementation Plan — feature_029

## Phase 1: Version Utility & Startup Logging (Backend)

### Step 1.1 — Add version parsing to backend config
**File:** `backend/app/config.py`
- Add `PROJECT_ROOT` constant resolved from `Path(__file__).resolve().parent.parent.parent` (points to `task_manager/`)
- Add `get_app_version() -> str` function that:
  - Opens `PROJECT_ROOT / "frontend" / "src" / "lib" / "version.js"`
  - Uses regex to extract `major` and `minor` from `APP_VERSION = { major: X, minor: Y }`
  - Returns formatted string `"{major}.{minor:03d}"` (e.g., `"1.029"`)
  - Returns `"unknown"` if file not found or parse fails
  - Logs a warning if version file is not found

### Step 1.2 — Add env var logging and version to backend startup
**File:** `backend/app/main.py`
- In the `lifespan()` function, after existing startup log:
  - Call `get_app_version()` and log: `"Starting Task Manager API v{version}"`
  - Define `SENSITIVE_PATTERNS = {"password", "key", "secret", "token", "jwks"}`
  - Iterate over `settings.model_fields`, get each field's value from `settings`
  - For fields whose name matches any sensitive pattern, replace value with `"***"`
  - Log all fields in aligned key=value format between separator lines

### Step 1.3 — Add version parsing to management config
**File:** `management/src/config/settings.py`
- Add `get_app_version() -> str` function (same logic as backend)
- Resolve `PROJECT_ROOT` from settings.py location

### Step 1.4 — Add version and env var logging to management startup
**File:** `management/manage.py`
- In the `main()` function, in the existing session info block:
  - Add version to log: `"Task Manager CLI v{version}"`
  - Log all relevant settings with sensitive value masking (DB_PASSWORD)
  - Keep existing log format/separators, extend them

---

## Phase 2: README Backend Endpoint

### Step 2.1 — Create ayuda router
**File:** `backend/app/routers/ayuda.py` (new)
- Create `APIRouter(prefix="/ayuda", tags=["ayuda"], dependencies=[Depends(verify_auth)])`
- `GET /readme` endpoint:
  - Read `PROJECT_ROOT / "README.md"`
  - Return `{"content": markdown_string}`
  - Return 404 if file not found

### Step 2.2 — Register router in main.py
**File:** `backend/app/main.py`
- Import and include the ayuda router alongside existing routers

---

## Phase 3: Frontend Ayuda Page

### Step 3.1 — Install markdown dependencies
```bash
cd frontend
npm install react-markdown remark-gfm @tailwindcss/typography
```

### Step 3.2 — Configure Tailwind typography plugin
**File:** `frontend/tailwind.config.js` or CSS
- Add `@tailwindcss/typography` plugin (or if using Tailwind v4 with CSS config, add the import)

### Step 3.3 — Create AyudaPage component
**File:** `frontend/src/features/ayuda/AyudaPage.jsx` (new)
- Fetch markdown from `GET /api/v1/ayuda/readme` using the axios client
- Use `useQuery` from TanStack Query for data fetching
- Render with `<ReactMarkdown remarkPlugins={[remarkGfm]}>` inside a `prose` container
- Show loading skeleton while fetching
- Show error state if fetch fails

### Step 3.4 — Add route to App.jsx
**File:** `frontend/src/App.jsx`
- Add lazy import for AyudaPage
- Add protected route: `/ayuda` → AyudaPage with ErrorBoundary + Suspense

### Step 3.5 — Add "Documentación" to Navbar Ayuda dropdown
**File:** `frontend/src/components/layout/Navbar.jsx`
- In the desktop Ayuda dropdown, add a "Documentación" menu item that navigates to `/ayuda`
- Use `useNavigate` or `<Link>` to navigate, close dropdown on click
- Add same item to mobile Ayuda section
- Use `FileText` icon from lucide-react for the menu item

---

## Phase 4: Version & Changelog Update

### Step 4.1 — Update version.js
**File:** `frontend/src/lib/version.js`
- Increment `APP_VERSION.minor` to 29 (for feature_029)

### Step 4.2 — Update changelog.js
**File:** `frontend/src/lib/changelog.js`
- Add new entry at the TOP of the CHANGELOG array:
  ```javascript
  { version: "1.029", feature: "feature_029", title: "Backend improvements", summary: "App version in startup logs, Ayuda page with README, environment variable logging with sensitive value masking" }
  ```

---

## Phase 5: Documentation Updates

### Step 5.1 — Update README.md
- Document new `/api/v1/ayuda/readme` endpoint
- Document new `/ayuda` frontend route
- Mention startup logging features

### Step 5.2 — Update architecture_backend.md
- Add ayuda router documentation
- Document version logging on startup
- Document env var logging with masking

### Step 5.3 — Update architecture_frontend.md
- Add `/ayuda` route to routes table
- Document AyudaPage component
- Update Navbar Ayuda dropdown documentation

---

## Verification Checklist

- [ ] Backend starts and logs version + env vars (sensitive masked)
- [ ] Management CLI starts and logs version + env vars (sensitive masked)
- [ ] `GET /api/v1/ayuda/readme` returns README markdown content
- [ ] `/ayuda` page renders README as formatted HTML
- [ ] Navbar "Ayuda" dropdown shows "Documentación" linking to /ayuda
- [ ] Mobile nav also shows "Documentación" option
- [ ] Version.js and changelog.js updated
- [ ] All architecture docs updated
- [ ] README.md updated
- [ ] Existing functionality unchanged
