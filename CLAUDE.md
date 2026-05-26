# CLAUDE.md — Acrux Bio

> Archivo de contexto para Claude Code y cualquier asistente de IA que trabaje en este repositorio.
> Leer completo antes de tocar cualquier archivo.

---

## 1. Qué es este proyecto

**Acrux Bio** es un sistema de trazabilidad de residuos reciclables para **Elefantes Verdes / Estrategias Ambientales**, operando en plazas comerciales de Quintana Roo, México.

El sistema registra recolecciones de residuos por local/locatario, genera manifiestos oficiales (SEMA), calcula huella de carbono evitada con metodología EPA WARM v16, gestiona infracciones, facturación, y expone datos al Director vía un Asistente IA integrado.

**Estado: producción activa.** Hay datos reales, usuarios reales y un cliente pagando.

---

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | Node.js + Express + TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Hosting | Render (plan de pago, región Oregon) |
| IA interna | Anthropic API — Claude Sonnet (`claude-sonnet-4-6`) con Tool Use |
| Gráficas | Recharts |
| Shell / OS | Linux, Fish shell |
| IDE | VS Code |

---

## 3. Estructura de carpetas

```
acrux-bio/
├── backend/
│   └── src/
│       ├── server.ts                        ⚠️ ALTO RIESGO
│       ├── config/
│       │   └── supabase.ts
│       ├── routes/
│       │   ├── reportes.routes.ts
│       │   ├── asistente.routes.ts
│       │   ├── manifiestos.routes.ts
│       │   ├── infracciones.routes.ts
│       │   ├── facturacion.routes.ts
│       │   └── [otras rutas...]
│       └── services/
│           ├── huella-carbono.service.ts
│           ├── asistente-director.service.ts
│           ├── manifiesto.service.ts
│           └── [otros services...]
└── frontend/
    └── src/
        ├── App.tsx                          ⚠️ ALTO RIESGO
        ├── components/
        │   ├── layout/
        │   │   └── MainLayout.tsx           ⚠️ ALTO RIESGO
        │   └── AsistenteDirector.tsx
        ├── pages/
        │   ├── DashboardDirector.tsx
        │   ├── HuellaCarbonoDirector.tsx
        │   ├── ClientesFacturacion.tsx
        │   ├── CobrosFacturacion.tsx
        │   └── [otras páginas...]
        ├── services/
        ├── utils/
        │   ├── api.ts                       ← axios con JWT automático — USAR SIEMPRE
        │   ├── generarReporteHuella.ts      ← función compartida de reportes HTML
        │   └── generateManifiestoHTML.ts
        └── context/
            └── AuthContext.tsx
```

> **portal.html** — vive FUERA del repo, en GoDaddy (elefantesverdes.com.mx). Claude Code NO puede modificarlo. Workflow: modificar con Claude → descargar → subir manualmente a GoDaddy. El `main.js` del portal también está en GoDaddy. El logo se referencia como `logo.png` en la raíz del servidor GoDaddy.

---

## 4. Archivos de ALTO RIESGO

Requieren aprobación explícita antes de modificarse:

| Archivo | Por qué |
|---------|---------|
| `backend/src/server.ts` | Punto de entrada — registra todas las rutas |
| `frontend/src/App.tsx` | Registra todas las rutas del frontend |
| `frontend/src/components/layout/MainLayout.tsx` | Menú lateral y layout principal |

**Regla:** Antes de tocar cualquiera de estos tres, preguntar y esperar confirmación explícita.

---

## 5. Roles del sistema

```
ADMIN        → acceso total
DIRECTOR     → dashboards, reportes, asistente IA
COORDINADOR  → panel operativo
CAPTURADOR   → registro de recolecciones
FINANCIERO   → módulo de facturación
RECOLECTOR   → tablet app (módulo operativo, en desarrollo)
```

---

## 6. Base de datos — entidades principales

