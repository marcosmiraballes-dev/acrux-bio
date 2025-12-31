# 🔧 ACRUX-BIO - GUÍA DE INSTALACIÓN DETALLADA

Esta guía te llevará paso a paso desde cero hasta tener el sistema funcionando.

---

## 📋 ÍNDICE

1. [Preparación](#1-preparación)
2. [Configurar Supabase](#2-configurar-supabase)
3. [Configurar Google Sheets API](#3-configurar-google-sheets-api)
4. [Configurar Proyecto Local](#4-configurar-proyecto-local)
5. [Ejecutar Migración](#5-ejecutar-migración)
6. [Verificación](#6-verificación)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. PREPARACIÓN

### Requisitos

- ✅ Python 3.9 o superior
- ✅ Cuenta de Google (para Google Sheets API)
- ✅ Cuenta de Supabase (gratis)
- ✅ Editor de código (VSCode recomendado)

### Verificar Python

```bash
python --version
# o
python3 --version

# Debe mostrar: Python 3.9.x o superior
```

Si no tienes Python: [python.org/downloads](https://www.python.org/downloads/)

---

## 2. CONFIGURAR SUPABASE

### Paso 2.1: Crear Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Click en **"New Project"**
3. Completa:
   - **Name:** `acrux-bio`
   - **Database Password:** (guárdala en un lugar seguro)
   - **Region:** `South America (São Paulo)`
4. Click **"Create new project"**
5. Espera 2-3 minutos mientras se crea

### Paso 2.2: Ejecutar Scripts SQL

⚠️ **IMPORTANTE:** Debes ejecutar los scripts EN ORDEN, uno por uno.

1. En Supabase, ve a **SQL Editor** (icono <>)

2. Click en **"New query"**

3. **Ejecuta cada script en orden:**

#### 2.2.1 - Crear Tablas
- Abre `sql/01_tablas.sql`
- Copia TODO el contenido
- Pégalo en Supabase SQL Editor
- Click **"Run"** (▶️)
- Espera: "Success. No rows returned"

#### 2.2.2 - Crear Índices
- Abre `sql/02_indices.sql`
- Copia TODO el contenido
- Pégalo en NEW query
- Click **"Run"** (▶️)

#### 2.2.3 - Crear Funciones
- Abre `sql/03_funciones.sql`
- Copia TODO el contenido
- NEW query → Pegar → Run

#### 2.2.4 - Crear Triggers
- Abre `sql/04_triggers.sql`
- NEW query → Pegar → Run

#### 2.2.5 - Crear Vistas
- Abre `sql/05_vistas.sql`
- NEW query → Pegar → Run

#### 2.2.6 - Configurar RLS
- Abre `sql/06_rls.sql`
- NEW query → Pegar → Run

#### 2.2.7 - Insertar Datos Iniciales
- Abre `sql/07_datos_iniciales.sql`
- NEW query → Pegar → Run

### Paso 2.3: Verificar Tablas

1. Ve a **Table Editor** (icono de tabla)
2. Deberías ver 9 tablas:
   - ✅ usuarios
   - ✅ plazas
   - ✅ locales
   - ✅ clientes_independientes
   - ✅ tipos_residuos
   - ✅ recolecciones
   - ✅ detalle_recolecciones
   - ✅ sesiones
   - ✅ auditoria

3. Click en `tipos_residuos`:
   - Deberías ver 11 tipos de residuos

4. Click en `usuarios`:
   - Deberías ver 1 usuario (admin@acruxbio.com)

### Paso 2.4: Obtener Credenciales

1. Ve a **Project Settings** → **API**
2. Copia estos valores:
   - **Project URL** → ejemplo: `https://abc123xyz.supabase.co`
   - **anon public key** → Un texto largo que empieza con `eyJ...`

⚠️ Guárdalos, los necesitarás después.

---

## 3. CONFIGURAR GOOGLE SHEETS API

### Paso 3.1: Crear Proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Si es tu primera vez, acepta los términos
3. Click en el selector de proyectos (arriba)
4. Click **"NEW PROJECT"**
5. Name: `acrux-bio-migration`
6. Click **"CREATE"**
7. Espera 30 segundos

### Paso 3.2: Habilitar APIs

1. En el proyecto nuevo, ve a **APIs & Services** → **Library**

2. Busca **"Google Sheets API"**
   - Click en ella
   - Click **"ENABLE"**

3. Busca **"Google Drive API"**
   - Click en ella
   - Click **"ENABLE"**

### Paso 3.3: Crear Service Account

1. Ve a **APIs & Services** → **Credentials**

2. Click **"CREATE CREDENTIALS"** → **"Service Account"**

3. Completa:
   - **Service account name:** `sheets-migration`
   - **Service account ID:** (se genera automático)
   - Click **"CREATE AND CONTINUE"**

4. **Grant this service account access to project:**
   - Role: **Project** → **Editor**
   - Click **"CONTINUE"**

5. Click **"DONE"**

### Paso 3.4: Generar Credentials JSON

1. En la lista de Service Accounts, click en `sheets-migration@...`

2. Ve a **KEYS**

3. Click **"ADD KEY"** → **"Create new key"**

4. Type: **JSON**

5. Click **"CREATE"**

6. Se descargará un archivo JSON

7. **Renombra el archivo a: `credentials.json`**

8. **Mueve el archivo a la carpeta del proyecto `acrux-bio/`**

### Paso 3.5: Dar Acceso al Sheet

1. Abre el archivo `credentials.json` en un editor de texto

2. Busca la línea que dice `"client_email": "..."`

3. Copia el email completo (algo como: `sheets-migration@...iam.gserviceaccount.com`)

4. Abre tu Google Sheet

5. Click en **"Compartir"** (arriba a la derecha)

6. Pega el email copiado

7. Rol: **"Editor"**

8. ❌ Desmarca "Notify people"

9. Click **"Enviar"**

### Paso 3.6: Obtener Sheet ID

Tu URL de Google Sheet se ve así:
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9/edit
                                       ^^^^^^^^^^^^^^^^^^
                                       Este es tu SHEET_ID
```

Copia el texto entre `/d/` y `/edit`

---

## 4. CONFIGURAR PROYECTO LOCAL

### Paso 4.1: Abrir VSCode

1. Abre Visual Studio Code

2. File → Open Folder

3. Selecciona la carpeta `acrux-bio`

### Paso 4.2: Setup Automático

**Opción A - Windows:**
```bash
# Doble click en:
setup_windows.bat
```

**Opción B - Mac/Linux:**
```bash
chmod +x setup_mac.sh
./setup_mac.sh
```

Esto creará:
- ✅ Entorno virtual
- ✅ Instalará dependencias
- ✅ Creará archivo `.env`

### Paso 4.3: Configurar Variables de Entorno

1. Abre el archivo `.env` en VSCode

2. Reemplaza los valores:

```env
SUPABASE_URL=https://tu-proyecto-real.supabase.co
SUPABASE_KEY=tu-key-real-aqui-eyJ...
SHEET_ID=tu-sheet-id-de-paso-3.6
```

3. Guarda el archivo (Ctrl+S)

### Paso 4.4: Verificar Archivos

Tu carpeta debe tener:

```
acrux-bio/
├── venv/                    ✅ (creado por setup)
├── sql/                     ✅
│   ├── 01_tablas.sql
│   └── ... (7 archivos)
├── scripts/
│   └── migrate.py
├── credentials.json         ✅ (descargado paso 3.4)
├── .env                     ✅ (creado por setup)
└── requirements.txt
```

---

## 5. EJECUTAR MIGRACIÓN

### Paso 5.1: Activar Entorno Virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

Deberías ver `(venv)` al inicio de tu terminal.

### Paso 5.2: Verificar Instalación

```bash
python -c "from supabase import create_client; print('✅ Supabase OK')"
python -c "import gspread; print('✅ Google Sheets OK')"
```

Ambos deben mostrar ✅

### Paso 5.3: Ejecutar Migración

```bash
python scripts/migrate.py
```

Verás algo como:

```
============================================================
🌟 ACRUX-BIO - MIGRACIÓN
   Google Sheets → Supabase
============================================================

🔗 Conectando a servicios...
✅ Conexiones establecidas

✅ Configuración verificada
   Supabase: https://...
   Sheet ID: 1A2B3C4D...

📊 Exportando datos...
...
```

---

## 6. VERIFICACIÓN

### Verificar en Supabase

1. Ve a **Table Editor**

2. Click en **plazas**
   - ¿Ves tus plazas?

3. Click en **locales**
   - ¿Ves tus locales?

4. Click en **recolecciones**
   - ¿Ves tus recolecciones?

### Consultas de Verificación

En Supabase SQL Editor:

```sql
-- Total de recolecciones
SELECT COUNT(*) FROM recolecciones;

-- Total de kilos
SELECT SUM(total_kilos) FROM recolecciones;

-- CO2 evitado
SELECT SUM(co2_evitado) FROM recolecciones;

-- Plazas con más recolecciones
SELECT * FROM vista_stats_plazas 
ORDER BY total_recolecciones DESC 
LIMIT 10;
```

---

## 7. TROUBLESHOOTING

### Error: "Python no encontrado"

**Solución:**
- Instala Python desde python.org
- Reinicia la terminal

### Error: "pip: command not found"

**Solución:**
```bash
python -m ensurepip --upgrade
```

### Error: "Failed to create client"

**Problema:** Credenciales de Supabase incorrectas

**Solución:**
1. Verifica `.env`
2. Asegúrate de usar el `anon public` key
3. URL debe terminar en `.supabase.co`

### Error: "WorksheetNotFound"

**Problema:** No encuentra la hoja en Google Sheets

**Solución:**
1. Verifica que el `SHEET_ID` en `.env` sea correcto
2. Verifica que la service account tenga acceso al Sheet
3. Verifica que las hojas existan: `OPERATIVO`, `CAT_PLAZAS`, etc.

### Error: "insufficient_privilege"

**Problema:** Service account sin permisos

**Solución:**
1. Abre Google Sheet
2. Click "Compartir"
3. Agrega el email de la service account
4. Rol: "Editor"

### Error: "duplicate key value"

**Problema:** Intentas insertar datos que ya existen

**Solución:**
Trunca las tablas en Supabase:

```sql
TRUNCATE TABLE detalle_recolecciones CASCADE;
TRUNCATE TABLE recolecciones CASCADE;
TRUNCATE TABLE locales CASCADE;
TRUNCATE TABLE plazas CASCADE;
```

Luego vuelve a ejecutar la migración.

### La migración es muy lenta

**Soluciones:**
- Es normal con muchos registros (35,000+)
- Tiempo estimado: 10-30 minutos
- No interrumpas el proceso

### Algunos registros no se migraron

**Verifica:**
- Que todas las plazas/locales tengan nombres válidos
- Que las fechas sean válidas
- Revisa el log de errores del script
- Corrige datos en Sheets y vuelve a migrar

---

## ✅ CHECKLIST FINAL

- [ ] Proyecto creado en Supabase
- [ ] 7 scripts SQL ejecutados en orden
- [ ] Tablas verificadas (9 tablas)
- [ ] Credenciales de Supabase copiadas
- [ ] Proyecto creado en Google Cloud
- [ ] APIs habilitadas (Sheets + Drive)
- [ ] Service Account creada
- [ ] credentials.json descargado
- [ ] Service Account tiene acceso al Sheet
- [ ] Sheet ID copiado
- [ ] Entorno virtual creado
- [ ] Dependencias instaladas
- [ ] Archivo .env configurado
- [ ] credentials.json en carpeta del proyecto
- [ ] Migración ejecutada exitosamente
- [ ] Datos verificados en Supabase

---

## 🎉 ¡LISTO!

Tu sistema Acrux-Bio está configurado y los datos migrados.

**Próximos pasos:**
1. Desarrollar la API
2. Desarrollar el Frontend
3. Deploy a producción

**¿Necesitas ayuda?**
- Revisa esta guía paso a paso
- Verifica que seguiste todos los pasos
- Consulta la sección de Troubleshooting

---

**Acrux-Bio** 🌟
