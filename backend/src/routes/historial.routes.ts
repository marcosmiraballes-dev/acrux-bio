import { Router } from 'express';
import { HistorialController } from '../controllers/historial.controller';

const router = Router();
const historialController = new HistorialController();

// GET /api/historial/:local_id — Historial completo de un local
router.get('/:local_id', (req, res) => historialController.getHistorialByLocal(req, res));

// GET /api/historial/:local_id/resumen — Resumen de conteos por tipo
router.get('/:local_id/resumen', (req, res) => historialController.getHistorialResumen(req, res));

// POST /api/historial/nota — Crear nota manual del coordinador
router.post('/nota', (req, res) => historialController.crearNotaManual(req, res));

export default router;
