# Feature 045 — Summarize Documentos Enhancements

## Overview

Optimize and enhance the `summarize_documentos` command with CLI filtering options, reprocessing support, cost-effective model defaults, improved logging, token tracking, error resilience, prompt improvements, documentation updates, and data protection for the `documentos` table.

## Scope

- **Module**: `management/` only
- **Files changed**: `main.py`, `engine.py`, `llm_client.py`, `prompts.py`, `settings.py`, `db_init.py`, `schema.sql`, `.env.example`, `instructions.md`, `README.md`, `CLAUDE.md`, architecture docs

---

## 1. CLI Parameters

### 1.1 `--portfolio-ids` (optional)

New argparse argument for `summarize_documentos`:

```python
parser.add_argument(
    '--portfolio-ids',
    default=None,
    help='Comma-separated list of portfolio IDs to process (default: all pending)'
)
```

When provided, the SQL query adds a `WHERE portfolio_id IN (...)` clause. Combined with the default `Pendiente` filter or the `--reprocess` flag.

### 1.2 `--reprocess` (optional flag)

```python
parser.add_argument(
    '--reprocess',
    action='store_true',
    default=False,
    help='Reprocess documents regardless of current estado (not just Pendiente)'
)
```

When active, the query removes the `WHERE estado_proceso_documento = 'Pendiente'` filter, processing documents in any state.

### 1.3 Parameter passing to engine

The `summarize_documentos()` function signature changes to:

```python
def summarize_documentos(
    db_path: str = None,
    portfolio_ids: list[str] | None = None,
    reprocess: bool = False,
) -> dict:
```

`main.py` parses `--portfolio-ids` as a comma-separated string, splits it into a list, and passes it along with `--reprocess`.

---

## 2. Default Model Change

### 2.1 Settings update

In `settings.py`:
```python
LLM_MODEL: str = os.getenv('LLM_MODEL', 'claude-haiku-4-5-20251001')
```

In `.env.example`:
```env
LLM_MODEL=claude-haiku-4-5-20251001
```

The model remains fully configurable via `.env`.

---

## 3. Logging Improvements

### 3.1 Suppress httpcore/httpx noise

In `engine.py`, at the start of `summarize_documentos()`:

```python
logging.getLogger('httpcore').setLevel(logging.WARNING)
logging.getLogger('httpx').setLevel(logging.WARNING)
```

This prevents the noisy `send_request_headers`, `receive_response_body`, etc. messages from flooding DEBUG output.

### 3.2 Enhanced DEBUG messages

**In `llm_client.py`** — after LLM response:
- Log token usage: `input_tokens`, `output_tokens` (from `response.usage`)
- Log stop reason, response text length

**In `engine.py`** — per document:
- After DB update: log record name, new estado, summary length
- Per-document timing: log elapsed seconds
- Summary totals at end: total tokens consumed

---

## 4. Token Tracking

### 4.1 Schema changes

Add two columns to `documentos` table in `schema.sql`:

```sql
tokens_input INTEGER,
tokens_output INTEGER,
```

### 4.2 LLM client return type change

The `summarize()` method now returns a `SummarizeResult` dataclass instead of just a string:

```python
@dataclass
class SummarizeResult:
    text: str
    input_tokens: int
    output_tokens: int
```

The Anthropic API returns `response.usage.input_tokens` and `response.usage.output_tokens` on every response.

### 4.3 Database update

`_update_document()` gains `tokens_input` and `tokens_output` parameters:

```python
def _update_document(conn, nombre_fichero, estado, resumen,
                     tokens_input=None, tokens_output=None):
```

### 4.4 Schema migration

Add a migration function `_migrate_token_columns()` in `engine.py` that checks for the `tokens_input` column existence and adds both columns via `ALTER TABLE` if missing. SQLite supports `ALTER TABLE ADD COLUMN`, so no table recreation is needed.

```python
def _migrate_token_columns(conn):
    cursor = conn.execute("PRAGMA table_info(documentos)")
    columns = {row[1] for row in cursor.fetchall()}
    if 'tokens_input' not in columns:
        conn.execute("ALTER TABLE documentos ADD COLUMN tokens_input INTEGER")
        conn.execute("ALTER TABLE documentos ADD COLUMN tokens_output INTEGER")
        conn.commit()
```

### 4.5 INFO-level logging

Per document: `"Tokens: input=XXXX, output=XXXX"`

At the end of batch: total input tokens, total output tokens across all documents.

---

## 5. Prompt Improvements

### 5.1 Fix unescaped quotes

The current `_SM100_JSON_SCHEMA` and `_SM200_JSON_SCHEMA` contain unescaped double quotes inside the JSON string values (e.g., `"Written By"`). These break JSON validity. Fix by using single quotes or escaping:

```python
"escrito_por": "Persona que ha escrito el documento (indicada por 'Written By' en la portada)",
```

### 5.2 Fix minor issues

- Remove extra blank lines in `_BASE_SYSTEM_PROMPT` (between paragraph 2 and `Esquema JSON esperado`)
- Fix double comma in `"por ejemplo glosarios, , referencias"` → `"por ejemplo glosarios, referencias"`
- Fix typo `"a parir"` → `"a partir"` in SM200 schema

### 5.3 Rename `título_documento` to `titulo_documento`

Remove accent to match project naming convention (no accents in field names).

### 5.4 Improve field descriptions with concrete examples

The original descriptions were too vague for the LLM to locate the right data:
- `titulo_documento`: Explicit instruction to use the main cover page title (large bold text), NOT subtitles. Example provided.
- `escrito_por`, `verificado_por`, `fecha_elaboracion`: Explicit instruction to find the "Written by / Verified by / Approved by" table on the cover page, with example names and date format.