| Tabla | Descripción |
|-------|-------------|
| `plazas` | 4 plazas comerciales activas |
| `locales` | ~283 locales activos (locatarios) |
| `usuarios` | Usuarios del sistema con roles |
| `tipos_residuos` | 11 tipos de residuos |
| `recolecciones` + `detalle_recolecciones` | ~40,500 registros — campo es `kilos`, NO `cantidad_kg` |
| `manifiestos` | Manifiestos SEMA con folios por plaza. Tiene columna `residuos_snapshot` JSONB |
| `recolectores` | Choferes/recolectores del sistema |
| `vehiculos` | Vehículos de recolección |
| `destinos_finales` | Destinos finales de residuos |
| `configuracion_sistema` | Valores globales — función helper `get_config()` |
| `reglamentos`, `tipos_aviso`, `infracciones_predefinidas` | Catálogos de infracciones |
| `locatarios_infracciones` | ⚠️ Ver nota abajo — 759 registros, sin FK a `locales` |
| `infracciones` (aplicadas) | Infracciones aplicadas a locatarios |
| `clientes_facturacion` | Datos fiscales de clientes |
| `servicios_cliente` | Servicios contratados por cliente |
| `cobros_mensuales` | Registro de cobros por cliente/mes |
| `movimientos_cuenta` | Penalizaciones, descuentos, ajustes, notas de crédito |
| `audit_logs` | Bitácora de auditoría — registra CREATEs, no DELETEs |

**RLS:** Deliberadamente deshabilitado. La seguridad la maneja el backend via JWT. No reactivar sin sesión dedicada.

### Nota crítica sobre `locatarios_infracciones`
Esta tabla tiene 759 registros funcionando en producción y **NO tiene FK a `locales`**. Los nombres son inconsistentes (mayúsculas/minúsculas/espacios). El JOIN por nombre es frágil. No tocar ni migrar sin sesión dedicada con plan documentado. El camino correcto cuando se decida: agregar `local_id`, migrar los 759 registros con script verificado y luego conectar al portal.

### Nota crítica sobre `manifiestos`
Los manifiestos son documentos legales. Los kilos se guardan como snapshot fijo en `residuos_snapshot` JSONB al momento de crear el manifiesto. **Nunca recalcular dinámicamente** — esto causó el bug donde dos usuarios descargaban el mismo manifiesto y veían kilos distintos. Si `residuos_snapshot` es null (manifiestos históricos), usar fallback dinámico como excepción.

---

## 7. Variables de entorno

