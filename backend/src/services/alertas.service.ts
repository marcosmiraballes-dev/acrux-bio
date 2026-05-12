import { supabase } from '../config/supabase';
import { ActualizarAlertaInput } from '../schemas/alertas.schema';

export class AlertasService {

  async generarAlertasMes(mes: string): Promise<{ generadas: number; alertas: any[] }> {
    const { data, error } = await supabase.rpc('calcular_alertas_mes', { p_mes: mes });
    if (error) throw new Error(`Error calculando alertas: ${error.message}`);
    if (!data || data.length === 0) return { generadas: 0, alertas: [] };

    const insertadas: any[] = [];
    for (const alerta of data) {
      const { data: existing } = await supabase
        .from('alertas_cumplimiento')
        .select('id')
        .eq('local_id', alerta.local_id)
        .eq('mes_alerta', mes)
        .single();

      if (existing) continue;

      const { data: nueva, error: errInsert } = await supabase
        .from('alertas_cumplimiento')
        .insert({
          local_id: alerta.local_id,
          plaza_id: alerta.plaza_id,
          coordinador_id: alerta.coordinador_id,
          mes_alerta: mes,
          kilos_promedio_historico: alerta.kilos_promedio_historico,
          kilos_mes_actual: alerta.kilos_mes_actual,
          porcentaje_desviacion: alerta.porcentaje_desviacion,
          tipo_alerta: alerta.tipo_alerta,
        })
        .select()
        .single();

      if (errInsert) throw new Error(`Error insertando alerta: ${errInsert.message}`);
      insertadas.push(nueva);
    }

    return { generadas: insertadas.length, alertas: insertadas };
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
