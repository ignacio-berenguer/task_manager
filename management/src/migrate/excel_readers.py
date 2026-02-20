"""
Excel reader module for portfolio data.
Provides specialized readers for each workbook with proper header detection,
column mapping, and sparse matrix denormalization.
"""

import logging
import pandas as pd
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from src.core.data_quality import remove_accents
from src.config import settings as config

# Get logger (configured by main.py)
logger = logging.getLogger('portfolio_migration')


class ExcelReader:
    """Base class for Excel file reading."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        excel_dir = excel_dir or config.EXCEL_SOURCE_DIR
        self.excel_dir = Path(excel_dir)
        self.file_path = ""

    def _normalize_column_name(self, col_name: str) -> str:
        """
        Normalize column name: lowercase, remove accents, replace spaces with underscores.

        Args:
            col_name: Original column name

        Returns:
            Normalized column name
        """
        if not isinstance(col_name, str):
            return str(col_name).lower()

        # Remove accents
        normalized = remove_accents(col_name)

        if not normalized:
            raise ValueError(f"Column name '{col_name}' could not be normalized.")

        # Lowercase
        normalized = normalized.lower()

        # Replace spaces and special chars with underscores
        normalized = normalized.replace(' ', '_')
        normalized = normalized.replace('-', '_')
        normalized = normalized.replace('(', '').replace(')', '')
        normalized = normalized.replace('/', '_')

        # Remove multiple underscores
        while '__' in normalized:
            normalized = normalized.replace('__', '_')

        # Remove leading/trailing underscores
        normalized = normalized.strip('_')

        return normalized

    def _rename_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Rename all columns to normalized format.

        Args:
            df: DataFrame with original column names

        Returns:
            DataFrame with normalized column names
        """
        df.columns = [self._normalize_column_name(col) for col in df.columns]
        return df


