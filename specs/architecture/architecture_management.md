# Portfolio Migration System - Management Module Architecture

## Overview

The Portfolio Migration System is a CLI tool that migrates portfolio management data from Excel workbooks to a normalized SQLite database. The architecture follows a modular, command-based structure where each CLI command has its own package.

This module is located in the `management/` folder of the project.

## Project Structure

```
portfolio_migration/
├── management/              # This module - Portfolio migration CLI tool
│   ├── manage.py            # CLI entry point
│   ├── src/                 # Source code
│   ├── .env                 # Configuration (gitignored)
│   └── ...
├── db/                      # Database directory
│   ├── schema.sql           # Database DDL (28 tables)
│   └── portfolio.db         # SQLite database (gitignored)
├── backend/                 # Backend module (future)
├── frontend/                # Frontend module (future)
├── logs/                    # Centralized log directory
│   └── portfolio_migration.log
└── specs/                   # Technical specifications (shared)
```

## Package Structure

```
management/src/
├── __init__.py              # Package root
├── core/                    # Shared utilities (no dependencies on other src packages)
│   ├── logging_config.py    # Centralized logging setup (writes to PROJECT_ROOT/logs/)
│   └── data_quality.py      # Data normalization utilities
├── config/                  # Configuration (depends on: none)
│   └── settings.py          # Environment-based configuration
├── init/                    # init command (depends on: config)
│   └── db_init.py           # Database initialization
├── migrate/                 # migrate command (depends on: config, core)
│   ├── engine.py            # Migration engine
│   └── excel_readers.py     # Excel file readers
├── calculate/               # calculate_datos_relevantes command (depends on: config)
│   ├── engine.py            # Main entry point and orchestration
│   ├── estado_functions.py  # Estado calculation functions
│   ├── importe_functions.py # Importe calculation functions
│   ├── lookup_functions.py  # Lookup functions
│   └── helper_functions.py  # Helper functions
├── export/                  # export_datos_relevantes command (depends on: config)
│   └── excel_export.py      # Excel export functionality
├── scan/                    # scan_documents command (depends on: config)
│   ├── scanner.py           # Document scanner engine
│   └── portfolio_patterns.py # Portfolio ID pattern matching
├── summarize/               # summarize_documentos command (depends on: config)
│   ├── engine.py            # Orchestrator: query pending, process, update
│   ├── document_reader.py   # File content extraction (PDF, DOCX, TXT)
│   ├── llm_client.py        # Abstract LLM interface + Claude implementation
│   ├── prompts.py           # Prompt templates per tipo_documento + JSON schemas
│   └── excel_export.py      # Export documentos table to Excel
└── validate/                # validate command (depends on: config)
    └── validator.py         # Validation functionality
```

## Dependency Graph

```
                    manage.py
                       │
    ┌──────────┬───────┼──────────────────┐
    │          │       │                  │
    ▼          ▼       ▼                  ▼
  init  recreate_tables migrate       validate
    │                  │                  │
    │            ┌─────┴─────┐            │
    │            │           │            │
    │            ▼           ▼            │
    │       engine.py  excel_readers      │
    │            │           │            │
    └────────────┼───────────┼────────────┘
                 │           │
                 ▼           ▼
               config      core
                 │           │
                 └─────┬─────┘
                       ▼
              management/.env
```

## Module Responsibilities

### core/logging_config.py
- Provides `setup_logging()` function for centralized logging
- Configures file and console handlers
- All modules use the same log file (`PROJECT_ROOT/logs/portfolio_migration.log`)
- Automatically creates logs directory if it doesn't exist

### core/data_quality.py
- Data normalization functions:
  - `normalize_date()`: Excel serial dates → ISO 8601
  - `normalize_currency()`: Currency to 2 decimal places
  - `normalize_boolean()`: Various boolean formats → 0/1
  - `normalize_multiline_text()`: CRLF normalization
  - `normalize_portfolio_id()`: Portfolio ID cleanup
  - `detect_formula_error()`: Excel formula error detection

### config/settings.py
- Loads configuration from `management/.env` file
- Provides constants: DATABASE_PATH, EXCEL_SOURCE_DIR, EXCEL_OUTPUT_DIR, LOG_LEVEL, BATCH_COMMIT_SIZE, etc.
- Composes full paths at load time from base directory + filename (e.g., DATOS_RELEVANTES_PATH, DOCUMENTOS_EXPORT_PATH)
- `validate_config(command, db_path, excel_dir)`: Startup validation of required files/directories before executing commands

