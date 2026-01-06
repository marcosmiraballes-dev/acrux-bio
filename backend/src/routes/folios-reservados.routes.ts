// backend/src/routes/folios-reservados.routes.ts

import { Router } from 'express';
import { folioReservadoController } from '../controllers/folio-reservado.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/folios-reservados - Ver todos (ADMIN, DIRECTOR)
router.get(
  '/',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.getAll.bind(folioReservadoController)
);

// GET /api/folios-reservados/disponibles - Para wizard de manifiestos
router.get(
  '/disponibles',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.getDisponibles.bind(folioReservadoController)
);

// GET /api/folios-reservados/estadisticas - Para dashboard
router.get(
  '/estadisticas',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.getEstadisticasMes.bind(folioReservadoController)
);

// GET /api/folios-reservados/count
router.get(
  '/count',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.getCount.bind(folioReservadoController)
);

// GET /api/folios-reservados/:id
router.get(
  '/:id',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.getById.bind(folioReservadoController)
);

// POST /api/folios-reservados - ADMIN y DIRECTOR (máx 10 por mes)
router.post(
  '/',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.create.bind(folioReservadoController)
);

// PUT /api/folios-reservados/:id - ADMIN y DIRECTOR
router.put(
  '/:id',
  authorize('ADMIN', 'DIRECTOR'),
  folioReservadoController.update.bind(folioReservadoController)
);

// DELETE /api/folios-reservados/:id - Solo ADMIN
router.delete(
  '/:id',
  authorize('ADMIN'),
  folioReservadoController.delete.bind(folioReservadoController)
);

export default router;
