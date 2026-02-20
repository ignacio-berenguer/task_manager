# Feature 02: Datos Relevantes - Computed Table

**Version:** 1.0
**Date:** January 2026
**Status:** Planning

---

## Overview

Create a new computed table `datos_relevantes` that consolidates and calculates data from multiple source tables in the database. This table provides a single, denormalized view of key portfolio metrics for each initiative.

### Purpose

- Consolidate data from multiple tables into a single queryable table
- Pre-calculate derived metrics for reporting and analysis
- Provide one record per initiative (matching `datos_descriptivos`)
- Enable efficient queries without complex joins

### Key Characteristics

- **Computed/Derived**: Data is calculated from existing tables, not migrated from Excel
- **One-to-One with datos_descriptivos**: Each record in `datos_descriptivos` has exactly one corresponding record
- **Primary Key**: `portfolio_id` (TEXT)
- **Refresh on Demand**: Recalculated via CLI command
- **Full Refresh**: Each execution deletes all previous records before recalculating

---

## Execution Flow

The `calculate` command follows this execution sequence:

```
1. DELETE all existing records from datos_relevantes
2. INSERT one row per datos_descriptivos record (portfolio_id only)
3. LOOP through each row:
   a. Calculate all lookup fields (from datos_descriptivos, informacion_economica)
   b. Calculate all function-based fields (calling Python functions)
   c. UPDATE the row with calculated values
4. Log statistics and report results
```

### Pseudocode

```python
def calculate_datos_relevantes(conn):
    # Step 1: Clear existing data
    DELETE FROM datos_relevantes

    # Step 2: Insert all portfolio_ids from datos_descriptivos
    INSERT INTO datos_relevantes (portfolio_id)
    SELECT portfolio_id FROM datos_descriptivos

    # Step 3: Loop through each row and calculate
    for portfolio_id in all_portfolio_ids:
        # Calculate lookups
        lookups = get_lookups(portfolio_id)

        # Calculate function-based values
        calculated = {
            'estado_de_la_iniciativa': estado_iniciativa(portfolio_id),
            'budget_2024': importe(portfolio_id, 2024, "Budget"),
            # ... etc
        }

        # Update the row
        UPDATE datos_relevantes SET ... WHERE portfolio_id = ?

    # Step 4: Commit and report
    conn.commit()
```

---

## Database Schema

### Table: `datos_relevantes`

```sql
CREATE TABLE IF NOT EXISTS datos_relevantes (
    portfolio_id TEXT PRIMARY KEY,

    -- Lookups from datos_descriptivos
    nombre TEXT,
    unidad TEXT,
    origen TEXT,
    digital_framework_level_1 TEXT,
    prioridad_descriptiva TEXT,
    cluster_2025 TEXT,
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
    fecha_calculo DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (portfolio_id) REFERENCES datos_descriptivos(portfolio_id)
);

CREATE INDEX IF NOT EXISTS idx_datos_relevantes_estado ON datos_relevantes(estado_de_la_iniciativa);
CREATE INDEX IF NOT EXISTS idx_datos_relevantes_cluster ON datos_relevantes(cluster_2025);
CREATE INDEX IF NOT EXISTS idx_datos_relevantes_unidad ON datos_relevantes(unidad);
```

---

## Field Definitions

### Category 1: Lookups from `datos_descriptivos`

These fields are copied directly from the corresponding field in `datos_descriptivos`.

| Column                    | Type | Source Field                                 |
| ------------------------- | ---- | -------------------------------------------- |
| nombre                    | TEXT | datos_descriptivos.nombre                    |
| unidad                    | TEXT | datos_descriptivos.unidad                    |
| origen                    | TEXT | datos_descriptivos.origen                    |
| digital_framework_level_1 | TEXT | datos_descriptivos.digital_framework_level_1 |
| prioridad_descriptiva     | TEXT | datos_descriptivos.prioridad_descriptiva_bi  |
| cluster_2025              | TEXT | datos_descriptivos.cluster_2025              |
| priorizacion              | TEXT | datos_descriptivos.priorizacion              |
| tipo                      | TEXT | datos_descriptivos.tipo_proyecto             |
| referente_negocio         | TEXT | datos_descriptivos.referente_b_unit          |
| referente_bi              | TEXT | datos_descriptivos.referente_bi              |
| jira_id                   | TEXT | datos_descriptivos.codigo_jira               |
| it_partner                | TEXT | datos_descriptivos.it_partner                |
| referente_ict             | TEXT | datos_descriptivos.referente_enabler_ict     |
| tipo_agrupacion           | TEXT | datos_descriptivos.tipo_agrupacion           |

### Category 2: Lookups from `informacion_economica`

These fields are copied from the corresponding field in `informacion_economica`.

| Column             | Type | Source Field                             |
| ------------------ | ---- | ---------------------------------------- |
| capex_opex         | TEXT | informacion_economica.capex_opex         |
| cini               | TEXT | informacion_economica.cini               |
| fecha_prevista_pes | TEXT | informacion_economica.fecha_prevista_pes |

### Category 3: Constant Values

| Column                       | Type | Value                           |
| ---------------------------- | ---- | ------------------------------- |
| nuevo_importe_2025           | REAL | 0                               |
| cluster_de_antes_de_1906     | TEXT | "" (empty string)               |
| estado_de_la_iniciativa_2026 | TEXT | Same as estado_de_la_iniciativa |

### Category 4: Python Function Calculations

#### 4.1 Estado Functions (to be defined)

| Column                  | Type | Function Call                                |
| ----------------------- | ---- | -------------------------------------------- |
| estado_de_la_iniciativa | TEXT | `estado_iniciativa(portfolio_id)`            |
| fecha_de_ultimo_estado  | TEXT | `fecha_de_ultimo_estado(portfolio_id)`       |
| estado_aprobacion       | TEXT | `estado_aprobacion_iniciativa(portfolio_id)` |
| estado_ejecucion        | TEXT | `estado_ejecucion_iniciativa(portfolio_id)`  |
| estado_agrupado         | TEXT | `estado_agrupado(portfolio_id)`              |
| estado_dashboard        | TEXT | `estado_dashboard(portfolio_id)`             |
| estado_requisito_legal  | TEXT | `estado_requisito_legal(portfolio_id)`       |

#### 4.2 Importe Function

All financial fields use the same function with different parameters:

```python
def importe(portfolio_id: str, ano: int, tipo_importe: str) -> float:
    """
    Calculate importe for a given portfolio, year, and type.
    To be defined later.
    """
    pass
```