### Backend (`backend/.env`)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=        ← es SUPABASE_SERVICE_KEY, no SUPABASE_KEY ni SUPABASE_ANON_KEY
JWT_SECRET=
ANTHROPIC_API_KEY=           ← NUNCA compartir en chat, NUNCA commitear
PORT=
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=
```

En producción, las variables están en **Render Environment Variables**.

**REGLA DE ORO:** Nunca pegar API keys, tokens ni secrets en el chat. Ir directo al `.env`.

---

## 8. URLs y referencias de producción

| Servicio | URL / Valor |
|---------|-------------|
| Frontend | https://acrux-bio-frontend.onrender.com |
| Backend | https://acrux-bio-backend.onrender.com |
| Estado de Render | https://status.render.com |
| Rama de trabajo | `main` |
| Repositorio | `marcosmiraballes-dev/acrux-bio` |
| Plaza Malecón Cancún ID | `3b1aab0e-0258-4065-9ada-d7e0d6cab38f` |
| Liverpool Malecón ID | `997559ea-2df2-4097-9fad-4efd21614589` |
| Email Director (pruebas) | `director@elefantesverdes.com` |

---

## 9. Reglas de trabajo — obligatorias

### Antes de cualquier cambio
1. Verificar rama: `git branch --show-current` → debe decir `main`
2. Verificar que estás en el proyecto correcto — Acrux Bio, NO Acrux 360. Ruta: `~/Documentos/Acrux/Acrux Bio/acrux-bio/`
3. Para archivos de alto riesgo: pedir confirmación explícita antes de editar

### Al escribir código
- **Siempre usar `api.get()` / `api.post()` etc.** (instancia de axios en `utils/api.ts`) — nunca `fetch` manual. El fetch manual no envía el token JWT correctamente y genera 401.
- Verificar nombres exactos de columnas con `information_schema.columns` antes de escribir queries. Ejemplo real: el campo es `kilos` en `detalle_recolecciones`, no `cantidad_kg`.
- Verificar nombres exactos de archivos — Linux es case-sensitive. Un import con casing incorrecto funciona en Windows pero rompe en Render.

### Al hacer commit
- **NUNCA** `git add .` en bloque
- Solo commitear los archivos del trabajo actual de la sesión
- Verificar TypeScript antes del push: `npx tsc --noEmit 2>&1 | grep <archivo-modificado>`
- Si aparecen ~150 archivos "modificados" sin haber tocado nada: causa probable = line endings CRLF→LF por cambio de carpeta en Windows. Solución: `git config core.autocrlf false` + `git checkout -- .`

### Cuando algo falla
- **Regla de los 3 intentos:** si a la tercera solución no funciona → parar, cambiar enfoque, preguntar antes de continuar
- **Orden correcto de diagnóstico:** frontend → backend → base de datos. No ir a la BD si el problema puede ser una línea en el frontend.
- **Simplicidad primero:** ¿se puede resolver agregando una columna en vez de modificar 5 archivos? Agregar la columna.
- **No tocar lo que funciona:** agregar métodos/archivos nuevos antes que modificar los existentes

### Ante comportamiento inesperado post-deploy
Probar siempre en ventana privada o Ctrl+Shift+R (hard refresh) antes de asumir que el código está mal. Incidente real: la descarga de Excel del asistente IA no se disparaba — era caché del bundle anterior, no un bug.

---

## 10. TypeScript — notas específicas

- Hay un warning no-bloqueante en `moduleResolution: "node"` (node10 deprecado) — dejarlo, tiene sesión dedicada pendiente. No migrar a `node16` o `bundler` sin planificarlo explícitamente.
- Siempre tipar explícitamente los parámetros de `.map()`. Incidente real: `(m: { mes: string; co2_evitado: string })` sin tipo explícito causó timeout en deploy de Render.

---

## 11. Módulos en producción

| Módulo | Estado |
|--------|--------|
| Dashboard Director (KPIs, gráficas, rankings) | ✅ Producción |
| Dashboard Coordinador | ✅ Producción |
| Panel Capturador (registro recolecciones) | ✅ Producción |
| Gestión Plazas, Locales, Usuarios, Tipos Residuos | ✅ Producción |
| Manifiestos SEMA (folios por plaza, snapshot) | ✅ Producción |
| Infracciones (catálogos + aplicación a locatarios) | ✅ Producción |
| Bitácora Excel por locatario | ✅ Producción |
| Huella de Carbono (reportes HTML anuales/mensuales) | ✅ Producción |
| Asistente IA Director (Tool Use, 8 tools) | ✅ Producción |
| Facturación (clientes, servicios, cobros, reporte HTML) | ✅ Producción |
| Movimientos de cuenta | ✅ Producción |
| Logs de auditoría | ✅ Producción |
| Portal Locatarios (portal.html en GoDaddy) | ✅ Producción |
| Módulo Operativo (rutas, recolector móvil) | 🔵 En diseño |
| Asistente IA Coordinador | 🔵 Pendiente — requiere definir reglas de negocio primero |
| Ranking anónimo por plaza en portal | 🔵 Listo para desarrollar |
| Certificado de Reciclaje | ⏸️ Prototipo listo, en espera definición cliente |
| CFDI/PAC timbrado (Facturación Fase 2) | ⏸️ En espera requerimiento cliente |
| Metas de reciclaje + historial comunicaciones | 🔵 En diseño |

---

## 12. Generación de reportes — HTML sobre todo

**HTML → PDF** es el enfoque estándar del sistema. Decisiones tomadas después de problemas reales:

- **jsPDF descartado:** no soporta emojis, gradientes ni diseños complejos. Archivos corruptos en algunos casos.
- **html2canvas descartado:** Recharts no captura bien.
- **Puppeteer descartado:** archivos corruptos y problemas de layout.

El usuario genera el HTML y lo imprime a PDF desde el navegador (Ctrl+P → Guardar como PDF).

La función compartida `frontend/src/utils/generarReporteHuella.ts` es usada por `HuellaCarbonoDirector.tsx` y por `AsistenteDirector.tsx`. Cualquier mejora a los reportes de huella debe hacerse en ese archivo único.

---

## 13. Asistente IA Director

- **Motor:** `claude-sonnet-4-6` via Anthropic API (`@anthropic-ai/sdk`)
- **Patrón:** Tool Use con bucle `while (stop_reason !== 'end_turn')`
- **Memoria:** historial de mensajes en estado React, enviado completo en cada request
- **Seguridad:** API key solo en backend — nunca expuesta al frontend
- **Endpoint:** `POST /api/asistente/director` — requiere JWT con rol DIRECTOR
- **Costo estimado:** $0.05–0.10 USD por sesión del Director

### Tools disponibles

| Tool | Descripción |
|------|-------------|
| `get_plazas` | Lista de plazas activas con IDs |
| `get_locatarios_plaza` | Locatarios de una plaza con totales por período |
| `get_huella_locatario` | Huella de carbono de un locatario |
| `get_huella_plaza` | Huella consolidada de una plaza |
| `get_comparacion_periodos` | Comparativa entre dos períodos |
| `generate_huella_report` | Genera y abre reporte HTML de huella |
| `get_manifiestos_local` | Lista manifiestos de un locatario |
| `generate_bitacora_report` | Descarga bitácora Excel de un locatario |

### Reglas críticas del system prompt
- NUNCA inventar números — solo usar datos de las herramientas
- Si hay ambigüedad (dos locatarios con nombre similar), preguntar antes de actuar
- Solo usar `generate_huella_report` cuando tiene el ID exacto y confirmado
- Responder siempre en español, formato mexicano para números (1,234,567.89)

---

## 14. Operaciones en base de datos — protocolo

1. Diagnosticar schema: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tabla'`
2. Verificar conteos antes: `SELECT COUNT(*) FROM tabla WHERE condición`
3. Usar CTEs atómicas — no bloques BEGIN/COMMIT separados en el editor SQL de Supabase:
   ```sql
   WITH updated AS (
     UPDATE tabla SET campo = valor WHERE condición RETURNING id
   ) SELECT * FROM updated;
   ```
