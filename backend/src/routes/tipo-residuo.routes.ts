import { Router } from 'express';
import { TipoResiduoController } from '../controllers/tipo-residuo.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

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
 * ⭐ CON AUDITORÍA
 */
router.post('/', authenticate, authorize('ADMIN'), auditMiddleware('tipos_residuos', 'CREATE'), (req, res) => tipoResiduoController.create(req, res));

/**
 * PUT /api/tipos-residuos/:id
 * Actualizar un tipo de residuo
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.put('/:id', authenticate, authorize('ADMIN'), auditMiddleware('tipos_residuos', 'UPDATE'), (req, res) => tipoResiduoController.update(req, res));

/**
 * DELETE /api/tipos-residuos/:id
 * Eliminar un tipo de residuo
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.delete('/:id', authenticate, authorize('ADMIN'), auditMiddleware('tipos_residuos', 'DELETE'), (req, res) => tipoResiduoController.delete(req, res));

/**
 * GET /api/tipos-residuos/:id
 * Obtener un tipo de residuo por ID
 * Público (no requiere auth)
 */
router.get('/:id', (req, res) => tipoResiduoController.getById(req, res));

export default router;