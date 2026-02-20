-- ============================================================================
-- Portfolio Migration Database Schema
-- SQLite database for portfolio management with Spanish column names
-- ============================================================================

-- Enable foreign key enforcement
PRAGMA foreign_keys = ON;

-- Use WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Optimize cache (64MB)
PRAGMA cache_size = -64000;

-- ============================================================================
-- CORE ENTITY TABLES
-- ============================================================================

-- Main portfolio initiatives table
-- Source: Query Datos Relevantes (61 columns)
-- Mapping: EXACT 1:1
CREATE TABLE iniciativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL UNIQUE,
    nombre TEXT,
    unidad TEXT,
    origen TEXT,
    digital_framework_level_1 TEXT,
    prioridad_descriptiva TEXT,
    cluster TEXT,
    estado_de_la_iniciativa TEXT,
    fecha_de_ultimo_estado TEXT, -- ISO 8601
    estado_de_la_iniciativa_2026 TEXT,
    estado_aprobacion TEXT,
    estado_ejecucion TEXT,
    priorizacion TEXT,
    en_presupuesto_del_ano TEXT,
    tipo TEXT,
    budget_2024 REAL,
    importe_sm200_24 REAL,
    importe_aprobado_2024 REAL,
    importe_citetic_24 REAL,
    importe_facturacion_2024 REAL,
    importe_2024 REAL,
    budget_2025 REAL,
    importe_sm200_2025 REAL,
    importe_aprobado_2025 REAL,
    importe_facturacion_2025 REAL,
    importe_2025 REAL,
    importe_2025_cc_re REAL,
    calidad_valoracion TEXT,
    budget_2026 REAL,
    importe_sm200_2026 REAL,
    importe_aprobado_2026 REAL,
    importe_facturacion_2026 REAL,
    importe_2026 REAL,
    budget_2027 REAL,
    importe_sm200_2027 REAL,
    importe_aprobado_2027 REAL,
    importe_facturacion_2027 REAL,
    importe_2027 REAL,
    importe_2028 REAL,
    estado_agrupado TEXT,
    siguiente_accion TEXT,
    referente_negocio TEXT,
    estado_dashboard TEXT,
    referente_bi TEXT,
    jira_id TEXT,
    it_partner TEXT,
    referente_ict TEXT,
    capex_opex TEXT,
    cini TEXT,
    fecha_prevista_pes TEXT, -- ISO 8601
    tipo_agrupacion TEXT,
    nuevo_importe_2025 REAL,
    estado_requisito_legal TEXT,
    cluster_de_antes_de_1906 TEXT,
    fecha_sm100 TEXT, -- ISO 8601
    fecha_aprobada_con_cct TEXT, -- ISO 8601
    fecha_en_ejecucion TEXT, -- ISO 8601
    diferencia_apr_eje_exc_ept REAL,
    esta_en_los_206_me_de_2026 TEXT,
    fecha_limite TEXT, -- ISO 8601
    fecha_limite_comentarios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME
);

CREATE INDEX idx_iniciativas_portfolio ON iniciativas (portfolio_id);

CREATE INDEX idx_iniciativas_estado ON iniciativas (estado_de_la_iniciativa);

CREATE INDEX idx_iniciativas_cluster ON iniciativas (cluster);

-- ============================================================================
-- REMOVED: personas table (not needed for migration)
-- ============================================================================

-- Descriptive data for initiatives
-- Source: Master workbook, sheet "Datos descriptivos"
CREATE TABLE datos_descriptivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    nombre TEXT,
    unidad TEXT,
    origen TEXT,
    digital_framework_level_1 TEXT,
    prioridad_descriptiva_bi TEXT,
    priorizacion TEXT,
    tipo_proyecto TEXT,
    referente_bi TEXT,
    referente_b_unit TEXT,
    referente_enabler_ict TEXT,
    it_partner TEXT,
    codigo_jira TEXT,
    cluster TEXT,
    tipo_agrupacion TEXT,
    cluster_2025_antes_de_19062025 TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_datos_descriptivos_portfolio ON datos_descriptivos (portfolio_id);

-- ============================================================================

