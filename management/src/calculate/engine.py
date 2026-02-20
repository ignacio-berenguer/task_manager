"""
Calculation engine for datos_relevantes table.

This module implements Python functions that replicate Excel LAMBDA formulas,
calculating derived values from the hechos, datos_descriptivos, and
informacion_economica tables.

Feature 02: Datos Relevantes - Computed Table
"""

import sqlite3
import logging
from datetime import datetime
from pathlib import Path

from src.config import settings as config
from .estado_functions import (
    estado_iniciativa, fecha_de_ultimo_estado, estado_aprobacion_iniciativa,
    estado_ejecucion_iniciativa, estado_agrupado, estado_dashboard,
    estado_requisito_legal, estado_sm100, estado_sm200, iniciativa_aprobada_fn
)
from .importe_functions import importe
from .lookup_functions import (
    get_datos_descriptivos_lookups, get_informacion_economica_lookups
)
from .helper_functions import (
    en_presupuesto_del_ano, calidad_valoracion, siguiente_accion,
    esta_en_los_206_me_de_2026, iniciativa_cerrada_economicamente,
    activo_ejercicio_actual,
    fecha_iniciativa, fecha_aprobada_iniciativa, fecha_limite,
    fecha_limite_comentarios
)

logger = logging.getLogger('portfolio_calculate')


def _preload_caches(conn: sqlite3.Connection) -> dict:
    """
    Preload all reference data into memory to avoid per-row SQL queries.

    Returns a dict with cached data keyed by table name:
        - dd: portfolio_id -> dict (datos_descriptivos)
        - ie: portfolio_id -> dict (informacion_economica)
        - hechos: portfolio_id -> [list of row dicts] (ordered by id_hecho)
        - facturacion: portfolio_id -> [list of row dicts]
        - justificaciones: portfolio_id -> [list of row dicts]
        - etiquetas: portfolio_id -> [list of row dicts]
        - estado_especial: portfolio_id -> dict
        - acciones: portfolio_id -> [list of row dicts]
    """
    cursor = conn.cursor()

    # datos_descriptivos: portfolio_id -> dict
    dd_cache = {}
    cursor.execute("SELECT * FROM datos_descriptivos")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        dd_cache[row_dict['portfolio_id']] = row_dict

    # informacion_economica: portfolio_id -> dict
    ie_cache = {}
    cursor.execute("SELECT * FROM informacion_economica")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        ie_cache[row_dict['portfolio_id']] = row_dict

    # hechos: portfolio_id -> [list of row dicts] ordered by id_hecho
    hechos_cache = {}
    cursor.execute("SELECT * FROM hechos ORDER BY id_hecho")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        pid = row_dict['portfolio_id']
        hechos_cache.setdefault(pid, []).append(row_dict)

    # facturacion: portfolio_id -> [list of row dicts]
    facturacion_cache = {}
    cursor.execute("SELECT * FROM facturacion")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        pid = row_dict['portfolio_id']
        facturacion_cache.setdefault(pid, []).append(row_dict)

    # justificaciones: portfolio_id -> [list of row dicts]
    justificaciones_cache = {}
    cursor.execute("SELECT * FROM justificaciones")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        pid = row_dict['portfolio_id']
        justificaciones_cache.setdefault(pid, []).append(row_dict)

    # etiquetas: portfolio_id -> [list of row dicts]
    etiquetas_cache = {}
    cursor.execute("SELECT * FROM etiquetas")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        pid = row_dict['portfolio_id']
        etiquetas_cache.setdefault(pid, []).append(row_dict)

    # estado_especial: portfolio_id -> dict
    estado_especial_cache = {}
    cursor.execute("SELECT * FROM estado_especial")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        estado_especial_cache[row_dict['portfolio_id']] = row_dict

    # acciones: portfolio_id -> [list of row dicts]
    acciones_cache = {}
    cursor.execute("SELECT * FROM acciones")
    columns = [desc[0] for desc in cursor.description]
    for row in cursor.fetchall():
        row_dict = dict(zip(columns, row))
        pid = row_dict['portfolio_id']
        acciones_cache.setdefault(pid, []).append(row_dict)

    caches = {
        'dd': dd_cache,
        'ie': ie_cache,
        'hechos': hechos_cache,
        'facturacion': facturacion_cache,
        'justificaciones': justificaciones_cache,
        'etiquetas': etiquetas_cache,
        'estado_especial': estado_especial_cache,
        'acciones': acciones_cache,
    }

    # Log cache sizes
    logger.info(f"Preloaded caches: dd={len(dd_cache)}, ie={len(ie_cache)}, "
                f"hechos={sum(len(v) for v in hechos_cache.values())} rows "
                f"({len(hechos_cache)} portfolios), "
                f"facturacion={sum(len(v) for v in facturacion_cache.values())}, "
                f"justificaciones={sum(len(v) for v in justificaciones_cache.values())}, "
                f"etiquetas={sum(len(v) for v in etiquetas_cache.values())}, "
                f"estado_especial={len(estado_especial_cache)}, "
                f"acciones={sum(len(v) for v in acciones_cache.values())}")

    return caches


