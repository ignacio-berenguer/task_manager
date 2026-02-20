# Feature 058 — Implementation Plan

## Phase 1: F6 — EmptyState Component

**Rationale:** Start with EmptyState since it's the simplest component with no external dependencies, and it's a prerequisite for feature_059's D3 (improved empty states).

### Step 1.1: Create EmptyState component

**File:** `frontend/src/components/shared/EmptyState.jsx` (new)

- Create component accepting props: `icon`, `title`, `description`, `action`, `compact`
- Default icon: `Inbox` from lucide-react
- Standard mode: `py-12`, 48px icon, `text-lg` title
- Compact mode: `py-4`, 32px icon, `text-base` title, `text-xs` description
- Action renders a `Button` with configurable `label`, `onClick`, `variant`
- Centered flex column layout

### Step 1.2: Integrate into GenericReportPage

**File:** `frontend/src/features/reports/components/GenericReportPage.jsx`

- Import `EmptyState`
- Replace the empty results message with `<EmptyState icon={FileX} title="Sin resultados" description={emptyMessage} />`
- Keep existing `emptyMessage` config as the `description` prop

### Step 1.3: Integrate into SearchPage

**File:** `frontend/src/features/search/components/SearchPage.jsx`

- Import `EmptyState`
- When results are loaded but empty (`data.length === 0`), show `<EmptyState>` with search icon, title, description, and optional "clear filters" action
- Only show when a search has been performed (not on initial load)

### Step 1.4: Integrate into InitiativeDrawer

**File:** `frontend/src/components/shared/InitiativeDrawer.jsx`

- Import `EmptyState`
- Replace `<p>Sin {entity} registradas.</p>` with `<EmptyState compact title="Sin {entity}" />` in `DrawerSection`

---

## Phase 2: F2 — Dialog Size Variants

**Rationale:** Simple prop addition to existing component. Quick win, enables better sizing for other dialogs.

### Step 2.1: Add size prop to DialogContent

**File:** `frontend/src/components/ui/dialog.jsx`

- Define size-to-class mapping: `{ sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-[95vw]' }`
- Add `size` prop to `DialogContent` (default: `'md'`)
- Replace hardcoded `max-w-lg` with dynamic class from mapping
- Use `cn()` to merge with any additional className passed

### Step 2.2: Update existing dialog consumers

**Files to update:**

| File | Size |
|------|------|
| `frontend/src/components/ui/confirm-dialog.jsx` | `sm` |
| `frontend/src/components/shared/ColumnConfigurator.jsx` | `lg` |
| `frontend/src/components/shared/JsonViewerModal.jsx` | `xl` |
| `frontend/src/components/shared/SummaryViewerModal.jsx` | `lg` |
| `frontend/src/components/shared/ConsoleDialog.jsx` | `xl` |

- For each file, add the `size` prop to the `<DialogContent>` usage
- Verify no visual regressions by checking the component renders correctly

---

## Phase 3: F1 — Datepicker Component

**Rationale:** Requires npm install and a new component. Should be done before feature_059's D2 (date presets).

### Step 3.1: Install dependencies

```bash
cd frontend && npm install react-day-picker date-fns
```

### Step 3.2: Create DatePicker component

**File:** `frontend/src/components/ui/datepicker.jsx` (new)

- Import `DayPicker` from react-day-picker and `es` locale from date-fns
- Create `DatePicker` component with props: `value` (ISO string), `onChange`, `placeholder`, `disabled`
- Trigger button: styled like Input, shows formatted date (DD/MM/YYYY) or placeholder
- Calendar dropdown: absolutely positioned below trigger, z-50
- Click outside or Escape to close
- Clear button (X icon) when value is set
- Calendar icon on the left side of the trigger
- Style calendar to match app theme (use CSS variables from Tailwind)
- Single date selection mode

### Step 3.3: Integrate into EntityFormModal

**File:** `frontend/src/features/detail/components/EntityFormModal.jsx`

- Import `DatePicker` from `components/ui/datepicker`
- In the field rendering switch (~line 305), replace:
  ```jsx
  // Before
  <Input type="date" value={...} onChange={...} />
  // After
  <DatePicker value={...} onChange={...} />
  ```
- Keep `datetime-local` inputs unchanged (out of scope)
- Adjust onChange handler: DatePicker returns ISO string directly (no `e.target.value` needed)

---

## Phase 4: F4 — Changelog Improvements

**Rationale:** Largest UI change, modifying an existing component significantly. Done last to avoid conflicts.

### Step 4.1: Add search and grouping to ChangelogSection

**File:** `frontend/src/features/landing/components/ChangelogSection.jsx`

**Search functionality:**
- Add state: `searchQuery`
- Add Input field with Search icon (left) and clear X button (right)
- Filter `CHANGELOG` entries by matching query against `title` + `summary` (case-insensitive `.includes()`)
- Show result count: `"N de M versiones"`

**Version grouping:**
- Compute groups from filtered entries: ranges of 10 (0.001–0.009, 0.010–0.019, ..., 0.050–0.059)
- Add state: `expandedGroups` (Set of group keys)
- Most recent group expanded by default
- When search is active, expand all groups that have matches
- Group header: clickable row with ChevronDown/ChevronRight icon, range label, entry count badge
- Animate collapse with CSS transition (max-height or conditional render)

**Preserve existing timeline styling** within each group.

---

## Phase 5: Post-Implementation Checklist

### Step 5.1: Version bump

**File:** `frontend/src/lib/version.js`
- Set `minor: 58`

### Step 5.2: Changelog entry

**File:** `frontend/src/lib/changelog.js`
- Add at TOP of array:
  ```js
  {
    version: '0.058',
    feature: 58,
    title: 'UI Components Batch',
    summary: 'Four UI improvements: (1) Datepicker calendar component for date fields, (2) Dialog size variants (sm/md/lg/xl/full), (3) Changelog search and collapsible version groups, (4) Reusable EmptyState component for empty data areas.',
  }
  ```

### Step 5.3: Update README.md

- Add EmptyState to shared components list
- Add DatePicker to UI components list
- Note dialog size variants
- Note changelog improvements

### Step 5.4: Update architecture_frontend.md

- Document EmptyState component and its usage pattern
- Document DatePicker component
- Document dialog size variants
- Document changelog grouping/search

### Step 5.5: Close feature

- Use `/close_feature feature_058`

---

## Execution Order Summary

```
Phase 1: EmptyState (F6)     — No dependencies, foundational
Phase 2: Dialog sizes (F2)   — No dependencies, quick
Phase 3: Datepicker (F1)     — Requires npm install
Phase 4: Changelog (F4)      — Largest change, self-contained
Phase 5: Post-implementation — Version, changelog, docs
```

## Risk Notes

- **react-day-picker v9** uses CSS modules by default; need to verify Tailwind integration works with Vite. Fallback: use inline styles or custom CSS.
- **Dialog size changes** may affect layout of existing modals — verify each consumer visually.
- **Changelog grouping** changes the visual structure significantly — test with current 54+ entries.
