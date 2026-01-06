// backend/src/routes/recolectores.routes.ts

import { Router } from 'express';
import { recolectorController } from '../controllers/recolector.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/recolectores
 * Obtener todos los recolectores activos
 */
router.get('/', (req, res) => recolectorController.getAll(req, res));

export default router;