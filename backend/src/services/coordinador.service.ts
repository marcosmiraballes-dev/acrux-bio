/**
 * SERVICE PARA COORDINADORES - VERSIÓN SIMPLIFICADA
 * Filtro por plaza opcional, sin restricción de coordinador
 */

import { supabase } from '../config/supabase';

export class CoordinadorService {
  
  /**
   * Obtener estadísticas generales
   */
  async getStats(plazaId?: string, filters?: any) {
    try {
      const { data, error } = await supabase
        .rpc('get_stats_coordinador_simple', {
          p_plaza_id: plazaId || null,
          p_fecha_desde: filters?.fecha_desde || null,
          p_fecha_hasta: filters?.fecha_hasta || null
        });
      
      if (error) throw error;
      return { success: true, data: data[0] || { total_recolecciones: 0, total_kilos: 0, total_co2_evitado: 0 } };
    } catch (error: any) {
      console.error('Error obteniendo stats coordinador:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Obtener estadísticas por tipo de residuo
   */
  async getStatsByTipo(plazaId?: string, filters?: any) {
    try {
      const { data, error } = await supabase
        .rpc('get_stats_tipo_coordinador_simple', {
          p_plaza_id: plazaId || null,
          p_fecha_desde: filters?.fecha_desde || null,
          p_fecha_hasta: filters?.fecha_hasta || null
        });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error obteniendo stats por tipo coordinador:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Obtener recolecciones recientes
   */
  async getRecoleccionesRecientes(plazaId?: string, limit: number = 10, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .rpc('get_recolecciones_recientes_coordinador_simple', {
          p_plaza_id: plazaId || null,
          p_limit: limit,
          p_offset: offset
        });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error obteniendo recolecciones recientes coordinador:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Contar total de recolecciones
   */
  async countRecolecciones(plazaId?: string) {
    try {
      const { data, error } = await supabase
        .rpc('count_recolecciones_coordinador_simple', {
          p_plaza_id: plazaId || null
        });
      
      if (error) throw error;
      return { success: true, data: data || 0 };
    } catch (error: any) {
      console.error('Error contando recolecciones coordinador:', error);
      throw new Error(error.message);
    }
  }

  /**
   * Obtener top locales
   */
  async getTopLocales(plazaId?: string, filters?: any) {
    try {
      const { data, error } = await supabase
        .rpc('get_top_locales_coordinador_simple', {
          p_plaza_id: plazaId || null,
          p_fecha_desde: filters?.fecha_desde || null,
          p_fecha_hasta: filters?.fecha_hasta || null,
          p_limit: filters?.limit || 10
        });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error obteniendo top locales coordinador:', error);
      throw new Error(error.message);
    }
  }
}