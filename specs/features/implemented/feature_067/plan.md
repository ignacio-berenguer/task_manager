# plan.md — feature_067: SQL Query Tool

## Implementation Phases

### Phase 1: Backend — SQL Validator & Endpoint

**Goal:** Create the centralized SQL validation and execution service, plus the API endpoint that both MCP and Agent tools will call.

#### Step 1.1: Add `sqlparse` dependency

- File: `backend/pyproject.toml`
- Action: Add `"sqlparse>=0.5.0"` to dependencies
- Run: `cd backend && uv sync`

#### Step 1.2: Add configuration settings

- File: `backend/app/config.py`
- Action: Add to `Settings` class:
  - `SQL_MAX_ROWS: int = 1000`
  - `SQL_QUERY_TIMEOUT: int = 30`
  - `SQL_MAX_QUERY_LENGTH: int = 5000`
- File: `backend/.env`
- Action: Add commented-out defaults for the new settings

#### Step 1.3: Create SQL Validator service

- File: `backend/app/services/sql_validator.py` (new)
- Action: Implement `SQLValidator` class with:
  - `validate_and_prepare(sql: str, max_rows: int) -> str` — validates SQL, enforces row limit, returns safe SQL
  - `_strip_comments(sql: str) -> str` — removes SQL comments
  - `_check_single_statement(sql: str)` — rejects multi-statement queries
  - `_check_statement_type(sql: str)` — ensures only SELECT via sqlparse
  - `_check_blacklisted_keywords(sql: str)` — rejects DDL/DML/DCL keywords
  - `_enforce_row_limit(sql: str, max_rows: int) -> str` — adds/adjusts LIMIT clause
  - `_check_query_length(sql: str)` — rejects overly long queries
- All validation failures raise `ValueError` with descriptive Spanish message

#### Step 1.4: Create SQL execution endpoint

- File: `backend/app/routers/sql.py` (new)
- Action: Create router with:
  - `POST /sql/execute` — accepts `SQLExecuteRequest`, validates SQL, executes against DB, returns `SQLExecuteResponse`
  - Uses read-only SQLAlchemy `text()` execution
  - Measures execution time
  - Logs all queries at INFO level
  - Error handling: `ValueError` → 400, `OperationalError` → 400, generic → 500

#### Step 1.5: Add Pydantic schemas

- File: `backend/app/schemas.py`
- Action: Add `SQLExecuteRequest` and `SQLExecuteResponse` models

#### Step 1.6: Register router

- File: `backend/app/main.py`
- Action: Import and register the sql router with prefix `/sql`
- Note: This is a standalone router, not a CRUD router from factory

#### Step 1.7: Test backend endpoint

- Manual testing via Swagger UI:
  - Valid SELECT queries (simple, JOINs, aggregations)
  - Rejected queries (INSERT, DROP, multi-statement, SQL injection attempts)
  - Row limit enforcement
  - Empty results
  - Invalid SQL syntax

---

### Phase 2: MCP Server — New Tool

**Goal:** Add `ejecutar_consulta_sql` tool to the MCP server that calls the backend endpoint.

#### Step 2.1: Extend MCP API Client

- File: `mcp_server/src/mcp_portfolio/api_client.py`
- Action: Add `execute_sql(sql: str, max_rows: int = 500) -> dict` method
  - Calls `POST /sql/execute` with `{"sql": sql, "max_rows": max_rows}`
  - Same error handling pattern as existing methods

#### Step 2.2: Create SQL Query tool module

- File: `mcp_server/src/mcp_portfolio/tools/sql_query.py` (new)
- Action: Implement `register(mcp, api_client)` function with:
  - `ejecutar_consulta_sql(consulta_sql, explicacion, limite_filas)` tool
  - Spanish docstring with schema context (condensed table/column reference)
  - JSON response with: `sql_ejecutado`, `explicacion`, `columnas`, `total_filas`, `truncado`, `tiempo_ejecucion_ms`, `datos`
  - Error responses with: `error`, `sql_recibido`, `sugerencia`
  - INFO logging on entry, DEBUG for API call details

#### Step 2.3: Register tool in tools/__init__.py

- File: `mcp_server/src/mcp_portfolio/tools/__init__.py`
- Action: Import and call `sql_query.register(mcp, api_client)`

#### Step 2.4: Test MCP tool

- Start backend + MCP server
- Test via MCP inspector or direct tool call:
  - Simple SELECT queries
  - JOIN queries
  - Aggregation queries
  - Rejected mutating queries
  - Error handling

---

### Phase 3: Backend Agent — New Tool + System Prompt

**Goal:** Add `ejecutar_consulta_sql` to the agent chat system and update the system prompt with schema context and usage instructions.

#### Step 3.1: Add tool definition

