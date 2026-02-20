# Feature 044 — LLM Document Summarization

## Overview

Add a new `summarize_documentos` CLI command to the management module that reads pending documents from the `documentos` table, summarizes them using an LLM (Claude), stores the structured JSON summary back in the database, and exports the complete table to Excel.

## Scope

- **Module**: `management/` only (no backend or frontend changes)
- **New package**: `management/src/summarize/`
- **Schema change**: Update `documentos` table CHECK constraint to support new states
- **New dependencies**: `anthropic`, `pymupdf`, `python-docx`

---

## 1. Database Schema Changes

### 1.1 Updated CHECK constraint on `documentos`

Current:

```sql
CHECK (estado_proceso_documento IN ('Pendiente', 'Completado'))
```

New:

```sql
CHECK (estado_proceso_documento IN ('Pendiente', 'Completado', 'Error', 'Ignorado'))
```

This allows three new outcomes beyond the original `Pendiente`/`Completado`:

- **`Completado`** — successfully summarized
- **`Error`** — document unreadable, LLM failure, or other processing error
- **`Ignorado`** — document type is in the skip list (e.g., "Approval Form")

### 1.2 No new columns needed

The existing `documentos` columns are sufficient:

- `resumen_documento TEXT` — stores JSON summary output
- `estado_proceso_documento TEXT` — updated to final state
- `fecha_actualizacion DATETIME` — timestamp of processing

---

## 2. New Package: `management/src/summarize/`

### 2.1 Package structure

```
management/src/summarize/
├── __init__.py              # Exports: summarize_documentos
├── engine.py                # Orchestrator: query pending, process, update
├── document_reader.py       # File content extraction (PDF, DOCX, TXT)
├── llm_client.py            # Abstract LLM interface + Claude implementation
├── prompts.py               # Prompt templates per tipo_documento + JSON schemas
└── excel_export.py          # Export documentos table to Excel
```

### 2.2 engine.py — Orchestrator

Main entry point: `summarize_documentos(db_path: str) -> dict`

Flow:

1. Connect to SQLite database
2. Query `documentos WHERE estado_proceso_documento = 'Pendiente'`
3. For each document:
   a. Check if `tipo_documento` is in skip list → mark `Ignorado`, continue
   b. Read file content from `ruta_documento` via `document_reader`
   c. Get appropriate prompt and JSON schema for `tipo_documento` from `prompts.py`
   d. Create fresh LLM client instance (new conversation per document)
   e. Send content + prompt to LLM, request structured JSON response
   f. Validate response is valid JSON
   g. Update row: `resumen_documento = JSON`, `estado_proceso_documento = 'Completado'`, `fecha_actualizacion = now`
   h. On error: `estado_proceso_documento = 'Error'`, `resumen_documento = error details JSON`
4. Export complete `documentos` table to Excel
5. Return summary statistics dict

### 2.3 document_reader.py — File Content Extraction

```python
def read_document(file_path: str) -> str:
    """Read document content based on file extension. Returns extracted text."""
```

Supported formats:

- **PDF** (`.pdf`): Use `pymupdf` (fitz) — fast, no Java dependency, extracts text reliably
- **DOCX** (`.docx`): Use `python-docx` — standard library for Word documents
- **TXT** (`.txt`): Direct file read with UTF-8 encoding (fallback to latin-1)
- **PPTX** (`.pptx`): Use `python-pptx` — extract text from slides (optional, nice to have)
- **Unsupported extensions**: Raise `UnsupportedFormatError` → handled by engine as `Error`

### 2.4 llm_client.py — LLM Provider Interface

Abstract base class + Claude implementation to allow future LLM providers:

```python
from abc import ABC, abstractmethod

class LLMClient(ABC):
    @abstractmethod
    def summarize(self, content: str, prompt: str) -> str:
        """Send content with prompt, return LLM response text."""
        pass

class ClaudeClient(LLMClient):
    """Anthropic Claude implementation using the anthropic SDK."""
    def __init__(self, api_key: str, model: str, max_tokens: int, temperature: float):
        ...

    def summarize(self, content: str, prompt: str) -> str:
        """Each call creates a fresh messages request (no context contamination)."""
        ...

def create_llm_client(provider: str, **kwargs) -> LLMClient:
    """Factory function. provider='claude' (default), future: 'openai', 'gemini'."""
```

Key design decisions:

- **Fresh conversation per document**: Each `summarize()` call is a standalone API request — no message history accumulation
- **Provider pattern**: Adding a new LLM (e.g., OpenAI) requires only adding a new class implementing `LLMClient` and registering it in the factory
- **No streaming**: Documents are summarized in batch; full response is needed for JSON parsing

### 2.5 prompts.py — Prompt Templates & JSON Schemas

Different document types require different summarization approaches:

```python
# Per-tipo_documento prompt configuration
PROMPT_CONFIG: dict[str, PromptTemplate] = {
    "SM100": PromptTemplate(
        system_prompt="...",
        json_schema={...},
    ),
    "SM200": PromptTemplate(
        system_prompt="...",
        json_schema={...},
    ),
    "default": PromptTemplate(
        system_prompt="...",
        json_schema={...},
    ),
}

# Skip list — document types that should be marked as "Ignorado"
SKIP_DOCUMENT_TYPES: set[str] = {"Approval Form"}
```