-- Justifications for initiatives
-- Source: Master workbook, sheet "Justificaciones"
CREATE TABLE justificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    tipo_justificacion TEXT,
    valor TEXT,
    fecha_modificacion TEXT, -- ISO 8601 format (YYYY-MM-DD)
    origen_registro TEXT,
    comentarios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    UNIQUE (
        portfolio_id,
        tipo_justificacion
    ) -- One justification per type per portfolio item
);

CREATE INDEX idx_justificaciones_portfolio ON justificaciones (portfolio_id);

CREATE INDEX idx_justificaciones_tipo ON justificaciones (tipo_justificacion);

-- ============================================================================

-- Initiative groups with hierarchy
-- Source: Grupos Iniciativas (12 columns - hierarchical)
-- Mapping: Store both grupo and componente info
CREATE TABLE grupos_iniciativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id_grupo TEXT,
    portfolio_id_componente TEXT,
    nombre_grupo TEXT,
    tipo_agrupacion_grupo TEXT,
    tipo_agrupacion_componente TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    UNIQUE (
        portfolio_id_grupo,
        portfolio_id_componente
    )
);

CREATE INDEX idx_grupos_grupo ON grupos_iniciativas (portfolio_id_grupo);

CREATE INDEX idx_grupos_componente ON grupos_iniciativas (portfolio_id_componente);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Economic information
-- Source: Master workbook, sheet "Información Económica"
CREATE TABLE informacion_economica (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    cini TEXT,
    capex_opex TEXT,
    fecha_prevista_pes TEXT, -- ISO 8601 format (YYYY-MM-DD)
    wbe TEXT,
    cluster TEXT,
    finalidad_budget TEXT,
    proyecto_especial TEXT,
    clasificacion TEXT,
    tlc TEXT,
    tipo_inversion TEXT,
    observaciones TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    UNIQUE (portfolio_id) -- One economic record per portfolio item
);

CREATE INDEX idx_informacion_economica_portfolio ON informacion_economica (portfolio_id);

-- ============================================================================

-- Billing records
-- Source: Master workbook, sheet "Facturación"
CREATE TABLE facturacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    ano INTEGER,
    mes TEXT, -- Month name or number
    importe REAL,
    concepto_factura TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_facturacion_portfolio ON facturacion (portfolio_id);

CREATE INDEX idx_facturacion_periodo ON facturacion (ano, mes);

CREATE INDEX idx_facturacion_ano ON facturacion (ano);

-- Execution/milestone data
-- Source: Datos ejecución (16 columns, skiprows=1)
-- Mapping: EXACT 1:1
CREATE TABLE datos_ejecucion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    fecha_de_ultimo_estado TEXT, -- ISO 8601
    fecha_inicio TEXT, -- ISO 8601
    fecha_uat TEXT, -- ISO 8601
    fecha_fin TEXT, -- ISO 8601
    porcentaje_avance REAL,
    en_retraso TEXT,
    porcentaje_facturacion REAL,
    comentarios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_datos_ejecucion_portfolio ON datos_ejecucion (portfolio_id);

-- ============================================================================

-- Detailed fact records
-- Source: Master workbook, sheet "Hechos"
CREATE TABLE hechos (
    id_hecho INTEGER PRIMARY KEY, -- Using ID from Excel as primary key
    portfolio_id TEXT NOT NULL,
    partida_presupuestaria TEXT,
    importe REAL,
    estado TEXT,
    fecha TEXT, -- ISO 8601 format (YYYY-MM-DD)
    importe_ri REAL,
    importe_re REAL,
    notas TEXT,
    racional TEXT,
    calidad_estimacion TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_hechos_portfolio ON hechos (portfolio_id);

CREATE INDEX idx_hechos_fecha ON hechos (fecha);

CREATE INDEX idx_hechos_estado ON hechos (estado);

CREATE INDEX idx_hechos_portfolio_estado ON hechos (portfolio_id, estado);

-- ============================================================================

-- Benefits (normalized from sparse matrix)
-- Source: Beneficios sheets (12 columns)
-- Mapping: EXACT 1:1 (not denormalized)
CREATE TABLE beneficios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    grupo TEXT,
    concepto TEXT,
    periodo TEXT,
    importe REAL,
    valor REAL,
    texto TEXT,
    origen TEXT,
    fecha_modificacion TEXT, -- ISO 8601
    columna_tablon TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_beneficios_portfolio ON beneficios (portfolio_id);

CREATE INDEX idx_beneficios_concepto ON beneficios (concepto);

-- ============================================================================
-- SUPPORTING TABLES
-- ============================================================================

-- Tag/label assignments
-- Source: Master workbook, sheet "Etiquetas"
CREATE TABLE etiquetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    etiqueta TEXT,
    valor TEXT,
    fecha_modificacion TEXT, -- ISO 8601 format (YYYY-MM-DD)
    origen_registro TEXT,
    comentarios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    UNIQUE (portfolio_id, etiqueta) -- One value per tag per portfolio item
);

