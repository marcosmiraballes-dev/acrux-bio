/**
 * CONTROLLER PARA COORDINADORES - VERSIÓN SIMPLIFICADA
 */

import { Request, Response } from 'express';
import { CoordinadorService } from '../services/coordinador.service';

const coordinadorService = new CoordinadorService();

export class CoordinadorController {
  
  /**
   * GET /api/coordinador/stats/general
   * Obtener estadísticas generales
   * Query params: plaza_id, fecha_desde, fecha_hasta
   */
  async getStats(req: Request, res: Response) {
    try {
      const plazaId = req.query.plaza_id as string;
      const filters = {
        fecha_desde: req.query.fecha_desde as string,
        fecha_hasta: req.query.fecha_hasta as string
      };

      const result = await coordinadorService.getStats(plazaId, filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/coordinador/stats/tipo
   * Obtener estadísticas por tipo de residuo
   * Query params: plaza_id, fecha_desde, fecha_hasta
   */
  async getStatsByTipo(req: Request, res: Response) {
    try {
      const plazaId = req.query.plaza_id as string;
      const filters = {
        fecha_desde: req.query.fecha_desde as string,
        fecha_hasta: req.query.fecha_hasta as string
      };

      const result = await coordinadorService.getStatsByTipo(plazaId, filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/coordinador/recolecciones/recientes
   * Obtener recolecciones recientes
   * Query params: plaza_id, limit, offset
   */
  async getRecoleccionesRecientes(req: Request, res: Response) {
    try {
      const plazaId = req.query.plaza_id as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await coordinadorService.getRecoleccionesRecientes(plazaId, limit, offset);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/coordinador/recolecciones/count
   * Contar total de recolecciones
   * Query params: plaza_id
   */
  async countRecolecciones(req: Request, res: Response) {
    try {
      const plazaId = req.query.plaza_id as string;

      const result = await coordinadorService.countRecolecciones(plazaId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/coordinador/stats/top-locales
   * Obtener top locales
   * Query params: plaza_id, fecha_desde, fecha_hasta, limit
   */
  async getTopLocales(req: Request, res: Response) {
    try {
      const plazaId = req.query.plaza_id as string;
      const filters = {
        fecha_desde: req.query.fecha_desde as string,
        fecha_hasta: req.query.fecha_hasta as string,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await coordinadorService.getTopLocales(plazaId, filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}