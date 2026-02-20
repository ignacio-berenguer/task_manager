"""
Database initialization module.
Creates the SQLite database and executes the schema.
"""

import sqlite3
import logging
from pathlib import Path
from datetime import datetime

from src.config import settings as config

# Get logger (configured by main.py)
logger = logging.getLogger('task_manager_init')


def create_database(db_path: str = None, force_overwrite: bool = False) -> sqlite3.Connection:
    db_path = db_path or config.DATABASE_PATH
    """
    Create SQLite database and execute schema.

    Args:
        db_path: Path to database file
        force_overwrite: If True, overwrite existing database without prompting

    Returns:
        sqlite3.Connection object
    """
    logger.info("=== Starting Database Initialization ===")
    logger.debug(f"Target database path: {db_path}")

    db_path_obj = Path(db_path)

    # Check if database already exists
    if db_path_obj.exists():
        if force_overwrite:
            # Silent overwrite
            db_path_obj.unlink()
            logger.info(f"Removed existing database (force_overwrite): {db_path}")
        else:
            # Original behavior: prompt user
            logger.warning(f"Database {db_path} already exists")
            response = input("Do you want to overwrite it? (yes/no): ")
            logger.debug(f"User response to overwrite: {response}")

            if response.lower() != 'yes':
                logger.info("Database initialization aborted by user")
                return None

            # Remove existing database
            db_path_obj.unlink()
            logger.info(f"Removed existing database: {db_path}")

    # Create database connection
    logger.info(f"Creating database: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        logger.debug("Database connection established")
    except Exception as e:
        logger.error(f"Failed to create database connection: {e}")
        raise

    # Read and execute schema - look in PROJECT_ROOT/db/
    schema_path = Path(__file__).parent.parent.parent.parent / "db" / "schema.sql"
    logger.debug(f"Schema path: {schema_path}")

    if not schema_path.exists():
        logger.error(f"Schema file not found: {schema_path}")
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    logger.info(f"Loading schema from: {schema_path}")

    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        logger.debug(f"Schema file size: {len(schema_sql)} characters")

        # Count SQL statements (rough estimate)
        statement_count = schema_sql.count('CREATE TABLE') + schema_sql.count('CREATE INDEX')
        logger.debug(f"Estimated statements to execute: {statement_count}")

    except Exception as e:
        logger.error(f"Failed to read schema file: {e}")
        raise

    # Execute schema (split by statement to handle multiple statements)
    logger.info("Executing schema...")
    cursor = conn.cursor()

    try:
        cursor.executescript(schema_sql)
        conn.commit()
        logger.info("Schema executed successfully")
    except Exception as e:
        logger.error(f"Failed to execute schema: {e}")
        raise

    # Skip tabla_metadata initialization - table removed from schema
    logger.info("Skipping tabla_metadata initialization (table not needed for migration)")

    # Verify tables were created
    logger.debug("Verifying created tables...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables_created = cursor.fetchall()

    logger.info(f"Tables created: {len(tables_created)}")

    for table in tables_created:
        table_name = table[0]
        logger.info(f"  - {table_name}")

        # Get row count for each table
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            logger.debug(f"  {table_name}: {count} rows")
        except Exception as e:
            logger.debug(f"  {table_name}: unable to count rows ({e})")

    # Verify PRAGMA settings
    cursor.execute("PRAGMA foreign_keys")
    fk_status = cursor.fetchone()[0]
    logger.debug(f"Foreign key enforcement: {'ON' if fk_status else 'OFF'}")

    cursor.execute("PRAGMA journal_mode")
    journal_mode = cursor.fetchone()[0]
    logger.debug(f"Journal mode: {journal_mode}")

    logger.info(f"[OK] Database initialized successfully: {db_path}")
    logger.info(f"  - {len(tables_created)} tables")
    logger.info(f"  - Foreign key enforcement: {'ON' if fk_status else 'OFF'}")
    logger.info(f"  - Journal mode: {journal_mode}")

    return conn


PRESERVED_TABLES = []


def recreate_tables(db_path: str = None) -> sqlite3.Connection:
    """
    Drop all tables and recreate from schema.sql.

    Unlike create_database, this does NOT delete the .db file.
    It connects to the existing database, drops all tables, and
    re-executes the schema. Tables in PRESERVED_TABLES have their
    data backed up and restored after recreation.

    Args:
        db_path: Path to database file

    Returns:
        sqlite3.Connection object
    """
    db_path = db_path or config.DATABASE_PATH

    logger.info("=== Starting Recreate Tables ===")
    print("Recreating all tables...")

    db_path_obj = Path(db_path)

    # Create database file if it doesn't exist
    if not db_path_obj.exists():
        logger.info(f"Database does not exist, creating: {db_path}")
        print(f"  Database does not exist, creating: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        logger.debug("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

    cursor = conn.cursor()

    # Disable foreign keys temporarily to allow dropping tables in any order
    cursor.execute("PRAGMA foreign_keys = OFF")

    # Back up preserved tables before dropping
    preserved_data = {}
    for table_name in PRESERVED_TABLES:
        try:
            cursor.execute(f"SELECT * FROM [{table_name}]")
            rows = cursor.fetchall()
            if rows:
                cursor.execute(f"PRAGMA table_info([{table_name}])")
                columns = [col[1] for col in cursor.fetchall()]
                preserved_data[table_name] = {"columns": columns, "rows": rows}
                logger.info(f"Backed up {len(rows)} rows from preserved table: {table_name}")
        except sqlite3.OperationalError:
            logger.debug(f"Preserved table {table_name} does not exist yet, skipping backup")

    # Get all table names (exclude internal SQLite tables)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]

    if tables:
        logger.info(f"Dropping {len(tables)} existing tables...")
        print(f"  Dropping {len(tables)} existing tables...")
        for table_name in tables:
            cursor.execute(f"DROP TABLE IF EXISTS [{table_name}]")
            logger.debug(f"  Dropped table: {table_name}")
        conn.commit()
        logger.info(f"All {len(tables)} tables dropped successfully")
    else:
        logger.info("No existing tables to drop")

    # Read and execute schema
    schema_path = Path(__file__).parent.parent.parent.parent / "db" / "schema.sql"
    logger.debug(f"Schema path: {schema_path}")

    if not schema_path.exists():
        logger.error(f"Schema file not found: {schema_path}")
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    logger.info(f"Loading schema from: {schema_path}")

    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
    except Exception as e:
        logger.error(f"Failed to read schema file: {e}")
        raise

    # Execute schema
    logger.info("Executing schema...")
    try:
        cursor.executescript(schema_sql)
        conn.commit()
        logger.info("Schema executed successfully")
    except Exception as e:
        logger.error(f"Failed to execute schema: {e}")
        raise

    # Restore preserved tables
    for table_name, data in preserved_data.items():
        columns = data["columns"]
        rows = data["rows"]
        placeholders = ", ".join(["?"] * len(columns))
        col_names = ", ".join(f"[{c}]" for c in columns)
        try:
            cursor.executemany(
                f"INSERT INTO [{table_name}] ({col_names}) VALUES ({placeholders})",
                rows
            )
            conn.commit()
            logger.info(f"Restored {len(rows)} rows to preserved table: {table_name}")
            print(f"  Restored {len(rows)} rows to {table_name}")
        except Exception as e:
            logger.error(f"Failed to restore preserved table {table_name}: {e}")

    # Verify tables were created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables_created = cursor.fetchall()

    logger.info(f"Tables created: {len(tables_created)}")
    print(f"  Tables created: {len(tables_created)}")

    for table in tables_created:
        logger.debug(f"  - {table[0]}")

    logger.info(f"[OK] Tables recreated successfully: {db_path}")
    print(f"  [OK] Tables recreated successfully")

    return conn


def main():
    """Main entry point for database initialization."""
    import sys

    db_path = sys.argv[1] if len(sys.argv) > 1 else config.DATABASE_PATH
    conn = create_database(db_path)

    if conn:
        conn.close()
        logger.info("Database connection closed.")


if __name__ == "__main__":
    main()