| Column                   | Function Call                                 |
| ------------------------ | --------------------------------------------- |
| budget_2024              | `importe(portfolio_id, 2024, "Budget")`       |
| importe_sm200_24         | `importe(portfolio_id, 2024, "SM200")`        |
| importe_aprobado_2024    | `importe(portfolio_id, 2024, "Aprobado")`     |
| importe_citetic_24       | `importe(portfolio_id, 2024, "Citetic")`      |
| importe_facturacion_2024 | `importe(portfolio_id, 2024, "Facturado")`    |
| importe_2024             | `importe(portfolio_id, 2024, "Importe")`      |
| budget_2025              | `importe(portfolio_id, 2025, "Budget")`       |
| importe_sm200_2025       | `importe(portfolio_id, 2025, "SM200")`        |
| importe_aprobado_2025    | `importe(portfolio_id, 2025, "Aprobado")`     |
| importe_facturacion_2025 | `importe(portfolio_id, 2025, "Facturado")`    |
| importe_2025             | `importe(portfolio_id, 2025, "Importe")`      |
| importe_2025_cc_re       | `importe(portfolio_id, 2025, "Cash Cost RE")` |
| budget_2026              | `importe(portfolio_id, 2026, "Budget")`       |
| importe_sm200_2026       | `importe(portfolio_id, 2026, "SM200")`        |
| importe_aprobado_2026    | `importe(portfolio_id, 2026, "Aprobado")`     |
| importe_facturacion_2026 | `importe(portfolio_id, 2026, "Facturado")`    |
| importe_2026             | `importe(portfolio_id, 2026, "Importe")`      |
| budget_2027              | `importe(portfolio_id, 2027, "Budget")`       |
| importe_sm200_2027       | `importe(portfolio_id, 2027, "SM200")`        |
| importe_aprobado_2027    | `importe(portfolio_id, 2027, "Aprobado")`     |
| importe_facturacion_2027 | `importe(portfolio_id, 2027, "Facturado")`    |
| importe_2027             | `importe(portfolio_id, 2027, "Importe")`      |
| importe_2028             | `importe(portfolio_id, 2028, "Importe")`      |

#### 4.3 Date Functions

```python
def fecha_iniciativa(portfolio_id: str, tipo_fecha: str) -> str:
    """
    Get a specific date for an initiative. Returns ISO 8601 format.
    To be defined later.
    """
    pass
```

| Column                   | Function Call                                        |
| ------------------------ | ---------------------------------------------------- |
| fecha_sm100              | `fecha_iniciativa(portfolio_id, "SM100 Final")`      |
| fecha_aprobada_con_cct   | `fecha_iniciativa(portfolio_id, "Aprobada con CCT")` |
| fecha_en_ejecucion       | `fecha_iniciativa(portfolio_id, "En ejecución")`     |
| fecha_limite             | `fecha_limite(portfolio_id)`                         |
| fecha_limite_comentarios | `fecha_limite_comentarios(portfolio_id)`             |

#### 4.4 Other Functions

| Column                     | Type | Function Call                              |
| -------------------------- | ---- | ------------------------------------------ |
| en_presupuesto_del_ano     | TEXT | `en_presupuesto_del_ano(portfolio_id)`     |
| calidad_valoracion         | TEXT | `calidad_valoracion(portfolio_id, ano)`    |
| siguiente_accion           | TEXT | `siguiente_accion(portfolio_id, ano)`      |
| esta_en_los_206_me_de_2026 | TEXT | `esta_en_los_206_me_de_2026(portfolio_id)` |

#### 4.5 Undefined Calculation

| Column                     | Type | Notes                     |
| -------------------------- | ---- | ------------------------- |
| diferencia_apr_eje_exc_ept | REAL | Calculation to be defined |

---

## Function Implementation Logic

The Python functions in this feature are translations of Excel formulas that were previously used in the Excel workbooks. Each function mimics the behavior of its Excel counterpart, using SQL queries against the database tables instead of Excel ranges.

### Source Data: Hechos Table

Most functions query the `hechos` table, which has these columns:

| Column                 | Excel Name             | Description                  |
| ---------------------- | ---------------------- | ---------------------------- |
| portfolio_id           | PORTFOLIO ID           | Initiative identifier        |
| nombre                 | Nombre                 | Initiative name              |
| partida_presupuestaria | Partida presupuestaria | Budget line (year indicator) |
| importe                | Importe                | Amount                       |
| estado                 | Estado                 | Status                       |
| fecha                  | Fecha                  | Date                         |
| importe_ri             | Importe RI             | RI amount                    |
| importe_re             | Importe RE             | RE amount                    |
| notas                  | Notas                  | Notes                        |
| racional               | Racional               | Rationale                    |
| calidad_estimacion     | Calidad Estimación     | Estimation quality           |
| referente_bi           | Referente BI           | BI contact                   |
| id_hecho               | ID                     | Record ID (for ordering)     |

### Helper Function: ultimo_id

```python
def ultimo_id(conn, portfolio_id: str, partida_presupuestaria: str = None) -> int:
    """
    Get the latest ID (highest) for a portfolio, optionally filtered by partida.
    Excludes records with estado = "Importe Planificado".

    Excel equivalent:
    =LAMBDA(portfolioID;partidaPresupuestaria;
      IF(OR(ISBLANK(partidaPresupuestaria); partidaPresupuestaria = ""; partidaPresupuestaria = 0);
        CHOOSECOLS(TAKE(SORT(FILTER(Hechos[#Data];
          ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[Estado] <> "Importe Planificado")));
          13; -1); 1); 13);
        CHOOSECOLS(TAKE(SORT(FILTER(Hechos[#Data];
          ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[Partida presupuestaria] = partidaPresupuestaria)
           * (Hechos[Estado] <> "Importe Planificado"))); 13; -1); 1); 13)))
    """
    if not partida_presupuestaria:
        # Get max ID without partida filter
        sql = """
            SELECT MAX(id_hecho) FROM hechos
            WHERE portfolio_id = ? AND estado <> 'Importe Planificado'
        """
        params = (portfolio_id,)
    else:
        # Get max ID with partida filter
        sql = """
            SELECT MAX(id_hecho) FROM hechos
            WHERE portfolio_id = ? AND partida_presupuestaria = ?
              AND estado <> 'Importe Planificado'
        """
        params = (portfolio_id, partida_presupuestaria)

    cursor = conn.cursor()
    cursor.execute(sql, params)
    result = cursor.fetchone()
    return result[0] if result and result[0] else None
```

