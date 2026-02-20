# Specs: feature_048 — Management Module .env Refactor

## Problem Statement

The management module's `.env` file has grown organically and suffers from two issues:

1. **Path repetition** — The same long base paths (e.g., `C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Teams-SPBI\1.Business Improvement\Iniciativas Digitales\Portfolio`) are repeated across multiple variables (`EXCEL_OUTPUT_DIR`, `DOCUMENTOS_EXCEL_PATH`, `DOCUMENTOS_ITEMS_EXCEL_PATH`, `DOCUMENTOS_IMPORT_EXCEL_PATH`, `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH`, `WINDOWS_EXCEL_PATH`).

2. **Inconsistent naming** — Some variables use `_PATH` (full path with filename), some use `_DIR` + `_FILE` (separate directory and filename), and some have ad-hoc prefixes. There's no clear convention.

## Current Variable Inventory

| Current Variable | Value Pattern | Used By |
|---|---|---|
| `LOG_LEVEL` | `INFO` | `settings.py`, `logging_config.py` |
| `LOG_FILE` | `portfolio_migration.log` | `settings.py`, `logging_config.py` |
| `EXCEL_SOURCE_DIR` | Absolute path to folder | `settings.py`, `manage.py`, `excel_readers.py`, `engine.py (migrate)` |
| `EXCEL_OUTPUT_DIR` | Absolute path to folder | `settings.py`, `excel_export.py` |
| `EXCEL_OUTPUT_FILE` | Filename only | `settings.py`, `excel_export.py` |
| `EXCEL_OUTPUT_WORKSHEET` | Worksheet name | `settings.py`, `excel_export.py` |
| `EXCEL_OUTPUT_TABLE` | Table name | `settings.py`, `excel_export.py` |
| `WINDOWS_EXCEL_PATH` | Absolute path to folder | `settings.py`, `copy_excel_sources.sh` (WSL script — being decommissioned) |
| `DATABASE_PATH` | Optional absolute path | `settings.py`, many modules |
| `DOCUMENT_SCAN_CONFIG` | JSON string | `settings.py`, `scanner.py` |
| `BATCH_COMMIT_SIZE` | Integer | `settings.py`, `calculate/engine.py` |
| `ANTHROPIC_API_KEY` | API key | `settings.py`, `summarize/engine.py` |
| `LLM_PROVIDER` | `claude` | `settings.py`, `summarize/engine.py` |
| `LLM_MODEL` | Model ID | `settings.py`, `summarize/engine.py` |
| `LLM_MAX_TOKENS` | Integer | `settings.py`, `summarize/engine.py` |
| `LLM_TEMPERATURE` | Float | `settings.py`, `summarize/engine.py` |
| `DOCUMENTOS_EXCEL_PATH` | Full absolute path | `settings.py`, `summarize/excel_export.py` |
| `DOCUMENTOS_EXCEL_WORKSHEET` | Worksheet name | `settings.py`, `summarize/excel_export.py`, `migrate/engine.py` |
| `DOCUMENTOS_EXCEL_TABLE` | Table name | `settings.py`, `summarize/excel_export.py` |
| `DOCUMENTOS_IMPORT_EXCEL_PATH` | Full absolute path | `settings.py`, `migrate/engine.py` |
| `DOCUMENTOS_ITEMS_EXCEL_PATH` | Full absolute path | `settings.py`, `export/documentos_items_export.py` |
| `DOCUMENTOS_ITEMS_EXCEL_WORKSHEET` | Worksheet name | `settings.py`, `export/documentos_items_export.py` |
| `DOCUMENTOS_ITEMS_EXCEL_TABLE` | Table name | `settings.py`, `export/documentos_items_export.py` |
| `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH` | Full absolute path | `settings.py`, `migrate/engine.py` |

## Design: New Variable Structure

### Naming Convention

- `_DIR` — directory path (no trailing slash)
- `_FILE` — filename only (no path)
- `_WORKSHEET` — Excel worksheet name
- `_TABLE` — Excel table name
- Group related variables with a common prefix
- All paths that were previously absolute full paths will be composed at runtime from `_DIR` + `_FILE`

### New .env Structure