### init/db_init.py
- `create_database(db_path, force_overwrite)`: Creates SQLite database and executes `PROJECT_ROOT/db/schema.sql`
  - `force_overwrite=True`: Silently overwrites existing database (used by complete_process command)
  - `force_overwrite=False`: Prompts user for confirmation (default, interactive mode)

### migrate/engine.py
- `MigrationEngine` class: Orchestrates the full migration
- `migrate_all()`: Entry point for migration command
- Handles logging, error tracking, and metadata recording

### migrate/excel_readers.py
- Reader classes for each Excel workbook:
  - `MasterReader`: PortfolioDigital_Master.xlsm (includes "Dependencias" sheet → dependencias table)
  - `BeneficiosReader`: PortfolioDigital_Beneficios.xlsm
  - `FacturadoReader`: PortfolioDigital_Facturado.xlsx
  - `TransaccionesReader`: PortfolioDigital_Transacciones.xlsm
  - `FichasReader`: PortfolioDigital_Fichas.xlsm
  - `DocumentosReader`: PortfolioDigital_Documentos.xlsm (new Phase 10)
- Column name normalization (remove accents, lowercase, underscores)
- Sparse matrix denormalization for beneficios/etiquetas

### calculate/ (split into multiple files)

#### engine.py
- `main()`: Entry point for calculate command
- `_preload_caches()`: Preloads 8 reference tables into memory dicts (replaces ~35K per-row SQL queries with ~8 bulk queries)
- `calculate_datos_relevantes()`: Orchestrates calculation with preloaded caches
- `calculate_row()`: Calculates all fields for one portfolio using in-memory caches
- `validate_against_iniciativas()`: Compares calculated vs Excel values

#### estado_functions.py
- `estado_iniciativa()`: Current initiative state
- `estado_aprobacion_iniciativa()`: Approval state
- `estado_ejecucion_iniciativa()`: Execution state
- `estado_agrupado()`, `estado_dashboard()`: Grouped states
- `fecha_de_ultimo_estado()`: Date of last state

#### importe_functions.py
- `importe()`: Main dispatcher for amount calculations
- `_importe_iniciativa()`: Initiative amount
- `_importe_aprobado()`: Approved amount
- `_importe_sm200()`: SM200 amount
- `_importe_planificado()`: Planned amount
- `_importe_facturado()`: Billed amount

#### lookup_functions.py
- `get_datos_descriptivos_lookups()`: Lookup from datos_descriptivos
- `get_informacion_economica_lookups()`: Lookup from informacion_economica

#### helper_functions.py
- `ultimo_id()`: Get latest hecho ID
- `ultimo_id_aprobado()`: Get latest approved hecho ID
- `fecha_estado()`: Get date for a specific state
- `en_presupuesto_del_ano()`: Check if in budget for year

### export/excel_export.py
- `export_datos_relevantes()`: Exports table to Excel
- Preserves Excel table structure and formatting
- Handles date conversion (ISO → Excel date)

### scan/ (document scanner)
- `scanner.py`: Discovers documents from configured OneDrive folders, inserts new records into `documentos` table
- `portfolio_patterns.py`: Regex-based portfolio ID extraction from folder/file names

### summarize/ (LLM document summarization)

#### engine.py
- `summarize_documentos(db_path, portfolio_ids, reprocess)`: Main entry point — queries documents (filtered by params), processes each with LLM, updates DB, exports to Excel
- CLI filters: `--portfolio-ids` (comma-separated), `--reprocess` (ignore estado filter), `--json-output-to-console` (print colored JSON per document)
- Token tracking: stores `tokens_input` and `tokens_output` per document, logs per-document and batch totals
- Schema migrations: `_migrate_check_constraint()` and `_migrate_token_columns()` for existing databases
- Per-document timing logged at INFO level
- Suppresses noisy httpcore/httpx DEBUG messages
- Immediate per-document commit: each document result is persisted to the database as soon as it is processed, avoiding data loss if the batch is interrupted
- Resilient batch processing: broad try/except per document ensures the batch never stops
- Three outcomes per document: `Completado`, `Error`, `Ignorado`

#### document_reader.py
- `read_document()`: Dispatches by file extension to format-specific readers
- Supports PDF (pymupdf), DOCX (python-docx), TXT (with encoding fallback)
- Raises `UnsupportedFormatError` for unknown formats

