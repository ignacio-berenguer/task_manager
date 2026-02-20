# Feature 06: Code Refactoring Specification

## Overview

Restructure the codebase to improve maintainability, readability, and extensibility. Move from a flat file structure to a modular package-based architecture organized by command/domain.

## Current Structure Analysis

### File Sizes (lines of code)
| File | Lines | Purpose |
|------|-------|---------|
| migrate.py | 1,865 | Migration engine - **largest file** |
| calculate.py | 1,145 | Calculation engine - **needs splitting** |
| excel_readers.py | 705 | Excel file readers |
| data_quality.py | 483 | Data normalization utilities |
| excel_export.py | 328 | Excel export |
| main.py | 247 | CLI entry point with logging |
| validate.py | 240 | Validation engine |
| init_db.py | 159 | Database initialization |
| config.py | 41 | Configuration settings |

### Issues Identified
1. **Flat structure**: All modules at root level, hard to navigate
2. **Large files**: `migrate.py` (1,865 lines), `calculate.py` (1,145 lines)
3. **Mixed concerns in main.py**: CLI, logging setup, and command dispatch
4. **No clear separation by domain**: All calculation functions in one file

## Proposed Structure

```
portfolio_migration/
├── main.py                          # CLI entry point (simplified, ~100 lines)
├── schema.sql                       # Database schema (unchanged)
├── src/
│   ├── __init__.py
│   │
│   ├── core/                        # Shared utilities
│   │   ├── __init__.py
│   │   ├── logging_config.py        # Centralized logging setup (from main.py)
│   │   └── data_quality.py          # Data normalization utilities (moved)
│   │
│   ├── config/                      # Configuration module
│   │   ├── __init__.py
│   │   └── settings.py              # Configuration settings (from config.py)
│   │
│   ├── init/                        # init command
│   │   ├── __init__.py
│   │   └── db_init.py               # Database initialization (from init_db.py)
│   │
│   ├── migrate/                     # migrate command
│   │   ├── __init__.py
│   │   ├── engine.py                # Migration engine (from migrate.py)
│   │   └── excel_readers.py         # Excel file readers (moved)
│   │
│   ├── calculate/                   # calculate_datos_relevantes command
│   │   ├── __init__.py
│   │   ├── engine.py                # Main calculation entry + row calculation
│   │   ├── estado_functions.py      # estado_* functions (7 functions)
│   │   ├── importe_functions.py     # importe_* functions (10 functions)
│   │   ├── lookup_functions.py      # Lookup functions (2 functions)
│   │   └── helper_functions.py      # Helper functions (ultimo_id, fecha_*, etc.)
│   │
│   ├── export/                      # export_datos_relevantes command
│   │   ├── __init__.py
│   │   └── excel_export.py          # Excel export (from excel_export.py)
│   │
│   └── validate/                    # validate command
│       ├── __init__.py
│       └── validator.py             # Validation engine (from validate.py)
│
├── specs/                           # Unchanged
│   ├── specs.md
│   ├── architecture.md              # NEW: Architecture documentation
│   └── features/
│       └── ...
│
├── excel_source/                    # Unchanged (gitignored)
├── excel_output/                    # Unchanged (gitignored)
└── portfolio.db                     # Unchanged
```

## Module Breakdown

### 1. main.py (Simplified)
**Current**: 247 lines (CLI + logging + command dispatch)
**After**: ~100 lines (CLI + command dispatch only)

Changes:
- Move logging setup to `src/core/logging_config.py`
- Keep argparse and command dispatch
- Import and call command handlers from respective packages

### 2. src/core/logging_config.py (New)
**Source**: Extracted from main.py lines 16-49
**Content**: `setup_logging()` function and log configuration constants

### 3. src/core/data_quality.py (Moved)
**Source**: data_quality.py (483 lines)
**Content**: All data normalization functions (unchanged)

### 4. src/config/settings.py (Moved)
**Source**: config.py (41 lines)
**Content**: Configuration settings (unchanged)

### 5. src/init/db_init.py (Moved)
**Source**: init_db.py (159 lines)
**Content**: Database initialization (unchanged)

