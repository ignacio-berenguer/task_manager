# Requirements Prompt for feature_007

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

I have created a '/home/nacho/dev/portfolio_migration/specs/features/feature_007/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_007/plan.md' in order to to that.

## Feature Brief

New command to execute an end-to-end calculation of the target excel file. Minor improvements (log file)

## User Story

As a wnat, I want to be ableto execute a complete process with just one command.

## Key Requirements

### Requirement 1: New command full_calculation_datos_relevantes

Implement a new command full_calculation_datos_relevantes that:

- Initializes the db. Even if the db already exists, it should proceed without requesting user confirmation
- Migrates data
- Calculates datos_relevantes
- Generates the output excel

Propose the structure in the specs.md and I will review.

### Requirement 2: Improve log file

In the log file there are some lines that do not start with the format:

YYYY-MM-DD HH:MM:SS - <module name> - <LOG_LEVEL> - ...

such as:

"============================================================"

OR

"### PHASE 6: Additional Tables"

The requirement is to ensure that all log files start with

YYYY-MM-DD HH:MM:SS - <module name> - <LOG_LEVEL> - ...

Also there is a strange line in the log file with a newline character in the middle, please fix it:

"2026-01-31 14:06:42 - portfolio_migration - INFO -
============================================================"

### Requirement 3: improve to onscreen console output

In the onscreen console output, there are some lines that do not start with

<LOG LEVEL>:

Such as:

"### PHASE 6: Additional Tables ###"

✓ Migration completed successfully!

Read 26568 benefit records from sheet: Beneficios
Skipping historical snapshot sheet: Beneficios_copia_20251028
Skipping historical snapshot sheet: Beneficios_copia_20251028-2

Please ensure that all the lines displayed to the console start with <LOG LEVEL>:

Also there are some lines siplayed to the console that have a weird new line inside, please fix it:

"INFO -
============================================================"

## Requirement 4: fix warning displayed to console

The following warning is being displayed to the console:

/home/nacho/dev/portfolio_migration/.venv/lib/python3.12/site-packages/openpyxl/worksheet/\_reader.py:329: UserWarning: Data Validation extension is not supported and will be removed

Please fix it.

### General requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture.md document after all the changes are done.

## Constraints

- The existing application functionality from previuos versions should be maintained as is.

- Do not modify existing calculation or database model, other than the estado_iniciativa and estado_especial

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
