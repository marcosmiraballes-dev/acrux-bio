import { Router } from 'express';
import { LocalController } from '../controllers/local.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const localController = new LocalController();

/**
 * GET /api/locales
 * Obtener todos los locales
 * Query params: 
 *   - ?plaza_id=xxx (filtrar por plaza)
 *   - ?stats=true (incluir estadísticas)
 * Público (no requiere auth)
 */
router.get('/', (req, res) => localController.getAll(req, res));

/**
 * POST /api/locales
 * Crear un nuevo local
 * Requiere autenticación - Solo ADMIN
 */
router.post('/', authenticate, authorize('ADMIN'), (req, res) => localController.create(req, res));

/**
 * PUT /api/locales/:id
 * Actualizar un local
 * Requiere autenticación - Solo ADMIN
 */
router.put('/:id', authenticate, authorize('ADMIN'), (req, res) => localController.update(req, res));

/**
 * DELETE /api/locales/:id
 * Eliminar un local
 * Requiere autenticación - Solo ADMIN
 */
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res) => localController.delete(req, res));

/**
 * GET /api/locales/:id
 * Obtener un local por ID
 * Público (no requiere auth)
 */
router.get('/:id', (req, res) => localController.getById(req, res));

export default router;