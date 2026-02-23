# Requirements Prompt for feature_011

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_011/specs.md' and './specs/features/feature_011/plan.md' in order to do that.

## Feature Brief

Bulk inserts in database. The database is hosted on a remote server, and individual inserts result in a very slow migration process. The goal is to improve performance by replacing individual INSERT statements with bulk/batch insert operations across the management module and any other modules that perform database writes.

## User Story

As a system administrator, I want the migration process to use bulk inserts when writing data to the remote PostgreSQL database, so that the import from Excel completes significantly faster and reduces network round-trip overhead.

## Key Requirements

### Requirement 1: Bulk insert for migration engine

Replace individual INSERT statements in the management migration engine (`management/src/migrate/engine.py`) with bulk/batch insert operations. This should use PostgreSQL's ability to insert multiple rows in a single statement (e.g., `executemany`, `execute_values`, `COPY`, or SQLAlchemy bulk operations) to minimize network round-trips to the remote database.

### Requirement 2: Bulk insert for backend CRUD operations (if applicable)

Evaluate whether any backend endpoints (e.g., batch creation of tareas or acciones) would benefit from bulk insert support, and implement if appropriate.

### Requirement 3: Configurable batch size

The batch/chunk size for bulk inserts should be configurable via the `.env` file (the existing `BATCH_COMMIT_SIZE` setting or a new one), so it can be tuned based on network latency and dataset size.

### Requirement 4: Performance logging

Log timing information for bulk insert operations (total rows inserted, time elapsed, rows per second) so administrators can monitor and tune performance.

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- The migration must produce the same final database state as the current individual-insert approach.
- The bulk insert approach must respect the existing `BATCH_COMMIT_SIZE` or equivalent configuration for transaction commit boundaries.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
