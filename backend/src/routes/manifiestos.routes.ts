// backend/src/routes/manifiestos.routes.ts

import { Router } from 'express';
import { manifiestoController } from '../controllers/manifiesto.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ========================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ========================================
router.use(authenticate);

// ========================================
// RUTAS DE CONSULTA (ADMIN, DIRECTOR, COORDINADOR)
// ========================================

/**
 * GET /api/manifiestos
 * Listar manifiestos con paginación
 * Acceso: ADMIN, DIRECTOR, COORDINADOR
 */
router.get(
  '/',
  authorize('ADMIN', 'DIRECTOR', 'COORDINADOR'),
  manifiestoController.getAll.bind(manifiestoController)
);

/**
 * GET /api/manifiestos/count
 * Contar total de manifiestos
 * Acceso: ADMIN, DIRECTOR, COORDINADOR
 */
router.get(
  '/count',
  authorize('ADMIN', 'DIRECTOR', 'COORDINADOR'),
  manifiestoController.count.bind(manifiestoController)
);

/**
 * GET /api/manifiestos/local/:localId
 * Obtener manifiestos de un local específico
 * Acceso: ADMIN, DIRECTOR, COORDINADOR
 */
router.get(
  '/local/:localId',
  authorize('ADMIN', 'DIRECTOR', 'COORDINADOR'),
  manifiestoController.getByLocal.bind(manifiestoController)
);

/**
 * GET /api/manifiestos/recoleccion/:recoleccionId
 * Verificar si una recolección ya tiene manifiesto
 * Acceso: ADMIN, DIRECTOR, COORDINADOR
 */
router.get(
  '/recoleccion/:recoleccionId',
  authorize('ADMIN', 'DIRECTOR', 'COORDINADOR'),
  manifiestoController.getByRecoleccion.bind(manifiestoController)
);

/**
 * GET /api/manifiestos/:id
 * Obtener un manifiesto por ID
 * Acceso: ADMIN, DIRECTOR, COORDINADOR
 */
router.get(
  '/:id',
  authorize('ADMIN', 'DIRECTOR', 'COORDINADOR'),
  manifiestoController.getById.bind(manifiestoController)
);

// ========================================
// RUTAS DE CREACIÓN (ADMIN, DIRECTOR)
// ========================================

/**
 * POST /api/manifiestos
 * Crear nuevo manifiesto
 * Acceso: ADMIN, DIRECTOR
 */
router.post(
  '/',
  authorize('ADMIN', 'DIRECTOR'),
  manifiestoController.create.bind(manifiestoController)
);

// ========================================
// RUTAS DE ACTUALIZACIÓN (ADMIN, DIRECTOR)
// ========================================

/**
 * PATCH /api/manifiestos/:id
 * Actualizar manifiesto (solo PDF path)
 * Acceso: ADMIN, DIRECTOR
 */
router.patch(
  '/:id',
  authorize('ADMIN', 'DIRECTOR'),
  manifiestoController.update.bind(manifiestoController)
);

// ========================================
// RUTAS DE ELIMINACIÓN (SOLO ADMIN)
// ========================================

/**
 * DELETE /api/manifiestos/:id
 * Eliminar manifiesto
 * Acceso: SOLO ADMIN
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  manifiestoController.delete.bind(manifiestoController)
);

export default router;

/**
 * ============================================
 * RESUMEN DE PERMISOS
 * ============================================
 * 
 * ADMIN:
 * - Ver todos los manifiestos ✓
 * - Crear manifiestos ✓
 * - Actualizar manifiestos ✓
 * - Eliminar manifiestos ✓
 * 
 * DIRECTOR:
 * - Ver todos los manifiestos ✓
 * - Crear manifiestos ✓
 * - Actualizar manifiestos ✓
 * - Eliminar manifiestos ✗
 * 
 * COORDINADOR:
 * - Ver todos los manifiestos ✓
 * - Crear manifiestos ✗
 * - Actualizar manifiestos ✗
 * - Eliminar manifiestos ✗
 * 
 * CAPTURADOR:
 * - Sin acceso al módulo de manifiestos
 */