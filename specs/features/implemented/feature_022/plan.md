# Implementation Plan — feature_022

## Chat Enhancement: Domain Knowledge, User Identity, Greeting & Suggested Questions

---

## Phase 1: Backend — Configuration & System Prompt

### Step 1.1: Add `AGENT_USER_MAPPINGS` to config

**File:** `backend/app/config.py`

- Add `AGENT_USER_MAPPINGS: str = "{}"` to the `Settings` class (in the "Agent" section)

**File:** `backend/.env.example`

- Add: `AGENT_USER_MAPPINGS={"ignacio.berenguer@gmail.com": "Ignacio"}`

**File:** `backend/.env` (actual)

- Add the mapping for the user: `AGENT_USER_MAPPINGS={"ignacio.berenguer@gmail.com": "Ignacio"}`

### Step 1.2: Enhance system prompt with domain knowledge and user identity

**File:** `backend/app/agent/system_prompt.py`

- Change `get_system_prompt()` signature to `get_system_prompt(user_name: str | None = None)`
- Add a "Semántica de estados" section after the current "Tablas parametricas" section:
  - Explain what each estado means in the workflow (En curso = active/pending, Completada = done, Pendiente = not started, Cancelada = cancelled)
  - Explicitly note: when users say "tareas pendientes" or "qué tengo que hacer", they mean tareas with estado "En curso" (active), NOT "Pendiente"
- Replace the "Identificación del usuario" section:
  - If `user_name` is provided: inject `f"El usuario actual se llama {user_name}. Cuando pregunte por 'mis tareas', 'qué tengo que hacer', etc., filtra automáticamente por responsable = '{user_name}' usando un filtro ilike."` — Do NOT ask for their name.
  - If `user_name` is None: keep the existing fallback (ask for name)

---

## Phase 2: Backend — Wire user email through the agent pipeline

### Step 2.1: Update agent router to accept user_email

**File:** `backend/app/routers/agent.py`

- Add `user_email: str | None = None` to `AgentChatRequest`
- Pass `request.user_email` to `stream_agent_response()`
- Log the user email at INFO level (for debugging identity mapping)

### Step 2.2: Update orchestrator to resolve email → responsable

**File:** `backend/app/agent/orchestrator.py`

- Change `stream_agent_response(messages)` to `stream_agent_response(messages, user_email=None)`
- At the start, resolve email to responsable name:
  ```python
  import json as json_module
  mappings = json_module.loads(config.AGENT_USER_MAPPINGS) if hasattr(config, 'AGENT_USER_MAPPINGS') else {}
  user_name = mappings.get(user_email) if user_email else None
  ```
- Pass `user_name` to `get_system_prompt(user_name=user_name)`
- Log the resolution result at INFO level

### Step 2.3: Export AGENT_USER_MAPPINGS from agent config

**File:** `backend/app/agent/config.py`

- Import and re-export `AGENT_USER_MAPPINGS = settings.AGENT_USER_MAPPINGS`

---

## Phase 3: Frontend — Send user email with chat requests

### Step 3.1: Include user email in chat request body

**File:** `frontend/src/features/chat/ChatContext.jsx`

- In `sendMessage()`, when building the fetch body, add the user's email:
  ```js
  body: JSON.stringify({
    messages: updatedMessages,
    user_email: window.Clerk?.user?.primaryEmailAddress?.emailAddress || null
  })
  ```
- No new imports needed (already uses `window.Clerk`)

---

## Phase 4: Frontend — Update greeting, suggested questions, labels

### Step 4.1: Update MessageList greeting screen and tool labels

**File:** `frontend/src/features/chat/components/MessageList.jsx`

- Replace `TOOL_LABELS` with Task Manager tools:
  ```js
  const TOOL_LABELS = {
    buscar_tareas: 'Buscar tareas',
    obtener_tarea: 'Obtener tarea',
    buscar_acciones: 'Buscar acciones',
    listar_estados: 'Listar estados',
  }
  ```
- Replace `EXAMPLE_QUESTIONS` with:
  ```js
  const EXAMPLE_QUESTIONS = [
    '¿Qué tengo que hacer hoy?',
    '¿Qué tengo que hacer esta semana?',
    '¿Cuáles son mis tareas pendientes?',
  ]
  ```
- Add `userName` prop to `MessageList` component
- Update greeting screen:
  - If `userName`: show personalized `"¡Hola, {userName}!"` heading above the title
  - Title: `"Asistente IA de Tareas"`
  - Subtitle: `"Pregunta cualquier cosa sobre tus tareas, acciones, estados y responsables."`

### Step 4.2: Pass user name from ChatPage to MessageList

**File:** `frontend/src/features/chat/ChatPage.jsx`

- Import `useUser` from `@clerk/clerk-react`
- Get user's first name: `const { user } = useUser(); const userName = user?.firstName || null`
- Pass to `<MessageList userName={userName} ... />`

### Step 4.3: Update ChatInput placeholder

**File:** `frontend/src/features/chat/components/ChatInput.jsx`

- Change placeholder from `"Pregunta sobre el portfolio..."` to `"Pregunta sobre tus tareas..."`

---

## Phase 5: Post-implementation updates

### Step 5.1: Update version and changelog

**File:** `frontend/src/lib/version.js`

- Increment `APP_VERSION.minor` to 22

**File:** `frontend/src/lib/changelog.js`

- Add new entry at the top of the `CHANGELOG` array:
  ```js
  {
    version: '0.22.0',
    feature: 'feature_022',
    title: 'Chat mejorado: saludos, preguntas sugeridas e identidad de usuario',
    summary: 'El asistente IA ahora te saluda por nombre, ofrece preguntas sugeridas para empezar, y sabe automáticamente quién eres para filtrar tus tareas.'
  }
  ```

### Step 5.2: Update architecture docs

- `specs/architecture/architecture_backend.md`: Document `AGENT_USER_MAPPINGS` config and user_email in agent pipeline
- `specs/architecture/architecture_frontend.md`: Document greeting personalization and updated chat branding

### Step 5.3: Update README.md

- Add `AGENT_USER_MAPPINGS` to the Backend .env section

---

## Summary of files to modify

| # | File | Phase |
|---|------|-------|
| 1 | `backend/app/config.py` | 1 |
| 2 | `backend/.env.example` | 1 |
| 3 | `backend/app/agent/system_prompt.py` | 1 |
| 4 | `backend/app/routers/agent.py` | 2 |
| 5 | `backend/app/agent/orchestrator.py` | 2 |
| 6 | `backend/app/agent/config.py` | 2 |
| 7 | `frontend/src/features/chat/ChatContext.jsx` | 3 |
| 8 | `frontend/src/features/chat/components/MessageList.jsx` | 4 |
| 9 | `frontend/src/features/chat/ChatPage.jsx` | 4 |
| 10 | `frontend/src/features/chat/components/ChatInput.jsx` | 4 |
| 11 | `frontend/src/lib/version.js` | 5 |
| 12 | `frontend/src/lib/changelog.js` | 5 |
| 13 | `specs/architecture/architecture_backend.md` | 5 |
| 14 | `specs/architecture/architecture_frontend.md` | 5 |
| 15 | `README.md` | 5 |
