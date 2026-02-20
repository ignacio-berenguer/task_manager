# Requirements Prompt for feature_065

I have a new feature request. Follow the "Architect First" protocol: create spec.md and plan.md before writing code. Notify me when the documents are ready.

Please create a './specs/features/feature_065/specs.md' and './specs/features/feature_065/plan.md' in order to do that.

## Feature Brief

Chatbot improvements: (1) Persist conversation across page navigation so it is not lost when the user moves to a different page and comes back; (2) Make portfolio_id references in chatbot responses clickable links that navigate to the Detail page; (3) Preserve the chatbot's "thinking" text (which currently disappears when the response starts streaming) and display it in a collapsible accordion so the user can review the reasoning process; (4) Have the chatbot explicitly explain the assumptions and calculations it made in its answer (e.g., "considering only Importe in year XXXX", "excluding initiatives in estado Cancelado").

## User Story

As a user, I want the chatbot to persist my conversation when I navigate between pages, link portfolio IDs to their detail pages, show me its reasoning process, and explain the assumptions behind its answers, so that I can have a more reliable, transparent, and navigable chatbot experience.

## Key Requirements

### Requirement 1: Persist conversation across navigation

The chatbot conversation should not be lost when the user navigates to a different page and returns. The conversation history (messages, context) should be stored in a way that survives React Router navigation. This could use React state lifted above the router, a global store, or localStorage persistence.

### Requirement 2: Clickable portfolio_id links in chatbot responses

When the chatbot mentions a `portfolio_id` in its responses (e.g., in tables, lists, or inline text), those IDs should be rendered as clickable links that navigate to `/detail/{portfolio_id}`. This should work for all response formats (markdown tables, bullet lists, inline mentions).

### Requirement 3: Preserve and display thinking/reasoning text

The chatbot's "thinking" or reasoning text (the intermediate processing that occurs before the final answer streams) is currently lost once the response begins. This text should be captured and stored alongside the assistant message. It should be displayed in a collapsible accordion/expandable section below or above the response, allowing the user to optionally review the chatbot's reasoning process.

### Requirement 4: Explain assumptions and calculations in answers

The chatbot should explicitly state the assumptions and calculation methodology used when answering questions. For example: which year's importe was considered, which estados were excluded (e.g., Cancelado), what filters were applied, etc. This should be part of the chatbot's system prompt instructions so it consistently provides this transparency.

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