**JSON output schema** (example for SM100/SM200 technical documents):

```json
{
  "resumen": "Brief summary of the document (2-3 paragraphs)",
  "puntos_clave": ["Key point 1", "Key point 2", "..."],
  "alcance": "Project scope described in the document",
  "tecnologias": ["Technology 1", "Technology 2"],
  "plazos": "Timeline/deadlines mentioned",
  "importes": "Budget/financial amounts mentioned",
  "riesgos": ["Risk 1", "Risk 2"],
  "dependencias": ["Dependency 1", "Dependency 2"]
}
```

All prompts instruct the LLM to respond in **Spanish**.

The skip list (`SKIP_DOCUMENT_TYPES`) is defined in code, not in `.env`, since it maps directly to the prompt configuration. New document types can be added by extending `PROMPT_CONFIG`.

### 2.6 excel_export.py — Documentos Excel Export

Follows the same pattern as `export/excel_export.py` for datos_relevantes:

```python
def export_documentos(db_path: str) -> dict:
    """Export documentos table to Excel with configured mapping."""
```

- Reads all rows from `documentos` table
- Opens existing Excel workbook (path from `.env`)
- Maps DB columns to Excel headers
- Writes data rows preserving formatting
- Returns statistics dict

Column mapping:

```python
DOCUMENTOS_COLUMN_MAPPING = {
    'nombre_fichero': 'Nombre Fichero',
    'portfolio_id': 'Portfolio ID',
    'tipo_documento': 'Tipo Documento',
    'enlace_documento': 'Enlace Documento',
    'estado_proceso_documento': 'Estado Proceso',
    'resumen_documento': 'Resumen Documento',
    'ruta_documento': 'Ruta Documento',
    'fecha_creacion': 'Fecha Creación',
    'fecha_actualizacion': 'Fecha Actualización',
}
```

---

## 3. Configuration (.env)

New variables added to `management/.env`:

```env
# LLM Configuration
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=claude
LLM_MODEL=claude-sonnet-4-5-20250929
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.2

# Documentos Excel Export
DOCUMENTOS_EXCEL_PATH=excel_output/PortfolioDigital_Documentos.xlsm
DOCUMENTOS_EXCEL_WORKSHEET=Documentos
DOCUMENTOS_EXCEL_TABLE=Documentos
```

These are loaded in `config/settings.py` with sensible defaults.

---

## 4. CLI Integration

### 4.1 New command in main.py

Add `summarize_documentos` to the `choices` list in argparse:

```python
choices=['init', 'recreate_tables', 'migrate', 'validate',
         'calculate_datos_relevantes', 'export_datos_relevantes',
         'full_calculation_datos_relevantes', 'scan_documents',
         'summarize_documentos']
```

Command handler follows existing patterns (check DB exists, import lazily, log results).

### 4.2 Config validation

Add `summarize_documentos` to `validate_config()` — requires database to exist.

---

## 5. Dependencies

New packages to add to `management/pyproject.toml`:

| Package       | Purpose              | Version    |
| ------------- | -------------------- | ---------- |
| `anthropic`   | Claude API SDK       | `>=0.40.0` |
| `pymupdf`     | PDF text extraction  | `>=1.24.0` |
| `python-docx` | DOCX text extraction | `>=1.1.0`  |

Optional (future):
| `python-pptx` | PPTX text extraction | `>=1.0.0` |

---

## 6. Logging

Uses existing centralized logging (`portfolio_summarize` logger name):

- **INFO**: Document processing start/end, success/error counts, summary stats
- **DEBUG**: Individual document details, LLM request/response sizes
- **WARNING**: Missing files, unsupported formats
- **ERROR**: LLM API failures, file read errors

Console output (INFO level) shows progress: document name, status, running totals.

---

## 7. Error Handling

| Error                                     | Behavior                               |
| ----------------------------------------- | -------------------------------------- |
| File not found at `ruta_documento`        | Mark `Error`, log warning, continue    |
| Unsupported file format                   | Mark `Error`, log warning, continue    |
| File read error (permissions, encoding)   | Mark `Error`, log error, continue      |
| LLM API error (rate limit, auth, timeout) | Mark `Error`, log error, continue      |
| Invalid JSON response from LLM            | Mark `Error`, log warning, continue    |
| LLM API key not configured                | Fail fast with clear error message     |
| Excel export file not found               | Raise error (same as datos_relevantes) |

The process is **resilient**: individual document failures do not stop the batch. Summary statistics are logged at the end.

---

## 8. Non-Functional Requirements

- **No context contamination**: Each document gets a fresh LLM API call (no conversation history)
- **Idempotent**: Re-running only processes documents still in `Pendiente` state
- **Extensible**: New LLM providers require only a new class implementing `LLMClient`
- **Extensible**: New document types require only a new entry in `PROMPT_CONFIG`
- **Language**: All LLM prompts and responses in Spanish
