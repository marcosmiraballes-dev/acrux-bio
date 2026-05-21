import { Router } from 'express';
import { portalController } from '../controllers/portal.controller';

const router = Router();

// Rutas públicas - sin JWT
router.post('/login', (req, res) => portalController.login(req, res));
router.post('/recolecciones', (req, res) => portalController.getRecolecciones(req, res));

// Autoservicio
router.post('/autoservicio', (req, res) => portalController.registrarAutoservicio(req, res));
router.get('/autoservicio/historial', (req, res) => portalController.getHistorialAutoservicio(req, res));

export default router;
