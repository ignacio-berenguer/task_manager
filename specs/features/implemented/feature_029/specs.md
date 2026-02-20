# Feature 029 — Notas CUD Refinement & Transacciones JSON Report

## Overview

Refine the existing Create/Update/Delete (CUD) operations for Notas on the Detail page, and establish the pattern as a reusable template for future entity CUD operations. Additionally, ensure the Transacciones JSON report page (already partially implemented) is fully functional.

## Current State

### What Exists
- **NotaFormModal** (`frontend/src/features/detail/components/NotaFormModal.jsx`) — modal form for create/edit/delete Notas via `transacciones_json`
- **NotasSection** (`frontend/src/features/detail/components/sections/NotasSection.jsx`) — displays notes sorted by fecha descending
- **Transaction Processor** (`backend/app/services/transaction_processor.py`) — applies pending JSON diffs to database
- **TransaccionesJsonReportPage** (`frontend/src/features/reports/TransaccionesJsonReportPage.jsx`) — report page already wired up with routes, navbar, backend endpoints

### What Needs to Change
1. "Registrado Por" auto-set from logged-in user's name (read-only)
2. "Fecha" and "Nota" fields made mandatory
3. Toast notifications for success/error on all CUD operations
4. `fecha_creacion` and `fecha_actualizacion` automatically set by backend
5. Delete confirmation via proper dialog (replace browser `confirm()`)
6. Document the CUD pattern in architecture docs for reuse
7. Reset form state when dialog opens (prevent stale values leaking between sessions)
8. Auto-focus Nota textarea when dialog opens
9. Tab order: commit message → submit button (skip Eliminar/Cancelar)
10. Commit message required for delete operations
11. Fix date/datetime formatting in reports (`DD/MM/YYYY HH:MM` for datetimes)

## Requirements

### R1: Registrado Por — Auto-Set from Logged-In User

**Current:** Free-text input field, user types their name manually.

**Target:**
- On **create mode**: Auto-populate with `user.fullName` from Clerk's `useUser()` hook
- On **edit mode**: Show existing `registrado_por` value as read-only
- Field is **read-only** (not editable) in both modes — displayed as plain text or disabled input
- The `usuario` field in the `transacciones_json` payload should also use the Clerk user's full name

**Implementation:**
- Import `useUser` from `@clerk/clerk-react` in `NotaFormModal`
- Use `user?.fullName || user?.firstName || 'Unknown'` as the value
- Remove the text input, replace with a read-only display (disabled input or plain text)
- Remove `registradoPor` from local state; derive it from `useUser()`

### R2: Fecha and Nota — Mandatory Fields

**Current:** Both fields are optional (no validation).

**Target:**
- **Fecha** (date input): Required. Form cannot submit without a date.
- **Nota** (textarea): Required. Form cannot submit without text content.
- Show validation errors inline below each field when empty on submit attempt.
- HTML5 `required` attribute on both fields.

**Implementation:**
- Add `required` attribute to the date input and textarea
- Add `minLength` or check for non-empty on submit
- Show inline validation message (e.g., "Este campo es obligatorio") below each field if empty

### R3: Toast Notifications

**Current:** No toast library installed. Errors shown inline in the modal. No success feedback.

**Target:**
- Install **Sonner** toast library (`sonner` npm package)
- Show **success toast** (green/success variant) after successful create/update/delete
- Show **error toast** (red/destructive variant) when operation fails
- Toasts auto-dismiss after ~4 seconds
- Toast messages:
  - Create success: "Nota creada correctamente"
  - Update success: "Nota actualizada correctamente"
  - Delete success: "Nota eliminada correctamente"
  - Error: Show the error message from the API response

**Implementation:**
- Install `sonner` package
- Add `<Toaster />` component in the app's Providers or Layout
- Use `toast.success()` and `toast.error()` in `NotaFormModal` after operations
- Keep inline error in modal as fallback (belt-and-suspenders)

### R4: fecha_creacion and fecha_actualizacion — Auto-Set by Backend

**Current:**
- `fecha_creacion` has `DEFAULT CURRENT_TIMESTAMP` in SQLite schema and `default=func.now()` in the model
- `fecha_actualizacion` is nullable, never set automatically
- The transaction processor uses `CRUDBase.create()` and `CRUDBase.update()` which don't explicitly set these fields

