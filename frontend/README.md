# Acrux-Bio Frontend

Sistema de trazabilidad de residuos para Elefantes Verdes - Quintana Roo, México

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
El archivo `.env` ya está incluido con:
```
VITE_API_URL=http://localhost:3000/api
```

Si tu backend está en otra URL, modifica este archivo.

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

El proyecto se abrirá en: `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── auth/                # Componentes de autenticación
│   ├── layout/              # Layout principal (Sidebar, Navbar)
│   │   └── MainLayout.tsx
│   ├── common/              # Componentes reutilizables
│   └── ProtectedRoute.tsx   # Protección de rutas
├── context/
│   └── AuthContext.tsx      # Context de autenticación
├── pages/
│   ├── Login.tsx            # Página de login
│   └── Dashboard.tsx        # Dashboard principal
├── services/
│   └── auth.service.ts      # Servicios de autenticación
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── api.ts               # Configuración Axios
├── App.tsx                  # Rutas principales
├── main.tsx                 # Punto de entrada
└── index.css                # Estilos globales + Tailwind
```

## 🎨 Paleta de Colores

### Verde Primario (Elefantes Verdes)
- `primary-700`: #047857 (Verde del logo)
- `primary-600`: #059669
- `primary-500`: #10B981 (Verde esmeralda)
- `primary-100`: #dcfce7
- `primary-50`: #f0fdf4

### Secundario (Tierra)
- `secondary-700`: #92400e (Marrón del logo)

### Acento
- `accent-light`: #9DC183 (Verde claro del logo)

## 🔐 Login de Prueba

```
Email: admin@acruxbio.com
Password: admin123
```

## 📦 Dependencias Principales

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS 3** - Estilos
- **React Router 6** - Navegación
- **Axios** - HTTP client

## 🛠️ Scripts Disponibles

```bash
npm run dev      # Modo desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## 🌐 Deploy en Vercel

1. Sube el proyecto a GitHub
2. Conecta tu repo en Vercel
3. Variables de entorno en Vercel:
   - `VITE_API_URL` = URL de tu backend en producción

## ✅ Estado Actual - FASE 1 COMPLETADA

- ✅ Sistema de Login funcional
- ✅ Autenticación con JWT
- ✅ Context API para manejo de estado
- ✅ Protección de rutas
- ✅ Layout con Sidebar responsive
- ✅ Menús según rol (ADMIN, DIRECTOR, COORDINADOR, CAPTURADOR)
- ✅ Dashboard básico (estadísticas temporales)

## 📝 Próximos Pasos - FASE 2

- Panel ADMIN completo:
  - CRUD Usuarios
  - CRUD Plazas
  - CRUD Locales
  - CRUD Tipos de Residuos
  - CRUD Recolecciones (wizard multi-paso)

---

**Elefantes Verdes - Estrategias Ambientales**
Quintana Roo, México