#### llm_client.py
- `SummarizeResult` dataclass: `text`, `input_tokens`, `output_tokens`
- `LLMClient` (ABC): Abstract interface for LLM providers, returns `SummarizeResult`
- `ClaudeClient`: Anthropic Claude implementation — each `summarize()` call is a fresh API request, extracts `response.usage.input_tokens` and `response.usage.output_tokens`
- `create_llm_client()`: Factory function for provider instantiation
- Extensible: new providers only need to implement `LLMClient` and register in factory

#### prompts.py
- `PromptTemplate` dataclass with system prompt and JSON schema description
- `PROMPT_CONFIG`: Per-tipo_documento prompt configurations (SM100, SM200, default)
- `SKIP_DOCUMENT_TYPES`: Document types to mark as `Ignorado` (e.g., "Approval Form")
- All prompts produce Spanish-language output

#### excel_export.py
- `export_documentos()`: Exports complete `documentos` table to Excel
- Follows same pattern as `export/excel_export.py` (open workbook, map columns, write rows)

### validate/validator.py
- `validate_all()`: Entry point for validate command
- `validate_referential_integrity()`: Check FK relationships
- `validate_row_counts()`: Count rows in all tables
- `generate_quality_report()`: Generate validation report

## Data Flow

### Migration Flow
```
Excel Files → Excel Readers → Migration Engine → SQLite Database
                    │
                    ▼
            Data Quality Functions
            (normalize dates, currency, etc.)
```

### Calculation Flow
```
SQLite Database (8 tables)
                    │
                    ▼
        _preload_caches() → in-memory dicts
     (dd, ie, hechos, facturacion, justificaciones,
      etiquetas, estado_especial, acciones)
                    │
                    ▼
            For each portfolio_id:
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
Estado Functions  Importe Functions  Lookup Functions
  (use caches)    (use caches)      (use caches)
    │               │               │
    └───────────────┴───────────────┘
                    │
                    ▼
            calculate_row(caches, portfolio_id)
                    │
                    ▼
        UPDATE datos_relevantes (batch commit every BATCH_COMMIT_SIZE rows)
```

### Summarization Flow
```
SQLite Database (documentos table)
        │
        ▼
  Query (filtered by --portfolio-ids, --reprocess flags)
        │
        ▼
  For each document:
        │
  ┌─────┼──────────────┐
  │     │              │
  ▼     ▼              ▼
Skip?  Read file    On error
(Ignorado)  │      (Error)
        │
        ▼
  Get prompt for tipo_documento
  (SM100 / SM200 / default)
        │
        ▼
  LLM Client (Claude API)
  Fresh request per document
        │
        ▼
  Parse JSON response
        │
        ▼
  UPDATE documentos
  (resumen_documento, estado, tokens_input, tokens_output)
        │
        ▼
  Export documentos → Excel
```

## Extension Points

### Adding a New Command
1. Create a new package under `management/src/` (e.g., `management/src/newcmd/`)
2. Add `__init__.py` with public exports
3. Add command handling in `management/manage.py`

### Adding New Calculations
1. Add function to appropriate module in `management/src/calculate/`:
   - Estado-related → `estado_functions.py`
   - Amount-related → `importe_functions.py`
   - Lookups → `lookup_functions.py`
   - Utilities → `helper_functions.py`
2. Call the function from `calculate_row()` in `engine.py`

### Adding New Excel Sheets
1. Add reader method to appropriate class in `excel_readers.py`
2. Add migration method to `MigrationEngine` in `migrate/engine.py`
3. Call the migration method from `migrate_all()`

## Configuration

Configuration is loaded from `management/.env` file:

