// backend/src/routes/destinos-finales.routes.ts

import { Router } from 'express';
import { destinoFinalController } from '../controllers/Destino final.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/destinos-finales - Ver todos
router.get(
  '/',
  destinoFinalController.getAll.bind(destinoFinalController)
);

// GET /api/destinos-finales/count
router.get(
  '/count',
  destinoFinalController.getCount.bind(destinoFinalController)
);

// GET /api/destinos-finales/:id
router.get(
  '/:id',
  destinoFinalController.getById.bind(destinoFinalController)
);

// POST /api/destinos-finales - Solo ADMIN
router.post(
  '/',
  authorize('ADMIN'),
  destinoFinalController.create.bind(destinoFinalController)
);

// PUT /api/destinos-finales/:id - Solo ADMIN
router.put(
  '/:id',
  authorize('ADMIN'),
  destinoFinalController.update.bind(destinoFinalController)
);

// PATCH /api/destinos-finales/:id/toggle-active - Solo ADMIN
router.patch(
  '/:id/toggle-active',
  authorize('ADMIN'),
  destinoFinalController.toggleActive.bind(destinoFinalController)
);

// DELETE /api/destinos-finales/:id - Solo ADMIN
router.delete(
  '/:id',
  authorize('ADMIN'),
  destinoFinalController.delete.bind(destinoFinalController)
);

export default router;