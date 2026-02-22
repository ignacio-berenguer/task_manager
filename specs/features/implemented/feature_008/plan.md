# Implementation Plan: feature_008 — Secure FastAPI Backend with Clerk JWT

## Phase 1: Backend Auth Module & Configuration

### Step 1.1: Add PyJWT dependency

**File:** `backend/pyproject.toml`

Add `"PyJWT[crypto]>=2.8.0"` to the `dependencies` list.

Run `uv sync` in `backend/` to install.

### Step 1.2: Add auth configuration to backend settings

**File:** `backend/app/config.py`

Add three new settings to the `Settings` class:

```python
# Authentication
CLERK_JWKS_URL: str = ""
CLERK_AUTHORIZED_PARTIES: list[str] = ["http://localhost:5173"]
API_KEY: str = ""
```

### Step 1.3: Update backend `.env.example`

**File:** `backend/.env.example`

Add new section:

```env
# Authentication
CLERK_JWKS_URL=https://your-slug.clerk.accounts.dev/.well-known/jwks.json
CLERK_AUTHORIZED_PARTIES=["http://localhost:5173"]
API_KEY=
```

### Step 1.4: Create `auth.py` module

**File:** `backend/app/auth.py` (new file)

Implement:

1. Module-level `PyJWKClient` instance (lazy-initialized, only created when `CLERK_JWKS_URL` is set)
2. `_verify_jwt(token: str) -> dict` — internal function:
   - Get signing key from JWKS client
   - Decode with `jwt.decode()` using RS256, verify `exp`, `nbf`, `iat`
   - Validate `azp` claim against `CLERK_AUTHORIZED_PARTIES`
   - Return decoded payload
3. `verify_auth(request: Request) -> dict` — FastAPI dependency:
   - Check `Authorization: Bearer <token>` header → verify JWT
   - Else check `X-API-Key` header → compare with `settings.API_KEY` using `hmac.compare_digest`
   - Else raise `HTTPException(401)`
   - Log auth results (INFO for success, WARNING for failure)

---

## Phase 2: Protect API Routes

### Step 2.1: Add auth dependency to tareas router

**File:** `backend/app/routers/tareas.py`

- Import `verify_auth` from `app.auth`
- Add `dependencies=[Depends(verify_auth)]` to the `APIRouter()` constructor

### Step 2.2: Add auth dependency to acciones router

**File:** `backend/app/routers/acciones.py`

- Import `verify_auth` from `app.auth`
- Add `dependencies=[Depends(verify_auth)]` to the `APIRouter()` constructor

### Step 2.3: Add auth dependency to estados routers

**File:** `backend/app/routers/estados.py`

- Import `verify_auth` from `app.auth`
- Add `dependencies=[Depends(verify_auth)]` to both `router_tareas` and `router_acciones` constructors

### Step 2.4: Add auth dependency to responsables router

**File:** `backend/app/routers/responsables.py`

- Import `verify_auth` from `app.auth`
- Add `dependencies=[Depends(verify_auth)]` to the `APIRouter()` constructor

### Step 2.5: Add auth dependency to agent router

**File:** `backend/app/routers/agent.py`

- Import `verify_auth` from `app.auth`
- Add `dependencies=[Depends(verify_auth)]` to the `APIRouter()` constructor

---

## Phase 3: Service Client Authentication

### Step 3.1: Update agent's internal API client

**File:** `backend/app/agent/api_client.py`

- Import `settings` from `app.config`
- If `settings.API_KEY` is set, add `X-API-Key` header to the `httpx.AsyncClient` constructor's `headers` parameter

### Step 3.2: Add API key config to MCP server

**File:** `mcp_server/src/mcp_tareas/config.py`

- Add `API_KEY: str = os.getenv("API_KEY", "")`

### Step 3.3: Update MCP server API client

**File:** `mcp_server/src/mcp_tareas/api_client.py`

- Import `settings` from `.config`
- If `settings.API_KEY` is set, add `X-API-Key` header to the `httpx.Client` constructor's `headers` parameter

### Step 3.4: Update MCP server `.env.example`

**File:** `mcp_server/.env.example`

Add:

```env
# Authentication
API_KEY=
```

---

## Phase 4: Documentation Updates

### Step 4.1: Update backend architecture document

**File:** `specs/architecture/architecture_backend.md`

- Add new section "Authentication" describing the dual auth mechanism (JWT + API key)
- Document the new `auth.py` module in the directory structure
- Add auth config variables to the configuration section
- Note that all `/api/v1/*` routes are protected

### Step 4.2: Update README.md

**File:** `README.md`

- Add authentication section explaining the Clerk JWT + API key setup
- Document required env variables for auth

### Step 4.3: Update CLAUDE.md

**File:** `CLAUDE.md`

- Add auth-related env variables to the backend configuration section
- Add `API_KEY` to the MCP server configuration section
- Mention `auth.py` in the project structure

### Step 4.4: Update version and changelog

**Files:**
- `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 8
- `frontend/src/lib/changelog.js` — add new entry at top of `CHANGELOG` array

---

## Phase 5: Verification

### Step 5.1: Backend import check

```bash
cd backend
uv run python -c "from app.auth import verify_auth; print('Auth module OK')"
```

### Step 5.2: Full backend import check

```bash
cd backend
uv run python -c "from app.main import app; print('Backend OK')"
```

### Step 5.3: Frontend build check

```bash
cd frontend
npm run build
```

---

## Files Modified (Summary)

| File | Action |
|------|--------|
| `backend/pyproject.toml` | Add `PyJWT[crypto]` dependency |
| `backend/app/config.py` | Add `CLERK_JWKS_URL`, `CLERK_AUTHORIZED_PARTIES`, `API_KEY` |
| `backend/app/auth.py` | **New file** — JWT verification + API key auth |
| `backend/app/routers/tareas.py` | Add auth dependency |
| `backend/app/routers/acciones.py` | Add auth dependency |
| `backend/app/routers/estados.py` | Add auth dependency (both routers) |
| `backend/app/routers/responsables.py` | Add auth dependency |
| `backend/app/routers/agent.py` | Add auth dependency |
| `backend/app/agent/api_client.py` | Add `X-API-Key` header |
| `backend/.env.example` | Add auth config variables |
| `mcp_server/src/mcp_tareas/config.py` | Add `API_KEY` setting |
| `mcp_server/src/mcp_tareas/api_client.py` | Add `X-API-Key` header |
| `mcp_server/.env.example` | Add `API_KEY` variable |
| `specs/architecture/architecture_backend.md` | Add authentication section |
| `README.md` | Add authentication documentation |
| `CLAUDE.md` | Add auth config variables |
| `frontend/src/lib/version.js` | Increment minor version to 8 |
| `frontend/src/lib/changelog.js` | Add feature_008 changelog entry |

## Files NOT Modified

| File | Reason |
|------|--------|
| `frontend/src/api/client.js` | Already sends `Authorization: Bearer <token>` — no changes needed |
| `backend/app/main.py` | Auth is applied at router level, not middleware level — no changes needed |
| Any frontend component | Frontend already handles 401 responses correctly |