CREATE INDEX idx_etiquetas_portfolio ON etiquetas (portfolio_id);

CREATE INDEX idx_etiquetas_etiqueta ON etiquetas (etiqueta);

-- ============================================================================

-- Pending tasks (in Spanish Línea Tareas Pendientes - LTP)
CREATE TABLE ltp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    responsable TEXT,
    tarea TEXT,
    siguiente_accion TEXT, -- ISO 8601
    fecha_creacion TEXT, -- ISO 8601
    estado TEXT,
    comentarios TEXT,
    -- Audit
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_ltp_portfolio ON ltp (portfolio_id);

-- ============================================================================

-- SAP WBEs
CREATE TABLE wbes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    anio INTEGER,
    wbe_pyb TEXT,
    descripcion_pyb TEXT,
    wbe_can TEXT,
    descripcion_can TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    UNIQUE (portfolio_id, anio)
);

CREATE INDEX idx_wbes_portfolio ON wbes (portfolio_id);

-- ============================================================================
-- DEPENDENCIAS (Feature 017)
-- ============================================================================

-- Dependencies between initiatives
-- Source: PortfolioDigital_Master.xlsm, sheet "Dependencias"
CREATE TABLE dependencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    descripcion_dependencia TEXT,
    fecha_dependencia TEXT, -- ISO 8601
    comentarios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_dependencias_portfolio ON dependencias (portfolio_id);

-- ============================================================================
-- REMOVED: iniciativas_metodologia table (not needed for migration)
-- ============================================================================
-- REMOVED: administrador table (not needed for migration)
-- ============================================================================
-- AUDIT TABLES
-- ============================================================================
-- REMOVED: tabla_metadata table (not needed for migration)
-- ============================================================================

-- ============================================================================
-- AUDIT TRAIL (Feature 08)
-- ============================================================================

-- Audit trail for portfolio changes
-- Source: PortfolioDigital_Transacciones.xlsm, sheet "Transacciones"
CREATE TABLE transacciones (
    id INTEGER PRIMARY KEY,  -- Using ID from Excel as primary key
    clave1 TEXT,             -- Primary key (usually portfolio_id)
    clave2 TEXT,             -- Secondary key (optional)
    tabla TEXT,              -- Target table name
    campo_tabla TEXT,        -- Field being changed
    valor_nuevo TEXT,        -- New value after change
    tipo_cambio TEXT,        -- Change type: UPDATE, UPSERT, INSERT
    estado_cambio TEXT,      -- Change status: EJECUTADO, ERROR, PENDIENTE
    fecha_registro_cambio TEXT,   -- ISO 8601
    fecha_ejecucion_cambio TEXT,  -- ISO 8601
    valor_antes_del_cambio TEXT,  -- Value before change
    comentarios TEXT,        -- Comments
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME
);

CREATE INDEX idx_transacciones_clave1 ON transacciones (clave1);
CREATE INDEX idx_transacciones_tabla ON transacciones (tabla);
CREATE INDEX idx_transacciones_estado ON transacciones (estado_cambio);
CREATE INDEX idx_transacciones_fecha_registro ON transacciones (fecha_registro_cambio);

-- ============================================================================
-- FICHAS DATA (Feature 09)
-- ============================================================================

-- Card/sheet data for portfolio items
-- Source: PortfolioDigital_Fichas.xlsm, sheet "Fichas"
CREATE TABLE fichas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    fecha TEXT,                  -- ISO 8601
    campo_ficha TEXT,
    subtitulo TEXT,
    periodo INTEGER,
    valor TEXT,
    procesado_beneficios TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_fichas_portfolio ON fichas (portfolio_id);
CREATE INDEX idx_fichas_campo ON fichas (campo_ficha);
CREATE INDEX idx_fichas_fecha ON fichas (fecha);

