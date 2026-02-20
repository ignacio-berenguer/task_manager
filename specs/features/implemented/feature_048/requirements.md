# Requirements Prompt for feature_048

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_048/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_048/plan.md' in order to do that.

## Feature Brief

In the management module, the `.env` file structure has become confusing due to repeated long paths and inconsistent variable naming. Refactor the `.env` configuration so that:

1. **Base directories are defined once** — Input and output folder paths should be declared as base variables (e.g., `EXCEL_SOURCE_DIR`, `EXCEL_OUTPUT_DIR`, `DOCUMENTS_DIR`) and then individual file names reference these bases, eliminating path repetition.
2. **Variable names are homogenized** — All environment variable names should follow a consistent naming convention (e.g., consistent prefixes, consistent use of `_DIR` vs `_PATH` vs `_FILE` suffixes).
3. **All consuming code is updated** — The management module's `settings.py` and any other code that reads `.env` variables must be updated to use the new variable names and the base-path + filename composition pattern.
4. **Both `.env` and `.env.example` are updated** — The actual `.env` file and the `.env.example` template must reflect the new structure with clear comments.
5. **Documentation is updated** — The architecture docs (`specs/architecture/architecture_management.md`), `README.md`, and `CLAUDE.md` must be updated to reflect the new `.env` structure.

## User Story

As a developer working on the management module, I want the `.env` file to have a clean, DRY structure with consistent variable naming so that I can easily understand and maintain the configuration without confusion from repeated paths or inconsistent names.

## Key Requirements

### Requirement 1: Define base directories once

Introduce base directory variables (e.g., `EXCEL_SOURCE_DIR`, `EXCEL_OUTPUT_DIR`) and have individual file variables use just the filename. The `settings.py` module should compose full paths by combining base directory + filename at runtime.

### Requirement 2: Homogenize variable naming

Audit all current `.env` variables and establish a consistent naming convention:
- Use `_DIR` suffix for directories
- Use `_FILE` suffix for individual filenames
- Use consistent prefixes to group related variables
- Remove any redundant or deprecated variables

### Requirement 3: Update management module code

Update `management/src/config/settings.py` and any other files that read from `.env` to use the new variable names and path composition logic. Ensure all CLI commands (`manage.py`) continue to work correctly.

### Requirement 4: Update `.env` and `.env.example`

Rewrite both files with:
- Clear section comments
- The new DRY variable structure
- Sensible defaults in `.env.example`

### Requirement 5: Update documentation

- Update `specs/architecture/architecture_management.md` with the new config structure
- Update `README.md` management section
- Update `CLAUDE.md` if it references management `.env` variables

### General Requirements

- The architecture should follow the file specs/architecture/architecture_management.md
- Update the README.md document after all the changes are done.
- Update the relevant architecture docs (specs/architecture/architecture_management.md) after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console

## Constraints

- The existing application functionality from previous versions should be maintained as is, except for the changes in this feature.
- All management CLI commands must continue to work identically after the refactor.
- The backend module's `.env` is out of scope — only the management module's `.env` is being refactored.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
