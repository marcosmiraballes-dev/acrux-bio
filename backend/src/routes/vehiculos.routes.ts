// backend/src/routes/vehiculos.routes.ts

import { Router } from 'express';
import { vehiculoController } from '../controllers/vehiculo.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/vehiculos - Ver todos (todos los roles autenticados)
router.get(
  '/',
  vehiculoController.getAll.bind(vehiculoController)
);

// GET /api/vehiculos/count
router.get(
  '/count',
  vehiculoController.getCount.bind(vehiculoController)
);

// GET /api/vehiculos/:id
router.get(
  '/:id',
  vehiculoController.getById.bind(vehiculoController)
);

// POST /api/vehiculos - Solo ADMIN
// ⭐ CON AUDITORÍA
router.post(
  '/',
  authorize('ADMIN'),
  auditMiddleware('vehiculos', 'CREATE'), // ⭐ AGREGADO
  vehiculoController.create.bind(vehiculoController)
);

// PUT /api/vehiculos/:id - Solo ADMIN
// ⭐ CON AUDITORÍA
router.put(
  '/:id',
  authorize('ADMIN'),
  auditMiddleware('vehiculos', 'UPDATE'), // ⭐ AGREGADO
  vehiculoController.update.bind(vehiculoController)
);

// PATCH /api/vehiculos/:id/toggle-active - Solo ADMIN
// ⭐ CON AUDITORÍA
router.patch(
  '/:id/toggle-active',
  authorize('ADMIN'),
  auditMiddleware('vehiculos', 'UPDATE'), // ⭐ AGREGADO
  vehiculoController.toggleActive.bind(vehiculoController)
);

// DELETE /api/vehiculos/:id - Solo ADMIN
// ⭐ CON AUDITORÍA
router.delete(
  '/:id',
  authorize('ADMIN'),
  auditMiddleware('vehiculos', 'DELETE'), // ⭐ AGREGADO
  vehiculoController.delete.bind(vehiculoController)
);

export default router;