-- ============================================================================
-- REMOVED: calidad_datos table (not needed for migration)
-- ============================================================================
-- COMPUTED TABLES
-- ============================================================================

-- Calculated/derived data for reporting (Feature 02)
-- Consolidates data from datos_descriptivos, informacion_economica, hechos
-- Refreshed via CLI command: calculate_datos_relevantes
CREATE TABLE datos_relevantes (
    portfolio_id TEXT PRIMARY KEY,

    -- Lookups from datos_descriptivos
    nombre TEXT,
    unidad TEXT,
    origen TEXT,
    digital_framework_level_1 TEXT,
    prioridad_descriptiva TEXT,
    cluster TEXT,
    priorizacion TEXT,
    tipo TEXT,
    referente_negocio TEXT,
    referente_bi TEXT,
    jira_id TEXT,
    it_partner TEXT,
    referente_ict TEXT,
    tipo_agrupacion TEXT,

    -- Lookups from informacion_economica
    capex_opex TEXT,
    cini TEXT,
    fecha_prevista_pes TEXT,  -- ISO 8601

    -- Calculated: Estado functions
    estado_de_la_iniciativa TEXT,
    fecha_de_ultimo_estado TEXT,
    estado_de_la_iniciativa_2026 TEXT,
    estado_aprobacion TEXT,
    estado_ejecucion TEXT,
    estado_agrupado TEXT,
    estado_dashboard TEXT,
    estado_requisito_legal TEXT,
    estado_sm100 TEXT,
    estado_sm200 TEXT,
    iniciativa_aprobada TEXT,
    iniciativa_cerrada_economicamente TEXT,
    activo_ejercicio_actual TEXT,

    -- Calculated: Financial - 2024
    budget_2024 REAL,
    importe_sm200_24 REAL,
    importe_aprobado_2024 REAL,
    importe_citetic_24 REAL,
    importe_facturacion_2024 REAL,
    importe_2024 REAL,

    -- Calculated: Financial - 2025
    budget_2025 REAL,
    importe_sm200_2025 REAL,
    importe_aprobado_2025 REAL,
    importe_facturacion_2025 REAL,
    importe_2025 REAL,
    importe_2025_cc_re REAL,
    nuevo_importe_2025 REAL,  -- Always 0

    -- Calculated: Financial - 2026
    budget_2026 REAL,
    importe_sm200_2026 REAL,
    importe_aprobado_2026 REAL,
    importe_facturacion_2026 REAL,
    importe_2026 REAL,

    -- Calculated: Financial - 2027
    budget_2027 REAL,
    importe_sm200_2027 REAL,
    importe_aprobado_2027 REAL,
    importe_facturacion_2027 REAL,
    importe_2027 REAL,

    -- Calculated: Financial - 2028
    importe_2028 REAL,

    -- Calculated: Other functions
    en_presupuesto_del_ano TEXT,
    calidad_valoracion TEXT,
    siguiente_accion TEXT,
    esta_en_los_206_me_de_2026 TEXT,

    -- Calculated: Date functions
    fecha_sm100 TEXT,  -- ISO 8601
    fecha_aprobada_con_cct TEXT,  -- ISO 8601
    fecha_en_ejecucion TEXT,  -- ISO 8601
    fecha_limite TEXT,  -- ISO 8601
    fecha_limite_comentarios TEXT,

    -- Calculated: Other
    diferencia_apr_eje_exc_ept REAL,
    cluster_de_antes_de_1906 TEXT,  -- Always ""

    -- Metadata
    fecha_calculo DATETIME DEFAULT CURRENT_TIMESTAMP
    -- Note: No FK constraint as datos_descriptivos.portfolio_id is not unique
);

CREATE INDEX IF NOT EXISTS idx_datos_relevantes_estado ON datos_relevantes(estado_de_la_iniciativa);
CREATE INDEX IF NOT EXISTS idx_datos_relevantes_cluster ON datos_relevantes(cluster);
CREATE INDEX IF NOT EXISTS idx_datos_relevantes_unidad ON datos_relevantes(unidad);
CREATE INDEX IF NOT EXISTS idx_datos_relevantes_tipo ON datos_relevantes(tipo);
CREATE INDEX IF NOT EXISTS idx_datos_relevantes_capex_opex ON datos_relevantes(capex_opex);

