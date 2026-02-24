# Plan — feature_015: Sticky Results Bar & Table Header on Search Page

## Summary

Frontend-only change to `SearchPage.jsx`. Add sticky positioning to the results/filters bar and table header on XL+ screens, using `ResizeObserver` for dynamic height tracking and `max-xl:overflow-x-auto` to remove the scroll context on XL+ so the table header sticks relative to the viewport.

## Steps

### Step 1: Add ref and ResizeObserver for filter bar height

**File:** `frontend/src/features/search/SearchPage.jsx`

- Add `useRef` for the results/filter bar element
- Add `useState` for `filterBarHeight`
- Add `useEffect` with `ResizeObserver` to track the filter bar's border-box height
- Place the effect near the existing refs/state declarations

### Step 2: Make the results/filters bar sticky on XL+

**File:** `frontend/src/features/search/SearchPage.jsx` (line 551)

Change the results bar div classes from:
```
flex flex-wrap items-center gap-2 border-b px-4 py-3
```
to:
```
flex flex-wrap items-center gap-2 border-b px-4 py-3 xl:sticky xl:top-[7.25rem] xl:z-20 bg-card
```

- Add `ref={filterBarRef}` to the element
- `xl:sticky xl:top-[7.25rem]` positions it below navbar + page header
- `xl:z-20` places it above table content but below page header
- `bg-card` ensures opaque background when content scrolls behind

### Step 3: Set CSS variable on card wrapper

**File:** `frontend/src/features/search/SearchPage.jsx` (line 550)

Add inline style to the card wrapper div:
```jsx
<div
  className="rounded-lg border bg-card"
  style={{ '--thead-top': `calc(7.25rem + ${filterBarHeight}px)` }}
>
```

### Step 4: Fix table wrapper overflow for XL+

**File:** `frontend/src/features/search/SearchPage.jsx` (line 577)

Change the table wrapper from:
```
overflow-x-auto
```
to:
```
max-xl:overflow-x-auto
```

This only applies `overflow-x: auto` below XL. At XL+ no overflow is set (defaults to `visible`), removing the scroll context and allowing the thead to stick relative to the viewport. Note: `overflow-x-clip` was tried first but failed because the CSS spec forces `overflow-y: hidden` when one axis is `clip`, clipping the sticky thead.

### Step 5: Update table header sticky positioning

**File:** `frontend/src/features/search/SearchPage.jsx` (line 579)

Change thead classes from:
```
sticky top-0 z-10 bg-card
```
to:
```
sticky top-0 xl:top-[var(--thead-top)] z-10 bg-card
```

### Step 6: Make table header row background opaque

**File:** `frontend/src/features/search/SearchPage.jsx` (line 580)

Change the header row `<tr>` from:
```
border-b bg-muted/50
```
to:
```
border-b bg-muted
```

This prevents content showing through the semi-transparent background when the header is sticky.

### Step 7: Version bump and changelog

**File:** `frontend/src/lib/version.js`
- Increment `APP_VERSION.minor` to 15

**File:** `frontend/src/lib/changelog.js`
- Add new entry at the TOP of the `CHANGELOG` array:
  - version: "0.15"
  - feature: "feature_015"
  - title: "Sticky Results Bar & Table Header"
  - summary: Brief description of the feature

### Step 8: Update documentation

- Update `README.md` with any relevant changes
- Update `specs/architecture/architecture_frontend.md` if needed

## Verification

1. Open the Search page with enough results to scroll
2. Scroll down — verify the results bar (count + filter chips + Columnas) stays visible on XL+ screens
3. Scroll further — verify the table header row stays visible below the results bar
4. Add/remove filter chips — verify the table header adjusts position dynamically
5. Test on mobile viewport — verify no sticky behavior on the results bar and table header sticks within its container
6. Test dark mode and light mode — verify backgrounds are opaque and look correct
7. Test scroll restoration (navigate to detail and back) — verify it still works
