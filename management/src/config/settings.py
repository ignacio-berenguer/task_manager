"""
Configuration management for portfolio migration.

Loads settings from .env file with sensible defaults.
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Calculate paths
_management_dir = Path(__file__).parent.parent.parent
_project_root = _management_dir.parent
_db_dir = _project_root / 'db'

# Load .env file from management directory
_env_path = _management_dir / '.env'
load_dotenv(_env_path)

# --- Logging ---
LOG_FILE: str = os.getenv('LOG_FILE', 'portfolio_migration.log')
_log_level_str: str = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_LEVEL: int = getattr(logging, _log_level_str, logging.INFO)

# --- Database ---
_db_path_env = os.getenv('DATABASE_PATH', '')
if _db_path_env:
    DATABASE_PATH: str = _db_path_env
else:
    DATABASE_PATH: str = str(_db_dir / 'portfolio.db')

# --- Base Directories ---
EXCEL_SOURCE_DIR: str = os.getenv('EXCEL_SOURCE_DIR', 'excel_source')
EXCEL_OUTPUT_DIR: str = os.getenv('EXCEL_OUTPUT_DIR', 'excel_output')

# --- Excel Source Files (rarely changed, centralized here) ---
EXCEL_FILES = {
    'master': 'PortfolioDigital_Master.xlsm',
    'beneficios': 'PortfolioDigital_Beneficios.xlsm',
    'facturado': 'PortfolioDigital_Facturado.xlsx',
    'transacciones': 'PortfolioDigital_Transacciones.xlsm',
}

# --- Datos Relevantes Export ---
DATOS_RELEVANTES_FILE: str = os.getenv('DATOS_RELEVANTES_FILE', 'PortfolioDigital_DatosRelevantes.xlsm')
DATOS_RELEVANTES_WORKSHEET: str = os.getenv('DATOS_RELEVANTES_WORKSHEET', 'Datos Relevantes')
DATOS_RELEVANTES_TABLE: str = os.getenv('DATOS_RELEVANTES_TABLE', 'DatosRelevantes')
DATOS_RELEVANTES_PATH: str = str(Path(EXCEL_OUTPUT_DIR) / DATOS_RELEVANTES_FILE)

# --- Documentos Export ---
DOCUMENTOS_EXPORT_FILE: str = os.getenv('DOCUMENTOS_EXPORT_FILE', 'PortfolioDigital_Documentos.xlsm')
DOCUMENTOS_EXPORT_WORKSHEET: str = os.getenv('DOCUMENTOS_EXPORT_WORKSHEET', 'Documentos')
DOCUMENTOS_EXPORT_TABLE: str = os.getenv('DOCUMENTOS_EXPORT_TABLE', 'Documentos')
DOCUMENTOS_EXPORT_PATH: str = str(Path(EXCEL_OUTPUT_DIR) / DOCUMENTOS_EXPORT_FILE)

# --- Documentos Import ---
DOCUMENTOS_IMPORT_FILE: str = os.getenv('DOCUMENTOS_IMPORT_FILE', 'PortfolioDigital_Documentos.xlsx')
DOCUMENTOS_IMPORT_PATH: str = str(Path(EXCEL_SOURCE_DIR) / DOCUMENTOS_IMPORT_FILE)

# --- Documentos Items Export ---
DOCUMENTOS_ITEMS_EXPORT_FILE: str = os.getenv('DOCUMENTOS_ITEMS_EXPORT_FILE', 'PortfolioDigital_Documentos_Items_Calculation.xlsx')
DOCUMENTOS_ITEMS_EXPORT_WORKSHEET: str = os.getenv('DOCUMENTOS_ITEMS_EXPORT_WORKSHEET', 'Documentos_Items')
DOCUMENTOS_ITEMS_EXPORT_TABLE: str = os.getenv('DOCUMENTOS_ITEMS_EXPORT_TABLE', 'Documentos_Items')
DOCUMENTOS_ITEMS_EXPORT_PATH: str = str(Path(EXCEL_OUTPUT_DIR) / DOCUMENTOS_ITEMS_EXPORT_FILE)

# --- Documentos Items Import ---
DOCUMENTOS_ITEMS_IMPORT_FILE: str = os.getenv('DOCUMENTOS_ITEMS_IMPORT_FILE', 'PortfolioDigital_Documentos_Items.xlsx')
DOCUMENTOS_ITEMS_IMPORT_PATH: str = str(Path(EXCEL_SOURCE_DIR) / DOCUMENTOS_ITEMS_IMPORT_FILE)

# --- Batch Processing ---
BATCH_COMMIT_SIZE: int = int(os.getenv('BATCH_COMMIT_SIZE', '100'))

# --- Document Scanner ---
DOCUMENT_SCAN_CONFIG: str = os.getenv('DOCUMENT_SCAN_CONFIG', '[]')

# --- LLM Configuration ---
ANTHROPIC_API_KEY: str = os.getenv('ANTHROPIC_API_KEY', '')
LLM_PROVIDER: str = os.getenv('LLM_PROVIDER', 'claude')
LLM_MODEL: str = os.getenv('LLM_MODEL', 'claude-haiku-4-5-20251001')
LLM_MAX_TOKENS: int = int(os.getenv('LLM_MAX_TOKENS', '4096'))
LLM_TEMPERATURE: float = float(os.getenv('LLM_TEMPERATURE', '0.2'))


def validate_config(command: str, db_path: str = None, excel_dir: str = None) -> None:
    """
    Validate configuration for a given command.

    Checks that required files and directories exist before executing commands.
    Raises SystemExit with clear error messages listing all missing items.

    Args:
        command: The CLI command being executed
        db_path: Database path (overrides DATABASE_PATH if provided)
        excel_dir: Excel source directory (overrides EXCEL_SOURCE_DIR if provided)
    """
    db = db_path or DATABASE_PATH
    excel = excel_dir or EXCEL_SOURCE_DIR
    missing = []

    # Commands that require Excel source files
    if command in ('migrate', 'full_calculation_datos_relevantes', 'complete_process'):
        excel_path = Path(excel)
        if not excel_path.exists():
            missing.append(f"Excel source directory not found: {excel_path}")
        else:
            for key, filename in EXCEL_FILES.items():
                filepath = excel_path / filename
                if not filepath.exists():
                    missing.append(f"Excel file not found ({key}): {filepath}")

    # Commands that require the database to exist
    if command in ('calculate_datos_relevantes', 'validate', 'export_datos_relevantes', 'summarize_documentos'):
        db_file = Path(db)
        if not db_file.exists():
            missing.append(f"Database not found: {db_file}")

    if missing:
        msg = f"Configuration validation failed for '{command}':\n"
        for item in missing:
            msg += f"  - {item}\n"
        raise SystemExit(msg)
