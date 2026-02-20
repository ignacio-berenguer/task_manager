# specs.md — feature_067: SQL Query Tool

## Overview

Add a new `ejecutar_consulta_sql` tool to both the **MCP Server** (for external AI agents) and the **Backend Agent** (for the chat UI) that accepts a SQL SELECT query, validates it for safety, executes it against the SQLite database, and returns results with full transparency of the SQL used.

The LLM caller (Claude) generates the SQL based on schema context provided in the tool description and system prompt. The tool's responsibility is **validation, execution, and transparent reporting** — not NL-to-SQL conversion (the LLM handles that).

## Architecture

### Data Flow

```
User asks question (natural language)
       ↓
LLM (Claude) — has schema context from tool description + system prompt
       ↓
LLM generates SQL SELECT query + explanation
       ↓
LLM calls ejecutar_consulta_sql(consulta_sql="SELECT ...", explicacion="...")
       ↓
┌──────────────────────────────────────────────┐
│  Backend Endpoint: POST /api/v1/sql/execute  │
│  1. Parse & validate SQL (safety checks)     │
│  2. Enforce row limit                        │
│  3. Execute against SQLite (read-only)       │
│  4. Log query for audit                      │
│  5. Return results + metadata                │
└──────────────────────────────────────────────┘
       ↓
LLM presents results to user with SQL + explanation
```

Both the MCP tool and Agent tool call the **same backend endpoint** (`POST /api/v1/sql/execute`), keeping SQL validation logic centralized.

### Components Modified/Created

| Component | File(s) | Changes |
|-----------|---------|---------|
| Backend — SQL Router | `backend/app/routers/sql.py` (new) | New endpoint `POST /sql/execute` |
| Backend — SQL Validator | `backend/app/services/sql_validator.py` (new) | SQL parsing, safety checks, execution |
| Backend — Schemas | `backend/app/schemas.py` | Add `SQLExecuteRequest` / `SQLExecuteResponse` |
| Backend — Main | `backend/app/main.py` | Register sql router |
| Backend — Config | `backend/app/config.py` | Add SQL config settings |
| Agent — Tool Definition | `backend/app/agent/tools_definition.py` | Add `ejecutar_consulta_sql` schema |
| Agent — Tool Executor | `backend/app/agent/tools_executor.py` | Add tool handler function |
| Agent — System Prompt | `backend/app/agent/system_prompt.py` | Add SQL tool usage instructions + schema context |
| Agent — API Client | `backend/app/agent/api_client.py` | Add `execute_sql()` method |
| MCP — SQL Tool | `mcp_server/src/mcp_portfolio/tools/sql_query.py` (new) | New tool module |
| MCP — Tool Registration | `mcp_server/src/mcp_portfolio/tools/__init__.py` | Register sql_query module |
| MCP — API Client | `mcp_server/src/mcp_portfolio/api_client.py` | Add `execute_sql()` method |

## Detailed Specifications

### 1. Backend Endpoint — `POST /api/v1/sql/execute`

#### Request Schema (`SQLExecuteRequest`)

```python
class SQLExecuteRequest(BaseModel):
    sql: str          # The SQL SELECT query to execute
    max_rows: int = 500  # Max rows to return (capped at SQL_MAX_ROWS from config)
```

#### Response Schema (`SQLExecuteResponse`)

```python
class SQLExecuteResponse(BaseModel):
    sql: str              # The exact SQL executed (with LIMIT applied)
    columns: list[str]    # Column names in result set
    data: list[dict]      # Result rows as list of dicts
    total_rows: int       # Number of rows returned
    truncated: bool       # Whether results were truncated by row limit
    execution_time_ms: int  # Query execution time in milliseconds
```

#### Error Response

```json
{
  "detail": "SQL rechazado: solo se permiten consultas SELECT. Detectado: DELETE"
}
```

HTTP status codes:
- `200` — Success
- `400` — SQL validation failed (unsafe query, syntax error, etc.)
- `500` — Database execution error

### 2. SQL Validator (`backend/app/services/sql_validator.py`)

#### Safety Checks (in order)

1. **Non-empty check**: Reject empty or whitespace-only queries
2. **Strip comments**: Remove SQL comments (`--`, `/* */`) to prevent hiding malicious code
3. **Single statement**: Reject queries containing multiple statements (semicolons outside string literals)
4. **Statement type**: Parse with `sqlparse` — only allow `SELECT` statement type
5. **Keyword blacklist**: Reject if the normalized query contains any of:
   - DDL: `CREATE`, `DROP`, `ALTER`, `TRUNCATE`
   - DML: `INSERT`, `UPDATE`, `DELETE`, `REPLACE`, `MERGE`
   - DCL: `GRANT`, `REVOKE`
   - TCL: `COMMIT`, `ROLLBACK`, `SAVEPOINT`
   - System: `ATTACH`, `DETACH`
   - Dangerous PRAGMAs: Allow only read-only PRAGMAs (`PRAGMA table_info`, `PRAGMA table_list`) if needed, reject all others
