# Technical Specification — feature_023: UI Refresh & Keyboard-First Experience

## 1. Overview

This feature delivers two complementary improvements to the Task Manager frontend:

1. **Visual Refresh** — Modernize the UI with refined typography, spacing, color usage, subtle animations, and attention to micro-interactions across all pages.
2. **Keyboard-First Navigation** — Make every action reachable via keyboard with global shortcuts, visible focus rings, result-list arrow navigation, and a discoverable shortcut help overlay.

The backend is not modified. All changes are frontend-only (React 19 + Tailwind CSS 4).

---

## 2. Current State Analysis

### What Already Works Well
- Dark/light mode with 6 color themes via CSS custom properties
- Dialog/Sheet/Popover already handle Escape key
- DetailPage has Ctrl+Shift+F (go to search) and Ctrl+Enter (save)
- Chat has arrow-key command history
- DateInput has +/- keyboard shortcuts
- `prefers-reduced-motion` is respected
- Focus-visible ring styles exist in index.css
- Route-based code splitting with lazy loading

### Gaps to Address
- **No global shortcut system** — shortcuts are scattered per-component with no central registry
- **No shortcut help overlay** — users can't discover available shortcuts
- **Search results not keyboard-navigable** — no arrow key navigation or Enter-to-open
- **Focus indicators inconsistent** — some components use default browser outlines, others use custom rings
- **Visual polish opportunities** — spacing, typography hierarchy, card elevations, hover states, and transitions can be refined for a more premium feel
- **No skip-to-content link** for accessibility
- **No ARIA live regions** for dynamic content announcements

---

## 3. Technical Design

### 3.1 Keyboard Shortcut System

#### Architecture: `useKeyboardShortcuts` Hook + `KeyboardShortcutProvider` Context

A centralized shortcut system with three layers:

```
KeyboardShortcutProvider (context — holds registry + overlay state)
  └── useKeyboardShortcuts(shortcuts[]) — per-component registration hook
  └── useGlobalShortcuts() — app-level shortcuts (always active)
  └── ShortcutHelpOverlay — modal triggered by F1
```

**Registry structure:**
```js
{
  id: string,           // unique key, e.g. "search.focusInput"
  keys: string,         // display string, e.g. "/"
  key: string,          // KeyboardEvent.key value
  modifiers: { ctrl?, shift?, alt? },
  description: string,  // human-readable, e.g. "Enfocar búsqueda"
  category: string,     // grouping: "Global", "Búsqueda", "Detalle", "Chat"
  action: () => void,
  enabled: boolean      // allows conditional activation
}
```

**Input guard:** All shortcuts are suppressed when `document.activeElement` is an `<input>`, `<textarea>`, `<select>`, or `[contenteditable]` — except explicitly marked "always active" shortcuts (like Escape).

**Files:**
- `src/hooks/useKeyboardShortcuts.js` — hook for registering shortcuts per component
- `src/providers/KeyboardShortcutProvider.jsx` — context provider + registry
- `src/components/shared/ShortcutHelpOverlay.jsx` — the F1 help overlay

### 3.2 Global Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `F1` | Open shortcut help overlay | Global (always active) |
| `Escape` | Close overlay / modal / go back | Global (always active) |
| `/` | Focus search input on SearchPage, or navigate to /search | Global (not in inputs) |
| `n` | Open "New Task" dialog | Global (not in inputs) |
| `g` then `s` | Go to Search page | Global (sequence shortcut) |
| `g` then `c` | Go to Chat page | Global (sequence shortcut) |
| `g` then `h` | Go to Home (landing) page | Global (sequence shortcut) |

**Sequence shortcuts** (`g` then `x`): After pressing `g`, a 1-second window opens for the second key. If no second key arrives, the sequence resets. Visual feedback: a small toast or indicator shows "g..." while waiting.

### 3.3 Search Page Keyboard Enhancements

| Key | Action |
|-----|--------|
| `↓` / `↑` | Move highlight through result rows |
| `Enter` | Open highlighted result (navigate to detail) |
| `Escape` | Clear selection / collapse filters |
| `/` | Focus search text input |
| `Backspace` (in empty search input) | Clear all filters |

