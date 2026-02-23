# Technical Specification — feature_010: Database Export API + Administrator Menu

## Overview

Add a database export capability that allows authenticated users to download the entire database as a JSON file, accessible through a new "Administrador" dropdown menu in the navbar.

## 1. Backend: Export API Endpoint

### 1.1 New Router: `backend/app/routers/admin.py`

**Endpoint:** `GET /api/v1/admin/export`

- **Authentication:** Protected via `verify_auth` dependency (same as all other routers)
- **Response:** JSON object containing all 5 tables with all records and all fields
- **Content-Type:** `application/json`
- **Content-Disposition:** `attachment; filename="task_manager_export_YYYY-MM-DD_HHMMSS.json"`

### 1.2 Export JSON Structure

```json
{
  "export_metadata": {
    "exported_at": "2026-02-23T14:30:00Z",
    "version": "1.0",
    "tables": ["estados_tareas", "estados_acciones", "responsables", "tareas", "acciones_realizadas"],
    "record_counts": {
      "estados_tareas": 4,
      "estados_acciones": 3,
      "responsables": 12,
      "tareas": 150,
      "acciones_realizadas": 400
    }
  },
  "data": {
    "estados_tareas": [...],
    "estados_acciones": [...],
    "responsables": [...],
    "tareas": [...],
    "acciones_realizadas": [...]
  }
}
```

**Table ordering rationale:** Parametric/reference tables first (estados_tareas, estados_acciones, responsables), then main tables (tareas), then dependent tables (acciones_realizadas). This order supports correct restoration — foreign key dependencies are satisfied when restoring in this sequence.

### 1.3 Data Serialization

- All fields are serialized as-is from the database
- `DATE` fields → ISO 8601 string (`"2026-02-23"`)
- `TIMESTAMP` fields → ISO 8601 string (`"2026-02-23T14:30:00"`)
- `NULL` values → JSON `null`
- Integer primary keys and foreign keys → JSON numbers

### 1.4 Router Registration

Register in `main.py` following the existing pattern:
```python
from app.routers import admin
app.include_router(admin.router, prefix=settings.API_PREFIX)
```

### 1.5 Logging

- Log at INFO level: "Database export initiated" (at start) and "Database export completed: {counts}" (at end)
- Log at ERROR level: any database errors during export

## 2. Frontend: Administrator Menu

### 2.1 Navbar Modification

Transform the "Administrador" entry in the navbar from a simple link into a dropdown menu. This is a new UI pattern since all current nav items are simple links.

**Desktop behavior:**
- Display "Administrador" as a nav item with a chevron-down icon
- On click, toggle a dropdown panel below the nav item
- Dropdown contains menu items, starting with "Exportar base de datos"
- Click outside or pressing Escape closes the dropdown

**Mobile behavior:**
- In the mobile menu drawer, "Administrador" expands/collapses to show sub-items inline (accordion-style)

### 2.2 Dropdown Menu Items

| Item | Icon | Action |
|------|------|--------|
| Exportar base de datos | Download | Call export API, trigger file download |

### 2.3 Export Action Implementation

Create an API function in a new file `frontend/src/api/admin.js`:

```javascript
export async function exportDatabase() {
  const response = await apiClient.get('/admin/export')
  // Create blob from response data
  // Generate filename with timestamp
  // Trigger browser download via temporary <a> element
}
```

**Download mechanism:**
1. Call `GET /api/v1/admin/export` via axios (authenticated)
2. Receive JSON response
3. Create `Blob` from `JSON.stringify(response.data, null, 2)` (pretty-printed)
4. Create temporary `<a>` element with `URL.createObjectURL(blob)`
5. Set `download` attribute to `task_manager_export_YYYY-MM-DD_HHMMSS.json`
6. Programmatically click and clean up

### 2.4 Loading State

While the export is in progress:
- Show a loading spinner or disable the menu item
- Prevent multiple concurrent export requests

### 2.5 Error Handling

- If the API call fails, show an error notification/toast to the user
- Log the error via the frontend logger

## 3. UI/UX Details

### 3.1 Language

All UI text in Spanish:
- Menu label: "Administrador"
- Menu item: "Exportar base de datos"
- Loading state: "Exportando..."
- Success feedback: Brief visual confirmation
- Error: "Error al exportar la base de datos"

### 3.2 Icons

- Administrador menu: `Settings` from lucide-react
- Export item: `Download` from lucide-react
- Dropdown chevron: `ChevronDown` from lucide-react

### 3.3 Styling

- Dropdown follows the same design language as the rest of the app (Tailwind, dark/light theme support)
- Uses existing color variables and patterns from the project's UI components

## 4. Files to Create

| File | Purpose |
|------|---------|
| `backend/app/routers/admin.py` | Export endpoint |
| `frontend/src/api/admin.js` | Export API client function |

## 5. Files to Modify

| File | Changes |
|------|---------|
| `backend/app/main.py` | Register admin router |
| `frontend/src/components/layout/Navbar.jsx` | Add Administrador dropdown menu |
| `frontend/src/lib/version.js` | Bump minor version to 10 |
| `frontend/src/lib/changelog.js` | Add feature_010 entry |
| `specs/architecture/architecture_backend.md` | Document export endpoint |
| `specs/architecture/architecture_frontend.md` | Document admin menu |
| `README.md` | Update with admin/export info |

## 6. No Changes Needed

- No new database tables or schema changes
- No new environment variables (uses existing DB connection and auth)
- No changes to existing CRUD operations or search functionality
- No changes to MCP server
