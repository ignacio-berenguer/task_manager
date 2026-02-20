# Feature 06: Implementation Plan

## Phase 1: Create Directory Structure

### Step 1.1: Create src package structure
```
mkdir -p src/core
mkdir -p src/config
mkdir -p src/init
mkdir -p src/migrate
mkdir -p src/calculate
mkdir -p src/export
mkdir -p src/validate
```

### Step 1.2: Create __init__.py files
Create empty `__init__.py` in each directory for Python package recognition.

---

## Phase 2: Move Core Utilities

### Step 2.1: Create src/core/logging_config.py
- Extract `setup_logging()` function from main.py (lines 23-49)
- Extract log format constants (lines 17-20)
- Update to work as importable module

### Step 2.2: Move data_quality.py to src/core/
- Copy data_quality.py to src/core/data_quality.py
- Update internal imports if needed
- Keep original temporarily for backward compatibility during migration

---

## Phase 3: Move Config Module

### Step 3.1: Move config.py to src/config/settings.py
- Copy config.py to src/config/settings.py
- No internal changes needed

### Step 3.2: Create src/config/__init__.py
```python
from .settings import *
```

---

## Phase 4: Move Init Module

### Step 4.1: Move init_db.py to src/init/db_init.py
- Copy init_db.py to src/init/db_init.py
- Update import: `import config` → `from src.config import settings as config`

### Step 4.2: Create src/init/__init__.py
```python
from .db_init import create_database
```

---

## Phase 5: Move Migrate Module

### Step 5.1: Move excel_readers.py to src/migrate/
- Copy excel_readers.py to src/migrate/excel_readers.py
- Update import: `from data_quality import remove_accents` → `from src.core.data_quality import remove_accents`
- Update import: `import config` → `from src.config import settings as config`

### Step 5.2: Move migrate.py to src/migrate/engine.py
- Copy migrate.py to src/migrate/engine.py
- Update imports:
  - `import config` → `from src.config import settings as config`
  - `from excel_readers import get_all_readers` → `from .excel_readers import get_all_readers`
  - `from data_quality import ...` → `from src.core.data_quality import ...`

### Step 5.3: Create src/migrate/__init__.py
```python
from .engine import migrate_all, MigrationEngine
```

---

## Phase 6: Split and Move Calculate Module

### Step 6.1: Create src/calculate/helper_functions.py
Extract from calculate.py:
- `ultimo_id()` (lines 25-65)
- `ultimo_id_aprobado()` (lines 67-156)
- `fecha_estado()` (lines 159-175)
- `get_estado_especial()` (lines 178-195)
- `fecha_iniciativa()` (lines 622-635)
- `fecha_limite()` (lines 638-654)
- `fecha_limite_comentarios()` (lines 657-668)
- `en_presupuesto_del_ano()` (lines 675-697)
- `calidad_valoracion()` (lines 700-720)
- `siguiente_accion()` (lines 723-734)
- `esta_en_los_206_me_de_2026()` (lines 737-747)

### Step 6.2: Create src/calculate/estado_functions.py
Extract from calculate.py:
- `estado_iniciativa()` (lines 202-229)
- `fecha_de_ultimo_estado()` (lines 232-253)
- `estado_aprobacion_iniciativa()` (lines 256-284)
- `estado_ejecucion_iniciativa()` (lines 287-315)
- `estado_agrupado()` (lines 318-353)
- `estado_dashboard()` (lines 356-384)
- `estado_requisito_legal()` (lines 387-415)

Import dependencies from helper_functions:
```python
from .helper_functions import ultimo_id, ultimo_id_aprobado, get_estado_especial
```

### Step 6.3: Create src/calculate/importe_functions.py
Extract from calculate.py:
- `importe()` (lines 422-462)
- `_importe_aprobado()` (lines 465-484)
- `_importe_iniciativa()` (lines 487-509)
- `_importe_en_aprobacion()` (lines 512-526)
- `_importe_re()` (lines 529-546)
- `_importe_planificado_fijo()` (lines 549-564)
- `_importe_planificado()` (lines 567-584)
- `_importe_sm200()` (lines 587-601)
- `_importe_facturado()` (lines 604-615)

Import dependencies:
```python
from .estado_functions import estado_aprobacion_iniciativa
```

### Step 6.4: Create src/calculate/lookup_functions.py
Extract from calculate.py:
- `get_datos_descriptivos_lookups()` (lines 754-784)
- `get_informacion_economica_lookups()` (lines 787-802)

### Step 6.5: Create src/calculate/engine.py
Extract from calculate.py:
- `calculate_row()` (lines 809-878)
- `calculate_datos_relevantes()` (lines 881-940)
- `validate_against_iniciativas()` (lines 948-1056)
- `print_validation_report()` (lines 1059-1098)
- `main()` (lines 1105-1145)

