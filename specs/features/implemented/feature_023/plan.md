# Implementation Plan — feature_023: UI Refresh & Keyboard-First Experience

## Phase Overview

| Phase | Description | Estimated Files |
|-------|-------------|-----------------|
| 1 | Keyboard shortcut infrastructure | 3 new + 1 modified |
| 2 | Global shortcuts + help overlay + Ayuda menu | 1 new + 3 modified |
| 3 | Search page keyboard navigation | 1 modified |
| 4 | Detail page keyboard navigation | 1 modified |
| 5 | Chat page minor keyboard additions | 1 modified |
| 6 | Visual refresh — CSS & global styles | 2 modified |
| 7 | Visual refresh — component polish | ~8 modified |
| 8 | ARIA & accessibility improvements | ~5 modified |
| 9 | Shortcut hint badges (kbd) | 1 new + ~4 modified |
| 10 | Docs & version bump | 4 modified |

---

## Phase 1: Keyboard Shortcut Infrastructure

**Goal:** Build the centralized shortcut system that all other phases depend on.

### Step 1.1 — Create `KeyboardShortcutProvider.jsx`
- **File:** `src/providers/KeyboardShortcutProvider.jsx` (new)
- Create context with: `shortcuts` registry (Map), `registerShortcut`, `unregisterShortcut`, `isOverlayOpen`, `toggleOverlay`
- Add global `keydown` listener on `document`
- Implement input guard: skip shortcuts when activeElement is input/textarea/select/contenteditable (except shortcuts marked `alwaysActive`)
- Implement sequence shortcut support: track `pendingSequence` with 1-second timeout
- Export `useShortcutContext()` hook

### Step 1.2 — Create `useKeyboardShortcuts.js` hook
- **File:** `src/hooks/useKeyboardShortcuts.js` (new)
- Accepts array of shortcut definitions
- On mount: register all shortcuts via context
- On unmount: unregister all
- Handles `enabled` flag reactively (re-register when enabled changes)
- Memoize shortcut array to prevent unnecessary re-renders

### Step 1.3 — Wire into Providers
- **File:** `src/providers/Providers.jsx` (modify)
- Add `KeyboardShortcutProvider` wrapping the app (inside ClerkProvider, outside QueryProvider)

---

## Phase 2: Global Shortcuts + Help Overlay

**Goal:** Implement app-wide shortcuts and the discoverability overlay.

### Step 2.1 — Create `ShortcutHelpOverlay.jsx`
- **File:** `src/components/shared/ShortcutHelpOverlay.jsx` (new)
- Read shortcuts from context, group by `category`
- Render as a Dialog or custom overlay with semi-transparent backdrop
- Grid layout: responsive columns (1 / 2 / 3 based on breakpoint)
- Each shortcut: `<kbd>` badge + description text
- Close on Escape or click-outside
- Categories in Spanish: "Global", "Búsqueda", "Detalle", "Chat"

### Step 2.2 — Register global shortcuts
- **File:** `src/App.jsx` or `src/components/layout/Layout.jsx` (modify)
- Use `useKeyboardShortcuts` to register:
  - `F1` → toggle help overlay
  - `Escape` → close overlay / navigate back (alwaysActive)
  - `/` → navigate to /search and focus input (or focus input if already on search)
  - `n` → open new task dialog (navigates to search first if needed)
  - `g` → start sequence → `s` (search), `c` (chat), `h` (home)

### Step 2.3 — Add "Ayuda" dropdown menu to Navbar
- **File:** `src/components/layout/Navbar.jsx` (modify)
- Add an "Ayuda" dropdown menu following the existing "Administrador" dropdown pattern
- **Desktop:** New dropdown between "Administrador" and ModeToggle with `HelpCircle` icon + "Ayuda" text + `ChevronDown`
  - Menu item: "Atajos de teclado" (with `Keyboard` icon) — opens ShortcutHelpOverlay via context `toggleOverlay()`
  - Same click-outside close + Escape close behavior as Administrador dropdown
- **Mobile:** Add accordion section in mobile menu after Admin section
  - "Ayuda" toggle button with `HelpCircle` icon
  - "Atajos de teclado" sub-item that opens overlay and closes mobile menu
- Import `HelpCircle`, `Keyboard` from lucide-react
- Import `useShortcutContext` to call `toggleOverlay()`
- Add `isHelpOpen` / `setIsHelpOpen` state (desktop) and `isHelpMobileOpen` / `setIsHelpMobileOpen` state (mobile)
- Add ref + click-outside + Escape handlers (same pattern as `adminRef`)

### Step 2.4 — Add overlay to Layout
- **File:** `src/components/layout/Layout.jsx` (modify)
- Render `ShortcutHelpOverlay` conditionally based on context state

---

## Phase 3: Search Page Keyboard Navigation

**Goal:** Arrow-key row navigation, Enter to open, keyboard filter interaction.

