# Requirements Prompt for feature_021

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_021/specs.md' and './specs/features/feature_021/plan.md' in order to do that.

## Feature Brief

In the chat, if the user asks a question similar to "qué tengo que hacer?" and you do not know who the user is (so you cannot filter by responsable), the AI agent should ask the user for their name before proceeding with the query.

## User Story

As a user, I want the AI chat assistant to ask me for my name when I ask about my pending tasks and it doesn't know who I am, so that the assistant can filter results by my name as the responsable.

## Key Requirements

### Requirement 1: Detect identity-dependent queries

When the user sends a message that implies filtering by responsable (e.g., "qué tengo que hacer?", "cuáles son mis tareas?", "qué tareas tengo pendientes?"), and the agent does not yet know the user's identity, it should detect this and ask the user for their name instead of returning unfiltered results.

### Requirement 2: Remember user identity within conversation

Once the user provides their name in the conversation, the agent should remember it for the remainder of the chat session and use it to filter by `responsable` in subsequent queries.

### Requirement 3: Use name to filter by responsable

After obtaining the user's name, the agent should use it to search tasks where `responsable` matches (using ilike/partial matching) and return the relevant results.

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
