# Requirements Prompt for feature_029

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_029/specs.md' and './specs/features/feature_029/plan.md' in order to do that.

## Feature Brief

Improvements to the application backend and frontend. Three enhancements:

1. **Application version in backend/management logs**: Display the application version (the same version shown in the frontend header, sourced from `frontend/src/lib/version.js`) in the log information displayed by the backend server on start, and also in the management process. The version source must be kept in sync automatically so that when new versions are produced, all modules reflect the updated version without manual duplication.

2. **README.md as a web page (Ayuda)**: Serve the project's `README.md` as a rendered web page accessible from the frontend. A new navbar menu item called "Ayuda" should link to this page. The backend should expose the README content, and the frontend should render it as formatted HTML.

3. **Environment variables logging on backend start**: Ensure that the backend process displays in the log file and console the value of all environment variables on start. Sensitive values (passwords, API keys) must be masked with `***`.

## User Story

As a developer/operator, I want to see the application version and configuration values when the backend starts, so I can quickly verify which version is running and confirm its configuration. As a user, I want to access the application help/documentation (README) from within the app via an "Ayuda" menu item.

## Key Requirements

### Requirement 1: Application version in backend and management startup logs

- Extract the canonical application version from `frontend/src/lib/version.js` (or establish a shared version source readable by Python modules).
- Display the version prominently in the backend FastAPI startup log (both console and log file).
- Display the version in the management CLI startup log.
- The version must stay in sync automatically when updated (avoid manual duplication across modules).

### Requirement 2: README.md accessible as a web page (Ayuda)

- The backend should expose an endpoint that serves the content of the project's `README.md`.
- The frontend should add a new route (e.g., `/ayuda`) that fetches and renders the README as formatted HTML.
- A new navbar menu item called "Ayuda" should navigate to this page.
- The page should be accessible to authenticated users (protected route).

### Requirement 3: Environment variables logging on backend start

- On startup, the backend should log all relevant environment/configuration variables to both console and log file.
- Sensitive variables (any containing "password", "key", "secret", or similar) must have their values replaced with `***` in the log output.
- The log format should be clear and easy to read.

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
