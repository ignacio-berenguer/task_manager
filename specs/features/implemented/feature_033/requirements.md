# Requirements Prompt for feature_033

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_033/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_033/plan.md' in order to do that.

## Feature Brief

In order for the transacciones_json process to correctly update the excel_source files, we need to ensure that we use custom "primary key columns" for the different database tables that are represented in the Excel. In this feature we are going to define the "excel primary key columns" for the different entities, that do not always need to exactly map to the database tables. We will need to have a central configuration file for this mapping, so that the backoffice process that processes the transacciones_json can work properly. Probably, it will also be needed to include the information about the excel "primary key columns" in the transacciones_json. Special care will need to be taken when we are changing the contents of a "primary key column in the Excel". Also in this feature we want to add the requirement to represent all the transacciones_json fields in the Detail page.

## User Story

As a portfolio manager, I want the transacciones_json Excel write-back process to use the correct primary key columns for each entity type so that changes are applied to the correct rows in the Excel source files. Additionally, I want to see all transacciones_json fields displayed in the Detail page so I can review the full transaction history for any initiative.

## Key Requirements

### Requirement 1: Excel Primary Key Column Configuration

Define a central configuration file (or module) that maps each database entity/table to its corresponding "Excel primary key columns". These keys may differ from the database primary keys, since Excel workbooks have their own row-identification logic. The configuration should be easily maintainable and extensible.

### Requirement 2: Include Excel Primary Key Info in transacciones_json

When creating transacciones_json records, include the relevant Excel primary key column values so the write-back process can locate the correct row in the Excel file. This may require changes to how transacciones_json entries are generated (e.g., in the transaction processor or CRUD operations).

### Requirement 3: Handle Changes to Excel Primary Key Columns

When a transaction modifies a value that is part of the Excel primary key, special handling is needed:
- The old primary key values must be preserved so the write-back process can find the original row
- The new primary key values must be recorded so the row can be updated correctly
- Edge cases (e.g., creating a new row, deleting a row) must be handled properly

### Requirement 4: Display All transacciones_json Fields in the Detail Page

Add a section (or enhance an existing section) in the Detail page that displays all fields from transacciones_json records for the given portfolio_id. This should show the complete transaction history including JSON diffs, timestamps, commit messages, and any new Excel primary key metadata.

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