-- ============================================================================
-- ADDITIONAL TABLES (Feature 03)
-- ============================================================================

-- Notes for initiatives
-- Source: Master workbook, sheet "Notas"
CREATE TABLE notas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    registrado_por TEXT,
    fecha TEXT,  -- ISO 8601
    nota TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_notas_portfolio ON notas (portfolio_id);

-- ============================================================================

-- Progress tracking for initiatives
-- Source: Master workbook, sheet "Avance" (skiprows=0)
CREATE TABLE avance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    fecha_introduccion TEXT,  -- ISO 8601
    anio INTEGER,
    mes TEXT,
    fecha_inicio TEXT,  -- ISO 8601
    fecha_uat TEXT,  -- ISO 8601
    fecha_fin_prevista TEXT,  -- ISO 8601
    avance_2025 REAL,
    comentario TEXT,
    error_fecha_inicio TEXT,
    error_fecha_uat TEXT,
    error_fecha_fin_prevista TEXT,
    error_avance TEXT,
    tiene_error TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_avance_portfolio ON avance (portfolio_id);

-- ============================================================================

-- Actions for initiatives
-- Source: Master workbook, sheet "Acciones"
CREATE TABLE acciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    siguiente_accion TEXT,
    siguiente_accion_comentarios TEXT,
    comentarios TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_acciones_portfolio ON acciones (portfolio_id);

-- ============================================================================

-- Descriptions for initiatives (multiple types per initiative)
-- Source: Master workbook, sheet "Descripciones"
CREATE TABLE descripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    tipo_descripcion TEXT,
    descripcion TEXT,
    fecha_modificacion TEXT,  -- ISO 8601
    origen_registro TEXT,
    comentarios TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    UNIQUE (portfolio_id, tipo_descripcion)
);

CREATE INDEX idx_descripciones_portfolio ON descripciones (portfolio_id);

-- ============================================================================

-- Special status for initiatives
-- Source: Master workbook, sheet "Estado Especial"
CREATE TABLE estado_especial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL UNIQUE,
    estado_especial TEXT,
    fecha_modificacion TEXT,  -- ISO 8601
    comentarios TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_estado_especial_portfolio ON estado_especial (portfolio_id);

-- ============================================================================

-- Investment Memo tracking
-- Source: Master workbook, sheet "IM"
CREATE TABLE investment_memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_investment_memo_aprobado TEXT,  -- ISO 8601
    new_capex_dev REAL,
    new_capex_maint REAL,
    new_opex_ict REAL,
    referente_negocio TEXT,
    link_im TEXT,
    fecha_inicio_proyecto TEXT,  -- ISO 8601
    fecha_final_proyecto TEXT,  -- ISO 8601
    estado_proyecto TEXT,
    -- Investment columns
    investment_2024 REAL,
    investment_2025 REAL,
    investment_2026 REAL,
    investment_2027 REAL,
    investment_2028 REAL,
    investment_2029 REAL,
    investment_2030 REAL,
    -- Benefits 2024
    benefits_2024 REAL,
    benefits_2024_margin_increase REAL,
    benefits_2024_opex_reduction_business REAL,
    benefits_2024_opex_reduction_ict REAL,
    other_benefits_2024 REAL,
    -- Benefits 2025
    benefits_2025 REAL,
    benefits_2025_margin_increase REAL,
    benefits_2025_opex_reduction_business REAL,
    benefits_2025_opex_reduction_ict REAL,
    other_benefits_2025 REAL,
    -- Benefits 2026
    benefits_2026 REAL,
    benefits_2026_margin_increase REAL,
    benefits_2026_opex_reduction_business REAL,
    benefits_2026_opex_reduction_ict REAL,
    other_benefits_2026 REAL,
    -- Benefits 2027
    total_benefits_2027 REAL,
    benefits_2027_margin_increase REAL,
    benefits_2027_opex_reduction_business REAL,
    benefits_2027_opex_reduction_ict REAL,
    other_benefits_2027 REAL,
    -- Benefits 2028
    total_benefits_2028 REAL,
    benefits_2028_margin_increase REAL,
    benefits_2028_opex_reduction_business REAL,
    benefits_2028_opex_reduction_ict REAL,
    other_benefits_2028 REAL,
    -- Benefits 2029
    total_benefits_2029 REAL,
    benefits_2029_margin_increase REAL,
    benefits_2029_opex_reduction_business REAL,
    benefits_2029_opex_reduction_ict REAL,
    other_benefits_2029 REAL,
    -- Benefits 2030
    total_benefits_2030 REAL,
    benefits_2030_margin_increase REAL,
    benefits_2030_opex_reduction_business REAL,
    benefits_2030_opex_reduction_ict REAL,
    other_benefits_2030 REAL,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_investment_memos_portfolio ON investment_memos (portfolio_id);