6. **Row limit enforcement**: If query has no LIMIT clause, append `LIMIT {max_rows}`. If it has a LIMIT higher than `max_rows`, replace it with `max_rows`.
7. **Query length limit**: Reject queries longer than 5000 characters

#### Implementation Approach

Use Python's `sqlparse` library for SQL parsing. The validation is **whitelist-based** (only SELECT allowed) rather than blacklist-based, making it inherently safer.

```python
import sqlparse

def validate_and_prepare_sql(sql: str, max_rows: int) -> str:
    """Validate SQL for safety and return the query with row limit enforced.

    Raises ValueError with descriptive message if validation fails.
    Returns the safe, limit-enforced SQL string.
    """
```

### 3. MCP Tool — `ejecutar_consulta_sql`

#### Tool Signature

```python
@mcp.tool()
def ejecutar_consulta_sql(
    consulta_sql: str,
    explicacion: str | None = None,
    limite_filas: int = 500
) -> str:
    """Ejecutar una consulta SQL SELECT de solo lectura contra la base de datos del portfolio.

    IMPORTANTE: Solo se permiten consultas SELECT. Cualquier intento de modificar datos
    será rechazado automáticamente.

    Usa esta herramienta cuando las herramientas existentes (buscar_iniciativas,
    buscar_en_tabla, etc.) no pueden responder la pregunta porque requiere:
    - JOINs entre múltiples tablas
    - Subconsultas o CTEs
    - Agregaciones complejas (GROUP BY con HAVING, funciones de ventana)
    - Consultas que combinan datos de tablas que no tienen búsqueda flexible

    Args:
        consulta_sql: Consulta SQL SELECT a ejecutar. Debe ser una única sentencia
            SELECT válida. Ejemplo: "SELECT portfolio_id, nombre FROM datos_relevantes
            WHERE unidad = 'Digital' ORDER BY nombre LIMIT 10"
        explicacion: Breve explicación de por qué se generó esta consulta SQL de esta
            manera. Se incluirá en la respuesta para transparencia del usuario.
        limite_filas: Número máximo de filas a devolver (default 500, máximo configurable).
    """
```

#### Tool Response Format

```json
{
  "sql_ejecutado": "SELECT portfolio_id, nombre FROM datos_relevantes WHERE unidad = 'Digital' ORDER BY nombre LIMIT 10",
  "explicacion": "Se buscan las iniciativas de la unidad Digital ordenadas por nombre para responder la pregunta del usuario.",
  "columnas": ["portfolio_id", "nombre"],
  "total_filas": 10,
  "truncado": false,
  "tiempo_ejecucion_ms": 12,
  "datos": [
    {"portfolio_id": "SPA_25_001", "nombre": "Proyecto Alpha"},
    ...
  ]
}
```

Error response:

```json
{
  "error": "SQL rechazado: solo se permiten consultas SELECT.",
  "sql_recibido": "DELETE FROM iniciativas",
  "sugerencia": "Reformula tu consulta usando únicamente SELECT."
}
```

### 4. Agent Tool — `ejecutar_consulta_sql`

#### Tool Schema (Anthropic API format)

```python
{
    "name": "ejecutar_consulta_sql",
    "description": "Ejecutar una consulta SQL SELECT de solo lectura contra la base de datos...",
    "input_schema": {
        "type": "object",
        "properties": {
            "consulta_sql": {
                "type": "string",
                "description": "Consulta SQL SELECT a ejecutar..."
            },
            "explicacion": {
                "type": "string",
                "description": "Explicación de por qué se generó esta consulta..."
            },
            "limite_filas": {
                "type": "integer",
                "description": "Máximo de filas (default 500)"
            }
        },
        "required": ["consulta_sql"]
    }
}
```

#### Agent API Client Addition

```python
# In backend/app/agent/api_client.py
async def execute_sql(self, sql: str, max_rows: int = 500) -> dict:
    """Execute a validated SQL query via the backend endpoint."""
    response = await self.client.post(
        f"{self.base_url}/sql/execute",
        json={"sql": sql, "max_rows": max_rows}
    )
    return self._handle_response(response)
```

### 5. System Prompt Updates

Add the following section to `backend/app/agent/system_prompt.py`:

