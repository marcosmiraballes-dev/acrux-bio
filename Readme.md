# 🌱 Acrux-Bio - Sistema de Trazabilidad de Residuos

Sistema enterprise de trazabilidad ambiental para gestión de residuos reciclables.

**Cliente:** Elefantes Verdes - Estrategias Ambientales  
**Ubicación:** Quintana Roo, México  
**Desarrollador:** Marcos Miraballes

---

## 📊 Características Principales

- ✅ **4 Roles de Usuario:** ADMIN, DIRECTOR, COORDINADOR, CAPTURADOR
- ✅ **Gestión Completa:** Plazas, Locales, Tipos de Residuos, Recolecciones
- ✅ **Dashboards Profesionales:** Visualización con Recharts
- ✅ **Sistema de Infracciones:** CRUD completo con catálogos
- ✅ **Reportes PDF/Excel:** Bitácoras y reportes ejecutivos
- ✅ **39,293 Registros Históricos:** Migrados desde Google Sheets
- ✅ **Cálculo de Impacto Ambiental:** CO₂ evitado, árboles equivalentes

---

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- TailwindCSS
- Recharts (gráficas)
- React Router
- jsPDF + ExcelJS (reportes)

### Backend
- Node.js + Express
- TypeScript
- Zod (validación)
- JWT (autenticación)

### Base de Datos
- Supabase PostgreSQL
- 9 funciones SQL optimizadas
- Row Level Security
- Triggers automáticos

---

## 📁 Estructura del Proyecto

```
acrux-bio/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── middleware/
│   │   └── utils/
│   ├── dist/            # Build de producción
│   └── package.json
│
├── frontend/            # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
└── sql/                 # Scripts de base de datos
```

---

## 🚀 Instalación y Configuración

### Backend

```bash
cd backend
npm install
```

**Variables de entorno (.env):**
```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

**Iniciar:**
```bash
npm run dev    # Desarrollo
npm run build  # Compilar TypeScript
npm start      # Producción
```

### Frontend

```bash
cd frontend
npm install
```

**Variables de entorno (.env):**
```env
VITE_API_URL=http://localhost:5000
```

**Iniciar:**
```bash
npm run dev    # Desarrollo
npm run build  # Build producción
```

---

## 📊 Base de Datos

### Tablas Principales
- `plazas` - Plazas comerciales
- `locales` - Locales dentro de plazas
- `tipos_residuos` - 11 tipos de materiales reciclables
- `usuarios` - Sistema de usuarios con roles
- `recolecciones` - Registros de recolección
- `detalle_recolecciones` - Detalles por tipo de residuo
- `infracciones` - Sistema de infracciones a locatarios
- `reglamentos`, `tipos_aviso`, `faltas_predefinidas` - Catálogos

### Funciones SQL
- `get_recolecciones_stats()` - Estadísticas generales
- `get_recolecciones_stats_by_tipo()` - Por tipo de residuo
- `get_recolecciones_tendencia_mensual()` - Tendencia últimos 12 meses
- `get_recolecciones_comparativa_plazas()` - Comparativa entre plazas
- `get_recolecciones_top_locales()` - Top locales productivos
- `get_comparativa_mensual()` - Mes actual vs anterior
- `get_comparativa_anual()` - Año actual vs anterior
- `get_comparativa_trimestral()` - Trimestre actual vs anterior
- `get_bitacora_locatario()` - Bitácora por local y fechas

---

## 👥 Roles y Permisos

### ADMIN
- Acceso completo al sistema
- CRUD de usuarios, plazas, locales, tipos de residuos
- Gestión de catálogos de infracciones
- Dashboard y reportes completos

### DIRECTOR
- Dashboards ejecutivos (empresa y cliente)
- Reportes y bitácoras
- Visualización de infracciones
- Exportación PDF/Excel

### COORDINADOR
- Dashboard de plaza asignada
- Captura de recolecciones
- Gestión de infracciones
- Reportes limitados

### CAPTURADOR
- Captura rápida de recolecciones
- Edición de sus propias recolecciones
- Generación de bitácoras

---

## 📈 Métricas del Proyecto

- **Duración desarrollo:** 10-12 días
- **Líneas de código:** ~15,000+
- **Componentes React:** 25+
- **Endpoints API:** 50+
- **Funciones SQL:** 9
- **Registros procesados:** 39,293 recolecciones
- **Valor estimado:** $500,000 MXN

---

## 🎯 Características Destacadas

### Sistema de Infracciones
- CRUD completo con roles específicos
- Auto-asignación de tipo de aviso (1er, 2do, 3er...)
- Catálogos: Plazas, Locatarios, Reglamentos, Tipos de Aviso, Faltas
- Generación de PDF con historial del local
- Logos dinámicos por plaza

### Reportes Profesionales
- **PDF Dashboards:** HTML print-to-PDF con diseño corporativo
- **Bitácoras Excel:** Multi-hoja con formato profesional
- **Logos corporativos:** Integrados en todos los reportes
- **Cálculos ambientales:** CO₂ evitado, árboles equivalentes

### Panel Capturador Optimizado
- Grid 2x2 para captura rápida
- Emojis por tipo de residuo
- Cálculo CO₂ en tiempo real
- Card de totales destacado
- Reducción 45% scroll vertical

---

## 🔐 Seguridad

- Autenticación JWT con expiración
- Row Level Security en Supabase
- Bcrypt para contraseñas
- Validación con Zod en backend
- Protected Routes en frontend
- CORS configurado

---

## 📄 Licencia

Propiedad de Elefantes Verdes - Estrategias Ambientales  
Desarrollado por Marcos Miraballes © 2025

---

## 🤝 Contacto

**Desarrollador:** Marcos Miraballes  
**GitHub:** [@marcosmiraballes-dev](https://github.com/marcosmiraballes-dev)  
**Cliente:** Elefantes Verdes - Quintana Roo, México

---

## 📝 Notas de Desarrollo

Sistema desarrollado en 10-12 días utilizando metodología ágil con Claude AI como asistente de desarrollo. Se priorizó simplicidad, funcionalidad y velocidad de desarrollo sobre complejidad innecesaria.

**Filosofía del proyecto:** "Simple, Funcional, Rápido"