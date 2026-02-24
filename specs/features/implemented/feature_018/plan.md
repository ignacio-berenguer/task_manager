# plan.md — feature_018: Date Field Quick Adjust, Homogenization & Enter-to-Submit

## Implementation Phases

### Phase 1: Create the DateInput component

**File:** `frontend/src/components/ui/date-input.jsx`

1. Create the new `DateInput` component that wraps the existing `DatePicker` with +/- buttons.
2. Import `DatePicker` from `./datepicker`, `Button` from `./button`, `Minus`/`Plus` from `lucide-react`.
3. Implement the layout: `flex items-center gap-2` with `-` button, `DatePicker`, `+` button.
4. Implement `adjustDate(delta)` helper:
   - If value is empty, use today's date.
   - Parse the ISO string, add `delta` days, serialize back to ISO, call `onChange`.
5. Attach `onKeyDown` to the outer container:
   - If `e.target` is `INPUT` or `TEXTAREA`, return early (don't intercept typing).
   - If key is `+` or `=`, call `adjustDate(+1)`, `preventDefault()`.
   - If key is `-`, call `adjustDate(-1)`, `preventDefault()`.
6. Export the component with the same prop interface as `DatePicker`.

### Phase 2: Update ActionDialogs — Homogenize to DateInput + Enter-to-submit

**File:** `frontend/src/features/shared/ActionDialogs.jsx`

#### AddAccionDialog
1. Replace `DatePicker` import/usage with `DateInput`.
2. Update `handleKeyDown`:
   - Add `Enter` handling: if `e.target` is not a `textarea` and not inside `.rdp`, call `handleSave()`.
   - Keep existing `Ctrl+Enter` handling.

#### CompleteAndScheduleDialog
1. Replace `DatePicker` usage for `fecha_siguiente` with `DateInput`.
2. Update `handleKeyDown`:
   - Add `Enter` handling: if `e.target` is not a `textarea` and not inside `.rdp`, call `handleSave()`.
   - Keep existing `Ctrl+Enter` handling.

#### CambiarFechaDialog
1. Replace `DatePicker` import/usage with `DateInput`.
2. Update `handleKeyDown`:
   - Add `Enter` handling (same logic as above, though this dialog has no textarea).
   - Keep existing `Ctrl+Enter` handling.

### Phase 3: Update DetailPage — Homogenize to DateInput + Enter-to-submit

**File:** `frontend/src/features/detail/DetailPage.jsx`

#### Edit Tarea Dialog
1. Replace `<Input type="date">` for `fecha_siguiente_accion` with `DateInput`.
2. Add `onKeyDown` handler to the dialog form wrapper:
   - `Enter` (not in textarea): call `saveEdit()`.
   - `Ctrl+Enter`: call `saveEdit()`.

#### Edit Accion Dialog
1. Replace `<Input type="date">` for `fecha_accion` with `DateInput`.
2. Add `onKeyDown` handler to the dialog form wrapper:
   - `Enter` (not in textarea): call `saveEditAccion()`.
   - `Ctrl+Enter`: call `saveEditAccion()`.

### Phase 4: Update SearchPage — Enter-to-submit for New Tarea dialog

**File:** `frontend/src/features/search/SearchPage.jsx`

The New Tarea dialog has no date fields, but it should also support Enter-to-submit for consistency.

1. Add `onKeyDown` handler to the New Tarea dialog form wrapper:
   - `Enter` (not in textarea): call the save handler.

### Phase 5: Testing & version bump

1. Manually verify all 5 modals with date fields:
   - +/- buttons increment/decrement the date.
   - +/- keyboard keys work when DateInput is focused.
   - Empty date defaults to today on +/- press.
   - Calendar popup still works correctly.
   - Clear button still works.
   - All modals now use the same DateInput component (no native `<input type="date">` or bare `DatePicker` remaining).
2. Verify Enter-to-submit in all 6 modals:
   - Enter submits the form from any non-textarea field.
   - Enter inside textarea inserts a newline (does NOT submit).
   - Ctrl+Enter still submits from anywhere.
   - Escape still closes without saving.
3. Verify no regressions in existing functionality.
4. Update `frontend/src/lib/version.js` — increment minor to 18.
5. Update `frontend/src/lib/changelog.js` — add entry for feature 018.

### Phase 6: Documentation

1. Update `README.md` with keyboard shortcut info if relevant.
2. Update `specs/architecture/architecture_frontend.md` — document the new `DateInput` component.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/ui/date-input.jsx` | **NEW** — DateInput composite component |
| `frontend/src/features/shared/ActionDialogs.jsx` | Replace all DatePicker → DateInput, add Enter-to-submit (3 dialogs) |
| `frontend/src/features/detail/DetailPage.jsx` | Replace Input type="date" → DateInput, add Enter-to-submit (2 dialogs) |
| `frontend/src/features/search/SearchPage.jsx` | Add Enter-to-submit for New Tarea dialog |
| `frontend/src/lib/version.js` | Bump minor version |
| `frontend/src/lib/changelog.js` | Add feature 018 entry |
| `README.md` | Update if relevant |
| `specs/architecture/architecture_frontend.md` | Document DateInput component |

## Homogenization Summary

| Before | After |
|--------|-------|
| `DatePicker` (3 usages in ActionDialogs.jsx) | `DateInput` |
| `<Input type="date">` (2 usages in DetailPage.jsx) | `DateInput` |

After this feature, every date editing control in the app will be a `DateInput` — same look, same +/- buttons, same keyboard shortcuts.

## Risk Assessment

- **Low risk**: This is a purely frontend, additive change. No API or database modifications.
- **Keyboard conflict**: The `+`/`-`/`=` keys are intercepted only when focus is on the DateInput container (specifically on button elements), not on text inputs or textareas. This avoids interfering with typing.
- **Enter key conflict**: The Enter handler explicitly checks for textarea and calendar elements to avoid breaking existing behavior.
