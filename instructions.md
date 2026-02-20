# Quick Reference: Portfolio Migration System

## Migration Commands

All commands run from the `management/` directory.

```bash
cd management

# Recreate tables (drop all tables, recreate from schema.sql)
uv run python manage.py recreate_tables

# Run migration (Excel -> SQLite, includes documentos + documentos_items)
uv run python manage.py migrate

# Calculate datos_relevantes (computed table)
uv run python manage.py calculate_datos_relevantes

# Export datos_relevantes to Excel
uv run python manage.py export_datos_relevantes

# Complete pipeline (recreate + migrate + calculate + export + scan_documents + export documentos_items)
uv run python manage.py complete_process

# Validate migrated data
uv run python manage.py validate

# Initialize new database (creates .db file + schema)
uv run python manage.py init

# Scan configured folders and insert new documents into DB
uv run python manage.py scan_documents

# Summarize pending documents using LLM
uv run python manage.py summarize_documentos

# Summarize specific portfolios only
uv run python manage.py summarize_documentos --portfolio-ids SPA_25_11,SPA_25_12

# Reprocess already-processed documents
uv run python manage.py summarize_documentos --reprocess

# Print colored JSON summaries to console
uv run python manage.py summarize_documentos --json-output-to-console
```

Custom database path (applies to all commands):
```bash
uv run python manage.py migrate --db custom_portfolio.db
```

## Backend API

```bash
cd backend

# Start development server
uv run uvicorn app.main:app --reload --port 8000

# API docs
# Swagger UI: http://localhost:8000/api/v1/docs
# ReDoc:      http://localhost:8000/api/v1/redoc
```

## Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Opens at http://localhost:5173
```

## Excel Source Files

Copy Excel files from OneDrive to `management/excel_source/`:
Copy Excel files to the directory configured in `management/.env` (`EXCEL_SOURCE_DIR`).

Required files:
- `PortfolioDigital_Master.xlsm`
- `PortfolioDigital_Beneficios.xlsm`
- `PortfolioDigital_Facturado.xlsx`
- `PortfolioDigital_Transacciones.xlsm`
- `PortfolioDigital_Fichas.xlsm`
- `PortfolioDigital_Documentos.xlsx` (documentos migration source)
- `PortfolioDigital_Documentos_Items.xlsx` (optional, documentos_items import)

## Debugging

### Log files
- Migration/calculate/export logs: `logs/portfolio_migration.log`
- Backend logs: `logs/portfolio_backend.log`

### Enable debug logging

Management (edit `management/.env`):
```
LOG_LEVEL=DEBUG
```

Backend (edit `backend/.env`):
```
LOG_LEVEL=DEBUG
```

### View logs
```bash
# Recent errors
grep -E "ERROR|WARNING" logs/portfolio_migration.log

# Specific module
grep "portfolio_migration" logs/portfolio_migration.log

# Execution sessions
grep "NEW EXECUTION" logs/portfolio_migration.log
```

### Debug backend with VS Code
Add to `.vscode/launch.json`:
```json
{
  "name": "Backend (FastAPI)",
  "type": "debugpy",
  "request": "launch",
  "module": "uvicorn",
  "args": ["app.main:app", "--reload", "--port", "8000"],
  "cwd": "${workspaceFolder}/backend",
  "envFile": "${workspaceFolder}/backend/.env"
}
```
