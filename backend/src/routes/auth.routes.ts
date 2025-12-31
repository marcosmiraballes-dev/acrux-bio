import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 * Requiere autenticación
 */
router.get('/profile', authenticate, (req, res) => authController.getProfile(req, res));

export default router;