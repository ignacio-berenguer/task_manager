# Technical Specification — feature_042: Etiquetas Destacadas

## Overview

Add a parametric table `etiquetas_destacadas` to highlight specific etiquetas across the application. When an initiative has etiquetas matching entries in this parametric table, they are displayed as prominent colored badges in the Detail page header and the InitiativeDrawer sidebar.

A new "Parametricas" dropdown menu replaces the current direct "Parametricas" nav link, grouping "Etiquetas Destacadas" (new management page) and "Parametricas" (existing page) as subitems.

---

## 1. Database

### New Table: `etiquetas_destacadas`

```sql
CREATE TABLE etiquetas_destacadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etiqueta TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT 'blue',
    orden INTEGER,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment ID |
| `etiqueta` | TEXT NOT NULL UNIQUE | The etiqueta value to highlight (must match `etiquetas.etiqueta` values) |
| `color` | TEXT DEFAULT 'blue' | Badge color hint (e.g., `blue`, `green`, `purple`) for future use |
| `orden` | INTEGER | Optional sort order for display |
| `fecha_creacion` | DATETIME | Auto-set on insert |
| `fecha_actualizacion` | DATETIME | Updated on modification |

**Initial Data (3 rows):**
```sql
INSERT INTO etiquetas_destacadas (etiqueta, orden) VALUES
  ('Enabler para Aumento de Inversión 2026', 1),
  ('Plan de Eficiencias 2025', 2),
  ('Plan Director Centro de Control', 3);
```

**Location:** Append to `db/schema.sql` after existing table definitions (before indices/triggers if any).

---

## 2. Backend

### 2.1 SQLAlchemy Model

**File:** `backend/app/models.py`

```python
class EtiquetaDestacada(Base):
    """Highlighted etiquetas (parametric table)."""
    __tablename__ = "etiquetas_destacadas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    etiqueta = Column(Text, nullable=False, unique=True)
    color = Column(Text, default="blue")
    orden = Column(Integer)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime)
```

### 2.2 Pydantic Schemas

**File:** `backend/app/schemas.py`

```python
class EtiquetaDestacadaCreate(BaseModel):
    etiqueta: str
    color: str | None = "blue"
    orden: int | None = None

class EtiquetaDestacadaUpdate(BaseModel):
    etiqueta: str | None = None
    color: str | None = None
    orden: int | None = None
```

### 2.3 Router

**File:** `backend/app/routers/etiquetas_destacadas.py`

Follow the `parametros.py` pattern (explicit CRUD, no router_factory). Endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET /etiquetas-destacadas/` | List all, ordered by `orden` then `etiqueta` |
| `POST /etiquetas-destacadas/` | Create (409 on duplicate `etiqueta`) |
| `PUT /etiquetas-destacadas/{id}` | Update by ID (409 on duplicate) |
| `DELETE /etiquetas-destacadas/{id}` | Delete by ID |

**Note:** URL uses hyphen (`etiquetas-destacadas`), table uses underscore (`etiquetas_destacadas`). This is consistent with other routers (e.g., `transacciones-json`).

Response format for list:
```json
{
  "data": [
    { "id": 1, "etiqueta": "...", "color": "blue", "orden": 1, "fecha_creacion": "..." }
  ],
  "total": 3
}
```

### 2.4 Registration

**File:** `backend/app/main.py` — Import and include new router in the "Parametric tables" section.

**File:** `backend/app/table_registry.py` — Add `"etiquetas_destacadas": EtiquetaDestacada` mapping (for potential future transaction support).

---

## 3. Frontend

### 3.1 Navigation — Parametricas Dropdown

**File:** `frontend/src/components/layout/Navbar.jsx`

Replace the direct `Parametricas` link in `trailingNavItems` with a dropdown menu (same pattern as the Informes dropdown).

**Before:**
```js
const trailingNavItems = [
  { name: 'Registro', href: '/register', icon: FileEdit },
  { name: 'Trabajos', href: '/jobs', icon: Briefcase },
  { name: 'Parametricas', href: '/parametricas', icon: Settings },
]
```

**After:**
```js
const trailingNavItems = [
  { name: 'Registro', href: '/register', icon: FileEdit },
  { name: 'Trabajos', href: '/jobs', icon: Briefcase },
]

const parametricasItems = [
  { name: 'Etiquetas Destacadas', href: '/parametricas/etiquetas-destacadas', icon: Star },
  { name: 'Parametricas', href: '/parametricas', icon: Settings },
]
```

The dropdown renders identically to the Informes dropdown: icon + "Parametricas" + chevron, with `parametricasItems` as menu items. Active state highlights when `location.pathname.startsWith('/parametricas')`.

Mobile navigation gets a "Parametricas" section header (same pattern as "Informes" section).

### 3.2 New Route

**File:** `frontend/src/App.jsx`

```jsx
const EtiquetasDestacadasPage = lazy(() => import('@/features/parametricas/EtiquetasDestacadasPage'))

// Inside <Routes>:
<Route path="/parametricas/etiquetas-destacadas" element={<ErrorBoundary><EtiquetasDestacadasPage /></ErrorBoundary>} />
```

**Important:** The new route `/parametricas/etiquetas-destacadas` must be defined **before** `/parametricas` to avoid route conflicts. React Router v6 handles this with specificity, but placing it first ensures clarity.

