# Requirements Prompt for feature_026

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_026/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_026/plan.md' in order to do that.

## Feature Brief

Architecture documents currently located directly in `specs/` should be moved into a dedicated `specs/architecture/` subfolder to improve project organization and keep the specs directory clean.

## User Story

As a developer, I want the architecture documents organized in a dedicated `specs/architecture/` folder so that the `specs/` directory is cleaner and architecture-related files are grouped together logically.

## Key Requirements

### Requirement 1: Move architecture documents to specs/architecture/

Move the following files from `specs/` to `specs/architecture/`:
- `specs/architecture_management.md` → `specs/architecture/architecture_management.md`
- `specs/architecture_backend.md` → `specs/architecture/architecture_backend.md`
- `specs/architecture_frontend.md` → `specs/architecture/architecture_frontend.md`

### Requirement 2: Update all references

Update all references to these architecture files throughout the codebase, including:
- `CLAUDE.md`
- `README.md`
- Any feature requirements/specs/plans that reference these files
- Any other files that contain paths to the architecture documents

### General Requirements

- The architecture should follow the file specs/architecture/architecture_backend.md and specs/architecture/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_backend.md, specs/architecture/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- Use `git mv` to preserve git history when moving files.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
