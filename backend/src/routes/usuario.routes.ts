import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

const router = Router();
const usuarioController = new UsuarioController();

/**
 * GET /api/usuarios
 * Obtener todos los usuarios
 * Requiere autenticación - Solo ADMIN
 */
router.get('/', authenticate, authorize('ADMIN'), (req, res) => usuarioController.getAll(req, res));

/**
 * POST /api/usuarios
 * Crear un nuevo usuario
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.post('/', authenticate, authorize('ADMIN'), auditMiddleware('usuarios', 'CREATE'), (req, res) => usuarioController.create(req, res));

/**
 * PUT /api/usuarios/:id
 * Actualizar un usuario
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.put('/:id', authenticate, authorize('ADMIN'), auditMiddleware('usuarios', 'UPDATE'), (req, res) => usuarioController.update(req, res));

/**
 * DELETE /api/usuarios/:id
 * Eliminar un usuario
 * Requiere autenticación - Solo ADMIN
 * ⭐ CON AUDITORÍA
 */
router.delete('/:id', authenticate, authorize('ADMIN'), auditMiddleware('usuarios', 'DELETE'), (req, res) => usuarioController.delete(req, res));

/**
 * GET /api/usuarios/:id
 * Obtener un usuario por ID
 * Requiere autenticación - Solo ADMIN
 */
router.get('/:id', authenticate, authorize('ADMIN'), (req, res) => usuarioController.getById(req, res));

export default router;