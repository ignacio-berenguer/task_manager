# Feature_03: Additional Tables Migration - Technical Specifications

**Version:** 1.0
**Date:** January 2026
**Status:** Draft

---

## 1. Overview

Feature_03 extends the portfolio migration system with:
1. **Part 1**: Bug fixes and pending function implementations from Feature_02
2. **Part 2**: 7 new tables from PortfolioDigital_Master.xlsm with exact 1:1 column mapping

---

## 2. Part 1: Feature_02 Pending Items

### 2.1 Validation Mismatch Analysis

Feature_02 implemented the `datos_relevantes` calculated table but has ~460 validation mismatches against the `iniciativas` table.

| Category | Count | Root Cause |
|----------|-------|------------|
| estado_aprobacion logic | ~240 | Returns "Estado erroneo" for execution states |
| estado_ejecucion logic | ~100 | Case-sensitive state matching |
| Partida format | ~115 | "2025.0" format vs "2025" in hechos |
| Pending functions | ~5 | 8 functions return NULL |

### 2.2 Pending Functions (8)

| Function | Column | Expected Return Type |
|----------|--------|---------------------|
| `estado_agrupado()` | estado_agrupado | TEXT |
| `estado_dashboard()` | estado_dashboard | TEXT |
| `estado_requisito_legal()` | estado_requisito_legal | TEXT |
| `siguiente_accion()` | siguiente_accion | TEXT |
| `fecha_iniciativa()` | fecha_iniciativa | TEXT (ISO 8601) |
| `fecha_limite()` | fecha_limite | TEXT (ISO 8601) |
| `fecha_limite_comentarios()` | fecha_limite_comentarios | TEXT |
| `esta_en_los_206_me_de_2026()` | esta_en_los_206_me_de_2026 | TEXT |

---

## 3. Part 2: New Tables

### 3.1 Source Information

**Workbook**: PortfolioDigital_Master.xlsm

| Sheet Name | Table Name | Rows | Cols | skiprows |
|------------|------------|------|------|----------|
| Notas | notas | 204 | 6 | 2 |
| Avance | avance | 1182 | 16 | 0 |
| Acciones | acciones | 814 | 14 | 2 |
| Descripciones | descripciones | 115 | 10 | 2 |
| Estado Especial | estado_especial | 3 | 5 | 2 |
| IM | iniciativas_metodologia | 27 | 54 | 2 |
| Impacto AATT | impacto_aatt | 44 | 20 | 2 |

---

## 4. Table Specifications

### 4.1 notas

**Purpose**: Notes/comments for portfolio initiatives

**Excel Columns** (6):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| PORTFOLIO ID | portfolio_id | TEXT NOT NULL |
| Nombre | nombre | TEXT |
| Registrado Por | registrado_por | TEXT |
| Fecha | fecha | TEXT (ISO 8601) |
| Nota | nota | TEXT |
| Referente BI | referente_bi | TEXT |

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- Index: idx_notas_portfolio(portfolio_id)

---

### 4.2 avance

**Purpose**: Progress tracking records

**Excel Columns** (16):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| Unnamed: 0 | (skip) | - |
| Portfolio ID | portfolio_id | TEXT NOT NULL |
| Descripción | descripcion | TEXT |
| Fecha Introducción | fecha_introduccion | TEXT (ISO 8601) |
| Año | anio | INTEGER |
| Mes | mes | TEXT |
| Fecha inicio | fecha_inicio | TEXT (ISO 8601) |
| Fecha UAT | fecha_uat | TEXT (ISO 8601) |
| Fecha Fin Prevista | fecha_fin_prevista | TEXT (ISO 8601) |
| Avance 2025 | avance_2025 | REAL |
| Comentario | comentario | TEXT |
| Error Fecha Inicio | error_fecha_inicio | TEXT |
| Error Fecha UAT | error_fecha_uat | TEXT |
| Error Fecha Fin Prevista | error_fecha_fin_prevista | TEXT |
| Error Avance | error_avance | TEXT |
| Tiene Error | tiene_error | TEXT |

**Notes**:
- skiprows=0 (headers in row 0)
- Skip "Unnamed: 0" column during import

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- Index: idx_avance_portfolio(portfolio_id)

---

### 4.3 acciones

**Purpose**: Action items and next steps

**Excel Columns** (14):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| Portfolio ID | portfolio_id | TEXT NOT NULL |
| Nombre | nombre | TEXT |
| Unidad | unidad | TEXT |
| Estado | estado | TEXT |
| Cluster 2025 | cluster_2025 | TEXT |
| Tipo | tipo | TEXT |
| Siguiente Acción | siguiente_accion | TEXT |
| Siguiente Acción Comentarios | siguiente_accion_comentarios | TEXT |
| Reference BI | referente_bi | TEXT (normalized) |
| Referente B Unit | referente_b_unit | TEXT |
| Referente ICT | referente_ict | TEXT |
| Importe 2025 | importe_2025 | REAL |
| Importe 2026 | importe_2026 | REAL |
| Comentarios | comentarios | TEXT |