### Estado Functions

#### estado_iniciativa

```python
def estado_iniciativa(conn, portfolio_id: str) -> str:
    """
    Get special status if exists, otherwise return "No tiene estado especial".

    Excel equivalent:
    =LAMBDA(portfolioID; LET(
      estadoEspecial; XLOOKUP(portfolioID;EstadoEspecial[Portfolio ID];EstadoEspecial[Estado Especial];"No encontrado");
      IF(estadoEspecial <> "No encontrado"; estadoEspecial; "No tiene estado especial")))

    Note: Requires an 'estado_especial' lookup table or equivalent logic.
    """
    # TODO: Implement lookup to estado_especial table
    pass
```

#### fecha_estado

```python
def fecha_estado(conn, portfolio_id: str, estado: str) -> str:
    """
    Get the maximum date for a given portfolio and estado.

    Excel equivalent:
    =LAMBDA(portfolioID;estado;
      IFERROR(MAX(CHOOSECOLS(SORT(FILTER(Hechos[#Data];
        (Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[Estado] = estado); "No encontrado"); 6); 6)); ""))
    """
    sql = """
        SELECT MAX(fecha) FROM hechos
        WHERE portfolio_id = ? AND estado = ?
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, estado))
    result = cursor.fetchone()
    return result[0] if result and result[0] else ""
```

#### fecha_de_ultimo_estado

```python
def fecha_de_ultimo_estado(conn, portfolio_id: str) -> str:
    """
    Get the date of the record with the latest ID.

    Excel equivalent:
    =LAMBDA(portfolioID;
      IFERROR(LET(ultID; UltimoID(portfolioID; "");
        TAKE(CHOOSECOLS(FILTER(Hechos[#Data];
          ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[ID] = ultID))); 6); 1)); "Estado erróneo"))
    """
    ult_id = ultimo_id(conn, portfolio_id)
    if not ult_id:
        return "Estado erróneo"

    sql = """
        SELECT fecha FROM hechos
        WHERE portfolio_id = ? AND id_hecho = ?
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, ult_id))
    result = cursor.fetchone()
    return result[0] if result and result[0] else "Estado erróneo"
```

#### estado_aprobacion_iniciativa

```python
def estado_aprobacion_iniciativa(conn, portfolio_id: str) -> str:
    """
    Get approval status from the latest record, excluding execution states.

    Excel equivalent:
    =LAMBDA(portfolioID;
      IFERROR(LET(ultID; UltimoID(portfolioID; "");
        TAKE(CHOOSECOLS(FILTER(Hechos[#Data];
          ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[ID] = ultID) *
           ((Hechos[Estado] <> "En ejecución") + (Hechos[Estado] <> "Finalizado") +
            (Hechos[Estado] <> "Pendiente PES") + (Hechos[Estado] <> "PES Completado")))); 5); 1));
        "Estado erróneo"))
    """
    ult_id = ultimo_id(conn, portfolio_id)
    if not ult_id:
        return "Estado erróneo"

    excluded_states = ('En ejecución', 'Finalizado', 'Pendiente PES', 'PES Completado')
    sql = """
        SELECT estado FROM hechos
        WHERE portfolio_id = ? AND id_hecho = ?
          AND estado NOT IN (?, ?, ?, ?)
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, ult_id) + excluded_states)
    result = cursor.fetchone()
    return result[0] if result and result[0] else "Estado erróneo"
```

#### estado_ejecucion_iniciativa

```python
def estado_ejecucion_iniciativa(conn, portfolio_id: str) -> str:
    """
    Get execution status from the latest record, only for execution states.

    Excel equivalent:
    =LAMBDA(portfolioID;
      IFERROR(LET(ultID; UltimoID(portfolioID; "");
        TAKE(CHOOSECOLS(FILTER(Hechos[#Data];
          ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[ID] = ultID) *
           ((Hechos[Estado] = "En ejecución") + (Hechos[Estado] = "Finalizado") +
            (Hechos[Estado] = "Pendiente PES") + (Hechos[Estado] = "PES Completado")))); 5); 1));
        "No iniciada"))
    """
    ult_id = ultimo_id(conn, portfolio_id)
    if not ult_id:
        return "No iniciada"

    execution_states = ('En ejecución', 'Finalizado', 'Pendiente PES', 'PES Completado')
    sql = """
        SELECT estado FROM hechos
        WHERE portfolio_id = ? AND id_hecho = ?
          AND estado IN (?, ?, ?, ?)
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, ult_id) + execution_states)
    result = cursor.fetchone()
    return result[0] if result and result[0] else "No iniciada"
```

### Importe Function

