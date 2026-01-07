// backend/src/controllers/log-auditoria.controller.ts

import { Request, Response } from 'express';
import logAuditoriaService from '../services/log-auditoria.service';

class LogAuditoriaController {
  /**
   * GET /api/logs-auditoria
   * Obtener logs con filtros opcionales
   * Solo ADMIN
   */
  async getAll(req: Request, res: Response) {
    try {
      const filtros = {
        usuario_id: req.query.usuario_id as string,
        accion: req.query.accion as string,
        modulo: req.query.modulo as string,
        fecha_desde: req.query.fecha_desde as string,
        fecha_hasta: req.query.fecha_hasta as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      console.log('🔍 Consultando logs con filtros:', filtros);

      const logs = await logAuditoriaService.obtenerLogs(filtros);
      const total = await logAuditoriaService.contarLogs(filtros);

      res.json({
        success: true,
        data: logs,
        pagination: {
          total,
          limit: filtros.limit,
          offset: filtros.offset,
          hasMore: (filtros.offset + filtros.limit) < total
        }
      });
    } catch (error: any) {
      console.error('❌ Error en getAll logs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo logs de auditoría'
      });
    }
  }

  /**
   * GET /api/logs-auditoria/stats
   * Obtener estadísticas generales
   * Solo ADMIN
   */
  async getStats(req: Request, res: Response) {
    try {
      console.log('📊 Obteniendo estadísticas de logs...');

      const stats = await logAuditoriaService.obtenerEstadisticas();

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('❌ Error en getStats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error obteniendo estadísticas'
      });
    }
  }

  /**
   * POST /api/logs-auditoria/limpiar
   * Limpiar logs antiguos (>1 año)
   * Solo ADMIN
   */
  async limpiar(req: Request, res: Response) {
    try {
      console.log('🧹 Limpiando logs antiguos...');

      const eliminados = await logAuditoriaService.limpiarLogsAntiguos();

      res.json({
        success: true,
        message: `${eliminados} logs antiguos eliminados`,
        data: { eliminados }
      });
    } catch (error: any) {
      console.error('❌ Error en limpiar:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error limpiando logs antiguos'
      });
    }
  }
}

export default new LogAuditoriaController();