class MasterReader(ExcelReader):
    """Reader for PortfolioDigital_Master.xlsm workbook."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Master.xlsm"

    def read_datos_relevantes(self) -> pd.DataFrame:
        """
        Read Query Datos Relevantes sheet (main portfolio data).

        Returns:
            DataFrame with portfolio initiatives
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Query Datos Relevantes',
            skiprows=2  # Skip metadata rows
        )

        df = self._rename_columns(df)

        # Keep only rows with portfolio_id
        if 'portfolio_id' in df.columns:
            df = df[df['portfolio_id'].notna()]

        return df

    def read_datos_ejecucion(self) -> pd.DataFrame:
        """
        Read Datos ejecución sheet (execution/milestone data).

        Returns:
            DataFrame with execution data
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Datos ejecución',
            skiprows=1
        )

        df = self._rename_columns(df)

        return df

    def read_informacion_economica(self) -> pd.DataFrame:
        """
        Read Información Económica sheet (financial data).

        Returns:
            DataFrame with financial information
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Información Económica',
            skiprows=2
        )

        df = self._rename_columns(df)

        return df

    def read_hechos(self) -> pd.DataFrame:
        """
        Read Hechos sheet (detailed fact records).

        Returns:
            DataFrame with fact records
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Hechos',
            skiprows=2
        )

        df = self._rename_columns(df)

        return df

    def read_personas(self) -> pd.DataFrame:
        """
        Read Personas sheet (people/contacts).

        Returns:
            DataFrame with person records
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Personas',
            skiprows=2
        )

        df = self._rename_columns(df)

        return df

    def read_grupos_iniciativas(self) -> pd.DataFrame:
        """
        Read Grupos Iniciativas sheet (initiative groups).

        Returns:
            DataFrame with group records
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Grupos Iniciativas',
            skiprows=2
        )

        df = self._rename_columns(df)

        return df

    def read_etiquetas(self) -> pd.DataFrame:
        """
        Read Etiquetas sheet (tags/labels - sparse matrix).

        This is a sparse matrix that needs denormalization.

        Returns:
            DataFrame with tag assignments (denormalized)
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Etiquetas',
            skiprows=2
        )

        df = self._rename_columns(df)

        # Denormalize: convert from wide to long format
        # Assuming first column is portfolio_id, rest are tag columns
        if len(df.columns) > 1:
            id_col = df.columns[0]
            tag_cols = df.columns[1:]

            # Melt to long format
            df_long = df.melt(
                id_vars=[id_col],
                value_vars=tag_cols, # type: ignore
                var_name='etiqueta',
                value_name='valor'
            )

            # Keep only non-null values
            df_long = df_long[df_long['valor'].notna()]

            # Rename id column to portfolio_id if needed
            if id_col != 'portfolio_id':
                df_long = df_long.rename(columns={id_col: 'portfolio_id'})

            return df_long

        return df

    def read_facturacion(self) -> pd.DataFrame:
        """
        Read Facturación sheet (billing records).

        Returns:
            DataFrame with billing data
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Facturación',
            skiprows=2
        )

        df = self._rename_columns(df)

        return df

    def read_ltp(self) -> pd.DataFrame:
        """
        Read LTP sheet (long-term planning).

        Returns:
            DataFrame with LTP data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='LTP',
                skiprows=2
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read LTP sheet: {e}")
            return pd.DataFrame()

    def read_wbes(self) -> pd.DataFrame:
        """
        Read WBEs sheet (work breakdown elements).

        Returns:
            DataFrame with WBE data
        """
        try:
            # Skip title row (row 1) and empty row (row 2) - headers in row 3
            df = pd.read_excel(
                self.file_path,
                sheet_name='WBEs',
                skiprows=[0, 1]
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read WBEs sheet: {e}")
            return pd.DataFrame()

    def read_dependencias(self) -> pd.DataFrame:
        """
        Read Dependencias sheet (initiative dependencies).

        Returns:
            DataFrame with dependency data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Dependencias',
                skiprows=2
            )

            df = self._rename_columns(df)

            # Filter out rows where portfolio_id is null
            if 'portfolio_id' in df.columns:
                df = df[df['portfolio_id'].notna()]

            return df
        except Exception as e:
            logger.warning(f"Could not read Dependencias sheet: {e}")
            return pd.DataFrame()

    def read_investment_memos(self) -> pd.DataFrame:
        """
        Read IM sheet (Investment Memo tracking).

        Returns:
            DataFrame with investment memo data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='IM',
                skiprows=2
            )

            df = self._rename_columns(df)

            # Filter out rows where portfolio_id is null/NaT (indicates table end)
            if 'portfolio_id' in df.columns:
                df = df[df['portfolio_id'].notna()]

            return df
        except Exception as e:
            logger.warning(f"Could not read IM sheet: {e}")
            return pd.DataFrame()

    def read_administrador(self) -> pd.DataFrame:
        """
        Read Administrador sheet (lookup/validation lists).

        Returns:
            DataFrame with lookup data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Administrador',
                skiprows=2
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read Administrador sheet: {e}")
            return pd.DataFrame()

    def read_notas(self) -> pd.DataFrame:
        """
        Read Notas sheet (notes for initiatives).

        Returns:
            DataFrame with notes data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Notas',
                skiprows=3
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read Notas sheet: {e}")
            return pd.DataFrame()

    def read_avance(self) -> pd.DataFrame:
        """
        Read Avance sheet (progress tracking).
        Note: Headers in row 0 (skiprows=0), skip Unnamed columns.

        Returns:
            DataFrame with progress data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Avance',
                skiprows=0
            )

            df = self._rename_columns(df)

            # Drop unnamed columns (index column from Excel)
            df = df.loc[:, ~df.columns.str.startswith('unnamed')]

            return df
        except Exception as e:
            logger.warning(f"Could not read Avance sheet: {e}")
            return pd.DataFrame()

    def read_acciones(self) -> pd.DataFrame:
        """
        Read Acciones sheet (actions for initiatives).

        Returns:
            DataFrame with actions data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Acciones',
                skiprows=2
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read Acciones sheet: {e}")
            return pd.DataFrame()

    def read_descripciones(self) -> pd.DataFrame:
        """
        Read Descripciones sheet (descriptions for initiatives).

        Returns:
            DataFrame with descriptions data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Descripciones',
                skiprows=2
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read Descripciones sheet: {e}")
            return pd.DataFrame()

    def read_estado_especial(self) -> pd.DataFrame:
        """
        Read Estado Especial sheet (special status for initiatives).

        Returns:
            DataFrame with special status data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Estado Especial',
                skiprows=2
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read Estado Especial sheet: {e}")
            return pd.DataFrame()

    def read_impacto_aatt(self) -> pd.DataFrame:
        """
        Read Impacto AATT sheet (AATT impact assessment).

        Returns:
            DataFrame with AATT impact data
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Impacto AATT',
                skiprows=2
            )

            df = self._rename_columns(df)

            return df
        except Exception as e:
            logger.warning(f"Could not read Impacto AATT sheet: {e}")
            return pd.DataFrame()


class BeneficiosReader(ExcelReader):
    """Reader for PortfolioDigital_Beneficios.xlsm workbook."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Beneficios.xlsm"

    def read_beneficios(self, sheet_name: str = 'Beneficios') -> pd.DataFrame:
        """
        Read Beneficios sheet.

        The data is already in long format with columns:
        Portfolio ID, Grupo, Concepto, Periodo, Importe, Valor, etc.

        Args:
            sheet_name: Name of sheet to read (default: 'Beneficios')

        Returns:
            DataFrame with benefit records
        """
        try:
            # Try reading with skiprows
            df = pd.read_excel(
                self.file_path,
                sheet_name=sheet_name,
                skiprows=2
            )
        except Exception:
            # Fallback: try without skiprows
            df = pd.read_excel(
                self.file_path,
                sheet_name=sheet_name
            )

        df = self._rename_columns(df)

        # Keep only rows with portfolio_id
        if 'portfolio_id' in df.columns:
            df = df[df['portfolio_id'].notna()]

        return df

    def read_all_beneficios_sheets(self) -> pd.DataFrame:
        """
        Read the main Beneficios sheet only (exclude historical snapshots).

        Historical snapshots (sheets with 'copia' in name) are excluded to avoid
        duplicate data and only keep current benefit records.

        Returns:
            DataFrame with current benefit records
        """
        xl = pd.ExcelFile(self.file_path)
        all_dfs = []

        for sheet_name in xl.sheet_names:
            if not isinstance(sheet_name, str):
                continue
            # Only read sheets with 'beneficios' in name, but exclude historical copies
            if 'beneficios' in sheet_name.lower() and 'copia' not in sheet_name.lower():
                try:
                    df = self.read_beneficios(sheet_name)
                    if not df.empty:
                        all_dfs.append(df)
                        logger.info(f"Read {len(df)} benefit records from sheet: {sheet_name}")
                except Exception as e:
                    logger.warning(f"Could not read sheet {sheet_name}: {e}")
            elif 'beneficios' in sheet_name.lower() and 'copia' in sheet_name.lower():
                logger.info(f"Skipping historical snapshot sheet: {sheet_name}")

        if all_dfs:
            combined = pd.concat(all_dfs, ignore_index=True)
            # Remove duplicates (keep last occurrence)
            if 'portfolio_id' in combined.columns and 'concepto_beneficio' in combined.columns:
                combined = combined.drop_duplicates(
                    subset=['portfolio_id', 'concepto_beneficio'],
                    keep='last'
                )
            return combined

        return pd.DataFrame()


