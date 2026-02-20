"""
Migration module for portfolio data.
Migrates data from Excel workbooks to SQLite database with comprehensive logging.
"""

import sqlite3
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd

from src.config import settings as config
from .excel_readers import get_all_readers
from src.core.data_quality import (
    normalize_date, normalize_currency, normalize_boolean,
    normalize_multiline_text, detect_formula_error,
    normalize_portfolio_id
)

# Get logger (configured by main.py)
logger = logging.getLogger('portfolio_migration')

# Parametric table sources: (parameter_name, source_table, source_column)
PARAMETRIC_SOURCES = [
    ('digital_framework_level_1', 'datos_descriptivos', 'digital_framework_level_1'),
    ('estado', 'hechos', 'estado'),
    ('origen', 'datos_descriptivos', 'origen'),
    ('priorizacion', 'datos_descriptivos', 'priorizacion'),
    ('tipo', 'iniciativas', 'tipo'),
    ('cluster', 'datos_descriptivos', 'cluster'),
    ('unidad', 'datos_descriptivos', 'unidad'),
    ('anio', 'facturacion', 'ano'),
    ('capex_opex', 'informacion_economica', 'capex_opex'),
    ('prioridad_descriptiva_bi', 'datos_descriptivos', 'prioridad_descriptiva_bi'),
    ('tipo_proyecto', 'datos_descriptivos', 'tipo_proyecto'),
    ('referente_bi', 'datos_descriptivos', 'referente_bi'),
    ('tipo_agrupacion', 'datos_descriptivos', 'tipo_agrupacion'),
    ('it_partner', 'datos_descriptivos', 'it_partner'),
    ('responsable', 'ltp', 'responsable'),
]

# Canonical sort order for estado parameter (hechos/ltp workflow)
ESTADO_ORDER = [
    'Recepción',
    'SM100 Redacción',
    'SM100 Final',
    'SM200 En Revision',
    'SM200 Final',
    'Análisis BI',
    'Revisión Regulación',
    'En Revisión P&C',
    'Pendiente de Unidad Solicitante',
    'Encolada por Prioridad',
    'En Aprobación',
    'Aprobada',
    'Aprobada con CCT',
    'En ejecución',
    'Finalizado',
    'Pendiente PES',
    'PES completado',
    'Facturación cierre año',
    'Cierre económico iniciativa',
    'Importe Estimado',
    'Importe Planificado',
    'Cancelado',
]


