# Requirements Prompt for feature_010

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

I have created a '/home/nacho/dev/portfolio_migration/specs/features/feature_010/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_010/plan.md' in order to to that.

## Feature Brief

Refactoring of the applciation so that portfolio_migration becomes a module of a bigger application.

## User Story

As a user, I want to be able to move all the current functionality to a management module, allowing me to create a backend module and a frontend module, .

## Key Requirements

### Requirement 1: The current functionality becomes part of the management module

I want to move the main.py, the schema.sql, the copy_excel_sources.sh, the src folder, and even the pyproject.toml, .python-version, .env, .env-example and uv.lock, and quite possibly the Python .venv to a management folder.

All the functionality developed so far will be executed from the management folder.

The log will be stored in a logs folder in the project root directory.

The specs folder will also be in the project root directory.

Create then a backend folder for the backend module and a frontend folder for the frontend module.

Test that everything still works properly.

### General requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture.md document after all the changes are done.

## Constraints

- The existing application functionality from previuos versions should be maintained as is.

- Do not modify existing calculation or database model, other than the estado_iniciativa and estado_especial

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