class FacturadoReader(ExcelReader):
    """Reader for PortfolioDigital_Facturado.xlsx workbook."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Facturado.xlsx"

    def read_facturacion_mensual(self) -> pd.DataFrame:
        """
        Read monthly billing data with variance analysis.

        Returns:
            DataFrame with monthly billing records
        """
        # Try different sheet names
        possible_sheets = ['Query Facturación', 'Facturación', 'Facturacion']

        xl = pd.ExcelFile(self.file_path)

        for sheet_name in possible_sheets:
            if sheet_name in xl.sheet_names:
                try:
                    # No metadata rows - headers are in row 0
                    df = pd.read_excel(
                        self.file_path,
                        sheet_name=sheet_name,
                        skiprows=0
                    )

                    df = self._rename_columns(df)

                    return df
                except Exception as e:
                    logger.warning(f"Could not read {sheet_name}: {e}")

        # If no specific sheet found, try first sheet
        logger.warning("Using first sheet for facturacion_mensual")
        df = pd.read_excel(self.file_path, sheet_name=0, skiprows=0)
        df = self._rename_columns(df)

        return df


class TransaccionesReader(ExcelReader):
    """Reader for PortfolioDigital_Transacciones.xlsm workbook."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Transacciones.xlsm"

    def read_transacciones(self) -> pd.DataFrame:
        """
        Read Transacciones sheet (audit trail).

        The sheet has 3 header/metadata rows before the actual data headers.

        Returns:
            DataFrame with transaction records
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Transacciones',
                skiprows=3  # Skip 3 metadata rows (headers are on row 4)
            )
        except Exception:
            # Try without skiprows
            df = pd.read_excel(
                self.file_path,
                sheet_name='Transacciones'
            )

        df = self._rename_columns(df)

        return df

    def read_tabla_metadata(self) -> pd.DataFrame:
        """
        Read Tablas sheet (table metadata).

        Returns:
            DataFrame with table metadata
        """
        try:
            df = pd.read_excel(
                self.file_path,
                sheet_name='Tablas',
                skiprows=2
            )
        except Exception:
            # Try without skiprows
            df = pd.read_excel(
                self.file_path,
                sheet_name='Tablas'
            )

        df = self._rename_columns(df)

        return df


class FichasReader(ExcelReader):
    """Reader for PortfolioDigital_Fichas.xlsm workbook."""

    def __init__(self, excel_dir: str = None):  # type: ignore
        super().__init__(excel_dir)
        self.file_path = self.excel_dir / "PortfolioDigital_Fichas.xlsm"

    def read_fichas(self) -> pd.DataFrame:
        """
        Read Fichas sheet (card/sheet data for portfolio items).

        The sheet has 2 header/metadata rows before the actual data headers.

        Returns:
            DataFrame with fichas data
        """
        df = pd.read_excel(
            self.file_path,
            sheet_name='Fichas',
            skiprows=2  # Skip 2 metadata rows (headers are on row 3)
        )

        df = self._rename_columns(df)

        return df


def get_all_readers(excel_dir: str = None) -> Dict[str, ExcelReader]:  # type: ignore
    """
    Get all reader instances.

    Args:
        excel_dir: Directory containing Excel files

    Returns:
        Dictionary of reader_name -> reader_instance
    """
    return {
        'master': MasterReader(excel_dir),
        'beneficios': BeneficiosReader(excel_dir),
        'facturado': FacturadoReader(excel_dir),
        'transacciones': TransaccionesReader(excel_dir),
        'fichas': FichasReader(excel_dir)
    }


if __name__ == "__main__":
    # Test the readers
    print("Testing Excel readers...\n")

    # Test Master reader
    print("=== Testing MasterReader ===")
    master = MasterReader()

    if master.file_path.exists():
        print(f"[OK] Found: {master.file_path}")

        # Test reading datos relevantes
        df = master.read_datos_relevantes()
        print(f"[OK] Datos Relevantes: {len(df)} rows, {len(df.columns)} columns")
        print(f"  First 5 columns: {df.columns[:5].tolist()}")

        # Test reading personas
        df_personas = master.read_personas()
        print(f"[OK] Personas: {len(df_personas)} rows")

        # Test reading grupos
        df_grupos = master.read_grupos_iniciativas()
        print(f"[OK] Grupos Iniciativas: {len(df_grupos)} rows")
    else:
        print(f"✗ File not found: {master.file_path}")

    # Test Beneficios reader
    print("\n=== Testing BeneficiosReader ===")
    beneficios = BeneficiosReader()

    if beneficios.file_path.exists():
        print(f"[OK] Found: {beneficios.file_path}")

        df_ben = beneficios.read_all_beneficios_sheets()
        print(f"[OK] Beneficios (denormalized): {len(df_ben)} rows")
        if len(df_ben) > 0:
            print(f"  Columns: {df_ben.columns.tolist()}")
    else:
        print(f"✗ File not found: {beneficios.file_path}")

    print("\n[OK] Reader tests completed")
