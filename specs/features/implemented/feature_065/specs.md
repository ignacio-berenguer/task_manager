# Specs — feature_065: Chatbot Improvements

## Overview

Four enhancements to the existing AI chatbot (`/chat`):

1. **Conversation persistence** — Survive React Router navigation
2. **Clickable portfolio_id links** — Navigate to `/detail/{id}` from chatbot responses
3. **Thinking/reasoning accordion** — Capture and display the "thinking" text that precedes tool calls
4. **Assumptions transparency** — System prompt update so Claude explains its assumptions

---

## Current Architecture

| Layer | File(s) | Role |
|-------|---------|------|
| Page | `frontend/src/features/chat/ChatPage.jsx` | Full-page chat UI |
| State | `frontend/src/features/chat/hooks/useChat.js` | React `useState` — messages, streaming, toolSteps |
| Messages | `frontend/src/features/chat/components/MessageList.jsx` | List + streaming + tool panel |
| Bubbles | `frontend/src/features/chat/components/MessageBubble.jsx` | Individual message + tool accordion |
| Markdown | `frontend/src/features/chat/components/MarkdownRenderer.jsx` | `react-markdown` + GFM |
| API | `backend/app/routers/agent.py` | `POST /api/v1/agent/chat` |
| Agent | `backend/app/agent/orchestrator.py` | Agentic loop, SSE events |
| Prompt | `backend/app/agent/system_prompt.py` | 310-line system prompt |
| Config | `backend/app/agent/config.py` | Model, tokens, temperature |

**Current state flow:**
1. User sends message → `useChat.sendMessage()` adds to local `useState` array
2. SSE stream: `chunk` → `clear_streaming` → `tool_call`(s) → more `chunk`s → `done`
3. On `clear_streaming`: accumulated thinking text is **discarded** (`accumulated = ''`)
4. On `done`: final assistant message stored in `messages[]` state
5. On navigation away: component unmounts → all state lost

---

## Spec 1: Conversation Persistence

### Problem
`useChat` stores `messages` in `useState`. When the user navigates away from `/chat` and returns, the component remounts and state resets to `[]`.

### Design Decision — React Context (lifted above router)

**Chosen approach:** Create a `ChatProvider` context that wraps the protected routes (inside `Providers` or alongside `BrowserRouter`). The context holds `messages` and exposes `sendMessage`, `clearChat`, etc. The `useChat` hook becomes a thin wrapper that reads from context.

**Why not localStorage?** Storing in-progress streaming state in localStorage adds complexity. A context preserves the full JS objects (including `toolSteps` arrays) without serialization, and naturally clears on page refresh (which is acceptable — a fresh session on hard refresh is fine).

**Why not a global store (Zustand/Redux)?** Would work, but adds a new dependency. A React Context is sufficient for a single piece of state and aligns with the existing pattern (`ThemeProvider`, `ColorThemeProvider`, `QueryProvider`).

### Implementation

1. Create `frontend/src/features/chat/ChatContext.jsx`:
   - `ChatProvider` component with all current `useChat` state (`messages`, `isLoading`, `streamingContent`, `toolSteps`)
   - `useChatContext()` hook to consume
   - All logic currently in `useChat.js` moves into the provider

2. Mount `ChatProvider` inside `Providers.jsx` (after `QueryProvider`, before `Toaster`) so it wraps all routes.

3. Update `ChatPage.jsx` to use `useChatContext()` instead of `useChat()`.

4. The `useChat.js` hook can be kept as a re-export of `useChatContext()` for backward compatibility, or removed if only `ChatPage` uses it.

### Behavior
- Navigate `/chat` → `/dashboard` → `/chat`: conversation intact
- Click "Nueva conversacion" button: clears messages (same as today)
- Hard refresh (F5): conversation resets (acceptable)

---

## Spec 2: Clickable portfolio_id Links

### Problem
The chatbot frequently mentions `portfolio_id` values (e.g., `SPA_25_001`) in markdown tables, lists, and inline text. These are plain text — users must manually navigate to the detail page.

### Design Decision — Custom MarkdownRenderer Components

**Approach:** Modify `MarkdownRenderer.jsx` to detect `portfolio_id` patterns in text content and replace them with React Router `<Link>` components pointing to `/detail/{id}`.

### portfolio_id Pattern
From the database: portfolio_id format is `XXX_YY_NNN` (e.g., `SPA_25_001`, `SPA_24_123`). The regex pattern: `/\b[A-Z]{2,5}_\d{2}_\d{2,4}\b/g`

### Implementation

1. Create a helper function `linkifyPortfolioIds(text)` that:
   - Scans text for the portfolio_id regex pattern
   - Returns an array of React elements: alternating `string` fragments and `<Link to="/detail/{id}">` elements

2. Modify `MarkdownRenderer.jsx` custom components:
   - **`td` (table cells)**: Apply `linkifyPortfolioIds` to children
   - **`li` (list items)**: Apply `linkifyPortfolioIds` to children
   - **`p` (paragraphs)**: Apply `linkifyPortfolioIds` to children
   - **`strong`**: Apply to children (bold portfolio IDs in responses)