**Implementation:**
- Add `selectedRowIndex` state to SearchPage
- Apply a visible highlight class (ring + subtle background) to the selected row
- Scroll the selected row into view (`scrollIntoView({ block: 'nearest' })`)
- Arrow key handlers on the results container (not on each row) — event delegation
- Tab from search input moves focus into the results table; arrow keys then take over
- Mobile: arrow navigation still works but is not the primary interaction

### 3.4 Detail Page Keyboard Enhancements

| Key | Action |
|-----|--------|
| `e` | Open edit tarea dialog |
| `a` | Open add accion dialog |
| `Escape` | Close any open dialog, or navigate back |
| `↓` / `↑` | Navigate between acciones rows |
| `Enter` | Open edit on highlighted accion |
| `Delete` / `Backspace` | Delete highlighted accion (with confirm) |
| `Ctrl+Enter` | Save current dialog (already exists) |

**Implementation:**
- Add `selectedAccionIndex` state
- Highlight row with ring + background, scroll into view
- Shortcuts `e`, `a` only fire when no dialog is open and no input focused

### 3.5 Chat Page Keyboard Enhancements

Chat already has good keyboard support. Minor additions:

| Key | Action |
|-----|--------|
| `Escape` | Stop generation (if streaming) or clear input |
| `/` | Focus chat input |

### 3.6 Focus Management

#### Focus Ring Design
Replace inconsistent focus indicators with a unified system:

```css
/* Consistent focus ring across all interactive elements */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: var(--radius);
}
```

- **Ring color**: Uses `--ring` CSS variable (adapts to theme and dark mode)
- **Offset**: 2px from the element edge for visibility
- **Shape**: Follows the element's border-radius
- **Suppressed on mouse click**: Only visible on keyboard navigation (`:focus-visible`)

#### Skip-to-Content Link
Add a visually-hidden link at the top of Layout that becomes visible on focus:
```html
<a href="#main-content" class="sr-only focus:not-sr-only ...">
  Saltar al contenido principal
</a>
```

#### Focus Trap in Dialogs
The existing Dialog component already traps focus. Verify and ensure all dialogs (including ShortcutHelpOverlay) do the same.

### 3.7 Visual Refresh

The visual refresh targets subtle refinements rather than a complete redesign. The goal is to make the existing design feel more polished and premium.

#### 3.7.1 Typography Refinements
- Increase heading contrast — larger weight differential between headings and body text
- Consistent use of the three font families: Space Grotesk (headings), Plus Jakarta Sans (body), JetBrains Mono (data/code)
- Better letter-spacing on headings (slightly tighter: `-0.025em`)
- Adjust line-height on dense data views (acciones table, search results)

#### 3.7.2 Spacing & Layout
- Consistent padding/margin scale using Tailwind's spacing system
- Cards: slightly more generous inner padding (p-4 → p-5 on larger screens)
- Section spacing: ensure consistent vertical rhythm between page sections
- Table row height: comfortable but not wasteful

#### 3.7.3 Elevation & Depth
- Refine card shadows for more natural depth: use layered shadows
  ```css
  shadow-sm → shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]
  ```
- Navbar: ensure backdrop-blur + subtle bottom border creates clear separation
- Dialogs: deeper shadow for stronger modal presence
- Hover states: subtle shadow lift on interactive cards

#### 3.7.4 Color & Contrast
- Ensure all text meets WCAG AA contrast ratios (4.5:1 for body, 3:1 for large)
- Muted text: ensure sufficient contrast in both light and dark modes
- Status badges: review and ensure colors are distinguishable and accessible
- Active/selected states: clear visual distinction from hover states

#### 3.7.5 Micro-interactions & Transitions
- Button press: keep `active:scale-[0.98]` but add subtle shadow reduction
- Card hover: gentle translateY(-1px) + shadow increase
- Dialog entry: keep existing zoom + fade, ensure exit animation works
- Page transitions: subtle fade-in on route change (via Suspense fallback timing)
- Loading states: ensure skeleton shimmer is smooth and not jarring
- Checkbox/toggle: smooth check animation

#### 3.7.6 Shortcut Hint Badges
- Small `<kbd>` styled badges shown next to key actions (optional, can be toggled)
- Example: next to "Nueva Tarea" button, show a subtle `N` badge
- Style: monospace font, slightly recessed appearance (inset shadow), rounded
- Only visible on hover or when shortcut overlay was recently used
- CSS class: `.kbd-hint` with theme-aware styling

