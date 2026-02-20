"""
Excel write-back service using xlwings.

Processes pending transacciones_json records (estado_db=EJECUTADO,
estado_excel=PENDIENTE) and writes changes back to the original
Excel source files via the Excel COM API.
"""

import json
import logging
import os
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import xlwings as xw
from sqlalchemy.orm import Session

from app.models import TransaccionJson
from app.services.excel_mapping import EXCEL_MAPPING

logger = logging.getLogger("portfolio_backend")

# Module-level processing state for polling
_processing_state = {
    "status": "idle",
    "total": 0,
    "processed": 0,
    "success": 0,
    "errors": 0,
    "details": [],
    "started_at": None,
    "completed_at": None,
}


class _SheetCache:
    """Caches bulk-read sheet data to avoid redundant COM calls.

    One instance per workbook. Stores {sheet_name: (rows_data, first_data_row, last_col)}.
    Invalidate after INSERT or DELETE (row positions change).
    """

    def __init__(self):
        self._data = {}

    def get(self, sheet, sheet_name: str, header_row: int):
        """Return cached (rows_data, first_data_row, last_col) or bulk-read and cache."""
        if sheet_name not in self._data:
            self._data[sheet_name] = self._bulk_read(sheet, sheet_name, header_row)
        return self._data[sheet_name]

    def invalidate(self, sheet_name: str):
        """Remove cached data (call after INSERT or DELETE)."""
        self._data.pop(sheet_name, None)

    @staticmethod
    def _bulk_read(sheet, sheet_name: str, header_row: int):
        """Read all data rows in one COM call."""
        t0 = time.time()
        last_row = sheet.used_range.last_cell.row
        last_col = sheet.used_range.last_cell.column
        first_data_row = header_row + 1

        if first_data_row > last_row:
            logger.debug("Bulk-read sheet '%s': 0 rows (empty)", sheet_name)
            return [], first_data_row, last_col

        data = sheet.range((first_data_row, 1), (last_row, last_col)).value
        # Single row: xlwings returns a flat list; normalize to list-of-lists
        if first_data_row == last_row:
            data = [data] if isinstance(data, list) else [[data]]

        elapsed = time.time() - t0
        logger.debug(
            "Bulk-read sheet '%s': %d rows x %d cols in %.3fs",
            sheet_name, len(data), last_col, elapsed,
        )
        return data, first_data_row, last_col


def get_processing_state() -> dict:
    """Return a copy of the current processing state."""
    return dict(_processing_state)


def _reset_state(total: int):
    """Reset processing state for a new run."""
    _processing_state.update({
        "status": "processing",
        "total": total,
        "processed": 0,
        "success": 0,
        "errors": 0,
        "details": [],
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
    })


def _build_column_index(sheet, header_row: int, column_mapping: dict) -> dict:
    """Build {db_column: col_number} from the header row.

    Args:
        sheet: xlwings Sheet object
        header_row: 1-indexed row number where headers are
        column_mapping: {db_column_name: excel_column_name}

    Returns:
        {db_column_name: col_number (1-indexed)}
    """
    last_col = sheet.used_range.last_cell.column
    headers = sheet.range((header_row, 1), (header_row, last_col)).value
    if not isinstance(headers, list):
        headers = [headers]

    # Strip whitespace from headers
    headers = [str(h).strip() if h is not None else "" for h in headers]
    # Build lowercase lookup for case-insensitive matching
    headers_lower = [h.lower() for h in headers]

    col_index = {}
    for db_col, excel_col in column_mapping.items():
        try:
            idx = headers_lower.index(excel_col.lower())
            col_index[db_col] = idx + 1  # 1-indexed
        except ValueError:
            raise ValueError(
                f"Column '{excel_col}' not found in sheet header row {header_row}. "
                f"Available: {headers}"
            )

    logger.debug(
        "Built column index for sheet '%s' (header_row=%d): %d headers found, %d columns mapped",
        sheet.name, header_row, len(headers), len(col_index),
    )
    return col_index