**Notes**:
- "Reference BI" normalized to "referente_bi" for consistency

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- Index: idx_acciones_portfolio(portfolio_id)

---

### 4.4 descripciones

**Purpose**: Description records by type

**Excel Columns** (10):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| Portfolio ID | portfolio_id | TEXT NOT NULL |
| Tipo Descripción | tipo_descripcion | TEXT |
| Descripción | descripcion | TEXT |
| Fecha Modificación | fecha_modificacion | TEXT (ISO 8601) |
| Origen Registro | origen_registro | TEXT |
| Comentarios | comentarios | TEXT |
| Nombre | nombre | TEXT |
| Digital Framework Level 1 | digital_framework_level_1 | TEXT |
| Estado de la Iniciativa | estado_de_la_iniciativa | TEXT |
| Referente B Unit | referente_b_unit | TEXT |

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- UNIQUE: (portfolio_id, tipo_descripcion)
- Index: idx_descripciones_portfolio(portfolio_id)

---

### 4.5 estado_especial

**Purpose**: Special status overrides for initiatives

**Excel Columns** (5):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| Portfolio ID | portfolio_id | TEXT NOT NULL UNIQUE |
| Nombre | nombre | TEXT |
| Estado Especial | estado_especial | TEXT |
| Fecha Modificación | fecha_modificacion | TEXT (ISO 8601) |
| Comentarios | comentarios | TEXT |

**Notes**:
- Only 3 rows - used for special status overrides
- Enables `estado_iniciativa()` function in calculate.py

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- UNIQUE: portfolio_id
- Index: idx_estado_especial_portfolio(portfolio_id)

---

### 4.6 iniciativas_metodologia (IM)

**Purpose**: Investment Memo tracking

**Excel Columns** (54):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| PORTFOLIO ID | portfolio_id | TEXT NOT NULL UNIQUE |
| Nombre | nombre | TEXT |
| Descripción | descripcion | TEXT |
| Fecha Investment Memo Aprobado | fecha_investment_memo_aprobado | TEXT |
| NEW CAPEX DEV | new_capex_dev | REAL |
| NEW CAPEX MAINT | new_capex_maint | REAL |
| NEW OPEX ICT | new_opex_ict | REAL |
| Referente Negocio | referente_negocio | TEXT |
| Link IM | link_im | TEXT |
| Fecha Inicio Proyecto | fecha_inicio_proyecto | TEXT |
| Fecha Final Proyecto | fecha_final_proyecto | TEXT |
| Estado Proyecto | estado_proyecto | TEXT |
| Investment 2024 | investment_2024 | REAL |
| Investment 2025 | investment_2025 | REAL |
| Investment 2026 | investment_2026 | REAL |
| Investment 2027 | investment_2027 | REAL |
| Investment 2028 | investment_2028 | REAL |
| Investment 2029 | investment_2029 | REAL |
| Investment 2030 | investment_2030 | REAL |
| Benefits 2024 | benefits_2024 | REAL |
| Benefits 2024: Margin Increase | benefits_2024_margin_increase | REAL |
| Benefits 2024: Opex Reduction Business | benefits_2024_opex_reduction_business | REAL |
| Benefits 2024: Opex Reduction ICT | benefits_2024_opex_reduction_ict | REAL |
| Other Benefits 2024 | other_benefits_2024 | REAL |
| Benefits 2025 | benefits_2025 | REAL |
| Benefits 2025: Margin Increase | benefits_2025_margin_increase | REAL |
| Benefits 2025: Opex Reduction Business | benefits_2025_opex_reduction_business | REAL |
| Benefits 2025: Opex Reduction ICT | benefits_2025_opex_reduction_ict | REAL |
| Other Benefits 2025 | other_benefits_2025 | REAL |
| Benefits 2026 | benefits_2026 | REAL |
| Benefits 2026: Margin Increase | benefits_2026_margin_increase | REAL |
| Benefits 2026: Opex Reduction Business | benefits_2026_opex_reduction_business | REAL |
| Benefits 2026: Opex Reduction ICT | benefits_2026_opex_reduction_ict | REAL |
| Other Benefits 2026 | other_benefits_2026 | REAL |
| Total Benefits 2027 | total_benefits_2027 | REAL |
| Benefits 2027: Margin Increase | benefits_2027_margin_increase | REAL |
| Benefits 2027: Opex Reduction Business | benefits_2027_opex_reduction_business | REAL |
| Benefits 2027: Opex Reduction ICT | benefits_2027_opex_reduction_ict | REAL |
| Other Benefits 2027 | other_benefits_2027 | REAL |
| Total Benefits 2028 | total_benefits_2028 | REAL |
| Benefits 2028: Margin Increase | benefits_2028_margin_increase | REAL |
| Benefits 2028: Opex Reduction Business | benefits_2028_opex_reduction_business | REAL |
| Benefits 2028: Opex Reduction ICT | benefits_2028_opex_reduction_ict | REAL |
| Other Benefits 2028 | other_benefits_2028 | REAL |
| Total Benefits 2029 | total_benefits_2029 | REAL |
| Benefits 2029: Margin Increase | benefits_2029_margin_increase | REAL |
| Benefits 2029: Opex Reduction Business | benefits_2029_opex_reduction_business | REAL |
| Benefits 2029: Opex Reduction ICT | benefits_2029_opex_reduction_ict | REAL |
| Other Benefits 2029 | other_benefits_2029 | REAL |
| Total Benefits 2030 | total_benefits_2030 | REAL |
| Benefits 2030: Margin Increase | benefits_2030_margin_increase | REAL |
| Benefits 2030: Opex Reduction Business | benefits_2030_opex_reduction_business | REAL |
| Benefits 2030: Opex Reduction ICT | benefits_2030_opex_reduction_ict | REAL |
| Other Benefits 2030 | other_benefits_2030 | REAL |