### Step 3.1 — Add row selection state
- **File:** `src/features/search/SearchPage.jsx` (modify)
- Add `selectedRowIndex` state (default: -1 = none selected)
- Reset to -1 when results change (new search, filter change)

### Step 3.2 — Arrow key handlers
- Add `onKeyDown` handler to the results container
- `↓`: increment selectedRowIndex (wrap or clamp at end)
- `↑`: decrement selectedRowIndex (wrap or clamp at start)
- `Enter`: navigate to `/detail/{tarea_id}` of selected row
- `Escape`: set selectedRowIndex to -1 (deselect), or blur search input
- Scroll selected row into view with `scrollIntoView({ block: 'nearest' })`

### Step 3.3 — Visual highlight on selected row
- Apply a distinct highlight style: `ring-2 ring-primary bg-primary/5` (or similar)
- Ensure highlight is visible in both light and dark modes
- Remove highlight on mouse click (switch to click-based interaction)

### Step 3.4 — Register search-specific shortcuts
- Use `useKeyboardShortcuts` with category "Búsqueda":
  - `/` → focus search input
  - `↓`/`↑` → navigate results (description only, actual handler is local)
  - `Enter` → open selected result

### Step 3.5 — ARIA attributes for navigable list
- `role="grid"` on table, `role="row"` on each row
- `aria-activedescendant` pointing to selected row's id
- `aria-selected="true"` on selected row
- Announce result count changes via `aria-live="polite"` region

---

## Phase 4: Detail Page Keyboard Navigation

**Goal:** Navigate acciones with arrows, shortcuts for edit/add/delete.

### Step 4.1 — Add accion selection state
- **File:** `src/features/detail/DetailPage.jsx` (modify)
- Add `selectedAccionIndex` state (default: -1)
- Reset when acciones data changes

### Step 4.2 — Arrow key handlers for acciones
- `↓`/`↑`: navigate acciones list
- `Enter`: open edit dialog for selected accion
- `Delete` or `Backspace`: trigger delete confirm for selected accion
- Scroll selected accion into view

### Step 4.3 — Register detail-specific shortcuts
- Use `useKeyboardShortcuts` with category "Detalle":
  - `e` → open edit tarea dialog
  - `a` → open add accion dialog
  - `Escape` → close dialog or navigate back
  - `↓`/`↑` → navigate acciones
  - `Enter` → edit selected accion
  - Ctrl+Shift+F → go to search (already exists, just register for overlay)
  - Ctrl+Enter → save (already exists, just register for overlay)

### Step 4.4 — Visual highlight on selected accion
- Similar styling to search results highlight
- Works on both card layout (mobile) and table layout (desktop)

---

## Phase 5: Chat Page Minor Keyboard Additions

**Goal:** Small improvements to chat keyboard support.

### Step 5.1 — Register chat shortcuts
- **File:** `src/features/chat/ChatPage.jsx` (modify)
- Use `useKeyboardShortcuts` with category "Chat":
  - `/` → focus chat input
  - `Escape` → stop generation or clear input
  - `↑`/`↓` → command history (already exists, just register for overlay)
  - `Enter` → send message (already exists, just register for overlay)

---

## Phase 6: Visual Refresh — CSS & Global Styles

**Goal:** Refine the design foundation: shadows, focus rings, transitions, typography.

### Step 6.1 — Focus ring system
- **File:** `src/index.css` (modify)
- Unify `*:focus-visible` styles across the app
- Ensure consistent ring color, offset, and shape
- Remove any redundant per-component focus styles that conflict

### Step 6.2 — Shadow refinements
- Update card shadows to use layered, more natural shadows
- Add hover shadow elevation for interactive cards
- Dialog shadow: deeper for stronger modal presence

### Step 6.3 — Typography refinements
- Tighten letter-spacing on headings (`-0.025em`)
- Review and adjust font weight hierarchy
- Ensure data fonts (JetBrains Mono) are used consistently for IDs, dates, codes

### Step 6.4 — Transition refinements
- Smooth transitions on interactive card hover (translateY + shadow)
- Button hover/active transitions: keep snappy (150ms)
- Ensure no transition on page load causes flash

### Step 6.5 — `.kbd-hint` styles
- Add `.kbd-hint` class for shortcut badge styling
- Monospace font, inset shadow, rounded, theme-aware colors
- Responsive: slightly smaller on mobile

---

## Phase 7: Visual Polish — Component Refinements

**Goal:** Apply the design refinements to individual components.

### Step 7.1 — Button refinements
- **File:** `src/components/ui/button.jsx` (modify)
- Review hover/active states for all variants
- Ensure focus ring uses unified system
- Add subtle shadow transition on hover for default variant

### Step 7.2 — Card refinements
- **File:** `src/components/ui/card.jsx` (modify)
- Update shadow values
- Add hover elevation for clickable cards

### Step 7.3 — Dialog refinements
- **File:** `src/components/ui/dialog.jsx` (modify)
- Deeper shadow on dialog content
- Verify exit animation works smoothly
- Ensure focus trap is correct

