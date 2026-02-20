# Technical Specification — feature_047

## Documentos Table Processing Improvement

### Overview

This feature encompasses 11 sub-features that improve the documentos processing pipeline across all three modules (management, backend, frontend). The changes include:
- Loading `documentos` from Excel instead of preserving across migrations
- Creating a new `documentos_items` table that expands `resumen_documento` JSON
- Exporting and importing `documentos_items` to/from Excel
- CLI renaming (`main.py` → `manage.py`, command rename)
- Adding `scan_documents` to the full pipeline
- Frontend improvements (side drawer, row expansion, estado tags)

---

## 1. Database Schema Changes

### 1.1 Remove `documentos` from PRESERVED_TABLES

Currently `documentos` is in `PRESERVED_TABLES` in `management/src/init/db_init.py`. Since `documentos` will now be migrated from Excel, it should be **removed** from `PRESERVED_TABLES`. Only `transacciones_json` remains preserved.

### 1.2 New Table: `documentos_items`

Add to `db/schema.sql` after the `documentos` table:

```sql
CREATE TABLE documentos_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    nombre_fichero TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    tipo_registro TEXT NOT NULL,
    texto TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    FOREIGN KEY (nombre_fichero) REFERENCES documentos (nombre_fichero) ON DELETE CASCADE
);

CREATE INDEX idx_documentos_items_portfolio ON documentos_items (portfolio_id);
CREATE INDEX idx_documentos_items_fichero ON documentos_items (nombre_fichero);
CREATE INDEX idx_documentos_items_tipo_registro ON documentos_items (tipo_registro);
```

**Column definitions:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | Surrogate key |
| `portfolio_id` | TEXT NOT NULL | From parent `documentos` row |
| `nombre_fichero` | TEXT NOT NULL | FK to `documentos.nombre_fichero` |
| `tipo_documento` | TEXT NOT NULL | From parent `documentos` row (SM100, SM200, etc.) |
| `tipo_registro` | TEXT NOT NULL | JSON key name (e.g., `resumen`, `puntos_clave`, `alcance`) |
| `texto` | TEXT | JSON value as text. Arrays are joined with newlines. |

**Expansion logic for `resumen_documento` JSON:**
- Parse `resumen_documento` as JSON
- For each key-value pair:
  - If value is a **string**: store directly as `texto`
  - If value is an **array of strings**: join with `\n` and store as `texto`
  - If value is **null/empty**: skip
  - If JSON parsing fails (e.g., `{"error": "..."}` entries): skip the row
- `tipo_registro` = the JSON key name (e.g., `resumen`, `titulo_documento`, `puntos_clave`)

---

## 2. Management CLI Changes

### 2.1 Rename `main.py` → `manage.py`

Rename `management/main.py` to `management/manage.py`. All internal references remain the same; only the file name and documentation change.

### 2.2 Rename Command `full_calculation_datos_relevantes` → `complete_process`

- Change the command name in `argparse` choices
- Update the command handler logic
- Update epilog/help text
- Update all documentation references

### 2.3 Migrate `documentos` from Excel (Phase 10)

Add a new **Phase 10: Document Data** to `MigrationEngine.migrate_all()`:

**Source file:** `PortfolioDigital_Documentos.xlsx` (or `.xlsm`)
**Source worksheet:** Read from `.env` config (`DOCUMENTOS_EXCEL_WORKSHEET`, default: `Documentos`)

**Migration process:**
1. Auto-detect header row (Excel files may have title rows before the actual column headers — scan the first 10 rows looking for at least 3 expected header names from `DOCUMENTOS_COLUMN_MAPPING`)
2. Empty the `documentos` and `documentos_items` tables (DELETE FROM, child table first for FK integrity)
3. Read from `PortfolioDigital_Documentos.xlsx` using the detected header row
4. Normalize column names (lowercase, strip, replace spaces with underscores, remove accents)
5. Map Excel columns to DB columns using the reverse of `DOCUMENTOS_COLUMN_MAPPING`
6. Convert pandas Timestamp values to ISO format strings for SQLite compatibility
7. Convert token counts to integers
8. INSERT OR REPLACE each row into `documentos`

