"""
Database initialization module.
Creates tables and executes the schema on PostgreSQL.
"""

import psycopg2
import logging
from pathlib import Path

from src.config import settings as config

logger = logging.getLogger('task_manager_init')


def _get_connection():
    """Create a PostgreSQL connection using settings."""
    return psycopg2.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASSWORD,
        dbname=config.DB_NAME,
    )


def _get_tables(cursor) -> list[str]:
    """Get list of user tables in the public schema."""
    cursor.execute(
        "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    )
    return [row[0] for row in cursor.fetchall()]


def init_schema() -> None:
    """
    Initialize the database schema by executing schema.sql.

    Connects to the PostgreSQL database and executes the schema DDL.
    Uses CREATE TABLE IF NOT EXISTS so it is safe to run multiple times.
    """
    logger.info("=== Starting Database Initialization ===")
    logger.info(f"Database: {config.DB_NAME}@{config.DB_HOST}:{config.DB_PORT}")

    schema_path = Path(config.SCHEMA_PATH)
    if not schema_path.exists():
        logger.error(f"Schema file not found: {schema_path}")
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    logger.info(f"Loading schema from: {schema_path}")

    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    logger.debug(f"Schema file size: {len(schema_sql)} characters")

    try:
        conn = _get_connection()
        conn.autocommit = True
        cursor = conn.cursor()

        logger.info("Executing schema...")
        cursor.execute(schema_sql)
        logger.info("Schema executed successfully")

        # Verify tables were created
        tables = _get_tables(cursor)
        logger.info(f"Tables found: {len(tables)}")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            logger.info(f"  - {table} ({count} rows)")

        logger.info(f"[OK] Database initialized successfully: {config.DB_NAME}")

        cursor.close()
        conn.close()

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


PRESERVED_TABLES = []


def recreate_tables() -> None:
    """
    Drop all tables and recreate from schema.sql.

    Connects to the existing database, drops all user tables, and
    re-executes the schema. Tables in PRESERVED_TABLES have their
    data backed up and restored after recreation.
    """
    logger.info("=== Starting Recreate Tables ===")
    print("Recreating all tables...")

    schema_path = Path(config.SCHEMA_PATH)
    if not schema_path.exists():
        logger.error(f"Schema file not found: {schema_path}")
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    logger.info(f"Loading schema from: {schema_path}")

    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    try:
        conn = _get_connection()
        conn.autocommit = False
        cursor = conn.cursor()

        # Get existing tables
        tables = _get_tables(cursor)

        # Back up preserved tables before dropping
        preserved_data = {}
        for table_name in PRESERVED_TABLES:
            if table_name in tables:
                try:
                    cursor.execute(f"SELECT * FROM {table_name}")
                    rows = cursor.fetchall()
                    if rows:
                        cursor.execute(
                            "SELECT column_name FROM information_schema.columns "
                            "WHERE table_name = %s AND table_schema = 'public' "
                            "ORDER BY ordinal_position",
                            (table_name,)
                        )
                        columns = [col[0] for col in cursor.fetchall()]
                        preserved_data[table_name] = {"columns": columns, "rows": rows}
                        logger.info(f"Backed up {len(rows)} rows from preserved table: {table_name}")
                except Exception as e:
                    logger.debug(f"Could not back up preserved table {table_name}: {e}")

        # Drop all tables with CASCADE
        if tables:
            logger.info(f"Dropping {len(tables)} existing tables...")
            print(f"  Dropping {len(tables)} existing tables...")
            for table_name in tables:
                cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
                logger.debug(f"  Dropped table: {table_name}")
            conn.commit()
            logger.info(f"All {len(tables)} tables dropped successfully")
        else:
            logger.info("No existing tables to drop")

        # Execute schema
        conn.autocommit = True
        logger.info("Executing schema...")
        cursor.execute(schema_sql)
        logger.info("Schema executed successfully")
        conn.autocommit = False

        # Restore preserved tables
        for table_name, data in preserved_data.items():
            columns = data["columns"]
            rows = data["rows"]
            placeholders = ", ".join(["%s"] * len(columns))
            col_names = ", ".join(columns)
            try:
                for row in rows:
                    cursor.execute(
                        f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})",
                        row
                    )
                conn.commit()
                logger.info(f"Restored {len(rows)} rows to preserved table: {table_name}")
                print(f"  Restored {len(rows)} rows to {table_name}")
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to restore preserved table {table_name}: {e}")

        # Verify tables were created
        tables_created = _get_tables(cursor)
        logger.info(f"Tables created: {len(tables_created)}")
        print(f"  Tables created: {len(tables_created)}")

        for table in tables_created:
            logger.debug(f"  - {table}")

        logger.info("[OK] Tables recreated successfully")
        print("  [OK] Tables recreated successfully")

        cursor.close()
        conn.close()

    except Exception as e:
        logger.error(f"Failed to recreate tables: {e}")
        raise
