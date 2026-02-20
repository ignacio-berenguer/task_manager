# Feature 017: Management Command Improvements & Data Model Cleanup

## Overview

This feature introduces several improvements to the portfolio migration system:

1. New `recreate_tables` CLI command and pipeline refactoring
2. Removal of redundant/duplicated fields from the database schema
3. Rename `cluster_2025` to `cluster` across the entire stack
4. Create an `instructions.md` quick-reference file
5. Migrate new `dependencias` table from Excel and expose in API/frontend
6. Add WBEs section to the frontend detail page

---

## Requirement 1: `recreate_tables` Command

### Current Behavior

The `full_calculation_datos_relevantes` command chains: `init` (force_overwrite=True) -> `migrate` -> `calculate` -> `export`. The `init` command **deletes the .db file entirely** and recreates it from `schema.sql`.

### New Behavior

- **New command**: `recreate_tables` — drops all tables in the existing database and recreates them from `schema.sql`, without deleting the .db file.
- **Pipeline change**: `full_calculation_datos_relevantes` will chain: `recreate_tables` -> `migrate` -> `calculate` -> `export` (no longer calls `init`).
- `recreate_tables` is also available as a standalone command.

### Implementation Details

- Add `recreate_tables(db_path)` function to `management/src/init/db_init.py`
- Logic: connect to DB -> query `sqlite_master` for all table names -> `DROP TABLE IF EXISTS` for each -> execute `schema.sql`
- Log each dropped table and the recreation summary to both log file and console
- Add `recreate_tables` to CLI choices in `main.py`
- Update `full_calculation_datos_relevantes` to call `recreate_tables()` instead of `create_database(force_overwrite=True)`

---

## Requirement 2: Remove Redundant Fields from Database Schema

### Background

Many tables contain fields that are exact copies of data stored in `datos_descriptivos` or computed from `datos_relevantes`. The backend already has a `calculated_fields` module that computes these on-the-fly during API reads. This requirement removes these redundant columns from the DB schema and migration, while keeping the API response unchanged.

**Excluded from changes**: `iniciativas` and `datos_relevantes` tables are intentionally redundant by design and must NOT be modified.

### Fields to Remove per Table

> **Note to reviewer**: Please review this list carefully. These are the fields I propose to remove from each table based on the existing `calculated_fields/definitions.py` mappings and cross-table analysis.

| Table                     | Fields to Remove                                                                                                                                                                                                                        | Source for Calculated Value                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **informacion_economica** | `nombre`, `referente_bi`, `cluster_2025`, `digital_framework_level_1`, `origen`, `estado`, `debe_tener_cini`, `debe_tener_capex_opex`, `debe_tener_fecha_prevista_pes`, `debe_tener_wbe`, `budget_2026`, `importe_2025`, `importe_2026` | datos_descriptivos + datos_relevantes + computed |
| **datos_ejecucion**       | `nombre`, `unidad`, `estado_de_la_iniciativa`, `fecha_de_ultimo_estado`, `origen`, `importe_2025`, `importe_facturado_2025`, `tipo_agrupacion`                                                                                          | datos_descriptivos + datos_relevantes            |
| **hechos**                | `nombre`, `referente_bi`                                                                                                                                                                                                                | datos_descriptivos                               |
| **beneficios**            | `nombre`, `estado_de_la_iniciativa`                                                                                                                                                                                                     | datos_descriptivos + datos_relevantes            |
| **etiquetas**             | `nombre`                                                                                                                                                                                                                                | datos_descriptivos                               |
| **justificaciones**       | `nombre`, `digital_framework_level_1`                                                                                                                                                                                                   | datos_descriptivos                               |
| **ltp**                   | `nombre`, `digital_framework_level_1`                                                                                                                                                                                                   | datos_descriptivos                               |
| **wbes**                  | `nombre`                                                                                                                                                                                                                                | datos_descriptivos                               |
| **notas**                 | `nombre`, `referente_bi`                                                                                                                                                                                                                | datos_descriptivos                               |
| **avance**                | `descripcion`                                                                                                                                                                                                                           | datos_descriptivos (nombre)                      |
| **acciones**              | `nombre`, `unidad`, `estado`, `cluster_2025`, `tipo`, `referente_bi`, `referente_b_unit`, `referente_ict`, `importe_2025`, `importe_2026`                                                                                               | datos_descriptivos + datos_relevantes            |
| **descripciones**         | `nombre`, `digital_framework_level_1`, `estado_de_la_iniciativa`, `referente_b_unit`                                                                                                                                                    | datos_descriptivos + datos_relevantes            |
| **estado_especial**       | `nombre`                                                                                                                                                                                                                                | datos_descriptivos                               |
| **investment_memos**      | `nombre`                                                                                                                                                                                                                                | datos_descriptivos                               |
| **impacto_aatt**          | `nombre`, `estado_de_la_iniciativa`, `digital_framework_level_1`, `fecha_prevista_finalizacion`, `fecha_finalizacion_ict`, `falta_evaluacion_impacto_aatt`                                                                              | datos_descriptivos + datos_relevantes + computed |
| **facturacion**           | `descripcion`                                                                                                                                                                                                                           | datos_descriptivos (nombre)                      |
| **datos_descriptivos**    | `estado_de_la_iniciativa`, `justificacion_regulatoria`, `falta_justificacion_regulatoria`                                                                                                                                               | datos_relevantes + computed                      |
| **grupos_iniciativas**    | `nombre_componente`, `importe_2025_componente`, `importe_2025_grupo`                                                                                                                                                                    | datos_relevantes                                 |

