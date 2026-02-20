# Feature 046 — Document Summary Viewer Modals

## Overview

Add two viewer modals for LLM-generated document summaries (`resumen_documento`) to both the Detail page Documentos section and the Informe Documentos report page. A JSON viewer modal shows raw syntax-highlighted JSON; a formatted summary modal renders the JSON as clean, readable HTML.

## Scope

- **Module**: `frontend/` only (backend already returns all needed fields)
- **Pages affected**: Detail page (DocumentosSection), Informe Documentos (DocumentosReportPage)

---

## 1. New Components

### 1.1 `JsonViewerModal`

**Location**: `frontend/src/components/shared/JsonViewerModal.jsx`

A reusable modal that displays a JSON string with syntax highlighting.

**Props**:
```jsx
{
  open: boolean,
  onOpenChange: (open) => void,
  title: string,           // e.g., "SM100_Tabla_AGUI_VCR_Secundaria_V5.docx"
  jsonString: string,      // raw JSON string from resumen_documento
  sharePointUrl: string,   // enlace_documento (nullable)
}
```

**Behavior**:
- Parses `jsonString` with `JSON.parse()`, then re-serializes with `JSON.stringify(parsed, null, 2)` for consistent formatting
- Applies CSS-based syntax highlighting using `<span>` elements with color classes:
  - Keys: `text-cyan-400`
  - Strings: `text-green-400`
  - Numbers: `text-yellow-400`
  - Booleans/null: `text-purple-400`
  - Structural chars (braces, brackets, colons): `text-gray-400`
- Uses monospace font (`font-mono`) with dark background (`bg-gray-900 text-gray-100`)
- Content area scrollable with `max-h-[70vh] overflow-auto`
- If `jsonString` is null/empty, shows "No summary available" message
- If JSON parse fails, shows the raw text as-is in a `<pre>` block
- SharePoint link rendered as a button/link at the top if `sharePointUrl` is provided, using `toSharePointOnlineUrl()` helper
- Uses the existing `Dialog`/`DialogContent`/`DialogHeader` pattern
- Modal width: `max-w-3xl` (wide enough for JSON)

### 1.2 `SummaryViewerModal`

**Location**: `frontend/src/components/shared/SummaryViewerModal.jsx`

A reusable modal that renders JSON summary data as formatted HTML.

**Props**:
```jsx
{
  open: boolean,
  onOpenChange: (open) => void,
  title: string,           // e.g., "SM100_Tabla_AGUI_VCR_Secundaria_V5.docx"
  jsonString: string,      // raw JSON string from resumen_documento
  sharePointUrl: string,   // enlace_documento (nullable)
}
```

**Rendering rules**:
- Parse JSON into an object
- For each key-value pair:
  - **Key** → section heading: convert `snake_case` to `Title Case` (e.g., `titulo_documento` → "Titulo Documento", `puntos_clave` → "Puntos Clave")
  - **String value** → `<p>` paragraph with `whitespace-pre-line` for multi-line text
  - **Array value** → `<ul>` bullet list with `<li>` per item
  - **Empty string or empty array** → skip entirely (don't render the section)
  - **Null** → skip entirely
- Styled with Tailwind: clean spacing, subtle section dividers, readable font size
- Content area scrollable with `max-h-[70vh] overflow-auto`
- If `jsonString` is null/empty, shows "No summary available" message
- SharePoint link at the top, same as JsonViewerModal
- Modal width: `max-w-3xl`

### 1.3 Key label mapping helper

A small utility function `snakeCaseToTitle(key)`:
```js
"titulo_documento" → "Titulo Documento"
"puntos_clave" → "Puntos Clave"
"descripcion_requerimientos_funcionales" → "Descripcion Requerimientos Funcionales"
```

Implementation: split on `_`, capitalize first letter of each word, join with space.

---

## 2. Detail Page — DocumentosSection Changes

**File**: `frontend/src/features/detail/components/sections/DocumentosSection.jsx`

### 2.1 Add two action button columns

Add two new columns to the existing `COLUMNS` array:

```jsx
{
  key: '_json',
  label: '',
  render: (_, row) => row.resumen_documento ? (
    <button onClick={() => setJsonModal(row)} title="Ver JSON">
      <Code2 className="h-4 w-4" />
    </button>
  ) : null,
},
{
  key: '_summary',
  label: '',
  render: (_, row) => row.resumen_documento ? (
    <button onClick={() => setSummaryModal(row)} title="Ver Resumen">
      <FileText className="h-4 w-4" />
    </button>
  ) : null,
}
```

Icons from `lucide-react`: `Code2` (for JSON `{ }`), `FileText` (for formatted summary).

### 2.2 Add modal state and rendering

```jsx
const [jsonModal, setJsonModal] = useState(null)
const [summaryModal, setSummaryModal] = useState(null)
```

Render both modals at the bottom of the component, passing the selected row's data.

---

## 3. Report Page — DocumentosReportPage Changes

**File**: `frontend/src/features/reports/DocumentosReportPage.jsx`

### 3.1 Add two action columns to column definitions

Add two new column definitions to `ALL_COLUMNS`:

```jsx
{
  id: '_json',
  label: '',
  type: 'custom',
  width: 40,
  category: 'Documentos (por defecto)',
  renderCell: (_, row) => row.resumen_documento ? (
    <button onClick={() => setJsonModal(row)} title="Ver JSON">
      <Code2 className="h-4 w-4" />
    </button>
  ) : null,
},
{
  id: '_summary',
  label: '',
  type: 'custom',
  width: 40,
  category: 'Documentos (por defecto)',
  renderCell: (_, row) => row.resumen_documento ? (
    <button onClick={() => setSummaryModal(row)} title="Ver Resumen">
      <FileText className="h-4 w-4" />
    </button>
  ) : null,
}
```

### 3.2 Add modal state

Same pattern as DocumentosSection — two state variables for the two modals.

Since `GenericReportPage` renders the table internally, the `renderCell` approach (already used for `nombre_fichero` and `_download`) is the right integration point. The modal state and rendering will be in `DocumentosReportPage.jsx` itself, with the modals rendered outside the `GenericReportPage` component.

---

## 4. SharePoint Link in Modals

Both modals render a SharePoint link at the top of the content area:

```jsx
{sharePointUrl && (
  <a
    href={toSharePointOnlineUrl(sharePointUrl)}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
  >
    <ExternalLink className="h-4 w-4" />
    Open document in SharePoint
  </a>
)}
```

---

## 5. No Backend Changes

The API already returns `resumen_documento` and `enlace_documento` in:
- `GET /api/v1/portfolio/{portfolio_id}` (used by Detail page)
- `POST /api/v1/documentos/search-report-documentos` (used by report page)

No backend modifications needed.

---

## 6. Summary of File Changes

| File | Changes |
|------|---------|
| `frontend/src/components/shared/JsonViewerModal.jsx` | **New** — JSON syntax-highlighted viewer modal |
| `frontend/src/components/shared/SummaryViewerModal.jsx` | **New** — Formatted HTML summary viewer modal |
| `frontend/src/features/detail/components/sections/DocumentosSection.jsx` | Add JSON + Summary button columns, modal state + rendering |
| `frontend/src/features/reports/DocumentosReportPage.jsx` | Add JSON + Summary button columns, modal state + rendering |
