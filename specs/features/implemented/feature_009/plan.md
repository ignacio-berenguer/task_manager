# Feature 09: Implementation Plan

## Summary

Add migration support for the `fichas` table from `PortfolioDigital_Fichas.xlsm`.

## Implementation Steps

### Step 1: Update Database Schema

**File**: `schema.sql`

Add the fichas table definition after the transacciones table (around line 463):

```sql
-- ============================================================================
-- FICHAS DATA (Feature 09)
-- ============================================================================

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

### Step 2: Add Excel Reader Class

**File**: `src/migrate/excel_readers.py`

Add a new `FichasReader` class after `TransaccionesReader`:

```python
class FichasReader(ExcelReader):
    """Reader for PortfolioDigital_Fichas.xlsm workbook."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Fichas.xlsm"

    def read_fichas(self) -> pd.DataFrame:
        """
        Read Fichas sheet (card/sheet data for portfolio items).

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

### Step 3: Update get_all_readers()

**File**: `src/migrate/excel_readers.py`

Update the `get_all_readers()` function to include the new reader:

```python
def get_all_readers(excel_dir: str = None) -> dict:  # type: ignore
    """
    Get all Excel readers.

    Args:
        excel_dir: Directory containing Excel files

    Returns:
        Dictionary of reader name -> reader instance
    """
    return {
        'master': MasterReader(excel_dir),
        'beneficios': BeneficiosReader(excel_dir),
        'facturado': FacturadoReader(excel_dir),
        'transacciones': TransaccionesReader(excel_dir),
        'fichas': FichasReader(excel_dir)  # Add this line
    }
```

### Step 4: Add Migration Method

**File**: `src/migrate/engine.py`

Add `migrate_fichas()` method to `MigrationEngine` class (after `migrate_transacciones`, around line 1824):

```python
def migrate_fichas(self) -> int:
    """
    Migrate fichas (card/sheet data for portfolio items).

    Returns:
        Number of rows migrated
    """
    logger.info("=== Starting Fichas Migration ===")
    migration_id = self._log_migration_start('fichas', 'Fichas', 'Fichas')

    try:
        df = self.readers['fichas'].read_fichas()  # type: ignore
        logger.info(f"Read {len(df)} rows from Excel")
        logger.debug(f"Columns: {df.columns.tolist()}")

        cursor = self.conn.cursor()
        migrated = 0
        errors = 0

        for idx, row in df.iterrows():
            try:
                portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                if not portfolio_id:
                    logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                    continue

                logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                fecha, _ = normalize_date(row.get('fecha'))
                campo_ficha = row.get('campo_ficha')
                subtitulo = row.get('subtitulo')
                periodo = row.get('periodo')
                # Handle periodo - convert to int if valid, None otherwise
                if pd.notna(periodo):
                    try:
                        periodo = int(periodo)
                    except (ValueError, TypeError):
                        periodo = None
                else:
                    periodo = None
                valor = normalize_multiline_text(row.get('valor'))
                procesado_beneficios = row.get('procesado_beneficios')

                cursor.execute("""
                    INSERT INTO fichas (
                        portfolio_id, fecha, campo_ficha, subtitulo,
                        periodo, valor, procesado_beneficios,
                        fecha_creacion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    portfolio_id, fecha, campo_ficha, subtitulo,
                    periodo, valor, procesado_beneficios,
                    datetime.now().isoformat()
                ))

                migrated += 1
                logger.debug(f"Row {idx}: Successfully inserted into fichas - portfolio_id={portfolio_id}")

            except Exception as e:
                errors += 1
                logger.error(f"Row {idx}: Failed to migrate - {e}")
                logger.error(f"Row {idx} data: {row.to_dict()}")

        self.conn.commit()
        self._log_migration_end(migration_id, len(df), migrated, errors)

        logger.info(f"✓ Migrated {migrated} fichas ({errors} errors)")
        return migrated

    except Exception as e:
        logger.exception(f"Fatal error migrating fichas: {e}")
        self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
        raise
```

### Step 5: Update migrate_all()

**File**: `src/migrate/engine.py`

Add fichas migration to `migrate_all()` method. Add a new Phase 8 after Phase 7:

```python
# Phase 8: Fichas data (Feature 09)
logger.info("### PHASE 8: Fichas Data ###")
results['fichas'] = self.migrate_fichas()
```

### Step 6: Update Documentation

#### 6.1 Update README.md

- Add `fichas` to the table list in "Database Schema" section
- Update total table count to include fichas
- Add fichas to the appropriate migration phase description

#### 6.2 Update specs/architecture.md

- Add `FichasReader` to the Excel readers section
- Add fichas to the migration phases documentation

#### 6.3 Update CLAUDE.md

- Add fichas to the table count in Project Overview
- Add PortfolioDigital_Fichas.xlsm to the Excel Source Files section
- Update any relevant table listings

## Files Modified

| File | Change |
|------|--------|
| `schema.sql` | Add fichas table DDL and indexes |
| `src/migrate/excel_readers.py` | Add FichasReader class and update get_all_readers() |
| `src/migrate/engine.py` | Add migrate_fichas() method and update migrate_all() |
| `README.md` | Update documentation |
| `specs/architecture.md` | Update documentation |
| `CLAUDE.md` | Update table counts and Excel source files |

## Testing Plan

1. Run full migration with test database:
   ```bash
   uv run python main.py init --db test.db
   uv run python main.py migrate --db test.db
   ```

2. Verify fichas table:
   ```bash
   sqlite3 test.db "SELECT COUNT(*) FROM fichas;"
   sqlite3 test.db "SELECT * FROM fichas LIMIT 5;"
   ```

3. Check migration metadata:
   ```bash
   sqlite3 test.db "SELECT * FROM migracion_metadata WHERE tabla_destino='fichas';"
   ```

4. Run validation:
   ```bash
   uv run python main.py validate --db test.db
   ```

5. Verify existing functionality is not affected by running full pipeline:
   ```bash
   uv run python main.py full_calculation_datos_relevantes --db test.db
   ```

## Rollback Plan

If issues arise:
1. Remove the fichas migration from migrate_all()
2. Comment out migrate_fichas() method
3. Remove FichasReader from get_all_readers()
4. Keep schema.sql changes (they're additive and non-breaking)