**Config:** Use existing `DOCUMENTOS_EXCEL_PATH` from `.env` (currently `excel_output/PortfolioDigital_Documentos.xlsm`). Add new `DOCUMENTOS_IMPORT_EXCEL_PATH` config for the import source file in `excel_source/` directory, separate from the export path.

### 2.4 Generate `documentos_items` (Calculation Step)

After migration, as part of the calculation process (or as a separate step within `complete_process`), expand `resumen_documento` JSON into `documentos_items`:

1. Query all rows from `documentos` where `resumen_documento` IS NOT NULL
2. For each row, parse `resumen_documento` JSON
3. For each key-value pair, create a `documentos_items` row
4. INSERT into `documentos_items`
5. Log statistics

This runs after `documentos` migration and before export.

### 2.5 Export `documentos_items` to Excel

Add a new export function following the same pattern as `export_datos_relevantes` and `export_documentos`:

**Output file:** `PortfolioDigital_Documentos_Items_Calculation.xlsx` (or `.xlsm`)
**Config keys:**
- `DOCUMENTOS_ITEMS_EXCEL_PATH` — path to output file
- `DOCUMENTOS_ITEMS_EXCEL_WORKSHEET` — worksheet name (default: `Documentos_Items`)
- `DOCUMENTOS_ITEMS_EXCEL_TABLE` — table name (default: `Documentos_Items`)

**Column mapping:**
```python
DOCUMENTOS_ITEMS_COLUMN_MAPPING = {
    'id': 'ID',
    'portfolio_id': 'Portfolio ID',
    'nombre_fichero': 'Nombre Fichero',
    'tipo_documento': 'Tipo Documento',
    'tipo_registro': 'Tipo Registro',
    'texto': 'Texto',
}
```

### 2.6 Import `documentos_items` from Excel (Phase 10)

Also in Phase 10, after `documentos` migration:
1. Empty `documentos_items` table
2. Read from `PortfolioDigital_Documentos_Items.xlsx` (in `excel_source/`)
3. Map columns and INSERT

**Config key:** `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH` (in `excel_source/`)

**Important:** The import from Excel takes priority over the calculation expansion, but falls back if the import yields 0 rows (e.g., template file with no data). The pipeline should:
1. Migrate `documentos` from Excel
2. If `PortfolioDigital_Documentos_Items.xlsx` exists → try to import from it (with header auto-detection)
3. If the file doesn't exist OR the import yields 0 rows → generate `documentos_items` from `resumen_documento` JSON expansion
4. Export `documentos_items` to `PortfolioDigital_Documentos_Items_Calculation.xlsx` (creates new file from scratch if no template with Excel Table exists)

### 2.7 Add `scan_documents` to `complete_process`

The `complete_process` pipeline becomes a 6-step process:

1. `recreate_tables` (drop + create from schema, preserve `transacciones_json`)
2. `migrate` (Excel → SQLite, including documentos + documentos_items)
3. `calculate_datos_relevantes`
4. `export_datos_relevantes`
5. `scan_documents` (scan filesystem folders → add new documents)
6. `export_documentos` (export updated documentos to Excel)

**Note:** `scan_documents` runs after migration because it adds **new** documents found on the filesystem that aren't yet in the Excel. The export after scan ensures the Excel stays up to date.

---

## 3. Backend Changes

### 3.1 `DocumentoItem` Model

Add to `backend/app/models.py`:

```python
class DocumentoItem(Base):
    __tablename__ = "documentos_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Text, nullable=False)
    nombre_fichero = Column(Text, nullable=False)
    tipo_documento = Column(Text, nullable=False)
    tipo_registro = Column(Text, nullable=False)
    texto = Column(Text)
```

### 3.2 Table Registry

Add `"documentos_items": DocumentoItem` to `TABLE_MODELS` in `table_registry.py`.

### 3.3 Router (optional)

A basic CRUD router for `documentos_items` via the `router_factory` pattern. No search endpoint needed initially — the data is consumed primarily through the frontend detail page and reports.

---

## 4. Frontend Changes

### 4.1 Informe Documentos Side Drawer & Expandable Rows (Requirements 9 & 12)