def calculate_row(caches: dict, portfolio_id: str) -> dict:
    """Calculate all fields for a single portfolio_id."""

    # Get lookups
    dd_lookups = get_datos_descriptivos_lookups(caches, portfolio_id)
    ie_lookups = get_informacion_economica_lookups(caches, portfolio_id)

    # Calculate estado fields
    estado = estado_iniciativa(caches, portfolio_id)

    # Build the complete row
    return {
        # Lookups from datos_descriptivos
        **dd_lookups,
        # Lookups from informacion_economica
        **ie_lookups,
        # Constants
        'nuevo_importe_2025': 0,
        'cluster_de_antes_de_1906': '',
        'estado_de_la_iniciativa_2026': estado,
        # Estado calculations
        'estado_de_la_iniciativa': estado,
        'fecha_de_ultimo_estado': fecha_de_ultimo_estado(caches, portfolio_id),
        'estado_aprobacion': estado_aprobacion_iniciativa(caches, portfolio_id),
        'estado_ejecucion': estado_ejecucion_iniciativa(caches, portfolio_id),
        'estado_agrupado': estado_agrupado(caches, portfolio_id),
        'estado_dashboard': estado_dashboard(caches, portfolio_id),
        'estado_requisito_legal': estado_requisito_legal(caches, portfolio_id),
        'estado_sm100': estado_sm100(caches, portfolio_id),
        'estado_sm200': estado_sm200(caches, portfolio_id),
        'iniciativa_aprobada': iniciativa_aprobada_fn(caches, portfolio_id),
        # Financial - 2024
        'budget_2024': importe(caches, portfolio_id, 2024, "Budget"),
        'importe_sm200_24': importe(caches, portfolio_id, 2024, "SM200"),
        'importe_aprobado_2024': importe(caches, portfolio_id, 2024, "Aprobado"),
        'importe_citetic_24': importe(caches, portfolio_id, 2024, "Citetic"),
        'importe_facturacion_2024': importe(caches, portfolio_id, 2024, "Facturado"),
        'importe_2024': importe(caches, portfolio_id, 2024, "Importe"),
        # Financial - 2025
        'budget_2025': importe(caches, portfolio_id, 2025, "Budget"),
        'importe_sm200_2025': importe(caches, portfolio_id, 2025, "SM200"),
        'importe_aprobado_2025': importe(caches, portfolio_id, 2025, "Aprobado"),
        'importe_facturacion_2025': importe(caches, portfolio_id, 2025, "Facturado"),
        'importe_2025': importe(caches, portfolio_id, 2025, "Importe"),
        'importe_2025_cc_re': importe(caches, portfolio_id, 2025, "Cash Cost RE"),
        # Financial - 2026
        'budget_2026': importe(caches, portfolio_id, 2026, "Budget"),
        'importe_sm200_2026': importe(caches, portfolio_id, 2026, "SM200"),
        'importe_aprobado_2026': importe(caches, portfolio_id, 2026, "Aprobado"),
        'importe_facturacion_2026': importe(caches, portfolio_id, 2026, "Facturado"),
        'importe_2026': importe(caches, portfolio_id, 2026, "Importe"),
        # Financial - 2027
        'budget_2027': importe(caches, portfolio_id, 2027, "Budget"),
        'importe_sm200_2027': importe(caches, portfolio_id, 2027, "SM200"),
        'importe_aprobado_2027': importe(caches, portfolio_id, 2027, "Aprobado"),
        'importe_facturacion_2027': importe(caches, portfolio_id, 2027, "Facturado"),
        'importe_2027': importe(caches, portfolio_id, 2027, "Importe"),
        # Financial - 2028
        'importe_2028': importe(caches, portfolio_id, 2028, "Importe"),
        # Date functions
        'fecha_sm100': fecha_iniciativa(caches, portfolio_id, "SM100 Final"),
        'fecha_aprobada_con_cct': fecha_aprobada_iniciativa(caches, portfolio_id),
        'fecha_en_ejecucion': fecha_iniciativa(caches, portfolio_id, "En ejecución"),
        'fecha_limite': fecha_limite(caches, portfolio_id),
        'fecha_limite_comentarios': fecha_limite_comentarios(caches, portfolio_id),
        # Other functions
        'en_presupuesto_del_ano': en_presupuesto_del_ano(caches, portfolio_id, "2025.0"),
        'calidad_valoracion': calidad_valoracion(caches, portfolio_id, 2025),
        'siguiente_accion': siguiente_accion(caches, portfolio_id, 2025),
        'esta_en_los_206_me_de_2026': esta_en_los_206_me_de_2026(caches, portfolio_id),
        'iniciativa_cerrada_economicamente': iniciativa_cerrada_economicamente(caches, portfolio_id),
        'activo_ejercicio_actual': activo_ejercicio_actual(
            iniciativa_cerrada_economicamente(caches, portfolio_id),
            importe(caches, portfolio_id, datetime.now().year, "Importe")
        ),
        # Undefined
        'diferencia_apr_eje_exc_ept': None,
    }