**Target:**
- **On INSERT**: `fecha_creacion` = current datetime (already works via default), `fecha_actualizacion` = current datetime
- **On UPDATE**: `fecha_actualizacion` = current datetime
- The frontend should NOT send these fields — they are backend-managed

**Implementation:**
- Modify `transaction_processor.py` `_apply_transaction()`:
  - For INSERT: Add `fecha_actualizacion` to `insert_data` with `datetime.now().isoformat()` if the target model has the column
  - For UPDATE: Add `fecha_actualizacion` to `cambios` with `datetime.now().isoformat()` if the target model has the column
- This is a generic improvement that benefits all entities, not just Notas
- Check for column existence with `hasattr(model, 'fecha_actualizacion')` before setting

### R5: Delete Confirmation Dialog

**Current:** Uses browser's native `window.confirm()` which looks out of place and has no styling control.

**Target:**
- Replace with a proper styled confirmation dialog using the existing `Dialog` component
- Clear destructive intent: red "Eliminar" button, neutral "Cancelar" button
- Title: "Eliminar Nota"
- Message: "¿Está seguro que desea eliminar esta nota? Esta acción no se puede deshacer."
- Dialog must be dismissed before any other action

**Implementation:**
- Create a reusable `ConfirmDialog` component (`frontend/src/components/ui/confirm-dialog.jsx`)
- Props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `confirmText`, `cancelText`, `variant`
- Use `variant="destructive"` for the confirm button
- Use this component in `NotaFormModal` to replace `window.confirm()`

### R6: Document CUD Pattern as Reusable Template

**Target:** Document the Notas CUD implementation in `specs/architecture/architecture_frontend.md` as a reference template for implementing CUD operations on other entities.

**Documentation should cover:**
1. The transacciones_json workflow (create transaction → process → refetch)
2. NotaFormModal pattern (form fields, submit, delete)
3. How to use Clerk for user identity
4. Toast notification pattern
5. ConfirmDialog pattern for destructive actions
6. How fecha_creacion/fecha_actualizacion are auto-managed

### R7: Verify Transacciones JSON Report

**Current state:** The report page (`TransaccionesJsonReportPage.jsx`) already exists with:
- Route registered at `/informes/transacciones-json` in `App.jsx`
- Navigation entry in `Navbar.jsx` with `FileJson` icon
- Backend endpoints: `GET /transacciones-json/report-filter-options` and `POST /transacciones-json/search-report`
- Frontend page with columns, filters, and buildRequestBody function

**Target:** Verify the report is fully functional. If any issues are found, fix them.

**Verification checklist:**
- Backend endpoints return correct data
- Frontend page loads filter options
- Search works with filters, sorting, and pagination
- Column configurator works
- Process button functionality (if applicable — this report is read-only display)

## Files Modified

### Frontend
| File | Changes |
|------|---------|
| `frontend/package.json` | Added `sonner` dependency |
| `frontend/src/providers/Providers.jsx` | Added `<Toaster richColors position="top-right" />` |
| `frontend/src/components/ui/confirm-dialog.jsx` | **NEW** — Reusable confirmation dialog |
| `frontend/src/features/detail/components/NotaFormModal.jsx` | R1-R5 + state reset, focus, tab order, commit-for-delete |
| `frontend/src/features/search/utils/columnDefinitions.js` | Fixed date/datetime formatting in `formatCellValue` |

### Backend
| File | Changes |
|------|---------|
| `backend/app/services/transaction_processor.py` | Auto-set `fecha_actualizacion` on INSERT/UPDATE (uses `datetime.now()`, not string) |

### Documentation
| File | Changes |
|------|---------|
| `specs/architecture/architecture_frontend.md` | CUD pattern template (8 key patterns), ConfirmDialog in UI components, Sonner in tech stack |
| `specs/architecture/architecture_backend.md` | Section 4.6: automatic timestamps in transaction processor |
| `README.md` | Sonner in tech stack, features 028-029 in list |

## Non-Goals

- No changes to the transacciones_json backend report endpoints (already implemented)
- No changes to the Navbar or App.jsx routes (already have transacciones-json report)
- No changes to other entity sections (Hechos, Acciones, etc.) — those will use this pattern in future features
- No changes to the transaction processor's core logic (INSERT/UPDATE/DELETE flow)