### 6. src/migrate/engine.py (Moved)
**Source**: migrate.py (1,865 lines)
**Content**: `MigrationEngine` class and all migration methods
**Note**: File is large but cohesive (single class with related methods)

### 7. src/migrate/excel_readers.py (Moved)
**Source**: excel_readers.py (705 lines)
**Content**: All Excel reader classes (unchanged)

### 8. src/calculate/ (Split from calculate.py)

#### engine.py (~200 lines)
- `calculate_row()` function
- `calculate_datos_relevantes()` function
- `validate_against_iniciativas()` function
- `print_validation_report()` function
- `main()` entry point

#### estado_functions.py (~200 lines)
Functions (7):
- `estado_iniciativa()`
- `fecha_de_ultimo_estado()`
- `estado_aprobacion_iniciativa()`
- `estado_ejecucion_iniciativa()`
- `estado_agrupado()`
- `estado_dashboard()`
- `estado_requisito_legal()`

#### importe_functions.py (~200 lines)
Functions (11):
- `importe()` - main dispatcher
- `_importe_aprobado()`
- `_importe_iniciativa()`
- `_importe_en_aprobacion()`
- `_importe_re()`
- `_importe_planificado_fijo()`
- `_importe_planificado()`
- `_importe_sm200()`
- `_importe_facturado()`

#### lookup_functions.py (~100 lines)
Functions (2):
- `get_datos_descriptivos_lookups()`
- `get_informacion_economica_lookups()`

#### helper_functions.py (~200 lines)
Functions (8):
- `ultimo_id()`
- `ultimo_id_aprobado()`
- `fecha_estado()`
- `get_estado_especial()`
- `fecha_iniciativa()`
- `fecha_limite()`
- `fecha_limite_comentarios()`
- `en_presupuesto_del_ano()`
- `calidad_valoracion()`
- `siguiente_accion()`
- `esta_en_los_206_me_de_2026()`

### 9. src/export/excel_export.py (Moved)
**Source**: excel_export.py (328 lines)
**Content**: Export functionality (unchanged)

### 10. src/validate/validator.py (Moved)
**Source**: validate.py (240 lines)
**Content**: Validation functionality (unchanged)

## Import Changes

### Current imports in main.py:
```python
import config
from init_db import create_database
from migrate import migrate_all
from validate import validate_all
from calculate import main as calculate_main
from excel_export import export_datos_relevantes
```

### New imports in main.py:
```python
from src.core.logging_config import setup_logging
from src.config import settings
from src.init import create_database
from src.migrate import migrate_all
from src.validate import validate_all
from src.calculate import main as calculate_main
from src.export import export_datos_relevantes
```

## Package __init__.py Files

Each package will export its public API through `__init__.py`:

```python
# src/init/__init__.py
from .db_init import create_database

# src/migrate/__init__.py
from .engine import migrate_all

# src/calculate/__init__.py
from .engine import main, calculate_datos_relevantes

# src/validate/__init__.py
from .validator import validate_all

# src/export/__init__.py
from .excel_export import export_datos_relevantes

# src/config/__init__.py
from .settings import *
```

## Testing Strategy

After refactoring, verify functionality with:

```bash
# Full test cycle
uv run python main.py init --db test_refactor.db
uv run python main.py migrate --db test_refactor.db
uv run python main.py validate --db test_refactor.db
uv run python main.py calculate_datos_relevantes --db test_refactor.db

# Compare results with original database
# All row counts and calculations should match
```

## Migration Steps Summary

1. Create `src/` directory structure
2. Move/create core utilities
3. Move config module
4. Move init module
5. Move migrate module (including excel_readers)
6. Split and move calculate module
7. Move export module
8. Move validate module
9. Update main.py imports
10. Update all internal imports in moved modules
11. Test full workflow
12. Update CLAUDE.md documentation
13. Create architecture.md

## Constraints

- No functional changes - all existing behavior must be preserved
- No changes to database schema or calculations
- No changes to CLI interface or command names
- All existing tests must pass