def calculate_datos_relevantes(conn: sqlite3.Connection) -> dict:
    """
    Calculate and populate the datos_relevantes table.

    Args:
        conn: SQLite database connection

    Returns:
        dict with calculation statistics
    """
    cursor = conn.cursor()

    # Step 1: Clear existing data
    logger.info("Deleting existing datos_relevantes records...")
    cursor.execute("DELETE FROM datos_relevantes")

    # Step 2: Insert all portfolio_ids from datos_descriptivos
    logger.info("Inserting portfolio_ids from datos_descriptivos...")
    cursor.execute("""
        INSERT INTO datos_relevantes (portfolio_id)
        SELECT portfolio_id FROM datos_descriptivos
    """)
    conn.commit()

    # Step 3: Get all portfolio_ids to process
    cursor.execute("SELECT portfolio_id FROM datos_relevantes")
    portfolio_ids = [row[0] for row in cursor.fetchall()]
    total = len(portfolio_ids)

    logger.info(f"Calculating {total} rows...")

    # Step 4: Preload all reference data into memory
    logger.info("Preloading reference data into memory...")
    caches = _preload_caches(conn)

    # Step 5: Loop through each row and calculate
    errors = 0
    for i, portfolio_id in enumerate(portfolio_ids):
        try:
            values = calculate_row(caches, portfolio_id)

            # Build UPDATE statement
            columns = list(values.keys())
            placeholders = ', '.join([f"{col} = ?" for col in columns])
            sql = f"UPDATE datos_relevantes SET {placeholders} WHERE portfolio_id = ?"

            params = list(values.values()) + [portfolio_id]
            cursor.execute(sql, params)

        except Exception as e:
            logger.error(f"Error calculating {portfolio_id}: {e}")
            errors += 1

        if (i + 1) % config.BATCH_COMMIT_SIZE == 0:
            logger.info(f"Progress: {i + 1}/{total}")
            conn.commit()

    conn.commit()

    return {
        'rows_calculated': total - errors,
        'rows_error': errors,
        'total_rows': total,
        'timestamp': datetime.now().isoformat()
    }