def _find_matching_rows(
    sheet, header_row: int, col_index: dict,
    pk_fields: list, pk_data: dict,
    sheet_data: list = None, first_data_row: int = None,
) -> list:
    """Find rows matching all pk_fields.

    Returns list of 1-indexed row numbers.

    When sheet_data/first_data_row are provided, matches against
    the in-memory list (no COM calls). Falls back to cell-by-cell
    reads otherwise.
    """
    logger.debug("Searching for rows matching pk_fields=%s, pk_data=%s", pk_fields, pk_data)

    if sheet_data is not None and first_data_row is not None:
        # Fast path: iterate in-memory data
        matching = []
        for i, row_data in enumerate(sheet_data):
            row_num = first_data_row + i
            match = True
            for pk_field in pk_fields:
                col_idx = col_index[pk_field] - 1  # 0-indexed for list access
                cell_val = row_data[col_idx] if col_idx < len(row_data) else None
                expected = pk_data.get(pk_field)
                if isinstance(cell_val, float) and isinstance(expected, int):
                    cell_val = int(cell_val)
                elif isinstance(cell_val, float) and isinstance(expected, str):
                    try:
                        expected = float(expected)
                    except (ValueError, TypeError):
                        pass
                if str(cell_val).strip() != str(expected).strip():
                    match = False
                    break
            if match:
                matching.append(row_num)
        logger.debug(
            "Fast-path row search: scanned %d cached rows, found %d match(es)",
            len(sheet_data), len(matching),
        )
        return matching

    # Fallback: cell-by-cell COM calls (should not happen in normal flow)
    last_row = sheet.used_range.last_cell.row
    matching = []
    rows_scanned = 0

    for row in range(header_row + 1, last_row + 1):
        rows_scanned += 1
        match = True
        for pk_field in pk_fields:
            col_num = col_index[pk_field]
            cell_val = sheet.range((row, col_num)).value
            expected = pk_data.get(pk_field)
            if isinstance(cell_val, float) and isinstance(expected, int):
                cell_val = int(cell_val)
            elif isinstance(cell_val, float) and isinstance(expected, str):
                try:
                    expected = float(expected)
                except (ValueError, TypeError):
                    pass
            if str(cell_val).strip() != str(expected).strip():
                match = False
                break
        if match:
            matching.append(row)

    logger.debug(
        "Cell-by-cell row search: scanned %d rows via COM, found %d match(es)",
        rows_scanned, len(matching),
    )
    return matching


def _apply_excel_update(
    sheet, mapping: dict, col_index: dict,
    pk_data: dict, cambios: dict,
    sheet_cache: _SheetCache = None,
) -> dict:
    """Update exactly 1 matching row. Returns previous values."""
    sheet_name = mapping["sheet_name"]
    sheet_data, first_data_row, _last_col = (
        sheet_cache.get(sheet, sheet_name, mapping["header_row"])
        if sheet_cache else (None, None, None)
    )

    matching = _find_matching_rows(
        sheet, mapping["header_row"], col_index,
        mapping["pk_fields"], pk_data,
        sheet_data=sheet_data, first_data_row=first_data_row,
    )

    if len(matching) == 0:
        raise ValueError(f"No matching row found for pk: {pk_data}")
    if len(matching) > 1:
        raise ValueError(
            f"Multiple rows ({len(matching)}) match primary key {pk_data} — expected exactly 1"
        )

    row = matching[0]
    previous_values = {}

    # Read previous values from cached data if available
    row_data = None
    if sheet_data is not None and first_data_row is not None:
        row_idx = row - first_data_row
        if 0 <= row_idx < len(sheet_data):
            row_data = sheet_data[row_idx]

    for db_col, new_value in cambios.items():
        if db_col not in col_index:
            continue  # Skip fields not in mapping
        col_num = col_index[db_col]
        if row_data is not None:
            old_value = row_data[col_num - 1] if (col_num - 1) < len(row_data) else None
        else:
            old_value = sheet.range((row, col_num)).value
        previous_values[db_col] = old_value
        sheet.range((row, col_num)).value = new_value
        logger.debug(
            "Updated cell (%d, %d): '%s' -> '%s'", row, col_num, old_value, new_value
        )

    return previous_values


