import { Router } from 'express';
import { RecoleccionController } from '../controllers/recoleccion.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();
const recoleccionController = new RecoleccionController();

// Agregar estas rutas al archivo recolecciones.routes.ts
// ANTES de las rutas existentes (las más específicas primero)

/**
 * GET /api/recolecciones/por-tipo/:tipoResiduoId
 * Obtener historial de recolecciones por tipo de residuo
 * Público (no requiere auth)
 * Query params:
 *   - ?plaza_id=xxx
 *   - ?local_id=xxx
 *   - ?fecha_desde=2024-01-01
 *   - ?fecha_hasta=2024-12-31
 *   - ?limit=10
 */
router.get('/por-tipo/:tipoResiduoId', (req, res) => recoleccionController.getRecoleccionesPorTipo(req, res));

/**
 * GET /api/recolecciones/stats/comparativa-mensual
 * Comparativa mes actual vs mes anterior
 */
router.get('/stats/comparativa-mensual', (req, res) => recoleccionController.getComparativaMensual(req, res));

/**
 * GET /api/recolecciones/stats/comparativa-anual
 * Comparativa año actual vs año anterior
 */
router.get('/stats/comparativa-anual', (req, res) => recoleccionController.getComparativaAnual(req, res));

/**
 * GET /api/recolecciones/stats/comparativa-trimestral
 * Comparativa trimestre actual vs anterior
 */
router.get('/stats/comparativa-trimestral', (req, res) => recoleccionController.getComparativaTrimestral(req, res));

/**
 * GET /api/recolecciones/stats/tendencia-mensual
 * Tendencia mensual (últimos 12 meses)
 * Público (no requiere auth)
 */
router.get('/stats/tendencia-mensual', (req, res) => recoleccionController.getTendenciaMensual(req, res));

/**
 * GET /api/recolecciones/stats/comparativa-plazas
 * Comparativa entre plazas
 * Público (no requiere auth)
 */
router.get('/stats/comparativa-plazas', (req, res) => recoleccionController.getComparativaPlazas(req, res));

/**
 * GET /api/recolecciones/stats/top-locales
 * Top 10 locales más productivos
 * Público (no requiere auth)
 */
router.get('/stats/top-locales', (req, res) => recoleccionController.getTopLocales(req, res));

/**
 * GET /api/recolecciones/stats/general
 * Estadísticas generales
 * Público (no requiere auth)
 */
router.get('/stats/general', (req, res) => recoleccionController.getStats(req, res));

/**
 * GET /api/recolecciones/stats/tipo
 * Estadísticas por tipo de residuo
 * Público (no requiere auth)
 */
router.get('/stats/tipo', (req, res) => recoleccionController.getStatsByTipo(req, res));

/**
 * POST /api/recolecciones
 * Crear una nueva recolección
 * Requiere autenticación - Solo ADMIN y CAPTURADOR
 */
router.post('/', 
  authenticate, 
  authorize('ADMIN', 'CAPTURADOR'), 
  auditMiddleware('recolecciones', 'CREATE'),
  (req, res) => recoleccionController.create(req, res)
);

/**
 * PUT /api/recolecciones/:id
 * Actualizar una recolección
 * Requiere autenticación - Solo ADMIN y CAPTURADOR
 */
router.put('/:id', 
  authenticate, 
  authorize('ADMIN', 'CAPTURADOR'), 
  auditMiddleware('recolecciones', 'UPDATE'),
  (req, res) => recoleccionController.update(req, res)
);

/**
 * DELETE /api/recolecciones/:id
 * Eliminar una recolección
 * Requiere autenticación - Solo ADMIN
 */
router.delete('/:id', 
  authenticate, 
  authorize('ADMIN'), 
  auditMiddleware('recolecciones', 'DELETE'),
  (req, res) => recoleccionController.delete(req, res)
);

/**
 * GET /api/recolecciones
 * Obtener todas las recolecciones
 * Público (no requiere auth)
 * Query params:
 *   - ?plaza_id=xxx
 *   - ?local_id=xxx
 *   - ?fecha_desde=2024-01-01
 *   - ?fecha_hasta=2024-12-31
 *   - ?limit=50
 *   - ?offset=0
 */
router.get('/', (req, res) => recoleccionController.getAll(req, res));

/**
 * GET /api/recolecciones/:id
 * Obtener una recolección por ID
 * Público (no requiere auth)
 */
router.get('/:id', (req, res) => recoleccionController.getById(req, res));

export default router;