import { supabase } from '../config/supabase';

export class PortalService {

  /**
   * Validar código de acceso y retornar datos del local
   */
  async login(codigoAcceso: string): Promise<any> {
    const { data, error } = await supabase
      .from('locales')
      .select(`
        id,
        nombre,
        giro,
        codigo_acceso,
        plazas (id, nombre)
      `)
      .eq('codigo_acceso', codigoAcceso)
      .eq('activo', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Obtener recolecciones de un local por su ID
   */
  async getRecolecciones(localId: string, filters: any = {}): Promise<any> {
    let query = supabase
      .from('recolecciones')
      .select(`
        id,
        fecha_recoleccion,
        detalle_recolecciones (
          id,
          kilos,
          tipos_residuos (id, nombre)
        )
      `)
      .eq('local_id', localId);

    if (filters.fechaInicio) {
      query = query.gte('fecha_recoleccion', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('fecha_recoleccion', filters.fechaFin);
    }

    query = query.order('fecha_recoleccion', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener recolecciones: ${error.message}`);
    }

    // Calcular totales por tipo de residuo
    const totalesPorTipo: Record<string, number> = {};

    (data || []).forEach((rec: any) => {
      rec.detalle_recolecciones?.forEach((det: any) => {
        const nombre = det.tipos_residuos?.nombre || 'Desconocido';
        totalesPorTipo[nombre] = (totalesPorTipo[nombre] || 0) + Number(det.kilos);
      });
    });

    return {
      recolecciones: data || [],
      totales_por_tipo: totalesPorTipo
    };
  }
}

export const portalService = new PortalService();
