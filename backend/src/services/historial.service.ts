import { supabase } from '../config/supabase';
import { CrearNotaManualInput } from '../schemas/historial.schema';

export class HistorialService {

  async getHistorialByLocal(local_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('historial_comunicacion')
      .select(`*, usuarios!coordinador_id(nombre)`)
      .eq('local_id', local_id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
    return data || [];
  }

  async crearNotaManual(input: CrearNotaManualInput): Promise<any> {
    const { data, error } = await supabase
      .from('historial_comunicacion')
      .insert({
        local_id: input.local_id,
        tipo_origen: 'MANUAL',
        tipo_nota_manual: input.tipo_nota_manual,
        descripcion: input.descripcion,
        coordinador_id: input.coordinador_id,
      })
      .select()
      .single();

    if (error) throw new Error(`Error creando nota: ${error.message}`);
    return data;
  }

  async getHistorialResumen(local_id: string): Promise<{
    total: number;
    infracciones: number;
    alertas: number;
    notas_manuales: number;
    ultimo_evento: string | null;
  }> {
    const { data, error } = await supabase
      .from('historial_comunicacion')
      .select('tipo_origen, created_at')
      .eq('local_id', local_id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo resumen: ${error.message}`);
    if (!data || data.length === 0) {
      return { total: 0, infracciones: 0, alertas: 0, notas_manuales: 0, ultimo_evento: null };
    }

    return {
      total: data.length,
      infracciones: data.filter(e => e.tipo_origen === 'INFRACCION').length,
      alertas: data.filter(e => e.tipo_origen === 'ALERTA_CUMPLIMIENTO').length,
      notas_manuales: data.filter(e => e.tipo_origen === 'MANUAL').length,
      ultimo_evento: data[0].created_at,
    };
  }
}
