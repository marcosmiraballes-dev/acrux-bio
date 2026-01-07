// backend/src/services/log-auditoria.service.ts

import { supabase } from '../config/supabase';

export interface LogAuditoriaData {
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';
  modulo: string;
  registro_id?: string;
  tabla?: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  descripcion: string;
  ip_address?: string;
  user_agent?: string;
  endpoint?: string;
  metodo?: string;
}

export interface FiltrosLogs {
  usuario_id?: string;
  accion?: string;
  modulo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

class LogAuditoriaService {
  /**
   * Crear un nuevo log de auditoría
   * IMPORTANTE: Este método NO debe lanzar errores que rompan la aplicación
   */
  async crear(data: LogAuditoriaData): Promise<void> {
    try {
      const { error } = await supabase
        .from('logs_auditoria')
        .insert({
          usuario_id: data.usuario_id,
          usuario_nombre: data.usuario_nombre,
          usuario_email: data.usuario_email,
          usuario_rol: data.usuario_rol,
          accion: data.accion,
          modulo: data.modulo,
          registro_id: data.registro_id,
          tabla: data.tabla,
          datos_anteriores: data.datos_anteriores,
          datos_nuevos: data.datos_nuevos,
          descripcion: data.descripcion,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          endpoint: data.endpoint,
          metodo: data.metodo
        });

      if (error) {
        console.error('❌ Error guardando log de auditoría:', error);
      }
    } catch (err) {
      console.error('❌ Error en servicio de auditoría:', err);
      // NO lanzar error - los logs no deben romper la aplicación principal
    }
  }

  /**
   * Obtener logs con filtros opcionales
   */
  async obtenerLogs(filtros?: FiltrosLogs): Promise<any[]> {
    let query = supabase
      .from('logs_auditoria')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id);
    }

    if (filtros?.accion) {
      query = query.eq('accion', filtros.accion);
    }

    if (filtros?.modulo) {
      query = query.eq('modulo', filtros.modulo);
    }

    if (filtros?.fecha_desde) {
      query = query.gte('created_at', filtros.fecha_desde);
    }

    if (filtros?.fecha_hasta) {
      query = query.lte('created_at', filtros.fecha_hasta);
    }

    // Paginación
    const limit = filtros?.limit || 50;
    const offset = filtros?.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo logs:', error);
      throw new Error(`Error obteniendo logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Contar logs con filtros opcionales
   */
  async contarLogs(filtros?: Omit<FiltrosLogs, 'limit' | 'offset'>): Promise<number> {
    let query = supabase
      .from('logs_auditoria')
      .select('*', { count: 'exact', head: true });

    // Aplicar filtros
    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id);
    }

    if (filtros?.accion) {
      query = query.eq('accion', filtros.accion);
    }

    if (filtros?.modulo) {
      query = query.eq('modulo', filtros.modulo);
    }

    if (filtros?.fecha_desde) {
      query = query.gte('created_at', filtros.fecha_desde);
    }

    if (filtros?.fecha_hasta) {
      query = query.lte('created_at', filtros.fecha_hasta);
    }

    const { count, error } = await query;

    if (error) {
      console.error('❌ Error contando logs:', error);
      throw new Error(`Error contando logs: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Obtener estadísticas generales
   */
  async obtenerEstadisticas(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_logs_stats');

      if (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }

      return data?.[0] || null;
    } catch (err: any) {
      console.error('❌ Error en obtenerEstadisticas:', err);
      throw new Error(`Error obteniendo estadísticas: ${err.message}`);
    }
  }

  /**
   * Limpiar logs antiguos (>1 año)
   * Solo ADMIN debería poder ejecutar esto
   */
  async limpiarLogsAntiguos(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('limpiar_logs_antiguos');

      if (error) {
        console.error('❌ Error limpiando logs antiguos:', error);
        throw new Error(`Error limpiando logs: ${error.message}`);
      }

      console.log(`🧹 Logs antiguos eliminados: ${data}`);
      return data || 0;
    } catch (err: any) {
      console.error('❌ Error en limpiarLogsAntiguos:', err);
      throw new Error(`Error limpiando logs antiguos: ${err.message}`);
    }
  }
}

export default new LogAuditoriaService();