- File: `backend/app/agent/tools_definition.py`
- Action: Add `ejecutar_consulta_sql` to the `AGENT_TOOLS` list with:
  - `consulta_sql` (string, required)
  - `explicacion` (string, optional)
  - `limite_filas` (integer, optional, default 500)
  - Rich Spanish description with schema context and usage guidelines

#### Step 3.2: Extend Agent API Client

- File: `backend/app/agent/api_client.py`
- Action: Add `async execute_sql(sql: str, max_rows: int = 500) -> dict` method
  - Calls `POST {base_url}/sql/execute`
  - Same error handling pattern as existing methods

#### Step 3.3: Add tool handler

- File: `backend/app/agent/tools_executor.py`
- Action:
  - Add `_ejecutar_consulta_sql(inp, client)` async handler function
  - Register in `_TOOL_MAP` dict
  - Handler extracts `consulta_sql`, `explicacion`, `limite_filas`
  - Calls `client.execute_sql()`
  - Formats response with transparency metadata (SQL, explanation, columns, row count)

#### Step 3.4: Update orchestrator for tool UI summary

- File: `backend/app/agent/orchestrator.py`
- Action: Update `_summarize_tool_input()` and `_summarize_tool_result()` functions to handle `ejecutar_consulta_sql`:
  - Input summary: Show the SQL query being executed
  - Result summary: Show SQL executed, row count, column list, and explanation

#### Step 3.5: Update system prompt

- File: `backend/app/agent/system_prompt.py`
- Action: Add new section to the system prompt covering:
  - When to use `ejecutar_consulta_sql` vs. existing tools
  - Condensed database schema reference (all 28 tables with key columns)
  - FK relationship patterns (portfolio_id is the universal join key)
  - Rules: always provide explanation, only SELECT, use exact column names
  - Example queries for common use cases

#### Step 3.6: Test agent tool

- Start backend
- Test via chat UI:
  - Ask questions that require SQL (JOINs, complex aggregations)
  - Verify the tool_call event shows SQL + explanation
  - Verify the LLM correctly decides when to use SQL tool vs. existing tools

---

### Phase 4: Documentation & Finalization

#### Step 4.1: Version bump & changelog

- File: `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 67
- File: `frontend/src/lib/changelog.js` — add entry at TOP for feature_067

#### Step 4.2: Update README.md

- Add SQL Query tool to MCP Server tools section (10 tools now)
- Update tool count references

#### Step 4.3: Update architecture docs

- File: `specs/architecture/architecture_backend.md` — add SQL endpoint documentation
- File: `specs/architecture/architecture_mcp_server.md` — add 10th tool documentation

#### Step 4.4: Close feature

- Use `/close_feature feature_067`

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `backend/pyproject.toml` | Edit — add sqlparse dependency | 1.1 |
| `backend/app/config.py` | Edit — add SQL settings | 1.2 |
| `backend/.env` | Edit — add SQL config | 1.2 |
| `backend/app/services/sql_validator.py` | **New** — SQL validation service | 1.3 |
| `backend/app/routers/sql.py` | **New** — SQL execution endpoint | 1.4 |
| `backend/app/schemas.py` | Edit — add SQL request/response schemas | 1.5 |
| `backend/app/main.py` | Edit — register sql router | 1.6 |
| `mcp_server/src/mcp_portfolio/api_client.py` | Edit — add execute_sql method | 2.1 |
| `mcp_server/src/mcp_portfolio/tools/sql_query.py` | **New** — MCP SQL tool | 2.2 |
| `mcp_server/src/mcp_portfolio/tools/__init__.py` | Edit — register sql_query | 2.3 |
| `backend/app/agent/tools_definition.py` | Edit — add tool schema | 3.1 |
| `backend/app/agent/api_client.py` | Edit — add execute_sql method | 3.2 |
| `backend/app/agent/tools_executor.py` | Edit — add handler + register | 3.3 |
| `backend/app/agent/orchestrator.py` | Edit — update UI summaries | 3.4 |
| `backend/app/agent/system_prompt.py` | Edit — add SQL section + schema | 3.5 |
| `frontend/src/lib/version.js` | Edit — version bump | 4.1 |
| `frontend/src/lib/changelog.js` | Edit — changelog entry | 4.1 |
| `README.md` | Edit — update tool docs | 4.2 |
| `specs/architecture/architecture_backend.md` | Edit — add SQL endpoint | 4.3 |
| `specs/architecture/architecture_mcp_server.md` | Edit — add 10th tool | 4.3 |

**Total: 20 files (3 new, 17 modified)**

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| SQL injection despite validation | Defense-in-depth: sqlparse validation + keyword blacklist + read-only DB connection |
| Large result sets causing OOM | Hard row limit enforced at SQL level (LIMIT clause) |
| Long-running queries blocking server | Query timeout configured via settings |
| LLM generating incorrect SQL | Schema context in tool description reduces errors; SQLite returns clear error messages |
| Breaking existing tools | New tool is additive; no changes to existing 9 tools' behavior |
