# Feature 046 — Implementation Plan

## Overview

Frontend-only feature: create two reusable viewer modals and integrate them into two existing pages. No backend changes needed.

---

## Phase 1: Create Shared Components

### 1.1 Create `JsonViewerModal.jsx`

**File**: `frontend/src/components/shared/JsonViewerModal.jsx` (NEW)

- Create a Dialog-based modal with `max-w-3xl` width
- Accept props: `open`, `onOpenChange`, `title`, `jsonString`, `sharePointUrl`
- Implement `syntaxHighlight(json)` function that converts a JSON string into JSX with colored `<span>` elements:
  - Keys → `text-cyan-400`
  - Strings → `text-green-400`
  - Numbers → `text-yellow-400`
  - Booleans/null → `text-purple-400`
  - Structural chars → `text-gray-400`
- Parse `jsonString` with `JSON.parse()`, re-serialize with `JSON.stringify(parsed, null, 2)` for consistent formatting
- Render in `<pre>` block with `font-mono bg-gray-900 text-gray-100` and `max-h-[70vh] overflow-auto`
- Handle null/empty jsonString → "No summary available" message
- Handle parse failure → show raw text in `<pre>` block
- Render SharePoint link at top using `toSharePointOnlineUrl()` from `@/lib/sharepoint`
- Import: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`
- Import: `ExternalLink` from `lucide-react`

### 1.2 Create `SummaryViewerModal.jsx`

**File**: `frontend/src/components/shared/SummaryViewerModal.jsx` (NEW)

- Create a Dialog-based modal with `max-w-3xl` width
- Accept same props as JsonViewerModal
- Implement `snakeCaseToTitle(key)` helper: split on `_`, capitalize first letter of each word, join with space
- Parse JSON and iterate key-value pairs:
  - Skip null, empty string, empty array values
  - String → render as `<p>` with `whitespace-pre-line`
  - Array → render as `<ul>` with `<li>` per item
  - Key → render as section heading (`<h3>`) using `snakeCaseToTitle()`
- Handle null/empty jsonString → "No summary available" message
- Handle parse failure → show raw text
- Render SharePoint link at top (same pattern as JsonViewerModal)
- Styled with clean Tailwind spacing and subtle section dividers

---

## Phase 2: Integrate into DocumentosSection (Detail Page)

**File**: `frontend/src/features/detail/components/sections/DocumentosSection.jsx` (MODIFY)

- Import `useState` (if not already imported)
- Import `Code2`, `FileText` from `lucide-react`
- Import `JsonViewerModal` from `@/components/shared/JsonViewerModal`
- Import `SummaryViewerModal` from `@/components/shared/SummaryViewerModal`
- Add two state variables: `jsonModal` and `summaryModal` (both default `null`, hold selected row or null)
- Add two new columns to the `COLUMNS` array:
  - `_json` column: renders `Code2` icon button when `row.resumen_documento` exists, onClick sets `jsonModal` to the row
  - `_summary` column: renders `FileText` icon button when `row.resumen_documento` exists, onClick sets `summaryModal` to the row
- Render both modals at the bottom of the component JSX:
  - `JsonViewerModal` with `open={!!jsonModal}`, passing `jsonModal?.nombre_fichero` as title, `jsonModal?.resumen_documento` as jsonString, `jsonModal?.enlace_documento` as sharePointUrl
  - `SummaryViewerModal` with equivalent props from `summaryModal`

---

## Phase 3: Integrate into DocumentosReportPage (Informe Documentos)

**File**: `frontend/src/features/reports/DocumentosReportPage.jsx` (MODIFY)

- Import `useState` (if not already imported)
- Import `Code2`, `FileText` from `lucide-react`
- Import `JsonViewerModal` from `@/components/shared/JsonViewerModal`
- Import `SummaryViewerModal` from `@/components/shared/SummaryViewerModal`
- Add two state variables: `jsonModal` and `summaryModal`
- Add two new column definitions to `ALL_COLUMNS` array in the default category:
  - `_json`: type `custom`, width 40, renderCell with `Code2` icon button
  - `_summary`: type `custom`, width 40, renderCell with `FileText` icon button
- Render both modals after the `GenericReportPage` component in the JSX return

---

## Phase 4: Version Bump, Changelog & Documentation

- Increment `APP_VERSION.minor` to `46` in `frontend/src/lib/version.js`
- Add changelog entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`
- Update `README.md` with feature 046 description
- Update `specs/architecture/architecture_frontend.md` with new shared components

---

## Phase 5: Build Verification

- Run `npm run build` in `frontend/` to verify no compilation errors
- Review all modified files for correctness

---

## File Change Summary

| File | Action |
|------|--------|
| `frontend/src/components/shared/JsonViewerModal.jsx` | **CREATE** |
| `frontend/src/components/shared/SummaryViewerModal.jsx` | **CREATE** |
| `frontend/src/features/detail/components/sections/DocumentosSection.jsx` | **MODIFY** |
| `frontend/src/features/reports/DocumentosReportPage.jsx` | **MODIFY** |
| `frontend/src/lib/version.js` | **MODIFY** |
| `frontend/src/lib/changelog.js` | **MODIFY** |
| `README.md` | **MODIFY** |
| `specs/architecture/architecture_frontend.md` | **MODIFY** |
