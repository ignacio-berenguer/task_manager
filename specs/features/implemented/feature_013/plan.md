# plan.md — feature_013: Mobile Responsive Fixes

## Implementation Plan

### Phase 1: Dialog Component (Foundation Fix)

**File**: `frontend/src/components/ui/dialog.jsx`

This is the foundation fix because multiple components (Search, Detail, ColumnConfigurator, ActionDialogs) use Dialog. Fixing it once benefits all.

**Changes**:
1. Add `max-w-[calc(100vw-2rem)]` to `DialogContent` so no dialog overflows on any screen
2. Change padding from `p-6` to `p-4 sm:p-6`
3. Add `p-1` to the close button for better tap target

---

### Phase 2: Search Page Fixes

**File**: `frontend/src/features/search/SearchPage.jsx`

**Changes** (in order within the file):

1. **Sticky header button** (~line 459): Add `hidden sm:inline` to "Nueva Tarea" text, keep Plus icon always visible. Make the button use `size="icon"` on mobile via conditional classes or just hide text.

2. **Mobile filter accordion sticky position** (~line 481): Change `sticky top-16 z-10` to `sticky top-[7.25rem] z-20` so it sits below the header instead of overlapping.

3. **Column filter icons** (~line 543): Increase from `h-3.5 w-3.5` to `h-4 w-4`. Wrap in a container with `p-0.5` for better tap area.

4. **Table row action buttons** (~lines 795, 804, 822, 832): Increase padding from `p-1` to `p-1.5` on the expand, quick-view, add-accion, and change-date buttons.

5. **Expanded row content** (~line 845): Change `px-6 py-4` to `px-3 py-3 sm:px-6 sm:py-4`. Change date width `w-24` to `w-20 sm:w-24`.

6. **Drawer grid** (~line 658): Change `grid grid-cols-2 gap-3` to `grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3`.

7. **Drawer padding** (~line 657): Change `px-6 pb-6` to `px-4 pb-4 sm:px-6 sm:pb-6`.

---

### Phase 3: Detail Page Fixes

**File**: `frontend/src/features/detail/DetailPage.jsx`

**Changes**:

1. **Header "Editar" button** (~line 200): Hide text on mobile — add `hidden sm:inline` to "Editar" text, keep Pencil icon always visible.

2. **CalendarClock tap target** (~line 191): Change `p-1` to `p-1.5`.

3. **Acciones table responsive layout** (~lines 219-248): Convert to a responsive approach:
   - On `sm:` and up: keep the existing table layout
   - On mobile (default): show a stacked card list with fecha, estado badge, and action text stacked vertically, with edit/delete buttons as an inline group

4. **Acciones table action buttons** (~lines 236-240): Increase from `h-7 w-7 p-0` / `h-3.5 w-3.5` to `h-8 w-8 p-0` / `h-4 w-4`.

5. **Accordion padding** (~lines 255, 258, 268, 271): Change all `px-6` to `px-4 sm:px-6`.

---

### Phase 4: Chat Page Fixes

**Files**: `frontend/src/features/chat/ChatPage.jsx`, `frontend/src/features/chat/components/ChatInput.jsx`

**Changes**:

1. **ChatPage header** (~line 17): Change `px-6 py-3` to `px-4 py-3 sm:px-6`.

2. **ChatInput send/stop buttons** (~lines 109, 113): Change `h-8 w-8` to `h-9 w-9`.

---

### Phase 5: NotFoundPage Fix

**File**: `frontend/src/components/shared/NotFoundPage.jsx`

**Changes**:
1. Heading: Change `text-6xl` to `text-4xl sm:text-6xl`
2. Description: Change `text-xl` to `text-lg sm:text-xl`
3. Container: Change `py-16` to `py-12 sm:py-16`

---

### Phase 6: Post-Implementation Checklist

1. **Version & Changelog**: Increment `APP_VERSION.minor` in `frontend/src/lib/version.js` to 13 and add changelog entry in `frontend/src/lib/changelog.js`
2. **Update README.md** if needed
3. **Update architecture docs** (`specs/architecture/architecture_frontend.md`) with note about mobile responsive patterns

## Files Modified (Summary)

| File | Phase | Changes |
|------|-------|---------|
| `frontend/src/components/ui/dialog.jsx` | 1 | Responsive width + padding + close button |
| `frontend/src/features/search/SearchPage.jsx` | 2 | 7 fixes (header, filters, table, drawer) |
| `frontend/src/features/detail/DetailPage.jsx` | 3 | 5 fixes (header, acciones, accordions) |
| `frontend/src/features/chat/ChatPage.jsx` | 4 | Header padding |
| `frontend/src/features/chat/components/ChatInput.jsx` | 4 | Button size |
| `frontend/src/components/shared/NotFoundPage.jsx` | 5 | Responsive text sizes |
| `frontend/src/lib/version.js` | 6 | Version bump |
| `frontend/src/lib/changelog.js` | 6 | Changelog entry |

## Testing Strategy

Since this is a CSS/layout-only change, testing should focus on:

1. **Visual inspection** at multiple viewport widths: 320px, 375px, 414px, 768px, 1024px, 1440px
2. **Key interactions** on mobile: tap filter icons, expand rows, open drawer, open dialogs, navigate to detail, edit tarea, add accion
3. **Desktop regression**: ensure nothing changes at desktop widths (all changes use mobile-first with `sm:` overrides)
4. Run `npm run build` to verify no build errors

## Risk Assessment

- **Low risk**: All changes are CSS class modifications using Tailwind responsive utilities
- **No logic changes**: No JavaScript behavior is modified
- **No breaking changes**: Desktop layout remains identical (all mobile styles are default, desktop uses `sm:` overrides)
- **One structural change**: Detail page acciones table → responsive card/table is the most complex change, but it's contained within a single component
