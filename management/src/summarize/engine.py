"""Orchestrator for LLM document summarization pipeline."""

import json
import logging
import re
import sqlite3
import time
from datetime import datetime
from pathlib import Path

from src.config import settings as config

from .document_reader import read_document, UnsupportedFormatError
from .llm_client import create_llm_client
from .prompts import SKIP_DOCUMENT_TYPES, get_prompt_for_type
from .excel_export import export_documentos

logger = logging.getLogger('portfolio_summarize')


def _migrate_check_constraint(conn: sqlite3.Connection) -> None:
    """
    Migrate documentos table CHECK constraint to include 'Error' and 'Ignorado'.

    SQLite doesn't support ALTER TABLE to modify CHECK constraints,
    so we recreate the table preserving all data.
    """
    # Check if migration is needed by inspecting the table DDL
    cursor = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='documentos'"
    )
    row = cursor.fetchone()
    if not row:
        logger.warning("documentos table not found — skipping migration")
        return

    table_sql = row[0] or ""
    if "'Error'" in table_sql and "'Ignorado'" in table_sql:
        logger.debug("CHECK constraint already supports 'Error'/'Ignorado' — no migration needed")
        return

    logger.info("Migrating documentos table CHECK constraint to support new states...")

    # Get existing columns to handle migration with or without token columns
    cursor2 = conn.execute("PRAGMA table_info(documentos)")
    existing_cols = [row[1] for row in cursor2.fetchall()]
    col_list = ", ".join(existing_cols)

    conn.executescript(f"""
        CREATE TABLE documentos_new (
            nombre_fichero TEXT PRIMARY KEY,
            portfolio_id TEXT NOT NULL,
            tipo_documento TEXT NOT NULL,
            enlace_documento TEXT,
            estado_proceso_documento TEXT NOT NULL DEFAULT 'Pendiente',
            resumen_documento TEXT,
            ruta_documento TEXT,
            tokens_input INTEGER,
            tokens_output INTEGER,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME,
            FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
            CHECK (estado_proceso_documento IN ('Pendiente', 'Completado', 'Error', 'Ignorado'))
        );

        INSERT INTO documentos_new ({col_list}) SELECT {col_list} FROM documentos;

        DROP TABLE documentos;

        ALTER TABLE documentos_new RENAME TO documentos;

        CREATE INDEX IF NOT EXISTS idx_documentos_portfolio ON documentos (portfolio_id);
        CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos (tipo_documento);
        CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos (estado_proceso_documento);
    """)
    conn.commit()
    logger.info("CHECK constraint migration completed successfully")


def _migrate_token_columns(conn: sqlite3.Connection) -> None:
    """
    Add tokens_input and tokens_output columns if they don't exist.

    SQLite supports ALTER TABLE ADD COLUMN, so no table recreation needed.
    """
    cursor = conn.execute("PRAGMA table_info(documentos)")
    columns = {row[1] for row in cursor.fetchall()}
    if 'tokens_input' not in columns:
        logger.info("Adding token tracking columns to documentos table...")
        conn.execute("ALTER TABLE documentos ADD COLUMN tokens_input INTEGER")
        conn.execute("ALTER TABLE documentos ADD COLUMN tokens_output INTEGER")
        conn.commit()
        logger.info("Token columns added successfully")
    else:
        logger.debug("Token columns already exist — no migration needed")


def _print_colored_json(json_str: str, label: str) -> None:
    """Print JSON to console with ANSI color highlighting."""
    # ANSI color codes
    RESET = '\033[0m'
    CYAN = '\033[36m'       # keys
    GREEN = '\033[32m'      # strings
    YELLOW = '\033[33m'     # numbers
    MAGENTA = '\033[35m'    # booleans / null
    WHITE = '\033[37m'      # structural chars
    BOLD = '\033[1m'
    DIM = '\033[2m'

    pretty = json.dumps(json.loads(json_str), indent=2, ensure_ascii=False)

    # Colorize: keys, strings, numbers, booleans, null
    # Process line by line to handle keys vs string values
    colored_lines = []
    for line in pretty.split('\n'):
        # Match key-value pairs: "key": value
        m = re.match(r'^(\s*)"(.+?)"(\s*:\s*)(.*)', line)
        if m:
            indent, key, colon, value = m.groups()
            colored_key = f'{indent}{CYAN}"{key}"{RESET}{DIM}{colon}{RESET}'
            colored_value = _colorize_value(value, GREEN, YELLOW, MAGENTA, RESET)
            colored_lines.append(colored_key + colored_value)
        else:
            # Standalone values (array items, brackets)
            colored_lines.append(_colorize_value(line, GREEN, YELLOW, MAGENTA, RESET))

    header = f'{BOLD}{WHITE}{"=" * 60}{RESET}'
    title = f'{BOLD}{CYAN}  {label}{RESET}'
    print(f'\n{header}\n{title}\n{header}')
    print('\n'.join(colored_lines))
    print(header)