class MigrationEngine:
    """Main migration engine for portfolio data with comprehensive logging."""

    def __init__(self, db_path: str, excel_dir: str = None): # type: ignore
        excel_dir = excel_dir or config.EXCEL_SOURCE_DIR
        self.db_path = db_path
        self.excel_dir = excel_dir
        self.conn = sqlite3.connect(db_path)
        self.readers = get_all_readers(excel_dir)
        self.migration_stats = {}

        logger.info(f"Initialized MigrationEngine: db={db_path}, excel_dir={excel_dir}")

    def _log_migration_start(self, tabla: str, archivo: str, hoja: str) -> int:
        """Log migration start and return migration ID."""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO migracion_metadata (
                tabla_destino, archivo_origen, hoja_origen,
                fecha_inicio, estado
            ) VALUES (?, ?, ?, ?, 'EN_PROGRESO')
        """, (tabla, archivo, hoja, datetime.now().isoformat()))
        self.conn.commit()
        migration_id = cursor.lastrowid
        if not migration_id:
            raise RuntimeError("Failed to log migration start; no ID returned.")

        logger.info(f"Started migration: table={tabla}, source={archivo}/{hoja}, migration_id={migration_id}")
        return migration_id

    def _log_migration_end(
        self, migration_id: int, filas_origen: int,
        filas_migradas: int, filas_error: int,
        estado: str = 'COMPLETADO', mensaje_error: Optional[str] = None
    ):
        """Log migration completion."""
        cursor = self.conn.cursor()
        cursor.execute("""
            UPDATE migracion_metadata
            SET filas_origen = ?,
                filas_migradas = ?,
                filas_error = ?,
                fecha_fin = ?,
                estado = ?,
                mensaje_error = ?,
                duracion_segundos = (
                    julianday(?) - julianday(fecha_inicio)
                ) * 86400
            WHERE id = ?
        """, (
            filas_origen, filas_migradas, filas_error,
            datetime.now().isoformat(), estado, mensaje_error,
            datetime.now().isoformat(), migration_id
        ))
        self.conn.commit()

        logger.info(f"Completed migration_id={migration_id}: origin={filas_origen}, migrated={filas_migradas}, errors={filas_error}, status={estado}")
        if mensaje_error:
            logger.error(f"Migration error for migration_id={migration_id}: {mensaje_error}")

    def migrate_grupos_iniciativas(self) -> int:
        """
        Migrate grupos_iniciativas - EXACT 1:1 mapping from Excel (12 columns).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Grupos Iniciativas Migration ===")
        migration_id = self._log_migration_start('grupos_iniciativas', 'Master', 'Grupos Iniciativas')

        try:
            df = self.readers['master'].read_grupos_iniciativas() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    logger.debug(f"Processing row {idx}")

                    # Map all relevant columns
                    portfolio_id_grupo = normalize_portfolio_id(row.get('portfolio_id_grupo'))
                    portfolio_id_componente = normalize_portfolio_id(row.get('portfolio_id_componente'))

                    # Skip if both are empty
                    if not portfolio_id_grupo and not portfolio_id_componente:
                        logger.debug(f"Row {idx}: Skipping - both portfolio IDs are empty")
                        continue

                    nombre_grupo = normalize_multiline_text(row.get('nombre_grupo'))
                    tipo_agrupacion_grupo = row.get('tipo_agrupacion_grupo')
                    tipo_agrupacion_componente = row.get('tipo_agrupacion_componente')

                    cursor.execute("""
                        INSERT OR REPLACE INTO grupos_iniciativas (
                            portfolio_id_grupo, portfolio_id_componente,
                            nombre_grupo, tipo_agrupacion_grupo,
                            tipo_agrupacion_componente,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id_grupo, portfolio_id_componente,
                        nombre_grupo, tipo_agrupacion_grupo,
                        tipo_agrupacion_componente,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into grupos_iniciativas - grupo={portfolio_id_grupo}, componente={portfolio_id_componente}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} grupos_iniciativas ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating grupos_iniciativas: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_iniciativas(self) -> int:
        """
        Migrate iniciativas - EXACT 1:1 mapping from Excel (61 columns).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Iniciativas Migration ===")
        migration_id = self._log_migration_start('iniciativas', 'Master', 'Query Datos Relevantes')

        try:
            df = self.readers['master'].read_datos_relevantes() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map all 61 columns exactly from Excel
                    nombre = normalize_multiline_text(row.get('nombre'))
                    unidad = row.get('unidad')
                    origen = row.get('origen')
                    digital_framework_level_1 = row.get('digital_framework_level_1')
                    prioridad_descriptiva = row.get('prioridad_descriptiva')
                    cluster_2025 = row.get('cluster_2025')
                    estado_de_la_iniciativa = row.get('estado_de_la_iniciativa')
                    fecha_de_ultimo_estado, _ = normalize_date(row.get('fecha_de_ultimo_estado'))
                    estado_de_la_iniciativa_2026 = row.get('estado_de_la_iniciativa_2026')
                    estado_aprobacion = row.get('estado_aprobacion')
                    estado_ejecucion = row.get('estado_ejecucion')
                    priorizacion = row.get('priorizacion')
                    en_presupuesto_del_ano = row.get('en_presupuesto_del_ano')
                    tipo = row.get('tipo')

                    # Financial columns (2024-2028)
                    budget_2024 = normalize_currency(row.get('budget_2024'))
                    importe_sm200_24 = normalize_currency(row.get('importe_sm200_24'))
                    importe_aprobado_2024 = normalize_currency(row.get('importe_aprobado_2024'))
                    importe_citetic_24 = normalize_currency(row.get('importe_citetic_24'))
                    importe_facturacion_2024 = normalize_currency(row.get('importe_facturacion_2024'))
                    importe_2024 = normalize_currency(row.get('importe_2024'))

                    budget_2025 = normalize_currency(row.get('budget_2025'))
                    importe_sm200_2025 = normalize_currency(row.get('importe_sm200_2025'))
                    importe_aprobado_2025 = normalize_currency(row.get('importe_aprobado_2025'))
                    importe_facturacion_2025 = normalize_currency(row.get('importe_facturacion_2025'))
                    importe_2025 = normalize_currency(row.get('importe_2025'))
                    importe_2025_cc_re = normalize_currency(row.get('importe_2025_cc_re'))
                    calidad_valoracion = row.get('calidad_valoracion')

                    budget_2026 = normalize_currency(row.get('budget_2026'))
                    importe_sm200_2026 = normalize_currency(row.get('importe_sm200_2026'))
                    importe_aprobado_2026 = normalize_currency(row.get('importe_aprobado_2026'))
                    importe_facturacion_2026 = normalize_currency(row.get('importe_facturacion_2026'))
                    importe_2026 = normalize_currency(row.get('importe_2026'))

                    budget_2027 = normalize_currency(row.get('budget_2027'))
                    importe_sm200_2027 = normalize_currency(row.get('importe_sm200_2027'))
                    importe_aprobado_2027 = normalize_currency(row.get('importe_aprobado_2027'))
                    importe_facturacion_2027 = normalize_currency(row.get('importe_facturacion_2027'))
                    importe_2027 = normalize_currency(row.get('importe_2027'))
                    importe_2028 = normalize_currency(row.get('importe_2028'))

                    # Workflow fields
                    estado_agrupado = row.get('estado_agrupado')
                    siguiente_accion = normalize_multiline_text(row.get('siguiente_accion'))

                    # People
                    referente_negocio = row.get('referente_negocio')
                    estado_dashboard = row.get('estado_dashboard')
                    referente_bi = row.get('referente_bi')
                    jira_id = row.get('jira_id')
                    it_partner = row.get('it_partner')
                    referente_ict = row.get('referente_ict')

                    # Technical fields
                    capex_opex = row.get('capex_opex')
                    cini = row.get('cini')
                    fecha_prevista_pes, _ = normalize_date(row.get('fecha_prevista_pes'))
                    tipo_agrupacion = row.get('tipo_agrupacion')
                    nuevo_importe_2025 = normalize_currency(row.get('nuevo_importe_2025'))
                    estado_requisito_legal = row.get('estado_requisito_legal')
                    cluster_de_antes_de_1906 = row.get('cluster_de_antes_de_1906')

                    # Additional dates
                    fecha_sm100, _ = normalize_date(row.get('fecha_sm100'))
                    fecha_aprobada_con_cct, _ = normalize_date(row.get('fecha_aprobada_con_cct'))
                    fecha_en_ejecucion, _ = normalize_date(row.get('fecha_en_ejecucion'))

                    # Metrics
                    diferencia_apr_eje_exc_ept = normalize_currency(row.get('diferencia_apr_eje_exc_ept'))
                    esta_en_los_206_me_de_2026 = row.get('esta_en_los_206_me_de_2026')
                    fecha_limite, _ = normalize_date(row.get('fecha_limite'))
                    fecha_limite_comentarios = normalize_multiline_text(row.get('fecha_limite_comentarios'))

                    cursor.execute("""
                        INSERT INTO iniciativas (
                            portfolio_id, nombre, unidad, origen,
                            digital_framework_level_1, prioridad_descriptiva, cluster,
                            estado_de_la_iniciativa, fecha_de_ultimo_estado,
                            estado_de_la_iniciativa_2026, estado_aprobacion, estado_ejecucion,
                            priorizacion, en_presupuesto_del_ano, tipo,
                            budget_2024, importe_sm200_24, importe_aprobado_2024,
                            importe_citetic_24, importe_facturacion_2024, importe_2024,
                            budget_2025, importe_sm200_2025, importe_aprobado_2025,
                            importe_facturacion_2025, importe_2025, importe_2025_cc_re,
                            calidad_valoracion,
                            budget_2026, importe_sm200_2026, importe_aprobado_2026,
                            importe_facturacion_2026, importe_2026,
                            budget_2027, importe_sm200_2027, importe_aprobado_2027,
                            importe_facturacion_2027, importe_2027, importe_2028,
                            estado_agrupado, siguiente_accion,
                            referente_negocio, estado_dashboard, referente_bi,
                            jira_id, it_partner, referente_ict,
                            capex_opex, cini, fecha_prevista_pes, tipo_agrupacion,
                            nuevo_importe_2025, estado_requisito_legal,
                            cluster_de_antes_de_1906, fecha_sm100,
                            fecha_aprobada_con_cct, fecha_en_ejecucion,
                            diferencia_apr_eje_exc_ept, esta_en_los_206_me_de_2026,
                            fecha_limite, fecha_limite_comentarios,
                            fecha_creacion
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                        )
                    """, (
                        portfolio_id, nombre, unidad, origen,
                        digital_framework_level_1, prioridad_descriptiva, cluster_2025,
                        estado_de_la_iniciativa, fecha_de_ultimo_estado,
                        estado_de_la_iniciativa_2026, estado_aprobacion, estado_ejecucion,
                        priorizacion, en_presupuesto_del_ano, tipo,
                        budget_2024, importe_sm200_24, importe_aprobado_2024,
                        importe_citetic_24, importe_facturacion_2024, importe_2024,
                        budget_2025, importe_sm200_2025, importe_aprobado_2025,
                        importe_facturacion_2025, importe_2025, importe_2025_cc_re,
                        calidad_valoracion,
                        budget_2026, importe_sm200_2026, importe_aprobado_2026,
                        importe_facturacion_2026, importe_2026,
                        budget_2027, importe_sm200_2027, importe_aprobado_2027,
                        importe_facturacion_2027, importe_2027, importe_2028,
                        estado_agrupado, siguiente_accion,
                        referente_negocio, estado_dashboard, referente_bi,
                        jira_id, it_partner, referente_ict,
                        capex_opex, cini, fecha_prevista_pes, tipo_agrupacion,
                        nuevo_importe_2025, estado_requisito_legal,
                        cluster_de_antes_de_1906, fecha_sm100,
                        fecha_aprobada_con_cct, fecha_en_ejecucion,
                        diferencia_apr_eje_exc_ept, esta_en_los_206_me_de_2026,
                        fecha_limite, fecha_limite_comentarios,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into iniciativas - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx} ({portfolio_id}): Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} iniciativas ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating iniciativas: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_beneficios(self) -> int:
        """
        Migrate beneficios - EXACT 1:1 mapping from Excel (12 columns, NOT denormalized).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Beneficios Migration ===")
        migration_id = self._log_migration_start('beneficios', 'Beneficios', 'All sheets')

        try:
            df = self.readers['beneficios'].read_all_beneficios_sheets() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map all 12 columns exactly
                    grupo = row.get('grupo')
                    concepto = normalize_multiline_text(row.get('concepto'))
                    periodo = row.get('periodo')
                    importe = normalize_currency(row.get('importe'))
                    valor = normalize_currency(row.get('valor'))
                    texto = normalize_multiline_text(row.get('texto'))
                    origen = row.get('origen')
                    fecha_modificacion, _ = normalize_date(row.get('fecha_modificacion'))
                    columna_tablon = row.get('columna_tablon')

                    cursor.execute("""
                        INSERT INTO beneficios (
                            portfolio_id, grupo, concepto, periodo,
                            importe, valor, texto, origen,
                            fecha_modificacion, columna_tablon,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, grupo, concepto, periodo,
                        importe, valor, texto, origen,
                        fecha_modificacion, columna_tablon,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    if migrated % 1000 == 0:
                        logger.debug(f"Inserted {migrated} rows into beneficios so far...")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} beneficios ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating beneficios: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_informacion_economica(self) -> int:
        """
        Migrate informacion_economica (financial data) - exact Excel column mapping.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Información Económica Migration ===")
        migration_id = self._log_migration_start('informacion_economica', 'Master', 'Información Económica')

        try:
            df = self.readers['master'].read_informacion_economica() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map non-redundant Excel columns
                    cini = row.get('cini')
                    capex_opex = row.get('capex_opex')
                    fecha_prevista_pes, _ = normalize_date(row.get('fecha_prevista_pes'))
                    wbe = row.get('wbe')
                    cluster = row.get('cluster')
                    finalidad_budget = row.get('finalidad_budget')
                    proyecto_especial = row.get('proyecto_especial')
                    clasificacion = row.get('clasificacion')
                    tlc = row.get('tlc')
                    tipo_inversion = row.get('tipo_inversion')
                    observaciones = normalize_multiline_text(row.get('observaciones'))

                    cursor.execute("""
                        INSERT INTO informacion_economica (
                            portfolio_id, cini, capex_opex,
                            fecha_prevista_pes, wbe, cluster, finalidad_budget,
                            proyecto_especial, clasificacion, tlc, tipo_inversion,
                            observaciones, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, cini, capex_opex,
                        fecha_prevista_pes, wbe, cluster, finalidad_budget,
                        proyecto_especial, clasificacion, tlc, tipo_inversion,
                        observaciones, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into informacion_economica - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} informacion_economica ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating informacion_economica: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_datos_ejecucion(self) -> int:
        """
        Migrate datos_ejecucion - EXACT 1:1 mapping from Excel (16 columns).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Datos Ejecución Migration ===")
        migration_id = self._log_migration_start('datos_ejecucion', 'Master', 'Datos ejecución')

        try:
            # Read with skiprows=1 to get proper headers
            df = self.readers['master'].read_datos_ejecucion() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map non-redundant columns
                    fecha_inicio, _ = normalize_date(row.get('fecha_inicio'))
                    fecha_uat, _ = normalize_date(row.get('fecha_uat'))
                    fecha_fin, _ = normalize_date(row.get('fecha_fin'))
                    porcentaje_avance = row.get('porcentaje_avance')
                    en_retraso = row.get('en_retraso')
                    porcentaje_facturacion = row.get('porcentaje_facturacion')
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT INTO datos_ejecucion (
                            portfolio_id, fecha_inicio, fecha_uat,
                            fecha_fin, porcentaje_avance, en_retraso,
                            porcentaje_facturacion, comentarios,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, fecha_inicio, fecha_uat,
                        fecha_fin, porcentaje_avance, en_retraso,
                        porcentaje_facturacion, comentarios,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into datos_ejecucion - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} datos_ejecucion ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating datos_ejecucion: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_hechos(self) -> int:
        """
        Migrate hechos (detailed fact records) - exact Excel column mapping.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Hechos Migration ===")
        migration_id = self._log_migration_start('hechos', 'Master', 'Hechos')

        try:
            df = self.readers['master'].read_hechos() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map non-redundant Excel columns
                    id_hecho = row.get('id')  # Excel ID column
                    partida_presupuestaria = row.get('partida_presupuestaria')
                    importe = normalize_currency(row.get('importe'))
                    estado = row.get('estado')
                    fecha, _ = normalize_date(row.get('fecha'))
                    importe_ri = normalize_currency(row.get('importe_ri'))
                    importe_re = normalize_currency(row.get('importe_re'))
                    notas = normalize_multiline_text(row.get('notas'))
                    racional = normalize_multiline_text(row.get('racional'))
                    calidad_estimacion = row.get('calidad_estimacion')

                    # Use INSERT OR REPLACE to handle id_hecho as primary key
                    cursor.execute("""
                        INSERT OR REPLACE INTO hechos (
                            id_hecho, portfolio_id, partida_presupuestaria,
                            importe, estado, fecha, importe_ri, importe_re,
                            notas, racional, calidad_estimacion,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        id_hecho, portfolio_id, partida_presupuestaria,
                        importe, estado, fecha, importe_ri, importe_re,
                        notas, racional, calidad_estimacion,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into hechos - id_hecho={id_hecho}, portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} hechos ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating hechos: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_etiquetas(self) -> int:
        """
        Migrate etiquetas (tags/labels) - exact Excel column mapping.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Etiquetas Migration ===")
        migration_id = self._log_migration_start('etiquetas', 'Master', 'Etiquetas')

        try:
            # Read directly from Excel without denormalization
            df = pd.read_excel(
                self.readers['master'].file_path,
                sheet_name='Etiquetas',
                skiprows=2
            )
            df = self.readers['master']._rename_columns(df)
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    # Map all Excel columns exactly
                    etiqueta = row.get('etiqueta')
                    valor = row.get('valor')
                    fecha_modificacion, _ = normalize_date(row.get('fecha_modificacion'))
                    origen_registro = row.get('origen_registro')
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    # Skip if no etiqueta
                    if not etiqueta:
                        logger.debug(f"Row {idx}: Skipping - no etiqueta")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}, etiqueta={etiqueta}")

                    cursor.execute("""
                        INSERT OR REPLACE INTO etiquetas (
                            portfolio_id, etiqueta, valor,
                            fecha_modificacion, origen_registro,
                            comentarios, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, etiqueta, valor,
                        fecha_modificacion, origen_registro,
                        comentarios, datetime.now().isoformat()
                    ))

                    migrated += 1
                    if migrated % 1000 == 0:
                        logger.debug(f"Inserted {migrated} rows into etiquetas so far...")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} etiquetas ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating etiquetas: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_datos_descriptivos(self) -> int:
        """
        Migrate datos_descriptivos (descriptive data) - exact Excel column mapping.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Datos Descriptivos Migration ===")
        migration_id = self._log_migration_start('datos_descriptivos', 'Master', 'Datos descriptivos')

        try:
            df = pd.read_excel(
                self.readers['master'].file_path,
                sheet_name='Datos descriptivos',
                skiprows=2
            )
            df = self.readers['master']._rename_columns(df)
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map all Excel columns exactly
                    nombre = normalize_multiline_text(row.get('nombre'))
                    unidad = row.get('unidad')
                    origen = row.get('origen')
                    digital_framework_level_1 = row.get('digital_framework_level_1')
                    prioridad_descriptiva_bi = row.get('prioridad_descriptiva_bi')
                    priorizacion = row.get('priorizacion')
                    tipo_proyecto = row.get('tipo_proyecto')
                    referente_bi = row.get('referente_bi')
                    referente_b_unit = row.get('referente_b_unit')
                    referente_enabler_ict = row.get('referente_enabler_ict')
                    it_partner = row.get('it_partner')
                    codigo_jira = row.get('codigo_jira')
                    cluster_2025 = row.get('cluster_2025')
                    tipo_agrupacion = row.get('tipo_agrupacion')
                    cluster_2025_antes_de_19062025 = row.get('cluster_2025_antes_de_19062025')

                    cursor.execute("""
                        INSERT INTO datos_descriptivos (
                            portfolio_id, nombre, unidad, origen,
                            digital_framework_level_1, prioridad_descriptiva_bi,
                            priorizacion, tipo_proyecto, referente_bi,
                            referente_b_unit, referente_enabler_ict, it_partner,
                            codigo_jira, cluster, tipo_agrupacion,
                            cluster_2025_antes_de_19062025,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, nombre, unidad, origen,
                        digital_framework_level_1, prioridad_descriptiva_bi,
                        priorizacion, tipo_proyecto, referente_bi,
                        referente_b_unit, referente_enabler_ict, it_partner,
                        codigo_jira, cluster_2025, tipo_agrupacion,
                        cluster_2025_antes_de_19062025,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into datos_descriptivos - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} datos_descriptivos ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating datos_descriptivos: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_justificaciones(self) -> int:
        """
        Migrate justificaciones (justifications) - exact Excel column mapping.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Justificaciones Migration ===")
        migration_id = self._log_migration_start('justificaciones', 'Master', 'Justificaciones')

        try:
            df = pd.read_excel(
                self.readers['master'].file_path,
                sheet_name='Justificaciones',
                skiprows=2
            )
            df = self.readers['master']._rename_columns(df)
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    # Map all Excel columns exactly
                    tipo_justificacion = row.get('tipo_justificacion')
                    valor = row.get('valor')
                    fecha_modificacion, _ = normalize_date(row.get('fecha_modificacion'))
                    origen_registro = row.get('origen_registro')
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    # Skip if no tipo_justificacion
                    if not tipo_justificacion:
                        logger.debug(f"Row {idx}: Skipping - no tipo_justificacion")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}, tipo={tipo_justificacion}")

                    cursor.execute("""
                        INSERT OR REPLACE INTO justificaciones (
                            portfolio_id, tipo_justificacion, valor,
                            fecha_modificacion, origen_registro,
                            comentarios, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, tipo_justificacion, valor,
                        fecha_modificacion, origen_registro,
                        comentarios, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into justificaciones - portfolio_id={portfolio_id}, tipo={tipo_justificacion}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} justificaciones ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating justificaciones: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_facturacion(self) -> int:
        """
        Migrate facturacion (billing records) - exact Excel column mapping.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Facturación Migration ===")
        migration_id = self._log_migration_start('facturacion', 'Master', 'Facturación')

        try:
            df = self.readers['master'].read_facturacion() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Map non-redundant Excel columns
                    ano = row.get('ano')
                    mes = row.get('mes')
                    importe = normalize_currency(row.get('importe'))
                    concepto_factura = row.get('concepto_factura')

                    cursor.execute("""
                        INSERT INTO facturacion (
                            portfolio_id, ano, mes,
                            importe, concepto_factura, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, ano, mes,
                        importe, concepto_factura, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into facturacion - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} facturacion ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating facturacion: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_ltp(self) -> int:
        """
        Migrate ltp - Long-term planning data.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting LTP Migration ===")
        migration_id = self._log_migration_start('ltp', 'Master', 'LTP')

        try:
            df = self.readers['master'].read_ltp() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    # Planning details
                    responsable = normalize_multiline_text(row.get('responsable'))
                    tarea = normalize_multiline_text(row.get('tarea'))
                    siguiente_accion, _ = normalize_date(row.get('siguiente_accion'))
                    fecha_creacion, _ = normalize_date(row.get('fecha_creacion'))
                    estado = normalize_multiline_text(row.get('estado'))
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT INTO ltp (
                            portfolio_id, responsable, tarea,
                            siguiente_accion, fecha_creacion, estado, comentarios
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, responsable, tarea,
                        siguiente_accion, fecha_creacion, estado, comentarios
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into ltp - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} ltp ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating ltp: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_wbes(self) -> int:
        """
        Migrate wbes - Work breakdown elements.

        Excel structure: portfolio_id, ano_presupuesto, nombre, wbe_pyb, descripcion, wbe_can, descripcion2
        Each Excel row has TWO WBE codes (PyB and CAN), so we insert TWO database rows per Excel row.

        Returns:
            Number of rows migrated (count of database rows, not Excel rows)
        """
        logger.info("=== Starting WBEs Migration ===")
        migration_id = self._log_migration_start('wbes', 'Master', 'WBEs')

        try:
            df = self.readers['master'].read_wbes() # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    # Get common fields
                    anio = row.get('ano_presupuesto')
                    wbe_pyb = row.get('wbe_pyb')
                    descripcion_pyb = normalize_multiline_text(row.get('descripcion'))
                    wbe_can = row.get('wbe_can')
                    descripcion_can = normalize_multiline_text(row.get('descripcion2'))

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}, wbe_pyb={wbe_pyb}, wbe_can={wbe_can}")

                    try:
                        cursor.execute("""
                            INSERT INTO wbes (
                                portfolio_id, anio,
                                wbe_pyb, descripcion_pyb, wbe_can, descripcion_can,
                                fecha_creacion
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            portfolio_id,
                            anio,
                            str(wbe_pyb).strip(),
                            descripcion_pyb,
                            wbe_can,
                            descripcion_can,
                            datetime.now().isoformat()
                        ))
                        migrated += 1
                        logger.debug(f"Row {idx}: Successfully inserted  WBE into wbes - portfolio_id={portfolio_id}, codigo_wbs={wbe_pyb}")
                    except Exception as e:
                        errors += 1
                        logger.error(f"Row {idx}: Failed to migrate  WBE - {e}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to process row - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} wbes ({errors} errors) from {len(df)} Excel rows")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating wbes: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_dependencias(self) -> int:
        """
        Migrate dependencias - Initiative dependencies.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Dependencias Migration ===")
        migration_id = self._log_migration_start('dependencias', 'Master', 'Dependencias')

        try:
            df = self.readers['master'].read_dependencias()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    descripcion_dependencia = normalize_multiline_text(row.get('descripcion_dependencia'))
                    fecha_dependencia, _ = normalize_date(row.get('fecha_dependencia'))
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT INTO dependencias (
                            portfolio_id, descripcion_dependencia,
                            fecha_dependencia, comentarios
                        ) VALUES (?, ?, ?, ?)
                    """, (
                        portfolio_id, descripcion_dependencia,
                        fecha_dependencia, comentarios
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into dependencias - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} dependencias ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating dependencias: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_notas(self) -> int:
        """
        Migrate notas (notes for initiatives).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Notas Migration ===")
        migration_id = self._log_migration_start('notas', 'Master', 'Notas')

        try:
            df = self.readers['master'].read_notas()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    registrado_por = row.get('registrado_por')
                    fecha, _ = normalize_date(row.get('fecha'))
                    nota = normalize_multiline_text(row.get('nota'))

                    cursor.execute("""
                        INSERT INTO notas (
                            portfolio_id, registrado_por, fecha,
                            nota, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, registrado_por, fecha,
                        nota, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into notas - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} notas ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating notas: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_avance(self) -> int:
        """
        Migrate avance (progress tracking).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Avance Migration ===")
        migration_id = self._log_migration_start('avance', 'Master', 'Avance')

        try:
            df = self.readers['master'].read_avance()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    fecha_introduccion, _ = normalize_date(row.get('fecha_introduccion'))
                    anio = row.get('anio') or row.get('ano')
                    mes = row.get('mes')
                    fecha_inicio, _ = normalize_date(row.get('fecha_inicio'))
                    fecha_uat, _ = normalize_date(row.get('fecha_uat'))
                    fecha_fin_prevista, _ = normalize_date(row.get('fecha_fin_prevista'))
                    avance_2025 = normalize_currency(row.get('avance_2025'))
                    comentario = normalize_multiline_text(row.get('comentario'))
                    error_fecha_inicio = row.get('error_fecha_inicio')
                    error_fecha_uat = row.get('error_fecha_uat')
                    error_fecha_fin_prevista = row.get('error_fecha_fin_prevista')
                    error_avance = row.get('error_avance')
                    tiene_error = row.get('tiene_error')

                    cursor.execute("""
                        INSERT INTO avance (
                            portfolio_id, fecha_introduccion,
                            anio, mes, fecha_inicio, fecha_uat, fecha_fin_prevista,
                            avance_2025, comentario, error_fecha_inicio, error_fecha_uat,
                            error_fecha_fin_prevista, error_avance, tiene_error,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, fecha_introduccion,
                        anio, mes, fecha_inicio, fecha_uat, fecha_fin_prevista,
                        avance_2025, comentario, error_fecha_inicio, error_fecha_uat,
                        error_fecha_fin_prevista, error_avance, tiene_error,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into avance - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} avance ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating avance: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_acciones(self) -> int:
        """
        Migrate acciones (actions for initiatives).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Acciones Migration ===")
        migration_id = self._log_migration_start('acciones', 'Master', 'Acciones')

        try:
            df = self.readers['master'].read_acciones()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    siguiente_accion = normalize_multiline_text(row.get('siguiente_accion'))
                    siguiente_accion_comentarios = normalize_multiline_text(row.get('siguiente_accion_comentarios'))
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT INTO acciones (
                            portfolio_id, siguiente_accion, siguiente_accion_comentarios,
                            comentarios, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, siguiente_accion, siguiente_accion_comentarios,
                        comentarios, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into acciones - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} acciones ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating acciones: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_descripciones(self) -> int:
        """
        Migrate descripciones (descriptions for initiatives).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Descripciones Migration ===")
        migration_id = self._log_migration_start('descripciones', 'Master', 'Descripciones')

        try:
            df = self.readers['master'].read_descripciones()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    tipo_descripcion = row.get('tipo_descripcion')
                    descripcion = normalize_multiline_text(row.get('descripcion'))
                    fecha_modificacion, _ = normalize_date(row.get('fecha_modificacion'))
                    origen_registro = row.get('origen_registro')
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT OR REPLACE INTO descripciones (
                            portfolio_id, tipo_descripcion, descripcion,
                            fecha_modificacion, origen_registro, comentarios,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, tipo_descripcion, descripcion,
                        fecha_modificacion, origen_registro, comentarios,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into descripciones - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} descripciones ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating descripciones: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_estado_especial(self) -> int:
        """
        Migrate estado_especial (special status for initiatives).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Estado Especial Migration ===")
        migration_id = self._log_migration_start('estado_especial', 'Master', 'Estado Especial')

        try:
            df = self.readers['master'].read_estado_especial()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    estado_especial = row.get('estado_especial')
                    fecha_modificacion, _ = normalize_date(row.get('fecha_modificacion'))
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT OR REPLACE INTO estado_especial (
                            portfolio_id, estado_especial,
                            fecha_modificacion, comentarios, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, estado_especial,
                        fecha_modificacion, comentarios, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into estado_especial - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} estado_especial ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating estado_especial: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_investment_memos(self) -> int:
        """
        Migrate investment_memos (Investment Memo tracking).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Investment Memos Migration ===")
        migration_id = self._log_migration_start('investment_memos', 'Master', 'IM')

        try:
            df = self.readers['master'].read_investment_memos()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    descripcion = normalize_multiline_text(row.get('descripcion'))
                    fecha_investment_memo_aprobado, _ = normalize_date(row.get('fecha_investment_memo_aprobado'))
                    new_capex_dev = normalize_currency(row.get('new_capex_dev'))
                    new_capex_maint = normalize_currency(row.get('new_capex_maint'))
                    new_opex_ict = normalize_currency(row.get('new_opex_ict'))
                    referente_negocio = row.get('referente_negocio')
                    link_im = row.get('link_im')
                    fecha_inicio_proyecto, _ = normalize_date(row.get('fecha_inicio_proyecto'))
                    fecha_final_proyecto, _ = normalize_date(row.get('fecha_final_proyecto'))
                    estado_proyecto = row.get('estado_proyecto')

                    # Investment columns
                    investment_2024 = normalize_currency(row.get('investment_2024'))
                    investment_2025 = normalize_currency(row.get('investment_2025'))
                    investment_2026 = normalize_currency(row.get('investment_2026'))
                    investment_2027 = normalize_currency(row.get('investment_2027'))
                    investment_2028 = normalize_currency(row.get('investment_2028'))
                    investment_2029 = normalize_currency(row.get('investment_2029'))
                    investment_2030 = normalize_currency(row.get('investment_2030'))

                    # Benefits columns (simplified - getting main columns)
                    benefits_2024 = normalize_currency(row.get('benefits_2024'))
                    benefits_2024_margin_increase = normalize_currency(row.get('benefits_2024_margin_increase') or row.get('margin_increase'))
                    benefits_2024_opex_reduction_business = normalize_currency(row.get('benefits_2024_opex_reduction_business') or row.get('opex_reduction_business'))
                    benefits_2024_opex_reduction_ict = normalize_currency(row.get('benefits_2024_opex_reduction_ict') or row.get('opex_reduction_ict'))
                    other_benefits_2024 = normalize_currency(row.get('other_benefits_2024') or row.get('other_benefits'))

                    benefits_2025 = normalize_currency(row.get('benefits_2025'))
                    benefits_2025_margin_increase = normalize_currency(row.get('benefits_2025_margin_increase'))
                    benefits_2025_opex_reduction_business = normalize_currency(row.get('benefits_2025_opex_reduction_business'))
                    benefits_2025_opex_reduction_ict = normalize_currency(row.get('benefits_2025_opex_reduction_ict'))
                    other_benefits_2025 = normalize_currency(row.get('other_benefits_2025'))

                    benefits_2026 = normalize_currency(row.get('benefits_2026'))
                    benefits_2026_margin_increase = normalize_currency(row.get('benefits_2026_margin_increase'))
                    benefits_2026_opex_reduction_business = normalize_currency(row.get('benefits_2026_opex_reduction_business'))
                    benefits_2026_opex_reduction_ict = normalize_currency(row.get('benefits_2026_opex_reduction_ict'))
                    other_benefits_2026 = normalize_currency(row.get('other_benefits_2026'))

                    total_benefits_2027 = normalize_currency(row.get('total_benefits_2027') or row.get('benefits_2027'))
                    benefits_2027_margin_increase = normalize_currency(row.get('benefits_2027_margin_increase'))
                    benefits_2027_opex_reduction_business = normalize_currency(row.get('benefits_2027_opex_reduction_business'))
                    benefits_2027_opex_reduction_ict = normalize_currency(row.get('benefits_2027_opex_reduction_ict'))
                    other_benefits_2027 = normalize_currency(row.get('other_benefits_2027'))

                    total_benefits_2028 = normalize_currency(row.get('total_benefits_2028') or row.get('benefits_2028'))
                    benefits_2028_margin_increase = normalize_currency(row.get('benefits_2028_margin_increase'))
                    benefits_2028_opex_reduction_business = normalize_currency(row.get('benefits_2028_opex_reduction_business'))
                    benefits_2028_opex_reduction_ict = normalize_currency(row.get('benefits_2028_opex_reduction_ict'))
                    other_benefits_2028 = normalize_currency(row.get('other_benefits_2028'))

                    total_benefits_2029 = normalize_currency(row.get('total_benefits_2029') or row.get('benefits_2029'))
                    benefits_2029_margin_increase = normalize_currency(row.get('benefits_2029_margin_increase'))
                    benefits_2029_opex_reduction_business = normalize_currency(row.get('benefits_2029_opex_reduction_business'))
                    benefits_2029_opex_reduction_ict = normalize_currency(row.get('benefits_2029_opex_reduction_ict'))
                    other_benefits_2029 = normalize_currency(row.get('other_benefits_2029'))

                    total_benefits_2030 = normalize_currency(row.get('total_benefits_2030') or row.get('benefits_2030'))
                    benefits_2030_margin_increase = normalize_currency(row.get('benefits_2030_margin_increase'))
                    benefits_2030_opex_reduction_business = normalize_currency(row.get('benefits_2030_opex_reduction_business'))
                    benefits_2030_opex_reduction_ict = normalize_currency(row.get('benefits_2030_opex_reduction_ict'))
                    other_benefits_2030 = normalize_currency(row.get('other_benefits_2030'))

                    cursor.execute("""
                        INSERT OR REPLACE INTO investment_memos (
                            portfolio_id, descripcion, fecha_investment_memo_aprobado,
                            new_capex_dev, new_capex_maint, new_opex_ict,
                            referente_negocio, link_im, fecha_inicio_proyecto,
                            fecha_final_proyecto, estado_proyecto,
                            investment_2024, investment_2025, investment_2026,
                            investment_2027, investment_2028, investment_2029, investment_2030,
                            benefits_2024, benefits_2024_margin_increase, benefits_2024_opex_reduction_business,
                            benefits_2024_opex_reduction_ict, other_benefits_2024,
                            benefits_2025, benefits_2025_margin_increase, benefits_2025_opex_reduction_business,
                            benefits_2025_opex_reduction_ict, other_benefits_2025,
                            benefits_2026, benefits_2026_margin_increase, benefits_2026_opex_reduction_business,
                            benefits_2026_opex_reduction_ict, other_benefits_2026,
                            total_benefits_2027, benefits_2027_margin_increase, benefits_2027_opex_reduction_business,
                            benefits_2027_opex_reduction_ict, other_benefits_2027,
                            total_benefits_2028, benefits_2028_margin_increase, benefits_2028_opex_reduction_business,
                            benefits_2028_opex_reduction_ict, other_benefits_2028,
                            total_benefits_2029, benefits_2029_margin_increase, benefits_2029_opex_reduction_business,
                            benefits_2029_opex_reduction_ict, other_benefits_2029,
                            total_benefits_2030, benefits_2030_margin_increase, benefits_2030_opex_reduction_business,
                            benefits_2030_opex_reduction_ict, other_benefits_2030,
                            fecha_creacion
                        ) VALUES (
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?,
                            ?
                        )
                    """, (
                        portfolio_id, descripcion, fecha_investment_memo_aprobado,
                        new_capex_dev, new_capex_maint, new_opex_ict,
                        referente_negocio, link_im, fecha_inicio_proyecto,
                        fecha_final_proyecto, estado_proyecto,
                        investment_2024, investment_2025, investment_2026,
                        investment_2027, investment_2028, investment_2029, investment_2030,
                        benefits_2024, benefits_2024_margin_increase, benefits_2024_opex_reduction_business,
                        benefits_2024_opex_reduction_ict, other_benefits_2024,
                        benefits_2025, benefits_2025_margin_increase, benefits_2025_opex_reduction_business,
                        benefits_2025_opex_reduction_ict, other_benefits_2025,
                        benefits_2026, benefits_2026_margin_increase, benefits_2026_opex_reduction_business,
                        benefits_2026_opex_reduction_ict, other_benefits_2026,
                        total_benefits_2027, benefits_2027_margin_increase, benefits_2027_opex_reduction_business,
                        benefits_2027_opex_reduction_ict, other_benefits_2027,
                        total_benefits_2028, benefits_2028_margin_increase, benefits_2028_opex_reduction_business,
                        benefits_2028_opex_reduction_ict, other_benefits_2028,
                        total_benefits_2029, benefits_2029_margin_increase, benefits_2029_opex_reduction_business,
                        benefits_2029_opex_reduction_ict, other_benefits_2029,
                        total_benefits_2030, benefits_2030_margin_increase, benefits_2030_opex_reduction_business,
                        benefits_2030_opex_reduction_ict, other_benefits_2030,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into investment_memos - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} investment_memos ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating investment_memos: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_impacto_aatt(self) -> int:
        """
        Migrate impacto_aatt (AATT impact assessment).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Impacto AATT Migration ===")
        migration_id = self._log_migration_start('impacto_aatt', 'Master', 'Impacto AATT')

        try:
            df = self.readers['master'].read_impacto_aatt()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    tiene_impacto_en_aatt = row.get('tiene_impacto_en_aatt')
                    afecta_a_ut_red_mt_bt = row.get('afecta_a_ut_red_mt_bt')
                    afecta_om_cc = row.get('afecta_om_cc') or row.get('afecta_o&m_cc')
                    afecta_pm = row.get('afecta_pm') or row.get('afecta_p&m')
                    afecta_hseq = row.get('afecta_hseq')
                    afecta_inspecciones = row.get('afecta_inspecciones')
                    afecta_at = row.get('afecta_at')
                    comentarios = normalize_multiline_text(row.get('comentarios'))
                    unidad = row.get('unidad')
                    referente_bi = row.get('referente_bi')
                    it_partner = row.get('it_partner')
                    referente_b_unit = row.get('referente_b_unit')
                    porcentaje_avance_ict = normalize_currency(row.get('porcentaje_avance_ict'))

                    cursor.execute("""
                        INSERT OR REPLACE INTO impacto_aatt (
                            portfolio_id, tiene_impacto_en_aatt,
                            afecta_a_ut_red_mt_bt, afecta_om_cc,
                            afecta_pm, afecta_hseq, afecta_inspecciones, afecta_at,
                            comentarios, unidad,
                            referente_bi, it_partner, referente_b_unit,
                            porcentaje_avance_ict,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, tiene_impacto_en_aatt,
                        afecta_a_ut_red_mt_bt, afecta_om_cc,
                        afecta_pm, afecta_hseq, afecta_inspecciones, afecta_at,
                        comentarios, unidad,
                        referente_bi, it_partner, referente_b_unit,
                        porcentaje_avance_ict,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into impacto_aatt - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} impacto_aatt ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating impacto_aatt: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_transacciones(self) -> int:
        """
        Migrate transacciones (audit trail for portfolio changes).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Transacciones Migration ===")
        migration_id = self._log_migration_start('transacciones', 'Transacciones', 'Transacciones')

        try:
            df = self.readers['transacciones'].read_transacciones()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    # Get ID - skip if empty
                    id_val = row.get('id')
                    if pd.isna(id_val):
                        logger.debug(f"Row {idx}: Skipping - no id")
                        continue

                    logger.debug(f"Processing row {idx}: id={id_val}")

                    clave1 = normalize_portfolio_id(row.get('clave1'))
                    clave2 = normalize_portfolio_id(row.get('clave2'))
                    tabla = row.get('tabla')
                    campo_tabla = row.get('campo_tabla')
                    valor_nuevo = normalize_multiline_text(row.get('valor_nuevo'))
                    tipo_cambio = row.get('tipo_cambio')
                    estado_cambio = row.get('estado_cambio')
                    fecha_registro_cambio, _ = normalize_date(row.get('fecha_registro_cambio'))
                    fecha_ejecucion_cambio, _ = normalize_date(row.get('fecha_ejecucion_cambio'))
                    valor_antes_del_cambio = normalize_multiline_text(row.get('valor_antes_del_cambio'))
                    comentarios = normalize_multiline_text(row.get('comentarios'))

                    cursor.execute("""
                        INSERT OR REPLACE INTO transacciones (
                            id, clave1, clave2, tabla, campo_tabla, valor_nuevo,
                            tipo_cambio, estado_cambio, fecha_registro_cambio,
                            fecha_ejecucion_cambio, valor_antes_del_cambio,
                            comentarios, fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(id_val), clave1, clave2, tabla, campo_tabla, valor_nuevo,
                        tipo_cambio, estado_cambio, fecha_registro_cambio,
                        fecha_ejecucion_cambio, valor_antes_del_cambio,
                        comentarios, datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into transacciones - id={id_val}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} transacciones ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating transacciones: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_fichas(self) -> int:
        """
        Migrate fichas (card/sheet data for portfolio items).

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Fichas Migration ===")
        migration_id = self._log_migration_start('fichas', 'Fichas', 'Fichas')

        try:
            df = self.readers['fichas'].read_fichas()  # type: ignore
            logger.info(f"Read {len(df)} rows from Excel")
            logger.debug(f"Columns: {df.columns.tolist()}")

            cursor = self.conn.cursor()
            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = normalize_portfolio_id(row.get('portfolio_id'))
                    if not portfolio_id:
                        logger.debug(f"Row {idx}: Skipping - no portfolio_id")
                        continue

                    logger.debug(f"Processing row {idx}: portfolio_id={portfolio_id}")

                    fecha, _ = normalize_date(row.get('fecha'))
                    campo_ficha = row.get('campo_ficha')
                    subtitulo = row.get('subtitulo')
                    periodo = row.get('periodo')
                    # Handle periodo - convert to int if valid, None otherwise
                    if pd.notna(periodo):
                        try:
                            periodo = int(periodo)
                        except (ValueError, TypeError):
                            periodo = None
                    else:
                        periodo = None
                    valor = normalize_multiline_text(row.get('valor'))
                    procesado_beneficios = row.get('procesado_beneficios')

                    cursor.execute("""
                        INSERT INTO fichas (
                            portfolio_id, fecha, campo_ficha, subtitulo,
                            periodo, valor, procesado_beneficios,
                            fecha_creacion
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        portfolio_id, fecha, campo_ficha, subtitulo,
                        periodo, valor, procesado_beneficios,
                        datetime.now().isoformat()
                    ))

                    migrated += 1
                    logger.debug(f"Row {idx}: Successfully inserted into fichas - portfolio_id={portfolio_id}")

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate - {e}")
                    logger.error(f"Row {idx} data: {row.to_dict()}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)

            logger.info(f"[OK] Migrated {migrated} fichas ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating fichas: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def populate_parametros(self) -> int:
        """
        Populate parametros table with distinct values from source tables.

        For estado: inserts all 21 canonical values with explicit order,
        plus any additional values from hechos.estado with order=NULL.
        For anio: casts integer to text.
        For all others: inserts distinct non-NULL, non-empty values alphabetically.

        Returns:
            Total number of parametric values inserted
        """
        logger.info("=== Starting Parametric Tables Population ===")

        cursor = self.conn.cursor()

        # Truncate parametros table
        cursor.execute("DELETE FROM parametros")
        self.conn.commit()
        logger.info("Truncated parametros table")

        total = 0

        for param_name, source_table, source_column in PARAMETRIC_SOURCES:
            try:
                if param_name == 'estado':
                    # Insert all canonical estado values with explicit order
                    count = 0
                    for idx, valor in enumerate(ESTADO_ORDER, start=1):
                        cursor.execute(
                            "INSERT OR IGNORE INTO parametros (nombre_parametro, valor, orden) VALUES (?, ?, ?)",
                            (param_name, valor, idx)
                        )
                        count += 1

                    # Insert any additional values from hechos.estado not in canonical list
                    cursor.execute(f"""
                        SELECT DISTINCT {source_column} FROM {source_table}
                        WHERE {source_column} IS NOT NULL AND TRIM({source_column}) != ''
                    """)
                    for row in cursor.fetchall():
                        valor = row[0].strip() if isinstance(row[0], str) else str(row[0])
                        if valor and valor not in ESTADO_ORDER:
                            cursor.execute(
                                "INSERT OR IGNORE INTO parametros (nombre_parametro, valor, orden) VALUES (?, ?, NULL)",
                                (param_name, valor)
                            )
                            count += 1

                elif param_name == 'anio':
                    # Cast integer year to text
                    cursor.execute(f"""
                        SELECT DISTINCT CAST({source_column} AS TEXT) FROM {source_table}
                        WHERE {source_column} IS NOT NULL
                        ORDER BY {source_column}
                    """)
                    values = [row[0] for row in cursor.fetchall() if row[0] and row[0].strip()]
                    count = 0
                    for valor in values:
                        cursor.execute(
                            "INSERT OR IGNORE INTO parametros (nombre_parametro, valor, orden) VALUES (?, ?, NULL)",
                            (param_name, valor)
                        )
                        count += 1

                else:
                    # Standard: distinct non-NULL, non-empty values
                    cursor.execute(f"""
                        SELECT DISTINCT {source_column} FROM {source_table}
                        WHERE {source_column} IS NOT NULL AND TRIM({source_column}) != ''
                        ORDER BY {source_column}
                    """)
                    values = [row[0].strip() if isinstance(row[0], str) else str(row[0]) for row in cursor.fetchall()]
                    count = 0
                    for valor in values:
                        if valor:
                            cursor.execute(
                                "INSERT OR IGNORE INTO parametros (nombre_parametro, valor, orden) VALUES (?, ?, NULL)",
                                (param_name, valor)
                            )
                            count += 1

                self.conn.commit()
                total += count
                logger.info(f"  Parametro '{param_name}': {count} values")

            except Exception as e:
                logger.error(f"  Error populating parametro '{param_name}': {e}")

        logger.info(f"[OK] Total parametric values inserted: {total}")
        return total

    def migrate_all(self) -> Dict[str, int]:
        """
        Run full migration in correct sequence.

        Returns:
            Dictionary of table_name -> rows_migrated
        """
        logger.info("=" * 60)
        logger.info("Starting Full Portfolio Migration")
        logger.info("=" * 60)

        results = {}
        start_time = datetime.now()

        try:
            # Phase 1: Master data
            logger.info("### PHASE 1: Master Data ###")
            results['grupos_iniciativas'] = self.migrate_grupos_iniciativas()

            # Phase 2: Core entities
            logger.info("### PHASE 2: Core Entities ###")
            results['iniciativas'] = self.migrate_iniciativas()
            results['datos_descriptivos'] = self.migrate_datos_descriptivos()

            # Phase 3: Financial data
            logger.info("### PHASE 3: Financial Data ###")
            results['informacion_economica'] = self.migrate_informacion_economica()
            results['facturacion'] = self.migrate_facturacion()

            # Phase 4: Operational data
            logger.info("### PHASE 4: Operational Data ###")
            results['datos_ejecucion'] = self.migrate_datos_ejecucion()
            results['hechos'] = self.migrate_hechos()
            results['beneficios'] = self.migrate_beneficios()
            results['etiquetas'] = self.migrate_etiquetas()
            results['justificaciones'] = self.migrate_justificaciones()

            # Phase 5: Supporting data
            logger.info("### PHASE 5: Supporting Data ###")
            results['ltp'] = self.migrate_ltp()
            results['wbes'] = self.migrate_wbes()
            results['dependencias'] = self.migrate_dependencias()

            # Phase 6: Additional tables (Feature 03)
            logger.info("### PHASE 6: Additional Tables ###")
            results['notas'] = self.migrate_notas()
            results['avance'] = self.migrate_avance()
            results['acciones'] = self.migrate_acciones()
            results['descripciones'] = self.migrate_descripciones()
            results['estado_especial'] = self.migrate_estado_especial()
            results['investment_memos'] = self.migrate_investment_memos()
            results['impacto_aatt'] = self.migrate_impacto_aatt()

            # Phase 7: Audit data (Feature 08)
            logger.info("### PHASE 7: Audit Data ###")
            results['transacciones'] = self.migrate_transacciones()

            # Phase 8: Fichas data (Feature 09)
            logger.info("### PHASE 8: Fichas Data ###")
            results['fichas'] = self.migrate_fichas()

            # Phase 9: Parametric data (Feature 037)
            logger.info("### PHASE 9: Parametric Data ###")
            results['parametros'] = self.populate_parametros()

            # Phase 10: Document data (Feature 047)
            logger.info("### PHASE 10: Document Data ###")
            results['documentos'] = self.migrate_documentos()
            results['documentos_items'] = self.migrate_documentos_items()

            # Summary
            duration = (datetime.now() - start_time).total_seconds()

            logger.info("=" * 60)
            logger.info("Migration Summary")
            logger.info("=" * 60)

            total_migrated = 0
            for table, count in results.items():
                logger.info(f"  {table:30s}: {count:6d} rows")
                total_migrated += count

            logger.info("-" * 60)
            logger.info(f"  {'TOTAL':30s}: {total_migrated:6d} rows")
            logger.info(f"  Duration: {duration:.1f} seconds")
            logger.info("=" * 60)

            return results

        except Exception as e:
            logger.exception(f"Migration failed: {e}")
            raise

    def migrate_documentos(self) -> int:
        """
        Migrate documentos from Excel file.

        Reads from DOCUMENTOS_IMPORT_PATH and loads into the documentos table.

        Returns:
            Number of rows migrated
        """
        logger.info("=== Starting Documentos Migration ===")
        migration_id = self._log_migration_start('documentos', 'PortfolioDigital_Documentos', 'Documentos')

        try:
            import_path = Path(config.DOCUMENTOS_IMPORT_PATH)
            if not import_path.exists():
                logger.warning(f"Documentos import file not found: {import_path}, skipping migration")
                self._log_migration_end(migration_id, 0, 0, 0, 'SKIPPED', f'File not found: {import_path}')
                return 0

            logger.info(f"Reading documentos from: {import_path}")

            # Build reverse mapping from Excel header -> DB column
            from src.summarize.excel_export import DOCUMENTOS_COLUMN_MAPPING
            expected_headers = set(DOCUMENTOS_COLUMN_MAPPING.values())

            # Auto-detect header row (Excel file may have a title row before actual headers)
            df_raw = pd.read_excel(import_path, sheet_name=config.DOCUMENTOS_EXPORT_WORKSHEET, header=None)
            header_row = 0
            for i in range(min(10, len(df_raw))):
                row_values = {str(v).strip() for v in df_raw.iloc[i] if pd.notna(v)}
                matches = row_values & expected_headers
                if len(matches) >= 3:  # At least 3 expected headers found
                    header_row = i
                    break

            if header_row > 0:
                logger.info(f"Detected header row at index {header_row} (skipping {header_row} title row(s))")

            # Re-read with correct header row
            df = pd.read_excel(import_path, sheet_name=config.DOCUMENTOS_EXPORT_WORKSHEET, header=header_row)
            logger.info(f"Read {len(df)} rows from Excel (columns: {list(df.columns)})")

            # Normalize column names
            df.columns = [c.strip().lower().replace(' ', '_').replace('á', 'a').replace('é', 'e')
                          .replace('í', 'i').replace('ó', 'o').replace('ú', 'u') for c in df.columns]

            excel_to_db = {v.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e')
                           .replace('í', 'i').replace('ó', 'o').replace('ú', 'u'): k
                           for k, v in DOCUMENTOS_COLUMN_MAPPING.items()}

            # Rename columns using mapping
            rename_map = {}
            for col in df.columns:
                if col in excel_to_db:
                    rename_map[col] = excel_to_db[col]
            df = df.rename(columns=rename_map)
            logger.debug(f"Mapped columns: {list(df.columns)}")

            cursor = self.conn.cursor()

            # Clear existing data
            cursor.execute("DELETE FROM documentos_items")  # Clear child table first (FK)
            cursor.execute("DELETE FROM documentos")
            self.conn.commit()
            logger.info("Cleared existing documentos and documentos_items data")

            migrated = 0
            errors = 0
            skip_no_fichero = 0
            skip_no_portfolio = 0

            db_columns = ['nombre_fichero', 'portfolio_id', 'tipo_documento', 'enlace_documento',
                          'estado_proceso_documento', 'resumen_documento', 'ruta_documento',
                          'tokens_input', 'tokens_output', 'fecha_creacion', 'fecha_actualizacion']

            # Log first row for diagnostics
            if len(df) > 0:
                first = df.iloc[0]
                logger.info(f"First row sample: nombre_fichero={first.get('nombre_fichero')!r}, portfolio_id={first.get('portfolio_id')!r}")

            for idx, row in df.iterrows():
                try:
                    nombre_fichero = row.get('nombre_fichero')
                    if pd.isna(nombre_fichero) or not str(nombre_fichero).strip():
                        skip_no_fichero += 1
                        continue

                    values = {}
                    for col in db_columns:
                        val = row.get(col)
                        if pd.isna(val):
                            values[col] = None
                        else:
                            values[col] = val

                    # Ensure required fields
                    if not values.get('portfolio_id'):
                        skip_no_portfolio += 1
                        continue
                    if not values.get('tipo_documento'):
                        values['tipo_documento'] = 'Desconocido'
                    if not values.get('estado_proceso_documento'):
                        values['estado_proceso_documento'] = 'Pendiente'

                    # Convert token counts to int if present
                    for tk in ('tokens_input', 'tokens_output'):
                        if values[tk] is not None:
                            try:
                                values[tk] = int(values[tk])
                            except (ValueError, TypeError):
                                values[tk] = None

                    # Convert Timestamp dates to ISO strings for SQLite
                    for dt_col in ('fecha_creacion', 'fecha_actualizacion'):
                        if values[dt_col] is not None and hasattr(values[dt_col], 'isoformat'):
                            values[dt_col] = values[dt_col].isoformat()

                    placeholders = ', '.join(['?'] * len(db_columns))
                    col_names = ', '.join(db_columns)
                    cursor.execute(
                        f"INSERT OR REPLACE INTO documentos ({col_names}) VALUES ({placeholders})",
                        [values[c] for c in db_columns]
                    )
                    migrated += 1

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to migrate documento - {e}")

            self.conn.commit()
            if skip_no_fichero or skip_no_portfolio:
                logger.info(f"Skipped rows: {skip_no_fichero} no nombre_fichero, {skip_no_portfolio} no portfolio_id")
            self._log_migration_end(migration_id, len(df), migrated, errors)
            logger.info(f"Migrated {migrated} documentos ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error migrating documentos: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def migrate_documentos_items(self) -> int:
        """
        Migrate documentos_items from Excel or generate from resumen_documento JSON.

        If DOCUMENTOS_ITEMS_IMPORT_PATH exists, imports from Excel.
        Otherwise, generates by expanding resumen_documento JSON from documentos table.

        Returns:
            Number of rows created
        """
        logger.info("=== Starting Documentos Items Migration ===")

        import_path = Path(config.DOCUMENTOS_ITEMS_IMPORT_PATH)

        if import_path.exists():
            result = self._import_documentos_items_from_excel(import_path)
            if result > 0:
                return result
            logger.info("Excel import yielded 0 rows, falling back to JSON generation")

        if not import_path.exists():
            logger.info(f"Import file not found: {import_path}, generating from resumen_documento JSON")

        return self._generate_documentos_items()

    def _import_documentos_items_from_excel(self, import_path: Path) -> int:
        """Import documentos_items from Excel file."""
        migration_id = self._log_migration_start('documentos_items', str(import_path.name), 'Documentos_Items')

        try:
            logger.info(f"Reading documentos_items from: {import_path}")

            # Auto-detect header row (file may have title rows)
            expected_headers = {'portfolio_id', 'nombre_fichero', 'tipo_documento', 'tipo_registro', 'texto',
                                'Portfolio ID', 'Nombre Fichero', 'Tipo Documento', 'Tipo Registro', 'Texto'}
            df_raw = pd.read_excel(import_path, sheet_name=0, header=None)
            header_row = 0
            for i in range(min(10, len(df_raw))):
                row_values = {str(v).strip() for v in df_raw.iloc[i] if pd.notna(v)}
                if len(row_values & expected_headers) >= 3:
                    header_row = i
                    break
            if header_row > 0:
                logger.info(f"Detected header row at index {header_row}")

            df = pd.read_excel(import_path, sheet_name=0, header=header_row)
            logger.info(f"Read {len(df)} rows from Excel")

            # Normalize column names
            df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

            cursor = self.conn.cursor()
            cursor.execute("DELETE FROM documentos_items")
            self.conn.commit()

            migrated = 0
            errors = 0

            for idx, row in df.iterrows():
                try:
                    portfolio_id = row.get('portfolio_id')
                    nombre_fichero = row.get('nombre_fichero')
                    tipo_documento = row.get('tipo_documento')
                    tipo_registro = row.get('tipo_registro')
                    texto = row.get('texto')

                    if pd.isna(portfolio_id) or pd.isna(nombre_fichero) or pd.isna(tipo_registro):
                        continue

                    cursor.execute(
                        "INSERT INTO documentos_items (portfolio_id, nombre_fichero, tipo_documento, tipo_registro, texto) VALUES (?, ?, ?, ?, ?)",
                        (str(portfolio_id), str(nombre_fichero),
                         str(tipo_documento) if not pd.isna(tipo_documento) else '',
                         str(tipo_registro), str(texto) if not pd.isna(texto) else None)
                    )
                    migrated += 1

                except Exception as e:
                    errors += 1
                    logger.error(f"Row {idx}: Failed to import documentos_item - {e}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(df), migrated, errors)
            logger.info(f"[OK] Imported {migrated} documentos_items from Excel ({errors} errors)")
            return migrated

        except Exception as e:
            logger.exception(f"Fatal error importing documentos_items: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def _generate_documentos_items(self) -> int:
        """Generate documentos_items by expanding resumen_documento JSON."""
        import json

        migration_id = self._log_migration_start('documentos_items', 'documentos.resumen_documento', 'JSON expansion')

        try:
            cursor = self.conn.cursor()
            cursor.execute("DELETE FROM documentos_items")

            cursor.execute("""
                SELECT portfolio_id, nombre_fichero, tipo_documento, resumen_documento
                FROM documentos
                WHERE resumen_documento IS NOT NULL AND resumen_documento != ''
            """)
            rows = cursor.fetchall()
            logger.info(f"Found {len(rows)} documentos with resumen_documento")

            total_items = 0
            errors = 0

            for portfolio_id, nombre_fichero, tipo_documento, resumen_json in rows:
                try:
                    data = json.loads(resumen_json)
                    if not isinstance(data, dict):
                        continue

                    # Skip error entries
                    if 'error' in data and len(data) == 1:
                        continue

                    for key, value in data.items():
                        if value is None or value == '':
                            continue

                        if isinstance(value, list):
                            texto = '\n'.join(str(item) for item in value if item)
                        else:
                            texto = str(value)

                        if not texto.strip():
                            continue

                        cursor.execute(
                            "INSERT INTO documentos_items (portfolio_id, nombre_fichero, tipo_documento, tipo_registro, texto) VALUES (?, ?, ?, ?, ?)",
                            (portfolio_id, nombre_fichero, tipo_documento, key, texto)
                        )
                        total_items += 1

                except (json.JSONDecodeError, TypeError) as e:
                    errors += 1
                    logger.warning(f"Failed to parse resumen_documento for {nombre_fichero}: {e}")

            self.conn.commit()
            self._log_migration_end(migration_id, len(rows), total_items, errors)
            logger.info(f"[OK] Generated {total_items} documentos_items from {len(rows)} documents ({errors} errors)")
            return total_items

        except Exception as e:
            logger.exception(f"Fatal error generating documentos_items: {e}")
            self._log_migration_end(migration_id, 0, 0, 0, 'ERROR', str(e))
            raise

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")


def migrate_all(db_path: str, excel_dir: str = None) -> Dict[str, int]: # type: ignore
    """
    Main entry point for migration.

    Args:
        db_path: Path to SQLite database
        excel_dir: Directory containing Excel files

    Returns:
        Dictionary of migration results
    """
    engine = MigrationEngine(db_path, excel_dir)

    try:
        results = engine.migrate_all()
        return results
    finally:
        engine.close()


if __name__ == "__main__":
    import sys

    db_path = sys.argv[1] if len(sys.argv) > 1 else "portfolio.db"

    logger.info(f"Migrating to database: {db_path}")

    results = migrate_all(db_path)

    logger.info("\n[OK] Migration completed successfully!")
