import { Router } from 'express';
import { PlazaController } from '../controllers/plaza.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

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
 */
router.post('/', authenticate, authorize('ADMIN'), (req, res) => plazaController.create(req, res));

/**
 * PUT /api/plazas/:id
 * Actualizar una plaza
 * Requiere autenticación - Solo ADMIN
 */
router.put('/:id', authenticate, authorize('ADMIN'), (req, res) => plazaController.update(req, res));

/**
 * DELETE /api/plazas/:id
 * Eliminar una plaza
 * Requiere autenticación - Solo ADMIN
 */
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res) => plazaController.delete(req, res));

/**
 * GET /api/plazas/:id
 * Obtener una plaza por ID
 * Público (no requiere auth)
 */
router.get('/:id', (req, res) => plazaController.getById(req, res));

export default router;