def _apply_excel_insert(
    sheet, mapping: dict, col_index: dict,
    pk_data: dict, cambios: dict,
    db: Session, txn: TransaccionJson,
    sheet_cache: _SheetCache = None,
) -> dict | None:
    """Insert a new row. Returns None (no previous values for insert).

    Handles:
    - insert_blocked: sets estado_excel=NO_APLICA and skips
    - insert_pk_reconcile: reconciles PK with Excel max value
    """
    entidad = mapping.get("_entidad", txn.entidad)
    sheet_name = mapping["sheet_name"]

    # Check if INSERT is blocked for this entity
    if mapping.get("insert_blocked", False):
        logger.info(
            "INSERT blocked for %s — Excel is master. Setting NO_APLICA.", entidad
        )
        txn.estado_excel = "NO_APLICA"
        txn.fecha_ejecucion_excel = datetime.now()
        db.commit()
        return "SKIPPED"

    # Get cached sheet data
    sheet_data, first_data_row, _last_col = (
        sheet_cache.get(sheet, sheet_name, mapping["header_row"])
        if sheet_cache else (None, None, None)
    )

    # Handle PK reconciliation (e.g., hechos id_hecho)
    reconcile_config = mapping.get("insert_pk_reconcile")
    if reconcile_config:
        pk_field = reconcile_config["pk_field"]
        old_id = pk_data.get(pk_field)

        if old_id is not None:
            # Read all PK values to find max — from cache or cell-by-cell
            pk_col = col_index[pk_field]
            excel_ids = []

            if sheet_data is not None:
                pk_col_idx = pk_col - 1  # 0-indexed for list access
                for row_data in sheet_data:
                    val = row_data[pk_col_idx] if pk_col_idx < len(row_data) else None
                    if val is not None:
                        try:
                            excel_ids.append(int(float(val)))
                        except (ValueError, TypeError):
                            pass
            else:
                last_row = sheet.used_range.last_cell.row
                header_row = mapping["header_row"]
                for row in range(header_row + 1, last_row + 1):
                    val = sheet.range((row, pk_col)).value
                    if val is not None:
                        try:
                            excel_ids.append(int(float(val)))
                        except (ValueError, TypeError):
                            pass

            excel_max = max(excel_ids) if excel_ids else 0
            old_id_int = int(float(old_id))

            if excel_max >= old_id_int:
                new_id = excel_max + 1
                logger.info(
                    "Reconciled %s %s: %d -> %d (Excel max was %d)",
                    entidad, pk_field, old_id_int, new_id, excel_max
                )

                # Update DB record
                from app.table_registry import TABLE_MODELS
                model = TABLE_MODELS.get(entidad)
                if model:
                    col_attr = getattr(model, pk_field, None)
                    if col_attr is not None:
                        record = db.query(model).filter(col_attr == old_id_int).first()
                        if record:
                            setattr(record, pk_field, new_id)

                # Update pk_data for Excel insert
                pk_data[pk_field] = new_id
                if cambios and pk_field in cambios:
                    cambios[pk_field] = new_id

                # Update clave_primaria in transacciones_json
                try:
                    cp = json.loads(txn.clave_primaria)
                    cp[pk_field] = new_id
                    txn.clave_primaria = json.dumps(cp)
                except (json.JSONDecodeError, TypeError):
                    pass

                # Update clave_primaria_excel with reconciled ID
                try:
                    if txn.clave_primaria_excel:
                        cp_excel = json.loads(txn.clave_primaria_excel)
                    else:
                        cp_excel = {}
                    cp_excel[pk_field] = new_id
                    txn.clave_primaria_excel = json.dumps(cp_excel)
                except (json.JSONDecodeError, TypeError):
                    pass

                db.flush()

    # Verify no existing row matches the PK
    matching = _find_matching_rows(
        sheet, mapping["header_row"], col_index,
        mapping["pk_fields"], pk_data,
        sheet_data=sheet_data, first_data_row=first_data_row,
    )
    if matching:
        raise ValueError(
            f"Record already exists with primary key {pk_data} "
            f"({len(matching)} row(s) found)"
        )

    # Find insert position (after last used row)
    last_row = sheet.used_range.last_cell.row
    new_row = last_row + 1

    # Merge pk + cambios for all fields to write
    all_data = {**pk_data, **(cambios or {})}

    for db_col, value in all_data.items():
        if db_col not in col_index:
            continue
        col_num = col_index[db_col]
        sheet.range((new_row, col_num)).value = value
        logger.debug("Inserted cell (%d, %d): '%s'", new_row, col_num, value)

    # Invalidate cache — new row added
    if sheet_cache:
        sheet_cache.invalidate(sheet_name)

    return None