4. Para migraciones históricas: ejecutar primero SELECT de verificación, luego UPDATE definitivo
5. Confirmar con `COUNT(*) WHERE campo IS NULL = 0` antes de dar migración por terminada

### Errores SQL conocidos en este proyecto
- `::date` cast explícito requerido en Supabase al usar `CASE WHEN` con fechas en UPDATE — sin él lanza error 42804
- `INNER JOIN` puede silenciosamente excluir registros con valores nulos — preferir `LEFT JOIN`
- El campo en `detalle_recolecciones` es `kilos`, no `cantidad_kg`
- La columna `municipio` NO existe en la tabla `locales` — está en el snapshot de manifiestos (`generador_municipio`)

---

## 15. Factores ambientales verificados

**No modificar sin sesión dedicada.** Fuentes oficiales citables.

| Material | Factor kg CO₂eq/kg | Fuente |
|----------|-------------------|--------|
| Aluminio | 10.08 | EPA WARM v16 |
| Archivo (papel) | 4.41 | EPA WARM v16 |
| Cartón | 3.66 | EPA WARM v16 |
| Chatarra | 2.04 | EPA WARM v16 |
| PET | 1.16 | EPA WARM v16 |
| Plástico Duro/Playo | 0.86 | EPA WARM v16 (HDPE) |
| Orgánico | 0.65 | EPA WARM v16 |
| Tetra Pak | 0.50 | Proxy (sin dato en WARM) |
| Vidrio | 0.33 | EPA WARM v16 |
| Inorgánico | 0 (forzado) | LGPGIR/SEMARNAT — va a relleno sanitario |

