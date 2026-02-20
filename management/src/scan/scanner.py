"""Document scanner — discovers documents from configured folders and inserts into DB."""
import json
import logging
import os
import sqlite3
import fnmatch
import urllib.parse
from datetime import datetime
from pathlib import Path

from ..config import settings
from .portfolio_patterns import extract_portfolio_id

logger = logging.getLogger("portfolio_scan")


def _convert_pattern(pattern: str) -> str:
    """
    Convert user-friendly patterns to fnmatch patterns.

    'SM2nn*' → 'SM2??*' (nn = two character wildcards)
    """
    return pattern.replace("nn", "??")


def _get_most_recent_file(files: list[Path]) -> Path:
    """Return the most recently modified file from a list."""
    return max(files, key=lambda f: f.stat().st_mtime)


def _build_enlace(base_url: str, mode: str, subfolder_name: str | None, filename: str) -> str:
    """Build the enlace_documento URL with URL-encoded path components."""
    if mode == "subfolder" and subfolder_name:
        return f"{base_url}/{urllib.parse.quote(subfolder_name)}/{urllib.parse.quote(filename)}"
    else:
        return f"{base_url}/{urllib.parse.quote(filename)}"


def scan_documents(db_path: str) -> None:
    """
    Main entry point: scan configured folders and insert new documents into DB.
    """
    config_json = settings.DOCUMENT_SCAN_CONFIG
    try:
        configs = json.loads(config_json)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse DOCUMENT_SCAN_CONFIG: {e}")
        return

    if not configs:
        logger.warning("DOCUMENT_SCAN_CONFIG is empty — nothing to scan")
        return

    conn = sqlite3.connect(db_path)
    try:
        # Load existing nombre_fichero set for dedup
        cursor = conn.execute("SELECT nombre_fichero FROM documentos")
        existing_filenames = {row[0] for row in cursor.fetchall()}
        logger.info(f"Loaded {len(existing_filenames)} existing document records")

        # Load valid portfolio_ids from iniciativas
        cursor = conn.execute("SELECT portfolio_id FROM iniciativas")
        valid_portfolio_ids = {row[0] for row in cursor.fetchall()}
        logger.info(f"Loaded {len(valid_portfolio_ids)} valid portfolio IDs")

        total_scanned = 0
        total_inserted = 0
        total_skipped = 0

        for folder_config in configs:
            name = folder_config.get("name", "Unknown")
            folder_path = folder_config.get("path", "")
            mode = folder_config.get("mode", "subfolder")
            base_url = folder_config.get("base_url", "")
            type_configs = folder_config.get("types", [])

            logger.info(f"=== Scanning config: {name} ===")
            logger.info(f"  Path: {folder_path}")
            logger.info(f"  Mode: {mode}")

            if not os.path.isdir(folder_path):
                logger.warning(f"  Folder not found, skipping: {folder_path}")
                continue

            if mode == "subfolder":
                scanned, inserted, skipped = _scan_subfolder_mode(
                    conn, folder_path, base_url, type_configs,
                    existing_filenames, valid_portfolio_ids
                )
            elif mode == "flat":
                scanned, inserted, skipped = _scan_flat_mode(
                    conn, folder_path, base_url, type_configs,
                    existing_filenames, valid_portfolio_ids
                )
            else:
                logger.warning(f"  Unknown mode '{mode}', skipping")
                continue

            total_scanned += scanned
            total_inserted += inserted
            total_skipped += skipped
            logger.info(f"  Config '{name}' done: scanned={scanned}, inserted={inserted}, skipped={skipped}")

        conn.commit()
        logger.info("=" * 60)
        logger.info(f"Scan complete: total_scanned={total_scanned}, inserted={total_inserted}, skipped={total_skipped}")
        logger.info("=" * 60)

    finally:
        conn.close()