```python
def importe(conn, portfolio_id: str, ano: int, tipo_importe: str) -> float:
    """
    Calculate importe based on type. The 'ano' parameter maps to 'partida_presupuestaria'.

    Args:
        portfolio_id: Initiative ID
        ano: Year (2024, 2025, 2026, etc.) - used as partida_presupuestaria
        tipo_importe: One of "Aprobado", "Importe", "En Aprobación", "Importe RE",
                      "Importe Planificado Fijo", "Planificado", "SM200"
    """
    partida = str(ano)  # Year as string for partida_presupuestaria

    if tipo_importe == "Aprobado":
        return _importe_aprobado(conn, portfolio_id, partida)
    elif tipo_importe == "Importe":
        return _importe_iniciativa(conn, portfolio_id, partida)
    elif tipo_importe == "En Aprobación":
        return _importe_en_aprobacion(conn, portfolio_id, partida)
    elif tipo_importe == "Importe RE" or tipo_importe == "Cash Cost RE":
        return _importe_re(conn, portfolio_id, partida)
    elif tipo_importe == "Importe Planificado Fijo":
        return _importe_planificado_fijo(conn, portfolio_id, partida)
    elif tipo_importe == "Planificado":
        return _importe_planificado(conn, portfolio_id, partida)
    elif tipo_importe == "SM200":
        return _importe_sm200(conn, portfolio_id, partida)
    else:
        return 0.0


def _importe_aprobado(conn, portfolio_id: str, partida: str) -> float:
    """
    Excel: =LAMBDA(portfolioID;partidaPresupuestaria;
      LET(estadoAprobación; EstadoAprobaciónIniciativa(portfolioID);
        importeEnAprobación; ImporteIniciativaEnAprobación(portfolioID; partidaPresupuestaria);
        importeSM200; ImporteSM200Iniciativa(portfolioID; partidaPresupuestaria);
        IF(OR(estadoAprobación = "Aprobada"; estadoAprobación = "Aprobada con CCT");
          IF(importeEnAprobación <> 0; importeEnAprobación; importeSM200); 0)))
    """
    estado_aprobacion = estado_aprobacion_iniciativa(conn, portfolio_id)
    if estado_aprobacion in ('Aprobada', 'Aprobada con CCT'):
        importe_aprobacion = _importe_en_aprobacion(conn, portfolio_id, partida)
        if importe_aprobacion != 0:
            return importe_aprobacion
        return _importe_sm200(conn, portfolio_id, partida)
    return 0.0


def _importe_iniciativa(conn, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record matching specific estados.

    Excel: Filters by estados: "SM200 Final", "Importe Planificado", "Aprobada",
           "Aprobada con CCT", "Revisión Regulación", "En ejecución", "SM200 En Revisión"
           Sorts by ID desc, takes first row, returns importe (column 4).
    """
    valid_states = ('SM200 Final', 'Importe Planificado', 'Aprobada', 'Aprobada con CCT',
                    'Revisión Regulación', 'En ejecución', 'SM200 En Revisión')
    sql = f"""
        SELECT importe FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ?
          AND importe <> 0 AND estado IN ({','.join('?' * len(valid_states))})
        ORDER BY id_hecho DESC
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida) + valid_states)
    result = cursor.fetchone()
    return float(result[0]) if result and result[0] else 0.0


def _importe_en_aprobacion(conn, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record with estado "Aprobada" or "Aprobada con CCT".
    """
    sql = """
        SELECT importe FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ?
          AND importe <> 0 AND estado IN ('Aprobada', 'Aprobada con CCT')
        ORDER BY id_hecho DESC
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida))
    result = cursor.fetchone()
    return float(result[0]) if result and result[0] else 0.0


def _importe_re(conn, portfolio_id: str, partida: str) -> float:
    """
    Get importe_re from latest record matching specific estados.
    """
    valid_states = ('SM200 Final', 'Aprobada', 'Aprobada con CCT',
                    'Revisión Regulación', 'En ejecución', 'SM200 En Revisión')
    sql = f"""
        SELECT importe_re FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ?
          AND importe <> 0 AND estado IN ({','.join('?' * len(valid_states))})
        ORDER BY id_hecho DESC
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida) + valid_states)
    result = cursor.fetchone()
    return float(result[0]) if result and result[0] else 0.0


def _importe_planificado_fijo(conn, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record with estado = "Importe Planificado".
    Sorts by fecha (date) instead of ID.
    """
    sql = """
        SELECT importe FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ?
          AND importe <> 0 AND estado = 'Importe Planificado'
        ORDER BY fecha DESC
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida))
    result = cursor.fetchone()
    return float(result[0]) if result and result[0] else 0.0


def _importe_planificado(conn, portfolio_id: str, partida: str) -> float:
    """
    Cascading logic: try planificado_fijo, then SM200, then importe.
    """
    ipfi = _importe_planificado_fijo(conn, portfolio_id, partida)
    if ipfi != 0:
        return ipfi
    ism = _importe_sm200(conn, portfolio_id, partida)
    if ism != 0:
        return ism
    return _importe_iniciativa(conn, portfolio_id, partida)


def _importe_sm200(conn, portfolio_id: str, partida: str) -> float:
    """
    Get importe from latest record with estado "SM200 Final" or "SM200 En Revisión".
    """
    sql = """
        SELECT importe FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ?
          AND importe <> 0 AND estado IN ('SM200 Final', 'SM200 En Revisión')
        ORDER BY id_hecho DESC
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida))
    result = cursor.fetchone()
    return float(result[0]) if result and result[0] else 0.0
```

### Other Functions

#### en_presupuesto_del_ano

```python
def en_presupuesto_del_ano(conn, portfolio_id: str, partida_presupuestaria: str = None) -> str:
    """
    Check if portfolio exists in hechos for given partida.

    Excel equivalent:
    =LAMBDA(portfolioID;partidaPresupuestaria;
      LET(lookupArr; CHOOSECOLS(FILTER(Hechos[#Data];
        Hechos[Partida presupuestaria] = partidaPresupuestaria; "No encontrado"); 1);
        IF(XLOOKUP(portfolioID; lookupArr; lookupArr; "No") <> "No"; "Sí"; "No")))
    """
    if not partida_presupuestaria:
        partida_presupuestaria = "2025"  # Default year

    sql = """
        SELECT 1 FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ?
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida_presupuestaria))
    result = cursor.fetchone()
    return "Sí" if result else "No"
```

#### calidad_valoracion

```python
def calidad_valoracion(conn, portfolio_id: str, ano: int) -> str:
    """
    Get calidad_estimacion from latest record with importe <> 0.

    Excel equivalent:
    =LAMBDA(portfolioID;partidaPresupuestaria;
      IFERROR(CHOOSECOLS(TAKE(CHOOSECOLS(SORT(FILTER(Hechos[#Data];
        ((Hechos[PORTFOLIO ID] = portfolioID) * (Hechos[Partida presupuestaria] = partidaPresupuestaria)
         * (Hechos[Importe] <> 0))); 6); 1; 2; 3; 4; 5; 11); -1); 6); "NO CALIFICADA"))
    """
    partida = str(ano)
    sql = """
        SELECT calidad_estimacion FROM hechos
        WHERE portfolio_id = ? AND partida_presupuestaria = ? AND importe <> 0
        ORDER BY fecha DESC
        LIMIT 1
    """
    cursor = conn.cursor()
    cursor.execute(sql, (portfolio_id, partida))
    result = cursor.fetchone()
    return result[0] if result and result[0] else "NO CALIFICADA"
```

### Functions Pending Implementation

The following functions will be implemented later:

| Function                                     | Status           |
| -------------------------------------------- | ---------------- |
| `estado_agrupado(portfolio_id)`              | ⏳ To be defined |
| `siguiente_accion(portfolio_id, ano)`        | ⏳ To be defined |
| `estado_dashboard(portfolio_id)`             | ⏳ To be defined |
| `estado_requisito_legal(portfolio_id)`       | ⏳ To be defined |
| `fecha_iniciativa(portfolio_id, tipo_fecha)` | ⏳ To be defined |
| `esta_en_los_206_me_de_2026(portfolio_id)`   | ⏳ To be defined |
| `fecha_limite(portfolio_id)`                 | ⏳ To be defined |
| `fecha_limite_comentarios(portfolio_id)`     | ⏳ To be defined |

---

## CLI Interface

### New Command: `calculate_datos_relevantes`