**Equivalencias:**
- Árboles = CO₂ / 21.77 (EPA GHG Equivalencies)
- kWh = CO₂ / 0.444 kg CO₂/kWh (SEMARNAT/RENE SEN 2025 — actualizado 14 abril 2026)
- km en auto = CO₂ / 0.192 (IPCC 2006/INECC)

> Si ves el factor `0.454` en algún archivo del repo, está desactualizado. El correcto es `0.444`.

---

## 16. Incidentes documentados — no repetir

| Incidente | Causa raíz | Lección |
|-----------|-----------|---------|
| Manifiestos con kilos distintos según usuario | Kilos recalculados dinámicamente en cada descarga, no guardados como snapshot | Los manifiestos son documentos legales — nunca calcular en tiempo real |
| Error 500 post-deploy en `getById()` | Copilot agregó `locales_1.municipio` que no existe en esa tabla | Verificar `information_schema` antes de asumir nombres de columnas |
| TypeScript lanzaba error en deploy | Parámetro de `.map()` sin tipo explícito | Tipar siempre los parámetros de `.map()` |
| API key expuesta en chat | Se pegó accidentalmente en la conversación | La key fue rotada. Nunca pegar secrets en el chat |
| Copilot trabajó en Acrux 360 en vez de Acrux Bio | No se especificó la ruta completa al inicio de la sesión | Indicar siempre la ruta completa del proyecto |
| ~150 archivos "modificados" sin cambios reales | Cambio de carpeta en Windows alteró line endings | `git config core.autocrlf false` + `git checkout -- .` |
| Descarga Excel no funcionaba post-deploy | Caché del bundle anterior en el navegador | Probar en ventana privada o Ctrl+Shift+R ante comportamiento inesperado |
| Wizard mostraba los 283 locales sin filtrar | Endpoint no recibía `plazaId` como parámetro | El selector de locales siempre filtra por plaza primero |
| 401 Unauthorized en llamadas al backend | Se usó `fetch` manual en vez de la instancia `api` de axios | Usar siempre `api.get()` / `api.post()` de `utils/api.ts` |

---

## 17. Decisiones de arquitectura permanentes

- **RLS deshabilitado** intencionalmente. El backend maneja la seguridad via JWT. RLS estaba causando bloqueos en inserciones.
- **Sin CFDI en Fase 1 de facturación.** El contador timbra externamente. El folio fiscal se captura manualmente.
- **Datos fiscales de locales no duplicados.** RFC, razón social y email ya existen en `locales` — se consumen via JOIN.
- **Selector plaza → local siempre.** Cualquier selector de locales en el sistema filtra primero por plaza.
- **`tipo_aviso_id` es auto-asignado** en infracciones — no se muestra el dropdown al usuario. Lógica en `infraccion.service.ts`.
- **Folios de manifiestos son por plaza**, no globales. Cada plaza tiene su propia numeración consecutiva por año.
- **`residuos_snapshot`** en manifiestos congela los kilos al crear. Manifiestos históricos sin snapshot usan fallback dinámico.
- **Registros con kilos = 0** en recolecciones se conservan — representan visitas sin recolección, útiles para análisis de frecuencia.
- **Audit logs registran CREATEs pero no DELETEs** — limitación conocida a considerar en futuras mejoras.

---

*Última actualización: Abril 2026 — Sistema en producción activa*
*Repositorio: marcosmiraballes-dev/acrux-bio*
