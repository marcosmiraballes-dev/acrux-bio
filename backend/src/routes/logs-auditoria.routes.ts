// backend/src/routes/logs-auditoria.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import logAuditoriaController from '../controllers/log-auditoria.controller';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN

/**
 * GET /api/logs-auditoria
 * Listar logs con filtros opcionales
 * Query params: usuario_id, accion, modulo, fecha_desde, fecha_hasta, limit, offset
 */
router.get(
  '/',
  authenticate,
  // authorize(['ADMIN']), // Descomenta si tienes función authorize
  logAuditoriaController.getAll
);

/**
 * GET /api/logs-auditoria/stats
 * Obtener estadísticas generales de logs
 */
router.get(
  '/stats',
  authenticate,
  // authorize(['ADMIN']),
  logAuditoriaController.getStats
);

/**
 * POST /api/logs-auditoria/limpiar
 * Eliminar logs con más de 1 año de antigüedad
 */
router.post(
  '/limpiar',
  authenticate,
  // authorize(['ADMIN']),
  logAuditoriaController.limpiar
);

export default router;