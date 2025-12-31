# 🌟 ACRUX-BIO

**Sistema de Gestión de Residuos Reciclables**

Sistema profesional para el registro, seguimiento y análisis de recolección de residuos reciclables con cálculo automático de CO₂ evitado.

---

## 📋 CONTENIDO

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación Rápida](#instalación-rápida)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Migración de Datos](#migración-de-datos)
- [Desarrollo](#desarrollo)

---

## ✨ CARACTERÍSTICAS

### Sistema Completo
- ✅ Gestión de plazas comerciales y locales
- ✅ Gestión de clientes independientes
- ✅ Registro de recolecciones con detalle por tipo de residuo
- ✅ Cálculo automático de CO₂ evitado
- ✅ Dashboard con métricas en tiempo real
- ✅ Reportes y análisis
- ✅ Sistema de usuarios con roles (Admin, Capturador, Visor)
- ✅ Auditoría completa de cambios

### Base de Datos Optimizada
- 🗄️ PostgreSQL en Supabase
- ⚡ Índices optimizados para consultas rápidas
- 🔐 Row Level Security (RLS)
- 🔄 Triggers automáticos para cálculos
- 📊 Vistas precalculadas para estadísticas

---

## 🛠️ TECNOLOGÍAS

### Backend
- **Base de Datos:** PostgreSQL (Supabase)
- **API:** Por definir (Node.js/Python)

### Frontend
- **Framework:** Por definir (React/Next.js)
- **Estilos:** Tailwind CSS
- **Gráficos:** Chart.js

### Migración
- **Python 3.9+**
- **Google Sheets API**
- **Supabase Client**

---

## 🚀 INSTALACIÓN RÁPIDA

### Requisitos Previos
- Python 3.9 o superior
- Cuenta de Supabase
- Acceso al Google Sheet existente

### Setup Automático

**Windows:**
```bash
setup_windows.bat
```

**Mac/Linux:**
```bash
chmod +x setup_mac.sh
./setup_mac.sh
```

### Setup Manual

1. **Clonar/Descargar el proyecto**

2. **Crear entorno virtual**
```bash
python -m venv venv

# Activar:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

5. **Descargar credentials.json de Google Cloud**
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Service Accounts → Create Key → JSON
   - Guarda como `credentials.json`

---

## 📁 ESTRUCTURA DEL PROYECTO

```
acrux-bio/
├── sql/                       # Scripts SQL para Supabase
│   ├── 01_tablas.sql         # Crear tablas
│   ├── 02_indices.sql        # Crear índices
│   ├── 03_funciones.sql      # Funciones
│   ├── 04_triggers.sql       # Triggers
│   ├── 05_vistas.sql         # Vistas
│   ├── 06_rls.sql            # Row Level Security
│   └── 07_datos_iniciales.sql # Datos base
│
├── scripts/                   # Scripts Python
│   └── migrate.py            # Migración de datos
│
├── docs/                      # Documentación
│   ├── README.md             # Este archivo
│   └── SETUP.md              # Guía detallada
│
├── requirements.txt           # Dependencias Python
├── .env.example              # Template de configuración
├── .gitignore                # Archivos a ignorar en git
├── setup_windows.bat         # Setup automático Windows
└── setup_mac.sh              # Setup automático Mac/Linux
```

---

## 🗄️ BASE DE DATOS

### Tablas Principales

1. **usuarios** - Usuarios del sistema con roles
2. **plazas** - Plazas comerciales
3. **locales** - Locales dentro de plazas
4. **clientes_independientes** - Clientes sin plaza
5. **tipos_residuos** - Catálogo de tipos de residuos
6. **recolecciones** - Registro de recolecciones
7. **detalle_recolecciones** - Detalle por tipo de residuo
8. **sesiones** - Sesiones de usuarios
9. **auditoria** - Log de cambios

### Relaciones
```
plazas
  └── locales
        └── recolecciones
              └── detalle_recolecciones
                    └── tipos_residuos
```

---

## 📊 MIGRACIÓN DE DATOS

### Configurar Supabase

1. **Crear proyecto en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - New Project → `acrux-bio`

2. **Ejecutar scripts SQL EN ORDEN**
   - Abrir SQL Editor en Supabase
   - Ejecutar `01_tablas.sql` → Run
   - Ejecutar `02_indices.sql` → Run
   - Ejecutar `03_funciones.sql` → Run
   - Ejecutar `04_triggers.sql` → Run
   - Ejecutar `05_vistas.sql` → Run
   - Ejecutar `06_rls.sql` → Run
   - Ejecutar `07_datos_iniciales.sql` → Run

3. **Obtener credenciales**
   - Project Settings → API
   - Copiar `Project URL` y `anon public` key
   - Pegar en `.env`

### Ejecutar Migración

```bash
# Activar entorno virtual
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Ejecutar migración
python scripts/migrate.py
```

---

## 👥 USUARIOS INICIALES

Después de ejecutar `07_datos_iniciales.sql`:

- **Email:** admin@acruxbio.com
- **Password:** admin123
- **Rol:** ADMIN

⚠️ **Cambiar la contraseña en producción**

---

## 🔐 SEGURIDAD

### Archivos Sensibles (NO SUBIR A GIT)
- `.env` - Variables de entorno
- `credentials.json` - Credenciales de Google

Estos archivos están en `.gitignore`

---

## 📖 DOCUMENTACIÓN ADICIONAL

- [SETUP.md](docs/SETUP.md) - Guía detallada de instalación
- [SQL/](sql/) - Documentación de cada script SQL

---

## 🎯 ROADMAP

### Fase 1: Migración ✅
- [x] Diseño de base de datos
- [x] Scripts SQL
- [ ] Script de migración completo
- [ ] Verificación de datos

### Fase 2: API (Próximamente)
- [ ] Definir stack (Node.js vs Python)
- [ ] Endpoints REST
- [ ] Autenticación JWT
- [ ] Documentación Swagger

### Fase 3: Frontend (Próximamente)
- [ ] Definir framework
- [ ] Dashboard
- [ ] Captura de datos
- [ ] Reportes

### Fase 4: Deploy (Próximamente)
- [ ] CI/CD
- [ ] Hosting
- [ ] Monitoreo

---

## 📞 SOPORTE

Para problemas o preguntas:
1. Revisa la documentación en `docs/`
2. Verifica que seguiste todos los pasos de instalación
3. Consulta los logs de error

---

## 📄 LICENCIA

Proyecto privado - Todos los derechos reservados

---

**Acrux-Bio** - Sistema de Gestión de Residuos Reciclables 🌟
