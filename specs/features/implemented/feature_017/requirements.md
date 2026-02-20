# Requirements Prompt for feature_017

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a '/home/nacho/dev/portfolio_migration/specs/features/feature_017/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_017/plan.md' in order to to that.

## Feature Brief

Improvements in management command

## User Story

As a user, I want to be able to launch a command to the migration process called "recreate_tables" that removes all the tables in the database. Then the command "full_calculation_datos_relevantes" should not include the execution of the "init" command, but only the following: recreate_tables → migrate → calculate → export.

As a data architect, I want a clean database structure.

## Key Requirements

### Requirement 1: Create "recreate_tables" command and change the "full_calculation_datos_relevantes"

As a user, I want to be able to launch a command to the migration process called "recreate_tables" that removes all the tables in the database. Then the command "full_calculation_datos_relevantes" should not include the execution of the "init" command, but only the following: recreate_tables → migrate → calculate → export. Log the operations to log file and to screen.

### Requirement 2: Remove calculated fields from the data model

The current data model in the database includes many calculated fields (mostly from datos_descriptivos), that are completely duplicated. Main examples are:

- nombre
- digital_framework_level_1
- unidad
- referente_bi
- estado_de_la_iniciativa
- cluster_2025
- origen
- please identify additional fields that are redundant

I want to simplify the data model eliminating these fields in the database tables (except for datos_relevantes, iniciativas). Please take important note that the iniciativas and datos_relevantes table should not be changed, as they are redundant tables by desigh.

In any case, make your proposal I'll review the list of the fields you want to eliminate in the specs.md you propose and modify it to match what I really want.

The calculation of datos_relevantes should not be affected by this change, make sure it still works.

The API signature should remain unchanged, as you have to implement the changes in the API endpoints will search for those fields in the data model when preparing the API response.

### Requirement 3: change name to field cluster_2025

The field cluster_2025 name should be changed to cluster. Important to update not only the database but also all the processes, the API, the frontend.

### Requirement 4: Summary instructions .md file

Prepare a short instructions.md file in the proyecto root folder with the different commands that I should use for the migration process, for starting the backend process, for starting the frontend process, for debugging (backend or migration). Include instructions such as cd <folder> or whatever is needed.

### Requirement 5: Migration of Dependencias table

There is a new Dependencias table in the excel source file. I want to migrate it also to the database. Create API endpoints. Add the dependencias table to the detail page in the frontend (bottom of the page).

### Reqirement 6

Add the wbe table to the detail page in the frontend (bottom of the page).

### General Requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture_frontend.md document after all the changes are done.
- All the configuration needed should be stored in a .env file
- All the operations should be logged to a log file configured in .env file. The default debugging level will be INFO but it can be changed in the .env file
- The most important operations will be also logged to the console
- The architecture should follow the file specs/architecture_backend.md

## Constraints

- The existing application functionality from previuos versions should be maintained as is, expect for the changes in this feature.

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
