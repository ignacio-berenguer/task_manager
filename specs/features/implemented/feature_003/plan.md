# Feature_03 Implementation Plan

**Status:** Implemented
**Date:** January 2026

---

## Overview

Feature_03 has two main parts:
1. **Part 1**: Carry over and fix pending items from Feature_02 (validation mismatches, pending functions)
2. **Part 2**: Add 7 new tables from PortfolioDigital_Master.xlsm with exact 1:1 column mapping

---

## Part 1: Feature_02 Bug Fixes & Pending Functions

### 1.1 Validation Mismatch Fixes

| Category | Issue | Fix Applied |
|----------|-------|------------|
| en_presupuesto_del_ano | Using "2025" format | Fixed to use "2025.0" to match hechos table |
| calidad_valoracion | Using "2025" format | Fixed to use "2025.0" to match hechos table |
| importe functions | Using "2025" format | Fixed to use "2025.0" to match hechos table |

### 1.2 Pending Functions Implemented

| Function | Implementation |
|----------|---------------|
| `estado_agrupado()` | Lookup from estado_especial table, fallback to deriving from estado |
| `estado_dashboard()` | Derived from estado_de_la_iniciativa |
| `estado_requisito_legal()` | Lookup from justificaciones/etiquetas tables |
| `siguiente_accion()` | Lookup from acciones table |
| `fecha_limite()` | Returns None (format TBD) |
| `fecha_limite_comentarios()` | From acciones.siguiente_accion_comentarios |
| `esta_en_los_206_me_de_2026()` | Returns "Sí" if importe_2026 > 0 |

---

## Part 2: New Tables (7 tables from PortfolioDigital_Master.xlsm)

### 2.1 Table Summary (Implemented)

| Sheet Name | Table Name | Rows Migrated | skiprows |
|------------|------------|---------------|----------|
| Notas | notas | 222 | 2 |
| Avance | avance | 1182 | 0 |
| Acciones | acciones | 814 | 2 |
| Descripciones | descripciones | 115 | 2 |
| Estado Especial | estado_especial | 3 | 2 |
| IM | investment_memos | 26 | 2 |
| Impacto AATT | impacto_aatt | 44 | 2 |

---

## Implementation Completed

### Phase 1: Schema Changes
- Added 7 CREATE TABLE statements to schema.sql
- Tables added before migracion_metadata
- All tables have FK to iniciativas, audit columns, indexes

### Phase 2: Excel Readers
- Added 6 reader methods to MasterReader class
- IM reader already existed

### Phase 3: Migration Methods
- Added 7 migrate_* methods following existing pattern
- Updated migrate_all() with Phase 6: Additional Tables

### Phase 4: Calculation Fixes
- Fixed partida format (use "2025.0" to match hechos table)
- Implemented 7 pending functions

---

## Validation Results

After implementation:
- **Total rows calculated**: 811
- **Total mismatches**: 3 (down from 460)
- **Remaining mismatches**: Data consistency issues in source Excel (hechos vs iniciativas tables have different estados for 3 records)

---

## Files Modified

| File | Changes |
|------|---------|
| `schema.sql` | Added 7 CREATE TABLE statements |
| `excel_readers.py` | Added 6 reader methods |
| `migrate.py` | Added 7 migrate_* methods, updated migrate_all() |
| `calculate.py` | Fixed partida format, implemented 7 functions |

---

**Implementation Status:** Complete
