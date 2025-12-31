import { Router } from 'express';
import { TipoResiduoController } from '../controllers/tipo-residuo.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const tipoResiduoController = new TipoResiduoController();

/**
 * GET /api/tipos-residuos
 * Obtener todos los tipos de residuos
 * Público (no requiere auth)
 */
router.get('/', (req, res) => tipoResiduoController.getAll(req, res));

/**
 * POST /api/tipos-residuos
 * Crear un nuevo tipo de residuo
 * Requiere autenticación - Solo ADMIN
 */
router.post('/', authenticate, authorize('ADMIN'), (req, res) => tipoResiduoController.create(req, res));

/**
 * PUT /api/tipos-residuos/:id
 * Actualizar un tipo de residuo
 * Requiere autenticación - Solo ADMIN
 */
router.put('/:id', authenticate, authorize('ADMIN'), (req, res) => tipoResiduoController.update(req, res));

/**
 * DELETE /api/tipos-residuos/:id
 * Eliminar un tipo de residuo
 * Requiere autenticación - Solo ADMIN
 */
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res) => tipoResiduoController.delete(req, res));

/**
 * GET /api/tipos-residuos/:id
 * Obtener un tipo de residuo por ID
 * Público (no requiere auth)
 */
router.get('/:id', (req, res) => tipoResiduoController.getById(req, res));

export default router;