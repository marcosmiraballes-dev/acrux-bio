@echo off
cls
echo ============================================
echo    ACRUX-BIO - SETUP AUTOMATICO
echo    Sistema de Gestion de Residuos
echo ============================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado
    echo Descarga Python 3.9+ desde: https://www.python.org
    pause
    exit /b 1
)

echo [OK] Python instalado: 
python --version
echo.

REM Crear entorno virtual
echo [1/6] Creando entorno virtual...
if exist venv (
    echo [INFO] Entorno virtual ya existe
) else (
    python -m venv venv
    echo [OK] Entorno virtual creado
)
echo.

REM Activar entorno virtual
echo [2/6] Activando entorno virtual...
call venv\Scripts\activate.bat
echo [OK] Entorno activado
echo.

REM Actualizar pip
echo [3/6] Actualizando pip...
python -m pip install --upgrade pip --quiet
echo [OK] pip actualizado
echo.

REM Instalar dependencias
echo [4/6] Instalando dependencias...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Error al instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

REM Configurar .env
echo [5/6] Configurando variables de entorno...
if not exist .env (
    copy .env.example .env
    echo [OK] Archivo .env creado
    echo.
    echo [IMPORTANTE] Debes editar .env con tus credenciales:
    echo    - SUPABASE_URL
    echo    - SUPABASE_KEY
    echo    - SHEET_ID
    echo.
) else (
    echo [OK] Archivo .env ya existe
)
echo.

REM Verificar credentials.json
echo [6/6] Verificando credenciales de Google...
if not exist credentials.json (
    echo [PENDIENTE] Falta credentials.json
    echo.
    echo Descarga credentials.json de Google Cloud:
    echo   1. https://console.cloud.google.com
    echo   2. Service Accounts - Create Key - JSON
    echo   3. Guardalo como: credentials.json
    echo.
) else (
    echo [OK] credentials.json encontrado
)
echo.

echo ============================================
echo    SETUP COMPLETADO
echo ============================================
echo.
echo PROXIMOS PASOS:
echo   1. Edita .env con tus credenciales de Supabase
echo   2. Descarga credentials.json de Google Cloud
echo   3. Ejecuta los archivos SQL en Supabase (sql/01 al 07)
echo   4. Activa el entorno: venv\Scripts\activate
echo   5. Ejecuta migracion: python scripts\migrate.py
echo.
echo Para activar el entorno virtual:
echo   venv\Scripts\activate
echo.
pause