def _apply_excel_delete(
    sheet, mapping: dict, col_index: dict, pk_data: dict,
    sheet_cache: _SheetCache = None,
) -> dict:
    """Delete exactly 1 matching row. Returns previous values."""
    sheet_name = mapping["sheet_name"]
    sheet_data, first_data_row, _last_col = (
        sheet_cache.get(sheet, sheet_name, mapping["header_row"])
        if sheet_cache else (None, None, None)
    )

    matching = _find_matching_rows(
        sheet, mapping["header_row"], col_index,
        mapping["pk_fields"], pk_data,
        sheet_data=sheet_data, first_data_row=first_data_row,
    )

    if len(matching) == 0:
        raise ValueError(f"No matching row found for pk: {pk_data}")
    if len(matching) > 1:
        raise ValueError(
            f"Multiple rows ({len(matching)}) match primary key {pk_data} — expected exactly 1"
        )

    row = matching[0]
    previous_values = {}

    # Read all current values from cached data if available
    row_data = None
    if sheet_data is not None and first_data_row is not None:
        row_idx = row - first_data_row
        if 0 <= row_idx < len(sheet_data):
            row_data = sheet_data[row_idx]

    for db_col, col_num in col_index.items():
        if row_data is not None:
            previous_values[db_col] = row_data[col_num - 1] if (col_num - 1) < len(row_data) else None
        else:
            previous_values[db_col] = sheet.range((row, col_num)).value

    # Delete the row
    sheet.range(f"{row}:{row}").delete()
    logger.debug("Deleted row %d", row)

    # Invalidate cache — row removed, positions shifted
    if sheet_cache:
        sheet_cache.invalidate(sheet_name)

    return previous_values


def _find_open_workbook(file_path: Path):
    """Check running Excel instances for an already-open workbook matching file_path.

    Uses raw COM API (app.api.Workbooks) to enumerate open workbooks, bypassing
    xlwings' SharePoint/OneDrive path resolution which fails for synced files.

    Returns:
        (workbook, True) if the workbook is found open in an existing Excel instance.
        (None, False) if the workbook is not currently open or if detection fails.
    """
    target_name = file_path.name.lower()
    try:
        apps = xw.apps
        logger.debug(
            "Checking %d running Excel instance(s) for open workbook: %s",
            len(apps), file_path.name,
        )
        for app in apps:
            try:
                # Use raw COM API to enumerate — bypasses xlwings SharePoint issues
                com_app = app.api
                wb_count = com_app.Workbooks.Count
                logger.debug(
                    "Excel instance pid=%s has %d open workbook(s)",
                    app.pid, wb_count,
                )
                for i in range(1, wb_count + 1):
                    try:
                        com_wb = com_app.Workbooks(i)
                        wb_name = com_wb.Name
                        logger.debug(
                            "  Workbook[%d]: Name='%s', FullName='%s'",
                            i, wb_name, com_wb.FullName,
                        )
                        if wb_name.lower() == target_name:
                            # Found it — get the xlwings Book wrapper via index
                            wb = app.books[i - 1]  # xlwings uses 0-based index
                            logger.debug(
                                "Found workbook '%s' in Excel instance pid=%s",
                                wb_name, app.pid,
                            )
                            return wb, True
                    except Exception as e:
                        logger.debug("  Workbook[%d]: error reading — %s", i, e)
                        continue
            except Exception as e:
                logger.debug(
                    "Error inspecting Excel instance pid=%s: %s", app.pid, e,
                )
                continue

        logger.debug("Workbook not found in any running Excel instance: %s", file_path.name)
        return None, False
    except Exception as e:
        logger.debug(
            "Could not enumerate running Excel instances (COM error: %s). "
            "Will open workbook normally.", e,
        )
        return None, False


