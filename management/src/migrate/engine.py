"""Migration engine for importing tareas and acciones from Excel."""

import logging
import sqlite3
import time
from pathlib import Path

import pandas as pd

from src.config import settings
from src.core.data_quality import normalize_date, normalize_multiline_text

LOG = logging.getLogger("task_manager_migration")

# Column mapping: Excel column name -> DB column name
# Users can customize these in the Excel file headers
TAREAS_COLUMN_MAP = {
    "tarea_id": "tarea_id",
    "tarea": "tarea",
    "responsable": "responsable",
    "descripcion": "descripcion",
    "fecha_siguiente_accion": "fecha_siguiente_accion",
    "tema": "tema",
    "estado": "estado",
}

ACCIONES_COLUMN_MAP = {
    "tarea_id": "tarea_id",
    "accion": "accion",
    "estado": "estado",
}


class TareasMigrationEngine:
    """Import tareas and acciones from Excel into SQLite."""

    def __init__(self, db_path: str, excel_dir: str):
        self.db_path = db_path
        self.excel_dir = Path(excel_dir)
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("PRAGMA foreign_keys = ON")

    def close(self):
        if self.conn:
            self.conn.close()

    def migrate_all(self):
        """Run full migration: tareas + acciones."""
        LOG.info("=" * 60)
        LOG.info("Starting migration")
        LOG.info("=" * 60)

        try:
            self.migrate_tareas()
            self.migrate_acciones()
            LOG.info("Migration completed successfully")
        except Exception as e:
            LOG.error(f"Migration failed: {e}", exc_info=True)
            raise
        finally:
            self.close()

    def migrate_tareas(self):
        """Read tareas from Excel and insert into database."""
        excel_path = self.excel_dir / settings.EXCEL_SOURCE_FILE
        sheet_name = settings.EXCEL_SHEET_TAREAS

        LOG.info(f"Migrating tareas from {excel_path} sheet '{sheet_name}'")
        start = time.time()

        df = pd.read_excel(excel_path, sheet_name=sheet_name)
        LOG.info(f"Read {len(df)} rows from Excel")

        # Normalize column names: lowercase, strip whitespace
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

        # Map columns
        mapped_cols = {}
        for excel_col, db_col in TAREAS_COLUMN_MAP.items():
            if excel_col in df.columns:
                mapped_cols[db_col] = df[excel_col]
            else:
                LOG.warning(f"Column '{excel_col}' not found in Excel, will be NULL")

        if "tarea_id" not in mapped_cols:
            raise ValueError("Required column 'tarea_id' not found in Excel")

        mapped_df = pd.DataFrame(mapped_cols)

        # Normalize data
        if "fecha_siguiente_accion" in mapped_df.columns:
            mapped_df["fecha_siguiente_accion"] = mapped_df["fecha_siguiente_accion"].apply(
                lambda v: normalize_date(v)[0] if pd.notna(v) else None
            )
        if "descripcion" in mapped_df.columns:
            mapped_df["descripcion"] = mapped_df["descripcion"].apply(
                lambda v: normalize_multiline_text(v) if pd.notna(v) else None
            )
        if "tarea" in mapped_df.columns:
            mapped_df["tarea"] = mapped_df["tarea"].apply(
                lambda v: normalize_multiline_text(v) if pd.notna(v) else None
            )

        # Replace NaN with None
        mapped_df = mapped_df.where(pd.notna(mapped_df), None)

        # Insert in batches
        cursor = self.conn.cursor()
        inserted = 0
        errors = 0
        batch_size = settings.BATCH_COMMIT_SIZE

        for i in range(0, len(mapped_df), batch_size):
            batch = mapped_df.iloc[i:i + batch_size]
            for _, row in batch.iterrows():
                try:
                    cols = [c for c in row.index if row[c] is not None]
                    vals = [row[c] for c in cols]
                    placeholders = ", ".join(["?"] * len(cols))
                    col_names = ", ".join(cols)
                    cursor.execute(
                        f"INSERT OR REPLACE INTO tareas ({col_names}) VALUES ({placeholders})",
                        vals,
                    )
                    inserted += 1
                except Exception as e:
                    errors += 1
                    LOG.warning(f"Error inserting tarea '{row.get('tarea_id', '?')}': {e}")
            self.conn.commit()

        duration = time.time() - start
        LOG.info(f"Tareas migration: {inserted} inserted, {errors} errors in {duration:.1f}s")

    def migrate_acciones(self):
        """Read acciones from Excel and insert into database."""
        excel_path = self.excel_dir / settings.EXCEL_SOURCE_FILE
        sheet_name = settings.EXCEL_SHEET_ACCIONES

        LOG.info(f"Migrating acciones from {excel_path} sheet '{sheet_name}'")
        start = time.time()

        try:
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
        except ValueError:
            LOG.warning(f"Sheet '{sheet_name}' not found in {excel_path}, skipping acciones migration")
            return

        LOG.info(f"Read {len(df)} rows from Excel")

        # Normalize column names
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

        # Map columns
        mapped_cols = {}
        for excel_col, db_col in ACCIONES_COLUMN_MAP.items():
            if excel_col in df.columns:
                mapped_cols[db_col] = df[excel_col]
            else:
                LOG.warning(f"Column '{excel_col}' not found in Excel, will be NULL")

        if "tarea_id" not in mapped_cols:
            raise ValueError("Required column 'tarea_id' not found in acciones Excel sheet")
        if "accion" not in mapped_cols:
            raise ValueError("Required column 'accion' not found in acciones Excel sheet")

        mapped_df = pd.DataFrame(mapped_cols)

        # Replace NaN with None
        mapped_df = mapped_df.where(pd.notna(mapped_df), None)

        # Insert in batches
        cursor = self.conn.cursor()
        inserted = 0
        errors = 0
        batch_size = settings.BATCH_COMMIT_SIZE

        for i in range(0, len(mapped_df), batch_size):
            batch = mapped_df.iloc[i:i + batch_size]
            for _, row in batch.iterrows():
                try:
                    cols = [c for c in row.index if row[c] is not None]
                    vals = [row[c] for c in cols]
                    placeholders = ", ".join(["?"] * len(cols))
                    col_names = ", ".join(cols)
                    cursor.execute(
                        f"INSERT INTO acciones_realizadas ({col_names}) VALUES ({placeholders})",
                        vals,
                    )
                    inserted += 1
                except Exception as e:
                    errors += 1
                    LOG.warning(f"Error inserting accion for tarea '{row.get('tarea_id', '?')}': {e}")
            self.conn.commit()

        duration = time.time() - start
        LOG.info(f"Acciones migration: {inserted} inserted, {errors} errors in {duration:.1f}s")
