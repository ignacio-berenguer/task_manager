# Plan — feature_027: Version number in navbar

## Step 1: Add version to Navbar

**File:** `frontend/src/components/layout/Navbar.jsx`

1. Import `VERSION_STRING` from `@/lib/version`.
2. After the "Task Manager" span (line ~136-138), add:
   ```jsx
   <span className="hidden text-xs text-muted-foreground sm:inline-block">
     v{VERSION_STRING}
   </span>
   ```

## Step 2: Update CLAUDE.md

**File:** `CLAUDE.md`

In the "Post Implementation Checklist" section, add a bullet noting that the version displayed in the navbar comes from `version.js` and is automatically kept in sync when the minor version is bumped per the existing checklist item.

## Step 3: Version & Changelog

- `frontend/src/lib/version.js` — bump minor to 27.
- `frontend/src/lib/changelog.js` — add entry for feature_027.

## Step 4: Verify

- Run `npm run build` to confirm no errors.
- Visually confirm version appears in navbar.

## Summary of Changes

| File | Type | Description |
|------|------|-------------|
| `frontend/src/components/layout/Navbar.jsx` | Edit | Import + render version string |
| `CLAUDE.md` | Edit | Add navbar-version note to checklist |
| `frontend/src/lib/version.js` | Edit | Bump version |
| `frontend/src/lib/changelog.js` | Edit | Add changelog entry |
