"""Migration engine for importing tareas and acciones from Excel."""

import logging
import re
import sqlite3
import time
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

from src.config import settings
from src.core.data_quality import normalize_date, normalize_multiline_text

LOG = logging.getLogger("task_manager_migration")

# Column mapping: Excel column name (after normalization) -> DB column name
TAREAS_COLUMN_MAP = {
    "tarea_id": "tarea_id",
    "tarea": "tarea",
    "responsable": "responsable",
    "descripcion": "descripcion",
    "fecha_nba": "fecha_siguiente_accion",
    "tema": "tema",
    "estado": "estado",
    "notas": "notas_anteriores",
}

# Regex patterns for Notas parsing
DATE_FULL_RE = re.compile(r'^(\d{1,2})/(\d{1,2})/(\d{4})')
DATE_SHORT_RE = re.compile(r'^(\d{1,2})/(\d{1,2})(?![/\d])')
NBA_RE = re.compile(r'^NBA\s*:', re.IGNORECASE)


def normalize_accion_text(text: str) -> str | None:
    """Strip leading spaces/punctuation, capitalize first letter."""
    cleaned = re.sub(r'^[\s.,;:\-!?]+', '', text)
    cleaned = cleaned.rstrip()
    if not cleaned:
        return None
    return cleaned[0].upper() + cleaned[1:]


