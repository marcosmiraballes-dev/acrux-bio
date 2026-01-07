import { Router } from 'express';
import { PlazaController } from '../controllers/plaza.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

const router = Router();
const plazaController = new PlazaController();

/**
 * GET /api/plazas
 * Obtener todas las plazas
 * Query params: ?stats=true (incluir estadísticas)
 * Público (no requiere auth)
 */
router.get('/', (req, res) => plazaController.getAll(req, res));

/**
 * POST /api/plazas
 * Crear una nueva plaza
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.post('/', authenticate, authorize('ADMIN'), auditMiddleware('plazas', 'CREATE'), (req, res) => plazaController.create(req, res));

/**
 * PUT /api/plazas/:id
 * Actualizar una plaza
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.put('/:id', authenticate, authorize('ADMIN'), auditMiddleware('plazas', 'UPDATE'), (req, res) => plazaController.update(req, res));

/**
 * DELETE /api/plazas/:id
 * Eliminar una plaza
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.delete('/:id', authenticate, authorize('ADMIN'), auditMiddleware('plazas', 'DELETE'), (req, res) => plazaController.delete(req, res));

/**
 * GET /api/plazas/:id
 * Obtener una plaza por ID
 * Público (no requiere auth)
 */
router.get('/:id', (req, res) => plazaController.getById(req, res));

export default router;