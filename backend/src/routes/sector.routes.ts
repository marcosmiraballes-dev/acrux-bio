import { Router } from 'express';
import { SectorController } from '../controllers/sector.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

const router = Router();
const sectorController = new SectorController();

router.get('/locales/:localId/sectores', authenticate, authorize('ADMIN'), (req, res) => sectorController.getByLocal(req, res));

router.post('/locales/:localId/sectores', authenticate, authorize('ADMIN'), auditMiddleware('sectores_local', 'CREATE'), (req, res) => sectorController.create(req, res));

router.put('/sectores/:id', authenticate, authorize('ADMIN'), auditMiddleware('sectores_local', 'UPDATE'), (req, res) => sectorController.update(req, res));

router.delete('/sectores/:id', authenticate, authorize('ADMIN'), auditMiddleware('sectores_local', 'DELETE'), (req, res) => sectorController.delete(req, res));

export default router;
