# Feature 05: Complete Calculation and Excel Export

**Version:** 1.1
**Date:** January 2026
**Status:** Completed

---

## Overview

This feature completes the datos_relevantes calculation by properly considering estado_especial, fixes migration errors in the IM table, and adds the capability to export the datos_relevantes table to an Excel file.

---

## Requirements

### Requirement 1: Consider estado_especial in estado_iniciativa Calculation ✓

**Implementation:**

Added `get_estado_especial()` helper function in `calculate.py`:
```python
def get_estado_especial(conn: sqlite3.Connection, portfolio_id: str) -> Optional[str]:
    """Get the special estado from estado_especial table if it exists."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT estado_especial FROM estado_especial
        WHERE portfolio_id = ?
    """, (portfolio_id,))
    result = cursor.fetchone()
    return result[0] if result and result[0] else None
```

Modified `estado_iniciativa()` to check estado_especial first before falling back to hechos table logic.

---

### Requirement 2: Fix Migration Errors in IMs ✓

**Implementation:**

Modified `read_investment_memos()` in `excel_readers.py` to filter out rows where `portfolio_id` is null/NaT:

```python
# Filter out rows where portfolio_id is null/NaT (indicates table end)
if 'portfolio_id' in df.columns:
    df = df[df['portfolio_id'].notna()]
```

---

### Requirement 3: Export datos_relevantes to Output Excel ✓

#### 3.1 Configuration

Added to `.env` and `config.py`:
```ini
EXCEL_OUTPUT_DIR=excel_output
EXCEL_OUTPUT_FILE=PortfolioDigital_DatosRelevantes.xlsm
EXCEL_OUTPUT_WORKSHEET=Datos Relevantes
EXCEL_OUTPUT_TABLE=DatosRelevantes
```

#### 3.2 Export Features

The `excel_export.py` module implements:

1. **Column Mapping** - 65 database columns mapped to Excel column names
2. **Case-Insensitive Matching** - Excel headers matched regardless of case
3. **Conditional VBA Handling** - `keep_vba=True` only for .xlsm files, prevents corruption of .xlsx files
4. **Cell Format Preservation** - Copies from first data row:
   - Number format
   - Font
   - Alignment
   - (Border and fill excluded intentionally)
5. **Date Conversion** - Text dates (YYYY-MM-DD) converted to Excel dates formatted as DD/MM/YYYY
6. **Error Handling** - Graceful handling when file is open in Excel

#### 3.3 Date Columns

The following columns are automatically converted from text to Excel dates:
- `fecha_prevista_pes`
- `fecha_de_ultimo_estado`
- `fecha_sm100`
- `fecha_aprobada_con_cct`
- `fecha_en_ejecucion`
- `fecha_limite`

#### 3.4 CLI Command

```bash
uv run python main.py export_datos_relevantes [--db PATH]
```

---

## Files Modified/Created

| File | Action | Description |
|------|--------|-------------|
| `calculate.py` | Modified | Added get_estado_especial(), modified estado_iniciativa() |
| `excel_readers.py` | Modified | Added NaT filtering in read_investment_memos() |
| `.env` | Modified | Added Excel output configuration |
| `.env.example` | Modified | Added Excel output configuration template |
| `config.py` | Modified | Added Excel output configuration variables |
| `excel_export.py` | Created | New module (~280 lines) for Excel export |
| `main.py` | Modified | Added export_datos_relevantes command |
| `README.md` | Modified | Updated documentation |
| `CLAUDE.md` | Modified | Updated documentation |

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| estado_especial considered in calculation | ✓ Implemented |
| IM migration has no NaT errors | ✓ Fixed |
| Excel export creates valid file | ✓ Works with .xlsx and .xlsm |
| Cell formatting preserved | ✓ Number format, font, alignment |
| Date columns formatted correctly | ✓ DD/MM/YYYY format |
| Error handling for locked files | ✓ Clear error message |
| Row count matches database | ✓ Verified |
| Logging complete | ✓ All operations logged |

---

## Usage

```bash
# 1. Run migration (IM errors fixed)
uv run python main.py migrate

# 2. Calculate datos_relevantes (uses estado_especial)
uv run python main.py calculate_datos_relevantes

# 3. Export to Excel
uv run python main.py export_datos_relevantes
```

---

## Notes

- The Excel output file must exist before running export (with table already defined)
- Close the Excel file before running export to avoid PermissionError
- Column mapping can be customized in `excel_export.py`
- Date columns are defined in `DATE_COLUMNS` set in `excel_export.py`

---

**Document Status:** Completed
**Last Updated:** January 2026