Add `showDrawer: true` and `collapsibleConfig` to the `config` object in `DocumentosReportPage.jsx`. The `GenericReportPage` already has full drawer and collapsible row support built in.

**collapsibleConfig:**
- `mainColumnIds`: portfolio_id, nombre, tipo_documento, nombre_fichero, estado_proceso_documento, _download, _json, _summary
- `detailColumnIds`: enlace_documento, ruta_documento, fecha_creacion, fecha_actualizacion, estado_de_la_iniciativa

GenericReportPage's `CollapsibleRow` component was enhanced to support `renderCell` for custom columns (download/json/summary buttons with `stopPropagation`), and improved detail panel rendering with `EstadoTag` for estado fields and formatted dates.

### 4.2 Detail Page Documentos Row Expansion (Requirement 10)

Modify `DocumentosSection.jsx` to support expandable rows. When a user clicks a row, it expands to show additional fields not shown in the main table:
- `ruta_documento`
- `enlace_documento`
- `fecha_creacion`
- `fecha_actualizacion`
- `tokens_input`
- `tokens_output`

**Implementation approach:** Add expand/collapse functionality to `SimpleTable` or handle it directly in `DocumentosSection` using local state to track expanded row indices. Each expanded row renders a detail panel below the row.

The `ruta_documento` column should be **removed** from the main table columns and only shown in the expanded detail area. The main table columns become:
- `tipo_documento`
- `nombre_fichero` (link)
- `estado_proceso_documento` (tag — see 4.3)
- `_download`, `_json`, `_summary` (action icons)

### 4.3 Estado Proceso as Tag (Requirement 11)

#### 4.3.1 Color Mapping

Add `estado_proceso_documento` colors to `estadoColors.js`:

```javascript
// Document processing states
'Completado': GREEN,   // already mapped
'Pendiente': RED,      // already mapped
'Error': RED,          // new — same as Cancelado
'Ignorado': GRAY,      // new — neutral
```

`Completado` and `Pendiente` are already mapped. Only `Error` and `Ignorado` need to be added.

#### 4.3.2 DocumentosSection (Detail Page)

Change the `estado_proceso_documento` column from plain text to use `type: 'estado'`:

```javascript
{ key: 'estado_proceso_documento', label: 'Estado Proceso', type: 'estado' }
```

`SimpleTable` already handles `type: 'estado'` by rendering `<EstadoTag />`.

#### 4.3.3 DocumentosReportPage

Change the `estado_proceso_documento` column to render as a tag using `renderCell`:

```javascript
{
  id: 'estado_proceso_documento',
  label: 'Estado Proceso',
  type: 'estado',
  category: 'Documentos (por defecto)',
}
```

The `GenericReportPage` already handles `type: 'estado'` columns by rendering `<EstadoTag />`.

---

## 5. Configuration Changes

### 5.1 Management `.env` / `.env.example`

New config keys:
```env
# Documentos import (migration source)
DOCUMENTOS_IMPORT_EXCEL_PATH=excel_source/PortfolioDigital_Documentos.xlsx

# Documentos Items export (calculation output)
DOCUMENTOS_ITEMS_EXCEL_PATH=excel_output/PortfolioDigital_Documentos_Items_Calculation.xlsm
DOCUMENTOS_ITEMS_EXCEL_WORKSHEET=Documentos_Items
DOCUMENTOS_ITEMS_EXCEL_TABLE=Documentos_Items

# Documentos Items import (migration source, optional)
DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH=excel_source/PortfolioDigital_Documentos_Items.xlsx
```

### 5.2 Settings Module

Add the new config keys to `management/src/config/settings.py`.

---

## 6. Documentation Updates

### Files to update:
- `README.md` — CLI command changes (manage.py, complete_process), new tables
- `CLAUDE.md` — CLI command references, project structure, database table counts
- `specs/architecture/architecture_management.md` — new migration phase, export, pipeline
- `specs/architecture/architecture_frontend.md` — documentos UI improvements
- `specs/architecture/architecture_backend.md` — new model, registry entry
- `management/.env.example` — new config keys