def process_pending_excel_transactions(db_session_factory, excel_source_dir: str):
    """Process all pending Excel transactions.

    Uses xlwings to open Excel workbooks via COM and apply changes.
    Each transaction is processed independently — one failure doesn't
    prevent others from succeeding.

    Args:
        db_session_factory: SQLAlchemy SessionLocal class for creating sessions
        excel_source_dir: Path to the directory containing Excel source files
    """
    db = db_session_factory()
    excel_app = None  # Only created if needed (lazy)
    t_total_start = time.time()

    try:
        # Fetch all pending Excel transactions
        pending = (
            db.query(TransaccionJson)
            .filter(
                TransaccionJson.estado_db == "EJECUTADO",
                TransaccionJson.estado_excel == "PENDIENTE",
            )
            .order_by(TransaccionJson.id)
            .all()
        )

        if not pending:
            _processing_state.update({"status": "completed", "completed_at": datetime.now().isoformat()})
            logger.info("No pending Excel transactions to process")
            return

        _reset_state(len(pending))
        logger.info("Starting Excel write-back: %d pending transactions", len(pending))

        # Group by excel_file
        groups = defaultdict(list)
        for txn in pending:
            mapping = EXCEL_MAPPING.get(txn.entidad)
            if mapping:
                groups[mapping["excel_file"]].append(txn)
            else:
                # Entity not configured
                txn.estado_excel = "ERROR"
                txn.fecha_ejecucion_excel = datetime.now()
                txn.error_detalle = f"Entity '{txn.entidad}' not configured in EXCEL_MAPPING"
                db.commit()
                _processing_state["processed"] += 1
                _processing_state["errors"] += 1
                _processing_state["details"].append({
                    "id": txn.id,
                    "status": "ERROR",
                    "entidad": txn.entidad,
                    "tipo_operacion": txn.tipo_operacion,
                    "error": txn.error_detalle,
                })
                logger.error("Entity '%s' not in EXCEL_MAPPING (txn id=%d)", txn.entidad, txn.id)

        source_dir = Path(excel_source_dir).resolve()

        logger.debug(
            "Grouped transactions into %d workbook file(s): %s",
            len(groups),
            {f: len(txns) for f, txns in groups.items()},
        )

        for excel_file, txns in groups.items():
            file_path = source_dir / excel_file
            wb = None
            was_pre_opened = False
            t_file_start = time.time()

            try:
                # Try to reuse an already-open workbook first
                wb, was_pre_opened = _find_open_workbook(file_path)

                if wb:
                    logger.info("Workbook already open, reusing: %s", file_path)
                else:
                    # Need to open — create our own Excel app if not done yet
                    if excel_app is None:
                        excel_app = xw.App(visible=False)
                        logger.info("Started xlwings Excel application")
                        logger.debug("xlwings App instance pid=%s", excel_app.pid)

                    logger.info("Opening workbook: %s", file_path)
                    t_open = time.time()
                    wb = excel_app.books.open(str(file_path))
                    logger.debug("Opened workbook in %.3fs: %s", time.time() - t_open, file_path)

                sheet_cache = _SheetCache()

                for txn in txns:
                    _process_single_transaction(db, txn, wb, sheet_cache)

                t_save = time.time()
                wb.save()
                logger.info("Saved workbook: %s", file_path)
                logger.debug("Workbook save took %.3fs: %s", time.time() - t_save, file_path)

            except Exception as e:
                logger.error("Error with workbook %s: %s", excel_file, e)
                # Mark remaining unprocessed txns as ERROR
                for txn in txns:
                    if txn.estado_excel == "PENDIENTE":
                        txn.estado_excel = "ERROR"
                        txn.fecha_ejecucion_excel = datetime.now()
                        txn.error_detalle = f"Workbook error: {e}"
                        _processing_state["processed"] += 1
                        _processing_state["errors"] += 1
                        _processing_state["details"].append({
                            "id": txn.id,
                            "status": "ERROR",
                            "entidad": txn.entidad,
                            "tipo_operacion": txn.tipo_operacion,
                            "error": str(e),
                        })
                db.commit()
            finally:
                if wb and not was_pre_opened:
                    try:
                        wb.close()
                        logger.debug("Closed workbook: %s", file_path)
                    except Exception:
                        pass
                elif wb and was_pre_opened:
                    logger.debug("Left workbook open (pre-opened by user): %s", file_path)

                logger.debug(
                    "Workbook %s processed in %.3fs (%d transactions)",
                    excel_file, time.time() - t_file_start, len(txns),
                )

        _processing_state.update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
        })
        logger.info(
            "Excel write-back completed: %d processed, %d success, %d errors",
            _processing_state["processed"],
            _processing_state["success"],
            _processing_state["errors"],
        )

    except Exception as e:
        logger.error("Excel write-back fatal error: %s", e)
        _processing_state.update({
            "status": "completed",
            "completed_at": datetime.now().isoformat(),
        })
    finally:
        if excel_app:
            try:
                excel_app.quit()
                logger.info("Closed xlwings Excel application")
            except Exception:
                pass
        db.close()
        logger.debug("Total Excel write-back elapsed: %.3fs", time.time() - t_total_start)