```bash
# Calculate/refresh datos_relevantes table
uv run python main.py calculate_datos_relevantes [--db PATH]
```

**Options:**

- `--db PATH`: Database path (default: `portfolio.db`)

**Behavior:**

1. DELETE all existing records from `datos_relevantes` table
2. INSERT one row per `datos_descriptivos` record (portfolio_id only)
3. LOOP through each row and calculate all columns
4. UPDATE each row with calculated values
5. Log calculation statistics
6. Report success/failure count

### Example Usage

```bash
# Initialize database (if not done)
uv run python main.py init

# Run migration (populate source tables)
uv run python main.py migrate

# Calculate datos_relevantes
uv run python main.py calculate_datos_relevantes

# Validate results
uv run python main.py validate
```

---

## Implementation Files

| File           | Purpose                                   | Status     |
| -------------- | ----------------------------------------- | ---------- |
| `schema.sql`   | Add `datos_relevantes` table DDL          | ⏳ Planned |
| `calculate.py` | Calculation engine + all Python functions | ⏳ Planned |
| `main.py`      | Add `calculate` command                   | ⏳ Planned |

### calculate.py Structure

```python
"""
Calculation engine for datos_relevantes table.
"""

import sqlite3
import logging
from datetime import datetime

logger = logging.getLogger('portfolio_calculate')


# =============================================================================
# LOOKUP FUNCTIONS
# =============================================================================

def get_datos_descriptivos_lookups(conn: sqlite3.Connection, portfolio_id: str) -> dict:
    """Get all lookup fields from datos_descriptivos."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT nombre, unidad, origen, digital_framework_level_1,
               prioridad_descriptiva_bi, cluster_2025, priorizacion,
               tipo_proyecto, referente_b_unit, referente_bi,
               codigo_jira, it_partner, referente_enabler_ict, tipo_agrupacion
        FROM datos_descriptivos
        WHERE portfolio_id = ?
    """, (portfolio_id,))
    row = cursor.fetchone()
    if row:
        return {
            'nombre': row[0],
            'unidad': row[1],
            'origen': row[2],
            'digital_framework_level_1': row[3],
            'prioridad_descriptiva': row[4],
            'cluster_2025': row[5],
            'priorizacion': row[6],
            'tipo': row[7],
            'referente_negocio': row[8],
            'referente_bi': row[9],
            'jira_id': row[10],
            'it_partner': row[11],
            'referente_ict': row[12],
            'tipo_agrupacion': row[13],
        }
    return {}


def get_informacion_economica_lookups(conn: sqlite3.Connection, portfolio_id: str) -> dict:
    """Get all lookup fields from informacion_economica."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT capex_opex, cini, fecha_prevista_pes
        FROM informacion_economica
        WHERE portfolio_id = ?
    """, (portfolio_id,))
    row = cursor.fetchone()
    if row:
        return {
            'capex_opex': row[0],
            'cini': row[1],
            'fecha_prevista_pes': row[2],
        }
    return {}


# =============================================================================
# ESTADO FUNCTIONS (to be implemented)
# =============================================================================

def estado_iniciativa(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate estado de la iniciativa. TO BE DEFINED."""
    pass


def fecha_de_ultimo_estado(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate fecha de último estado. TO BE DEFINED."""
    pass


def estado_aprobacion_iniciativa(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate estado aprobación. TO BE DEFINED."""
    pass


def estado_ejecucion_iniciativa(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate estado ejecución. TO BE DEFINED."""
    pass


def estado_agrupado(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate estado agrupado. TO BE DEFINED."""
    pass


def estado_dashboard(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate estado dashboard. TO BE DEFINED."""
    pass


def estado_requisito_legal(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate estado requisito legal. TO BE DEFINED."""
    pass


# =============================================================================
# IMPORTE FUNCTION (to be implemented)
# =============================================================================

def importe(conn: sqlite3.Connection, portfolio_id: str, ano: int, tipo_importe: str) -> float:
    """
    Calculate importe for a given portfolio, year, and type.
    TO BE DEFINED.

    Args:
        conn: Database connection
        portfolio_id: Initiative ID
        ano: Year (2024, 2025, 2026, 2027, 2028)
        tipo_importe: One of "Budget", "SM200", "Aprobado", "Citetic",
                      "Facturado", "Importe", "Cash Cost RE"

    Returns:
        Calculated amount as float
    """
    pass


# =============================================================================
# DATE FUNCTIONS (to be implemented)
# =============================================================================

def fecha_iniciativa(conn: sqlite3.Connection, portfolio_id: str, tipo_fecha: str) -> str:
    """
    Get a specific date for an initiative.
    TO BE DEFINED.

    Args:
        conn: Database connection
        portfolio_id: Initiative ID
        tipo_fecha: One of "SM100 Final", "Aprobada con CCT", "En ejecución"

    Returns:
        Date in ISO 8601 format or None
    """
    pass


def fecha_limite(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate fecha límite. TO BE DEFINED."""
    pass


def fecha_limite_comentarios(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate fecha límite comentarios. TO BE DEFINED."""
    pass


# =============================================================================
# OTHER FUNCTIONS (to be implemented)
# =============================================================================

def en_presupuesto_del_ano(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate en presupuesto del año. TO BE DEFINED."""
    pass


def calidad_valoracion(conn: sqlite3.Connection, portfolio_id: str, ano: int) -> str:
    """Calculate calidad valoración. TO BE DEFINED."""
    pass


def siguiente_accion(conn: sqlite3.Connection, portfolio_id: str, ano: int) -> str:
    """Calculate siguiente acción. TO BE DEFINED."""
    pass


def esta_en_los_206_me_de_2026(conn: sqlite3.Connection, portfolio_id: str) -> str:
    """Calculate está en los 206 ME de 2026. TO BE DEFINED."""
    pass


# =============================================================================
# MAIN CALCULATION ENGINE
# =============================================================================

def calculate_row(conn: sqlite3.Connection, portfolio_id: str) -> dict:
    """Calculate all fields for a single portfolio_id."""

    # Get lookups
    dd_lookups = get_datos_descriptivos_lookups(conn, portfolio_id)
    ie_lookups = get_informacion_economica_lookups(conn, portfolio_id)

    # Calculate estado fields
    estado = estado_iniciativa(conn, portfolio_id)

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
        'fecha_de_ultimo_estado': fecha_de_ultimo_estado(conn, portfolio_id),
        'estado_aprobacion': estado_aprobacion_iniciativa(conn, portfolio_id),
        'estado_ejecucion': estado_ejecucion_iniciativa(conn, portfolio_id),
        'estado_agrupado': estado_agrupado(conn, portfolio_id),
        'estado_dashboard': estado_dashboard(conn, portfolio_id),
        'estado_requisito_legal': estado_requisito_legal(conn, portfolio_id),
        # Financial - 2024
        'budget_2024': importe(conn, portfolio_id, 2024, "Budget"),
        'importe_sm200_24': importe(conn, portfolio_id, 2024, "SM200"),
        'importe_aprobado_2024': importe(conn, portfolio_id, 2024, "Aprobado"),
        'importe_citetic_24': importe(conn, portfolio_id, 2024, "Citetic"),
        'importe_facturacion_2024': importe(conn, portfolio_id, 2024, "Facturado"),
        'importe_2024': importe(conn, portfolio_id, 2024, "Importe"),
        # Financial - 2025
        'budget_2025': importe(conn, portfolio_id, 2025, "Budget"),
        'importe_sm200_2025': importe(conn, portfolio_id, 2025, "SM200"),
        'importe_aprobado_2025': importe(conn, portfolio_id, 2025, "Aprobado"),
        'importe_facturacion_2025': importe(conn, portfolio_id, 2025, "Facturado"),
        'importe_2025': importe(conn, portfolio_id, 2025, "Importe"),
        'importe_2025_cc_re': importe(conn, portfolio_id, 2025, "Cash Cost RE"),
        # Financial - 2026
        'budget_2026': importe(conn, portfolio_id, 2026, "Budget"),
        'importe_sm200_2026': importe(conn, portfolio_id, 2026, "SM200"),
        'importe_aprobado_2026': importe(conn, portfolio_id, 2026, "Aprobado"),
        'importe_facturacion_2026': importe(conn, portfolio_id, 2026, "Facturado"),
        'importe_2026': importe(conn, portfolio_id, 2026, "Importe"),
        # Financial - 2027
        'budget_2027': importe(conn, portfolio_id, 2027, "Budget"),
        'importe_sm200_2027': importe(conn, portfolio_id, 2027, "SM200"),
        'importe_aprobado_2027': importe(conn, portfolio_id, 2027, "Aprobado"),
        'importe_facturacion_2027': importe(conn, portfolio_id, 2027, "Facturado"),
        'importe_2027': importe(conn, portfolio_id, 2027, "Importe"),
        # Financial - 2028
        'importe_2028': importe(conn, portfolio_id, 2028, "Importe"),
        # Date functions
        'fecha_sm100': fecha_iniciativa(conn, portfolio_id, "SM100 Final"),
        'fecha_aprobada_con_cct': fecha_iniciativa(conn, portfolio_id, "Aprobada con CCT"),
        'fecha_en_ejecucion': fecha_iniciativa(conn, portfolio_id, "En ejecución"),
        'fecha_limite': fecha_limite(conn, portfolio_id),
        'fecha_limite_comentarios': fecha_limite_comentarios(conn, portfolio_id),
        # Other functions
        'en_presupuesto_del_ano': en_presupuesto_del_ano(conn, portfolio_id),
        'calidad_valoracion': calidad_valoracion(conn, portfolio_id, 2025),  # Default year
        'siguiente_accion': siguiente_accion(conn, portfolio_id, 2025),  # Default year
        'esta_en_los_206_me_de_2026': esta_en_los_206_me_de_2026(conn, portfolio_id),
        # Undefined
        'diferencia_apr_eje_exc_ept': None,  # TO BE DEFINED
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

    # Step 4: Loop through each row and calculate
    errors = 0
    for i, portfolio_id in enumerate(portfolio_ids):
        try:
            values = calculate_row(conn, portfolio_id)
            # UPDATE the row with calculated values
            # ... (generate UPDATE statement from values dict)
        except Exception as e:
            logger.error(f"Error calculating {portfolio_id}: {e}")
            errors += 1

        if (i + 1) % 100 == 0:
            logger.info(f"Progress: {i + 1}/{total}")

    conn.commit()

    return {
        'rows_calculated': total - errors,
        'rows_error': errors,
        'timestamp': datetime.now().isoformat()
    }


def main(db_path: str = 'portfolio.db'):
    """Entry point for calculate command."""
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        result = calculate_datos_relevantes(conn)
        logger.info(f"Calculated {result['rows_calculated']} rows, {result['rows_error']} errors")
        return result
    finally:
        conn.close()
```