### 3.3 Etiquetas Destacadas Management Page

**File:** `frontend/src/features/parametricas/EtiquetasDestacadasPage.jsx`

Follow `ParametricasPage.jsx` pattern closely. Simplified since there's no `nombre_parametro` grouping.

**Features:**
- Header: "Etiquetas Destacadas" with Star icon
- Subtitle: "Gestione las etiquetas destacadas que se muestran de forma prominente en las iniciativas"
- "Nueva Etiqueta Destacada" button
- Table columns: Etiqueta, Color, Orden, Fecha Creacion, Acciones (edit/delete)
- Form dialog for create/edit with fields: etiqueta (text), color (select: blue/green/purple/orange/red), orden (number)
- Delete confirmation dialog
- Uses `@tanstack/react-query` with queryKey `['etiquetas-destacadas-all']`
- API calls to `/etiquetas-destacadas/`

**File:** `frontend/src/features/parametricas/EtiquetaDestacadaFormDialog.jsx`

Simple form dialog component (same pattern as `ParametroFormDialog`):
- Fields: `etiqueta` (text input), `color` (select dropdown), `orden` (number input)
- Mode: create / edit

### 3.4 Prominent Display — Detail Page Header

**File:** `frontend/src/features/detail/components/DetailHeader.jsx`

Add highlighted etiqueta badges below the initiative name in the sticky header.

**Data flow:**
1. `DetailPage.jsx` already has `etiquetas` data from `usePortfolioDetail`
2. Create a new hook `useEtiquetasDestacadas()` that fetches all `etiquetas_destacadas` from the API (cached, staleTime: 5 min)
3. In `DetailPage.jsx`, compute the intersection: etiquetas whose `etiqueta` value exists in the `etiquetas_destacadas` list
4. Pass the matching etiquetas as a prop `highlightedEtiquetas` to `DetailHeader`
5. `DetailHeader` renders them as colored badge elements next to the initiative name

**Badge rendering:**
```jsx
{highlightedEtiquetas.map((et) => (
  <span
    key={et.etiqueta}
    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  >
    {et.etiqueta}
  </span>
))}
```

Color classes map to the `color` field from `etiquetas_destacadas` (blue, green, purple, orange, red).

### 3.5 Prominent Display — Initiative Drawer

**File:** `frontend/src/components/shared/InitiativeDrawer.jsx`

Add highlighted etiqueta badges below the initiative name in the `SheetHeader`.

**Data flow:**
1. The drawer already fetches `portfolioData` via `GET /portfolio/{portfolioId}` which includes `etiquetas`
2. Use the same `useEtiquetasDestacadas()` hook
3. Compute intersection of `portfolioData.etiquetas` with `etiquetas_destacadas`
4. Render badges in the header area, below the initiative name and above the key-value fields

### 3.6 Shared Hook

**File:** `frontend/src/features/parametricas/hooks/useEtiquetasDestacadas.js`

```js
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'

export function useEtiquetasDestacadas() {
  return useQuery({
    queryKey: ['etiquetas-destacadas-all'],
    queryFn: async () => {
      const res = await apiClient.get('/etiquetas-destacadas/')
      return res.data.data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

### 3.7 Badge Color Utility

**File:** `frontend/src/lib/badgeColors.js`

```js
const BADGE_COLORS = {
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  green:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  red:    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function getBadgeColorClass(color) {
  return BADGE_COLORS[color] || BADGE_COLORS.blue
}
```

---

## 4. Matching Logic

The matching logic is straightforward:

```
matching_etiquetas = initiative.etiquetas.filter(e =>
  etiquetas_destacadas.some(ed => ed.etiqueta === e.etiqueta)
)
```

The comparison is on `etiquetas.etiqueta` (the tag name column) against `etiquetas_destacadas.etiqueta` (the highlighted tag name). This is an exact string match.

When displaying, each matched badge gets the `color` from the corresponding `etiquetas_destacadas` record.

---

## 5. Files Changed Summary

### New Files
| File | Description |
|------|-------------|
| `backend/app/routers/etiquetas_destacadas.py` | CRUD router |
| `frontend/src/features/parametricas/EtiquetasDestacadasPage.jsx` | Management page |
| `frontend/src/features/parametricas/EtiquetaDestacadaFormDialog.jsx` | Form dialog |
| `frontend/src/features/parametricas/hooks/useEtiquetasDestacadas.js` | Shared data hook |
| `frontend/src/lib/badgeColors.js` | Badge color utility |

### Modified Files
| File | Change |
|------|--------|
| `db/schema.sql` | Add `etiquetas_destacadas` table + initial data |
| `backend/app/models.py` | Add `EtiquetaDestacada` model |
| `backend/app/schemas.py` | Add create/update schemas |
| `backend/app/main.py` | Import & include router |
| `backend/app/table_registry.py` | Add table mapping |
| `frontend/src/App.jsx` | Add route for new page |
| `frontend/src/components/layout/Navbar.jsx` | Parametricas dropdown menu |
| `frontend/src/features/detail/DetailPage.jsx` | Pass highlighted etiquetas to header |
| `frontend/src/features/detail/components/DetailHeader.jsx` | Render badges |
| `frontend/src/components/shared/InitiativeDrawer.jsx` | Render badges |
