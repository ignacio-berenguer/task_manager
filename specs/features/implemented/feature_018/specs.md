# specs.md — feature_018: Date Field Quick Adjust, Homogenization & Enter-to-Submit

## Overview

Homogenize all date editing controls across the application into a single `DateInput` component with +/- increment buttons and keyboard accelerators for single-day adjustments. Add Enter key submission for all modals (excluding textareas).

## Scope

### Affected Modals and Date Fields

| Modal | File | Date Field | Current Component |
|-------|------|-----------|-------------------|
| AddAccionDialog | `features/shared/ActionDialogs.jsx` | `fecha_accion` | `DatePicker` |
| CompleteAndScheduleDialog | `features/shared/ActionDialogs.jsx` | `fecha_siguiente` | `DatePicker` |
| CambiarFechaDialog | `features/shared/ActionDialogs.jsx` | `fecha` | `DatePicker` |
| Edit Tarea Dialog | `features/detail/DetailPage.jsx` | `fecha_siguiente_accion` | `<Input type="date">` |
| Edit Accion Dialog | `features/detail/DetailPage.jsx` | `fecha_accion` | `<Input type="date">` |

All five will be migrated to the new `DateInput` component.

### Out of Scope

- Search page date filters (these are not in modals)
- Non-date fields
- Backend changes (purely frontend feature)

## Technical Design

### 1. DateInput Component — New Reusable Component

**File:** `components/ui/date-input.jsx`

A new composite component that wraps a text display of the date with +/- buttons and keyboard handling. This replaces both the `DatePicker` calendar-based component and native `<input type="date">` in modals.

**Props:**
```jsx
{
  value,        // ISO string (YYYY-MM-DD) or ''
  onChange,     // (isoDate: string) => void
  placeholder,  // string, default 'Seleccione fecha'
  disabled,     // boolean, default false
  id,           // string (optional)
  className,    // string (optional)
}
```

Same API as the existing `DatePicker` for drop-in replacement.

**Layout:**
```
[ - ]  [ 📅 DD/MM/YYYY  ✕ ]  [ + ]
```

- Left: "-" button (outline, icon size) — decrements date by 1 day
- Center: existing `DatePicker` component (calendar popup, clear button, display)
- Right: "+" button (outline, icon size) — increments date by 1 day

**Behavior:**
- Clicking "+" adds 1 day to the current `value`. If `value` is empty, defaults to today.
- Clicking "-" subtracts 1 day from the current `value`. If `value` is empty, defaults to today.
- The DatePicker in the center retains full calendar popup functionality.
- Buttons are disabled when the `disabled` prop is true.

**Keyboard Accelerators:**
- When the `DateInput` container has focus (or any child has focus):
  - `+` or `=` key → increment date by 1 day
  - `-` key → decrement date by 1 day
- These key handlers are attached to the outer container via `onKeyDown`.
- The handler checks `e.target.tagName` — if it's an `INPUT` or `TEXTAREA`, the key event is ignored (to not interfere with text typing). Since the DatePicker uses a `<button>` trigger (not a text input), the +/- keys will work when the DatePicker button is focused.
- `e.preventDefault()` is called to avoid the character being typed anywhere.

**Date Arithmetic:**
- Uses `new Date(y, m-1, d)` local-time parsing (same as existing `parseISO` in datepicker.jsx).
- Adds/subtracts by setting `date.setDate(date.getDate() ± 1)`.
- Serializes back to ISO with the existing `toISO` pattern.
- If the value is empty, both +/- default to today's date (via `getTodayISO()` helper).

### 2. Enter Key to Submit Modal

**Approach:** Add a `onKeyDown` handler at the `DialogContent` level (or at the form wrapper level within each modal).

**Behavior:**
- When `Enter` is pressed (without Ctrl):
  - If `e.target` is a `<textarea>`, do nothing (allow normal newline).
  - If `e.target` is inside the calendar popup (`.rdp` class), do nothing (allow calendar navigation).
  - Otherwise, `e.preventDefault()` and call the save handler.
- The existing `Ctrl+Enter` shortcut continues to work as before (it bypasses the textarea check).

**Implementation per modal:**
- Each modal's `handleKeyDown` is updated to handle both `Enter` (with textarea exclusion) and `Ctrl+Enter` (existing).
- The handler is placed on the outermost `<div>` inside `DialogContent` that wraps the form fields + footer, so it captures all key events within the modal form area.

### 3. Homogenize All Date Pickers

The application currently uses two different date input approaches:
- **Custom `DatePicker`** (calendar popup) — used in `ActionDialogs.jsx` (AddAccionDialog, CompleteAndScheduleDialog, CambiarFechaDialog)
- **Native `<Input type="date">`** — used in `DetailPage.jsx` (Edit Tarea, Edit Accion dialogs)

All five date fields will be replaced with the new `DateInput` component, ensuring a consistent look, behavior, and keyboard interaction everywhere dates are edited.

## Component Hierarchy

```
DateInput (new — components/ui/date-input.jsx)
├── Button "-" (decrement)
├── DatePicker (existing — components/ui/datepicker.jsx, unchanged)
└── Button "+" (increment)
```

## Styling

- +/- buttons use `variant="outline"` and `size="icon"` from the existing Button component, but with reduced sizing (`h-10 w-10`) to match the DatePicker height.
- The three elements are laid out with `flex items-center gap-2`.
- Buttons use `Minus` and `Plus` icons from `lucide-react`.
- Buttons have `tabIndex={-1}` to keep Tab-focus on the main DatePicker button, making keyboard navigation simpler.
- The +/- buttons use `type="button"` to prevent form submission.

## Keyboard Behavior Summary

| Key | Context | Action |
|-----|---------|--------|
| `+` or `=` | DateInput focused (not in text input) | Add 1 day |
| `-` | DateInput focused (not in text input) | Subtract 1 day |
| `Enter` | Modal (not in textarea, not in calendar) | Submit & close modal |
| `Ctrl+Enter` | Modal (anywhere) | Submit & close modal (existing) |
| `Escape` | Modal | Close without saving (existing) |

## No Backend Changes

This is a purely frontend feature. The API contract remains unchanged — dates are still sent as ISO `YYYY-MM-DD` strings.

## No Configuration Changes

No new `.env` variables needed. Logging uses the existing `createLogger` already present in each file.