```env
# ============================================================
# Portfolio Migration Configuration
# ============================================================

# --- Logging ---
LOG_LEVEL=INFO
LOG_FILE=portfolio_migration.log

# --- Database ---
# DATABASE_PATH=            # Leave empty for default (PROJECT_ROOT/db/portfolio.db)

# --- Base Directories ---
# These are defined once and reused by all file references below
EXCEL_SOURCE_DIR=C:\path\to\excel_source
EXCEL_OUTPUT_DIR=C:\path\to\portfolio\output

# --- Datos Relevantes Export ---
DATOS_RELEVANTES_FILE=PortfolioDigital_DatosRelevantes_Calculation.xlsx
DATOS_RELEVANTES_WORKSHEET=Datos Relevantes
DATOS_RELEVANTES_TABLE=DatosRelevantesCalculation

# --- Documentos Export ---
DOCUMENTOS_EXPORT_FILE=PortfolioDigital_Documentos_Calculation.xlsx
DOCUMENTOS_EXPORT_WORKSHEET=Documentos
DOCUMENTOS_EXPORT_TABLE=Documentos

# --- Documentos Import ---
DOCUMENTOS_IMPORT_FILE=PortfolioDigital_Documentos.xlsx

# --- Documentos Items Export ---
DOCUMENTOS_ITEMS_EXPORT_FILE=PortfolioDigital_Documentos_Items_Calculation.xlsx
DOCUMENTOS_ITEMS_EXPORT_WORKSHEET=DocumentosItems
DOCUMENTOS_ITEMS_EXPORT_TABLE=DocumentosItems

# --- Documentos Items Import ---
DOCUMENTOS_ITEMS_IMPORT_FILE=PortfolioDigital_Documentos_Items.xlsx

# --- Batch Processing ---
BATCH_COMMIT_SIZE=100

# --- Document Scanner ---
DOCUMENT_SCAN_CONFIG=[...]

# --- LLM Configuration ---
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=claude
LLM_MODEL=claude-haiku-4-5-20251001
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.2
```

### Key Design Decisions

1. **`EXCEL_OUTPUT_DIR` becomes the shared base** for all export/import files. Previously, `DOCUMENTOS_EXCEL_PATH` was an absolute path to a file, and `EXCEL_OUTPUT_DIR` was a separate directory. Now, `EXCEL_OUTPUT_DIR` is the single output base directory, and all export/import files are filenames relative to it.

2. **Import files use `EXCEL_SOURCE_DIR`** as their base. `DOCUMENTOS_IMPORT_FILE` and `DOCUMENTOS_ITEMS_IMPORT_FILE` are filenames composed with `EXCEL_SOURCE_DIR` at runtime.

3. **Datos Relevantes rename**: `EXCEL_OUTPUT_FILE` → `DATOS_RELEVANTES_FILE`, `EXCEL_OUTPUT_WORKSHEET` → `DATOS_RELEVANTES_WORKSHEET`, `EXCEL_OUTPUT_TABLE` → `DATOS_RELEVANTES_TABLE`. This makes it clear what entity they refer to.

4. **Documentos rename**: `DOCUMENTOS_EXCEL_PATH` → composed from `EXCEL_OUTPUT_DIR` + `DOCUMENTOS_EXPORT_FILE`. Similarly for Items.

5. **`WINDOWS_EXCEL_PATH` removed**: Only used by `copy_excel_sources.sh` which is being decommissioned. The script itself will also be deleted.

6. **Variables that stay unchanged**: `LOG_LEVEL`, `LOG_FILE`, `DATABASE_PATH`, `BATCH_COMMIT_SIZE`, `DOCUMENT_SCAN_CONFIG`, and all LLM variables. These are already well-named and don't repeat paths.

### Path Composition in settings.py

The `settings.py` module will compose full paths at load time:

