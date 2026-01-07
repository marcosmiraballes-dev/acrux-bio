// backend/src/routes/destinos-finales.routes.ts

import { Router } from 'express';
import { destinoFinalController } from '../controllers/destino-final.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

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
// ⭐ CON AUDITORÍA
router.post(
  '/',
  authorize('ADMIN'),
  auditMiddleware('destinos_finales', 'CREATE'), // ⭐ AGREGADO
  destinoFinalController.create.bind(destinoFinalController)
);

// PUT /api/destinos-finales/:id - Solo ADMIN
// ⭐ CON AUDITORÍA
router.put(
  '/:id',
  authorize('ADMIN'),
  auditMiddleware('destinos_finales', 'UPDATE'), // ⭐ AGREGADO
  destinoFinalController.update.bind(destinoFinalController)
);

// PATCH /api/destinos-finales/:id/toggle-active - Solo ADMIN
// ⭐ CON AUDITORÍA
router.patch(
  '/:id/toggle-active',
  authorize('ADMIN'),
  auditMiddleware('destinos_finales', 'UPDATE'), // ⭐ AGREGADO
  destinoFinalController.toggleActive.bind(destinoFinalController)
);

// DELETE /api/destinos-finales/:id - Solo ADMIN
// ⭐ CON AUDITORÍA
router.delete(
  '/:id',
  authorize('ADMIN'),
  auditMiddleware('destinos_finales', 'DELETE'), // ⭐ AGREGADO
  destinoFinalController.delete.bind(destinoFinalController)
);

export default router;