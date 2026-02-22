# Technical Specification: feature_008 — Secure FastAPI Backend with Clerk JWT

## 1. Overview

The FastAPI backend is deployed to the Internet with no authentication layer. The frontend already uses Clerk and sends JWT tokens via Axios interceptors. This feature adds backend JWT verification so that only authenticated Clerk users (and authorized service clients) can access the API.

**Two authentication mechanisms:**

| Mechanism | Consumer | How it works |
|-----------|----------|--------------|
| **Clerk JWT** | Frontend (React SPA) | Verify RS256-signed JWT from Clerk using JWKS |
| **API Key** | MCP Server, Agent internal calls | Static pre-shared key in `X-API-Key` header |

---

## 2. Authentication Architecture

```
Frontend (Browser)                MCP Server / Agent
      │                                  │
      │ Authorization: Bearer <JWT>      │ X-API-Key: <key>
      │                                  │
      ▼                                  ▼
┌──────────────────────────────────────────────┐
│              FastAPI Backend                 │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │         auth.py (new module)            │ │
│  │                                         │ │
│  │  verify_auth() dependency               │ │
│  │    ├── Try JWT (Authorization: Bearer)  │ │
│  │    │   └── PyJWT + JWKS verification    │ │
│  │    └── Try API Key (X-API-Key header)   │ │
│  │        └── Compare with API_KEY env var │ │
│  │                                         │ │
│  │  If neither → 401 Unauthorized          │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Public endpoints (no auth):                 │
│    GET /                                     │
│    GET /health                               │
│    GET /api/v1/docs, /redoc, /openapi.json   │
│                                              │
│  Protected endpoints (auth required):        │
│    All /api/v1/* CRUD and search routes      │
└──────────────────────────────────────────────┘
```

---

## 3. JWT Verification (Clerk → Frontend → Backend)

### 3.1 Approach: Manual PyJWT with JWKS

Use `PyJWT[crypto]` to verify Clerk JWTs locally. This is lightweight, has no Clerk SDK lock-in, and supports networkless verification after the initial JWKS key fetch.

**Library:** `PyJWT[crypto]>=2.8.0` (includes `cryptography` for RS256)

### 3.2 JWKS Endpoint

Clerk publishes public keys at:
```
https://<clerk-frontend-api-slug>.clerk.accounts.dev/.well-known/jwks.json
```

The slug is found in the Clerk Dashboard. Example: `https://verb-noun-00.clerk.accounts.dev/.well-known/jwks.json`

**Configuration variable:** `CLERK_JWKS_URL` in backend `.env`

### 3.3 Token Verification Steps

1. Extract token from `Authorization: Bearer <token>` header
2. Fetch signing key from JWKS (cached for 1 hour by PyJWKClient)
3. Decode and verify: RS256 signature, `exp`, `nbf`, `iat` claims
4. Validate `azp` (authorized party) against `CLERK_AUTHORIZED_PARTIES` list
5. Return decoded claims (contains `sub` = user ID, `sid` = session ID)

### 3.4 Key Clerk JWT Claims

| Claim | Description | Validation |
|-------|-------------|------------|
| `sub` | User ID (`user_2abc...`) | Present |
| `azp` | Authorized party (frontend origin) | Must be in allowed list |
| `exp` | Expiration | Not expired (5s leeway) |
| `nbf` | Not before | Not before current time |
| `iat` | Issued at | Valid timestamp |
| `iss` | Issuer (Clerk frontend API URL) | Informational |
| `sid` | Session ID | Informational |

---

## 4. API Key Authentication (MCP Server & Agent)

### 4.1 Rationale

The MCP server and the backend's own agent module make server-to-server HTTP calls to the backend API. These are machine clients, not browser users — they have no Clerk session. A simple pre-shared API key is appropriate because:

- Both services run on the same infrastructure
- Clerk M2M tokens require network calls for verification (opaque tokens, not JWTs)
- A static API key is simple, fast, and sufficient for this trust level

### 4.2 Design

- New env variable: `API_KEY` in backend `.env`
- Clients send: `X-API-Key: <key>` header
- Backend compares against `API_KEY` using constant-time comparison (`hmac.compare_digest`)
- If `API_KEY` is not set (empty string), API key authentication is disabled (no machine clients can authenticate via key)

### 4.3 MCP Server Changes

- New env variable: `API_KEY` in MCP server `.env`
- `TaskAPIClient` adds `X-API-Key` header to all requests

### 4.4 Agent Internal Calls

- The agent's `AgentAPIClient` (in `backend/app/agent/api_client.py`) calls the backend's own API endpoints via HTTP
- It needs to include the `X-API-Key` header since those endpoints will now require auth
- Reads `API_KEY` from the backend's own settings (already available in-process)

---

## 5. Route Protection Strategy

### 5.1 Public Endpoints (no auth required)

| Method | Endpoint | Reason |
|--------|----------|--------|
| GET | `/` | Root info endpoint |
| GET | `/health` | Health checks (load balancers, monitoring) |
| GET | `/api/v1/docs` | Swagger UI (development convenience) |
| GET | `/api/v1/redoc` | ReDoc (development convenience) |
| GET | `/api/v1/openapi.json` | OpenAPI schema |

