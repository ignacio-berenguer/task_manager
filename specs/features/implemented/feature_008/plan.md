# Feature 08: Implementation Plan

## Summary

Add migration support for the `transacciones` table from `PortfolioDigital_Transacciones.xlsm`.

## Implementation Steps

### Step 1: Update Database Schema

**File**: `schema.sql`

Add the transacciones table definition after the `migracion_metadata` table (around line 803):

```sql
-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================

-- Audit trail for portfolio changes
-- Source: PortfolioDigital_Transacciones.xlsm, sheet "Transacciones"
CREATE TABLE transacciones (
    id INTEGER PRIMARY KEY,
    clave1 TEXT,
    clave2 TEXT,
    tabla TEXT,
    campo_tabla TEXT,
    valor_nuevo TEXT,
    tipo_cambio TEXT,
    estado_cambio TEXT,
    fecha_registro_cambio TEXT,
    fecha_ejecucion_cambio TEXT,
    valor_antes_del_cambio TEXT,
    comentarios TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME
);

CREATE INDEX idx_transacciones_clave1 ON transacciones (clave1);
CREATE INDEX idx_transacciones_tabla ON transacciones (tabla);
CREATE INDEX idx_transacciones_estado ON transacciones (estado_cambio);
```

Also remove the comment "REMOVED: transacciones table (not needed for migration)" from lines 437-439.

### Step 2: Fix Excel Reader

**File**: `src/migrate/excel_readers.py`

Update `TransaccionesReader.read_transacciones()` method to use correct skiprows:

**Change line ~611 from**:
```python
skiprows=2
```

**To**:
```python
skiprows=3
```

### Step 3: Add Migration Method

**File**: `src/migrate/engine.py`

Add `migrate_transacciones()` method to `MigrationEngine` class (after `migrate_impacto_aatt`, around line 1752):

```python
def migrate_transacciones(self) -> int:
    """
    Migrate transacciones (audit trail for portfolio changes).

    Returns:
        Number of rows migrated
    """
    logger.info("=== Starting Transacciones Migration ===")
    migration_id = self._log_migration_start('transacciones', 'Transacciones', 'Transacciones')

    try:
        df = self.readers['transacciones'].read_transacciones()  # type: ignore
        logger.info(f"Read {len(df)} rows from Excel")
        logger.debug(f"Columns: {df.columns.tolist()}")

        cursor = self.conn.cursor()
        migrated = 0
        errors = 0

        for idx, row in df.iterrows():
            try:
                # Get ID - skip if empty
                id_val = row.get('id')
                if pd.isna(id_val):
                    logger.debug(f"Row {idx}: Skipping - no id")
                    continue

                logger.debug(f"Processing row {idx}: id={id_val}")

                clave1 = normalize_portfolio_id(row.get('clave1'))
                clave2 = normalize_portfolio_id(row.get('clave2'))
                tabla = row.get('tabla')
                campo_tabla = row.get('campo_tabla')
                valor_nuevo = normalize_multiline_text(row.get('valor_nuevo'))
                tipo_cambio = row.get('tipo_cambio')
                estado_cambio = row.get('estado_cambio')
                fecha_registro_cambio, _ = normalize_date(row.get('fecha_registro_cambio'))
                fecha_ejecucion_cambio, _ = normalize_date(row.get('fecha_ejecucion_cambio'))
                valor_antes_del_cambio = normalize_multiline_text(row.get('valor_antes_del_cambio'))
                comentarios = normalize_multiline_text(row.get('comentarios'))

                cursor.execute("""
                    INSERT OR REPLACE INTO transacciones (
                        id, clave1, clave2, tabla, campo_tabla, valor_nuevo,
                        tipo_cambio, estado_cambio, fecha_registro_cambio,
                        fecha_ejecucion_cambio, valor_antes_del_cambio,
                        comentarios, fecha_creacion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    int(id_val), clave1, clave2, tabla, campo_tabla, valor_nuevo,
                    tipo_cambio, estado_cambio, fecha_registro_cambio,
                    fecha_ejecucion_cambio, valor_antes_del_cambio,
                    comentarios, datetime.now().isoformat()
                ))

                migrated += 1
                logger.debug(f"Row {idx}: Successfully inserted into transacciones - id={id_val}")

            except Exception as e:
                errors += 1
                logger.error(f"Row {idx}: Failed to migrate - {e}")
                logger.error(f"Row {idx} data: {row.to_dict()}")

        self.conn.commit()
        self._log_migration_end(migration_id, len(df), migrated, errors)

        logger.info(f"✓ Migrated {migrated} transacciones ({errors} errors)")
        return migrated

    except Exception as e:
        logger.exception(f"Fatal error migrating transacciones: {e}")
        self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
        raise
```

### Step 4: Update migrate_all()

**File**: `src/migrate/engine.py`

Add transacciones migration to `migrate_all()` method. Add a new Phase 7 after Phase 6:

```python
# Phase 7: Audit data
logger.info("### PHASE 7: Audit Data ###")
results['transacciones'] = self.migrate_transacciones()
```

### Step 5: Update Documentation

#### 5.1 Update README.md

- Add `transacciones` to the table list in "Database Schema" section
- Update total table count from "22 Active Tables" to "23 Active Tables"
- Add transacciones to the appropriate migration phase description

#### 5.2 Update specs/architecture.md

- Add transacciones to the Excel readers section
- Add transacciones to the migration phases documentation

#### 5.3 Update CLAUDE.md

- Add transacciones to the table count in Project Overview
- Update any relevant table listings

## Files Modified

| File | Change |
|------|--------|
| `schema.sql` | Add transacciones table DDL and indexes |
| `src/migrate/excel_readers.py` | Fix skiprows from 2 to 3 |
| `src/migrate/engine.py` | Add migrate_transacciones() method and update migrate_all() |
| `README.md` | Update documentation |
| `specs/architecture.md` | Update documentation |
| `CLAUDE.md` | Update table counts |

## Testing Plan

1. Run full migration with test database:
   ```bash
   uv run python main.py init --db test.db
   uv run python main.py migrate --db test.db
   ```

2. Verify transacciones table:
   ```bash
   sqlite3 test.db "SELECT COUNT(*) FROM transacciones;"
   sqlite3 test.db "SELECT * FROM transacciones LIMIT 5;"
   ```

3. Check migration metadata:
   ```bash
   sqlite3 test.db "SELECT * FROM migracion_metadata WHERE tabla_destino='transacciones';"
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
1. Remove the transacciones migration from migrate_all()
2. Comment out migrate_transacciones() method
3. Keep schema.sql changes (they're additive and non-breaking)