def _colorize_value(text: str, green: str, yellow: str, magenta: str, reset: str) -> str:
    """Apply color to a JSON value string."""
    stripped = text.strip().rstrip(',')
    if stripped.startswith('"'):
        return re.sub(r'"([^"]*)"', f'{green}"\\1"{reset}', text)
    if stripped in ('true', 'false', 'null'):
        return text.replace(stripped, f'{magenta}{stripped}{reset}')
    if stripped in ('{', '}', '[', ']', ''):
        return text
    # Numbers
    if re.match(r'^[\s]*-?\d', stripped):
        return re.sub(r'(-?\d[\d.]*)', f'{yellow}\\1{reset}', text)
    return text


def summarize_documentos(
    db_path: str = None,
    portfolio_ids: list[str] | None = None,
    reprocess: bool = False,
    json_output_to_console: bool = False,
) -> dict:
    """
    Main entry point: process documents with LLM summarization.

    Flow:
    1. Query documentos (filtered by params)
    2. For each document: skip/read/summarize/update
    3. Export complete documentos table to Excel
    4. Return statistics

    Args:
        db_path: Path to SQLite database (uses config default if not specified)
        portfolio_ids: Optional list of portfolio IDs to filter by
        reprocess: If True, process all documents regardless of estado
        json_output_to_console: If True, print colored JSON summary to console per document

    Returns:
        dict with processing statistics
    """
    db_path = db_path or config.DATABASE_PATH

    # Suppress noisy httpcore/httpx DEBUG messages
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)

    # Validate LLM configuration
    if not config.ANTHROPIC_API_KEY:
        raise SystemExit(
            "ANTHROPIC_API_KEY is not configured in .env. "
            "Set it to your Anthropic API key to use the summarize_documentos command."
        )

    # Create LLM client
    llm = create_llm_client(
        provider=config.LLM_PROVIDER,
        api_key=config.ANTHROPIC_API_KEY,
        model=config.LLM_MODEL,
        max_tokens=config.LLM_MAX_TOKENS,
        temperature=config.LLM_TEMPERATURE,
    )

    # Connect to database
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Ensure schema supports new states and token columns
    _migrate_check_constraint(conn)
    _migrate_token_columns(conn)

    try:
        # Build query based on filters
        query = "SELECT * FROM documentos"
        params = []
        conditions = []

        if not reprocess:
            conditions.append("estado_proceso_documento = 'Pendiente'")

        if portfolio_ids:
            placeholders = ", ".join("?" for _ in portfolio_ids)
            conditions.append(f"portfolio_id IN ({placeholders})")
            params.extend(portfolio_ids)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        logger.debug(f"Query: {query} | Params: {params}")
        cursor = conn.execute(query, params)
        pending_docs = cursor.fetchall()

        total = len(pending_docs)
        filter_desc = []
        if portfolio_ids:
            filter_desc.append(f"portfolio_ids={portfolio_ids}")
        if reprocess:
            filter_desc.append("reprocess=True")
        filter_info = f" ({', '.join(filter_desc)})" if filter_desc else ""
        logger.info(f"Found {total} documents to process{filter_info}")

        if total == 0:
            logger.info("No documents to process")
            return {
                'total': 0, 'completado': 0, 'error': 0, 'ignorado': 0,
                'total_tokens_input': 0, 'total_tokens_output': 0,
                'export': None,
            }

        stats = {'completado': 0, 'error': 0, 'ignorado': 0}
        total_tokens_input = 0
        total_tokens_output = 0

        for idx, doc in enumerate(pending_docs, 1):
            nombre = doc['nombre_fichero']
            tipo = doc['tipo_documento']
            ruta = doc['ruta_documento']
            portfolio_id = doc['portfolio_id']

            logger.info(f"[{idx}/{total}] Processing: {nombre} (tipo={tipo}, portfolio={portfolio_id})")
            doc_start = time.time()

            try:
                # Check skip list
                if tipo in SKIP_DOCUMENT_TYPES:
                    _update_document(conn, nombre, 'Ignorado', None)
                    stats['ignorado'] += 1
                    logger.info(f"  -> Ignorado (tipo '{tipo}' is in skip list)")
                    continue

                # Read document
                try:
                    content = read_document(ruta)
                    logger.info(f"  Read {len(content)} chars from document")
                except FileNotFoundError as e:
                    _update_document_error(conn, nombre, str(e))
                    stats['error'] += 1
                    logger.warning(f"  -> Error: {e}")
                    continue
                except UnsupportedFormatError as e:
                    _update_document_error(conn, nombre, str(e))
                    stats['error'] += 1
                    logger.warning(f"  -> Error: {e}")
                    continue
                except Exception as e:
                    _update_document_error(conn, nombre, f"Read error: {e}")
                    stats['error'] += 1
                    logger.error(f"  -> Error reading document: {e}")
                    continue

                # Get prompt for document type
                prompt_template = get_prompt_for_type(tipo)

                # Prepend filename as metadata context for the LLM
                content_with_metadata = (
                    f"[Nombre del fichero: {nombre}]\n\n{content}"
                )

                # Call LLM
                try:
                    llm_result = llm.summarize(content_with_metadata, prompt_template.system_prompt)
                except Exception as e:
                    _update_document_error(conn, nombre, f"LLM error: {e}")
                    stats['error'] += 1
                    logger.error(f"  -> LLM error: {e}")
                    continue

                response_text = llm_result.text
                doc_tokens_in = llm_result.input_tokens
                doc_tokens_out = llm_result.output_tokens
                logger.info(f"  Tokens: input={doc_tokens_in}, output={doc_tokens_out}")

                # Validate JSON response
                try:
                    # Strip markdown code block markers if present
                    cleaned = response_text.strip()
                    if cleaned.startswith('```'):
                        # Remove opening ```json or ```
                        first_newline = cleaned.index('\n')
                        cleaned = cleaned[first_newline + 1:]
                    if cleaned.endswith('```'):
                        cleaned = cleaned[:-3].strip()

                    json.loads(cleaned)  # Validate it's valid JSON
                    resumen_json = cleaned
                except (json.JSONDecodeError, ValueError) as e:
                    _update_document_error(conn, nombre, f"Invalid JSON response: {e}")
                    stats['error'] += 1
                    logger.warning(f"  -> Invalid JSON from LLM: {e}")
                    continue

                # Success — update document with summary and token counts
                _update_document(conn, nombre, 'Completado', resumen_json,
                                 tokens_input=doc_tokens_in, tokens_output=doc_tokens_out)
                stats['completado'] += 1
                total_tokens_input += doc_tokens_in
                total_tokens_output += doc_tokens_out

                elapsed = time.time() - doc_start
                logger.info(f"  -> Completado ({elapsed:.1f}s)")
                logger.debug(f"  DB updated: nombre={nombre}, estado=Completado, "
                             f"summary_len={len(resumen_json)}")

                if json_output_to_console:
                    _print_colored_json(resumen_json, f"{nombre} ({tipo})")

            except Exception as e:
                # Broad catch — ensures the batch never stops on any error
                logger.error(f"  -> Unexpected error: {e}")
                try:
                    _update_document_error(conn, nombre, str(e))
                except Exception as db_err:
                    logger.error(f"  -> Failed to update error status in DB: {db_err}")
                stats['error'] += 1
                continue

        # Log summary
        logger.info("=" * 60)
        logger.info(f"Summarization complete: total={total}, "
                     f"completado={stats['completado']}, "
                     f"error={stats['error']}, "
                     f"ignorado={stats['ignorado']}")
        logger.info(f"Total tokens: input={total_tokens_input}, output={total_tokens_output}")
        logger.info("=" * 60)

        # Export to Excel
        export_result = None
        try:
            export_result = export_documentos(db_path)
        except Exception as e:
            logger.error(f"Excel export failed: {e}")

        return {
            'total': total,
            **stats,
            'total_tokens_input': total_tokens_input,
            'total_tokens_output': total_tokens_output,
            'export': export_result,
        }

    finally:
        conn.close()


def _update_document(conn: sqlite3.Connection, nombre_fichero: str,
                     estado: str, resumen: str | None,
                     tokens_input: int | None = None,
                     tokens_output: int | None = None) -> None:
    """Update a document's status, summary, and optionally token counts.

    Commits immediately so each document result is persisted as soon as it is processed,
    avoiding data loss if the batch is interrupted.
    """
    now = datetime.now().isoformat()
    conn.execute(
        """UPDATE documentos
           SET estado_proceso_documento = ?,
               resumen_documento = ?,
               tokens_input = ?,
               tokens_output = ?,
               fecha_actualizacion = ?
           WHERE nombre_fichero = ?""",
        (estado, resumen, tokens_input, tokens_output, now, nombre_fichero),
    )
    conn.commit()


def _update_document_error(conn: sqlite3.Connection, nombre_fichero: str,
                           error_message: str) -> None:
    """Update a document with error status and error details as JSON."""
    error_json = json.dumps({"error": error_message}, ensure_ascii=False)
    _update_document(conn, nombre_fichero, 'Error', error_json)
