# Technical Specification — feature_022

## Chat Enhancement: Domain Knowledge, User Identity, Greeting & Suggested Questions

### Overview

Enhance the AI chat with four capabilities:
1. Agent understands task status semantics ("En curso" = active, "Completado" = done)
2. Agent automatically maps logged-in user email to a Responsable name (no need to ask)
3. Chat displays a personalized Task Manager greeting on empty conversations
4. Chat offers clickable starter questions relevant to Task Manager

---

## 1. Agent Domain Knowledge — Status Semantics

### Current State
- System prompt (`backend/app/agent/system_prompt.py`) lists estado values as plain parametric references: "Pendiente, En Progreso, Completada, Cancelada"
- The agent has no understanding of what each status means in the workflow context

### Change
Add a section to `get_system_prompt()` that explains the semantic meaning of each estado:

```
## Semántica de estados

### Estados de tareas
- **En curso**: La tarea está activa y pendiente de resolución. El responsable tiene trabajo por hacer.
- **Completada**: La tarea está terminada. No requiere más acciones.
- **Pendiente**: La tarea está registrada pero aún no se ha comenzado a trabajar.
- **Cancelada**: La tarea fue cancelada y no se completará.

### Estados de acciones
- **Pendiente**: La acción aún no se ha realizado.
- **En Progreso**: La acción está en curso.
- **Completada**: La acción se completó.
```

**Important**: When the user asks about "tareas pendientes" or "qué tengo que hacer", the agent should interpret this as tareas with estado **"En curso"** (active), not "Pendiente" (not started). The system prompt must clarify this explicitly.

---

## 2. User Identity Mapping (Email → Responsable)

### Current State
- The system prompt has an "Identificación del usuario" section that tells the agent to **ask the user their name** when they make identity-dependent queries
- The frontend sends the Clerk JWT token in the Authorization header
- The backend `verify_auth` dependency extracts JWT claims (including `sub` user ID)
- The agent router (`routers/agent.py`) does not pass auth info to the orchestrator
- Clerk JWT tokens contain `sub` (user ID) but may not contain the email directly

### Design Decisions

**Frontend sends user email in request body**: The simplest, most reliable approach. The frontend has access to `window.Clerk.user.primaryEmailAddress.emailAddress`. We add a `user_email` field to the chat request.

**Backend stores email-to-responsable mapping in .env**: A JSON-encoded env var `AGENT_USER_MAPPINGS` allows adding new users without code changes. Format: `{"email@example.com": "NombreResponsable", ...}`.

**System prompt receives the user's name**: The orchestrator resolves the email → responsable mapping and injects it into the system prompt. The agent never needs to ask who the user is.

### Changes

#### 2a. Frontend — `ChatContext.jsx`
- When sending a message, include the user's email from Clerk:
  ```js
  body: JSON.stringify({
    messages: updatedMessages,
    user_email: window.Clerk?.user?.primaryEmailAddress?.emailAddress || null
  })
  ```

#### 2b. Backend — Configuration
- Add `AGENT_USER_MAPPINGS: str = "{}"` to `Settings` in `backend/app/config.py`
- Add to `.env.example`:
  ```
  AGENT_USER_MAPPINGS={"ignacio.berenguer@gmail.com": "Ignacio"}
  ```

#### 2c. Backend — Agent Router (`routers/agent.py`)
- Add `user_email: str | None = None` to `AgentChatRequest`
- Pass `user_email` to `stream_agent_response()`

#### 2d. Backend — Orchestrator (`orchestrator.py`)
- Accept `user_email` parameter
- Resolve email → responsable name via `AGENT_USER_MAPPINGS` config
- Pass the resolved name to `get_system_prompt(user_name=...)`

#### 2e. Backend — System Prompt (`system_prompt.py`)
- Accept `user_name: str | None = None` parameter
- Replace the "Identificación del usuario" section:
  - If `user_name` is provided: tell the agent the user's name and to use it automatically for responsable filters
  - If `user_name` is None: keep the existing "ask for name" fallback behavior

---

## 3. Chat Greeting — Task Manager Branding

### Current State
The greeting screen in `MessageList.jsx` displays:
- Title: "Asistente IA del Portfolio"
- Subtitle: "Pregunta cualquier cosa sobre las iniciativas, presupuestos, estados y datos del portfolio digital."
- TOOL_LABELS reference old-app tools (buscar_iniciativas, generar_grafico, etc.)
- ChatInput placeholder: "Pregunta sobre el portfolio..."

### Changes

#### 3a. `MessageList.jsx` — Greeting screen
- **Title**: "Asistente IA de Tareas"
- **Subtitle**: "Pregunta cualquier cosa sobre tus tareas, acciones, estados y responsables."
- **Personalized greeting**: Accept the user's first name as a prop. If available, show "Hola {name}!" above the title.
- **TOOL_LABELS**: Update to match actual Task Manager tools:
  ```js
  const TOOL_LABELS = {
    buscar_tareas: 'Buscar tareas',
    obtener_tarea: 'Obtener tarea',
    buscar_acciones: 'Buscar acciones',
    listar_estados: 'Listar estados',
  }
  ```

#### 3b. `ChatPage.jsx` — Pass user name to MessageList
- Get user info from Clerk: `const { user } = useUser()` (from `@clerk/clerk-react`)
- Resolve the user's first name from Clerk's `user.firstName` or from the email-to-name mapping
- Pass as prop to `<MessageList userName={...} />`

#### 3c. `ChatInput.jsx` — Update placeholder
- Change from `"Pregunta sobre el portfolio..."` to `"Pregunta sobre tus tareas..."`

---

## 4. Suggested Starter Questions

### Current State
```js
const EXAMPLE_QUESTIONS = [
  '¿Cuántas iniciativas hay en ejecución?',
  '¿Cuál es el presupuesto total de 2025 por unidad?',
  '¿Qué iniciativas tiene la unidad Digital?',
  'Dame los detalles de SPA_25_001',
]
```
All reference the old "Portfolio" app.

### Change
Replace with Task Manager-relevant questions:
```js
const EXAMPLE_QUESTIONS = [
  '¿Qué tengo que hacer hoy?',
  '¿Qué tengo que hacer esta semana?',
  '¿Cuáles son mis tareas pendientes?',
]
```

These questions leverage the user identity mapping (Req 2) — the agent will automatically know who "yo" is and filter by the correct responsable.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/app/config.py` | Add `AGENT_USER_MAPPINGS` setting |
| `backend/.env.example` | Add `AGENT_USER_MAPPINGS` example |
| `backend/app/agent/system_prompt.py` | Add status semantics, user identity injection |
| `backend/app/agent/orchestrator.py` | Accept and resolve `user_email` parameter |
| `backend/app/routers/agent.py` | Add `user_email` to request model, pass to orchestrator |
| `frontend/src/features/chat/ChatContext.jsx` | Send `user_email` in request body |
| `frontend/src/features/chat/ChatPage.jsx` | Get Clerk user, pass name to MessageList |
| `frontend/src/features/chat/components/MessageList.jsx` | Update greeting, title, TOOL_LABELS, EXAMPLE_QUESTIONS |
| `frontend/src/features/chat/components/ChatInput.jsx` | Update placeholder text |

---

## No Changes Required

- Database schema: no changes
- API authentication: unchanged (JWT still verified normally)
- MCP server: unaffected
- Management CLI: unaffected
- Other frontend pages: unaffected
