import { Request, Response } from 'express';
import { ComparacionService } from '../services/comparacion.service';

const comparacionService = new ComparacionService();

export class ComparacionController {

  /**
   * GET /api/comparacion/periodos
   * Comparar dos periodos de recolecciones
   */
  async compararPeriodos(req: Request, res: Response) {
    try {
      const {
        plaza_id,
        local_id,
        periodo1_desde,
        periodo1_hasta,
        periodo2_desde,
        periodo2_hasta
      } = req.query;

      if (!periodo1_desde || !periodo1_hasta || !periodo2_desde || !periodo2_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren las fechas de ambos periodos (periodo1_desde, periodo1_hasta, periodo2_desde, periodo2_hasta)'
        });
      }

      const data = await comparacionService.compararPeriodos({
        plaza_id: plaza_id as string | undefined,
        local_id: local_id as string | undefined,
        periodo1_desde: periodo1_desde as string,
        periodo1_hasta: periodo1_hasta as string,
        periodo2_desde: periodo2_desde as string,
        periodo2_hasta: periodo2_hasta as string,
      });

      return res.status(200).json({
        success: true,
        data
      });

    } catch (error: any) {
      console.error('❌ Error en compararPeriodos:', error);

      if (error?.isRpcError) {
        return res.status(500).json({
          success: false,
          error: error.message,
          details: error.details
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
