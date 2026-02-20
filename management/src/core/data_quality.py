"""
Data quality handling module.
Provides utilities for normalizing and validating data during migration.
"""

import re
import sqlite3
import unicodedata
import logging
from datetime import datetime, date
from typing import Tuple, Optional, Any
import pandas as pd

logger = logging.getLogger('portfolio_data_quality')


def remove_accents(text: Optional[str]) -> Optional[str]:
    """
    Remove Spanish accent characters from text.

    Args:
        text: Input text with potential accents

    Returns:
        Text with accents removed, or None if input is None

    Examples:
        'Año' -> 'Anio'
        'Descripción' -> 'Descripcion'
        'Ejecución' -> 'Ejecucion'
    """
    if text is None or not isinstance(text, str):
        return text

    # NFD = Canonical Decomposition
    # Separates accented characters into base + accent
    nfd = unicodedata.normalize('NFD', text)

    # Filter out combining characters (accents)
    # Keep ñ/Ñ as they are considered separate letters in Spanish
    without_accents = ''.join(
        char for char in nfd
        if unicodedata.category(char) != 'Mn'  # Mn = Mark, Nonspacing
    )

    return without_accents


def normalize_date(value: Any) -> Tuple[Optional[str], bool]:
    """
    Normalize various date formats to ISO 8601 (YYYY-MM-DD).

    Handles:
    - Excel serial dates (numeric)
    - pandas Timestamp objects
    - Python datetime/date objects
    - Text placeholders ("Falta fecha", "Pendiente", etc.)
    - Zero or negative values
    - None/NaN values

    Args:
        value: Date value in various formats

    Returns:
        Tuple of (iso_date_string, is_valid)
        - iso_date_string: Date in 'YYYY-MM-DD' format or None
        - is_valid: True if valid date, False if placeholder/invalid

    Examples:
        44197 -> ('2021-01-01', True)  # Excel serial date
        'Falta fecha ICT' -> (None, False)
        0 -> (None, False)
        None -> (None, False)
    """
    # Handle None/NaN/NaT
    if value is None or pd.isna(value):
        return None, False

    # Handle pandas Timestamp (after NaT check)
    if isinstance(value, pd.Timestamp):
        try:
            return value.strftime('%Y-%m-%d'), True
        except (ValueError, AttributeError):
            return None, False

    # Handle Python datetime/date
    if isinstance(value, (datetime, date)):
        return value.strftime('%Y-%m-%d'), True

    # Handle string values
    if isinstance(value, str):
        value_lower = value.lower().strip()

        # Check for empty string first
        if value_lower == '':
            return None, False

        # Check for placeholder text
        placeholders = [
            'falta fecha', 'pendiente', 'sin fecha', 'n/a', 'na',
            'tbd', 'por definir', 'no definido'
        ]
        if any(placeholder in value_lower for placeholder in placeholders):
            return None, False

        # Try to parse as date string
        # Try common formats
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d', '%Y%m%d']:
            try:
                parsed = datetime.strptime(value, fmt)
                return parsed.strftime('%Y-%m-%d'), True
            except ValueError:
                continue

        # If it's a string and we can't parse it, it's invalid
        return None, False

    # Handle numeric values (Excel serial dates)
    if isinstance(value, (int, float)):
        # Zero or negative values are invalid
        if value <= 0:
            return None, False

        try:
            # Excel date system: days since 1900-01-01
            # Note: Excel has a bug for dates before 1900-03-01
            # pandas handles this correctly
            excel_epoch = datetime(1899, 12, 30)
            days = int(value)
            result_date = excel_epoch + pd.Timedelta(days=days)
            return result_date.strftime('%Y-%m-%d'), True
        except (ValueError, OverflowError, TypeError):
            return None, False

    # Unknown type
    return None, False