-- ============================================================================

-- AATT Impact assessment
-- Source: Master workbook, sheet "Impacto AATT"
CREATE TABLE impacto_aatt (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL UNIQUE,
    tiene_impacto_en_aatt TEXT,
    afecta_a_ut_red_mt_bt TEXT,
    afecta_om_cc TEXT,
    afecta_pm TEXT,
    afecta_hseq TEXT,
    afecta_inspecciones TEXT,
    afecta_at TEXT,
    comentarios TEXT,
    unidad TEXT,
    referente_bi TEXT,
    it_partner TEXT,
    referente_b_unit TEXT,
    porcentaje_avance_ict REAL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE
);

CREATE INDEX idx_impacto_aatt_portfolio ON impacto_aatt (portfolio_id);

-- ============================================================================
-- MIGRATION METADATA
-- ============================================================================

-- Track migration progress and statistics
CREATE TABLE migracion_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tabla_destino TEXT NOT NULL,
    archivo_origen TEXT NOT NULL,
    hoja_origen TEXT NOT NULL,
    -- Statistics
    filas_origen INTEGER,
    filas_migradas INTEGER,
    filas_error INTEGER,
    -- Timing
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    duracion_segundos REAL,
    -- Status
    estado TEXT,
    mensaje_error TEXT,
    -- Audit
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        estado IN (
            'EN_PROGRESO',
            'COMPLETADO',
            'ERROR',
            'PENDIENTE'
        )
    )
);

CREATE INDEX idx_migracion_tabla ON migracion_metadata (tabla_destino);

CREATE INDEX idx_migracion_estado ON migracion_metadata (estado);

-- ============================================================================
-- REMOVED: sincronizacion_metadata table (not needed for migration)
-- ============================================================================
-- JSON TRANSACTION DIFFS (Feature 019)
-- ============================================================================

-- JSON-based transaction diff system for application-level CRUD
-- Stores change requests as JSON diffs to be applied to the database
CREATE TABLE transacciones_json (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT NOT NULL,               -- Target table (e.g. 'hechos')
    tipo_operacion TEXT NOT NULL,        -- INSERT / UPDATE / DELETE
    clave_primaria TEXT NOT NULL,        -- JSON: {"portfolio_id": "P001"}
    clave_primaria_excel TEXT,           -- JSON: Excel-specific PK for row matching
    cambios TEXT,                        -- JSON: changed fields only
    usuario TEXT,
    mensaje_commit TEXT,
    estado_db TEXT NOT NULL DEFAULT 'PENDIENTE',
    estado_excel TEXT NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ejecucion_db DATETIME,
    fecha_ejecucion_excel DATETIME,
    error_detalle TEXT,
    valores_previos_excel TEXT,          -- JSON: previous Excel cell values before modification
    portfolio_id TEXT,                   -- Links transaction to an initiative
    CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    CHECK (estado_db IN ('PENDIENTE', 'EJECUTADO', 'ERROR')),
    CHECK (estado_excel IN ('PENDIENTE', 'EJECUTADO', 'ERROR', 'NO_APLICA'))
);

CREATE INDEX idx_tj_estado_db ON transacciones_json (estado_db);
CREATE INDEX idx_tj_entidad ON transacciones_json (entidad);
CREATE INDEX idx_tj_fecha ON transacciones_json (fecha_creacion);
CREATE INDEX idx_tj_portfolio ON transacciones_json (portfolio_id);

-- ============================================================================
-- PARAMETRIC VALUES (Feature 037)
-- ============================================================================

-- Lookup values for codified fields (dropdowns in UI)
-- Populated during migration from actual data values
CREATE TABLE parametros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_parametro TEXT NOT NULL,    -- Field identifier (e.g. 'estado', 'cluster')
    valor TEXT NOT NULL,               -- The actual value
    color TEXT DEFAULT NULL,           -- Color hint for UI badges (e.g. 'blue', 'emerald', 'red')
    orden INTEGER,                     -- Sort order (NULL = alphabetical)
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nombre_parametro, valor)
);