---

## Validation

### Post-Calculation Checks

```sql
-- 1. Verify row count matches datos_descriptivos
SELECT
    (SELECT COUNT(*) FROM datos_descriptivos) as expected,
    (SELECT COUNT(*) FROM datos_relevantes) as actual;

-- 2. Check for orphaned records (should be 0)
SELECT COUNT(*)
FROM datos_relevantes dr
LEFT JOIN datos_descriptivos dd ON dr.portfolio_id = dd.portfolio_id
WHERE dd.portfolio_id IS NULL;

-- 3. Check for missing records (should be 0)
SELECT COUNT(*)
FROM datos_descriptivos dd
LEFT JOIN datos_relevantes dr ON dd.portfolio_id = dr.portfolio_id
WHERE dr.portfolio_id IS NULL;
```

### Validation Against Iniciativas Table

The `iniciativas` table contains the original Excel-calculated values (migrated directly from the Excel workbook). To verify that our Python functions correctly replicate the Excel formulas, we compare the calculated `datos_relevantes` values against the corresponding `iniciativas` values.

**Validation Principle:** For columns where the calculation is implemented, the values in `datos_relevantes` should match the values in `iniciativas`. Any mismatches indicate a bug in the Python function implementation.

#### Columns to Compare (Implemented Calculations Only)

The following columns have implemented calculation logic and should be validated:

