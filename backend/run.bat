@REM Ejecución del backend de la aplicación
@echo off
uv run uvicorn app.main:app --reload --port 8000
