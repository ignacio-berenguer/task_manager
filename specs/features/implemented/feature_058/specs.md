# Feature 058 — UI Components Batch (F1, F2, F4, F6)

## Overview

A batch of four UI improvements identified in the feature_052 audit: a datepicker component for date fields, dialog size variants, changelog search/grouping, and a reusable EmptyState component.

---

## F1 — Datepicker Component

### Current State

- Date fields in `EntityFormModal.jsx` use HTML5 native `<input type="date">` (line ~305)
- Datetime fields use `<input type="datetime-local">`
- Dates stored in ISO format (`YYYY-MM-DD`), displayed as `DD/MM/YYYY`
- No date library in `package.json`

### Design

**Library:** `react-day-picker` v9 (lightweight, ~10KB gzipped, no heavy dependencies, excellent Tailwind integration via CSS variables).

**New component:** `frontend/src/components/ui/datepicker.jsx`

```jsx
<DatePicker
  value="2025-06-15"          // ISO string (YYYY-MM-DD) or null
  onChange={(isoDate) => {}}   // Returns ISO string or null
  placeholder="Seleccione fecha"
  disabled={false}
/>
```

**Behavior:**
- Renders as a styled button showing the formatted date (`DD/MM/YYYY`) or placeholder text
- Clicking opens a popover with a calendar (react-day-picker `DayPicker` in single mode)
- Calendar shows month/year navigation (prev/next arrows)
- Selected date highlighted with primary color
- Selecting a date closes the popover and fires `onChange` with ISO string
- Optional clear button (X icon) to reset to null
- Keyboard accessible: Tab to focus, Enter/Space to open, arrow keys to navigate calendar
- Locale: Spanish (`es`) for day/month names via `date-fns/locale/es`

**Popover positioning:** Use a simple absolute-positioned dropdown below the trigger button, with `z-50`. No need for a popover library — the component manages its own open state and closes on outside click or Escape.

**Integration with EntityFormModal:**
- Replace `<Input type="date" ...>` (line ~307) with `<DatePicker value={...} onChange={...} />`
- Keep `<Input type="datetime-local">` as-is for datetime fields (calendar + time picker is out of scope)
- The ISO format contract remains unchanged — DatePicker receives and returns `YYYY-MM-DD` strings

**Dependencies to add:**
- `react-day-picker` (v9)
- `date-fns` (peer dependency of react-day-picker, used for locale)

### Files Changed

| File | Change |
|------|--------|
| `frontend/package.json` | Add `react-day-picker`, `date-fns` |
| `frontend/src/components/ui/datepicker.jsx` | **New** — DatePicker component |
| `frontend/src/features/detail/components/EntityFormModal.jsx` | Replace `<Input type="date">` with `<DatePicker>` |

---

## F2 — Dialog Size Variants

### Current State

- `dialog.jsx` uses fixed `max-w-lg` (32rem / ~512px) for `DialogContent`
- No size prop; all dialogs are the same width
- Used by: EntityFormModal, ColumnConfigurator, ConfirmDialog, JsonViewerModal, SummaryViewerModal, ConsoleDialog

### Design

**Add `size` prop to `DialogContent`:**

```jsx
<DialogContent size="lg" onClose={handleClose}>
  {/* ... */}
</DialogContent>
```

**Size mapping:**

| Size | CSS Class | Approx Width | Use Case |
|------|-----------|--------------|----------|
| `sm` | `max-w-sm` | 384px | Simple confirm dialogs |
| `md` | `max-w-lg` | 512px | Default (current behavior) |
| `lg` | `max-w-3xl` | 768px | Forms, column configurator |
| `xl` | `max-w-5xl` | 1024px | JSON viewer, large content |
| `full` | `max-w-[95vw]` | 95% viewport | Console output, summaries |

**Default:** `md` (preserves current behavior — no breaking changes).

**Implementation:** Map `size` prop to Tailwind max-width class in `DialogContent`. Use `cn()` utility to merge with existing classes.

**Update existing usages where a different size is more appropriate:**

| Dialog | Current | New Size | Reason |
|--------|---------|----------|--------|
| ConfirmDialog | md | `sm` | Simple yes/no, doesn't need width |
| ColumnConfigurator | md | `lg` | Two-panel layout needs more room |
| JsonViewerModal | md | `xl` | JSON content is wide |
| SummaryViewerModal | md | `lg` | Formatted content benefits from width |
| ConsoleDialog | md | `xl` | Console output is wide |
| EntityFormModal | md | md | Current size is appropriate |

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/ui/dialog.jsx` | Add `size` prop with class mapping |
| `frontend/src/components/ui/confirm-dialog.jsx` | Pass `size="sm"` |
| `frontend/src/components/shared/ColumnConfigurator.jsx` | Pass `size="lg"` |
| `frontend/src/components/shared/JsonViewerModal.jsx` | Pass `size="xl"` |
| `frontend/src/components/shared/SummaryViewerModal.jsx` | Pass `size="lg"` |
| `frontend/src/components/shared/ConsoleDialog.jsx` | Pass `size="xl"` |

---

## F4 — Changelog Improvements

### Current State

- `changelog.js` has 54+ entries in a flat array
- `ChangelogSection.jsx` (57 lines) renders all entries as a vertical timeline
- No search, no grouping, no collapse — user must scroll through everything

### Design

**Two improvements: search filter + collapsible version ranges.**

#### Search Filter

- Text input at the top of the changelog section, below the header
- Placeholder: `"Buscar en el historial..."`
- Filters entries by matching query against `title` and `summary` (case-insensitive)
- Debounced or instant (since filtering is client-side on ~50 items, instant is fine)
- Search icon (lucide `Search`) inside input
- Clear button (X) when input has text
- Shows count of matching entries: `"N de M versiones"`

#### Collapsible Version Groups

- Group entries into ranges of 10: `v0.050–0.058`, `v0.040–0.049`, `v0.030–0.039`, etc.
- Most recent group is expanded by default
- Older groups collapsed by default
- Click group header to expand/collapse (chevron icon toggles)
- Group header shows: range label + count of entries in group
- When search is active, all groups with matching entries are expanded; empty groups are hidden

**Layout:**
```
[Search input: "Buscar en el historial..."]         [N de M versiones]

