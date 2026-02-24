# Implementation Plan — feature_021

## Feature: Agent asks for user identity on responsable-dependent queries

### Summary

This is a single-file change. The system prompt in `backend/app/agent/system_prompt.py` needs a new section instructing the agent to ask for the user's name before running identity-dependent queries.

---

### Step 1: Update the system prompt

**File:** `backend/app/agent/system_prompt.py`

**Action:** Add a new `## Identificacion del usuario` section to the system prompt string, after the existing `## Reglas` section.

**Content to add:**

```
## Identificacion del usuario

Cuando el usuario haga preguntas que impliquen filtrar por responsable (por ejemplo: "qué tengo que hacer?", "cuáles son mis tareas?", "mis pendientes", "qué tareas tengo?"), necesitas saber quién es el usuario para filtrar correctamente.

- Si el usuario NO se ha identificado previamente en la conversación, pregúntale su nombre antes de ejecutar la búsqueda. Ejemplo: "Para buscar tus tareas necesito saber tu nombre. ¿Cómo te llamas?"
- Si el usuario YA se identificó en la conversación (por ejemplo, dijo "soy Juan" o "me llamo María"), usa ese nombre directamente.
- Para filtrar por responsable, usa buscar_tareas con un filtro ilike en el campo "responsable" (por ejemplo: {{"field": "responsable", "operator": "ilike", "value": "%Juan%"}}).
- Si el usuario proporciona un nombre que no coincide con ningún responsable, informa que no se encontraron tareas para ese nombre.
```

Note: Curly braces in the JSON example must be doubled (`{{` / `}}`) because the system prompt is an f-string.

---

### Step 2: Update version and changelog

**Files:**
- `frontend/src/lib/version.js` — Increment `APP_VERSION.minor` to `21`
- `frontend/src/lib/changelog.js` — Add new entry at the TOP of the `CHANGELOG` array

---

### Step 3: Update documentation

**Files:**
- `specs/architecture/architecture_backend.md` — Update agent system prompt documentation if the prompt rules are documented there
- `README.md` — Mention the new agent behavior if relevant

---

### Step 4: Manual testing

1. Start backend: `cd backend && uv run python -m app.main`
2. Start frontend: `cd frontend && npm run dev`
3. Open the chat and test:
   - Send "qué tengo que hacer?" → Agent should ask for your name
   - Reply with a name → Agent should search tasks filtered by that responsable
   - Send "mis tareas pendientes" → Agent should use the previously provided name without asking again
   - Send "muéstrame las tareas de Pedro" → Agent should filter by "Pedro" directly without asking
