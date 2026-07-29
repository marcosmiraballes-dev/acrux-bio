// backend/src/routes/auth.routes.ts

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditLogin, auditLogout } from '../middleware/audit.middleware';

const router = Router();
const authController = new AuthController();

/**
 * POST /api/auth/login
 * Login de usuario
 * ⭐ INCLUYE auditoría automática de inicio de sesión
 */
router.post(
  '/login',
  auditLogin, // ⭐ NUEVO: Registra en logs cuando usuario inicia sesión
  (req, res) => authController.login(req, res)
);

/**
 * POST /api/auth/register
 * Registro de nuevo usuario
 */
router.post('/register', authenticate, authorize('ADMIN'), (req, res) => authController.register(req, res));

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario autenticado
 * Requiere autenticación
 */
router.get('/profile', authenticate, (req, res) => authController.getProfile(req, res));

/**
 * POST /api/auth/logout
 * Cerrar sesión del usuario
 * ⭐ INCLUYE auditoría automática de cierre de sesión
 * Requiere autenticación
 */
router.post(
  '/logout',
  authenticate,
  auditLogout, // ⭐ NUEVO: Registra en logs cuando usuario cierra sesión
  (req, res) => {
    // El logout es manejado por el frontend (eliminar token)
    // Pero registramos la acción aquí
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  }
);

/**
 * POST /api/auth/login-pin
 * Login de locatario por PIN
 */
router.post('/login-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ 
        success: false, 
        error: 'PIN requerido' 
      });
    }
    const authService = new AuthController().authService || new (require('../services/auth.service').AuthService)();
    const result = await authService.loginPin(pin);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(401).json({ 
      success: false, 
      error: 'PIN inválido',
      message: error.message 
    });
  }
});

export default router;