# Requirements Prompt for feature_010

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_010/specs.md' and './specs/features/feature_010/plan.md' in order to do that.

## Feature Brief

Export API endpoint. (1) Create an export API that exports all the information of the database in a JSON format. That JSON should contain all the information of the database and it could be used to restore the database if needed. (2) Create a new menu Administrator in the navbar. (3) Under Administrator menu, create an option "Export database to JSON" that should trigger the export API and download the .json file.

## User Story

As an administrator, I want to export the entire database contents as a JSON file so that I can create backups and restore the database if needed.

## Key Requirements

### Requirement 1: Export API Endpoint

Create a new backend API endpoint that exports all database tables (tareas, acciones_realizadas, estados_tareas, estados_acciones, responsables) into a single JSON structure. The JSON output must contain all records from every table with all fields, structured in a way that allows full database restoration from the exported file.

### Requirement 2: Administrator Menu in Navbar

Add a new "Administrator" menu item to the frontend navbar. This should be a dropdown/submenu that groups administrative actions together, keeping the navigation clean and organized.

### Requirement 3: Export Database to JSON Option

Under the Administrator menu, add an "Export database to JSON" option. When clicked, it should call the export API endpoint and trigger a browser download of the resulting .json file. The downloaded file should have a meaningful name (e.g., including a timestamp).

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