```
## Herramienta: ejecutar_consulta_sql

Tienes acceso a una herramienta que ejecuta consultas SQL SELECT directamente contra la base de datos.

### Cuándo usar esta herramienta:
- Cuando necesitas JOINs entre tablas (ej: combinar datos_relevantes con hechos)
- Cuando necesitas agregaciones complejas (GROUP BY con HAVING, subconsultas)
- Cuando las herramientas existentes no pueden filtrar o combinar datos como necesitas
- Cuando necesitas datos de tablas sin búsqueda flexible

### Cuándo NO usar esta herramienta:
- Para búsquedas simples → usa buscar_iniciativas o buscar_en_tabla
- Para ver una iniciativa completa → usa obtener_iniciativa
- Para contar o totalizar → usa contar_iniciativas o totalizar_importes
- Para explorar el esquema → usa listar_tablas, describir_tabla, obtener_valores_campo

### Esquema de la base de datos (tablas principales):
[Condensed schema with table names, key columns, and FK relationships]

### Reglas obligatorias:
1. SIEMPRE proporciona una explicacion de por qué generaste esa SQL
2. Solo genera consultas SELECT — nunca intentes modificar datos
3. Usa nombres de tabla y columna exactos (ver esquema arriba)
4. Limita resultados con LIMIT cuando sea posible
5. Prefiere JOINs con portfolio_id que es la clave de unión principal
```

### 6. Schema Context for Tool Descriptions

Provide a condensed schema reference in the tool description that includes:

```
Tablas principales y sus columnas clave:
- datos_relevantes: portfolio_id, nombre, unidad, cluster, estado_de_la_iniciativa,
  priorizacion, tipo, framework_digital, budget_2024..2028, importe_sm200_2024..2028,
  aprobado_2024..2028, facturado_2024..2028, importe_2024..2028, ...
- iniciativas: portfolio_id, nombre, unidad, estado_de_la_iniciativa, ...
- hechos: id_hecho, portfolio_id, fecha, importe, estado, notas, ...
- etiquetas: portfolio_id, etiqueta, valor, fecha_modificacion
- notas: portfolio_id, registrado_por, fecha, nota
- facturacion: portfolio_id, ano, mes, importe, concepto_factura
- ltp: portfolio_id, responsable, tarea, estado, comentarios
- acciones: portfolio_id, siguiente_accion, comentarios
[etc. for all 28 tables]

Relaciones: Todas las tablas se unen por portfolio_id → iniciativas.portfolio_id
```

### 7. Tool Call UI Transparency

In the Agent chat UI, the `tool_call` SSE event for `ejecutar_consulta_sql` should display:

```
🔍 Consulta SQL ejecutada:
SELECT d.portfolio_id, d.nombre, SUM(f.importe) as total_facturado
FROM datos_relevantes d
JOIN facturacion f ON d.portfolio_id = f.portfolio_id
WHERE d.unidad = 'Digital'
GROUP BY d.portfolio_id, d.nombre

📝 Explicación: Se busca el total facturado por iniciativa de la unidad Digital,
combinando datos_relevantes con la tabla de facturación.

📊 Resultado: 15 filas, 3 columnas
```

This is handled by the existing `_summarize_tool_input()` and `_summarize_tool_result()` functions in `orchestrator.py`, which need to be updated with a case for `ejecutar_consulta_sql`.

### 8. Configuration

#### Backend `.env` additions

```env
# SQL Query Tool
SQL_MAX_ROWS=1000           # Hard limit on rows returned
SQL_QUERY_TIMEOUT=30        # Query timeout in seconds
SQL_MAX_QUERY_LENGTH=5000   # Max SQL query length in characters
```

#### MCP Server `.env` — no additions needed

The MCP server already has `MAX_QUERY_ROWS` which will be used for the `limite_filas` default/cap.

### 9. Logging & Audit

All SQL queries are logged at `INFO` level with:
- The SQL executed
- Execution time
- Row count returned
- Whether the query was truncated
- Source (MCP tool or Agent tool)

Failed validation attempts are logged at `WARNING` level with the rejected SQL and the reason.

### 10. Dependencies

Add `sqlparse` to `backend/pyproject.toml`:

```toml
dependencies = [
    ...,
    "sqlparse>=0.5.0",
]
```

No new dependencies for the MCP server (it calls the backend endpoint).

## Security Considerations

1. **Read-only enforcement**: SQL validated at application level + SQLite connection opened with `?mode=ro` URI parameter for defense-in-depth
2. **No multi-statement**: Semicolons outside string literals rejected
3. **No subversive keywords**: Even within subqueries, blacklisted keywords are detected
4. **Row limits**: Hard limit prevents memory exhaustion from large result sets
5. **Query timeout**: Prevents long-running queries from blocking the server
6. **Audit trail**: Every query logged for security review
7. **Comment stripping**: SQL comments removed before validation to prevent hiding malicious code