def _scan_subfolder_mode(
    conn: sqlite3.Connection,
    folder_path: str,
    base_url: str,
    type_configs: list[dict],
    existing_filenames: set[str],
    valid_portfolio_ids: set[str],
) -> tuple[int, int, int]:
    """Scan subfolders named as portfolio_ids, match files inside."""
    scanned = 0
    inserted = 0
    skipped = 0

    root = Path(folder_path)
    for subdir in sorted(root.iterdir()):
        if not subdir.is_dir():
            continue

        portfolio_id = extract_portfolio_id(subdir.name)
        if not portfolio_id:
            continue

        if portfolio_id not in valid_portfolio_ids:
            logger.warning(f"  Portfolio ID '{portfolio_id}' (from '{subdir.name}') not in iniciativas, skipping")
            continue

        logger.debug(f"  Scanning subfolder: {subdir.name} (portfolio_id={portfolio_id})")

        for type_cfg in type_configs:
            tipo = type_cfg.get("tipo", "")
            pattern = _convert_pattern(type_cfg.get("pattern", "*"))

            matching_files = [
                f for f in subdir.iterdir()
                if f.is_file() and fnmatch.fnmatch(f.name, pattern)
            ]
            scanned += len(matching_files)

            if not matching_files:
                continue

            # Keep only most recently modified
            best_file = _get_most_recent_file(matching_files)
            if len(matching_files) > 1:
                logger.debug(f"    Multiple matches for {tipo} in {subdir.name}, keeping: {best_file.name}")

            if best_file.name in existing_filenames:
                logger.debug(f"    Skipping (already in documentos table): {best_file.name} ({tipo}) for {portfolio_id}")
                skipped += 1
                continue

            enlace = _build_enlace(base_url, "subfolder", subdir.name, best_file.name)
            _insert_document(conn, best_file.name, portfolio_id, tipo, enlace, str(best_file))
            existing_filenames.add(best_file.name)
            inserted += 1
            logger.info(f"    INSERT: {best_file.name} ({tipo}) for {portfolio_id}")

    return scanned, inserted, skipped


def _scan_flat_mode(
    conn: sqlite3.Connection,
    folder_path: str,
    base_url: str,
    type_configs: list[dict],
    existing_filenames: set[str],
    valid_portfolio_ids: set[str],
) -> tuple[int, int, int]:
    """Scan files directly in folder, extract portfolio_id from filenames."""
    scanned = 0
    inserted = 0
    skipped = 0

    root = Path(folder_path)
    all_files = [f for f in root.iterdir() if f.is_file()]

    for type_cfg in type_configs:
        tipo = type_cfg.get("tipo", "")
        pattern = _convert_pattern(type_cfg.get("pattern", "*"))

        # Group matching files by portfolio_id
        groups: dict[str, list[Path]] = {}
        for f in all_files:
            if not fnmatch.fnmatch(f.name, pattern):
                continue
            scanned += 1
            pid = extract_portfolio_id(f.name)
            if not pid:
                logger.debug(f"    No portfolio_id in filename: {f.name}")
                continue
            groups.setdefault(pid, []).append(f)

        for pid, files in groups.items():
            if pid not in valid_portfolio_ids:
                logger.warning(f"  Portfolio ID '{pid}' not in iniciativas, skipping {len(files)} files")
                continue

            # Keep only most recently modified
            best_file = _get_most_recent_file(files)
            if len(files) > 1:
                logger.debug(f"    Multiple matches for {tipo}/{pid}, keeping: {best_file.name}")

            if best_file.name in existing_filenames:
                logger.debug(f"    Skipping (already in documentos table): {best_file.name} ({tipo}) for {pid}")
                skipped += 1
                continue

            enlace = _build_enlace(base_url, "flat", None, best_file.name)
            _insert_document(conn, best_file.name, pid, tipo, enlace, str(best_file))
            existing_filenames.add(best_file.name)
            inserted += 1
            logger.info(f"    INSERT: {best_file.name} ({tipo}) for {pid}")

    return scanned, inserted, skipped


def _insert_document(
    conn: sqlite3.Connection,
    nombre_fichero: str,
    portfolio_id: str,
    tipo_documento: str,
    enlace_documento: str,
    ruta_documento: str,
) -> None:
    """Insert a new document record into the documentos table."""
    now = datetime.now().isoformat()
    conn.execute(
        """INSERT INTO documentos
           (nombre_fichero, portfolio_id, tipo_documento, enlace_documento,
            estado_proceso_documento, ruta_documento, fecha_creacion, fecha_actualizacion)
           VALUES (?, ?, ?, ?, 'Pendiente', ?, ?, ?)""",
        (nombre_fichero, portfolio_id, tipo_documento, enlace_documento,
         ruta_documento, now, now),
    )
