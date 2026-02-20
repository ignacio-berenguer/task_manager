# Requirements Prompt for feature_023

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_023/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_023/plan.md' in order to do that.

## Feature Brief

Allow order columns in search pages.

## User Story

As a user, I want to be able to customize the order of the columns displayed in the Search page, and in the different reports of the application.

## Key Requirements

### Requirement 1: Allow column ordering

Add a general functionality to the application so that the user can modify the display order of the visible columns displayed in the Search, Hechos, LTP, Acciones...

The column order should be stored in browser storage, the same as the dipslayed columns.

It should be possible to restore the column order to the default settings.

### General Requirements

- The architecture should follow the file specs/architecture_backend.md and specs/architecture_frontend.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture_backend.md, specs/architecture_frontend.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
