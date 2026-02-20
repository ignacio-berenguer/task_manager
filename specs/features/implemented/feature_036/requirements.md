# Requirements Prompt for feature_036

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a 'C:/Users/ignac/dev/portfolio_migration/specs/features/feature_036/specs.md' and 'C:/Users/ignac/dev/portfolio_migration/specs/features/feature_036/plan.md' in order to do that.

## Feature Brief

I want to redesign the home page. (1) In the home page I want to remove all the sections except the first one. (2) In the first section remove the "Solicitar Demo" button and the "Explorar funcionalidades" button. (3) Add a section "Change log" in which there is a summary of all the features added (from most recent to oldest). The changelog section should be a summary of all the features implemented. Please add to the architecture_frontend.md document that all the new releases need to include the updating of the changelog section. (4) There should be some file in the source code to store the version number of the application NN.NNN. Every new feature should increase the version number (at least the minor version number). The minor version number should be equal to the most recent feature implemented number. The version number should be shown in the changelog section, in every feature. The major version number should be always 0 at this point, but we may want to increment it in the future.

## User Story

As a visitor of the landing page, I want to see a clean hero section followed by a changelog so I can quickly understand what the application does and what features have been recently added, with clear version numbering.

## Key Requirements

### Requirement 1: Simplify the Landing Page

- Remove all sections from the landing page except the first hero section
- The hero section should remain with its current content minus the buttons specified in Requirement 2

### Requirement 2: Remove Action Buttons from Hero Section

- Remove the "Solicitar Demo" button from the hero section
- Remove the "Explorar funcionalidades" button from the hero section

### Requirement 3: Add Changelog Section

- Add a new "Change Log" section below the hero section
- Display a summary of all implemented features, ordered from most recent to oldest
- Each changelog entry should show the version number associated with that feature
- The changelog data should be maintained in a structured format in the source code
- The initial changelog must be pre-populated with entries for all 35 already-implemented features (feature_001 through feature_035). Review each feature's specs/requirements to write a brief summary for each entry.
- Update `specs/architecture/architecture_frontend.md` to document that all new releases must include updating the changelog section

### Requirement 4: Application Version Number

- Create a version file in the source code to store the application version number in format `MAJOR.MINOR` (e.g., `0.036`)
- The minor version number should correspond to the most recent feature implemented number
- The major version number starts at 0 and can be incremented in the future
- Every new feature implementation should increment at least the minor version number
- The version number should be displayed in the changelog section alongside each feature entry

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