CREATE INDEX idx_parametros_nombre ON parametros (nombre_parametro);

-- Seed estado_de_la_iniciativa colors
INSERT OR IGNORE INTO parametros (nombre_parametro, valor, color, orden) VALUES
    ('estado_de_la_iniciativa', 'Recepción', 'slate', 1),
    ('estado_de_la_iniciativa', 'SM100 Redacción', 'blue', 2),
    ('estado_de_la_iniciativa', 'SM100 Final', 'blue', 3),
    ('estado_de_la_iniciativa', 'SM200 En Revisión', 'blue', 4),
    ('estado_de_la_iniciativa', 'SM200 Final', 'blue', 5),
    ('estado_de_la_iniciativa', 'Análisis BI', 'amber', 6),
    ('estado_de_la_iniciativa', 'Pendiente de Unidad Solicitante', 'amber', 7),
    ('estado_de_la_iniciativa', 'Revisión Regulación', 'amber', 8),
    ('estado_de_la_iniciativa', 'En Revisión P&C', 'amber', 9),
    ('estado_de_la_iniciativa', 'En Aprobación', 'indigo', 10),
    ('estado_de_la_iniciativa', 'Encolada por Prioridad', 'indigo', 11),
    ('estado_de_la_iniciativa', 'Aprobada', 'emerald', 12),
    ('estado_de_la_iniciativa', 'Aprobada con CCT', 'emerald', 13),
    ('estado_de_la_iniciativa', 'En ejecución', 'cyan', 14),
    ('estado_de_la_iniciativa', 'Finalizado', 'green', 15),
    ('estado_de_la_iniciativa', 'Pendiente PES', 'gray', 16),
    ('estado_de_la_iniciativa', 'Facturación cierre año', 'gray', 17),
    ('estado_de_la_iniciativa', 'Cierre económico iniciativa', 'gray', 18),
    ('estado_de_la_iniciativa', 'Importe Estimado', 'violet', 19),
    ('estado_de_la_iniciativa', 'Importe Planificado', 'violet', 20),
    ('estado_de_la_iniciativa', 'Cancelado', 'red', 21);

-- Highlighted etiquetas (parametric table for prominent tag display)
CREATE TABLE etiquetas_destacadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etiqueta TEXT NOT NULL UNIQUE,           -- Must match etiquetas.etiqueta values
    color TEXT DEFAULT 'blue',               -- Badge color hint (blue, green, purple, orange, red)
    orden INTEGER,                           -- Sort order for display
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME
);

-- Initial highlighted etiquetas
INSERT INTO etiquetas_destacadas (etiqueta, orden) VALUES
  ('Enabler para aumento de inversión 2026', 1),
  ('Plan de Eficiencias 2025', 2),
  ('Plan Director Centro de Control', 3),
  ('Iniciativa de Innovación', 4);

-- ============================================================================
-- DOCUMENT MANAGEMENT
-- ============================================================================

-- Documents associated with initiatives
-- Source: Management CLI scanner (scan_documents command)
CREATE TABLE documentos (
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

CREATE INDEX idx_documentos_portfolio ON documentos (portfolio_id);
CREATE INDEX idx_documentos_tipo ON documentos (tipo_documento);
CREATE INDEX idx_documentos_estado ON documentos (estado_proceso_documento);

-- Document items (expanded from resumen_documento JSON)
-- Source: Migration from Excel or generated from documentos.resumen_documento
CREATE TABLE documentos_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portfolio_id TEXT NOT NULL,
    nombre_fichero TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    tipo_registro TEXT NOT NULL,
    texto TEXT,
    FOREIGN KEY (portfolio_id) REFERENCES iniciativas (portfolio_id) ON DELETE CASCADE,
    FOREIGN KEY (nombre_fichero) REFERENCES documentos (nombre_fichero) ON DELETE CASCADE
);

CREATE INDEX idx_documentos_items_portfolio ON documentos_items (portfolio_id);
CREATE INDEX idx_documentos_items_fichero ON documentos_items (nombre_fichero);
CREATE INDEX idx_documentos_items_tipo_registro ON documentos_items (tipo_registro);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================