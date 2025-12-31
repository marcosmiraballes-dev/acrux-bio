/**
 * CONTROLLER PARA CAPTURADORES
 */

import { Request, Response } from 'express';
import { CapturadorService } from '../services/capturador.service';

const capturadorService = new CapturadorService();

export class CapturadorController {
  
  /**
   * GET /api/capturador/mis-recolecciones
   * Obtener recolecciones del capturador
   */
  async getMisRecolecciones(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await capturadorService.getMisRecolecciones(usuarioId, limit, offset);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/capturador/mis-recolecciones/count
   * Contar recolecciones del capturador
   */
  async countMisRecolecciones(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.id;
      
      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const result = await capturadorService.countMisRecolecciones(usuarioId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/capturador/recolecciones/:id
   * Obtener detalle de una recolección (solo si es suya)
   */
  async getDetalleRecoleccion(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const recoleccionId = req.params.id;
      
      if (!usuarioId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const result = await capturadorService.getDetalleRecoleccion(usuarioId, recoleccionId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}