**Total**: ~65 redundant columns removed across 18 tables.

### Impact on Components

| Component                                      | Impact                                                                                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db/schema.sql`                                | Remove columns from CREATE TABLE statements                                                                                                                       |
| `management/src/migrate/engine.py`             | Remove redundant field extraction and INSERT for each `migrate_*` method                                                                                          |
| `management/src/migrate/excel_readers.py`      | No change needed (readers return all Excel columns; engine selects which to insert)                                                                               |
| `management/src/calculate/engine.py`           | No change needed (reads from datos_descriptivos and informacion_economica core fields)                                                                            |
| `backend/app/models.py`                        | Remove Column definitions for redundant fields                                                                                                                    |
| `backend/app/calculated_fields/definitions.py` | No change needed (already defines these as calculated)                                                                                                            |
| `backend/app/routers/portfolio.py`             | **Fix**: Must use `model_to_dict_with_calculated()` instead of plain `model_to_dict()` so that calculated fields are populated in the portfolio endpoint response |
| `backend/app/schemas.py`                       | No change needed (Pydantic schemas remain as-is, they reflect API response shape)                                                                                 |
| API consumers / Frontend                       | No change needed (API response is unchanged)                                                                                                                      |

### Critical Fix: Portfolio Router

Currently, `backend/app/routers/portfolio.py` uses `model_to_dict()` which does NOT populate calculated fields. After removing redundant columns from the DB, this would return `null` for those fields. The fix is to use `model_to_dict_with_calculated()` from `crud.py` which runs the calculated fields service.

---

## Requirement 3: Rename `cluster_2025` to `cluster`

### Scope

Rename the field `cluster_2025` to `cluster` everywhere it appears:

| Layer                         | Files                                              | Changes                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Database**                  | `db/schema.sql`                                    | Rename column in `iniciativas`, `datos_descriptivos`, `datos_relevantes`, `acciones` (Note: `informacion_economica` already has a separate `cluster` column — its `cluster_2025` is a calculated field being removed in Req 2) |
| **Migration**                 | `management/src/migrate/engine.py`                 | Update column references in INSERT statements                                                                                                                                                                                  |
| **Migration**                 | `management/src/migrate/excel_readers.py`          | Update column normalization mapping if needed                                                                                                                                                                                  |
| **Calculate**                 | `management/src/calculate/*.py`                    | Update lookup references                                                                                                                                                                                                       |
| **Backend models**            | `backend/app/models.py`                            | Rename Column attributes                                                                                                                                                                                                       |
| **Backend schemas**           | `backend/app/schemas.py`                           | Rename Pydantic fields                                                                                                                                                                                                         |
| **Backend calculated_fields** | `backend/app/calculated_fields/definitions.py`     | Update `cluster_2025` references in CALCULATED_FIELDS and FIELD_CALCULATORS                                                                                                                                                    |
| **Backend routers**           | `backend/app/routers/hechos.py` (report filter)    | Update references                                                                                                                                                                                                              |
| **Frontend**                  | 12 files across dashboard, search, reports, detail | Rename `cluster_2025` to `cluster`                                                                                                                                                                                             |

### Special Case: `informacion_economica`

The `informacion_economica` table has TWO cluster columns:

- `cluster` — native field from Excel (different meaning, e.g., cluster grouping in economic data)
- `cluster_2025` — calculated field (being removed in Req 2)

Since `cluster_2025` is being removed as a calculated field in Req 2, there is no rename needed in `informacion_economica`. The existing `cluster` column stays as-is.

### Special Case: export process

In the export process (export command), the field cluster_2025 should be maintained.

---

## Requirement 4: `instructions.md` File

Create `/home/nacho/dev/portfolio_migration/instructions.md` with concise instructions for:

- Migration commands (recreate_tables, migrate, calculate, export, full pipeline)
- Starting the backend API server
- Starting the frontend development server
- Debugging backend / migration (log files, debug log level)
- Excel source file setup

---

## Requirement 5: `dependencias` Table Migration

### New Table: `dependencias`

**Source**: Master workbook (`PortfolioDigital_Master.xlsm`), sheet "Dependencias"

> **Note**: The exact column structure needs to be discovered from the Excel file. The implementation will read the sheet headers and create the appropriate schema. Expected columns based on typical dependency tracking:
>
> - `portfolio_id` (FK to iniciativas)
> - `portfolio_id_dependencia` (the dependent initiative)
> - Additional metadata columns from the sheet

### Implementation

| Component                                                                  | Change                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `db/schema.sql`                                                            | Add `CREATE TABLE dependencias` with discovered columns             |
| `management/src/migrate/excel_readers.py`                                  | Add `read_dependencias()` to `MasterReader`                         |
| `management/src/migrate/engine.py`                                         | Add `migrate_dependencias()` method and include in migration phases |
| `backend/app/models.py`                                                    | Add `Dependencia` SQLAlchemy model                                  |
| `backend/app/routers/dependencias.py`                                      | New router with CRUD endpoints                                      |
| `backend/app/routers/portfolio.py`                                         | Add `dependencias` to `TABLE_MODELS`                                |
| `frontend/src/features/detail/components/sections/DependenciasSection.jsx` | New section component                                               |
| `frontend/src/features/detail/components/sections/index.js`                | Export new section                                                  |
| `frontend/src/features/detail/DetailPage.jsx`                              | Add Dependencias section at bottom                                  |

---

## Requirement 6: WBEs Section in Detail Page

### Current State

The backend already serves WBE data via the portfolio endpoint (WBE is in `TABLE_MODELS`), but the frontend detail page does not display it.

### Implementation

| Component                                                          | Change                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| `frontend/src/features/detail/components/sections/WbesSection.jsx` | New section component (following pattern of LtpSection) |
| `frontend/src/features/detail/components/sections/index.js`        | Export `WbesSection`                                    |
| `frontend/src/features/detail/DetailPage.jsx`                      | Extract `wbes` from data, add section at bottom of page |

### Column Display

| Key               | Label           | Type |
| ----------------- | --------------- | ---- |
| `anio`            | Anio            | text |
| `wbe_pyb`         | WBE PyB         | text |
| `descripcion_pyb` | Descripcion PyB | text |
| `wbe_can`         | WBE CAN         | text |
| `descripcion_can` | Descripcion CAN | text |

---

## General Requirements

- All operations logged to `logs/portfolio_migration.log` (configurable via `.env`)
- Important operations also logged to console
- Default log level: INFO (configurable via `.env`)
- Update `README.md` after all changes
- Update `specs/architecture_frontend.md` and `specs/architecture_backend.md` after all changes
- Existing functionality preserved except for changes specified here
