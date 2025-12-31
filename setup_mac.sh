#!/bin/bash

clear
echo "============================================"
echo "   ACRUX-BIO - SETUP AUTOMATICO"
echo "   Sistema de Gestion de Residuos"
echo "============================================"
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 no esta instalado"
    echo "Descarga Python 3.9+ desde: https://www.python.org"
    exit 1
fi

echo "[OK] Python instalado: $(python3 --version)"
echo ""

# Crear entorno virtual
echo "[1/6] Creando entorno virtual..."
if [ -d "venv" ]; then
    echo "[INFO] Entorno virtual ya existe"
else
    python3 -m venv venv
    echo "[OK] Entorno virtual creado"
fi
echo ""

# Activar entorno virtual
echo "[2/6] Activando entorno virtual..."
source venv/bin/activate
echo "[OK] Entorno activado"
echo ""

# Actualizar pip
echo "[3/6] Actualizando pip..."
pip install --upgrade pip --quiet
echo "[OK] pip actualizado"
echo ""

# Instalar dependencias
echo "[4/6] Instalando dependencias..."
pip install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    echo "[ERROR] Error al instalar dependencias"
    exit 1
fi
echo "[OK] Dependencias instaladas"
echo ""

# Configurar .env
echo "[5/6] Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[OK] Archivo .env creado"
    echo ""
    echo "[IMPORTANTE] Debes editar .env con tus credenciales:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_KEY"
    echo "   - SHEET_ID"
    echo ""
else
    echo "[OK] Archivo .env ya existe"
fi
echo ""

# Verificar credentials.json
echo "[6/6] Verificando credenciales de Google..."
if [ ! -f credentials.json ]; then
    echo "[PENDIENTE] Falta credentials.json"
    echo ""
    echo "Descarga credentials.json de Google Cloud:"
    echo "  1. https://console.cloud.google.com"
    echo "  2. Service Accounts → Create Key → JSON"
    echo "  3. Guardalo como: credentials.json"
    echo ""
else
    echo "[OK] credentials.json encontrado"
fi
echo ""

echo "============================================"
echo "   SETUP COMPLETADO"
echo "============================================"
echo ""
echo "PROXIMOS PASOS:"
echo "  1. Edita .env con tus credenciales de Supabase"
echo "  2. Descarga credentials.json de Google Cloud"
echo "  3. Ejecuta los archivos SQL en Supabase (sql/01 al 07)"
echo "  4. Activa el entorno: source venv/bin/activate"
echo "  5. Ejecuta migracion: python scripts/migrate.py"
echo ""
echo "Para activar el entorno virtual:"
echo "  source venv/bin/activate"
echo ""
