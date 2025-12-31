/**
 * SERVICE PARA CAPTURADORES
 * Maneja las operaciones del panel capturador
 */

import { supabase } from '../config/supabase';

export class CapturadorService {
  
  /**
   * Obtener recolecciones del capturador (solo las suyas)
   */
  async getMisRecolecciones(usuarioId: string, limit: number = 20, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('recolecciones')
        .select(`
          id,
          fecha_recoleccion,
          total_kilos,
          co2_evitado,
          created_at,
          plazas (
            id,
            nombre
          ),
          locales (
            id,
            nombre
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('fecha_recoleccion', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      // Transformar datos
      const recolecciones = (data || []).map(r => ({
        id: r.id,
        fecha_recoleccion: r.fecha_recoleccion,
        plaza_nombre: r.plazas?.nombre || 'Sin plaza',
        local_nombre: r.locales?.nombre || 'Sin local',
        total_kilos: r.total_kilos,
        co2_evitado: r.co2_evitado,
        created_at: r.created_at
      }));
      
      return { success: true, data: recolecciones };
    } catch (error: any) {
      console.error('Error obteniendo recolecciones del capturador:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Contar total de recolecciones del capturador
   */
  async countMisRecolecciones(usuarioId: string) {
    try {
      const { count, error } = await supabase
        .from('recolecciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);
      
      if (error) throw error;
      return { success: true, data: count || 0 };
    } catch (error: any) {
      console.error('Error contando recolecciones del capturador:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Obtener detalle de una recolección (solo si es suya)
   */
  async getDetalleRecoleccion(usuarioId: string, recoleccionId: string) {
    try {
      // Verificar que la recolección sea del usuario
      const { data: recoleccion, error: errorRecoleccion } = await supabase
        .from('recolecciones')
        .select('*')
        .eq('id', recoleccionId)
        .eq('usuario_id', usuarioId)
        .single();
      
      if (errorRecoleccion) throw new Error('Recolección no encontrada o no tienes permiso');
      
      // Obtener detalles
      const { data: detalles, error: errorDetalles } = await supabase
        .from('detalle_recolecciones')
        .select(`
          id,
          kilos,
          co2_evitado,
          tipos_residuos (
            id,
            nombre
          )
        `)
        .eq('recoleccion_id', recoleccionId);
      
      if (errorDetalles) throw errorDetalles;
      
      return { 
        success: true, 
        data: {
          recoleccion,
          detalles: detalles || []
        }
      };
    } catch (error: any) {
      console.error('Error obteniendo detalle de recolección:', error);
      throw new Error(error.message);
    }
  }
}