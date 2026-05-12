import { Router } from 'express';
import { AlertasController } from '../controllers/alertas.controller';

const router = Router();
const alertasController = new AlertasController();

// POST /api/alertas/generar — Generar alertas para un mes
router.post('/generar', (req, res) => alertasController.generarAlertasMes(req, res));

// GET /api/alertas/coordinador/:coordinador_id — Alertas por coordinador
router.get('/coordinador/:coordinador_id', (req, res) => alertasController.getAlertasByCoordinador(req, res));

// GET /api/alertas/plaza/:plaza_id — Alertas por plaza
router.get('/plaza/:plaza_id', (req, res) => alertasController.getAlertasByPlaza(req, res));

// GET /api/alertas/director — Informes elevados al director
router.get('/director', (req, res) => alertasController.getAlertasParaDirector(req, res));

// GET /api/alertas/tendencia/:local_id — Tendencia de kilos + alertas anteriores
router.get('/tendencia/:local_id', (req, res) => alertasController.getTendenciaLocal(req, res));

// PATCH /api/alertas/:id — Actualizar estatus o nota de una alerta
router.patch('/:id', (req, res) => alertasController.actualizarAlerta(req, res));

// POST /api/alertas/:id/informe — Generar informe formal al director
router.post('/:id/informe', (req, res) => alertasController.generarInforme(req, res));

export default router;