### 5.5 Filename context in LLM prompt

The engine prepends `[Nombre del fichero: SM100_Tabla_AGUI_VCR_Secundaria_V5.docx]` to the document content before sending to the LLM. The system prompt includes an instruction to use the filename as a hint for `titulo_documento`.

### 5.6 Cover page table extraction instructions

Added explicit instructions at the end of `_BASE_SYSTEM_PROMPT` telling the LLM that table data appears in the text as `Written by: | Nombre | Fecha` pipe-delimited format.

---

## 6. Error Resilience

### 6.1 Current state

The engine already catches most errors per-document and continues. However, there is one gap: if the `_update_document_error()` call itself fails (e.g., the CHECK constraint issue from feature_044), the entire process crashes.

### 6.2 Fix

Wrap the entire per-document processing in a broad `try/except` that catches everything, including DB update errors:

```python
for idx, doc in enumerate(pending_docs, 1):
    try:
        # ... entire processing block ...
    except Exception as e:
        logger.error(f"  -> Unexpected error: {e}")
        try:
            _update_document_error(conn, nombre, str(e))
        except Exception as db_err:
            logger.error(f"  -> Failed to update error status in DB: {db_err}")
        stats['error'] += 1
        continue
```

---

## 7. Documentos Table Protection

### 7.1 Mechanism

The `recreate_tables()` function in `db_init.py` already has a `PRESERVED_TABLES` list that backs up and restores table data during schema recreation. Currently it only contains `["transacciones_json"]`.

**Fix**: Add `"documentos"` to `PRESERVED_TABLES`:

```python
PRESERVED_TABLES = ["transacciones_json", "documentos"]
```

This ensures:
- `full_calculation_datos_relevantes` (which calls `recreate_tables`) preserves documentos data
- `recreate_tables` standalone also preserves it
- Only `init` (which deletes the entire .db file) destroys the data — which is expected

### 7.2 Documentation

Add explicit notes about this protection in:
- `CLAUDE.md` — under Critical Development Notes
- `README.md` — under Migration CLI section
- `specs/architecture/architecture_management.md` — under the `recreate_tables` section

---

## 8. Documentation Updates

### 8.1 `instructions.md`

Add `scan_documents` and `summarize_documentos` commands with all options.

### 8.2 `README.md`

- Add full command reference for management CLI with all options (`--db`, `--excel-dir`, `--portfolio-ids`, `--reprocess`)
- Document the documentos table protection policy

### 8.3 Architecture docs

- Update `architecture_management.md` with new parameters, token tracking columns, PRESERVED_TABLES change

### 8.4 `CLAUDE.md`

- Add note about PRESERVED_TABLES and documentos data protection

---

## 9. DOCX Table Extraction

### 9.1 Problem

The `_read_docx()` function in `document_reader.py` only read `doc.paragraphs`, which completely ignores Word table content. The cover page table with "Written by / Verified by / Approved by" metadata was never sent to the LLM.

### 9.2 Fix

Updated `_read_docx()` to iterate over `doc.tables` after paragraphs, extracting each row's cells joined by ` | `. This ensures the LLM receives table data like `Written by: | Carlos Sánchez Ospina | 21/07/2025`.

---

## 10. `--json-output-to-console` Flag

### 10.1 CLI argument

New `--json-output-to-console` flag that prints each successfully processed document's JSON summary to the console with ANSI color highlighting (keys=cyan, strings=green, numbers=yellow, booleans/null=magenta).

### 10.2 Implementation

`_print_colored_json()` and `_colorize_value()` helper functions in `engine.py` using regex-based ANSI colorization on `json.dumps(indent=2)` output.

---

## 11. Excel Date Formatting

### 11.1 Problem

The `fecha_creacion` and `fecha_actualizacion` columns were exported as raw ISO strings (e.g., `2026-02-14T08:40:00.123456`) instead of Excel date values.

### 11.2 Fix

In `excel_export.py`, ISO date strings are converted to Python `datetime` objects via `datetime.fromisoformat()` before writing to cells, and the cell number format is set to `DD/MM/YYYY`.

---

## 12. Summary of All File Changes

| File | Changes |
|------|---------|
| `db/schema.sql` | Add `tokens_input`, `tokens_output` columns to `documentos` |
| `management/main.py` | Add `--portfolio-ids`, `--reprocess`, `--json-output-to-console` args |
| `management/src/config/settings.py` | Default `LLM_MODEL` → `claude-haiku-4-5-20251001` |
| `management/src/summarize/engine.py` | New params, token tracking, migrations, error resilience, logging, colored JSON output, filename context |
| `management/src/summarize/llm_client.py` | Return `SummarizeResult` with token counts |
| `management/src/summarize/prompts.py` | Fix quotes/typos, rename título→titulo, improved field descriptions, filename+table instructions |
| `management/src/summarize/document_reader.py` | DOCX table extraction alongside paragraphs |
| `management/src/summarize/excel_export.py` | Date column conversion to DD/MM/YYYY |
| `management/src/init/db_init.py` | Add `"documentos"` to `PRESERVED_TABLES` |
| `management/.env.example` | Update default model |
| `instructions.md` | Add scan_documents + summarize_documentos with all options |
| `README.md` | Full CLI reference, data protection note, LLM config vars |
| `CLAUDE.md` | PRESERVED_TABLES note, CLI commands |
| `specs/architecture/architecture_management.md` | Token columns, params, protection, CLI flags |
| `frontend/src/lib/version.js` | Bump to 0.045 |
| `frontend/src/lib/changelog.js` | Add feature 045 entry |
