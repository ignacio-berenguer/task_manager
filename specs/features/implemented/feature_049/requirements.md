# Requirements Prompt for feature_049

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_049/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_049/plan.md' in order to do that.

## Feature Brief

Implement a **Trabajos** menu item in the frontend navbar. This menu provides access to backend management operations directly from the browser, with real-time console output displayed in a dialog.

The Trabajos menu should include the following items:

1. **Proceso completo** — equivalent of launching `management complete_process` (full pipeline: recreate + migrate + calculate + export + scan)
2. **Escanear documentos** — equivalent of launching `management scan_documents`
3. **Sumarizar documentos** — equivalent of launching `management summarize_documentos`

The output that each command produces to the console should be displayed in real-time in a "console window" dialog box in the browser, allowing the user to monitor progress without switching to a terminal.

## User Story

As a portfolio administrator, I want to trigger management operations (full process, document scanning, document summarization) directly from the web application and see their console output in real-time, so that I don't need terminal access to run these tasks.

## Key Requirements

### Requirement 1: Trabajos Navbar Menu

- Add a "Trabajos" dropdown menu item to the existing navbar
- The menu should contain three items: "Proceso completo", "Escanear documentos", "Sumarizar documentos"
- Each menu item triggers the corresponding backend management command

### Requirement 2: Backend API Endpoints for Management Commands

- Create backend API endpoints that execute the management CLI commands
- Endpoints needed:
  - `POST /api/v1/trabajos/proceso-completo` — runs `complete_process`
  - `POST /api/v1/trabajos/escanear-documentos` — runs `scan_documents`
  - `POST /api/v1/trabajos/sumarizar-documentos` — runs `summarize_documentos`
- Each endpoint should stream or provide real-time output back to the frontend

### Requirement 3: Console Output Dialog

- When a trabajo is launched, open a dialog/modal that displays the command's console output in real-time
- The dialog should have a terminal/console-like appearance (dark background, monospace font)
- Output should auto-scroll as new lines appear
- The dialog should indicate when the process is running vs. completed (with success/failure status)
- The user should be able to close the dialog (but ideally the process continues in background)

### Requirement 4: Real-Time Output Streaming

- Investigate and implement the best approach for streaming console output to the browser:
  - Server-Sent Events (SSE)
  - WebSocket
  - Polling with buffered output
- The chosen approach should provide near real-time output display

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
