# Feature 044 — Implementation Plan

## Phase 1: Schema & Configuration

### Step 1.1: Update database schema
- **File**: `db/schema.sql`
- **Change**: Update `documentos` table CHECK constraint to include `'Error'` and `'Ignorado'`
- **From**: `CHECK (estado_proceso_documento IN ('Pendiente', 'Completado'))`
- **To**: `CHECK (estado_proceso_documento IN ('Pendiente', 'Completado', 'Error', 'Ignorado'))`

### Step 1.2: Add new config variables
- **File**: `management/src/config/settings.py`
- **Add**: LLM config variables (`ANTHROPIC_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_MAX_TOKENS`, `LLM_TEMPERATURE`)
- **Add**: Documentos Excel export variables (`DOCUMENTOS_EXCEL_PATH`, `DOCUMENTOS_EXCEL_WORKSHEET`, `DOCUMENTOS_EXCEL_TABLE`)
- **Add**: `summarize_documentos` to `validate_config()` (requires DB to exist)

### Step 1.3: Update .env.example
- **File**: `management/.env.example`
- **Add**: New LLM and documentos export configuration variables with documentation comments

### Step 1.4: Add dependencies
- **File**: `management/pyproject.toml`
- **Add**: `anthropic>=0.40.0`, `pymupdf>=1.24.0`, `python-docx>=1.1.0`
- **Run**: `cd management && uv sync`

---

## Phase 2: Core Implementation

### Step 2.1: Create package structure
- **Create**: `management/src/summarize/__init__.py`

### Step 2.2: Implement document reader
- **File**: `management/src/summarize/document_reader.py`
- **Functions**:
  - `read_document(file_path: str) -> str` — dispatcher by extension
  - `_read_pdf(path: Path) -> str` — pymupdf text extraction
  - `_read_docx(path: Path) -> str` — python-docx paragraph extraction
  - `_read_txt(path: Path) -> str` — plain text with encoding fallback
- **Error handling**: `UnsupportedFormatError`, `FileNotFoundError`, encoding errors

### Step 2.3: Implement LLM client
- **File**: `management/src/summarize/llm_client.py`
- **Classes**:
  - `LLMClient` (ABC) — abstract interface with `summarize(content, prompt) -> str`
  - `ClaudeClient(LLMClient)` — Anthropic SDK implementation
  - `create_llm_client(provider, **kwargs) -> LLMClient` — factory function
- **Key behavior**: Each `summarize()` call is a fresh API request (no message history)

### Step 2.4: Implement prompts & JSON schemas
- **File**: `management/src/summarize/prompts.py`
- **Contents**:
  - `PromptTemplate` dataclass: `system_prompt`, `json_schema`
  - `PROMPT_CONFIG` dict: per-tipo_documento prompt configurations (SM100, SM200, default)
  - `SKIP_DOCUMENT_TYPES` set: document types to mark as `Ignorado` (e.g., `"Approval Form"`)
  - `get_prompt_for_type(tipo_documento: str) -> PromptTemplate` — lookup with fallback to default
  - All prompts in Spanish

### Step 2.5: Implement documentos Excel export
- **File**: `management/src/summarize/excel_export.py`
- **Function**: `export_documentos(db_path: str) -> dict`
- **Pattern**: Same as `export/excel_export.py` — open workbook, map columns, write rows, resize table
- **Column mapping**: `DOCUMENTOS_COLUMN_MAPPING` dict (DB field → Excel header)

### Step 2.6: Implement orchestrator engine
- **File**: `management/src/summarize/engine.py`
- **Function**: `summarize_documentos(db_path: str) -> dict`
- **Flow**:
  1. Query pending documents
  2. For each: check skip list → read file → call LLM → update DB
  3. Export to Excel
  4. Return statistics
- **Depends on**: Steps 2.2–2.5 (all other modules in the package)

### Step 2.7: Wire up __init__.py
- **File**: `management/src/summarize/__init__.py`
- **Export**: `summarize_documentos` from engine

---

## Phase 3: CLI Integration

### Step 3.1: Add command to main.py
- **File**: `management/main.py`
- **Changes**:
  - Add `'summarize_documentos'` to argparse `choices`
  - Add `elif args.command == 'summarize_documentos':` handler block
  - Follow existing pattern: check DB, import lazily, call function, log results

---

## Phase 4: Documentation

### Step 4.1: Update architecture docs
- **File**: `specs/architecture/architecture_management.md`
- **Add**: `summarize/` package to package structure diagram
- **Add**: `summarize_documentos` command to CLI commands table
- **Add**: `summarize_documentos` to dependency graph
- **Add**: Summarization flow diagram

### Step 4.2: Update README.md
- **File**: `README.md`
- **Add**: `summarize_documentos` command to management CLI section
- **Add**: New `.env` variables to configuration section

### Step 4.3: Version bump & changelog
- **File**: `frontend/src/lib/version.js` — increment `APP_VERSION.minor` to 44
- **File**: `frontend/src/lib/changelog.js` — add entry for feature 044

---

## Implementation Order

```
Phase 1 (Schema & Config)  →  Phase 2 (Core)  →  Phase 3 (CLI)  →  Phase 4 (Docs)
     1.1 ──┐                    2.1 ──┐
     1.2 ──┤                    2.2 ──┤
     1.3 ──┤                    2.3 ──┤
     1.4 ──┘                    2.4 ──┤
                                2.5 ──┤
                                2.6 ──┘ (depends on 2.2-2.5)
                                2.7 ──┘
```

## Testing

```bash
cd management
uv sync

# Test imports
uv run python -c "from src.summarize import summarize_documentos; print('OK')"

# Test document reader standalone
uv run python -c "from src.summarize.document_reader import read_document; print(read_document('path/to/test.pdf')[:200])"

# Test full command (requires ANTHROPIC_API_KEY in .env and pending documents in DB)
uv run python main.py summarize_documentos
```