Import all calculation functions:
```python
from .estado_functions import (
    estado_iniciativa, fecha_de_ultimo_estado, estado_aprobacion_iniciativa,
    estado_ejecucion_iniciativa, estado_agrupado, estado_dashboard,
    estado_requisito_legal
)
from .importe_functions import importe
from .lookup_functions import (
    get_datos_descriptivos_lookups, get_informacion_economica_lookups
)
from .helper_functions import (
    en_presupuesto_del_ano, calidad_valoracion, siguiente_accion,
    esta_en_los_206_me_de_2026, fecha_iniciativa, fecha_limite,
    fecha_limite_comentarios
)
```

### Step 6.6: Create src/calculate/__init__.py
```python
from .engine import main, calculate_datos_relevantes, validate_against_iniciativas
```

---

## Phase 7: Move Export Module

### Step 7.1: Move excel_export.py to src/export/
- Copy excel_export.py to src/export/excel_export.py
- Update import: `import config` → `from src.config import settings as config`

### Step 7.2: Create src/export/__init__.py
```python
from .excel_export import export_datos_relevantes
```

---

## Phase 8: Move Validate Module

### Step 8.1: Move validate.py to src/validate/validator.py
- Copy validate.py to src/validate/validator.py
- Update import: `import config` → `from src.config import settings as config`

### Step 8.2: Create src/validate/__init__.py
```python
from .validator import validate_all, generate_quality_report
```

---

## Phase 9: Update main.py

### Step 9.1: Update imports
```python
# Old imports
import config
from init_db import create_database
from migrate import migrate_all
from validate import validate_all

# New imports
from src.core.logging_config import setup_logging, LOG_LEVEL, LOG_FILE
from src.config import settings as config
from src.init import create_database
from src.migrate import migrate_all
from src.validate import validate_all
```

### Step 9.2: Update lazy imports
```python
# Old
from calculate import main as calculate_main
from excel_export import export_datos_relevantes

# New
from src.calculate import main as calculate_main
from src.export import export_datos_relevantes
```

### Step 9.3: Remove setup_logging() definition
Remove lines 23-49 (now in src/core/logging_config.py)

---

## Phase 10: Create Package Root __init__.py

### Step 10.1: Create src/__init__.py
```python
"""
Portfolio Migration System - Source Package

This package contains all the core functionality for the portfolio migration tool.
"""

__version__ = "1.0.0"
```

---

## Phase 11: Clean Up

### Step 11.1: Delete old root-level files
After verification, delete:
- config.py
- init_db.py
- migrate.py
- calculate.py
- excel_readers.py
- excel_export.py
- validate.py
- data_quality.py

---

## Phase 12: Testing

### Step 12.1: Full workflow test
```bash
# Clean start
rm -f test_refactor.db

# Test all commands
uv run python main.py init --db test_refactor.db
uv run python main.py migrate --db test_refactor.db
uv run python main.py validate --db test_refactor.db
uv run python main.py calculate_datos_relevantes --db test_refactor.db
```

### Step 12.2: Compare with original
Compare row counts and data between original and refactored runs.

### Step 12.3: Module import test
```python
# Test that all imports work
from src.core.logging_config import setup_logging
from src.config import settings
from src.init import create_database
from src.migrate import migrate_all
from src.validate import validate_all
from src.calculate import main as calculate_main
from src.export import export_datos_relevantes
```

---

## Phase 13: Documentation

### Step 13.1: Update CLAUDE.md
- Update Project Structure section
- Update import examples
- Update any file paths referenced

### Step 13.2: Create specs/architecture.md
Document the new architecture:
- Package overview
- Module dependencies
- Data flow diagram
- Extension points for new commands

---

## Execution Order Summary

1. Create directory structure (Phase 1)
2. Move core utilities (Phase 2)
3. Move config module (Phase 3)
4. Move init module (Phase 4)
5. Move migrate module (Phase 5)
6. Split and move calculate module (Phase 6)
7. Move export module (Phase 7)
8. Move validate module (Phase 8)
9. Update main.py (Phase 9)
10. Create root __init__.py (Phase 10)
11. Test all functionality (Phase 12)
12. Delete old files (Phase 11)
13. Update documentation (Phase 13)

## Estimated Changes

| Component | Files Changed | Files Created | Files Deleted |
|-----------|---------------|---------------|---------------|
| Directory structure | 0 | 8 (__init__.py) | 0 |
| Core utilities | 0 | 2 | 0 |
| Config | 0 | 2 | 0 |
| Init | 0 | 2 | 0 |
| Migrate | 0 | 3 | 0 |
| Calculate | 0 | 6 | 0 |
| Export | 0 | 2 | 0 |
| Validate | 0 | 2 | 0 |
| Main | 1 | 0 | 0 |
| Cleanup | 0 | 0 | 8 |
| Documentation | 2 | 1 | 0 |
| **Total** | **3** | **28** | **8** |
