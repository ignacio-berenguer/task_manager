# Requirements Prompt for feature_006

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

I have created a '/home/nacho/dev/portfolio_migration/specs/features/feature_006/specs.md' and '/home/nacho/dev/portfolio_migration/specs/features/feature_006/plan.md' in order to to that.

## Feature Brief

Refactoring of the code

## User Story

As a developer, I want to have a clean and easy to extend code archotecture.

## Key Requirements

### Requirement 1: Refactor the code

The functionality is OK, but the code structure has become a little complex, with very big files. I want also to prepare to add in the future additional commands.

Please restructure the code so that:

- The code except for the main.py is all inside a src folder
- The main.py does many things. Try to improve the readability by moving some utiliy such as logging to an independent .py file
- Inside src there is a folder for each command (init, migrate, calculate, export...). Probably there should also be a folder for config.py
- If there is a large file such as calculate.py, split it in several domains (i.e. one for estado* functions, one por importe* functions, one for ultimo*id* functions)

Propose the structure in the specs.md and I will review.

### General requirements

- Update the README.md document after all the changes are done.
- Inside the specs folder, document the architecture in the architecture.md document

## Constraints

- The application functionality should be maintained as is.

- Do not modify existing calculation or database model, other than the estado_iniciativa and estado_especial

## Final instructions

Analyze the current codebase and let me know when the docs are ready for review. Do not start making any modifications to the code until I review the documents and explicitly say so.
