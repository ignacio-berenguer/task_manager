# Plan — feature_065: Chatbot Improvements

## Phase 1: Conversation Persistence (Context Provider)

### Step 1.1 — Create ChatContext.jsx
- Create `frontend/src/features/chat/ChatContext.jsx`
- Move all state and logic from `useChat.js` into a `ChatProvider` component:
  - `messages`, `isLoading`, `streamingContent`, `toolSteps` state
  - `sendMessage`, `clearChat`, `stopGeneration` callbacks
- Export `ChatProvider` component and `useChatContext()` hook
- Add the new `thinkingParts` accumulator (for Phase 3) at this stage to avoid refactoring later

### Step 1.2 — Mount ChatProvider in Providers.jsx
- Import `ChatProvider` in `frontend/src/providers/Providers.jsx`
- Add it inside the provider tree (after `QueryProvider`, wrapping `{children}`)

### Step 1.3 — Update ChatPage.jsx
- Replace `useChat()` import with `useChatContext()` from `ChatContext`
- Remove the `useChat` import
- No other changes to ChatPage — the API surface is identical

### Step 1.4 — Simplify useChat.js
- Replace contents with a re-export: `export { useChatContext as useChat } from '../ChatContext'`
- This maintains backward compatibility if any other component imports `useChat`

### Step 1.5 — Test
- Verify conversation persists when navigating `/chat` → `/dashboard` → `/chat`
- Verify "Nueva conversacion" still clears messages
- Verify streaming still works correctly
- Verify hard refresh resets conversation

---

## Phase 2: Clickable portfolio_id Links

### Step 2.1 — Create linkifyPortfolioIds utility
- Add a `linkifyPortfolioIds(children)` function in `MarkdownRenderer.jsx` (or a separate small util)
- Regex: `/\b([A-Z]{2,5}_\d{2}_\d{2,4})\b/g`
- Takes React children (string or mixed), returns array of text + `<Link>` elements
- Handle the case where children is a string, an array, or a React element

### Step 2.2 — Update MarkdownRenderer.jsx
- Import `Link` from `react-router-dom`
- Apply `linkifyPortfolioIds` to `td`, `li`, `p`, and `strong` component children
- Do NOT apply to `code` (inline or block) — keep code literal
- Style links with `text-primary underline hover:text-primary/80` (matching existing link style)
- Use `<Link to={...}>` for SPA navigation (no full page reload)

### Step 2.3 — Test
- Send a query that returns a table with portfolio_ids
- Verify IDs in tables, lists, and paragraphs are clickable
- Verify clicking navigates to `/detail/{id}` without page reload
- Verify code blocks with portfolio_ids are NOT linkified
- Verify back navigation returns to chat with conversation intact (depends on Phase 1)

---

## Phase 3: Thinking/Reasoning Accordion

### Step 3.1 — Capture thinking text in ChatContext
- In the SSE parser, when `clear_streaming` fires:
  - Push current `accumulated` to a `thinkingParts` array (instead of discarding)
  - Reset `accumulated` to `''` as before
- When finalizing the assistant message, include `thinking: thinkingParts` if non-empty
- Expose `thinkingParts` state for the streaming phase display

### Step 3.2 — Create ThinkingAccordion in MessageBubble.jsx
- New component `ThinkingAccordion` similar to `ToolStepsAccordion`:
  - Header: lightbulb icon + "Razonamiento del asistente" + count of parts
  - Body: Each thinking part as a paragraph, rendered with `MarkdownRenderer`
  - Default state: collapsed
  - Styling: `rounded-lg border border-border/40 bg-muted/20`, similar to tool steps
- Render `ThinkingAccordion` above `ToolStepsAccordion` in `MessageBubble` when `message.thinking?.length > 0` and any part has non-empty content

### Step 3.3 — Show thinking during streaming
- In `MessageList.jsx`, during the streaming phase (when `isLoading` and `toolSteps` are visible):
  - If `thinkingParts` has content, show a small "Razonamiento previo" indicator above the tool steps panel
  - This gives visual feedback that thinking was captured (optional enhancement)

### Step 3.4 — Test
- Ask a question that triggers tool use (most queries do)
- Verify the reasoning text appears in a collapsible accordion in the final message
- Verify the accordion is collapsed by default
- Verify expanding shows the full thinking text with proper markdown formatting
- Verify simple queries (no tool use) don't show the thinking accordion

---

## Phase 4: Assumptions Transparency (System Prompt)

### Step 4.1 — Update system_prompt.py
- Add directive #9 to the "Directrices de respuesta" section in `backend/app/agent/system_prompt.py`
- The directive instructs the model to add a "**Supuestos aplicados:**" section at the end of data analysis responses
- Content: year used for amounts, Cancelado exclusion, implicit filters, pagination limits, etc.
- Skip for purely informational responses (table listings, schema descriptions)

### Step 4.2 — Test
- Ask a financial question (e.g., "presupuesto total por unidad")
- Verify the response includes a "Supuestos aplicados" section
- Verify it mentions the year used and Cancelado exclusion
- Ask a non-financial question (e.g., "qué tablas hay")
- Verify no assumptions section appears

---

## Phase 5: Post-Implementation Checklist

### Step 5.1 — Version & Changelog
- Increment `APP_VERSION.minor` in `frontend/src/lib/version.js` to 65
- Add changelog entry at top of `CHANGELOG` array in `frontend/src/lib/changelog.js`

### Step 5.2 — Documentation
- Update `README.md` with chatbot improvements
- Update `specs/architecture/architecture_frontend.md` (ChatContext, linkified IDs, thinking accordion)
- Update `specs/architecture/architecture_backend.md` (system prompt assumptions directive)

### Step 5.3 — Close Feature
- Use `/close_feature feature_065`
