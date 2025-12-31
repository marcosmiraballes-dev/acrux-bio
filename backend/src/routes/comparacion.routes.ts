import { Router } from 'express';
import { ComparacionController } from '../controllers/comparacion.controller';

const router = Router();
const comparacionController = new ComparacionController();

/**
 * GET /api/comparacion/periodos
 * Comparar estadísticas entre dos periodos
 * 
 * Query params:
 * - plaza_id (opcional)
 * - local_id (opcional)
 * - periodo1_desde (requerido)
 * - periodo1_hasta (requerido)
 * - periodo2_desde (requerido)
 * - periodo2_hasta (requerido)
 */
router.get('/periodos', (req, res) => comparacionController.compararPeriodos(req, res));

export default router;