def parse_notas(notas_text: str) -> list[dict]:
    """Parse multi-line Notas text into a list of accion dicts.

    Each dict has keys: accion, fecha_accion, estado.

    Lines starting with a date (DD/MM/YYYY or DD/MM) produce estado=COMPLETADO.
    Lines starting with NBA: produce estado=PENDIENTE with fecha=today+7.
    Other non-empty lines are skipped with a warning.
    """
    if not notas_text or not isinstance(notas_text, str):
        return []

    lines = notas_text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    results = []
    last_year = 2025

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check for NBA prefix
        nba_match = NBA_RE.match(stripped)
        if nba_match:
            text_after = stripped[nba_match.end():]
            accion_text = normalize_accion_text(text_after)
            if accion_text:
                future_date = (date.today() + timedelta(days=7)).isoformat()
                results.append({
                    "accion": accion_text,
                    "fecha_accion": future_date,
                    "estado": "PENDIENTE",
                })
            continue

        # Check for full date DD/MM/YYYY
        full_match = DATE_FULL_RE.match(stripped)
        if full_match:
            day, month, year = int(full_match.group(1)), int(full_match.group(2)), int(full_match.group(3))
            last_year = year
            try:
                fecha = date(year, month, day).isoformat()
            except ValueError:
                LOG.warning(f"Invalid date in Notas line: '{stripped}'")
                continue
            text_after = stripped[full_match.end():]
            accion_text = normalize_accion_text(text_after)
            if accion_text:
                results.append({
                    "accion": accion_text,
                    "fecha_accion": fecha,
                    "estado": "COMPLETADO",
                })
            continue

        # Check for short date DD/MM
        short_match = DATE_SHORT_RE.match(stripped)
        if short_match:
            day, month = int(short_match.group(1)), int(short_match.group(2))
            try:
                fecha = date(last_year, month, day).isoformat()
            except ValueError:
                LOG.warning(f"Invalid date in Notas line: '{stripped}' (using year {last_year})")
                continue
            text_after = stripped[short_match.end():]
            accion_text = normalize_accion_text(text_after)
            if accion_text:
                results.append({
                    "accion": accion_text,
                    "fecha_accion": fecha,
                    "estado": "COMPLETADO",
                })
            continue

        # Line doesn't match any pattern
        LOG.debug(f"Skipping unparseable Notas line: '{stripped}'")

    return results


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
        """Run full migration: tareas + acciones from notas + responsables."""
        LOG.info("=" * 60)
        LOG.info("Starting migration")
        LOG.info("=" * 60)

        try:
            self.migrate_tareas()
            self.migrate_acciones_from_notas()
            self.migrate_responsables()
            LOG.info("Migration completed successfully")
        except Exception as e:
            LOG.error(f"Migration failed: {e}", exc_info=True)
            raise
        finally:
            self.close()

    def _read_excel_table(self, excel_path: Path) -> pd.DataFrame:
        """Read data from an Excel named Table (ListObject).

        Uses openpyxl to locate the named Table within the sheet and
        reads only that range into a DataFrame.  Falls back to reading
        the entire sheet if the table is not found.
        """
        import openpyxl

        sheet_name = settings.EXCEL_SHEET_TAREAS
        table_name = settings.EXCEL_TABLE_TAREAS

        # Must open without read_only to access Table definitions
        wb = openpyxl.load_workbook(excel_path, data_only=True)
        ws = wb[sheet_name]

        # Look for the named Table in this sheet
        table = None
        for t in ws.tables.values():
            if t.name == table_name:
                table = t
                break

        if table is None:
            LOG.warning(
                f"Excel Table '{table_name}' not found in sheet '{sheet_name}', "
                "falling back to reading the entire sheet"
            )
            wb.close()
            return pd.read_excel(excel_path, sheet_name=sheet_name)

        # Read the table range
        LOG.info(f"Reading Excel Table '{table_name}' range {table.ref}")
        rows = list(ws[table.ref])
        wb.close()

        if len(rows) < 2:
            return pd.DataFrame()

        headers = [str(cell.value).strip() if cell.value else f"col_{i}" for i, cell in enumerate(rows[0])]
        data = [[cell.value for cell in row] for row in rows[1:]]
        return pd.DataFrame(data, columns=headers)

    def migrate_tareas(self):
        """Read tareas from Excel and insert into database."""
        excel_path = self.excel_dir / settings.EXCEL_SOURCE_FILE

        LOG.info(f"Migrating tareas from {excel_path}")
        start = time.time()

        df = self._read_excel_table(excel_path)
        LOG.info(f"Read {len(df)} rows from Excel")

        # Normalize column names: lowercase, strip whitespace, replace spaces with underscores
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

        # Auto-generate tarea_id if not present
        if "tarea_id" not in df.columns:
            LOG.warning("Column 'tarea_id' not found in Excel, auto-generating IDs")
            df["tarea_id"] = [f"TAREA_{i+1:03d}" for i in range(len(df))]

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
        if "notas_anteriores" in mapped_df.columns:
            mapped_df["notas_anteriores"] = mapped_df["notas_anteriores"].apply(
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

    def migrate_acciones_from_notas(self):
        """Parse notas_anteriores from tareas and create acciones_realizadas records."""
        LOG.info("Migrating acciones from tareas notas_anteriores")
        start = time.time()

        cursor = self.conn.cursor()
        cursor.execute("SELECT tarea_id, notas_anteriores FROM tareas WHERE notas_anteriores IS NOT NULL")
        tareas = cursor.fetchall()

        inserted = 0
        completado_count = 0
        pendiente_count = 0
        errors = 0
        batch_count = 0
        batch_size = settings.BATCH_COMMIT_SIZE

        for tarea_id, notas_text in tareas:
            acciones = parse_notas(notas_text)
            for accion in acciones:
                try:
                    cursor.execute(
                        "INSERT INTO acciones_realizadas (tarea_id, accion, fecha_accion, estado) VALUES (?, ?, ?, ?)",
                        (tarea_id, accion["accion"], accion["fecha_accion"], accion["estado"]),
                    )
                    inserted += 1
                    batch_count += 1
                    if accion["estado"] == "COMPLETADO":
                        completado_count += 1
                    else:
                        pendiente_count += 1

                    if batch_count >= batch_size:
                        self.conn.commit()
                        batch_count = 0
                except Exception as e:
                    errors += 1
                    LOG.warning(f"Error inserting accion for tarea '{tarea_id}': {e}")

        self.conn.commit()

        duration = time.time() - start
        LOG.info(
            f"Acciones from notas: {inserted} inserted "
            f"(COMPLETADO: {completado_count}, PENDIENTE: {pendiente_count}), "
            f"{errors} errors in {duration:.1f}s"
        )

    def migrate_responsables(self):
        """Extract unique responsable values from tareas and seed the responsables table."""
        LOG.info("Migrating responsables from tareas")

        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT DISTINCT responsable FROM tareas WHERE responsable IS NOT NULL AND responsable != '' ORDER BY responsable"
        )
        responsables = [row[0] for row in cursor.fetchall()]

        inserted = 0
        for i, valor in enumerate(responsables):
            try:
                cursor.execute(
                    "INSERT OR IGNORE INTO responsables (valor, orden) VALUES (?, ?)",
                    (valor, i + 1),
                )
                if cursor.rowcount > 0:
                    inserted += 1
            except Exception as e:
                LOG.warning(f"Error inserting responsable '{valor}': {e}")

        self.conn.commit()
        LOG.info(f"Responsables: {inserted} unique values seeded")
