# Feature 024 — Implementation Plan

## Phase 1: Database Seed Data

**File**: `db/schema.sql`

1. Add "En curso" to the `INSERT INTO estados_tareas` seed data with `orden = 2`.
2. Shift existing orden values: En Progreso → 3, Completada → 4, Cancelada → 5.

```sql
INSERT INTO estados_tareas (valor, orden) VALUES
    ('Pendiente', 1),
    ('En curso', 2),
    ('En Progreso', 3),
    ('Completada', 4),
    ('Cancelada', 5)
ON CONFLICT DO NOTHING;
```

**Verification**: Read the file and confirm the seed data is correct.

---

## Phase 2: Update estadoOrder.js

**File**: `frontend/src/lib/estadoOrder.js`

1. Add `'En curso'` to the `ESTADO_ORDER` array after `'Pendiente'`.

Result:
```js
export const ESTADO_ORDER = [
  'Pendiente',
  'En curso',
  'En Progreso',
  'Completada',
  'Cancelada'
]
```

**Verification**: Read file and confirm.

---

## Phase 3: Enhance Create Task Dialog (SearchPage)

**File**: `frontend/src/features/search/SearchPage.jsx`

### Step 3.1: Add estado-tareas fetch

Add a state variable for estadosTarea and fetch `/estados-tareas` in the existing `useEffect` that loads filter options (around line 181):

```js
const [estadosTareaList, setEstadosTareaList] = useState([])

// Inside the useEffect that fetches filter-options:
apiClient.get('/estados-tareas')
  .then(res => setEstadosTareaList(res.data))
  .catch(() => setEstadosTareaList([]))
```

### Step 3.2: Default estado in form state

Change the initial `newTareaForm` state (line 154) from:
```js
{ tarea: '', responsable: '', tema: '', estado: '' }
```
to:
```js
{ tarea: '', responsable: '', tema: '', estado: 'En curso', proxima_accion: '', fecha_proxima_accion: '' }
```

Also update the form reset after creation (line 439) to use the same defaults.

### Step 3.3: Update the create dialog UI

In the "Nueva Tarea" dialog (lines 1046-1104):

1. **Estado dropdown**: Replace `filterOptions?.estados` source with `estadosTareaList` and use `e.valor` instead of `e` directly:
   ```jsx
   {estadosTareaList.map(e => (
     <option key={e.id} value={e.valor}>{e.valor}</option>
   ))}
   ```

2. **Add Próxima Acción field** (after Estado):
   ```jsx
   <div>
     <label className="text-sm font-medium">Próxima Acción</label>
     <Input
       value={newTareaForm.proxima_accion}
       onChange={e => setNewTareaForm(f => ({ ...f, proxima_accion: e.target.value }))}
       placeholder="Descripción de la próxima acción"
     />
   </div>
   ```

3. **Add Fecha Próxima Acción field** (after Próxima Acción):
   ```jsx
   <div>
     <label className="text-sm font-medium">Fecha Próxima Acción</label>
     <DateInput
       value={newTareaForm.fecha_proxima_accion}
       onChange={val => setNewTareaForm(f => ({ ...f, fecha_proxima_accion: val }))}
     />
   </div>
   ```

   Import `DateInput` at the top of the file if not already imported (check existing imports from `../shared/ActionDialogs` or `../../components/ui/`).

### Step 3.4: Update handleNewTarea to create accion

Modify `handleNewTarea` (lines 433-446) to:

1. Extract `proxima_accion` and `fecha_proxima_accion` from form before sending to API.
2. Send only tarea fields to `POST /tareas`.
3. If `proxima_accion` has a value, call `POST /acciones` with the new tarea_id.

```js
const handleNewTarea = async () => {
  if (!newTareaForm.tarea) return
  setNewTareaLoading(true)
  try {
    const { proxima_accion, fecha_proxima_accion, ...tareaData } = newTareaForm
    const res = await apiClient.post('/tareas', tareaData)
    const newTareaId = res.data.tarea_id

    // Create initial accion if provided
    if (proxima_accion) {
      await apiClient.post('/acciones', {
        tarea_id: newTareaId,
        accion: proxima_accion,
        fecha_accion: fecha_proxima_accion || null,
        estado: 'Pendiente'
      })
    }

    setNewTareaOpen(false)
    setNewTareaForm({ tarea: '', responsable: '', tema: '', estado: 'En curso', proxima_accion: '', fecha_proxima_accion: '' })
    doSearch(0)
  } catch (err) {
    LOG.error('Error creating tarea', err)
  } finally {
    setNewTareaLoading(false)
  }
}
```

### Step 3.5: Import DateInput

Check if `DateInput` is already imported in SearchPage.jsx. If not, add the import. `DateInput` is likely defined in `../shared/ActionDialogs.jsx` or a separate component file — find its source and add the import.

**Verification**: Run `npm run build` to ensure no compilation errors.

---

## Phase 4: Fix Edit Task Dialog Estado Dropdown (DetailPage)

**File**: `frontend/src/features/detail/DetailPage.jsx`

### Step 4.1: Add defensive fallback for estado dropdown

In the Edit Tarea dialog (lines 491-503), add a defensive check: if the current `editForm.estado` is not found in the fetched `estadosTarea` list, include it as an additional option. This handles the case where a tarea has an estado value that isn't in the parametric table (edge case).

Replace the estado dropdown with:
```jsx
<div>
  <label className="text-sm font-medium">Estado</label>
  <select
    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
    value={editForm.estado || ''}
    onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}
  >
    <option value="">-- Seleccionar --</option>
    {estadosTarea.map(e => (
      <option key={e.id} value={e.valor}>{e.valor}</option>
    ))}
    {editForm.estado && !estadosTarea.some(e => e.valor === editForm.estado) && (
      <option key="current" value={editForm.estado}>{editForm.estado}</option>
    )}
  </select>
</div>
```

**Primary fix**: With "En curso" added to the `estados_tareas` table (Phase 1), the dropdown will natively include it. The defensive fallback is a safety net for any unexpected values.

**Verification**: Run `npm run build` to ensure no compilation errors.

---

## Phase 5: Verification

1. **Backend check**: `cd backend && uv run python -c "from app.main import app; print('Backend OK')"`
2. **Frontend build**: `cd frontend && npm run build`
3. Review all modified files against specs.md for completeness.

---

## Phase 6: Post-Implementation

1. **Version bump**: Increment `APP_VERSION.minor` to `24` in `frontend/src/lib/version.js`.
2. **Changelog**: Add entry at TOP of `CHANGELOG` array in `frontend/src/lib/changelog.js`.
3. **Update docs**: Update `README.md`, `specs/architecture/architecture_frontend.md` as needed.
