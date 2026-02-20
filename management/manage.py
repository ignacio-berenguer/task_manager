"""
Main entry point for task manager migration tool.
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
from src.migrate import TareasMigrationEngine


def main():
    # Setup centralized logging before anything else
    logger = setup_logging()

    parser = argparse.ArgumentParser(
        description='Task Manager Migration Tool - Excel to SQLite',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Initialize new database
  python manage.py init

  # Run full migration
  python manage.py migrate

  # Recreate all tables (drop + create from schema)
  python manage.py recreate_tables

  # Run complete process (recreate + migrate)
  python manage.py complete_process

  # Use custom database path
  python manage.py migrate --db custom.db
        """
    )

    parser.add_argument(
        'command',
        choices=['init', 'recreate_tables', 'migrate', 'complete_process'],
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

    args = parser.parse_args()

    # Add separator and session info to log file
    logger.info("=" * 60)
    logger.info(f"NEW EXECUTION - {datetime.now().strftime(LOG_DATE_FORMAT)}")
    logger.info("=" * 60)
    logger.info("Task Manager Migration Tool")
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

            engine = TareasMigrationEngine(args.db, args.excel_dir)
            engine.migrate_all()

            logger.info("Migration completed successfully")

        elif args.command == 'complete_process':
            logger.info(f"Starting complete process pipeline: {args.db}")

            # Check if Excel directory exists
            if not Path(args.excel_dir).exists():
                logger.error(f"Excel directory not found: {args.excel_dir}")
                sys.exit(1)

            # Step 1: Recreate tables
            logger.info("Step 1/2: Recreating tables...")
            conn = recreate_tables(args.db)
            if conn:
                conn.close()
                logger.info("Tables recreated successfully")
            else:
                logger.error("Recreate tables failed")
                sys.exit(1)

            # Step 2: Migrate data
            logger.info("Step 2/2: Migrating data from Excel...")
            engine = TareasMigrationEngine(args.db, args.excel_dir)
            engine.migrate_all()

            # Summary
            logger.info("=" * 60)
            logger.info("Complete process pipeline finished!")
            logger.info(f"  Database: {args.db}")
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