def _process_single_transaction(db: Session, txn: TransaccionJson, wb, sheet_cache: _SheetCache = None):
    """Process a single transaction against an open workbook."""
    mapping = EXCEL_MAPPING.get(txn.entidad)
    if not mapping:
        return

    t_txn_start = time.time()
    try:
        # Add _entidad for internal reference
        mapping_with_meta = {**mapping, "_entidad": txn.entidad}

        logger.debug(
            "Accessing sheet '%s' for txn id=%d (%s %s)",
            mapping["sheet_name"], txn.id, txn.tipo_operacion, txn.entidad,
        )
        sheet = wb.sheets[mapping["sheet_name"]]
        col_index = _build_column_index(sheet, mapping["header_row"], mapping["column_mapping"])

        # Prefer clave_primaria_excel for Excel row matching (backward-compat: fallback to clave_primaria)
        if txn.clave_primaria_excel:
            pk_data = json.loads(txn.clave_primaria_excel)
        else:
            pk_data = json.loads(txn.clave_primaria)
        cambios = json.loads(txn.cambios) if txn.cambios else {}

        previous_values = None

        logger.info(
            "Processing txn id=%d: %s %s pk=%s",
            txn.id, txn.tipo_operacion, txn.entidad, pk_data,
        )

        if txn.tipo_operacion == "UPDATE":
            previous_values = _apply_excel_update(
                sheet, mapping, col_index, pk_data, cambios,
                sheet_cache=sheet_cache,
            )

        elif txn.tipo_operacion == "INSERT":
            result = _apply_excel_insert(
                sheet, mapping_with_meta, col_index, pk_data, cambios, db, txn,
                sheet_cache=sheet_cache,
            )
            if result == "SKIPPED":
                # Already handled (insert_blocked)
                _processing_state["processed"] += 1
                _processing_state["success"] += 1
                _processing_state["details"].append({
                    "id": txn.id,
                    "status": "NO_APLICA",
                    "entidad": txn.entidad,
                    "tipo_operacion": txn.tipo_operacion,
                })
                return

        elif txn.tipo_operacion == "DELETE":
            previous_values = _apply_excel_delete(
                sheet, mapping, col_index, pk_data,
                sheet_cache=sheet_cache,
            )

        # Success
        txn.estado_excel = "EJECUTADO"
        txn.fecha_ejecucion_excel = datetime.now()
        txn.error_detalle = None
        if previous_values:
            txn.valores_previos_excel = json.dumps(previous_values, default=str)
        db.commit()

        _processing_state["processed"] += 1
        _processing_state["success"] += 1
        _processing_state["details"].append({
            "id": txn.id,
            "status": "EJECUTADO",
            "entidad": txn.entidad,
            "tipo_operacion": txn.tipo_operacion,
        })
        logger.info("txn id=%d: SUCCESS (%.3fs)", txn.id, time.time() - t_txn_start)

    except Exception as e:
        db.rollback()
        logger.error("txn id=%d: ERROR — %s", txn.id, e)

        # Re-fetch txn in case session state is stale
        txn = db.query(TransaccionJson).get(txn.id)
        if txn:
            txn.estado_excel = "ERROR"
            txn.fecha_ejecucion_excel = datetime.now()
            txn.error_detalle = str(e)
            db.commit()

        _processing_state["processed"] += 1
        _processing_state["errors"] += 1
        _processing_state["details"].append({
            "id": txn.id if txn else 0,
            "status": "ERROR",
            "entidad": txn.entidad if txn else "unknown",
            "tipo_operacion": txn.tipo_operacion if txn else "unknown",
            "error": str(e),
        })
