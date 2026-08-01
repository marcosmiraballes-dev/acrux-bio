import { supabase } from '../config/supabase';

interface CompararPeriodosParams {
  plaza_id?: string;
  local_id?: string;
  periodo1_desde: string;
  periodo1_hasta: string;
  periodo2_desde: string;
  periodo2_hasta: string;
}

export class ComparacionService {

  /**
   * Comparar dos periodos de recolecciones
   */
  async compararPeriodos(params: CompararPeriodosParams) {
    const { plaza_id, local_id, periodo1_desde, periodo1_hasta, periodo2_desde, periodo2_hasta } = params;

    console.log('📊 Iniciando comparación de periodos...');
    console.log('🔍 Parámetros de comparación:', {
      plaza_id: plaza_id || 'Todas',
      local_id: local_id || 'Todos',
      periodo1: `${periodo1_desde} - ${periodo1_hasta}`,
      periodo2: `${periodo2_desde} - ${periodo2_hasta}`
    });

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
      const rpcError: any = new Error('Error ejecutando la comparación');
      rpcError.details = error.message;
      rpcError.isRpcError = true;
      throw rpcError;
    }

    console.log('✅ Comparación exitosa');
    return data;
  }
}