```env
# --- Logging ---
LOG_LEVEL=INFO
LOG_FILE=portfolio_migration.log

# --- Database ---
# DATABASE_PATH=            # Leave empty for default (PROJECT_ROOT/db/portfolio.db)

# --- Base Directories ---
# Defined once, reused by all file references below
EXCEL_SOURCE_DIR=excel_source
EXCEL_OUTPUT_DIR=excel_output

# --- Datos Relevantes Export ---
# Full path = EXCEL_OUTPUT_DIR / DATOS_RELEVANTES_FILE
DATOS_RELEVANTES_FILE=PortfolioDigital_DatosRelevantes.xlsm
DATOS_RELEVANTES_WORKSHEET=Datos Relevantes
DATOS_RELEVANTES_TABLE=DatosRelevantes

# --- Documentos Export ---
# Full path = EXCEL_OUTPUT_DIR / DOCUMENTOS_EXPORT_FILE
DOCUMENTOS_EXPORT_FILE=PortfolioDigital_Documentos.xlsm
DOCUMENTOS_EXPORT_WORKSHEET=Documentos
DOCUMENTOS_EXPORT_TABLE=Documentos

# --- Documentos Import ---
# Full path = EXCEL_SOURCE_DIR / DOCUMENTOS_IMPORT_FILE
DOCUMENTOS_IMPORT_FILE=PortfolioDigital_Documentos.xlsx

# --- Documentos Items Export ---
# Full path = EXCEL_OUTPUT_DIR / DOCUMENTOS_ITEMS_EXPORT_FILE
DOCUMENTOS_ITEMS_EXPORT_FILE=PortfolioDigital_Documentos_Items_Calculation.xlsx
DOCUMENTOS_ITEMS_EXPORT_WORKSHEET=Documentos_Items
DOCUMENTOS_ITEMS_EXPORT_TABLE=Documentos_Items

# --- Documentos Items Import ---
# Full path = EXCEL_SOURCE_DIR / DOCUMENTOS_ITEMS_IMPORT_FILE
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

**Path Composition:** Individual `_FILE` variables contain only filenames. Full paths are composed at load time in `settings.py` by combining the base directory + filename (e.g., `DATOS_RELEVANTES_PATH = EXCEL_OUTPUT_DIR / DATOS_RELEVANTES_FILE`). This eliminates path repetition in the `.env` file.

### Startup Validation

Before executing any command, `validate_config()` checks:
- **migrate, complete_process**: Excel source directory and all required Excel files exist
- **calculate, validate, export, summarize_documentos**: Database file exists

Missing items are reported as a list of clear error messages before any processing begins.

## Error Handling

- All modules log errors to centralized log file (`PROJECT_ROOT/logs/portfolio_migration.log`)
- Migration errors are recorded in `migracion_metadata` table
- Calculation errors are logged but don't stop the process
- Fatal errors print stack trace to console

## CLI Commands

The system provides nine CLI commands (run from `management/` directory):

| Command | Description |
|---------|-------------|
| `init` | Initialize database (creates schema), prompts for overwrite |
| `recreate_tables` | Drop all tables and recreate from schema.sql without deleting the .db file |
| `migrate` | Migrate data from Excel to SQLite |
| `validate` | Validate migrated data integrity |
| `calculate_datos_relevantes` | Calculate computed table values |
| `export_datos_relevantes` | Export datos_relevantes to Excel |
| `complete_process` | Run full pipeline (recreate_tables → migrate → calculate → export) |
| `scan_documents` | Discover documents from configured folders and insert into documentos table |
| `summarize_documentos` | Summarize documents using LLM and export to Excel (`--portfolio-ids`, `--reprocess`, `--json-output-to-console`) |

### recreate_tables

Drops all existing tables from the SQLite database and recreates them by executing `PROJECT_ROOT/db/schema.sql`. Unlike `init`, this does not delete and recreate the `.db` file itself. This is useful for re-applying schema changes without losing the database file.

**PRESERVED_TABLES**: Tables listed in `PRESERVED_TABLES` (in `db_init.py`) have their data backed up before table drop and restored after recreation. Currently preserved: `transacciones_json`. This protects transaction history from being lost during routine `recreate_tables` or `complete_process` operations.

### complete_process

This command orchestrates the complete pipeline for automated/scheduled runs:

1. Recreate tables (drop all tables and recreate from schema.sql)
2. Migrate all data from Excel (includes 10 migration phases)
3. Calculate datos_relevantes table
4. Export to Excel

**Migration Phases:**
1. Core Initiative Data (iniciativas)
2. Descriptive Data (datos_descriptivos)
3. Financial Data (informacion_economica)
4. Operational Data (datos_ejecucion, hechos)
5. Benefits Data (beneficios)
6. Supporting Tables (etiquetas, justificaciones, ltp, wbes, dependencias)
7. Additional Data (notas, avance, acciones, descripciones, estado_especial, investment_memos, impacto_aatt)
8. Fichas Data (fichas)
9. Audit/Metadata (migracion_metadata, transacciones)
10. Document Data (documentos, documentos_items)

It reuses existing command implementations rather than duplicating code.

## Testing Strategy

Test each command independently from the `management/` directory:

```bash
cd management

# Test init
uv run python manage.py init --db test.db

# Test migrate
uv run python manage.py migrate --db test.db

# Test validate
uv run python manage.py validate --db test.db

# Test calculate
uv run python manage.py calculate_datos_relevantes --db test.db

# Test full pipeline
uv run python manage.py complete_process --db test.db
```

Compare row counts and values between runs to verify refactoring didn't break functionality.