| datos_relevantes Column | iniciativas Column | Function |
|-------------------------|-------------------|----------|
| estado_de_la_iniciativa | estado_de_la_iniciativa | `estado_iniciativa()` |
| fecha_de_ultimo_estado | fecha_de_ultimo_estado | `fecha_de_ultimo_estado()` |
| estado_aprobacion | estado_aprobacion | `estado_aprobacion_iniciativa()` |
| estado_ejecucion | estado_ejecucion | `estado_ejecucion_iniciativa()` |
| en_presupuesto_del_ano | en_presupuesto_del_ano | `en_presupuesto_del_ano()` |
| calidad_valoracion | calidad_valoracion | `calidad_valoracion()` |
| budget_2024 | budget_2024 | `importe(..., 2024, "Budget")` |
| importe_sm200_24 | importe_sm200_24 | `importe(..., 2024, "SM200")` |
| importe_aprobado_2024 | importe_aprobado_2024 | `importe(..., 2024, "Aprobado")` |
| importe_2024 | importe_2024 | `importe(..., 2024, "Importe")` |
| budget_2025 | budget_2025 | `importe(..., 2025, "Budget")` |
| importe_sm200_2025 | importe_sm200_2025 | `importe(..., 2025, "SM200")` |
| importe_aprobado_2025 | importe_aprobado_2025 | `importe(..., 2025, "Aprobado")` |
| importe_2025 | importe_2025 | `importe(..., 2025, "Importe")` |
| importe_2025_cc_re | importe_2025_cc_re | `importe(..., 2025, "Cash Cost RE")` |
| budget_2026 | budget_2026 | `importe(..., 2026, "Budget")` |
| importe_sm200_2026 | importe_sm200_2026 | `importe(..., 2026, "SM200")` |
| importe_aprobado_2026 | importe_aprobado_2026 | `importe(..., 2026, "Aprobado")` |
| importe_2026 | importe_2026 | `importe(..., 2026, "Importe")` |
| budget_2027 | budget_2027 | `importe(..., 2027, "Budget")` |
| importe_sm200_2027 | importe_sm200_2027 | `importe(..., 2027, "SM200")` |
| importe_aprobado_2027 | importe_aprobado_2027 | `importe(..., 2027, "Aprobado")` |
| importe_2027 | importe_2027 | `importe(..., 2027, "Importe")` |
| importe_2028 | importe_2028 | `importe(..., 2028, "Importe")` |

#### Validation Queries

```sql
-- 4. Compare TEXT columns between datos_relevantes and iniciativas
SELECT
    dr.portfolio_id,
    'estado_de_la_iniciativa' as column_name,
    dr.estado_de_la_iniciativa as calculated,
    i.estado_de_la_iniciativa as expected
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE COALESCE(dr.estado_de_la_iniciativa, '') <> COALESCE(i.estado_de_la_iniciativa, '')

UNION ALL

SELECT
    dr.portfolio_id,
    'fecha_de_ultimo_estado',
    dr.fecha_de_ultimo_estado,
    i.fecha_de_ultimo_estado
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE COALESCE(dr.fecha_de_ultimo_estado, '') <> COALESCE(i.fecha_de_ultimo_estado, '')

UNION ALL

SELECT
    dr.portfolio_id,
    'estado_aprobacion',
    dr.estado_aprobacion,
    i.estado_aprobacion
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE COALESCE(dr.estado_aprobacion, '') <> COALESCE(i.estado_aprobacion, '')

UNION ALL

SELECT
    dr.portfolio_id,
    'estado_ejecucion',
    dr.estado_ejecucion,
    i.estado_ejecucion
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE COALESCE(dr.estado_ejecucion, '') <> COALESCE(i.estado_ejecucion, '')

UNION ALL

SELECT
    dr.portfolio_id,
    'en_presupuesto_del_ano',
    dr.en_presupuesto_del_ano,
    i.en_presupuesto_del_ano
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE COALESCE(dr.en_presupuesto_del_ano, '') <> COALESCE(i.en_presupuesto_del_ano, '')

UNION ALL

SELECT
    dr.portfolio_id,
    'calidad_valoracion',
    dr.calidad_valoracion,
    i.calidad_valoracion
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE COALESCE(dr.calidad_valoracion, '') <> COALESCE(i.calidad_valoracion, '');

-- 5. Compare REAL columns (with tolerance for floating point)
SELECT
    dr.portfolio_id,
    'budget_2024' as column_name,
    dr.budget_2024 as calculated,
    i.budget_2024 as expected,
    ABS(COALESCE(dr.budget_2024, 0) - COALESCE(i.budget_2024, 0)) as difference
FROM datos_relevantes dr
JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE ABS(COALESCE(dr.budget_2024, 0) - COALESCE(i.budget_2024, 0)) > 0.01

UNION ALL

SELECT dr.portfolio_id, 'importe_sm200_24', dr.importe_sm200_24, i.importe_sm200_24,
    ABS(COALESCE(dr.importe_sm200_24, 0) - COALESCE(i.importe_sm200_24, 0))
FROM datos_relevantes dr JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE ABS(COALESCE(dr.importe_sm200_24, 0) - COALESCE(i.importe_sm200_24, 0)) > 0.01

UNION ALL

SELECT dr.portfolio_id, 'importe_aprobado_2024', dr.importe_aprobado_2024, i.importe_aprobado_2024,
    ABS(COALESCE(dr.importe_aprobado_2024, 0) - COALESCE(i.importe_aprobado_2024, 0))
FROM datos_relevantes dr JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE ABS(COALESCE(dr.importe_aprobado_2024, 0) - COALESCE(i.importe_aprobado_2024, 0)) > 0.01

UNION ALL

SELECT dr.portfolio_id, 'importe_2024', dr.importe_2024, i.importe_2024,
    ABS(COALESCE(dr.importe_2024, 0) - COALESCE(i.importe_2024, 0))
FROM datos_relevantes dr JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
WHERE ABS(COALESCE(dr.importe_2024, 0) - COALESCE(i.importe_2024, 0)) > 0.01

-- ... (similar for all other REAL columns)
ORDER BY column_name, portfolio_id;

-- 6. Summary: Count mismatches per column
SELECT
    'Validation Summary' as report,
    (SELECT COUNT(*) FROM datos_relevantes dr JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
     WHERE COALESCE(dr.estado_de_la_iniciativa, '') <> COALESCE(i.estado_de_la_iniciativa, '')) as estado_mismatches,
    (SELECT COUNT(*) FROM datos_relevantes dr JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
     WHERE ABS(COALESCE(dr.budget_2024, 0) - COALESCE(i.budget_2024, 0)) > 0.01) as budget_2024_mismatches,
    (SELECT COUNT(*) FROM datos_relevantes dr JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
     WHERE ABS(COALESCE(dr.importe_2025, 0) - COALESCE(i.importe_2025, 0)) > 0.01) as importe_2025_mismatches;
```

#### Python Validation Function

