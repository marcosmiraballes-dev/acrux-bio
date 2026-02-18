import { Router } from 'express';
import { portalController } from '../controllers/portal.controller';

const router = Router();

// Ruta pública - sin JWT
router.post('/login', (req, res) => portalController.login(req, res));
router.post('/recolecciones', (req, res) => portalController.getRecolecciones(req, res));

export default router;
