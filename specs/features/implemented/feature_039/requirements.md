# Requirements Prompt for feature_039

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_039/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_039/plan.md' in order to do that.

## Feature Brief

With regards to the write-back to Excel tables capability, I have noticed that it fails in case the Excel file is open on the same PC that I'm executing the process. In order to fix this, I think the solution is to check if the file is open, and in that case do not open it again, but refer to the open instance in order to update it. Then when the process finishes updating, do not close the Excel file. Also I'd like to add additional log messages in debug mode to have more information about what the write-back to Excel is doing.

## User Story

As a user, I want the Excel write-back process to succeed even when the target Excel file is already open on my PC, so that I don't have to manually close Excel before running the process. I also want detailed debug-level logging so I can troubleshoot any issues with the write-back process.

## Key Requirements

### Requirement 1: Handle already-open Excel files

When the write-back process targets an Excel file that is already open in Excel on the same machine:
- Detect whether the file is currently open by an Excel instance
- If the file is open, connect to the existing Excel instance instead of launching a new one
- Use the already-open workbook reference to perform the updates
- After updates are complete, do NOT close the Excel file — leave it open for the user

### Requirement 2: Normal behavior when file is not open

When the target Excel file is NOT open:
- Open the file as usual (current behavior)
- After updates are complete, close the file as usual (current behavior)

### Requirement 3: Enhanced debug logging for write-back process

Add detailed log messages at DEBUG level throughout the Excel write-back process, including:
- Which file is being targeted and whether it was detected as already open
- Which sheets are being updated
- Which cells/ranges are being written to
- Summary of rows written per sheet
- Timing information for the overall process and per-sheet operations
- Any errors or warnings encountered during write-back

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
