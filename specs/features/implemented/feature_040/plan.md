# Plan — feature_040: UI Improvements (Sticky Headers, Drawer Data, Estado Tags)

Three independent changes — can be implemented in any order.

## Phase 1: EstadoTag Fixed Width + Centered Text

**File**: `frontend/src/components/shared/EstadoTag.jsx`

Change the `className` on the `<span>`:

```
Before: inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
After:  inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium min-w-[8.5rem] text-center
```

Changes:
- Add `justify-center` — centers content in the flex container
- Add `text-center` — centers text within the span
- Add `min-w-[8.5rem]` — minimum width of 136px for visual consistency
- Change `px-2` to `px-2.5` — slightly more horizontal padding for centered text

This is a single-line change that affects all EstadoTag usages globally.

## Phase 2: Sticky Table Header in Search DataGrid

**File**: `frontend/src/features/search/components/DataGrid.jsx`

### 2a. Main data table (line ~242)

Change the `<th>` className to include sticky positioning:

```jsx
// Current:
'p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground'

// New (add sticky classes):
'p-3 text-left font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground sticky top-16 z-10 bg-muted'
```

Key: `sticky top-16` (offset by navbar 64px), `z-10` (above table body), `bg-muted` (opaque, not transparent `bg-muted/60`).

Also change the `<tr>` background from `bg-muted/60` to nothing (background now on `<th>`).

### 2b. Loading skeleton header (line ~184)

Same treatment for consistency while loading.

### 2c. Empty state header (line ~210)

Same treatment for consistency when no data.

## Phase 3: Additional Data Tables in InitiativeDrawer

**File**: `frontend/src/components/shared/InitiativeDrawer.jsx`

### 3a. Replace data fetching

Replace the current `apiClient.post('/hechos/search', ...)` call with `apiClient.get(`/portfolio/${portfolioId}`)`:

```jsx
const [portfolioData, setPortfolioData] = useState(null)
const [loading, setLoading] = useState(false)

useEffect(() => {
  if (!isOpen || !portfolioId) { setPortfolioData(null); return }
  let cancelled = false
  setLoading(true)
  apiClient.get(`/portfolio/${portfolioId}`)
    .then(res => { if (!cancelled) setPortfolioData(res.data) })
    .catch(() => { if (!cancelled) setPortfolioData(null) })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
}, [isOpen, portfolioId])
```

Extract arrays from `portfolioData`:
```jsx
const hechos = portfolioData?.hechos || []
const notas = portfolioData?.notas || []
const justificaciones = portfolioData?.justificaciones || []
const descripciones = portfolioData?.descripciones || []
const dependencias = portfolioData?.dependencias || []
```

### 3b. Add DrawerTable helper

Create a reusable inline component or extract a helper to render each data section consistently:

```jsx
function DrawerSection({ title, data, columns, renderRow }) {
  return (
    <div>
      <h3 className="text-sm font-semibold font-heading mb-2">
        {title} ({data.length})
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Sin {title.toLowerCase()} registradas.</p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map(col => (
                  <th key={col.key} className={`p-2 text-left text-xs font-semibold text-muted-foreground ${col.className || ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

### 3c. Add 4 new sections after Hechos

1. **Notas**: columns = Fecha, Registrado Por, Nota. Nota uses `whitespace-pre-wrap` for long text.
2. **Justificaciones**: columns = Tipo, Valor, Comentarios
3. **Descripciones**: columns = Tipo, Descripcion (whitespace-pre-wrap)
4. **Dependencias**: columns = Descripcion, Fecha, Comentarios

Each renders only when data exists (show empty state text when count is 0).

## Phase 4: Post-Implementation Checklist

1. Update `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 40
2. Update `frontend/src/lib/changelog.js` — add entry at TOP of `CHANGELOG` array
3. Update `README.md`
4. Update `specs/architecture/architecture_frontend.md`
5. Verify frontend builds: `cd frontend && npm run build`
6. Use `/close_feature feature_040` to move to implemented and commit

## Verification

1. **Sticky header**: Open Search page, scroll down with many results — header should stay fixed below navbar
2. **EstadoTag**: Check any table with estado columns — tags should be uniform width with centered text
3. **Drawer data**: Open side drawer on any initiative — should show Hechos, Notas, Justificaciones, Descripciones, Dependencias sections
4. **Theme**: Verify all changes look correct in both light and dark mode
