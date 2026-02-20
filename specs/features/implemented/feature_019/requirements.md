# Requirements Prompt for feature_019

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_019/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_019/plan.md' in order to to that.

## Feature Brief

Start implementing the capability to modify daa entities, following this parttern:
(1) create JSON diff
(2) store JSON diff in a transacciones_json table
(3) process the transaciones updating / creating / removing the registers in the database and excel file

## User Story

As a user, I want to have the capability to create / update / delete records in the data entities, reflecting the changes not only in the database and also the table.

## Key Requirements

### Requirement 1: Architecture for data update and register of diff transacciones_json

Updating the data in this system is not simple. It is needed that the changes are committed both in the database and in the source excel files.

In order to make this, we are going to implement the following architecture:

(1) The user will be able to edit the data or create new records in a dedicated modal form foreach entity

(2) Once the update is registered, the user will need to enter a "commit message" for the transaction, for explaining the reasons of the change

(3) The diff of the transaction will be defined in a JSON object, that will contain the data entity to be modified, the type of operation (INSERT / UPDATE / DELETE) the primary key of the entity to be modified, the changes (only the changes, data not changed will not be part of the diff), the user that requested the operation, the commit message, and the timestamp

(4) The transaction will be stored in a table transacciones_json, with a status pending execution in database, pending execution in excel.

### Requirement 2: Process for executing the diff transaciones (database implementation)

There will be 2 processes that execute the following:

(1) Take the transacciones_json table, for all the records pending execution in database, and applies the changes to the database. It will change the status of execution in database and register a timestamp in the transacciones_json record for the time of application to the database.

(2) Take the transacciones_json table, for all the records pending execution in excel, and applies the changes to the excel source. It will change the status of execution in excel and register a timestamp in the transacciones_json record for the time of application to the excel. THIS PROCESS WILL BE IMPLEMENTED IN A FUTURE feature

### Requirement 3: Implement a report for the transacciones_json table

Similar to reports already implemented, please implement a report in the frontend, with the required backend endpoints for viewing the transacciones_json table. Make reasnable assumptions for filtering, default columns and default order.

### Requirement 5: Modal edit form for Notas entity

Implement a modal form for creating, editing, and deleting Notas from the Detail Page. This serves as the first concrete use of the transacciones_json infrastructure and as a proof-of-concept for future entity edit modals.

- The modal should be accessible from the Notas section in the Detail Page via "Add Nota" and "Edit" buttons
- On save, the modal creates a transacciones_json record (not a direct DB write) and immediately triggers the processor to apply it
- The modal should include a "commit message" field explaining the reason for the change
- Delete should be available from the edit modal with a confirmation step

### Requirement 6: complete logging of the functionality

The functionalirty described in this feature must have complete logging, in a similar way to the rest of the application.

### General Requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md and specs/architecture_frontend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
