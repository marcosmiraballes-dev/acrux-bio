import { Router } from 'express';
import { portalController } from '../controllers/portal.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ── Rutas públicas (sin JWT) ──
router.post('/login', (req, res) => portalController.login(req, res));
router.post('/recolecciones', (req, res) => portalController.getRecolecciones(req, res));
router.post('/login-locatario', (req, res) => portalController.loginLocatario(req, res));

// ── Rutas protegidas — solo rol LOCATARIO ──
router.post(
  '/autoservicio',
  authenticate,
  authorize('LOCATARIO'),
  (req, res) => portalController.registrarAutoservicio(req, res)
);
router.get(
  '/autoservicio/historial',
  authenticate,
  authorize('LOCATARIO', 'ADMIN', 'DIRECTOR'),
  (req, res) => portalController.getHistorialAutoservicio(req, res)
);

export default router;
