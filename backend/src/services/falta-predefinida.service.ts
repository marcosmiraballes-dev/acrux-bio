import { supabase } from '../config/supabase';
import type { CreateFaltaPredefinidaDTO, UpdateFaltaPredefinidaDTO } from '../schemas/falta-predefinida.schema';

export class FaltaPredefinidaService {
  // Obtener todas las faltas predefinidas
  async getAll(reglamentoId?: string) {
    let query = supabase
      .from('faltas_predefinidas')
      .select(`
        *,
        reglamento:reglamentos(id, numero_punto, descripcion)
      `)
      .order('created_at', { ascending: false });

    if (reglamentoId) {
      query = query.eq('reglamento_id', reglamentoId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Obtener solo faltas activas
  async getActive(reglamentoId?: string) {
    let query = supabase
      .from('faltas_predefinidas')
      .select(`
        *,
        reglamento:reglamentos(id, numero_punto, descripcion)
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (reglamentoId) {
      query = query.eq('reglamento_id', reglamentoId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Obtener una falta predefinida por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('faltas_predefinidas')
      .select(`
        *,
        reglamento:reglamentos(id, numero_punto, descripcion)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Crear falta predefinida
  async create(input: CreateFaltaPredefinidaDTO) {
    // Verificar que el reglamento existe
    const { data: reglamento } = await supabase
      .from('reglamentos')
      .select('id')
      .eq('id', input.reglamento_id)
      .single();

    if (!reglamento) {
      throw new Error('El reglamento especificado no existe');
    }

    const { data, error } = await supabase
      .from('faltas_predefinidas')
      .insert(input)
      .select(`
        *,
        reglamento:reglamentos(id, numero_punto, descripcion)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar falta predefinida
  async update(id: string, input: UpdateFaltaPredefinidaDTO) {
    // Si se actualiza el reglamento, verificar que existe
    if (input.reglamento_id) {
      const { data: reglamento } = await supabase
        .from('reglamentos')
        .select('id')
        .eq('id', input.reglamento_id)
        .single();

      if (!reglamento) {
        throw new Error('El reglamento especificado no existe');
      }
    }

    const { data, error } = await supabase
      .from('faltas_predefinidas')
      .update(input)
      .eq('id', id)
      .select(`
        *,
        reglamento:reglamentos(id, numero_punto, descripcion)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Desactivar/activar falta predefinida (soft delete)
  async toggleActive(id: string) {
    const falta = await this.getById(id);
    
    const { data, error } = await supabase
      .from('faltas_predefinidas')
      .update({ activo: !falta.activo })
      .eq('id', id)
      .select(`
        *,
        reglamento:reglamentos(id, numero_punto, descripcion)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar falta predefinida (verificar que no esté en uso)
  async delete(id: string) {
    // Verificar si está siendo usada en infracciones
    const { data: infracciones } = await supabase
      .from('infracciones')
      .select('id')
      .eq('falta_predefinida_id', id)
      .limit(1);

    if (infracciones && infracciones.length > 0) {
      throw new Error('No se puede eliminar una falta predefinida que está siendo usada en infracciones. Desactívala en su lugar.');
    }

    const { error } = await supabase
      .from('faltas_predefinidas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Falta predefinida eliminada exitosamente' };
  }

  // Obtener faltas agrupadas por reglamento
  async getGroupedByReglamento() {
    const { data, error } = await supabase
      .from('reglamentos')
      .select(`
        id,
        numero_punto,
        descripcion,
        activo,
        orden,
        faltas_predefinidas(*)
      `)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data;
  }
}

export const faltaPredefinidaService = new FaltaPredefinidaService();