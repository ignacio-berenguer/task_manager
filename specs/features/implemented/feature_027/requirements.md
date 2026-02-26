# Requirements Prompt for feature_027

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_027/specs.md' and './specs/features/feature_027/plan.md' in order to do that.

## Feature Brief

In the application navbar, next to the Task Manager logo and label, display the version number of the application. Also update the project documentation (CLAUDE.md) so that the version displayed in the navbar is considered every time there is a new changelog entry.

## User Story

As a user, I want to see the current application version in the navbar so I can quickly identify which version I'm using.

## Key Requirements

### Requirement 1: Display version number in the navbar

- Show the application version (from `frontend/src/lib/version.js`) next to the "Task Manager" logo/label in the navbar.
- The version should be styled subtly (smaller, muted color) so it doesn't compete with the app name.
- The version should update automatically when `version.js` changes — no hardcoded strings.

### Requirement 2: Update project documentation

- Update `CLAUDE.md` so that the "Post Implementation Checklist" explicitly mentions that the version displayed in the navbar comes from `version.js` and is automatically kept in sync with the changelog.
- This ensures future features always bump the version correctly.

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
