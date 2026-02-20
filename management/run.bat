@rem Script para copiar los ficheros de trabajo desde el ordenador de casa y lanzar el proceso de migración
@echo off
echo ===Copiando los ficheros de trabajo===
echo

set "SRC=C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\In progress"
set "DST=C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\In progress\excel_source"

robocopy "%SRC%" "%DST%" "Temas Pendientes Enel.xlsm" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando Temas Pendientes Enel.xlsm
    exit /b 1
)

echo ===Ficheros copiados correctamente===

echo ===Lanzando el proceso de migracion===
uv run python manage.py complete_process
echo ===Proceso finalizado===