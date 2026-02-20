# Requirements Prompt for feature_008

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

I have created a '/home/nacho/dev/portfolio_migration/specs/features/feature_008/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_008/plan.md' in order to to that.

## Feature Brief

Migration of transactions table.

## User Story

As a user, I want to be able to migrate the transactions table.

## Key Requirements

### Requirement 1: Migration of transactions table

In the excel source folder you will find a excel file "PortfolioDigital_Transacciones.xlsm".

For the development purposes, I have included a sample in the path: "specs/features/feature_008/sample_excel/PortfolioDigital_Transacciones.xlsm". You can use this file for development, but in execution you must use the file in excel_source.

I want to migrate the Excel table Transacciones that is in the Transacciones worksheet to the database, with a 1:1 column mapping, do not create additional columns in the database different to thos on the excel table.

### General requirements

- Update the README.md document after all the changes are done.
- Update the specs/architecture.md document after all the changes are done.

## Constraints

- The existing application functionality from previuos versions should be maintained as is.

- Do not modify existing calculation or database model, other than the estado_iniciativa and estado_especial

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
