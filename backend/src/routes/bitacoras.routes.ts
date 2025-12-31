import { Router } from 'express';
import { BitacoraController } from '../controllers/bitacora.controller';

const router = Router();
const bitacoraController = new BitacoraController();

/**
 * GET /api/bitacoras/locatario
 * Generar bitácora de locatario
 * Query params: local_id, fecha_desde, fecha_hasta
 */
router.get('/locatario', (req, res) => bitacoraController.generarBitacoraLocatario(req, res));

export default router;