/**
 * RUTAS PARA CAPTURADORES
 */

import { Router } from 'express';
import { CapturadorController } from '../controllers/capturador.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const capturadorController = new CapturadorController();

// Todas las rutas requieren autenticación y rol CAPTURADOR
router.use(authMiddleware(['CAPTURADOR']));

/**
 * GET /api/capturador/mis-recolecciones
 * Obtener recolecciones del capturador
 * Query params: limit, offset
 */
router.get('/mis-recolecciones', (req, res) => capturadorController.getMisRecolecciones(req, res));

/**
 * GET /api/capturador/mis-recolecciones/count
 * Contar total de recolecciones del capturador
 */
router.get('/mis-recolecciones/count', (req, res) => capturadorController.countMisRecolecciones(req, res));

/**
 * GET /api/capturador/recolecciones/:id
 * Obtener detalle de una recolección (solo si es suya)
 */
router.get('/recolecciones/:id', (req, res) => capturadorController.getDetalleRecoleccion(req, res));

export default router;

// ============================================================
// AGREGAR EN server.ts:
// ============================================================
// import capturadorRoutes from './routes/capturador.routes';
// app.use('/api/capturador', capturadorRoutes);