3. The `<Link>` elements use React Router's `Link` component (not `<a>`), so navigation stays within the SPA.

4. Styling: Use the existing `text-primary underline hover:text-primary/80` classes consistent with the existing `a` component style, but navigate internally instead of `target="_blank"`.

### Edge Cases
- portfolio_id inside inline code (`` `SPA_25_001` ``): Do NOT linkify — code blocks should remain literal
- portfolio_id inside links: Skip — already linked content
- Multiple IDs in one cell/paragraph: All linkified independently

---

## Spec 3: Preserve and Display Thinking/Reasoning Text

### Problem
When the orchestrator streams text before tool calls, it represents the agent's "thinking" or reasoning. Currently:
1. Text is streamed and shown in the streaming bubble
2. `clear_streaming` event fires → `accumulated = ''` and `setStreamingContent('')`
3. The thinking text is **lost** from the user's perspective (though `toolSteps[0].thinking` captures it partially)

The issue is that the thinking text shown as `step.thinking` in the tool accordion only captures it per-iteration and only associates it with the first tool call of that iteration. The initial reasoning before any tools is also lost.

### Design Decision — Store Thinking per Message

**Approach:** Capture the thinking text before each `clear_streaming` event and store it alongside the assistant message. Display it in a dedicated "Razonamiento" accordion above the tool steps accordion.

### Backend Changes
None required. The `clear_streaming` event already signals the transition. The thinking text is already being streamed as `chunk` events before `clear_streaming`. The frontend just needs to stop discarding it.

### Frontend Implementation

1. **`useChat.js` (or `ChatContext.jsx`):**
   - Add a new accumulator: `thinkingParts` (array of strings, one per agentic iteration)
   - On `clear_streaming`: Instead of discarding `accumulated`, push it to `thinkingParts`, then reset `accumulated`
   - On finalization: Include `thinkingParts` in the assistant message object:
     ```js
     { role: 'assistant', content: accumulated, toolSteps: [...], thinking: thinkingParts }
     ```

2. **`MessageBubble.jsx`:**
   - Before the `ToolStepsAccordion`, add a `ThinkingAccordion` if `message.thinking?.length > 0`
   - The `ThinkingAccordion` is a collapsible section:
     - Header: "Razonamiento del asistente" with a brain/lightbulb icon
     - Body: Each thinking part rendered as a paragraph with `MarkdownRenderer` (the thinking may contain markdown)
     - Default state: **collapsed** (user expands if curious)

3. **Visual design:**
   - Similar styling to `ToolStepsAccordion` (border, muted background, small text)
   - Slightly different accent color or icon to distinguish from tool steps
   - Positioned above the tool steps accordion (thinking happens first conceptually)

---

## Spec 4: Explain Assumptions and Calculations

### Problem
The chatbot sometimes makes implicit assumptions (e.g., using current year's importe, excluding Cancelado initiatives) without telling the user.

### Design Decision — System Prompt Enhancement

**Approach:** Add a new directive section to the system prompt in `backend/app/agent/system_prompt.py` that instructs the model to explicitly state its assumptions.

### System Prompt Addition

Add a new subsection under "Directrices de respuesta":

```
9. **Transparencia en supuestos:** Al final de cada respuesta que implique análisis de datos, incluye una sección breve titulada "**Supuestos aplicados:**" donde indiques:
   - El año utilizado para los importes (si aplica)
   - Si se han excluido iniciativas canceladas (siempre por defecto)
   - Cualquier filtro implícito aplicado (ej: solo iniciativas en presupuesto, solo un tipo, etc.)
   - Si los resultados están limitados por paginación
   - Cualquier otra suposición relevante para interpretar los resultados
   Omite esta sección solo si la respuesta es puramente informativa (ej: "¿Qué tablas hay?") y no implica ningún supuesto.
```

### No Frontend Changes Required
The assumptions text will be part of the normal markdown response, rendered by the existing `MarkdownRenderer`. The bold heading will be visible as a clear section.

---

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/features/chat/ChatContext.jsx` | Context provider + all chat state logic |

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/providers/Providers.jsx` | Add `ChatProvider` to provider tree |
| `frontend/src/features/chat/ChatPage.jsx` | Use `useChatContext()` instead of `useChat()` |
| `frontend/src/features/chat/hooks/useChat.js` | Simplify to re-export from context, or remove |
| `frontend/src/features/chat/components/MarkdownRenderer.jsx` | Add `linkifyPortfolioIds` for clickable IDs |
| `frontend/src/features/chat/components/MessageBubble.jsx` | Add `ThinkingAccordion` component |
| `frontend/src/features/chat/components/MessageList.jsx` | Pass thinking state during streaming |
| `backend/app/agent/system_prompt.py` | Add assumptions transparency directive |

## Files Unchanged
- `backend/app/agent/orchestrator.py` — No changes needed
- `backend/app/routers/agent.py` — No changes needed
- `backend/app/agent/config.py` — No changes needed