```python
def validate_against_iniciativas(conn: sqlite3.Connection) -> dict:
    """
    Compare calculated datos_relevantes values against iniciativas (Excel source).

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
        'budget_2024', 'importe_sm200_24', 'importe_aprobado_2024', 'importe_2024',
        'budget_2025', 'importe_sm200_2025', 'importe_aprobado_2025', 'importe_2025', 'importe_2025_cc_re',
        'budget_2026', 'importe_sm200_2026', 'importe_aprobado_2026', 'importe_2026',
        'budget_2027', 'importe_sm200_2027', 'importe_aprobado_2027', 'importe_2027',
        'importe_2028',
    ]

    results = {'text_mismatches': {}, 'real_mismatches': {}, 'total_mismatches': 0}

    # Validate TEXT columns
    for col in text_columns:
        sql = f"""
            SELECT COUNT(*) FROM datos_relevantes dr
            JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
            WHERE COALESCE(dr.{col}, '') <> COALESCE(i.{col}, '')
        """
        cursor.execute(sql)
        count = cursor.fetchone()[0]
        if count > 0:
            results['text_mismatches'][col] = count
            results['total_mismatches'] += count

    # Validate REAL columns (with 0.01 tolerance)
    for col in real_columns:
        sql = f"""
            SELECT COUNT(*) FROM datos_relevantes dr
            JOIN iniciativas i ON dr.portfolio_id = i.portfolio_id
            WHERE ABS(COALESCE(dr.{col}, 0) - COALESCE(i.{col}, 0)) > 0.01
        """
        cursor.execute(sql)
        count = cursor.fetchone()[0]
        if count > 0:
            results['real_mismatches'][col] = count
            results['total_mismatches'] += count

    return results
```

#### Validation Report Output

After running `calculate_datos_relevantes`, the validation should output:

```
=== Validation Report ===
Comparing datos_relevantes (calculated) vs iniciativas (Excel source)

TEXT Columns:
  estado_de_la_iniciativa: 0 mismatches ✓
  fecha_de_ultimo_estado: 0 mismatches ✓
  estado_aprobacion: 0 mismatches ✓
  estado_ejecucion: 0 mismatches ✓
  en_presupuesto_del_ano: 0 mismatches ✓
  calidad_valoracion: 0 mismatches ✓

REAL Columns:
  budget_2024: 0 mismatches ✓
  importe_2024: 0 mismatches ✓
  budget_2025: 0 mismatches ✓
  importe_2025: 0 mismatches ✓
  ... (all columns)

Total Mismatches: 0
Status: PASSED ✓
```

If mismatches are found:

```
=== Validation Report ===
WARNING: Mismatches detected!

TEXT Columns:
  estado_de_la_iniciativa: 5 mismatches ✗
  estado_aprobacion: 3 mismatches ✗

REAL Columns:
  importe_2025: 12 mismatches ✗

Total Mismatches: 20
Status: FAILED ✗

Run detailed query to see specific mismatches:
  SELECT * FROM validation_mismatches WHERE column_name = 'importe_2025';
```

---

## Success Criteria

| Criterion                            | Target                                          |
| ------------------------------------ | ----------------------------------------------- |
| Row count matches datos_descriptivos | 804 rows                                        |
| All portfolio_id values valid        | 100% FK integrity                               |
| Calculation completes without errors | 0 errors                                        |
| CLI command works correctly          | `main.py calculate_datos_relevantes` functional |
| Calculation time reasonable          | < 30 seconds                                    |
| All 60 columns populated             | 100% coverage                                   |
| **Validation vs iniciativas**        | **0 mismatches for implemented columns**        |

---

## Open Questions

1. ~~**Column definitions**: What specific columns should be calculated?~~ ✓ Defined (60 columns)
2. ~~**Function implementations**: Logic for each Python function needs to be defined~~ ✓ Partially defined (see funcions.md)
3. **Null handling**: How to handle missing data in source tables?
4. ~~**Incremental updates**: Should we support partial recalculation, or always full refresh?~~ ✓ Full refresh only
5. **Year parameter**: For `calidad_valoracion` and `siguiente_accion`, what year should be used? (Default: 2025)
6. **diferencia_apr_eje_exc_ept**: What is the calculation for this field?
7. **estado_especial table**: Does it exist in the database? Required for `estado_iniciativa()`.
8. **Pending functions**: 8 functions still need their Excel formulas documented.

---

## Functions Implementation Status

### Fully Defined (with Excel formula translation)

- [x] `ultimo_id(portfolio_id, partida)` → INT (helper function)
- [x] `estado_iniciativa(portfolio_id)` → TEXT (requires estado_especial lookup)
- [x] `fecha_estado(portfolio_id, estado)` → TEXT (helper function)
- [x] `fecha_de_ultimo_estado(portfolio_id)` → TEXT
- [x] `estado_aprobacion_iniciativa(portfolio_id)` → TEXT
- [x] `estado_ejecucion_iniciativa(portfolio_id)` → TEXT
- [x] `importe(portfolio_id, ano, tipo_importe)` → REAL (with all subtypes)
- [x] `en_presupuesto_del_ano(portfolio_id)` → TEXT
- [x] `calidad_valoracion(portfolio_id, ano)` → TEXT

### Pending Definition

- [ ] `estado_agrupado(portfolio_id)` → TEXT
- [ ] `siguiente_accion(portfolio_id, ano)` → TEXT
- [ ] `estado_dashboard(portfolio_id)` → TEXT
- [ ] `estado_requisito_legal(portfolio_id)` → TEXT
- [ ] `fecha_iniciativa(portfolio_id, tipo_fecha)` → TEXT
- [ ] `esta_en_los_206_me_de_2026(portfolio_id)` → TEXT
- [ ] `fecha_limite(portfolio_id)` → TEXT
- [ ] `fecha_limite_comentarios(portfolio_id)` → TEXT

---

## Next Steps

1. [x] Define column structure (60 columns defined)
2. [x] Define execution flow (delete → insert → loop → update)
3. [x] Document implementation logic for core Python functions (9 functions defined)
4. [x] Define validation against iniciativas table
5. [ ] Document remaining 8 pending functions
6. [ ] Confirm estado_especial lookup table exists or define alternative
7. [ ] Update schema.sql with `datos_relevantes` table DDL
8. [ ] Implement calculate.py with all functions
9. [ ] Implement validate_against_iniciativas() function
10. [ ] Add `calculate_datos_relevantes` command to main.py
11. [ ] Add validation checks to validate.py
12. [ ] Test end-to-end workflow with validation

---

## Related Files

- [plan.md](./plan.md) - Implementation plan
- [fields.md](./fields.md) - Raw field definitions
- [funcions.md](./funcions.md) - Excel formula translations for Python functions

---

**Document Status:** Draft - Core function logic documented, 8 functions pending
**Last Updated:** January 2026
