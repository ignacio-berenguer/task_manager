# Specs — feature_027: Version number in navbar

## Overview

Display the application version string next to the "Task Manager" logo in the navbar. Update project documentation so the version–navbar link is part of the post-implementation checklist for all future features.

## Technical Design

### Navbar Change (`Navbar.jsx`)

**Import:** Add `VERSION_STRING` from `@/lib/version`.

**Placement:** Immediately after the "Task Manager" `<span>` (line 136-138), add a version badge:

```jsx
<span className="hidden text-xs text-muted-foreground sm:inline-block">
  v{VERSION_STRING}
</span>
```

- Uses `text-xs` + `text-muted-foreground` so it's subtle and doesn't compete with the app name.
- Hidden on mobile (`hidden sm:inline-block`) — same breakpoint as the "Task Manager" text.
- No new state, no new dependencies. Pure import + render.

### Documentation Changes

**`CLAUDE.md`** — In the "Post Implementation Checklist" section, add a note that the version in the navbar is sourced from `version.js` and stays in sync automatically when the minor version is bumped.

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/components/layout/Navbar.jsx` | Import `VERSION_STRING`, render next to logo |
| `CLAUDE.md` | Update post-implementation checklist |
| `frontend/src/lib/version.js` | Bump minor to 27 |
| `frontend/src/lib/changelog.js` | Add feature_027 entry |
