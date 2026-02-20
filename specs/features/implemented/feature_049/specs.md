# Technical Specifications — feature_049: Trabajos Menu

## Overview

Add a "Trabajos" dropdown menu to the navbar that triggers backend management operations (complete_process, scan_documents, summarize_documentos) and streams their console output in real-time to a terminal-like dialog in the browser.

## Architecture

### Streaming Approach: SSE via POST + ReadableStream

**Decision**: Use FastAPI's `StreamingResponse` with `text/event-stream` content type, consumed on the frontend via `fetch()` + `response.body.getReader()`.

**Rationale**:
- `EventSource` (standard SSE) only supports GET — unsuitable since these operations have side effects (POST is more appropriate)
- WebSocket is overkill for unidirectional server→client streaming
- Polling adds latency and complexity for what is fundamentally a streaming use case
- `fetch` + `ReadableStream` works with POST, handles SSE-formatted events, and is widely supported

**Event Format** (SSE):
```
event: output
data: {"line": "Step 1/6: Recreating tables...", "stream": "stdout", "timestamp": "2026-02-14T10:30:00"}

event: status
data: {"status": "running", "command": "complete_process"}

event: status
data: {"status": "completed", "exit_code": 0, "duration_seconds": 45.2}

event: error
data: {"line": "Database not found", "stream": "stderr", "timestamp": "2026-02-14T10:30:05"}
```

### Backend: New Router `trabajos.py`

**Prefix**: `/trabajos`
**Tag**: `Trabajos`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/trabajos/proceso-completo` | Run `complete_process` pipeline |
| `POST` | `/trabajos/escanear-documentos` | Run `scan_documents` |
| `POST` | `/trabajos/sumarizar-documentos` | Run `summarize_documentos` |
| `GET` | `/trabajos/status` | Get current job status (is any job running?) |

#### Subprocess Execution

Each POST endpoint:
1. Checks that no other trabajo is currently running (singleton guard — one job at a time)
2. Launches the management CLI as an async subprocess: `uv run python manage.py <command>`
3. Returns a `StreamingResponse(media_type="text/event-stream")` that:
   - Sends a `status: running` event immediately
   - Reads stdout/stderr line by line from the subprocess
   - Sends each line as an `output` or `error` SSE event
   - Sends a `status: completed` or `status: failed` event when the process exits
4. The subprocess working directory is the management module directory

**Configuration** (added to `backend/.env` and `config.py`):
```env
MANAGEMENT_DIR=../management    # Path to management module (relative to backend/)
UV_EXECUTABLE=uv                # Path to uv binary (default: assumes in PATH)
```

**Singleton Guard**: A module-level `_current_job` dict tracks the currently running job (command name, start time, PID). If a request comes in while a job is running, return 409 Conflict.

**Key implementation details**:
- Use `asyncio.create_subprocess_exec` for non-blocking subprocess
- Merge stdout and stderr into a single stream (stdout as `output`, stderr as `error`)
- Handle process termination gracefully (send final status event)
- If the client disconnects mid-stream, the subprocess continues running but output is discarded
- Log start/end of each job to the backend log file

### Frontend: Navbar Changes

**Current state**: "Trabajos" is a direct link in `trailingNavItems` pointing to `/jobs`.

**New state**: Convert "Trabajos" to a dropdown menu (like "Informes" and "Parametricas") with three items. Each item triggers the job directly (no page navigation needed).

**Dropdown items**:
```js
const trabajosItems = [
  { name: 'Proceso completo', command: 'proceso-completo', icon: Play },
  { name: 'Escanear documentos', command: 'escanear-documentos', icon: FolderSearch },
  { name: 'Sumarizar documentos', command: 'sumarizar-documentos', icon: FileText },
]
```

Each item click:
1. Calls the corresponding POST endpoint
2. Opens the `ConsoleDialog` to display streaming output

### Frontend: ConsoleDialog Component

**Location**: `frontend/src/components/shared/ConsoleDialog.jsx`

**Appearance**:
- Full-width dialog (max-w-4xl) with dark background (`bg-gray-950` or `bg-zinc-950`)
- Monospace font (`font-mono`)
- Auto-scrolling output area
- Header shows job name + running status indicator (spinner)
- Footer shows elapsed time + success/failure badge when complete

**Props**:
```js
{
  open: boolean,
  onClose: () => void,
  title: string,          // e.g. "Proceso completo"
  endpoint: string,       // e.g. "/trabajos/proceso-completo"
}
```

**Behavior**:
1. On mount (when `open` becomes true and `endpoint` is set): send POST to endpoint
2. Read the SSE stream using `fetch` + `ReadableStream`
3. Parse SSE events, append lines to output buffer
4. Auto-scroll to bottom on each new line
5. Show spinner while running, green/red badge when completed/failed
6. Close button always available — closing dialog does NOT abort the backend process
7. If user reopens while a job is running, show a "job already running" message

**Line rendering**:
- stdout lines: default text color (light gray on dark)
- stderr lines: red/amber text
- Status lines (started/completed): green/blue

### Frontend: JobsPage Update

The existing placeholder `JobsPage` at `/jobs` will remain as-is for now. The Trabajos dropdown in the navbar is the primary interaction point. The `/jobs` route can be repurposed later for job history if needed, but that is out of scope for this feature.

Since "Trabajos" is now a dropdown (not a link), remove it from `trailingNavItems` and render it as a dropdown like Informes.

## File Changes Summary

### Backend (new/modified)
| File | Action | Description |
|------|--------|-------------|
| `backend/app/routers/trabajos.py` | **NEW** | Router with 4 endpoints |
| `backend/app/main.py` | MODIFY | Import and register trabajos router |
| `backend/app/config.py` | MODIFY | Add `MANAGEMENT_DIR`, `UV_EXECUTABLE` settings |
| `backend/.env` | MODIFY | Add new config vars |

### Frontend (new/modified)
| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/shared/ConsoleDialog.jsx` | **NEW** | Terminal-like dialog for streaming output |
| `frontend/src/components/layout/Navbar.jsx` | MODIFY | Convert Trabajos from link to dropdown with job triggers |

### Documentation
| File | Action |
|------|--------|
| `README.md` | Update |
| `specs/architecture/architecture_backend.md` | Update |
| `specs/architecture/architecture_frontend.md` | Update |
| `frontend/src/lib/version.js` | Version bump |
| `frontend/src/lib/changelog.js` | Changelog entry |

## Edge Cases & Error Handling

1. **Job already running**: Return 409 Conflict with message indicating which job is running
2. **Management directory not found**: Log error, return 500 with descriptive message
3. **uv not found**: Log error, return 500 with message suggesting uv installation
4. **Process crash**: Detect non-zero exit code, send `status: failed` event with exit code
5. **Client disconnect**: Backend process continues (fire-and-forget after stream breaks); singleton guard clears when process exits
6. **Long-running jobs**: No timeout enforced (complete_process can take minutes); the streaming connection stays open
7. **CORS**: The existing CORS middleware already allows the frontend origin; `text/event-stream` responses work through CORS