### 3.8 "Ayuda" (Help) Menu in Navbar

A new dropdown menu in the Navbar, following the same pattern as the existing "Administrador" dropdown.

**Location:** Desktop — between "Administrador" and the right-side controls (ModeToggle, UserButton). Mobile — in the collapsible mobile menu, after the Admin section.

**Icon:** `HelpCircle` from lucide-react.

**Menu Items:**
| Item | Icon | Action |
|------|------|--------|
| Atajos de teclado | `Keyboard` | Opens the ShortcutHelpOverlay |

The dropdown uses the same click-outside and Escape-to-close behavior as the Administrador dropdown. On mobile, it renders as an accordion section (same pattern as the Admin mobile section).

**Visibility:** The "Ayuda" menu is visible to all signed-in users (wrapped in `<SignedIn>`), same as the other nav items.

**Future extensibility:** The menu structure makes it easy to add more help items later (e.g., documentation link, about page, feedback form).

### 3.9 Shortcut Help Overlay

**Triggers:**
- `F1` key (always active, works even in inputs)
- "Atajos de teclado" item in the Ayuda menu

**Design:**
- Full-screen semi-transparent overlay (like a modal)
- Grid layout grouping shortcuts by category (Global, Búsqueda, Detalle, Chat)
- Each shortcut shows: key badge + description
- Close via Escape or clicking outside
- Responsive: single column on mobile, 2 columns on tablet, 3 on desktop

**Content is dynamic:** reads from the shortcut registry, so it's always up to date with currently available shortcuts.

### 3.10 ARIA & Accessibility Improvements

- **`aria-live="polite"`** on search results count ("X resultados encontrados")
- **`aria-activedescendant`** on the results list for arrow-key navigation
- **`role="listbox"` / `role="option"`** on navigable result rows (when keyboard mode active)
- **`aria-current="page"`** on active nav links
- **`aria-label`** on icon-only buttons that lack visible text
- **`aria-describedby`** linking shortcut hints to their parent buttons

---

## 4. Component Changes Summary

| Component | Changes |
|-----------|---------|
| `Providers.jsx` | Add `KeyboardShortcutProvider` wrapper |
| `Layout.jsx` | Add skip-to-content link, `id="main-content"` on main |
| `Navbar.jsx` | Add "Ayuda" dropdown menu (desktop + mobile), `aria-current="page"` on active links, focus improvements |
| `SearchPage.jsx` | Arrow navigation state, keyboard event handlers, highlight styling, ARIA roles |
| `DetailPage.jsx` | Accion arrow navigation, shortcut registration (`e`, `a`), highlight styling |
| `ChatPage.jsx` | Minor: `/` focus shortcut, Escape to stop |
| `Dialog.jsx` | Verify focus trap, add exit animation |
| `Button.jsx` | Review focus ring consistency |
| `index.css` | Focus ring refinements, `.kbd-hint` styles, shadow refinements, transition updates |
| `ShortcutHelpOverlay.jsx` | **New** — shortcut overlay component |
| `useKeyboardShortcuts.js` | **New** — shortcut registration hook |
| `KeyboardShortcutProvider.jsx` | **New** — shortcut context provider |

---

## 5. New Files

| File | Purpose |
|------|---------|
| `src/hooks/useKeyboardShortcuts.js` | Hook for components to register their shortcuts |
| `src/providers/KeyboardShortcutProvider.jsx` | Context: shortcut registry, overlay toggle, input guard |
| `src/components/shared/ShortcutHelpOverlay.jsx` | F1 help overlay rendering shortcut categories |
| `src/components/ui/kbd.jsx` | Styled `<kbd>` component for shortcut hint badges |

---

## 6. No Backend Changes

This feature is entirely frontend. No API, database, or backend modifications required.

---

## 7. Testing Strategy

- **Manual keyboard testing:** Tab through every page, verify all shortcuts work
- **Screen reader testing:** Verify ARIA attributes with NVDA or VoiceOver
- **Dark/light mode:** Verify all visual changes look correct in both modes
- **Mobile testing:** Verify nothing is broken on touch devices
- **Build check:** `npm run build` must succeed with no errors
- **Performance:** Verify no layout shifts or jank from new transitions