def normalize_currency(value: Any) -> float:
    """
    Normalize currency values to 2 decimal places.

    Handles:
    - Floats with precision issues
    - None/NaN values -> 0.0
    - String values with currency symbols

    Args:
        value: Currency value

    Returns:
        Float rounded to 2 decimal places

    Examples:
        6057066.6399999997 -> 6057066.64
        '€ 1,234.56' -> 1234.56
        None -> 0.0
    """
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return 0.0

    # Handle string values
    if isinstance(value, str):
        # Remove currency symbols and whitespace
        cleaned = re.sub(r'[€$£,\s]', '', value)
        try:
            value = float(cleaned)
        except ValueError:
            return 0.0

    # Convert to float and round
    try:
        return round(float(value), 2)
    except (ValueError, TypeError):
        return 0.0


def detect_formula_error(value: Any) -> bool:
    """
    Detect Excel formula errors.

    Args:
        value: Cell value to check

    Returns:
        True if value is a formula error

    Common Excel errors:
        #DIV/0! - Division by zero
        #N/A - Value not available
        #NAME? - Formula name not recognized
        #NULL! - Incorrect range operator
        #NUM! - Invalid numeric value
        #REF! - Invalid cell reference
        #VALUE! - Wrong type of argument
    """
    if value is None:
        return False

    if isinstance(value, str):
        return value.strip().startswith('#')

    return False


def normalize_multiline_text(value: Any) -> Optional[str]:
    """
    Normalize multi-line text fields.

    Handles:
    - CRLF normalization
    - Removes excessive whitespace
    - Handles None/NaN

    Args:
        value: Text value

    Returns:
        Normalized text or None
    """
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if not isinstance(value, str):
        value = str(value)

    # Normalize line endings (CRLF -> LF)
    normalized = value.replace('\r\n', '\n').replace('\r', '\n')

    # Remove excessive blank lines (more than 2 consecutive)
    normalized = re.sub(r'\n{3,}', '\n\n', normalized)

    # Strip leading/trailing whitespace
    normalized = normalized.strip()

    return normalized if normalized else None


# Data quality issues are now logged via the standard logging module in migrate.py
def log_quality_issue(
    conn: sqlite3.Connection,
    tabla_origen: str,
    registro_id: Optional[str],
    tipo_problema: str,
    campo_afectado: Optional[str],
    valor_invalido: Optional[str],
    severidad: str,
    descripcion: Optional[str] = None
) -> None:
    """
    Log a data quality issue into the calidad_datos table.

    Args:
        conn: Database connection
        tabla_origen: Source table name
        registro_id: Record identifier
        tipo_problema: Type of problem (e.g., 'FECHA_INVALIDA')
        campo_afectado: Affected field name
        valor_invalido: Invalid value
        severidad: Severity level ('CRITICO', 'ALTO', 'MEDIO', 'BAJO')
        descripcion: Optional description of the issue
    """
    logger.warning(
        f"Data quality issue in {tabla_origen} (ID: {registro_id}): "
        f"{tipo_problema} on field '{campo_afectado}' with value '{valor_invalido}'. "
        f"Severity: {severidad}. Description: {descripcion}"
    )


def normalize_boolean(value: Any) -> int:
    """
    Normalize boolean values to 0/1.

    Args:
        value: Boolean-like value

    Returns:
        0 or 1

    Examples:
        True -> 1
        'Yes' -> 1
        'Sí' -> 1
        False -> 0
        'No' -> 0
        None -> 0
    """
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return 0

    if isinstance(value, bool):
        return 1 if value else 0

    if isinstance(value, (int, float)):
        return 1 if value else 0

    if isinstance(value, str):
        value_lower = value.lower().strip()
        true_values = ['yes', 'sí', 'si', 'true', '1', 'verdadero', 'activo']
        if value_lower in true_values:
            return 1

    return 0


def normalize_portfolio_id(value: Any) -> Optional[str]:
    """
    Normalize portfolio ID format.

    Args:
        value: Portfolio ID value

    Returns:
        Normalized portfolio ID or None

    Examples:
        ' SPA_25_226 ' -> 'SPA_25_226'
        None -> None
    """
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if isinstance(value, str):
        value = value.strip()
        return value if value else None

    # Convert to string if not already
    return str(value).strip()


