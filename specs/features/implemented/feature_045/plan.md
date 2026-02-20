# Feature 045 — Implementation Plan

## Phase 1: Schema & Configuration Changes

### 1.1 Update `db/schema.sql`
- Add `tokens_input INTEGER` and `tokens_output INTEGER` columns to the `documentos` table definition (before `fecha_creacion`)

### 1.2 Update `management/src/config/settings.py`
- Change default `LLM_MODEL` from `'claude-sonnet-4-5-20250929'` to `'claude-haiku-4-5-20251001'`

### 1.3 Update `management/.env.example`
- Change the `LLM_MODEL` line to `claude-haiku-4-5-20251001`

---

## Phase 2: Prompt Fixes (`prompts.py`)

### 2.1 Fix unescaped quotes in `_SM100_JSON_SCHEMA`
- Lines 27-29: Replace inner `"Written By"`, `"Verified By"` with single quotes `'Written By'`, `'Verified By'`

### 2.2 Fix unescaped quotes in `_SM200_JSON_SCHEMA`
- Lines 44-46: Same fix as SM100 — use single quotes for `'Written By'`, `'Verified By'`

### 2.3 Fix typo in `_SM200_JSON_SCHEMA`
- Line 39: Change `"a parir"` to `"a partir"`

### 2.4 Fix double comma in `_BASE_SYSTEM_PROMPT`
- Line 69: Change `"glosarios, , referencias"` to `"glosarios, referencias"`

### 2.5 Remove extra blank lines in `_BASE_SYSTEM_PROMPT`
- Lines 71-72: Remove the two extra blank lines between the main text and `Esquema JSON esperado`

---

## Phase 3: LLM Client Changes (`llm_client.py`)

### 3.1 Add `SummarizeResult` dataclass
- Add import for `dataclasses.dataclass`
- Define `SummarizeResult` with fields: `text: str`, `input_tokens: int`, `output_tokens: int`

### 3.2 Update `LLMClient.summarize()` abstract method
- Change return type annotation from `str` to `SummarizeResult`

### 3.3 Update `ClaudeClient.summarize()` implementation
- Extract `response.usage.input_tokens` and `response.usage.output_tokens`
- Add DEBUG log: `f"Claude response: {len(result)} chars, stop_reason={response.stop_reason}, tokens_in={input_tokens}, tokens_out={output_tokens}"`
- Return `SummarizeResult(text=result, input_tokens=input_tokens, output_tokens=output_tokens)`

---

## Phase 4: Engine Changes (`engine.py`)

### 4.1 Add `_migrate_token_columns()` function
- Use `PRAGMA table_info(documentos)` to check if `tokens_input` column exists
- If missing, `ALTER TABLE documentos ADD COLUMN tokens_input INTEGER` and `tokens_output INTEGER`
- Call this function right after `_migrate_check_constraint(conn)` in `summarize_documentos()`

### 4.2 Update function signature
- Change `summarize_documentos(db_path=None)` to `summarize_documentos(db_path=None, portfolio_ids=None, reprocess=False)`

### 4.3 Add httpcore/httpx log suppression
- At the start of `summarize_documentos()`, set `httpcore` and `httpx` loggers to `WARNING` level

### 4.4 Update SQL query for filtering
- Build the SQL query dynamically based on `portfolio_ids` and `reprocess` parameters:
  - Default (no flags): `WHERE estado_proceso_documento = 'Pendiente'`
  - `--reprocess`: Remove the estado filter
  - `--portfolio-ids X,Y`: Add `AND portfolio_id IN (?, ?)`
  - Both: Only the portfolio_id filter

### 4.5 Update `_update_document()` for token storage
- Add `tokens_input=None` and `tokens_output=None` parameters
- Update the SQL `UPDATE` to include `tokens_input = ?, tokens_output = ?`

### 4.6 Update processing loop
- Import `time` module for per-document timing
- After LLM call: extract `result.text`, `result.input_tokens`, `result.output_tokens` from `SummarizeResult`
- Add INFO log: `"Tokens: input=XXXX, output=XXXX"`
- Add DEBUG log for per-document timing
- Pass token counts to `_update_document()`
- Track cumulative token totals for end-of-batch summary

### 4.7 Wrap entire per-document block in broad try/except
- The outer `try/except` catches anything not caught by the inner handlers (including DB update errors)
- On error: log at ERROR level, attempt to update DB with error status (with its own try/except), increment `stats['error']`, continue

### 4.8 Add batch summary logging
- After processing loop: log total input tokens and total output tokens at INFO level

---

## Phase 5: CLI Changes (`main.py`)

### 5.1 Add `--portfolio-ids` argument
- Add to argparse: `parser.add_argument('--portfolio-ids', default=None, help='...')`

### 5.2 Add `--reprocess` argument
- Add to argparse: `parser.add_argument('--reprocess', action='store_true', default=False, help='...')`

### 5.3 Update `summarize_documentos` command block
- Parse `--portfolio-ids` (split by comma, strip whitespace) into a list
- Pass `portfolio_ids` and `reprocess` to `summarize_documentos()` function

---

## Phase 6: Table Protection (`db_init.py`)

### 6.1 Add `documentos` to `PRESERVED_TABLES`
- Change `PRESERVED_TABLES = ["transacciones_json"]` to `PRESERVED_TABLES = ["transacciones_json", "documentos"]`

### 6.2 Handle column mismatch during restore
- When restoring `documentos` data, the backed-up rows may have fewer columns than the new schema (e.g., missing `tokens_input`, `tokens_output`). The existing restore logic uses column names from the backup, so this should work correctly as long as the new columns are NULLable (which they are — `INTEGER` with no NOT NULL). Verify this is the case.

---

## Phase 7: Documentation Updates

### 7.1 Update `instructions.md`
- Add `scan_documents` and `summarize_documentos` commands with all CLI options (`--portfolio-ids`, `--reprocess`, `--db`)

### 7.2 Update `README.md`
- Add full management CLI command reference with all options
- Document the `documentos` table protection policy (PRESERVED_TABLES)
- Note that `init` command destroys all data (including documentos)

### 7.3 Update `CLAUDE.md`
- Add note under Critical Development Notes about PRESERVED_TABLES and documentos data protection

### 7.4 Update `specs/architecture/architecture_management.md`
- Add new CLI parameters (`--portfolio-ids`, `--reprocess`)
- Add token tracking columns (`tokens_input`, `tokens_output`)
- Document PRESERVED_TABLES change
- Update summarize engine section with new features

---

## Phase 8: Verification

### 8.1 Verify management imports
```bash
cd management
uv run python -c "from src.summarize import summarize_documentos; print('Import OK')"
```

### 8.2 Verify CLI help
```bash
cd management
uv run python main.py --help
```

### 8.3 Verify no regressions
```bash
cd management
uv run python -c "from src.init import create_database, recreate_tables; print('Init OK')"
uv run python -c "from src.migrate import migrate_all; print('Migrate OK')"
uv run python -c "from src.calculate import main; print('Calculate OK')"
```

---

## Execution Order & Dependencies

```
Phase 1 (schema/config) ──┐
Phase 2 (prompts)      ──┤── can run in parallel
Phase 6 (db_init)      ──┘
        │
Phase 3 (llm_client)  ←── depends on Phase 1 (SummarizeResult dataclass definition)
        │
Phase 4 (engine)       ←── depends on Phase 3 (uses SummarizeResult)
        │
Phase 5 (main.py)      ←── depends on Phase 4 (passes new params)
        │
Phase 7 (docs)         ←── depends on Phases 1-6 (documents final state)
        │
Phase 8 (verify)       ←── depends on everything
```