### 5.2 Protected Endpoints (auth required)

All endpoints under `/api/v1/` served by the routers:
- `tareas.router` — all CRUD + search
- `acciones.router` — all CRUD
- `estados.router_tareas` — all CRUD
- `estados.router_acciones` — all CRUD
- `responsables.router` — all CRUD
- `agent.router` — chat endpoint

### 5.3 Implementation: Router-Level Dependencies

Add `verify_auth` as a router-level dependency on each protected router, rather than on individual endpoints. This ensures all endpoints in the router are protected and avoids missing any endpoint.

```python
# In each router file:
router = APIRouter(
    prefix="/tareas",
    tags=["tareas"],
    dependencies=[Depends(verify_auth)],  # Added
)
```

---

## 6. New Module: `backend/app/auth.py`

### 6.1 Components

| Component | Description |
|-----------|-------------|
| `_jwks_client` | `PyJWKClient` instance (module-level, cached keys) |
| `_verify_jwt(token: str) → dict` | Decode and verify a Clerk JWT, return claims |
| `verify_auth(request: Request) → dict` | FastAPI dependency: try JWT, then API key, or 401 |

### 6.2 `verify_auth` Logic

```
1. Check Authorization header for "Bearer <token>"
   → If present, verify JWT via _verify_jwt()
   → On success, return {"type": "jwt", "user_id": sub, "claims": {...}}
   → On failure, raise 401

2. If no Bearer token, check X-API-Key header
   → If present and API_KEY is configured, compare with hmac.compare_digest
   → On success, return {"type": "api_key"}
   → On failure, raise 401

3. If neither header present, raise 401
```

### 6.3 Logging

- INFO: Successful JWT authentication (user_id, no token logged)
- INFO: Successful API key authentication
- WARNING: Failed authentication attempt (reason, client IP)
- DEBUG: JWT claim details (for troubleshooting)

---

## 7. Configuration Changes

### 7.1 Backend `.env` (new variables)

```env
# Authentication
CLERK_JWKS_URL=https://your-slug.clerk.accounts.dev/.well-known/jwks.json
CLERK_AUTHORIZED_PARTIES=["http://localhost:5173"]
API_KEY=                          # Pre-shared key for MCP server / service clients
```

### 7.2 Backend `config.py` (new settings)

```python
# Authentication
CLERK_JWKS_URL: str = ""
CLERK_AUTHORIZED_PARTIES: list[str] = ["http://localhost:5173"]
API_KEY: str = ""
```

### 7.3 MCP Server `.env` (new variable)

```env
API_KEY=                          # Must match backend API_KEY
```

### 7.4 MCP Server `config.py` (new setting)

```python
API_KEY: str = os.getenv("API_KEY", "")
```

---

## 8. Frontend Compatibility

### 8.1 Current State

The frontend already sends Clerk JWT tokens. From `frontend/src/api/client.js`:

```javascript
if (window.Clerk?.session) {
    const token = await window.Clerk.session.getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
}
```

### 8.2 Assessment

**No frontend changes required.** The existing interceptor:
- Sends `Authorization: Bearer <token>` — matches what the backend will expect
- Handles missing sessions gracefully (no token sent → backend returns 401 → Clerk redirects to sign-in)
- Already handles 401 responses in the response interceptor

### 8.3 Edge Case: `azp` Validation

The `azp` (authorized party) claim in Clerk JWTs contains the origin of the frontend that requested the token. The backend must list all valid frontend origins in `CLERK_AUTHORIZED_PARTIES`:
- Development: `http://localhost:5173`
- Production: the deployed frontend URL

This is already handled by `CORS_ORIGINS` for CORS — the same origins should appear in both lists.

---

## 9. Dependencies

### 9.1 New Backend Dependency

```toml
"PyJWT[crypto]>=2.8.0",
```

This pulls in:
- `PyJWT` — JWT decoding and verification
- `cryptography` — RS256 signature verification

### 9.2 No New MCP Server Dependencies

The MCP server only needs to add a static header — no new libraries required.

---

## 10. Error Responses

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| No auth header | 401 | `{"detail": "Authentication required"}` |
| Invalid/expired JWT | 401 | `{"detail": "Invalid or expired token"}` |
| Invalid API key | 401 | `{"detail": "Invalid API key"}` |
| JWT from unauthorized origin | 403 | `{"detail": "Unauthorized origin"}` |

---

## 11. Security Considerations

1. **JWKS Caching:** Keys are cached for 1 hour (PyJWKClient default). If Clerk rotates keys, there may be up to 1 hour of stale keys. The `lifespan` parameter can be tuned.
2. **Clock Skew:** 5-second leeway for `exp`/`nbf` validation to handle minor server time differences.
3. **API Key Security:** The `API_KEY` must be a strong random string (32+ chars). Never commit it to git. Use `hmac.compare_digest` for constant-time comparison to prevent timing attacks.
4. **No Token Logging:** JWT tokens and API keys are never written to logs. Only user IDs and auth results are logged.
5. **HTTPS:** The production deployment must use HTTPS to protect tokens in transit.