```python
# Base directories
EXCEL_SOURCE_DIR = os.getenv('EXCEL_SOURCE_DIR', 'excel_source')
EXCEL_OUTPUT_DIR = os.getenv('EXCEL_OUTPUT_DIR', 'excel_output')

# Datos Relevantes export (composed paths)
DATOS_RELEVANTES_FILE = os.getenv('DATOS_RELEVANTES_FILE', 'PortfolioDigital_DatosRelevantes.xlsm')
DATOS_RELEVANTES_WORKSHEET = os.getenv('DATOS_RELEVANTES_WORKSHEET', 'Datos Relevantes')
DATOS_RELEVANTES_TABLE = os.getenv('DATOS_RELEVANTES_TABLE', 'DatosRelevantes')

# Documentos export (composed paths)
DOCUMENTOS_EXPORT_FILE = os.getenv('DOCUMENTOS_EXPORT_FILE', 'PortfolioDigital_Documentos.xlsm')
DOCUMENTOS_EXPORT_WORKSHEET = os.getenv('DOCUMENTOS_EXPORT_WORKSHEET', 'Documentos')
DOCUMENTOS_EXPORT_TABLE = os.getenv('DOCUMENTOS_EXPORT_TABLE', 'Documentos')

# Documentos import
DOCUMENTOS_IMPORT_FILE = os.getenv('DOCUMENTOS_IMPORT_FILE', 'PortfolioDigital_Documentos.xlsx')

# Documentos Items export
DOCUMENTOS_ITEMS_EXPORT_FILE = os.getenv('DOCUMENTOS_ITEMS_EXPORT_FILE', 'PortfolioDigital_Documentos_Items_Calculation.xlsx')
DOCUMENTOS_ITEMS_EXPORT_WORKSHEET = os.getenv('DOCUMENTOS_ITEMS_EXPORT_WORKSHEET', 'Documentos_Items')
DOCUMENTOS_ITEMS_EXPORT_TABLE = os.getenv('DOCUMENTOS_ITEMS_EXPORT_TABLE', 'Documentos_Items')

# Documentos Items import
DOCUMENTOS_ITEMS_IMPORT_FILE = os.getenv('DOCUMENTOS_ITEMS_IMPORT_FILE', 'PortfolioDigital_Documentos_Items.xlsx')
```

Consumer code will compose full paths where needed:
- Export: `Path(EXCEL_OUTPUT_DIR) / DATOS_RELEVANTES_FILE`
- Import: `Path(EXCEL_SOURCE_DIR) / DOCUMENTOS_IMPORT_FILE`

## Variable Mapping (Old → New)

