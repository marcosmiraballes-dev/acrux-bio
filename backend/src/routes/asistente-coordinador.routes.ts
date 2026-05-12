import { Router } from 'express';
import { AsistenteCoordinadorController } from '../controllers/asistente-coordinador.controller';

const router = Router();
const asistenteCoordinadorController = new AsistenteCoordinadorController();

// POST /api/asistente/coordinador — Chat con el asistente del coordinador
router.post('/coordinador', (req, res) => asistenteCoordinadorController.chat(req, res));

export default router;