def validate_against_iniciativas(conn: sqlite3.Connection, db_path: str = 'portfolio.db') -> dict:
    """
    Compare calculated datos_relevantes values against iniciativas (Excel source).

    Args:
        conn: SQLite database connection
        db_path: Path to database (used for mismatch file naming)

    Returns:
        dict with validation results per column
    """
    cursor = conn.cursor()

    # Columns to validate (only those with implemented calculations)
    text_columns = [
        'estado_de_la_iniciativa',
        'fecha_de_ultimo_estado',
        'estado_aprobacion',
        'estado_ejecucion',
        'en_presupuesto_del_ano',
        'calidad_valoracion',
    ]

    real_columns = [
        # 'budget_2024', 'importe_sm200_24', 'importe_aprobado_2024', 'importe_2024',
        'budget_2025', 'importe_sm200_2025', 'importe_aprobado_2025', 'importe_2025',
        'importe_2025_cc_re',
        'budget_2026', 'importe_sm200_2026', 'importe_aprobado_2026', 'importe_2026',
        'budget_2027', 'importe_sm200_2027', 'importe_aprobado_2027', 'importe_2027',
        'importe_2028',
    ]

    results = {
        'text_mismatches': {},
        'real_mismatches': {},
        'total_mismatches': 0,
        'total_rows': 0
    }

    # Collect all mismatches for detailed report
    all_mismatches = []

    # Get total rows
    cursor.execute("SELECT COUNT(*) FROM datos_relevantes")
    results['total_rows'] = cursor.fetchone()[0]

    # Validate TEXT columns and collect detailed mismatches
    for col in text_columns:
        sql = f"""
            SELECT dr.portfolio_id, i.{col}, dr.{col}
            FROM datos_relevantes dr
            JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
            WHERE COALESCE(dr.{col}, '') <> COALESCE(i.{col}, '')
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        count = len(rows)
        if count > 0:
            results['text_mismatches'][col] = count
            results['total_mismatches'] += count
            for row in rows:
                all_mismatches.append({
                    'portfolio_id': row[0],
                    'column': col,
                    'iniciativas_value': row[1],
                    'datos_relevantes_value': row[2]
                })

    # Validate REAL columns (with 0.01 tolerance) and collect detailed mismatches
    for col in real_columns:
        sql = f"""
            SELECT dr.portfolio_id, i.{col}, dr.{col}
            FROM datos_relevantes dr
            JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
            WHERE ABS(COALESCE(dr.{col}, 0) - COALESCE(i.{col}, 0)) > 0.01
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        count = len(rows)
        if count > 0:
            results['real_mismatches'][col] = count
            results['total_mismatches'] += count
            for row in rows:
                all_mismatches.append({
                    'portfolio_id': row[0],
                    'column': col,
                    'iniciativas_value': row[1],
                    'datos_relevantes_value': row[2]
                })

    # Write detailed mismatches to tab-delimited file
    if all_mismatches:
        # Extract database name (without extension) for filename
        db_name = Path(db_path).stem
        mismatch_file = f"{db_name}_mismatched_migration.txt"

        with open(mismatch_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write("portfolio_id\tcolumn\tvalue_iniciativas\tvalue_datos_relevantes\n")
            # Write data
            for m in all_mismatches:
                f.write(f"{m['portfolio_id']}\t{m['column']}\t{m['iniciativas_value']}\t{m['datos_relevantes_value']}\n")

        logger.info(f"Mismatch details written to: {mismatch_file}")
        results['mismatch_file'] = mismatch_file

    return results


def print_validation_report(results: dict):
    """Print a formatted validation report using logger."""
    logger.info("=" * 60)
    logger.info("VALIDATION REPORT")
    logger.info("Comparing datos_relevantes (calculated) vs iniciativas (Excel source)")
    logger.info("=" * 60)

    logger.info(f"Total rows: {results['total_rows']}")

    # TEXT columns
    logger.info("TEXT Columns:")
    text_cols = ['estado_de_la_iniciativa', 'fecha_de_ultimo_estado',
                 'estado_aprobacion', 'estado_ejecucion',
                 'en_presupuesto_del_ano', 'calidad_valoracion']
    for col in text_cols:
        count = results['text_mismatches'].get(col, 0)
        status = "X" if count > 0 else "OK"
        logger.info(f"  {col}: {count} mismatches [{status}]")

    # REAL columns
    logger.info("REAL Columns (tolerance: 0.01):")
    real_cols = [
        'budget_2024', 'importe_sm200_24', 'importe_aprobado_2024', 'importe_2024',
        'budget_2025', 'importe_sm200_2025', 'importe_aprobado_2025', 'importe_2025',
        'importe_2025_cc_re',
        'budget_2026', 'importe_sm200_2026', 'importe_aprobado_2026', 'importe_2026',
        'budget_2027', 'importe_sm200_2027', 'importe_aprobado_2027', 'importe_2027',
        'importe_2028',
    ]
    for col in real_cols:
        count = results['real_mismatches'].get(col, 0)
        status = "X" if count > 0 else "OK"
        logger.info(f"  {col}: {count} mismatches [{status}]")

    # Summary
    logger.info("-" * 60)
    logger.info(f"Total Mismatches: {results['total_mismatches']}")
    status = "PASSED" if results['total_mismatches'] == 0 else "FAILED"
    logger.info(f"Status: {status}")
    logger.info("=" * 60)


def main(db_path: str = None) -> dict: # type: ignore
    db_path = db_path or config.DATABASE_PATH
    """
    Entry point for calculate_datos_relevantes command.

    Args:
        db_path: Path to SQLite database

    Returns:
        dict with calculation and validation results
    """
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        # Calculate
        calc_result = calculate_datos_relevantes(conn)
        logger.info(f"Calculated {calc_result['rows_calculated']} rows, "
                    f"{calc_result['rows_error']} errors")

        logger.info("Calculation complete:")
        logger.info(f"  Rows calculated: {calc_result['rows_calculated']}")
        logger.info(f"  Errors: {calc_result['rows_error']}")

        # Validate
        logger.info("Running validation against iniciativas...")
        validation_result = validate_against_iniciativas(conn, db_path)
        print_validation_report(validation_result)

        return {
            'calculation': calc_result,
            'validation': validation_result
        }
    finally:
        conn.close()


if __name__ == "__main__":
    import sys
    db_path = sys.argv[1] if len(sys.argv) > 1 else config.DATABASE_PATH
    main(db_path)
