# Portfolio Migration System - Technical Specifications

**Version:** 1.0
**Date:** January 2026
**Status:** Implemented

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Data Sources](#data-sources)
4. [Database Schema](#database-schema)
   - 4.8 [Excel-to-Database Column Mappings](#48-excel-to-database-column-mappings)
5. [Data Migration Process](#data-migration-process)
6. [Data Quality & Validation](#data-quality--validation)
7. [Naming Conventions](#naming-conventions)
8. [API Reference](#api-reference)
9. [Performance Specifications](#performance-specifications)
10. [Future Enhancements](#future-enhancements)

---

## 1. Project Overview

### Purpose

The Portfolio Migration System migrates and synchronizes portfolio management data from multiple Excel workbooks to a normalized SQLite database. The system enables:

- **Data consolidation** from 4 Excel workbooks (30 sheets, ~80,000 rows)
- **Data normalization** from sparse matrices to relational tables
- **Ongoing synchronization** from Excel to database (Excel as source of truth)
- **Data quality tracking** with automated validation and issue logging
- **Audit trail preservation** with complete change history

### Key Requirements

1. **Schema Scope**: Comprehensive (20 tables + 3 views)
2. **Error Handling**: Log and continue on data quality issues
3. **Synchronization**: Ongoing sync from Excel → SQLite
4. **Audit Trail**: Preserve all historical transaction records
5. **Naming Convention**: Spanish names with accents removed (Año → anio)
6. **Schema Philosophy**: Exact Excel-to-database column mapping for core data tables

### Technology Stack

- **Language**: Python 3.12+
- **Package Manager**: uv
- **Database**: SQLite 3
- **Dependencies**: pandas 3.0+, openpyxl 3.1+
- **Journal Mode**: WAL (Write-Ahead Logging)

---

## 2. System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Excel Source Files                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Master     │  │ Beneficios   │  │  Facturado   │  ...  │
│  │   (.xlsm)    │  │   (.xlsm)    │  │   (.xlsx)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Excel Readers Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MasterReader │  │ Beneficios   │  │  Facturado   │      │
│  │              │  │   Reader     │  │   Reader     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  - Header detection    - Sparse matrix denormalization      │
│  - Column normalization  - Data type inference              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Quality Layer                          │
│  - Date normalization (Excel serial → ISO 8601)             │
│  - Currency precision (round to 2 decimals)                 │
│  - Formula error detection (#REF!, #N/A, etc.)              │
│  - Accent removal (Descripción → descripcion)               │
│  - Multi-line text normalization (CRLF handling)            │
│  - Quality issue logging                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Migration Engine                           │
│  Phase 1: Master data (personas, grupos)                    │
│  Phase 2: Core entities (iniciativas)                       │
│  Phase 3: Financial data (informacion_economica, etc.)      │
│  Phase 4: Operational data (beneficios, hechos, etc.)       │
│  Phase 5: Supporting data (ltp, wbes, metodologia)          │
│  Phase 6: Audit trail (transacciones)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                            │
│  - 20 tables with constraints                               │
│  - 3 denormalized views                                     │
│  - Foreign key enforcement                                  │
│  - Quality tracking tables                                  │
│  - Migration metadata                                       │
│  - Exact Excel column mapping for core tables               │
└─────────────────────────────────────────────────────────────┘
```

### Module Structure

```
portfolio_migration/
├── main.py                 # CLI entry point
├── init_db.py             # Database initialization
├── schema.sql             # Complete DDL
├── data_quality.py        # Data normalization utilities
├── excel_readers.py       # Excel parsing classes
├── migrate.py             # Migration engine
├── sync.py                # Synchronization engine (planned)
├── validate.py            # Validation and reporting
└── excel_source/          # Excel workbooks
    ├── PortfolioDigital_Master.xlsm
    ├── PortfolioDigital_Beneficios.xlsm
    ├── PortfolioDigital_Facturado.xlsx
    └── PortfolioDigital_Transacciones.xlsm
```

---

## 3. Data Sources

### Excel Workbooks

#### 3.1 PortfolioDigital_Master.xlsm

**Size**: 3.5 MB
**Sheets**: 21
**Primary Purpose**: Core portfolio management hub

**Key Sheets**:

| Sheet Name | Rows | Purpose | Skip Rows |
|------------|------|---------|-----------|
| Query Datos Relevantes | 798 | Main portfolio hub | 2 |
| Datos ejecución | 211 | Milestone tracking | 2 |
| Información Económica | 797 | Financial data | 2 |
| Hechos | 3,226 | Fact records | 2 |
| Etiquetas | 7,238 | Tag assignments (sparse) | 2 |
| Personas | 30 | People/contacts | 2 |
| Grupos Iniciativas | 55 | Initiative groups | 2 |
| Facturación | 481 | Billing records | 2 |
| LTP | Variable | Long-term planning | 2 |
| WBEs | Variable | Work breakdown elements | 2 |
| IM | Variable | Methodology tracking | 2 |
| Administrador | 45 | Lookup lists | 2 |

**Header Structure**: All sheets have 2 metadata rows before the actual column headers.

#### 3.2 PortfolioDigital_Beneficios.xlsm

**Size**: 6.1 MB
**Sheets**: 4
**Primary Purpose**: Benefits tracking

**Structure**:
- **Beneficios** (26,570 rows): Current benefit records
- **Beneficios_copia_20251028** (23,748 rows): Historical snapshot 1
- **Beneficios_copia_20251028-2** (26,479 rows): Historical snapshot 2

**Format**: Already normalized (not sparse matrix)

**Columns**:
- Portfolio ID
- Grupo (category)
- Concepto (benefit concept)
- Periodo (year)
- Importe (amount)
- Valor (value)
- Texto (description)
- Origen (origin)
- Fecha Modificación (modification date)

**Note**: Multiple sheets contain duplicates; system uses UNIQUE constraint to keep latest version.

#### 3.3 PortfolioDigital_Facturado.xlsx

**Size**: 163 KB
**Sheets**: 3
**Primary Purpose**: Billing and variance analysis

**Key Sheets**:
- **Query Facturación** (479 rows): Monthly billing transactions
- **Facturación Año** (126 rows): Annual billing summary

**Features**:
- Planned vs. Actual tracking
- Variance analysis with >2% and >10% flags
- Monthly totals ~34M EUR observed

#### 3.4 PortfolioDigital_Transacciones.xlsm

**Size**: 958 KB
**Sheets**: 2
**Primary Purpose**: Audit trail and metadata

**Key Sheets**:
- **Transacciones** (8,838 rows): Complete change history
- **Tablas** (21 rows): Table metadata with SharePoint references

**Audit Tracking**:
- Field-level change tracking (old/new values)
- Operation types: UPSERT, UPDATE, INSERT
- Status: PENDIENTE, REALIZADO, ERROR

---

## 4. Database Schema

### Schema Philosophy

**Exact Excel Column Mapping**: The database schema follows an exact column mapping approach for core data tables. This means:
- Column names in the database match Excel headers exactly (after accent removal and lowercase conversion)
- No column renaming or restructuring from Excel to database
- Preserves all Excel columns, even if some appear redundant
- Simplifies maintenance and reduces mapping errors
- Makes the schema self-documenting relative to source Excel files

**Tables using exact Excel mapping**:
- `datos_descriptivos` - All 19 Excel columns preserved
- `informacion_economica` - All 25 Excel columns preserved
- `hechos` - All 13 Excel columns preserved
- `etiquetas` - All 7 Excel columns preserved
- `justificaciones` - All 8 Excel columns preserved
- `facturacion` - All 6 Excel columns preserved

### Primary Key Strategy

**Portfolio ID** (TEXT): Consistent across all workbooks
- Format examples: `SPA_25_226`, `INDEDSPAIN-23592`, `SPA_AD-OTH_1`, `SPA_26_1`
- No auto-increment for main entity
- All related tables reference `iniciativas(portfolio_id)`

### Table Categories

#### 4.1 Core Entity Tables (3)

**1. iniciativas**
- **Purpose**: Main portfolio hub
- **Rows**: ~800
- **Primary Key**: portfolio_id (TEXT)
- **Key Fields**:
  - Basic: titulo, descripcion, unidad, origen, cluster
  - Status: estado, prioridad, tipo_iniciativa
  - Dates: fecha_inicio, fecha_fin, fecha_aprobacion, etc.
  - Date flags: fecha_inicio_valida, fecha_fin_valida
  - Metrics: valor_negocio, complejidad_tecnica, riesgo
  - Tracking: porcentaje_completado
  - References: grupo_iniciativa_id, responsable_id, responsable_ict_id
- **Indexes**: estado, prioridad, grupo, responsable, fecha_inicio, cluster

**2. personas**
- **Purpose**: People/contacts master data
- **Rows**: ~30+
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Key Fields**: nombre, apellidos, email (UNIQUE), telefono, departamento, cargo
- **Indexes**: email (UNIQUE), nombre+apellidos, departamento

**3. grupos_iniciativas**
- **Purpose**: Initiative groups with hierarchy
- **Rows**: ~55
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Key Fields**: nombre, descripcion, codigo (UNIQUE), parent_id (self-referential)
- **Indexes**: parent, codigo, nivel

#### 4.2 Descriptive Data Tables (1)

**4. datos_descriptivos**
- **Purpose**: Descriptive metadata for initiatives
- **Rows**: 804
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Foreign Key**: portfolio_id → iniciativas(portfolio_id)
- **Excel Mapping**: Exact 1:1 mapping from "Datos descriptivos" sheet (19 columns)
- **Key Fields**: portfolio_id, nombre, descripcion, unidad, origen, cluster, estado, prioridad, tipo_iniciativa, alcance_geografico, impacto, beneficios_esperados, riesgos, dependencias, stakeholders, comentarios, fecha_creacion, fecha_actualizacion, usuario_creacion

#### 4.3 Financial Tables (3)

**5. informacion_economica**
- **Purpose**: Complete financial information
- **Rows**: 794
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Foreign Key**: portfolio_id → iniciativas(portfolio_id)
- **Excel Mapping**: Exact 1:1 mapping from "Información Económica" sheet (25 columns)
- **Key Fields**: portfolio_id, cini, capex_opex, fecha_prevista_pes, wbe, cluster, finalidad_budget, tipo_importe, anio, presupuesto, coste_real, coste_comprometido_sap, otro_gasto, reserva_contingencia, forecast_1, forecast_2, forecast_3, wbe_nombre, partida_presupuestaria, centro_coste, elemento_pep, orden_interna, descripcion_gasto, comentarios, fecha_actualizacion

**6. facturacion**
- **Purpose**: Billing records
- **Rows**: 476
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Foreign Key**: portfolio_id → iniciativas(portfolio_id)
- **Excel Mapping**: Exact 1:1 mapping from "Facturación" sheet (6 columns)
- **Key Fields**: portfolio_id, descripcion, ano, mes, importe, concepto_factura

**7. facturacion_mensual**
- **Purpose**: Monthly billing with variance
- **Rows**: Variable (not yet migrated)
- **Unique**: (portfolio_id, anio, mes)
- **Key Fields**: importe_planificado, importe_real, desviacion_porcentaje

#### 4.4 Operational Tables (3)

**8. datos_ejecucion**
- **Purpose**: Milestone tracking
- **Rows**: 209
- **Key Fields**: hito, fecha_planificada, fecha_real, porcentaje_completado, estado_rag

**9. hechos**
- **Purpose**: Detailed fact records
- **Rows**: 2,823
- **Primary Key**: id_hecho (INTEGER AUTOINCREMENT)
- **Foreign Key**: portfolio_id → iniciativas(portfolio_id)
- **Excel Mapping**: Exact 1:1 mapping from "Hechos" sheet (13 columns)
- **Key Fields**: id_hecho, portfolio_id, nombre, partida_presupuestaria, importe, estado, fecha, importe_ri, importe_re, notas, racional, tipo_hecho, fecha_actualizacion

**10. beneficios**
- **Purpose**: Benefits (normalized)
- **Rows**: 27,869 (after deduplication)
- **Unique**: (portfolio_id, concepto_beneficio, anio)
- **Key Fields**: categoria_beneficio, valor, tipo_beneficio, porcentaje_realizacion

#### 4.5 Supporting Tables (6)

**11. etiquetas**
- **Purpose**: Tag assignments
- **Rows**: 7,230
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Foreign Key**: portfolio_id → iniciativas(portfolio_id)
- **Excel Mapping**: Exact 1:1 mapping from "Etiquetas" sheet (7 columns)
- **Key Fields**: portfolio_id, etiqueta, valor, fecha_modificacion, origen_registro, comentarios, nombre

**12. justificaciones**
- **Purpose**: Initiative justifications
- **Rows**: 513
- **Primary Key**: id (INTEGER AUTOINCREMENT)
- **Foreign Key**: portfolio_id → iniciativas(portfolio_id)
- **Excel Mapping**: Exact 1:1 mapping from "Justificaciones" sheet (8 columns)
- **Key Fields**: portfolio_id, tipo_justificacion, descripcion, fecha_justificacion, aprobador, estado_aprobacion, comentarios, fecha_actualizacion

**13. ltp**: Long-term planning
**14. wbes**: Work breakdown elements
**15. iniciativas_metodologia**: Methodology tracking
**16. administrador**: Lookup/validation lists

#### 4.6 Audit & Quality Tables (4)

**17. tabla_metadata**: Table registry with SharePoint references
**18. transacciones**: Complete audit trail (historical records)
**19. calidad_datos**: Data quality issue tracking
**20. migracion_metadata**: Migration statistics

**21. sincronizacion_metadata**: Sync tracking (for future sync feature)

### Views (3)

**1. v_iniciativas_completo**
- Denormalized view joining iniciativas with grupos, personas
- Includes aggregated financial data for current year

**2. v_resumen_financiero**
- Financial summary by initiative
- Calculates total budget, spend, variance, execution percentage

**3. v_resumen_beneficios**
- Benefits summary by portfolio, category, and year
- Aggregates total value and realization percentage

### Data Types

| Type | SQLite | Usage |
|------|--------|-------|
| Dates | TEXT | ISO 8601 format: 'YYYY-MM-DD' |
| Currency | REAL | Rounded to 2 decimals (EUR) |
| Booleans | INTEGER | 0/1 with CHECK constraints |
| Multi-line text | TEXT | CRLF support, normalized to LF |
| Primary keys (entities) | TEXT | portfolio_id |
| Primary keys (lookup) | INTEGER | AUTOINCREMENT |

### Constraints

- **Foreign Keys**: Enforced with PRAGMA foreign_keys = ON
- **UNIQUE**: Multi-column uniqueness for denormalized data
- **CHECK**: Data validation (percentages 0-100, year ranges, enum values)
- **NOT NULL**: Applied to required fields
- **DEFAULT**: Sensible defaults (0.0 for currency, 1 for active flags)

### 4.8 Excel-to-Database Column Mappings

This section provides detailed column-by-column mappings from Excel workbooks to database tables for review and validation.

---

#### 4.8.1 PortfolioDigital_Master.xlsm

##### Sheet: "Query Datos Relevantes" → Table: `iniciativas`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID | portfolio_id | TEXT | Primary key |
| 2 | Nombre | nombre | TEXT | Initiative name |
| 3 | Unidad | unidad | TEXT | Business unit |
| 4 | Origen | origen | TEXT | Initiative origin |
| 5 | Digital framework level 1 | digital_framework_level_1 | TEXT | Framework classification |
| 6 | Prioridad Descriptiva BI | prioridad_descriptiva_bi | TEXT | BI priority |
| 7 | Priorización | priorizacion | TEXT | Prioritization value |
| 8 | Tipo Proyecto | tipo_proyecto | TEXT | Project type |
| 9 | Referente BI | referente_bi | TEXT | BI contact |
| 10 | Referente B unit | referente_b_unit | TEXT | Business unit contact |
| 11 | Referente Enabler (ICT) | referente_enabler_ict | TEXT | ICT contact |
| 12 | IT Partner | it_partner | TEXT | IT partner name |
| 13 | Código JIRA | codigo_jira | TEXT | JIRA code |
| 14 | Cluster 2025 | cluster_2025 | TEXT | 2025 cluster |
| 15 | Tipo Agrupación | tipo_agrupacion | TEXT | Grouping type |
| 16 | Cluster 2025 antes de 19.06.2025 | cluster_2025_antes_de_19062025 | TEXT | Previous cluster |
| 17 | Estado de la Iniciativa | estado_de_la_iniciativa | TEXT | Initiative status |
| 18 | Justificación Regulatoria | justificacion_regulatoria | TEXT | Regulatory justification |
| 19 | Falta Justificación Regulatoria | falta_justificacion_regulatoria | INTEGER | Boolean flag (0/1) |
| 20 | Digital Framework Level 2 | digital_framework_level_2 | TEXT | Framework sub-classification |
| 21 | Descripción | descripcion | TEXT | Multi-line description |
| 22 | Notas | notas | TEXT | Additional notes |
| 23 | Comentarios | comentarios | TEXT | Comments |
| 24 | Fecha Inicio | fecha_inicio | TEXT | Start date (ISO 8601) |
| 25 | Fecha Fin | fecha_fin | TEXT | End date (ISO 8601) |
| 26 | Fecha Aprobación | fecha_aprobacion | TEXT | Approval date (ISO 8601) |
| 27 | Fecha Última Modificación | fecha_ultima_modificacion | TEXT | Last modification date |
| 28 | Budget 2024 | budget_2024 | REAL | 2024 budget (EUR) |
| 29 | Budget 2025 | budget_2025 | REAL | 2025 budget (EUR) |
| 30 | Budget 2026 | budget_2026 | REAL | 2026 budget (EUR) |
| 31 | Importe 2024 | importe_2024 | REAL | 2024 amount (EUR) |
| 32 | Importe 2025 | importe_2025 | REAL | 2025 amount (EUR) |
| 33 | Importe 2026 | importe_2026 | REAL | 2026 amount (EUR) |
| 34 | Importe Facturado 2024 | importe_facturado_2024 | REAL | 2024 billed amount (EUR) |
| 35 | Importe Facturado 2025 | importe_facturado_2025 | REAL | 2025 billed amount (EUR) |
| 36 | Importe Facturado 2026 | importe_facturado_2026 | REAL | 2026 billed amount (EUR) |
| 37 | % Avance | porcentaje_avance | REAL | Progress percentage |
| 38 | % Facturación 2024 | porcentaje_facturacion_2024 | REAL | 2024 billing percentage |
| 39 | % Facturación 2025 | porcentaje_facturacion_2025 | REAL | 2025 billing percentage |
| 40 | % Facturación 2026 | porcentaje_facturacion_2026 | REAL | 2026 billing percentage |
| 41 | En Retraso | en_retraso | TEXT | Delay indicator |
| 42 | Fecha UAT | fecha_uat | TEXT | UAT date (ISO 8601) |
| 43 | Fecha Último Estado | fecha_ultimo_estado | TEXT | Last status date (ISO 8601) |
| 44 | Fecha Creación | fecha_creacion | TEXT | Creation date (ISO 8601) |
| 45 | Usuario Creación | usuario_creacion | TEXT | Creation user |
| 46 | Valor Negocio | valor_negocio | REAL | Business value |
| 47 | Complejidad Técnica | complejidad_tecnica | REAL | Technical complexity |
| 48 | Riesgo | riesgo | REAL | Risk level |
| 49 | Prioridad | prioridad | TEXT | Priority level |
| 50 | Estado | estado | TEXT | Current status |
| 51 | Tipo Iniciativa | tipo_iniciativa | TEXT | Initiative type |
| 52 | Alcance Geográfico | alcance_geografico | TEXT | Geographic scope |
| 53 | Impacto | impacto | TEXT | Impact description |
| 54 | Beneficios Esperados | beneficios_esperados | TEXT | Expected benefits |
| 55 | Riesgos | riesgos | TEXT | Risks description |
| 56 | Dependencias | dependencias | TEXT | Dependencies |
| 57 | Stakeholders | stakeholders | TEXT | Stakeholders list |
| 58 | Grupo Iniciativa ID | grupo_iniciativa_id | INTEGER | FK to grupos_iniciativas |
| 59 | Responsable ID | responsable_id | INTEGER | FK to personas |
| 60 | Responsable ICT ID | responsable_ict_id | INTEGER | FK to personas |
| 61 | Activo | activo | INTEGER | Active flag (0/1) |

**Mapping Type**: Exact 1:1 (all 61 columns preserved)

---

##### Sheet: "Datos descriptivos" → Table: `datos_descriptivos`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Nombre | nombre | TEXT | Initiative name |
| 3 | Unidad | unidad | TEXT | Business unit |
| 4 | Origen | origen | TEXT | Origin/source |
| 5 | Digital framework level 1 | digital_framework_level_1 | TEXT | Framework classification |
| 6 | Prioridad Descriptiva BI | prioridad_descriptiva_bi | TEXT | BI priority |
| 7 | Priorización | priorizacion | TEXT | Prioritization value |
| 8 | Tipo Proyecto | tipo_proyecto | TEXT | Project type |
| 9 | Referente BI | referente_bi | TEXT | BI contact |
| 10 | Referente B unit | referente_b_unit | TEXT | Business unit contact |
| 11 | Referente Enabler (ICT) | referente_enabler_ict | TEXT | ICT contact |
| 12 | IT Partner | it_partner | TEXT | IT partner name |
| 13 | Código JIRA | codigo_jira | TEXT | JIRA code |
| 14 | Cluster 2025 | cluster_2025 | TEXT | 2025 cluster |
| 15 | Tipo Agrupación | tipo_agrupacion | TEXT | Grouping type |
| 16 | Cluster 2025 antes de 19.06.2025 | cluster_2025_antes_de_19062025 | TEXT | Previous cluster |
| 17 | Estado de la Iniciativa | estado_de_la_iniciativa | TEXT | Initiative status |
| 18 | Justificación Regulatoria | justificacion_regulatoria | TEXT | Regulatory justification |
| 19 | Falta Justificación Regulatoria | falta_justificacion_regulatoria | INTEGER | Boolean flag (0/1) |

**Mapping Type**: Exact 1:1 (all 19 columns preserved)

---

##### Sheet: "Información Económica" → Table: `informacion_economica`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID | portfolio_id | TEXT | FK to iniciativas, UNIQUE |
| 2 | Nombre | nombre | TEXT | Initiative name |
| 3 | CINI | cini | TEXT | CINI code |
| 4 | (CAPEX/OPEX) | capex_opex | TEXT | Budget type |
| 5 | Fecha Prevista PES | fecha_prevista_pes | TEXT | PES date (ISO 8601) |
| 6 | WBE | wbe | TEXT | Work breakdown element |
| 7 | Cluster | cluster | TEXT | Cluster classification |
| 8 | Finalidad Budget | finalidad_budget | TEXT | Budget purpose |
| 9 | Proyecto Especial | proyecto_especial | TEXT | Special project flag |
| 10 | Clasificación | clasificacion | TEXT | Classification type |
| 11 | TLC | tlc | TEXT | TLC indicator |
| 12 | Tipo Inversión | tipo_inversion | TEXT | Investment type |
| 13 | Referente BI | referente_bi | TEXT | BI contact |
| 14 | Cluster 2025 | cluster_2025 | TEXT | 2025 cluster |
| 15 | Digital Framework Level 1 | digital_framework_level_1 | TEXT | Framework level |
| 16 | Origen | origen | TEXT | Origin |
| 17 | Estado | estado | TEXT | Status |
| 18 | Debe tener CINI | debe_tener_cini | INTEGER | Validation flag (0/1) |
| 19 | Debe tener CAPEX/OPEX | debe_tener_capex_opex | INTEGER | Validation flag (0/1) |
| 20 | Debe tener Fecha Prevista PES | debe_tener_fecha_prevista_pes | INTEGER | Validation flag (0/1) |
| 21 | Debe tener WBE | debe_tener_wbe | INTEGER | Validation flag (0/1) |
| 22 | Budget 2026 | budget_2026 | REAL | 2026 budget (EUR) |
| 23 | Importe 2025 | importe_2025 | REAL | 2025 amount (EUR) |
| 24 | Importe 2026 | importe_2026 | REAL | 2026 amount (EUR) |
| 25 | Observaciones | observaciones | TEXT | Observations/notes |

**Mapping Type**: Exact 1:1 (all 25 columns preserved)

---

##### Sheet: "Hechos" → Table: `hechos`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Nombre | nombre | TEXT | Fact name |
| 3 | Partida presupuestaria | partida_presupuestaria | TEXT | Budget line |
| 4 | Importe | importe | REAL | Amount (EUR) |
| 5 | Estado | estado | TEXT | Status |
| 6 | Fecha | fecha | TEXT | Date (ISO 8601) |
| 7 | Importe RI | importe_ri | REAL | RI amount (EUR) |
| 8 | Importe RE | importe_re | REAL | RE amount (EUR) |
| 9 | Notas | notas | TEXT | Notes |
| 10 | Racional | racional | TEXT | Rationale/description |
| 11 | Calidad Estimación | calidad_estimacion | TEXT | Estimation quality |
| 12 | Referente BI | referente_bi | TEXT | BI contact |
| 13 | ID | id_hecho | INTEGER | Primary key from Excel |

**Mapping Type**: Exact 1:1 (all 13 columns preserved)

**Note**: The `ID` column from Excel is used as the primary key (`id_hecho`) in the database.

---

##### Sheet: "Etiquetas" → Table: `etiquetas`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Etiqueta | etiqueta | TEXT | Tag name |
| 3 | Valor | valor | TEXT | Tag value |
| 4 | Fecha Modificación | fecha_modificacion | TEXT | Modification date (ISO 8601) |
| 5 | Origen Registro | origen_registro | TEXT | Record origin |
| 6 | Comentarios | comentarios | TEXT | Comments |
| 7 | Nombre | nombre | TEXT | Initiative name |

**Mapping Type**: Exact 1:1 (all 7 columns preserved)

**UNIQUE Constraint**: (portfolio_id, etiqueta) - one value per tag per initiative

---

##### Sheet: "Justificaciones" → Table: `justificaciones`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | Portfolio ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Tipo Justificación | tipo_justificacion | TEXT | Justification type |
| 3 | Valor | valor | TEXT | Value/content |
| 4 | Fecha Modificación | fecha_modificacion | TEXT | Modification date (ISO 8601) |
| 5 | Origen Registro | origen_registro | TEXT | Record origin |
| 6 | Comentarios | comentarios | TEXT | Comments |
| 7 | Nombre | nombre | TEXT | Initiative name |
| 8 | Digital Framework Level 1 | digital_framework_level_1 | TEXT | Framework level |

**Mapping Type**: Exact 1:1 (all 8 columns preserved)

**UNIQUE Constraint**: (portfolio_id, tipo_justificacion) - one justification per type per initiative

---

##### Sheet: "Facturación" → Table: `facturacion`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | Portfolio ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Descripción | descripcion | TEXT | Billing description |
| 3 | Año | ano | INTEGER | Year |
| 4 | Mes | mes | TEXT | Month (name or number) |
| 5 | Importe | importe | REAL | Amount (EUR) |
| 6 | Concepto factura | concepto_factura | TEXT | Billing concept |

**Mapping Type**: Exact 1:1 (all 6 columns preserved)

---

##### Sheet: "Datos ejecución" → Table: `datos_ejecucion`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Nombre | nombre | TEXT | Initiative name |
| 3 | Unidad | unidad | TEXT | Business unit |
| 4 | Estado de la iniciativa | estado_de_la_iniciativa | TEXT | Initiative status |
| 5 | Fecha de último estado | fecha_de_ultimo_estado | TEXT | Last status date (ISO 8601) |
| 6 | Origen | origen | TEXT | Initiative origin |
| 7 | Importe 2025 | importe_2025 | REAL | 2025 amount (EUR) |
| 8 | Importe Facturado 2025 | importe_facturado_2025 | REAL | 2025 billed amount (EUR) |
| 9 | Fecha Inicio | fecha_inicio | TEXT | Start date (ISO 8601) |
| 10 | Fecha UAT | fecha_uat | TEXT | UAT date (ISO 8601) |
| 11 | Fecha Fin | fecha_fin | TEXT | End date (ISO 8601) |
| 12 | % Avance | porcentaje_avance | REAL | Progress percentage |
| 13 | ¿En retraso? | en_retraso | TEXT | Delay indicator |
| 14 | % Facturación | porcentaje_facturacion | REAL | Billing percentage |
| 15 | Comentarios | comentarios | TEXT | Comments |
| 16 | Tipo Agrupación | tipo_agrupacion | TEXT | Grouping type |

**Mapping Type**: Exact 1:1 (all 16 columns preserved)

**Note**: This sheet uses `skiprows=1` instead of `skiprows=2` (1 metadata row before headers).

---

##### Sheet: "Personas" → Table: `personas`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | Nombre de interlocutor | nombre_de_interlocutor | TEXT | Contact name |
| 2 | Unidad | unidad | TEXT | Business unit |
| 3 | Área | area | TEXT | Area/department |
| 4 | Ubicación | ubicacion | TEXT | Location |
| 5 | Persona BI | persona_bi | TEXT | BI person |
| 6 | Sistemas Asociados | sistemas_asociados | TEXT | Associated systems |
| 7 | Comentarios | comentarios | TEXT | Comments |
| 8 | Intensidad | intensidad | TEXT | Intensity level |

**Mapping Type**: Exact 1:1 (all 8 columns preserved)

---

##### Sheet: "Grupos Iniciativas" → Table: `grupos_iniciativas`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | PORTFOLIO ID Grupo | portfolio_id_grupo | TEXT | Group portfolio ID |
| 2 | Portfolio ID Componente | portfolio_id_componente | TEXT | Component portfolio ID |
| 3 | Nombre Grupo | nombre_grupo | TEXT | Group name |
| 4 | Tipo Agrupación Grupo | tipo_agrupacion_grupo | TEXT | Group type |
| 5 | Nombre Componente | nombre_componente | TEXT | Component name |
| 6 | Tipo Agrupación Componente | tipo_agrupacion_componente | TEXT | Component type |
| 7 | Importe 2025 Componente | importe_2025_componente | REAL | Component 2025 amount (EUR) |
| 8 | Importe 2025 Grupo | importe_2025_grupo | REAL | Group 2025 amount (EUR) |

**Mapping Type**: Exact 1:1 (all 8 columns preserved)

---

#### 4.8.2 PortfolioDigital_Beneficios.xlsm

##### All Sheets ("Beneficios*") → Table: `beneficios`

| # | Excel Column | Database Column | Type | Notes |
|---|--------------|-----------------|------|-------|
| 1 | Portfolio ID | portfolio_id | TEXT | FK to iniciativas |
| 2 | Grupo | grupo | TEXT | Benefit group/category |
| 3 | Concepto | concepto | TEXT | Benefit concept |
| 4 | Periodo | periodo | TEXT | Period (year) |
| 5 | Importe | importe | REAL | Amount (EUR) |
| 6 | Valor | valor | REAL | Value |
| 7 | Texto | texto | TEXT | Description |
| 8 | Origen | origen | TEXT | Origin/source |
| 9 | Fecha Modificación | fecha_modificacion | TEXT | Modification date (ISO 8601) |
| 10 | Columna Tablón | columna_tablon | TEXT | Board column |
| 11 | Nombre | nombre | TEXT | Initiative name |
| 12 | Estado de la Iniciativa | estado_de_la_iniciativa | TEXT | Initiative status |

**Mapping Type**: Exact 1:1 (all 12 columns preserved)

**UNIQUE Constraint**: (portfolio_id, concepto, periodo) - one benefit per concept per period per initiative

**Note**: Reads from all sheets with "beneficios" in the name and combines them, removing duplicates via UNIQUE constraint.

---

#### 4.8.3 PortfolioDigital_Facturado.xlsx

##### Sheet: "Query Facturación" → Table: `facturacion_mensual`

**Status**: Pending (column structure needs mapping adjustment)

---

#### 4.8.4 PortfolioDigital_Transacciones.xlsm

##### Sheet: "Transacciones" → Table: `transacciones`

**Status**: Pending (column structure needs mapping adjustment)

---

##### Sheet: "Tablas" → Table: `tabla_metadata`

**Status**: Pre-populated during database initialization, not migrated from Excel

---

#### 4.8.5 Column Naming Normalization Rules

All Excel column names are normalized using the following rules when mapping to database columns:

1. **Convert to lowercase**: "PORTFOLIO ID" → "portfolio id"
2. **Remove accents**: "Descripción" → "descripcion", "Año" → "ano"
3. **Replace spaces with underscores**: "portfolio id" → "portfolio_id"
4. **Remove parentheses**: "(CAPEX/OPEX)" → "capex_opex"
5. **Remove forward slashes**: "/" → "_"
6. **Collapse multiple underscores**: "__" → "_"
7. **Strip leading/trailing underscores**
8. **Preserve ñ character**: "Año" → "ano" but "España" → "espana"

**Example Transformations**:
- "PORTFOLIO ID" → `portfolio_id`
- "Fecha Prevista PES" → `fecha_prevista_pes`
- "(CAPEX/OPEX)" → `capex_opex`
- "Digital framework level 1" → `digital_framework_level_1`
- "Cluster 2025 antes de 19.06.2025" → `cluster_2025_antes_de_19062025`

---

#### 4.8.6 Data Type Mapping Rules

| Excel Format | Database Type | Conversion Notes |
|--------------|---------------|------------------|
| Text | TEXT | Direct mapping, multi-line preserved |
| Number (integer) | INTEGER | Direct mapping |
| Number (decimal) | REAL | Rounded to 2 decimals for currency |
| Date (serial number) | TEXT | Converted to ISO 8601 (YYYY-MM-DD) |
| Boolean/Checkbox | INTEGER | 0 = False, 1 = True, with CHECK constraint |
| Formula result | Evaluated type | Stored as calculated value |
| Formula error (#REF!, #N/A) | NULL | Logged to calidad_datos table |

---

#### 4.8.7 Migration Statistics by Table

| Database Table | Excel Workbook | Excel Sheet | Rows Migrated | Columns | Status |
|----------------|----------------|-------------|---------------|---------|--------|
| iniciativas | Master | Query Datos Relevantes | 798 | 61 | ✓ Complete |
| datos_descriptivos | Master | Datos descriptivos | 804 | 19 | ✓ Complete |
| informacion_economica | Master | Información Económica | 794 | 25 | ✓ Complete |
| hechos | Master | Hechos | 2,823 | 13 | ✓ Complete |
| etiquetas | Master | Etiquetas | 7,230 | 7 | ✓ Complete |
| justificaciones | Master | Justificaciones | 513 | 8 | ✓ Complete |
| facturacion | Master | Facturación | 476 | 6 | ✓ Complete |
| datos_ejecucion | Master | Datos ejecución | 209 | 16 | ✓ Complete |
| personas | Master | Personas | 28 | 8 | ✓ Complete |
| grupos_iniciativas | Master | Grupos Iniciativas | 8 | 8 | ✓ Complete |
| beneficios | Beneficios | All sheets | 27,869 | 12 | ✓ Complete |
| facturacion_mensual | Facturado | Query Facturación | 0 | - | ⏳ Pending |
| transacciones | Transacciones | Transacciones | 0 | - | ⏳ Pending |
| **TOTAL** | | | **41,552** | | |

---

## 5. Data Migration Process

### Migration Phases

#### Phase 1: Master Data

**Order**: Critical for foreign key integrity

1. **tabla_metadata** (21 rows)
   - Pre-populated during `init_db`
   - Maps table names to metadata

2. **administrador** (variable)
   - Lookup/validation lists
   - No dependencies

3. **personas** (30 rows)
   - People/contacts
   - Referenced by iniciativas

4. **grupos_iniciativas** (55 rows)
   - Initiative groups
   - Parent-child hierarchy (handled in two passes if needed)

#### Phase 2: Core Entities

5. **iniciativas** (798 rows)
   - Main portfolio data from "Query Datos Relevantes"
   - References: grupos_iniciativas, personas
   - **Critical**: All other tables depend on this

#### Phase 3: Descriptive Data

6. **datos_descriptivos** (804 rows)
   - Descriptive metadata from "Datos descriptivos" sheet
   - Exact Excel column mapping (19 columns)

#### Phase 4: Financial Data

7. **informacion_economica** (794 rows)
   - Complete financial information
   - Exact Excel column mapping (25 columns)

8. **facturacion** (476 rows)
   - Billing records from Master workbook
   - Exact Excel column mapping (6 columns)

9. **facturacion_mensual** (variable)
   - From Facturado workbook
   - Monthly billing transactions

#### Phase 5: Operational Data

10. **datos_ejecucion** (209 rows)
    - Milestone tracking

11. **hechos** (2,823 rows)
    - Fact records
    - Exact Excel column mapping (13 columns)

12. **beneficios** (27,869 rows)
    - Combined from all Beneficios sheets
    - Duplicates removed via UNIQUE constraint

13. **etiquetas** (7,230 rows)
    - Tag assignments
    - Exact Excel column mapping (7 columns)

14. **justificaciones** (513 rows)
    - Initiative justifications
    - Exact Excel column mapping (8 columns)

#### Phase 6: Supporting Data

15. **ltp** (variable)
16. **wbes** (variable)
17. **iniciativas_metodologia** (variable)

#### Phase 7: Audit Trail

18. **transacciones** (variable)
    - Historical audit log preservation
    - Maps to tabla_metadata

### Migration Statistics Tracking

Each table migration logs:
- `tabla_destino`: Target table name
- `archivo_origen`: Source Excel file
- `hoja_origen`: Source sheet name
- `filas_origen`: Rows in Excel
- `filas_migradas`: Successfully migrated
- `filas_error`: Failed rows
- `fecha_inicio`, `fecha_fin`: Timestamps
- `duracion_segundos`: Migration duration
- `estado`: EN_PROGRESO, COMPLETADO, ERROR

### Error Handling Strategy

**Principle**: Log and continue (no fail-fast)

1. **Data Quality Issues**: Log to `calidad_datos`, continue
2. **Formula Errors** (#REF!, #N/A): Store NULL, log as MEDIO severity
3. **Invalid Dates**: Store NULL, set `fecha_XXX_valida = 0`
4. **Duplicate Keys**: UNIQUE constraint filters, last wins
5. **Foreign Key Violations**: Log as ALTO severity, skip row

**Critical Errors** (stop migration):
- Database connection failure
- Excel file not found
- Schema/table missing

---

## 6. Data Quality & Validation

### Data Quality Functions

#### 6.1 Date Normalization

**Function**: `normalize_date(value) -> (iso_date, is_valid)`

**Handles**:
- Excel serial dates (numeric): `44197 → '2021-01-01'`
- ISO format strings: `'2024-01-15' → '2024-01-15'`
- Common formats: `DD/MM/YYYY`, `DD-MM-YYYY`
- Text placeholders: `'Falta fecha ICT' → (None, False)`
- Zero/negative values: `0 → (None, False)`
- None/NaN: `None → (None, False)`

**Returns**:
- `iso_date`: String in 'YYYY-MM-DD' format or None
- `is_valid`: Boolean flag (stored in `fecha_XXX_valida` columns)

#### 6.2 Currency Normalization

**Function**: `normalize_currency(value) -> float`

**Handles**:
- Precision issues: `6057066.6399999997 → 6057066.64`
- Currency symbols: `'€ 1,234.56' → 1234.56`
- None/NaN: `None → 0.0`

**Returns**: Float rounded to 2 decimal places

#### 6.3 Formula Error Detection

**Function**: `detect_formula_error(value) -> bool`

**Detects**:
- `#DIV/0!`: Division by zero
- `#N/A`: Value not available
- `#NAME?`: Formula name not recognized
- `#NULL!`: Incorrect range operator
- `#NUM!`: Invalid numeric value
- `#REF!`: Invalid cell reference
- `#VALUE!`: Wrong type of argument

**Action**: Log as MEDIO severity, store NULL

#### 6.4 Accent Removal

**Function**: `remove_accents(text) -> str`

**Examples**:
- `'Año' → 'Ano'`
- `'Descripción' → 'Descripcion'`
- `'Ejecución' → 'Ejecucion'`

**Method**: Unicode NFD decomposition, filter Mn (Mark, Nonspacing)

**Note**: Preserves ñ/Ñ as separate Spanish letters

#### 6.5 Multi-line Text Normalization

**Function**: `normalize_multiline_text(value) -> str`

**Handles**:
- CRLF normalization: `\r\n → \n`
- Excessive blank lines: `\n\n\n → \n\n`
- Leading/trailing whitespace trimming

### Quality Issue Logging

**Table**: `calidad_datos`

**Logged Information**:
- `tabla_origen`: Source table
- `registro_origen`: Record ID (portfolio_id)
- `tipo_problema`: Issue type (FECHA_INVALIDA, ERROR_FORMULA, etc.)
- `campo_afectado`: Field name
- `valor_original`: Original value
- `valor_corregido`: Corrected value (if applicable)
- `severidad`: CRITICO, ALTO, MEDIO, BAJO
- `descripcion`: Human-readable description
- `estado`: PENDIENTE, CORREGIDO, IGNORADO

**Severity Levels**:
- **CRITICO**: Missing required fields, FK violations
- **ALTO**: Data integrity issues
- **MEDIO**: Formula errors, invalid dates
- **BAJO**: Minor formatting issues

### Validation Checks

#### Referential Integrity

```sql
-- Check orphaned grupo_iniciativa_id
SELECT COUNT(*) FROM iniciativas i
LEFT JOIN grupos_iniciativas g ON i.grupo_iniciativa_id = g.id
WHERE i.grupo_iniciativa_id IS NOT NULL AND g.id IS NULL;

-- Check orphaned responsable_id
SELECT COUNT(*) FROM iniciativas i
LEFT JOIN personas p ON i.responsable_id = p.id
WHERE i.responsable_id IS NOT NULL AND p.id IS NULL;
```

#### Data Quality Rules

- Date ranges: `fecha_inicio <= fecha_fin`
- Percentages: `0 <= porcentaje_completado <= 100`
- Currency precision: `importe = ROUND(importe, 2)`
- Year ranges: `2020 <= anio <= 2030`

---

## 7. Naming Conventions

### Table Names

**Format**: Spanish, lowercase, underscores

**Examples**:
- `iniciativas` (not `Iniciativas` or `initiatives`)
- `informacion_economica` (not `información_económica`)
- `grupos_iniciativas` (not `GruposIniciativas`)

### Column Names

**Format**: Spanish, lowercase, underscores, no accents

**Mapping Rules**:

| Spanish (Original) | Database Column | Rule |
|-------------------|-----------------|------|
| Año | anio | Remove tilde |
| Descripción | descripcion | Remove accent |
| Ejecución | ejecucion | Remove accent |
| Información | informacion | Remove accent |
| Período | periodo | Remove accent |
| Acción | accion | Remove accent |
| Portfolio ID | portfolio_id | Lowercase, underscore |
| Fecha Inicio | fecha_inicio | Lowercase, underscore |

**Special Cases**:
- Technical suffixes in English: `_id`, `_url`, `_flag`
- Boolean fields: `es_XXX`, `esta_XXX`, `tiene_XXX`
- Date validity flags: `fecha_XXX_valida`

### Accent Removal Table

| Letter | Normalized |
|--------|-----------|
| á | a |
| é | e |
| í | i |
| ó | o |
| ú | u |
| ü | u |
| ñ | ñ (preserved) |
| Ñ | Ñ (preserved) |

### Consistency Rules

1. **All lowercase**: No CamelCase or PascalCase
2. **Underscores**: Word separators (not hyphens or spaces)
3. **Spanish business terms**: Preserve domain language
4. **English technical terms**: For database constructs (_id, _flag, etc.)

---

## 8. API Reference

### Command Line Interface

```bash
# Initialize database
uv run python main.py init [--db PATH]

# Run migration
uv run python main.py migrate [--db PATH] [--excel-dir PATH]

# Validate data
uv run python main.py validate [--db PATH]
```

**Options**:
- `--db PATH`: Database path (default: `portfolio.db`)
- `--excel-dir PATH`: Excel directory (default: `excel_source`)

### Python API

#### Database Initialization

```python
from init_db import create_database

# Create database
conn = create_database('portfolio.db')
conn.close()
```

#### Migration

```python
from migrate import migrate_all

# Run full migration
results = migrate_all(
    db_path='portfolio.db',
    excel_dir='excel_source'
)

# Results: {'personas': 30, 'iniciativas': 798, ...}
```

#### Validation

```python
from validate import (
    validate_referential_integrity,
    validate_row_counts,
    get_quality_summary
)

import sqlite3

conn = sqlite3.connect('portfolio.db')

# Check integrity
integrity_df = validate_referential_integrity(conn)

# Get row counts
counts_df = validate_row_counts(conn)

# Quality summary
quality_df = get_quality_summary(conn)

conn.close()
```

#### Excel Readers

```python
from excel_readers import (
    MasterReader,
    BeneficiosReader,
    FacturadoReader,
    TransaccionesReader
)

# Read datos relevantes
master = MasterReader()
df = master.read_datos_relevantes()

# Read beneficios
beneficios = BeneficiosReader()
df = beneficios.read_all_beneficios_sheets()
```

#### Data Quality

```python
from data_quality import (
    normalize_date,
    normalize_currency,
    remove_accents,
    detect_formula_error,
    log_quality_issue
)

# Normalize date
date_str, is_valid = normalize_date('2024-01-15')

# Normalize currency
amount = normalize_currency('€ 1,234.56')  # Returns 1234.56

# Remove accents
normalized = remove_accents('Descripción')  # Returns 'Descripcion'

# Detect errors
is_error = detect_formula_error('#REF!')  # Returns True
```

### Database Queries

#### Using Views

```sql
-- Get complete initiative info
SELECT * FROM v_iniciativas_completo
WHERE estado = 'Aprobada'
ORDER BY fecha_inicio DESC;

-- Financial summary
SELECT * FROM v_resumen_financiero
WHERE presupuesto_total > 100000;

-- Benefits summary
SELECT * FROM v_resumen_beneficios
WHERE anio = 2025;
```

#### Custom Queries

```sql
-- Initiatives by cluster
SELECT cluster, COUNT(*) as total, estado
FROM iniciativas
GROUP BY cluster, estado
ORDER BY total DESC;

-- Top beneficios by value
SELECT
    portfolio_id,
    concepto_beneficio,
    SUM(valor) as total_valor
FROM beneficios
GROUP BY portfolio_id, concepto_beneficio
ORDER BY total_valor DESC
LIMIT 10;

-- Quality issues summary
SELECT severidad, tipo_problema, COUNT(*) as total
FROM calidad_datos
WHERE estado = 'PENDIENTE'
GROUP BY severidad, tipo_problema;
```

---

## 9. Performance Specifications

### Expected Performance

| Operation | Expected Duration | Notes |
|-----------|------------------|-------|
| Database initialization | < 5 seconds | Create schema + indexes |
| Initial migration | 15-25 seconds | ~42,000 rows |
| Incremental sync | 30-60 seconds | Depends on changes |
| Validation | 5-10 seconds | All integrity checks |
| Typical query | < 100ms | With proper indexes |

### Actual Performance (Current)

| Metric | Value | Notes |
|--------|-------|-------|
| Total rows migrated | 41,958 rows | Across 14 tables |
| Migration duration | 18.9 seconds | Complete migration |
| Database size | ~20 MB | With indexes |
| Data quality issues | 0 | No critical issues detected |
| Referential integrity | 100% | All FK constraints satisfied |

### Database Size

- **Excel files**: ~10 MB (4 workbooks)
- **SQLite database**: ~20 MB
  - Includes indexes
  - Full audit trail
  - Quality tracking
  - Exact Excel column preservation

### Optimization Techniques

**1. Indexing Strategy**

- Primary keys: All tables
- Foreign keys: All FK columns indexed
- Filter columns: estado, prioridad, cluster, fecha_inicio
- Composite indexes: (portfolio_id, anio), (tabla_id, registro_id, fecha_transaccion)

**2. Database Configuration**

```sql
PRAGMA foreign_keys = ON;           -- FK enforcement
PRAGMA journal_mode = WAL;          -- Concurrency
PRAGMA cache_size = -64000;         -- 64MB cache
PRAGMA synchronous = NORMAL;        -- Performance
```

**3. Query Optimization**

- Views for common denormalized queries
- Generated columns for calculations
- ANALYZE after migration for query planner statistics

**4. Batch Operations**

- Commit after each table migration (not per row)
- Use transactions for data integrity
- Bulk inserts where possible

### Scalability Considerations

**Current Scale**:
- 798 initiatives
- 804 datos_descriptivos
- 794 informacion_economica
- 476 facturacion
- 209 datos_ejecucion
- 2,823 hechos
- 27,869 beneficios
- 7,230 etiquetas
- 513 justificaciones
- 41,958 total rows

**Projected Scale** (5 years):
- ~4,000 initiatives
- ~150,000 benefits
- ~250,000 total rows

**Expected Performance** (at scale):
- Migration: 45-60 seconds
- Query time: Still < 100ms with indexes
- Database size: ~50-100 MB

---

## 10. Future Enhancements

### Planned Features

#### 10.1 Synchronization Engine (sync.py)

**Purpose**: Ongoing Excel → SQLite synchronization

**Features**:
- Change detection (hash-based comparison)
- Incremental updates (INSERT, UPDATE, DELETE)
- Conflict resolution
- Sync metadata tracking

**Implementation**:

```python
class SyncEngine:
    def detect_changes(table_name):
        # Compare Excel vs DB
        # Return changed records

    def apply_changes(table_name, changes):
        # Apply detected changes
        # Log transactions

    def sync_all():
        # Sync all tables in order
        # Track in sincronizacion_metadata
```

**Table**: `sincronizacion_metadata`
- Last sync timestamp
- Records inserted/updated/deleted
- Sync status and duration

#### 10.2 Enhanced Column Mapping

**Issue**: Some tables show 0 migrated rows (personas, grupos)

**Solution**:
- Dynamic column detection
- Fuzzy matching for column names
- Manual mapping configuration file

#### 10.3 Remaining Table Migrations

**To Implement**:
- informacion_economica (denormalize year columns)
- facturacion (from Master)
- facturacion_mensual (from Facturado)
- datos_ejecucion
- hechos
- etiquetas (denormalize sparse matrix)
- ltp, wbes, iniciativas_metodologia
- transacciones (audit trail)

#### 10.4 Web Interface

**Features**:
- Dashboard for migration status
- Quality issue review and resolution
- Data exploration
- Export capabilities

**Technology**: Flask/FastAPI + SQLite

#### 10.5 Export Capabilities

**Formats**:
- Excel export (round-trip)
- CSV export for analysis
- JSON API for integration

#### 10.6 Advanced Validation

**Additional Rules**:
- Business logic validation
- Cross-table consistency checks
- Duplicate detection
- Data completeness scoring

#### 10.7 Automated Testing

**Test Suite**:
- Unit tests for data quality functions
- Integration tests for migration
- Regression tests for schema changes
- Performance benchmarks

### Known Limitations

1. **One-way sync**: Currently Excel → DB only (not bidirectional)
2. **Manual conflict resolution**: No automated conflict resolution
3. **Limited relationship mapping**: Parent-child in grupos not fully implemented
4. **No incremental load**: Full table reload on each migration
5. **Sequential processing**: No parallel table migration

### Recommended Improvements

1. **Add logging framework**: Replace print() with proper logging (e.g., loguru)
2. **Configuration file**: YAML/TOML for column mappings and settings
3. **Progress indicators**: Use tqdm for long-running operations
4. **Error recovery**: Checkpointing for resumable migrations
5. **Data versioning**: Snapshot capability for rollback

---

## Appendices

### A. Excel Sheet Mappings

| Excel Sheet | Database Table | Rows | Columns | Mapping | Status |
|-------------|---------------|------|---------|---------|--------|
| Query Datos Relevantes | iniciativas | 798 | 61 | Exact 1:1 | ✓ Implemented |
| Datos descriptivos | datos_descriptivos | 804 | 19 | Exact 1:1 | ✓ Implemented |
| Información Económica | informacion_economica | 794 | 25 | Exact 1:1 | ✓ Implemented |
| Facturación | facturacion | 476 | 6 | Exact 1:1 | ✓ Implemented |
| Datos ejecución | datos_ejecucion | 209 | 16 | Exact 1:1 | ✓ Implemented |
| Hechos | hechos | 2,823 | 13 | Exact 1:1 | ✓ Implemented |
| Beneficios | beneficios | 27,869 | 12 | Exact 1:1 | ✓ Implemented |
| Etiquetas | etiquetas | 7,230 | 7 | Exact 1:1 | ✓ Implemented |
| Justificaciones | justificaciones | 513 | 8 | Exact 1:1 | ✓ Implemented |
| Personas | personas | 30 | 8 | Exact 1:1 | ✓ Implemented |
| Grupos Iniciativas | grupos_iniciativas | 55 | 8 | Exact 1:1 | ✓ Implemented |
| Query Facturación | facturacion_mensual | Variable | Variable | Custom | ⏳ Planned |
| LTP | ltp | Variable | Variable | Custom | ⏳ Planned |
| WBEs | wbes | Variable | Variable | Custom | ⏳ Planned |
| IM | iniciativas_metodologia | Variable | Variable | Custom | ⏳ Planned |
| Administrador | administrador | Variable | Variable | Custom | ⏳ Planned |
| Transacciones | transacciones | Variable | Variable | Custom | ⏳ Planned |
| Tablas | tabla_metadata | 21 | Variable | Custom | ✓ Pre-populated |

### B. Common SQL Queries

```sql
-- Get all active initiatives with budget
SELECT
    i.portfolio_id,
    i.titulo,
    i.estado,
    ie.presupuesto_aprobado,
    ie.gasto_real
FROM iniciativas i
LEFT JOIN informacion_economica ie ON i.portfolio_id = ie.portfolio_id
WHERE i.esta_activo = 1
  AND ie.anio = 2025;

-- Benefits by category
SELECT
    categoria_beneficio,
    anio,
    SUM(valor) as total_valor,
    COUNT(DISTINCT portfolio_id) as num_iniciativas
FROM beneficios
GROUP BY categoria_beneficio, anio
ORDER BY anio, total_valor DESC;

-- Quality issues that need attention
SELECT *
FROM calidad_datos
WHERE severidad IN ('CRITICO', 'ALTO')
  AND estado = 'PENDIENTE'
ORDER BY severidad, fecha_deteccion;

-- Migration progress
SELECT
    tabla_destino,
    filas_migradas,
    filas_error,
    ROUND(duracion_segundos, 2) as segundos,
    estado
FROM migracion_metadata
ORDER BY fecha_inicio DESC;
```

### C. Troubleshooting

**Problem**: Migration shows 0 rows for some tables

**Solution**: Check column name mapping in Excel. Run:
```python
from excel_readers import MasterReader
master = MasterReader()
df = master.read_personas()
print(df.columns.tolist())
```

**Problem**: UNIQUE constraint failures

**Solution**: Expected behavior. Duplicates are filtered. Check `filas_error` in `migracion_metadata`.

**Problem**: Date fields showing NULL

**Solution**: Check Excel for text placeholders like "Falta fecha". These are normalized to NULL with `fecha_XXX_valida = 0`.

**Problem**: Slow queries

**Solution**: Run `ANALYZE;` to update query planner statistics. Check if indexes exist with:
```sql
SELECT name, sql FROM sqlite_master
WHERE type='index' AND tbl_name='iniciativas';
```

---

**Document Version**: 1.0
**Last Updated**: January 2026
**Maintained By**: Portfolio Migration Team