### Step 7.4 — Badge refinements
- **File:** `src/components/ui/badge.jsx` (modify)
- Review contrast ratios for all variants in both modes
- Ensure status colors are distinguishable

### Step 7.5 — Navbar refinements
- **File:** `src/components/layout/Navbar.jsx` (modify)
- Ensure backdrop-blur and bottom border create clear separation
- Active link indicator: review styling
- Add `aria-current="page"` on active links
- Visual consistency between "Administrador", "Ayuda" dropdowns, and nav links

### Step 7.6 — Input/Select refinements
- **File:** `src/components/ui/input.jsx`, `src/components/ui/select.jsx` (modify)
- Ensure focus ring is consistent
- Hover border color transition

### Step 7.7 — Search page visual refinements
- **File:** `src/features/search/SearchPage.jsx` (modify)
- Review table row spacing, hover states
- Card layout (mobile): consistent padding, shadow

### Step 7.8 — Detail page visual refinements
- **File:** `src/features/detail/DetailPage.jsx` (modify)
- Review section spacing, accordion styling
- Accion cards: consistent elevation

---

## Phase 8: ARIA & Accessibility Improvements

**Goal:** Improve screen reader experience and semantic HTML.

### Step 8.1 — Skip-to-content link
- **File:** `src/components/layout/Layout.jsx` (modify)
- Add visually-hidden skip link that appears on focus
- Target: `<main id="main-content">`

### Step 8.2 — ARIA live regions
- **File:** `src/features/search/SearchPage.jsx` (modify)
- Add `aria-live="polite"` on results count area
- Announce filter changes

### Step 8.3 — ARIA on navigable lists
- Search results: `aria-activedescendant`, `aria-selected`
- Detail acciones: same pattern

### Step 8.4 — Icon button labels
- Review all icon-only buttons across the app
- Ensure each has `aria-label` or `sr-only` text
- **Files:** Various component files

### Step 8.5 — Navbar accessibility
- **File:** `src/components/layout/Navbar.jsx` (modify)
- `aria-current="page"` on active links
- `aria-expanded` on mobile menu toggle
- `aria-label` on nav landmarks

---

## Phase 9: Shortcut Hint Badges

**Goal:** Show small `<kbd>` hints near key actions.

### Step 9.1 — Create `Kbd` component
- **File:** `src/components/ui/kbd.jsx` (new)
- Styled `<kbd>` element with theme-aware inset shadow
- Props: `children` (the key text), `size` (sm, md)
- Uses JetBrains Mono font

### Step 9.2 — Add hints to key actions
- Search page: `N` hint near "Nueva Tarea" button, `/` hint near search input
- Detail page: `E` hint near edit button, `A` hint near add accion button
- Navbar: shortcut hints in tooltips
- **Files:** `SearchPage.jsx`, `DetailPage.jsx`, `Navbar.jsx` (modify)

---

## Phase 10: Documentation & Version Bump

### Step 10.1 — Version bump
- **File:** `src/lib/version.js` — increment `APP_VERSION.minor` to 23

### Step 10.2 — Changelog entry
- **File:** `src/lib/changelog.js` — add entry at TOP of `CHANGELOG` array:
  ```js
  { version: "0.23", feature: "023", title: "UI Refresh & Keyboard Navigation", summary: "..." }
  ```

### Step 10.3 — Update architecture docs
- **File:** `specs/architecture/architecture_frontend.md` — document keyboard shortcut system, new hooks, new provider

### Step 10.4 — Update README.md
- Add mention of keyboard shortcuts and UI improvements

---

## Dependency Order

```
Phase 1 (infrastructure)
  ↓
Phase 2 (global shortcuts + overlay) → Phase 6 (CSS foundation)
  ↓                                      ↓
Phase 3 (search keyboard)           Phase 7 (component polish)
Phase 4 (detail keyboard)               ↓
Phase 5 (chat keyboard)             Phase 8 (ARIA)
  ↓                                      ↓
Phase 9 (kbd hints)
  ↓
Phase 10 (docs)
```

Phases 3–5 can be done in parallel. Phases 6–8 can be done in parallel with 3–5 (they're independent). Phase 9 depends on Phase 1 (kbd component) and Phase 7 (visual polish). Phase 10 is always last.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shortcut conflicts with browser defaults | Shortcuts silently fail | Use only safe keys (letters, `/`, `F1`, `Escape`); avoid Ctrl+letter combos except where standard (Ctrl+Enter) |
| Performance regression from new event listeners | Laggy UI | Single global listener in provider (event delegation), not per-component |
| SearchPage is already very large (~62KB) | Hard to modify | Careful, targeted changes only; extract keyboard logic into hook |
| Breaking existing shortcuts | Regression | Map all existing shortcuts first (done in specs.md), preserve them |
| Focus ring not visible on all themes | Accessibility fail | Test across all 6 color themes × dark/light mode |
