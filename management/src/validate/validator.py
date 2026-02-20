"""
Validation and reporting module for migration.
"""

import sqlite3
import logging
import pandas as pd

from src.config import settings as config

# Get logger (configured by main.py)
logger = logging.getLogger('portfolio_validate')


def validate_referential_integrity(conn: sqlite3.Connection) -> pd.DataFrame:
    """
    Check foreign key integrity.

    Args:
        conn: Database connection

    Returns:
        DataFrame with integrity issues
    """
    logger.info("=== Checking Referential Integrity ===")

    issues = []

    # With the new exact Excel mapping, iniciativas no longer has FK relationships to grupos or personas
    # Foreign keys are only from operational tables back to iniciativas via portfolio_id
    logger.debug("Checking foreign key relationships from operational tables to iniciativas")

    cursor = conn.cursor()

    # Check informacion_economica -> iniciativas
    logger.debug("Checking informacion_economica -> iniciativas")
    query = """
        SELECT COUNT(*) as count
        FROM informacion_economica ie
        LEFT JOIN iniciativas i ON ie.portfolio_id = i.portfolio_id
        WHERE ie.portfolio_id IS NOT NULL AND i.portfolio_id IS NULL
    """
    result = cursor.execute(query).fetchone()
    orphaned_count = result[0]

    if orphaned_count > 0:
        issues.append(('informacion_economica', 'portfolio_id', orphaned_count))
        logger.warning(f"  ✗ {orphaned_count} orphaned portfolio_id references in informacion_economica")

        # Log sample orphaned records
        logger.debug("Fetching sample orphaned records from informacion_economica...")
        cursor.execute("""
            SELECT ie.portfolio_id
            FROM informacion_economica ie
            LEFT JOIN iniciativas i ON ie.portfolio_id = i.portfolio_id
            WHERE ie.portfolio_id IS NOT NULL AND i.portfolio_id IS NULL
            LIMIT 5
        """)
        samples = cursor.fetchall()
        for sample in samples:
            logger.debug(f"  Orphaned portfolio_id: {sample[0]}")
    else:
        logger.info("  [OK] All informacion_economica references valid")

    # Check hechos -> iniciativas
    logger.debug("Checking hechos -> iniciativas")
    query = """
        SELECT COUNT(*) as count
        FROM hechos h
        LEFT JOIN iniciativas i ON h.portfolio_id = i.portfolio_id
        WHERE h.portfolio_id IS NOT NULL AND i.portfolio_id IS NULL
    """
    result = cursor.execute(query).fetchone()
    orphaned_count = result[0]

    if orphaned_count > 0:
        issues.append(('hechos', 'portfolio_id', orphaned_count))
        logger.warning(f"  ✗ {orphaned_count} orphaned portfolio_id references in hechos")

        # Log sample orphaned records
        logger.debug("Fetching sample orphaned records from hechos...")
        cursor.execute("""
            SELECT h.portfolio_id, h.id_hecho
            FROM hechos h
            LEFT JOIN iniciativas i ON h.portfolio_id = i.portfolio_id
            WHERE h.portfolio_id IS NOT NULL AND i.portfolio_id IS NULL
            LIMIT 5
        """)
        samples = cursor.fetchall()
        for sample in samples:
            logger.debug(f"  Orphaned portfolio_id: {sample[0]} (id_hecho: {sample[1]})")
    else:
        logger.info("  [OK] All hechos references valid")

    logger.debug(f"Total integrity issues found: {len(issues)}")
    return pd.DataFrame(issues, columns=['table', 'field', 'count']) if issues else pd.DataFrame()


def validate_row_counts(conn: sqlite3.Connection) -> pd.DataFrame:
    """
    Get row counts for all tables.

    Args:
        conn: Database connection

    Returns:
        DataFrame with table row counts
    """
    logger.info("=== Table Row Counts ===")

    cursor = conn.cursor()

    logger.debug("Fetching table list from sqlite_master")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    logger.debug(f"Found {len(tables)} tables")

    counts = []
    total_rows = 0

    for (table_name,) in tables:
        if table_name.startswith('sqlite_'):
            logger.debug(f"Skipping system table: {table_name}")
            continue

        logger.debug(f"Counting rows in table: {table_name}")
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            counts.append((table_name, count))
            total_rows += count

            logger.info(f"  {table_name:30s}: {count:6d} rows")
        except Exception as e:
            logger.error(f"Failed to count rows in {table_name}: {e}")
            counts.append((table_name, -1))

    logger.info(f"Total rows across all tables: {total_rows:,}")
    return pd.DataFrame(counts, columns=['table', 'rows'])


def get_quality_summary(conn: sqlite3.Connection) -> pd.DataFrame:
    """
    Get summary of data quality issues.

    Note: calidad_datos table removed - quality issues now logged to portfolio_migration.log

    Args:
        conn: Database connection (unused, kept for API consistency)

    Returns:
        Empty DataFrame (table removed)
    """
    _ = conn  # Unused - kept for API consistency with other validation functions
    logger.info("=== Data Quality Summary ===")
    logger.info("  [OK] Quality issues logged to portfolio_migration.log (calidad_datos table removed)")

    return pd.DataFrame()


def generate_quality_report(db_path: str) -> None:
    """
    Generate complete quality and validation report.

    Args:
        db_path: Path to database
    """
    logger.info("=" * 60)
    logger.info("Starting Validation Report")
    logger.info(f"Database: {db_path}")
    logger.info("=" * 60)

    logger.debug(f"Connecting to database: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        logger.debug("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

    try:
        # Row counts
        logger.info("Running row count validation...")
        counts_df = validate_row_counts(conn)
        logger.debug(f"Row counts DataFrame shape: {counts_df.shape}")

        # Referential integrity
        logger.info("Running referential integrity validation...")
        integrity_df = validate_referential_integrity(conn)
        logger.debug(f"Integrity issues DataFrame shape: {integrity_df.shape}")

        if not integrity_df.empty:
            logger.warning(f"Found {len(integrity_df)} referential integrity issues")
            for _, row in integrity_df.iterrows():
                logger.warning(f"  {row['table']}.{row['field']}: {row['count']} orphaned references")

        # Quality issues
        logger.info("Checking quality summary...")
        get_quality_summary(conn)

        logger.info("=" * 60)
        logger.info("[OK] Validation completed successfully")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise
    finally:
        conn.close()
        logger.debug("Database connection closed")


def validate_all(db_path: str) -> None:
    """Main validation entry point."""
    generate_quality_report(db_path)


if __name__ == "__main__":
    import sys

    db_path = sys.argv[1] if len(sys.argv) > 1 else config.DATABASE_PATH
    validate_all(db_path)
