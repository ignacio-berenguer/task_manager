@rem Script para copiar los ficheros de trabajo desde el ordenador de casa y lanzar el proceso de cálculo de datos relevantes
@echo off
echo ===Copiando los ficheros de trabajo===
echo

set "SRC=C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Teams-SPBI\1.Business Improvement\Iniciativas Digitales\Portfolio"
set "DST=C:\Users\ES07239146B\OneDrive - Enel Spa\Documents\edistribucion\Teams-SPBI\1.Business Improvement\Iniciativas Digitales\Portfolio\Automatizar\test\temp\excel_source"

robocopy "%SRC%" "%DST%" "PortfolioDigital_Beneficios.xlsm" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Beneficios.xlsm
    exit /b 1
)

robocopy "%SRC%" "%DST%" "PortfolioDigital_Facturado.xlsx" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Facturado.xlsx
    exit /b 1
)

robocopy "%SRC%" "%DST%" "PortfolioDigital_Fichas.xlsm" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Fichas.xlsm
    exit /b 1
)

robocopy "%SRC%" "%DST%" "PortfolioDigital_Master.xlsm" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Master.xlsm
    exit /b 1
)

robocopy "%SRC%" "%DST%" "PortfolioDigital_Transacciones.xlsm" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Transacciones.xlsm
    exit /b 1
)

robocopy "%SRC%" "%DST%" "PortfolioDigital_Documentos.xlsx" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Documentos.xlsx
    exit /b 1
)

robocopy "%SRC%" "%DST%" "PortfolioDigital_Documentos_Items.xlsx" /COPY:DAT /R:2 /W:3 >nul
if %errorlevel% geq 8 (
    echo Error copiando PortfolioDigital_Documentos_Items.xlsx
    exit /b 1
)

echo ===Ficheros copiados correctamente===

echo ===Lanzando el proceso de cálculo de datos relevantes===
uv run python manage.py complete_process
echo ===Proceso finalizado===