▼ v0.050 – 0.058  (9 versiones)
   • 0.058 — UI Components Batch ...
   • 0.054 — Navigation Enhancements ...
   • ...

▶ v0.040 – 0.049  (10 versiones)

▶ v0.030 – 0.039  (10 versiones)
...
```

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/features/landing/components/ChangelogSection.jsx` | Add search + grouping logic |

---

## F6 — EmptyState Component

### Current State

- Various ad-hoc empty state patterns across the app:
  - `InitiativeDrawer.jsx`: `<p className="text-sm text-muted-foreground py-2">Sin {entity} registradas.</p>`
  - `GenericReportPage`: `emptyMessage` config string
  - Detail page `EmptySectionsPanel`: Chips for empty sections
  - Search page: No explicit empty message (grid shows 0 rows)

### Design

**New component:** `frontend/src/components/shared/EmptyState.jsx`

```jsx
<EmptyState
  icon={SearchX}              // Lucide icon component (optional, default: Inbox)
  title="Sin resultados"      // Required
  description="Intente ajustar los filtros de búsqueda."  // Optional
  action={{                   // Optional
    label: "Limpiar filtros",
    onClick: handleClear,
    variant: "outline",       // Button variant (optional, default: "outline")
  }}
/>
```

**Visual design:**
- Centered vertically and horizontally within its container
- Icon: 48px, `text-muted-foreground/50` opacity
- Title: `text-lg font-semibold text-foreground`
- Description: `text-sm text-muted-foreground`, max-width for readability
- Action button: Below description, uses existing `Button` component
- Spacing: `py-12` vertical padding, `gap-3` between elements

**Integration points — replace existing empty state patterns:**

| Location | Current Pattern | New Pattern |
|----------|----------------|-------------|
| `GenericReportPage.jsx` | Text message from `emptyMessage` config | `<EmptyState icon={FileX} title="..." description={emptyMessage} />` |
| `SearchPage.jsx` (DataGrid area) | No message / empty grid | `<EmptyState icon={SearchX} title="Sin resultados" description="..." action={clearFilters} />` |
| `InitiativeDrawer.jsx` sections | `<p>Sin {entity} registradas.</p>` | `<EmptyState icon={Inbox} title="Sin {entity}" />` (compact variant) |

**Compact variant:** For inline use in drawer sections and detail accordions, add a `compact` prop that reduces padding (`py-4`) and icon size (32px), uses smaller text (`text-base` title, `text-xs` description).

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/shared/EmptyState.jsx` | **New** — EmptyState component |
| `frontend/src/features/reports/components/GenericReportPage.jsx` | Use EmptyState |
| `frontend/src/features/search/components/SearchPage.jsx` | Use EmptyState when 0 results |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Use compact EmptyState |

---

## Dependencies Summary

**New npm packages:**
- `react-day-picker` ^9.x
- `date-fns` ^4.x (peer dep of react-day-picker)

**New files (2):**
- `frontend/src/components/ui/datepicker.jsx`
- `frontend/src/components/shared/EmptyState.jsx`

**Modified files (10):**
- `frontend/package.json`
- `frontend/src/components/ui/dialog.jsx`
- `frontend/src/components/ui/confirm-dialog.jsx`
- `frontend/src/components/shared/ColumnConfigurator.jsx`
- `frontend/src/components/shared/JsonViewerModal.jsx`
- `frontend/src/components/shared/SummaryViewerModal.jsx`
- `frontend/src/components/shared/ConsoleDialog.jsx`
- `frontend/src/components/shared/InitiativeDrawer.jsx`
- `frontend/src/features/detail/components/EntityFormModal.jsx`
- `frontend/src/features/landing/components/ChangelogSection.jsx`
- `frontend/src/features/reports/components/GenericReportPage.jsx`
- `frontend/src/features/search/components/SearchPage.jsx`

**Post-implementation (mandatory):**
- `frontend/src/lib/version.js` — bump to 58
- `frontend/src/lib/changelog.js` — add entry
- `README.md` — update
- `specs/architecture/architecture_frontend.md` — update
