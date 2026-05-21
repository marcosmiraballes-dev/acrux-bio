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

  /**
   * Registrar residuos por autoservicio
   */
  async registrarAutoservicio(
    localId: string,
    tipoResiduo: string,
    kilos: number,
    observaciones?: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('registros_autoservicio')
      .insert({
        local_id: localId,
        tipo_residuo: tipoResiduo,
        kilos,
        observaciones: observaciones || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al registrar autoservicio: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener historial de autoservicio de un local
   */
  async getHistorialAutoservicio(localId: string): Promise<any> {
    const { data, error } = await supabase
      .from('registros_autoservicio')
      .select('*')
      .eq('local_id', localId)
      .order('fecha_registro', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }

    const registros = data || [];

    // Calcular totales
    const total_kilos = registros.reduce((acc, r) => acc + Number(r.kilos), 0);
    const kilos_por_tipo: Record<string, number> = {};
    registros.forEach((r) => {
      kilos_por_tipo[r.tipo_residuo] = (kilos_por_tipo[r.tipo_residuo] || 0) + Number(r.kilos);
    });

    // Calcular meta mensual: promedio de los últimos 3 meses vs mes actual
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const kilosMesActual = registros
      .filter((r) => r.fecha_registro >= inicioMesActual)
      .reduce((acc, r) => acc + Number(r.kilos), 0);

    // Calcular cumplimiento: % de semanas del mes con al menos 1 registro
    const semanasConRegistro = new Set(
      registros
        .filter((r) => r.fecha_registro >= inicioMesActual)
        .map((r) => {
          const d = new Date(r.fecha_registro);
          return Math.floor(d.getDate() / 7);
        })
    ).size;
    const porcentajeCumplimiento = Math.min(Math.round((semanasConRegistro / 4) * 100), 100);

    return {
      registros,
      totales: {
        total_registros: registros.length,
        total_kilos: Math.round(total_kilos * 100) / 100,
        kilos_por_tipo
      },
      mes_actual: {
        kilos: Math.round(kilosMesActual * 100) / 100,
        porcentaje_cumplimiento: porcentajeCumplimiento
      }
    };
  }
}

export const portalService = new PortalService();
