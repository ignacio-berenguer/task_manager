# Requirements Prompt for feature_022

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_022/specs.md' and './specs/features/feature_022/plan.md' in order to do that.

## Feature Brief

Enhance the AI chat experience with contextual domain knowledge and a personalized greeting flow:

1. **Domain knowledge for the agent**: The chat agent should understand that tareas with estado "En curso" are the ones currently pending/active, and tareas with estado "Completado" are finished.
2. **User identity mapping**: When the logged-in user is `ignacio.berenguer@gmail.com`, the agent should know this corresponds to Responsable = "Ignacio" in the database. This allows the agent to answer questions like "what are my pending tasks?" by filtering on the correct responsable.
3. **Greeting on chat open**: The chat should greet the user the first time they access the chat page, or when they open a new chat conversation.
4. **Suggested questions**: The chat should offer a few typical starter questions to help the user get started, such as:
   - "Quieres saber que tienes que hacer hoy?"
   - "Quieres saber que tienes que hacer esta semana?"
   - "Quieres saber que tareas tienes pendientes?"

## User Story

As a user, I want the AI chat to understand the task status semantics (pending = "En curso", finished = "Completado"), recognize who I am based on my login email, greet me when I open the chat, and suggest common questions so I can quickly get useful information about my tasks.

## Key Requirements

### Requirement 1: Agent domain knowledge — status semantics

The agent's system prompt should include knowledge that:
- Estado "En curso" means the tarea is currently active/pending and needs attention.
- Estado "Completado" means the tarea is finished/done.
- Other estados should also be described if relevant (e.g., "Pendiente", "Cancelada").

### Requirement 2: User identity mapping (email to responsable)

- When a user sends a message to the chat, the backend should receive the user's email (from the Clerk JWT or frontend context).
- The agent should map known email addresses to their corresponding Responsable values (e.g., `ignacio.berenguer@gmail.com` -> "Ignacio").
- This mapping should be configurable (e.g., stored in .env or a config file) so new mappings can be added without code changes.
- When the user asks about "my tasks" or similar personal queries, the agent should automatically filter by the mapped responsable.

### Requirement 3: Chat greeting on first access / new chat

- The current chat page already has a greeting screen (from a different application context — "Asistente IA del Portfolio") that is **not applicable** to the Task Manager. It must be **replaced entirely** with a Task Manager-specific greeting.
- The new greeting should follow a similar UI layout pattern (icon/logo, title, subtitle, suggested questions), but with content relevant to the Task Manager application:
  - **Title**: Something like "Asistente IA de Tareas" (or similar Task Manager branding).
  - **Subtitle**: A short description like "Pregunta cualquier cosa sobre tus tareas, acciones, estados y responsables."
- When the user opens the chat page for the first time or starts a new conversation, this greeting screen should be displayed.
- The greeting should be personalized if the user's identity is known (e.g., "Hola Ignacio!").

### Requirement 4: Suggested starter questions

- The chat UI should display clickable suggested questions as part of the greeting screen, when the conversation is empty (no messages yet).
- Replace the current suggested questions (which reference "iniciativas", "presupuestos", "portfolio digital", "SPA_25_001" — all from the old app) with Task Manager-relevant questions:
  - "Quieres saber que tienes que hacer hoy?"
  - "Quieres saber que tienes que hacer esta semana?"
  - "Quieres saber que tareas tienes pendientes?"
- Clicking a suggestion should send it as a user message to the chat.

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
