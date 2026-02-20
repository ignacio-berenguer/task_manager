# Feature 09: Fichas Table Migration

## Overview

This feature adds migration support for the `fichas` table from the Excel workbook `PortfolioDigital_Fichas.xlsm`. The table contains card/sheet data for portfolio items, storing various field values with timestamps.

## Source Excel File

- **Workbook**: `PortfolioDigital_Fichas.xlsm`
- **Worksheet**: `Fichas`
- **Header rows to skip**: 2 (rows 0-1 contain metadata/filters, row 2 contains headers)
- **Row count**: ~89 rows (sample file)

## Excel Column Structure

| Excel Column | Description | Data Type |
|-------------|-------------|-----------|
| Portfolio ID | Portfolio identifier | TEXT |
| Fecha | Date/timestamp when the record was created/updated | DATETIME |
| Campo Ficha | Field name/type (e.g., PortfolioID, Sistema, NombreIniciativa) | TEXT |
| Subtitulo | Subtitle/subcategory (nullable) | TEXT |
| Periodo | Period/year (nullable) | INTEGER |
| Valor | Value of the field (mixed types stored as text) | TEXT |
| Procesado Beneficios | Status flag indicating if benefits were processed | TEXT |

## Database Schema

Following the project naming convention (Spanish column names, accents removed, lowercase with underscores):

```sql
-- Card/sheet data for portfolio items
-- Source: PortfolioDigital_Fichas.xlsm, sheet "Fichas"
CREATE TABLE fichas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    fecha TEXT,                  -- ISO 8601
    campo_ficha TEXT,
    subtitulo TEXT,
    periodo INTEGER,
    valor TEXT,
    procesado_beneficios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_fichas_portfolio ON fichas (portfolio_id);
CREATE INDEX idx_fichas_campo ON fichas (campo_ficha);
```

## Column Mapping (Excel to Database)

| Excel Column | Database Column | Transformation |
|-------------|-----------------|----------------|
| Portfolio ID | portfolio_id | normalize_portfolio_id() |
| Fecha | fecha | normalize_date() |
| Campo Ficha | campo_ficha | Direct (TEXT) |
| Subtitulo | subtitulo | Direct (TEXT) |
| Periodo | periodo | Direct (INTEGER, nullable) |
| Valor | valor | normalize_multiline_text() |
| Procesado Beneficios | procesado_beneficios | Direct (TEXT) |

## Implementation Details

### 1. Excel Reader

Create a new `FichasReader` class in `src/migrate/excel_readers.py`:

```python
class FichasReader(ExcelReader):
    """Reader for PortfolioDigital_Fichas.xlsm workbook."""

    def __init__(self, excel_dir: str = None):
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Fichas.xlsm"

    def read_fichas(self) -> pd.DataFrame:
        """
        Read Fichas sheet.

        Returns:
            DataFrame with fichas data
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Fichas',
            skiprows=2
        )

        df = self._rename_columns(df)

        return df
```

### 2. Migration Method

Add `migrate_fichas()` method to `MigrationEngine` class following the same pattern as other migrations.

### 3. Migration Sequence

Add fichas migration to a new Phase 8 in `migrate_all()`:

```python
# Phase 8: Fichas data (Feature 09)
logger.info("### PHASE 8: Fichas Data ###")
results['fichas'] = self.migrate_fichas()
```

## Data Quality Considerations

1. **portfolio_id**: Required field - skip rows without valid portfolio_id
2. **fecha field**: Contains datetime values - use `normalize_date()` for ISO 8601 conversion
3. **periodo field**: Integer year values, may be null - handle as nullable INTEGER
4. **valor field**: Contains various data types (strings, numbers, dates) - store as TEXT with `normalize_multiline_text()`
5. **Foreign key**: Links to `iniciativas.portfolio_id` with CASCADE delete

## Testing

```bash
# Test full migration including fichas
uv run python main.py init --db test.db
uv run python main.py migrate --db test.db
uv run python main.py validate --db test.db

# Verify fichas count
sqlite3 test.db "SELECT COUNT(*) FROM fichas;"

# Sample query
sqlite3 test.db "SELECT portfolio_id, fecha, campo_ficha, valor FROM fichas LIMIT 5;"

# Check unique campo_ficha values
sqlite3 test.db "SELECT DISTINCT campo_ficha FROM fichas;"
```

## Expected Outcome

After migration:
- `fichas` table contains all rows from Excel (actual count depends on source data)
- All columns mapped 1:1 from Excel
- Migration metadata recorded in `migracion_metadata` table
- No impact on existing functionality