def validate_row_data(
    conn: sqlite3.Connection,
    tabla: str,
    registro_id: Optional[str],
    row_data: dict,
    validations: dict
) -> dict:
    """
    Validate and normalize a row of data according to rules.

    Args:
        conn: Database connection
        tabla: Source table name
        registro_id: Record identifier
        row_data: Dictionary of field -> value
        validations: Dictionary of field -> validation_type
            Types: 'date', 'currency', 'boolean', 'text', 'required'

    Returns:
        Normalized row_data dictionary

    Example:
        validations = {
            'fecha_inicio': 'date',
            'importe': 'currency',
            'esta_activo': 'boolean',
            'descripcion': 'text',
            'portfolio_id': 'required'
        }
    """
    normalized = {}

    for field, value in row_data.items():
        validation_type = validations.get(field)

        if validation_type == 'date':
            date_value, is_valid = normalize_date(value)
            normalized[field] = date_value
            normalized[f'{field}_valida'] = 1 if is_valid else 0

            if not is_valid and value is not None:
                log_quality_issue(
                    conn, tabla, registro_id, 'FECHA_INVALIDA',
                    field, value, 'MEDIO',
                    f'Fecha inválida o placeholder: {value}'
                )

        elif validation_type == 'currency':
            normalized[field] = normalize_currency(value)

        elif validation_type == 'boolean':
            normalized[field] = normalize_boolean(value)

        elif validation_type == 'text':
            if detect_formula_error(value):
                log_quality_issue(
                    conn, tabla, registro_id, 'ERROR_FORMULA',
                    field, value, 'MEDIO',
                    f'Error de fórmula de Excel: {value}'
                )
                normalized[field] = None
            else:
                normalized[field] = normalize_multiline_text(value)

        elif validation_type == 'required':
            if value is None or (isinstance(value, str) and not value.strip()):
                log_quality_issue(
                    conn, tabla, registro_id, 'VALOR_REQUERIDO',
                    field, value, 'ALTO',
                    f'Campo requerido está vacío'
                )
            normalized[field] = value

        else:
            # No specific validation, pass through
            normalized[field] = value

    return normalized


def get_quality_summary(conn: sqlite3.Connection) -> pd.DataFrame:
    """
    Get summary of data quality issues.

    Args:
        conn: Database connection

    Returns:
        DataFrame with quality issue summary
    """
    query = """
        SELECT
            severidad,
            tipo_problema,
            COUNT(*) as total,
            COUNT(DISTINCT tabla_origen) as tablas_afectadas
        FROM calidad_datos
        WHERE estado = 'PENDIENTE'
        GROUP BY severidad, tipo_problema
        ORDER BY
            CASE severidad
                WHEN 'CRITICO' THEN 1
                WHEN 'ALTO' THEN 2
                WHEN 'MEDIO' THEN 3
                WHEN 'BAJO' THEN 4
            END,
            total DESC
    """

    return pd.read_sql_query(query, conn)


if __name__ == "__main__":
    # Test the functions
    print("Testing data quality functions...\n")

    # Test accent removal
    print("Accent removal:")
    print(f"  'Año' -> '{remove_accents('Año')}'")
    print(f"  'Descripción' -> '{remove_accents('Descripción')}'")
    print(f"  'Ejecución' -> '{remove_accents('Ejecución')}'")

    # Test date normalization
    print("\nDate normalization:")
    test_dates = [
        44197,  # Excel serial
        'Falta fecha ICT',
        '2024-01-15',
        0,
        None
    ]
    for td in test_dates:
        result, valid = normalize_date(td)
        print(f"  {td} -> {result} (valid: {valid})")

    # Test currency normalization
    print("\nCurrency normalization:")
    test_currencies = [
        6057066.6399999997,
        '€ 1,234.56',
        None,
        '12345.678'
    ]
    for tc in test_currencies:
        result = normalize_currency(tc)
        print(f"  {tc} -> {result}")

    # Test formula error detection
    print("\nFormula error detection:")
    test_errors = ['#REF!', '#N/A', 'Normal text', None, '#DIV/0!']
    for te in test_errors:
        is_error = detect_formula_error(te)
        print(f"  {te} -> {is_error}")

    print("\n[OK] All tests completed")
