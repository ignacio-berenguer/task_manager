# Technical Specification — feature_029

## Overview

Three backend/frontend improvements: (1) unified app version logging on startup, (2) README.md served as an "Ayuda" page, (3) environment variable logging with sensitive value masking.

---

## 1. Application Version in Backend & Management Startup Logs

### 1.1 Version Source Strategy

The canonical version lives in `frontend/src/lib/version.js`:

```javascript
export const APP_VERSION = { major: 1, minor: 29 }
export const VERSION_STRING = `${APP_VERSION.major}.${String(APP_VERSION.minor).padStart(3, '0')}`
```

**Approach:** Keep `version.js` as the single source of truth (the post-implementation checklist already mandates updating it for every feature). Python modules will parse this file at startup using a simple regex to extract major/minor values and reconstruct the version string.

**Resolution path:** Both backend (`backend/`) and management (`management/`) share the same parent directory (`task_manager/`). The path to `version.js` can be resolved as `<project_root>/frontend/src/lib/version.js`, where `<project_root>` is derived from the module's own location (e.g., `Path(__file__).resolve().parent.parent.parent` for backend's `app/config.py`).

### 1.2 Version Utility Module

Create a shared-pattern utility (not a shared package — each module gets its own copy of a small function) in each Python module:

- **Backend:** Add a `get_app_version()` function in `backend/app/config.py` that parses `version.js` and returns the version string. Falls back to `"unknown"` if the file is not found.
- **Management:** Add a `get_app_version()` function in `management/src/config/settings.py` with the same logic.

### 1.3 Startup Log Output

**Backend** (`app/main.py`, lifespan function):
```
Starting Task Manager API v1.029
```
Replace the current `settings.API_VERSION` reference with the parsed app version.

**Management** (`manage.py`, main function):
```
Task Manager CLI v1.029
```
Add version to the existing "NEW EXECUTION" session log block.

---

## 2. README.md as a Web Page (Ayuda)

### 2.1 Backend Endpoint

**New router:** `backend/app/routers/ayuda.py`

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/api/v1/ayuda/readme` | Protected (verify_auth) | `{"content": "<markdown string>"}` |

The endpoint reads `README.md` from the project root directory (`<project_root>/README.md`), returns the raw markdown content as a JSON response. This keeps the API contract simple and lets the frontend handle rendering.

**Project root resolution:** Same strategy as version — resolve from the backend's known location.

**Error handling:** Return 404 if README.md is not found.

### 2.2 Frontend Route & Page

**New route:** `/ayuda` (protected, lazy-loaded)

**New feature folder:** `frontend/src/features/ayuda/`
- `AyudaPage.jsx` — Fetches markdown from `/api/v1/ayuda/readme`, renders it as HTML using `react-markdown` with `remark-gfm` plugin (for GitHub Flavored Markdown tables, strikethrough, etc.).

**Dependencies:**
- `react-markdown` — npm package for rendering markdown as React components
- `remark-gfm` — plugin for GitHub Flavored Markdown support (tables, task lists)

**Styling:** Use Tailwind's `prose` class from `@tailwindcss/typography` plugin for readable rendered markdown. This provides proper heading sizes, paragraph spacing, table styling, and code block formatting.

### 2.3 Navbar Integration

The navbar already has an "Ayuda" dropdown (containing "Atajos de teclado"). Add a new menu item to this dropdown:

```
Ayuda ▾
  ├─ Atajos de teclado  [F1]
  └─ Documentación       → navigates to /ayuda
```

The new "Documentación" item uses `react-router-dom`'s `useNavigate` (or a `Link`) to navigate to `/ayuda`. The dropdown closes on click.

### 2.4 Mobile Navigation

Extend the mobile Ayuda section (currently accordion-style) to include the "Documentación" link alongside "Atajos de teclado".

---

## 3. Environment Variables Logging on Backend Start

### 3.1 Logging Strategy

On startup (in the lifespan function of `main.py`), iterate over all fields of the `Settings` pydantic model and log their current values.

### 3.2 Sensitive Value Masking

Define a set of sensitive field name patterns:
```python
SENSITIVE_PATTERNS = {"password", "key", "secret", "token", "jwks"}
```

For any setting whose field name (lowercased) contains one of these patterns, replace the value with `***` in the log output.

### 3.3 Log Format

```
============================================================
Configuration:
  LOG_LEVEL          = INFO
  LOG_FILE           = task_manager_backend.log
  API_HOST           = 0.0.0.0
  API_PORT           = 8080
  DB_HOST            = 127.0.0.1
  DB_PORT            = 5432
  DB_USER            = task_user
  DB_PASSWORD        = ***
  API_KEY            = ***
  ANTHROPIC_API_KEY  = ***
  CLERK_JWKS_URL     = ***
  ...
============================================================
```

Log at INFO level to both console and log file. The separator lines make it easy to spot in log output.

### 3.4 Management Module

Also add environment variable logging to the management CLI startup (same masking pattern), extending the existing session info block that already logs DB_NAME, DB_HOST, DB_PORT.

---

## 4. Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `backend/app/routers/ayuda.py` | README endpoint |
| `frontend/src/features/ayuda/AyudaPage.jsx` | Ayuda page component |

### Modified Files
| File | Changes |
|------|---------|
| `backend/app/config.py` | Add `get_app_version()`, add `PROJECT_ROOT` resolution |
| `backend/app/main.py` | Log version + env vars on startup, register ayuda router |
| `management/src/config/settings.py` | Add `get_app_version()` |
| `management/manage.py` | Log version + env vars on startup |
| `frontend/src/App.jsx` | Add `/ayuda` route |
| `frontend/src/components/layout/Navbar.jsx` | Add "Documentación" to Ayuda dropdown |
| `frontend/package.json` | Add `react-markdown`, `remark-gfm`, `@tailwindcss/typography` |
| `README.md` | Update with new endpoint/route docs |
| `specs/architecture/architecture_backend.md` | Document ayuda endpoint, version logging, env logging |
| `specs/architecture/architecture_frontend.md` | Document /ayuda route, Ayuda dropdown changes |

---

## 5. Non-Functional Considerations

- **Performance:** README.md is read from disk on each request. Given low traffic, no caching needed initially.
- **Security:** The README endpoint is protected (requires auth). Sensitive env vars are masked in logs.
- **Backwards compatibility:** No existing functionality is affected. The `API_VERSION` field in config remains but the startup log now uses the parsed app version.
