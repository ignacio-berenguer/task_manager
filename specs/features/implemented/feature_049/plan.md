# Implementation Plan — feature_049: Trabajos Menu

## Phase 1: Backend — Configuration & Router

### Step 1.1: Add configuration settings
- **File**: `backend/app/config.py`
- Add `MANAGEMENT_DIR: str = "../management"` and `UV_EXECUTABLE: str = "uv"` to the `Settings` class
- **File**: `backend/.env`
- Add `MANAGEMENT_DIR=../management` and `UV_EXECUTABLE=uv`

### Step 1.2: Create trabajos router
- **File**: `backend/app/routers/trabajos.py` (NEW)
- Module-level `_current_job` dict for singleton tracking (`command`, `start_time`, `pid`, `running`)
- Helper `async def _stream_subprocess(command_name, args)`:
  - Resolve management directory from `settings.MANAGEMENT_DIR`
  - Validate directory exists
  - Set `_current_job` to running
  - Launch subprocess via `asyncio.create_subprocess_exec`
  - Yield SSE `status: running` event
  - Read stdout/stderr concurrently using `asyncio.create_task` on both streams
  - Yield each line as SSE `output`/`error` event
  - On process completion, yield `status: completed`/`status: failed` with exit code
  - Clear `_current_job`
- `POST /proceso-completo` → calls `_stream_subprocess("proceso-completo", ["complete_process"])`
- `POST /escanear-documentos` → calls `_stream_subprocess("escanear-documentos", ["scan_documents"])`
- `POST /sumarizar-documentos` → calls `_stream_subprocess("sumarizar-documentos", ["summarize_documentos"])`
- `GET /status` → returns `_current_job` state
- All POST endpoints return `StreamingResponse(media_type="text/event-stream")`
- All POST endpoints check `_current_job["running"]` first → 409 if busy

### Step 1.3: Register router in main.py
- **File**: `backend/app/main.py`
- Import `trabajos` from routers
- Add `app.include_router(trabajos.router, prefix=settings.API_PREFIX)` in a new "Trabajos" section

## Phase 2: Frontend — ConsoleDialog Component

### Step 2.1: Create ConsoleDialog
- **File**: `frontend/src/components/shared/ConsoleDialog.jsx` (NEW)
- Uses the existing `Dialog`/`DialogContent` components as base
- Overrides dialog content styling for terminal look (dark bg, monospace)
- Props: `open`, `onClose`, `title`, `endpoint`
- State: `lines[]`, `status` (idle/running/completed/failed), `startTime`, `exitCode`
- On open + endpoint set:
  - `fetch(POST endpoint)` with streaming
  - Read `response.body.getReader()` → `TextDecoderStream`
  - Parse SSE events (split by `\n\n`, parse `event:` and `data:` fields)
  - Append parsed lines to state
  - Update status from `status` events
- Output area:
  - `div` with `overflow-y-auto`, `max-h-[60vh]`
  - Dark background (`bg-zinc-950 text-zinc-200`)
  - Each line rendered as `<div>` with monospace font
  - stderr lines in `text-red-400`
  - Auto-scroll via `useRef` + `scrollIntoView` on new lines
- Header: title + status badge (spinning dot when running, check/x when done)
- Footer: elapsed time display, close button

## Phase 3: Frontend — Navbar Integration

### Step 3.1: Convert Trabajos from link to dropdown
- **File**: `frontend/src/components/layout/Navbar.jsx`
- Remove `{ name: 'Trabajos', href: '/jobs', icon: Briefcase }` from `trailingNavItems`
- Add `trabajosItems` array with the three job definitions (name, command, icon)
- Add state: `const [consoleOpen, setConsoleOpen] = useState(false)` and `const [activeJob, setActiveJob] = useState(null)`
- Render a new `DropdownMenu` for Trabajos between the trailing nav items and Parametricas dropdown
- Each dropdown item `onClick`:
  - Set `activeJob` to `{ title, endpoint }`
  - Set `consoleOpen` to true
- Render `<ConsoleDialog>` at the bottom of the Navbar, controlled by `consoleOpen`/`activeJob`
- Update mobile menu similarly — add a "Trabajos" section with the three items

## Phase 4: Testing & Validation

### Step 4.1: Backend validation
- Start backend server (`uv run uvicorn app.main:app --reload`)
- Verify new endpoints appear in Swagger UI
- Test `GET /api/v1/trabajos/status` returns idle state
- Test `POST /api/v1/trabajos/escanear-documentos` streams output (curl with `--no-buffer`)
- Test singleton guard: attempt second POST while first is running → expect 409

### Step 4.2: Frontend validation
- `npm run build` to verify no compilation errors
- Test navbar: click Trabajos dropdown → see three items
- Test launching a job → console dialog opens with streaming output
- Test dialog close → dialog closes, job continues in background
- Test attempting second job while first runs → shows "job already running"

## Phase 5: Documentation & Versioning

### Step 5.1: Post-implementation checklist
1. Bump `APP_VERSION.minor` in `frontend/src/lib/version.js`
2. Add changelog entry in `frontend/src/lib/changelog.js`
3. Update `README.md` with Trabajos section
4. Update `specs/architecture/architecture_backend.md` (new router, SSE streaming)
5. Update `specs/architecture/architecture_frontend.md` (ConsoleDialog, navbar changes)
6. `/close_feature feature_049`
