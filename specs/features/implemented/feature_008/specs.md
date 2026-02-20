# Feature 08: Transacciones Table Migration

## Overview

This feature adds migration support for the `transacciones` table from the Excel workbook `PortfolioDigital_Transacciones.xlsm`. The table serves as an audit trail for changes made to the portfolio data.

## Source Excel File

- **Workbook**: `PortfolioDigital_Transacciones.xlsm`
- **Worksheet**: `Transacciones`
- **Header rows to skip**: 3 (rows 0-2 contain metadata, row 3 contains headers)
- **Row count**: ~8,974 rows (sample file)

## Excel Column Structure

| Excel Column | Description | Data Type |
|-------------|-------------|-----------|
| ID | Unique transaction identifier | INTEGER |
| Clave1 | Primary key (usually portfolio_id) | TEXT |
| Clave2 | Secondary key (optional) | TEXT (nullable) |
| Tabla | Target table name | TEXT |
| Campo Tabla | Field being changed | TEXT |
| Valor Nuevo | New value after change | TEXT (mixed types) |
| Tipo Cambio | Change type: UPDATE, UPSERT, INSERT | TEXT |
| Estado Cambio | Change status: EJECUTADO, ERROR, PENDIENTE | TEXT |
| Fecha Registro Cambio | When change was registered | DATETIME |
| Fecha Ejecución Cambio | When change was executed | DATETIME (mixed) |
| Valor Antes del Cambio | Value before change | TEXT (mixed types) |
| Comentarios | Comments about the change | TEXT |

## Database Schema

Following the project naming convention (Spanish column names, accents removed, lowercase with underscores):

```sql
-- Audit trail for portfolio changes
-- Source: PortfolioDigital_Transacciones.xlsm, sheet "Transacciones"
CREATE TABLE transacciones (
    id INTEGER PRIMARY KEY,  -- Using ID from Excel as primary key
    clave1 TEXT,             -- Primary key (usually portfolio_id)
    clave2 TEXT,             -- Secondary key (optional)
    tabla TEXT,              -- Target table name
    campo_tabla TEXT,        -- Field being changed
    valor_nuevo TEXT,        -- New value after change
    tipo_cambio TEXT,        -- Change type: UPDATE, UPSERT, INSERT
    estado_cambio TEXT,      -- Change status: EJECUTADO, ERROR, PENDIENTE
    fecha_registro_cambio TEXT,   -- ISO 8601
    fecha_ejecucion_cambio TEXT,  -- ISO 8601
    valor_antes_del_cambio TEXT,  -- Value before change
    comentarios TEXT,        -- Comments
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME
);

CREATE INDEX idx_transacciones_clave1 ON transacciones (clave1);
CREATE INDEX idx_transacciones_tabla ON transacciones (tabla);
CREATE INDEX idx_transacciones_estado ON transacciones (estado_cambio);
```

## Column Mapping (Excel → Database)

| Excel Column | Database Column | Transformation |
|-------------|-----------------|----------------|
| ID | id | Direct (INTEGER PRIMARY KEY) |
| Clave1 | clave1 | normalize_portfolio_id() |
| Clave2 | clave2 | normalize_portfolio_id() |
| Tabla | tabla | Direct (TEXT) |
| Campo Tabla | campo_tabla | Direct (TEXT) |
| Valor Nuevo | valor_nuevo | normalize_multiline_text() |
| Tipo Cambio | tipo_cambio | Direct (TEXT) |
| Estado Cambio | estado_cambio | Direct (TEXT) |
| Fecha Registro Cambio | fecha_registro_cambio | normalize_date() |
| Fecha Ejecución Cambio | fecha_ejecucion_cambio | normalize_date() |
| Valor Antes del Cambio | valor_antes_del_cambio | normalize_multiline_text() |
| Comentarios | comentarios | normalize_multiline_text() |

## Implementation Details

### 1. Excel Reader Update

The `TransaccionesReader` class already exists in `src/migrate/excel_readers.py` but needs to be updated:

**Current (incorrect)**:
```python
df = pd.read_excel(self.file_path, sheet_name='Transacciones', skiprows=2)
```

**Updated (correct)**:
```python
df = pd.read_excel(self.file_path, sheet_name='Transacciones', skiprows=3)
```

### 2. Migration Method

Add `migrate_transacciones()` method to `MigrationEngine` class following the same pattern as other migrations (e.g., `migrate_notas()`).

### 3. Migration Sequence

Add transacciones migration to Phase 7 (new phase) in `migrate_all()`:

```python
# Phase 7: Audit data
logger.info("### PHASE 7: Audit Data ###")
results['transacciones'] = self.migrate_transacciones()
```

## Data Quality Considerations

1. **ID field**: Use as primary key directly from Excel (no auto-increment)
2. **Date fields**: Both date columns may contain mixed formats or error values - use `normalize_date()` with error handling
3. **Value fields**: `valor_nuevo` and `valor_antes_del_cambio` can contain various data types (dates, numbers, text) - store as TEXT
4. **No foreign key constraint**: `clave1` is NOT constrained to `iniciativas.portfolio_id` because it may reference other tables or contain legacy IDs

## Testing

```bash
# Test full migration including transacciones
uv run python main.py init --db test.db
uv run python main.py migrate --db test.db
uv run python main.py validate --db test.db

# Verify transacciones count
sqlite3 test.db "SELECT COUNT(*) FROM transacciones;"

# Sample query
sqlite3 test.db "SELECT id, clave1, tabla, tipo_cambio, estado_cambio FROM transacciones LIMIT 5;"
```

## Expected Outcome

After migration:
- `transacciones` table contains ~8,974 rows (actual count depends on source data)
- All columns mapped 1:1 from Excel
- Migration metadata recorded in `migracion_metadata` table
- No impact on existing functionality
