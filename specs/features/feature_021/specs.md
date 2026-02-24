# Technical Specification — feature_021

## Feature: Agent asks for user identity on responsable-dependent queries

### Overview

When a user asks the AI chat assistant an identity-dependent question (e.g., "qué tengo que hacer?", "cuáles son mis tareas?"), the agent should recognize that it needs to know the user's name (responsable) to filter results. If the user's name has not been established in the current conversation, the agent must ask for it before running any search.

Once the user provides their name, the agent uses it for the current query and remembers it for the rest of the conversation session.

### Analysis of Current Architecture

The agent consists of:
- **System prompt** (`backend/app/agent/system_prompt.py`): Instructs Claude on data model, available tools, and behavioral rules.
- **Orchestrator** (`backend/app/agent/orchestrator.py`): Runs the agentic loop, streaming SSE events. Passes the full conversation history (`messages`) to the Anthropic API on every iteration.
- **Tools**: `buscar_tareas`, `obtener_tarea`, `buscar_acciones`, `listar_estados` — defined in `tools_definition.py`, executed in `tools_executor.py`.
- **Frontend ChatContext** (`frontend/src/features/chat/ChatContext.jsx`): Maintains `messages` state as an array for the full session. On each `sendMessage`, the entire conversation history is sent to the backend.

**Key insight**: Because the orchestrator already sends the full conversation history to Claude on every request, Claude naturally has access to all prior messages in the session. If the user said "Soy Juan" three messages ago, Claude already sees that. The only missing piece is **instructing Claude** (via the system prompt) to:
1. Recognize identity-dependent queries.
2. Ask for the user's name if not yet known in the conversation.
3. Use the name as a `responsable` filter via `ilike`.

### Design Decision: System-Prompt-Only Approach

This feature requires **only a system prompt change**. No changes to the orchestrator, tools, frontend, or API are needed because:

- Claude (the LLM) naturally tracks conversational context — it can determine from message history whether the user has already identified themselves.
- The existing `buscar_tareas` tool already supports `ilike` filtering on the `responsable` field.
- The full conversation history is already sent on every request, so context is preserved across turns.

### Technical Changes

#### 1. System Prompt Update (`backend/app/agent/system_prompt.py`)

Add a new section to the system prompt with rules for identity-dependent queries:

```
## Identificacion del usuario

Cuando el usuario haga preguntas que impliquen filtrar por responsable (por ejemplo: "qué tengo que hacer?", "cuáles son mis tareas?", "mis pendientes", "qué tareas tengo?"), necesitas saber quién es el usuario para filtrar correctamente.

- Si el usuario NO se ha identificado previamente en la conversación, pregúntale su nombre antes de ejecutar la búsqueda. Ejemplo: "Para buscar tus tareas necesito saber tu nombre. ¿Cómo te llamas?"
- Si el usuario YA se identificó en la conversación (por ejemplo, dijo "soy Juan" o "me llamo María"), usa ese nombre directamente.
- Para filtrar por responsable, usa buscar_tareas con un filtro ilike en el campo "responsable" (por ejemplo: {"field": "responsable", "operator": "ilike", "value": "%Juan%"}).
- Si el usuario proporciona un nombre que no coincide con ningún responsable, informa que no se encontraron tareas para ese nombre.
```

This is the only code change required.

### What Does NOT Change

- **Orchestrator**: No changes. Conversation history handling already works correctly.
- **Tools**: No changes. `buscar_tareas` already supports `ilike` on `responsable`.
- **Frontend**: No changes. `ChatContext` already maintains and sends full message history.
- **API endpoints**: No changes.
- **Database**: No changes.
- **Configuration**: No new env vars needed.

### Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| User asks "qué tengo que hacer?" without prior identification | Agent asks for name |
| User says "soy Juan" then asks "mis tareas pendientes" | Agent uses "Juan" to filter by responsable |
| User asks "muéstrame las tareas de Pedro" | Agent filters by "Pedro" directly (no need to ask — the name is explicit in the query) |
| User provides a name with no matching responsable | Agent informs no tasks were found for that name |
| User asks a generic question like "cuántas tareas hay?" | Agent does NOT ask for name (not identity-dependent) |