| Old Variable | New Variable | Notes |
|---|---|---|
| `LOG_LEVEL` | `LOG_LEVEL` | Unchanged |
| `LOG_FILE` | `LOG_FILE` | Unchanged |
| `EXCEL_SOURCE_DIR` | `EXCEL_SOURCE_DIR` | Unchanged |
| `EXCEL_OUTPUT_DIR` | `EXCEL_OUTPUT_DIR` | Now used as base for all export files |
| `EXCEL_OUTPUT_FILE` | `DATOS_RELEVANTES_FILE` | Renamed for clarity |
| `EXCEL_OUTPUT_WORKSHEET` | `DATOS_RELEVANTES_WORKSHEET` | Renamed for clarity |
| `EXCEL_OUTPUT_TABLE` | `DATOS_RELEVANTES_TABLE` | Renamed for clarity |
| `WINDOWS_EXCEL_PATH` | *(removed)* | Only used by decommissioned `copy_excel_sources.sh` |
| `DATABASE_PATH` | `DATABASE_PATH` | Unchanged |
| `DOCUMENT_SCAN_CONFIG` | `DOCUMENT_SCAN_CONFIG` | Unchanged |
| `BATCH_COMMIT_SIZE` | `BATCH_COMMIT_SIZE` | Unchanged |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` | Unchanged |
| `LLM_PROVIDER` | `LLM_PROVIDER` | Unchanged |
| `LLM_MODEL` | `LLM_MODEL` | Unchanged |
| `LLM_MAX_TOKENS` | `LLM_MAX_TOKENS` | Unchanged |
| `LLM_TEMPERATURE` | `LLM_TEMPERATURE` | Unchanged |
| `DOCUMENTOS_EXCEL_PATH` | `EXCEL_OUTPUT_DIR` + `DOCUMENTOS_EXPORT_FILE` | Split: dir + filename |
| `DOCUMENTOS_EXCEL_WORKSHEET` | `DOCUMENTOS_EXPORT_WORKSHEET` | Renamed for consistency |
| `DOCUMENTOS_EXCEL_TABLE` | `DOCUMENTOS_EXPORT_TABLE` | Renamed for consistency |
| `DOCUMENTOS_IMPORT_EXCEL_PATH` | `EXCEL_SOURCE_DIR` + `DOCUMENTOS_IMPORT_FILE` | Split: dir + filename |
| `DOCUMENTOS_ITEMS_EXCEL_PATH` | `EXCEL_OUTPUT_DIR` + `DOCUMENTOS_ITEMS_EXPORT_FILE` | Split: dir + filename |
| `DOCUMENTOS_ITEMS_EXCEL_WORKSHEET` | `DOCUMENTOS_ITEMS_EXPORT_WORKSHEET` | Renamed for consistency |
| `DOCUMENTOS_ITEMS_EXCEL_TABLE` | `DOCUMENTOS_ITEMS_EXPORT_TABLE` | Renamed for consistency |
| `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH` | `EXCEL_SOURCE_DIR` + `DOCUMENTOS_ITEMS_IMPORT_FILE` | Split: dir + filename |

## Files to Modify

### Configuration
1. `management/src/config/settings.py` — Rename variables, add path composition
2. `management/.env` — Rewrite with new structure
3. `management/.env.example` — Rewrite with new structure

### Consumer Code (rename variable references)
4. `management/manage.py` — No changes needed (uses `config.DATABASE_PATH`, `config.EXCEL_SOURCE_DIR` which are unchanged)
5. `management/src/export/excel_export.py` — `EXCEL_OUTPUT_*` → `DATOS_RELEVANTES_*` (except `EXCEL_OUTPUT_DIR`)
6. `management/src/summarize/excel_export.py` — `DOCUMENTOS_EXCEL_*` → `DOCUMENTOS_EXPORT_*`, compose path from dir+file
7. `management/src/export/documentos_items_export.py` — `DOCUMENTOS_ITEMS_EXCEL_*` → `DOCUMENTOS_ITEMS_EXPORT_*`, compose path from dir+file
8. `management/src/migrate/engine.py` — `DOCUMENTOS_IMPORT_EXCEL_PATH` → compose from `EXCEL_SOURCE_DIR` + `DOCUMENTOS_IMPORT_FILE`; `DOCUMENTOS_EXCEL_WORKSHEET` → `DOCUMENTOS_EXPORT_WORKSHEET`; `DOCUMENTOS_ITEMS_IMPORT_EXCEL_PATH` → compose path

### Files to delete
9. `management/copy_excel_sources.sh` — WSL copy script, being decommissioned

### No changes needed
- `management/src/core/logging_config.py` — Uses `LOG_LEVEL`, `LOG_FILE` (unchanged)
- `management/src/scan/scanner.py` — Uses `DOCUMENT_SCAN_CONFIG` (unchanged)
- `management/src/summarize/engine.py` — Uses LLM_*, ANTHROPIC_API_KEY, DATABASE_PATH (unchanged)
- `management/src/calculate/engine.py` — Uses `BATCH_COMMIT_SIZE`, `DATABASE_PATH` (unchanged)
- `management/src/init/db_init.py` — Uses `DATABASE_PATH` (unchanged)
- `management/src/validate/validator.py` — Uses `DATABASE_PATH` (unchanged)
- `management/src/migrate/excel_readers.py` — Uses `EXCEL_SOURCE_DIR` (unchanged)

### Documentation
9. `specs/architecture/architecture_management.md` — Update Configuration section
10. `README.md` — Update management section if it references .env variables
11. `CLAUDE.md` — Review and update if it references management .env variables

## Risks and Mitigations

- **Risk**: Existing `.env` files on developer machines will break after the rename.
  - **Mitigation**: Clear variable mapping table in specs. The `.env.example` serves as template.

- **Risk**: Accidentally breaking a path composition.
  - **Mitigation**: Each change is a simple rename in `settings.py` and a corresponding rename in the consumer file. Test with `complete_process` after changes.
