import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

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
 */
router.post('/', authenticate, authorize('ADMIN'), (req, res) => usuarioController.create(req, res));

/**
 * PUT /api/usuarios/:id
 * Actualizar un usuario
 * Requiere autenticación - Solo ADMIN
 */
router.put('/:id', authenticate, authorize('ADMIN'), (req, res) => usuarioController.update(req, res));

/**
 * DELETE /api/usuarios/:id
 * Eliminar un usuario
 * Requiere autenticación - Solo ADMIN
 */
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res) => usuarioController.delete(req, res));

/**
 * GET /api/usuarios/:id
 * Obtener un usuario por ID
 * Requiere autenticación - Solo ADMIN
 */
router.get('/:id', authenticate, authorize('ADMIN'), (req, res) => usuarioController.getById(req, res));

export default router;