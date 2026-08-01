import { supabase } from '../config/supabase';
import { ActualizarAlertaInput } from '../schemas/alertas.schema';

export class AlertasService {

  async generarAlertasMes(mes: string): Promise<{ generadas: number; alertas: any[] }> {
    const { data, error } = await supabase.rpc('calcular_alertas_mes', { p_mes: mes });
    if (error) throw new Error(`Error calculando alertas: ${error.message}`);
    if (!data || data.length === 0) return { generadas: 0, alertas: [] };

    const localIds = data.map((alerta: any) => alerta.local_id);

    const { data: existentes, error: errExistentes } = await supabase
      .from('alertas_cumplimiento')
      .select('local_id')
      .eq('mes_alerta', mes)
      .in('local_id', localIds);

    if (errExistentes) throw new Error(`Error verificando alertas existentes: ${errExistentes.message}`);

    const localesConAlerta = new Set((existentes || []).map((e: any) => e.local_id));

    const nuevasAlertas = data
      .filter((alerta: any) => !localesConAlerta.has(alerta.local_id))
      .map((alerta: any) => ({
        local_id: alerta.local_id,
        plaza_id: alerta.plaza_id,
        coordinador_id: alerta.coordinador_id,
        mes_alerta: mes,
        kilos_promedio_historico: alerta.kilos_promedio_historico,
        kilos_mes_actual: alerta.kilos_mes_actual,
        porcentaje_desviacion: alerta.porcentaje_desviacion,
        tipo_alerta: alerta.tipo_alerta,
      }));

    if (nuevasAlertas.length === 0) {
      return { generadas: 0, alertas: [] };
    }

    const { data: insertadas, error: errInsert } = await supabase
      .from('alertas_cumplimiento')
      .insert(nuevasAlertas)
      .select();

    if (errInsert) throw new Error(`Error insertando alertas: ${errInsert.message}`);

    return { generadas: insertadas?.length || 0, alertas: insertadas || [] };
  }

  async getAlertasByCoordinador(coordinador_id: string, estatus?: string): Promise<any[]> {
    let query = supabase
      .from('alertas_cumplimiento')
      .select(`*, locales(nombre, giro), plazas(nombre)`)
      .eq('coordinador_id', coordinador_id)
      .order('mes_alerta', { ascending: false })
      .order('porcentaje_desviacion', { ascending: true });

    if (estatus) query = query.eq('estatus', estatus);

    const { data, error } = await query;
    if (error) throw new Error(`Error obteniendo alertas: ${error.message}`);
    return data || [];
  }

  async getAlertasByPlaza(plaza_id: string, estatus?: string): Promise<any[]> {
    let query = supabase
      .from('alertas_cumplimiento')
      .select(`*, locales(nombre, giro), plazas(nombre)`)
      .eq('plaza_id', plaza_id)
      .order('mes_alerta', { ascending: false });

    if (estatus) query = query.eq('estatus', estatus);

    const { data, error } = await query;
    if (error) throw new Error(`Error obteniendo alertas por plaza: ${error.message}`);
    return data || [];
  }

  async getAlertasParaDirector(): Promise<any[]> {
    const { data, error } = await supabase
      .from('alertas_cumplimiento')
      .select(`*, locales(nombre, giro), plazas(nombre), usuarios!coordinador_id(nombre)`)
      .eq('informe_generado', true)
      .eq('estatus', 'INFORMADA')
      .order('informe_fecha', { ascending: false });

    if (error) throw new Error(`Error obteniendo informes: ${error.message}`);
    return data || [];
  }

  async actualizarAlerta(id: string, input: ActualizarAlertaInput): Promise<any> {
    const { data, error } = await supabase
      .from('alertas_cumplimiento')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando alerta: ${error.message}`);
    return data;
  }

  async generarInforme(id: string, nota: string): Promise<any> {
    const alerta = await this.actualizarAlerta(id, {
      estatus: 'INFORMADA',
      nota_coordinador: nota,
      informe_generado: true,
      informe_fecha: new Date().toISOString(),
    });

    // Registrar en historial automáticamente
    const { error } = await supabase
      .from('historial_comunicacion')
      .insert({
        local_id: alerta.local_id,
        tipo_origen: 'ALERTA_CUMPLIMIENTO',
        referencia_id: alerta.id,
        descripcion: `Informe elevado al Director: caída del ${Math.abs(alerta.porcentaje_desviacion)}% respecto al promedio histórico. Nota: ${nota}`,
        coordinador_id: alerta.coordinador_id,
      });

    if (error) throw new Error(`Error registrando en historial: ${error.message}`);
    return alerta;
  }

  async getTendenciaLocal(local_id: string, meses: number = 6): Promise<any[]> {
    const fechaHasta = new Date();
    const fechaDesde = new Date();
    fechaDesde.setMonth(fechaDesde.getMonth() - meses);

    const { data, error } = await supabase
      .from('recolecciones')
      .select('fecha_recoleccion, total_kilos')
      .eq('local_id', local_id)
      .gte('fecha_recoleccion', fechaDesde.toISOString().split('T')[0])
      .lte('fecha_recoleccion', fechaHasta.toISOString().split('T')[0])
      .order('fecha_recoleccion', { ascending: true });

    if (error) throw new Error(`Error obteniendo tendencia: ${error.message}`);

    // Agrupar por mes
    const porMes: Record<string, number> = {};
    (data || []).forEach(r => {
      const mes = r.fecha_recoleccion.substring(0, 7); // YYYY-MM
      porMes[mes] = (porMes[mes] || 0) + Number(r.total_kilos);
    });

    return Object.entries(porMes).map(([mes, kilos]) => ({
      mes,
      kilos: Math.round(kilos * 100) / 100,
    }));
  }

  async getAlertasAnteriores(local_id: string, mes_actual: string): Promise<number> {
    const { count, error } = await supabase
      .from('alertas_cumplimiento')
      .select('id', { count: 'exact', head: true })
      .eq('local_id', local_id)
      .lt('mes_alerta', mes_actual);

    if (error) throw new Error(`Error contando alertas anteriores: ${error.message}`);
    return count || 0;
  }
}
