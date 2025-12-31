import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class ComparacionService {
  
  /**
   * Comparar dos periodos de recolecciones
   */
  async compararPeriodos(req: Request, res: Response) {
    try {
      console.log('📊 Iniciando comparación de periodos...');
      
      const {
        plaza_id,
        local_id,
        periodo1_desde,
        periodo1_hasta,
        periodo2_desde,
        periodo2_hasta
      } = req.query;

      // Validaciones
      if (!periodo1_desde || !periodo1_hasta || !periodo2_desde || !periodo2_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren las fechas de ambos periodos (periodo1_desde, periodo1_hasta, periodo2_desde, periodo2_hasta)'
        });
      }

      console.log('🔍 Parámetros de comparación:', {
        plaza_id: plaza_id || 'Todas',
        local_id: local_id || 'Todos',
        periodo1: `${periodo1_desde} - ${periodo1_hasta}`,
        periodo2: `${periodo2_desde} - ${periodo2_hasta}`
      });

      // Llamar a la función SQL
      const { data, error } = await supabase.rpc('comparar_periodos_recolecciones', {
        p_plaza_id: plaza_id || null,
        p_local_id: local_id || null,
        p_periodo1_desde: periodo1_desde,
        p_periodo1_hasta: periodo1_hasta,
        p_periodo2_desde: periodo2_desde,
        p_periodo2_hasta: periodo2_hasta
      });

      if (error) {
        console.error('❌ Error en función SQL:', error);
        return res.status(500).json({
          success: false,
          error: 'Error ejecutando la comparación',
          details: error.message
        });
      }

      console.log('✅ Comparación exitosa');

      return res.status(200).json({
        success: true,
        data: data
      });

    } catch (error) {
      console.error('❌ Error en compararPeriodos:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}