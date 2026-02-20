# Feature 029 — Implementation Plan

## Phase 1: Infrastructure (Toast + Confirm Dialog)

### Step 1.1: Install Sonner toast library
- Run `npm install sonner` in `frontend/`
- No vite.config.js changes needed (sonner is small, no vendor chunk split)

### Step 1.2: Add Toaster provider
- Add `<Toaster />` from `sonner` to `frontend/src/providers/Providers.jsx`
- Configure with `richColors` prop for success/error color variants
- Position: top-right (default)

### Step 1.3: Create ConfirmDialog component
- Create `frontend/src/components/ui/confirm-dialog.jsx`
- Reusable component using existing `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `@/components/ui/dialog`
- Props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `confirmText` (default "Confirmar"), `cancelText` (default "Cancelar"), `variant` (default "destructive")
- Destructive variant renders confirm button with `variant="destructive"`

## Phase 2: Backend — Auto-set fecha_actualizacion

### Step 2.1: Modify transaction_processor.py
- In `_apply_transaction()`, after building `insert_data` for INSERT:
  - Check if target model has `fecha_actualizacion` attribute
  - If yes, set `insert_data['fecha_actualizacion'] = datetime.now().isoformat()`
- In `_apply_transaction()`, for UPDATE cambios:
  - Check if target model has `fecha_actualizacion` attribute
  - If yes, add `cambios['fecha_actualizacion'] = datetime.now().isoformat()` before calling `crud.update()`
- This is generic — applies to all entities with `fecha_actualizacion` column, not just Notas

## Phase 3: Frontend — NotaFormModal Refinement

### Step 3.1: Auto-populate Registrado Por (R1)
- Import `useUser` from `@clerk/clerk-react`
- Get `user?.fullName || user?.firstName || 'Unknown'`
- Remove `registradoPor` state and its setter
- Replace the text input with a read-only disabled input showing the user's name
- Use the Clerk user name for both `registrado_por` in cambios and `usuario` in the transaction payload

### Step 3.2: Make Fecha and Nota mandatory (R2)
- Add `required` attribute to the date `<Input>` for Fecha
- Add `required` attribute to the `<textarea>` for Nota
- HTML5 form validation will handle the rest (browser shows native validation popup)
- Optionally add asterisk (*) to the labels to indicate required fields visually

### Step 3.3: Add toast notifications (R3)
- Import `toast` from `sonner`
- In `handleSubmit()` success path (after `onOpenChange(false)`):
  - Create: `toast.success('Nota creada correctamente')`
  - Update: `toast.success('Nota actualizada correctamente')`
- In `handleSubmit()` catch block:
  - `toast.error(err.response?.data?.detail || err.message || 'Error al guardar')`
- In `handleDelete()` success path:
  - `toast.success('Nota eliminada correctamente')`
- In `handleDelete()` catch block:
  - `toast.error(err.response?.data?.detail || err.message || 'Error al eliminar')`
- Keep inline error display in modal as well for additional context

### Step 3.4: Replace browser confirm with ConfirmDialog (R5)
- Add `deleteConfirmOpen` state (boolean)
- When user clicks "Eliminar" button, set `deleteConfirmOpen = true` instead of calling `window.confirm()`
- Render `<ConfirmDialog>` with:
  - title: "Eliminar Nota"
  - description: "¿Está seguro que desea eliminar esta nota? Esta acción no se puede deshacer."
  - onConfirm: calls the actual delete logic (existing `handleDelete` body)
  - variant: "destructive"
  - confirmText: "Eliminar"

## Phase 4: Verify Transacciones JSON Report

### Step 4.1: Verify backend endpoints
- Confirm `GET /transacciones-json/report-filter-options` returns proper filter data
- Confirm `POST /transacciones-json/search-report` returns paginated results
- Both endpoints already exist in `backend/app/routers/transacciones_json.py`

### Step 4.2: Verify frontend report page
- Confirm the page loads at `/informes/transacciones-json`
- Confirm filters populate from backend
- Confirm search/pagination/sorting work
- Confirm column configurator works
- If any issues found, fix them

## Phase 5: Documentation

### Step 5.1: Update architecture_frontend.md
- Add new section: "CUD Operations Pattern (transacciones_json)"
- Document the workflow: form → transaccion_json → process → refetch
- Document: ConfirmDialog for destructive ops, Toast for feedback, Clerk useUser for identity
- Reference NotaFormModal as the canonical implementation

### Step 5.2: Update README.md
- Add sonner to key dependencies list
- Add ConfirmDialog to shared components list
- Update Detail Page description to mention CUD operations

### Step 5.3: Update architecture_backend.md
- Document the auto-set `fecha_actualizacion` behavior in transaction_processor

## Implementation Order

```
Phase 1 (Infrastructure)  →  Phase 2 (Backend)  →  Phase 3 (Frontend)  →  Phase 4 (Verify)  →  Phase 5 (Docs)
```

Each phase builds on the previous:
- Phase 1 provides toast + confirm dialog infrastructure
- Phase 2 provides backend timestamp handling
- Phase 3 integrates everything in NotaFormModal
- Phase 4 validates the report is working
- Phase 5 documents the patterns

## Testing Plan

1. **Create Nota**: Open Detail page → click "+" on Notas → verify Registrado Por is auto-filled and read-only → fill Fecha + Nota + commit message → submit → verify success toast → verify nota appears in list
2. **Edit Nota**: Click pencil icon → verify fields populated → change Nota text → submit → verify success toast → verify changes reflected
3. **Delete Nota**: Click pencil icon → click Eliminar → verify styled confirmation dialog appears → confirm → verify success toast → verify nota removed
4. **Validation**: Try creating without Fecha → verify required validation → try creating without Nota → verify required validation
5. **Error handling**: Simulate API failure → verify error toast appears
6. **fecha_actualizacion**: After create/update, check database to confirm `fecha_actualizacion` is set
7. **Report**: Navigate to `/informes/transacciones-json` → verify filters load → search → verify results display correctly
