/**
 * RUTAS PARA COORDINADORES - VERSIÓN SIMPLIFICADA
 * Sin middleware de autenticación - Acceso abierto con filtro manual por plaza
 */

import { Router } from 'express';
import { CoordinadorController } from '../controllers/coordinador.controller';

const router = Router();
const coordinadorController = new CoordinadorController();

/**
 * GET /api/coordinador/stats/general
 * Obtener estadísticas generales
 * Query params: plaza_id (opcional), fecha_desde, fecha_hasta
 */
router.get('/stats/general', (req, res) => coordinadorController.getStats(req, res));

/**
 * GET /api/coordinador/stats/tipo
 * Obtener estadísticas por tipo de residuo
 * Query params: plaza_id (opcional), fecha_desde, fecha_hasta
 */
router.get('/stats/tipo', (req, res) => coordinadorController.getStatsByTipo(req, res));

/**
 * GET /api/coordinador/stats/top-locales
 * Obtener top locales
 * Query params: plaza_id (opcional), fecha_desde, fecha_hasta, limit
 */
router.get('/stats/top-locales', (req, res) => coordinadorController.getTopLocales(req, res));

/**
 * GET /api/coordinador/recolecciones/recientes
 * Obtener recolecciones recientes
 * Query params: plaza_id (opcional), limit, offset
 */
router.get('/recolecciones/recientes', (req, res) => coordinadorController.getRecoleccionesRecientes(req, res));

/**
 * GET /api/coordinador/recolecciones/count
 * Contar total de recolecciones
 * Query params: plaza_id (opcional)
 */
router.get('/recolecciones/count', (req, res) => coordinadorController.countRecolecciones(req, res));

export default router;