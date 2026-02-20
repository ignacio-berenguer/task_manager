"""
Main entry point for portfolio migration tool.
"""

import argparse
import logging
import sys
import warnings
from pathlib import Path
from datetime import datetime

# Suppress openpyxl Data Validation warning
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

from src.core.logging_config import setup_logging, LOG_LEVEL, LOG_FILE, LOG_DATE_FORMAT
from src.config import settings as config
from src.config.settings import validate_config
from src.init import create_database, recreate_tables
from src.migrate import migrate_all
from src.validate import validate_all


def main():
    # Setup centralized logging before anything else
    logger = setup_logging()

    parser = argparse.ArgumentParser(
        description='Portfolio Migration Tool - Excel to SQLite',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Initialize new database
  python manage.py init

  # Run full migration
  python manage.py migrate

  # Validate migrated data
  python manage.py validate

  # Calculate datos_relevantes table
  python manage.py calculate_datos_relevantes

  # Export datos_relevantes to Excel
  python manage.py export_datos_relevantes

  # Recreate all tables (drop + create from schema)
  python manage.py recreate_tables

  # Run complete process (recreate + migrate + calculate + export + scan)
  python manage.py complete_process

  # Use custom database path
  python manage.py migrate --db custom_portfolio.db

  # Summarize pending documents using LLM
  python manage.py summarize_documentos

  # Summarize only specific portfolios
  python manage.py summarize_documentos --portfolio-ids SPA_25_11,SPA_25_12

  # Reprocess already-processed documents
  python manage.py summarize_documentos --reprocess

  # Combine filters
  python manage.py summarize_documentos --portfolio-ids SPA_25_11 --reprocess

  # Print colored JSON summaries to console
  python manage.py summarize_documentos --json-output-to-console
        """
    )

    parser.add_argument(
        'command',
        choices=['init', 'recreate_tables', 'migrate', 'validate',
                 'calculate_datos_relevantes', 'export_datos_relevantes',
                 'complete_process', 'scan_documents',
                 'summarize_documentos'],
        help='Command to execute'
    )

    parser.add_argument(
        '--db',
        default=config.DATABASE_PATH,
        help=f'Path to SQLite database (default: {config.DATABASE_PATH})'
    )

    parser.add_argument(
        '--excel-dir',
        default=config.EXCEL_SOURCE_DIR,
        help=f'Directory containing Excel files (default: {config.EXCEL_SOURCE_DIR})'
    )

    parser.add_argument(
        '--portfolio-ids',
        default=None,
        help='Comma-separated list of portfolio IDs to process (default: all pending)'
    )

    parser.add_argument(
        '--reprocess',
        action='store_true',
        default=False,
        help='Reprocess documents regardless of current estado (not just Pendiente)'
    )

    parser.add_argument(
        '--json-output-to-console',
        action='store_true',
        default=False,
        help='Print each document summary as colored JSON to the console'
    )

    args = parser.parse_args()

    # Add separator and session info to log file
    logger.info("=" * 60)
    logger.info(f"NEW EXECUTION - {datetime.now().strftime(LOG_DATE_FORMAT)}")
    logger.info("=" * 60)
    logger.info("Portfolio Migration Tool")
    logger.info(f"Command: {args.command}")
    logger.info(f"Database: {args.db}")
    logger.info(f"Log file: {LOG_FILE}")
    logger.info(f"Log level: {logging.getLevelName(LOG_LEVEL)}")
    logger.info("=" * 60)

    # Validate configuration before executing any command
    validate_config(args.command, db_path=args.db, excel_dir=args.excel_dir)

    try:
        if args.command == 'init':
            logger.info(f"Starting database initialization: {args.db}")

            conn = create_database(args.db)

            if conn:
                conn.close()
                logger.info(f"Database initialized successfully: {args.db}")
            else:
                logger.warning("Database initialization cancelled by user")
                sys.exit(1)

        elif args.command == 'recreate_tables':
            logger.info(f"Starting recreate tables: {args.db}")

            conn = recreate_tables(args.db)
            if conn:
                conn.close()
                logger.info(f"Tables recreated successfully: {args.db}")
            else:
                logger.error("Recreate tables failed")
                sys.exit(1)

        elif args.command == 'migrate':
            logger.info(f"Starting migration: {args.excel_dir} -> {args.db}")
            logger.debug(f"Excel directory: {args.excel_dir}")
            logger.debug(f"Database path: {args.db}")

            # Check if database exists
            if not Path(args.db).exists():
                logger.error(f"Database not found: {args.db}")
                logger.error("Run 'python manage.py init' first to create the database")
                sys.exit(1)

            # Check if Excel directory exists
            if not Path(args.excel_dir).exists():
                logger.error(f"Excel directory not found: {args.excel_dir}")
                sys.exit(1)

            logger.info(f"Excel directory verified: {args.excel_dir}")
            logger.info(f"Database verified: {args.db}")

            results = migrate_all(args.db, args.excel_dir)

            logger.info("Migration completed successfully")
            logger.info(f"Results: {results}")
            logger.info(f"Run 'python manage.py validate --db {args.db}' to validate the data")

        elif args.command == 'validate':
            logger.info(f"Starting validation: {args.db}")

            # Check if database exists
            if not Path(args.db).exists():
                logger.error(f"Database not found: {args.db}")
                sys.exit(1)

            logger.info(f"Database verified: {args.db}")
            validate_all(args.db)

            logger.info("Validation completed successfully")

        elif args.command == 'calculate_datos_relevantes':
            logger.info(f"Starting datos_relevantes calculation: {args.db}")

            # Check if database exists
            if not Path(args.db).exists():
                logger.error(f"Database not found: {args.db}")
                logger.error("Run 'python manage.py init' first to create the database")
                sys.exit(1)

            logger.info(f"Database verified: {args.db}")

            from src.calculate import main as calculate_main
            result = calculate_main(args.db)

            if result['validation']['total_mismatches'] == 0:
                logger.info("=" * 60)
                logger.info("SUCCESS: All calculated values match iniciativas table!")
                logger.info("=" * 60)
            else:
                logger.warning(f"Validation found {result['validation']['total_mismatches']} mismatches")

        elif args.command == 'export_datos_relevantes':
            logger.info(f"Starting datos_relevantes export: {args.db}")

            # Check if database exists
            if not Path(args.db).exists():
                logger.error(f"Database not found: {args.db}")
                logger.error("Run 'python manage.py init' and 'python manage.py migrate' first")
                sys.exit(1)

            logger.info(f"Database verified: {args.db}")

            from src.export import export_datos_relevantes
            result = export_datos_relevantes(args.db)

            logger.info("=" * 60)
            logger.info("Export complete!")
            logger.info(f"  Rows exported: {result['rows_exported']}")
            logger.info(f"  Columns exported: {result['columns_exported']}")
            logger.info(f"  Output file: {result['output_file']}")
            logger.info("=" * 60)

        elif args.command == 'complete_process':
            logger.info(f"Starting complete process pipeline: {args.db}")

            # Check if Excel directory exists
            if not Path(args.excel_dir).exists():
                logger.error(f"Excel directory not found: {args.excel_dir}")
                sys.exit(1)

            # Step 1: Recreate tables
            logger.info("Step 1/6: Recreating tables...")
            conn = recreate_tables(args.db)
            if conn:
                conn.close()
                logger.info("Tables recreated successfully")
            else:
                logger.error("Recreate tables failed")
                sys.exit(1)

            # Step 2: Migrate data (includes documentos + documentos_items)
            logger.info("Step 2/6: Migrating data from Excel...")
            results = migrate_all(args.db, args.excel_dir)
            logger.info(f"Migration completed: {results}")

            # Step 3: Calculate datos_relevantes
            logger.info("Step 3/6: Calculating datos_relevantes...")
            from src.calculate import main as calculate_main
            calc_result = calculate_main(args.db)
            if calc_result['validation']['total_mismatches'] > 0:
                logger.warning(f"Calculation validation found {calc_result['validation']['total_mismatches']} mismatches")

            # Step 4: Export datos_relevantes to Excel
            logger.info("Step 4/6: Exporting datos_relevantes to Excel...")
            from src.export import export_datos_relevantes, export_documentos_items
            export_result = export_datos_relevantes(args.db)

            # Step 5: Scan documents (add new documents from filesystem)
            logger.info("Step 5/6: Scanning documents...")
            from src.scan import scan_documents
            scan_documents(args.db)

            # Step 6: Export documentos and documentos_items
            logger.info("Step 6/6: Exporting documentos and documentos_items...")
            from src.summarize.excel_export import export_documentos
            doc_export_result = None
            items_export_result = None
            try:
                doc_export_result = export_documentos(args.db)
                logger.info(f"Documentos export: {doc_export_result['rows_exported']} rows")
            except (FileNotFoundError, ValueError) as e:
                logger.warning(f"Documentos export skipped: {e}")

            try:
                items_export_result = export_documentos_items(args.db)
                logger.info(f"Documentos items export: {items_export_result['rows_exported']} rows")
            except (FileNotFoundError, ValueError) as e:
                logger.warning(f"Documentos items export skipped: {e}")

            # Summary
            logger.info("=" * 60)
            logger.info("Complete process pipeline finished!")
            logger.info(f"  Database: {args.db}")
            logger.info("  --- Migration ---")
            for table_name, count in results.items():
                if count > 0:
                    logger.info(f"    {table_name}: {count} rows")
            logger.info("  --- Calculation ---")
            logger.info(f"    datos_relevantes: {calc_result['calculation']['rows_calculated']} rows")
            if calc_result['validation']['total_mismatches'] > 0:
                logger.info(f"    validation mismatches: {calc_result['validation']['total_mismatches']}")
            logger.info("  --- Export ---")
            logger.info(f"    datos_relevantes: {export_result['rows_exported']} rows -> {export_result['output_file']}")
            if doc_export_result:
                logger.info(f"    documentos: {doc_export_result['rows_exported']} rows -> {doc_export_result.get('output_file', 'N/A')}")
            if items_export_result:
                logger.info(f"    documentos_items: {items_export_result['rows_exported']} rows -> {items_export_result.get('output_file', 'N/A')}")
            logger.info("=" * 60)

        elif args.command == 'scan_documents':
            logger.info(f"Starting document scan: {args.db}")

            # Check if database exists
            if not Path(args.db).exists():
                logger.error(f"Database not found: {args.db}")
                logger.error("Run 'python manage.py init' first to create the database")
                sys.exit(1)

            logger.info(f"Database verified: {args.db}")

            from src.scan import scan_documents
            scan_documents(args.db)

            logger.info("Document scan completed successfully")

        elif args.command == 'summarize_documentos':
            logger.info(f"Starting document summarization: {args.db}")

            # Check if database exists
            if not Path(args.db).exists():
                logger.error(f"Database not found: {args.db}")
                logger.error("Run 'python manage.py init' first to create the database")
                sys.exit(1)

            logger.info(f"Database verified: {args.db}")

            # Parse portfolio IDs if provided
            portfolio_ids = None
            if args.portfolio_ids:
                portfolio_ids = [pid.strip() for pid in args.portfolio_ids.split(',')]
                logger.info(f"Filtering by portfolio IDs: {portfolio_ids}")

            if args.reprocess:
                logger.info("Reprocess mode: will process documents regardless of estado")

            from src.summarize import summarize_documentos
            result = summarize_documentos(
                args.db,
                portfolio_ids=portfolio_ids,
                reprocess=args.reprocess,
                json_output_to_console=args.json_output_to_console,
            )

            logger.info("=" * 60)
            logger.info("Document summarization complete!")
            logger.info(f"  Total processed: {result['total']}")
            logger.info(f"  Completado: {result['completado']}")
            logger.info(f"  Error: {result['error']}")
            logger.info(f"  Ignorado: {result['ignorado']}")
            logger.info(f"  Total tokens: input={result['total_tokens_input']}, output={result['total_tokens_output']}")
            if result.get('export'):
                logger.info(f"  Excel export: {result['export']['output_file']}")
            logger.info("=" * 60)

    except KeyboardInterrupt:
        logger.warning("Operation cancelled by user (Ctrl+C)")
        sys.exit(1)
    except (PermissionError, FileNotFoundError) as e:
        # Handle file access errors gracefully (no traceback)
        logger.error(str(e))
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        sys.exit(1)

    logger.info("Program completed successfully")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