**Notes**:
- Reader already exists: `read_iniciativas_metodologia()`
- Table was removed from schema.sql, needs to be re-added

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- UNIQUE: portfolio_id
- Index: idx_iniciativas_metodologia_portfolio(portfolio_id)

---

### 4.7 impacto_aatt

**Purpose**: Impact assessment on AATT (field operations)

**Excel Columns** (20):
| Excel Column | DB Column | Type |
|--------------|-----------|------|
| PORTFOLIO ID | portfolio_id | TEXT NOT NULL UNIQUE |
| Nombre | nombre | TEXT |
| Estado de la iniciativa | estado_de_la_iniciativa | TEXT |
| Tiene Impacto en AATT | tiene_impacto_en_aatt | TEXT |
| Afecta a UT (red MT/BT) | afecta_a_ut_red_mt_bt | TEXT |
| Afecta O&M-CC | afecta_om_cc | TEXT |
| Afecta P&M | afecta_pm | TEXT |
| Afecta HSEQ | afecta_hseq | TEXT |
| Afecta Inspecciones | afecta_inspecciones | TEXT |
| Afecta AT | afecta_at | TEXT |
| Comentarios | comentarios | TEXT |
| Digital Framework Level 1 | digital_framework_level_1 | TEXT |
| Unidad | unidad | TEXT |
| Referente BI | referente_bi | TEXT |
| IT Partner | it_partner | TEXT |
| Referente B Unit | referente_b_unit | TEXT |
| Fecha Prevista Finalización | fecha_prevista_finalizacion | TEXT |
| Fecha Finalización ICT | fecha_finalizacion_ict | TEXT |
| % Avance ICT | porcentaje_avance_ict | REAL |
| Falta Evaluación Impacto AATT | falta_evaluacion_impacto_aatt | TEXT |

**Constraints**:
- FK: portfolio_id → iniciativas(portfolio_id) ON DELETE CASCADE
- UNIQUE: portfolio_id
- Index: idx_impacto_aatt_portfolio(portfolio_id)

---

## 5. Data Quality

### 5.1 Normalization Rules

All columns follow the standard naming convention:
1. Lowercase
2. Remove accents (Año → anio, Descripción → descripcion)
3. Replace spaces with underscores
4. Remove special characters (parentheses, slashes)
5. Collapse multiple underscores

### 5.2 Date Handling

All date columns stored as TEXT in ISO 8601 format (YYYY-MM-DD):
- Excel serial dates converted via `normalize_date()`
- Invalid dates → NULL

### 5.3 Currency Handling

All REAL columns:
- Rounded to 2 decimal places via `normalize_currency()`
- NULL for empty/invalid values

---

## 6. Foreign Key Relationships

All new tables reference the `iniciativas` table:

```
iniciativas (portfolio_id)
    ├── notas (many)
    ├── avance (many)
    ├── acciones (many)
    ├── descripciones (many, unique by tipo)
    ├── estado_especial (one)
    ├── iniciativas_metodologia (one)
    └── impacto_aatt (one)
```

---

## 7. Integration with Feature_02

The `estado_especial` table enables the `estado_iniciativa()` function in calculate.py, which currently returns empty values because the lookup table didn't exist.

The `acciones` table provides data for:
- `siguiente_accion()` - lookup siguiente_accion column
- `fecha_limite()` - derive from acciones data
- `fecha_limite_comentarios()` - lookup siguiente_accion_comentarios

---

## 8. Related Documentation

- [CLAUDE.md](../../../CLAUDE.md) - Project overview and conventions
- [Feature_01 specs](../feature_001/specs.md) - Original migration specifications
- [Feature_02 specs](../feature_002/specs.md) - datos_relevantes specifications
