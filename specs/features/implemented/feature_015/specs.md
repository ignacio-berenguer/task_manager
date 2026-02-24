# Specs — feature_015: Sticky Results Bar & Table Header on Search Page

## Overview

Make the results/filters bar and the table header row on the Search page sticky so they remain visible while scrolling through task results. This is a **frontend-only** change affecting `SearchPage.jsx`.

## Current State

The Search page layout has this vertical stack (all using document-level scrolling):

| Element | Position | Classes |
|---------|----------|---------|
| Navbar | `sticky top-0 z-50` | h-16 (64px) |
| Page header ("Busqueda de Tareas") | `sticky top-16 z-30` | ~52px tall |
| Mobile filters (< XL) | `sticky top-[7.25rem] z-20` | Variable height (accordion) |
| Desktop sidebar (XL+) | `sticky top-[8rem]` | Fixed in sidebar column |
| **Results/filters bar** | **Not sticky** | Inside card, line 551 |
| **Table header (thead)** | `sticky top-0 z-10` | Relative to `overflow-x-auto` parent, NOT viewport (line 579) |

### Problem

1. **Results/filters bar** (result count + filter chips + Columnas button) scrolls out of view.
2. **Table header** has `sticky top-0`, but its parent `<div className="overflow-x-auto">` (line 577) creates a scroll context, so the thead only sticks within that container, not relative to the viewport.

## Technical Approach

### 1. Make Results/Filters Bar Sticky (XL+ only)

Add sticky positioning to the results bar div (line 551):

```
xl:sticky xl:top-[7.25rem] xl:z-20 bg-card
```

- **`xl:sticky xl:top-[7.25rem]`**: Sticks at 116px from viewport top (below navbar 64px + page header ~52px). Matches the position used by mobile filters.
- **`xl:z-20`**: Below page header (z-30), above table header (z-10).
- **`bg-card`**: Explicit opaque background to prevent content showing through. Currently inherited from parent card; must be explicit for sticky elements.

**Why XL+ only**: On mobile (< XL), the mobile filter accordion is already sticky at `top-[7.25rem]`. Adding another sticky element at the same position would cause overlap. The mobile screen is smaller, making sticky less critical.

### 2. Fix Table Wrapper Overflow (XL+ only)

Change the table wrapper (line 577) from:

```
overflow-x-auto
```

to:

```
max-xl:overflow-x-auto
```

- **`max-xl:overflow-x-auto`** (mobile only): Preserves horizontal scrolling for narrow screens below XL. The thead remains sticky within this scroll container (`top-0`), which is acceptable mobile behavior.
- **At XL+**: No overflow property is set, defaulting to `overflow: visible`. This avoids creating a scroll context, so the thead's `sticky` positioning is relative to the viewport. Initial attempts with `overflow-x-clip` failed because the CSS spec forces `overflow-y: hidden` when `overflow-x` is `clip` and the other axis is `visible`, which clips the sticky thead. Using `xl:overflow-visible` also failed due to Tailwind v4 cascade issues with shorthand/longhand overrides.

### 3. Make Table Header Sticky Relative to Viewport (XL+)

The thead (line 579) needs a dynamic `top` value on XL+ that accounts for:
- Navbar (4rem) + Page header (~3.25rem) = 7.25rem
- Plus the results/filters bar height (variable — depends on how many filter chips wrap)

**Approach**: Use `ResizeObserver` to measure the results bar height, then set a CSS custom property `--thead-top` on the card wrapper:

```js
--thead-top: calc(7.25rem + ${filterBarHeight}px)
```

The thead uses responsive Tailwind classes:

```
sticky top-0 xl:top-[var(--thead-top)] z-10
```

- **Mobile** (`top-0`): Sticky within the `overflow-x-auto` container.
- **XL+** (`top-[var(--thead-top)]`): Sticky relative to viewport, positioned below the results bar.

### 4. Opaque Table Header Background

The current header row (line 580) uses `bg-muted/50` (50% opacity). When sticky, content scrolling behind it will be visible through the semi-transparent background.

Change to fully opaque:

```
bg-muted/50  →  bg-muted
```

Also ensure `bg-card` on the thead itself is opaque (it already is — `bg-card` uses the theme's card color variable which is a solid color).

### 5. Visual Polish

- The results bar already has `border-b` — sufficient visual separation.
- The table header row already has `border-b` — sufficient visual separation.
- Optionally add a subtle `shadow-sm` to the results bar when sticky, but start without it and iterate based on visual testing.

## Z-Index Stacking Order

| Z-Index | Element |
|---------|---------|
| z-50 | Navbar |
| z-30 | Page header |
| z-20 | Results bar (XL+ sticky), Mobile filters |
| z-10 | Table header |

## Responsive Behavior

| Breakpoint | Results Bar | Table Header |
|------------|-------------|--------------|
| Mobile/Tablet (< XL) | Not sticky (scrolls normally) | Sticky `top-0` within `overflow-x-auto` container |
| Desktop (XL+) | Sticky at `top-[7.25rem]` | Sticky at `top-[var(--thead-top)]` (viewport-relative) |

## Implementation Details

### New State / Refs

```jsx
const filterBarRef = useRef(null)
const [filterBarHeight, setFilterBarHeight] = useState(0)
```

### ResizeObserver Effect

```jsx
useEffect(() => {
  const el = filterBarRef.current
  if (!el) return
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      setFilterBarHeight(entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight)
    }
  })
  observer.observe(el)
  return () => observer.disconnect()
}, [results])
```

Uses `borderBoxSize` (includes padding + border) for accurate measurement. Falls back to `offsetHeight`. Depends on `results` because the filter bar element is conditionally rendered (`{results && ...}`) and doesn't exist on initial mount.

### CSS Variable on Card Wrapper

```jsx
<div
  className="rounded-lg border bg-card"
  style={{ '--thead-top': `calc(7.25rem + ${filterBarHeight}px)` }}
>
```

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/features/search/SearchPage.jsx` | Add sticky positioning, ref, ResizeObserver, CSS variable |

## Edge Cases

- **No results**: Card is short or absent — sticky doesn't activate. No issue.
- **Many filter chips**: Bar wraps to multiple lines — `ResizeObserver` tracks height changes dynamically.
- **Breakpoint transition**: Tailwind's `xl:` prefix handles responsive switching seamlessly.
- **Scroll restoration**: Existing `window.scrollTo` restoration is unaffected; no scroll mechanism changes.
