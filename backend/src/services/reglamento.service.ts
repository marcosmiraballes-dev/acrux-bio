import { supabase } from '../config/supabase';
import type { CreateReglamentoDTO, UpdateReglamentoDTO } from '../schemas/reglamento.schema';

export class ReglamentoService {
  // Obtener todos los reglamentos
  async getAll() {
    const { data, error } = await supabase
      .from('reglamentos')
      .select('*')
      .order('orden', { ascending: true })
      .order('numero_punto', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Obtener solo reglamentos activos
  async getActive() {
    const { data, error } = await supabase
      .from('reglamentos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('numero_punto', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Obtener un reglamento por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('reglamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Crear reglamento
  async create(input: CreateReglamentoDTO) {
    // Verificar que no exista el mismo número de punto
    const { data: existing } = await supabase
      .from('reglamentos')
      .select('id')
      .eq('numero_punto', input.numero_punto)
      .single();

    if (existing) {
      throw new Error('Ya existe un reglamento con ese número de punto');
    }

    const { data, error } = await supabase
      .from('reglamentos')
      .insert(input)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar reglamento
  async update(id: string, input: UpdateReglamentoDTO) {
    // Si se actualiza el número de punto, verificar unicidad
    if (input.numero_punto) {
      const { data: existing } = await supabase
        .from('reglamentos')
        .select('id')
        .eq('numero_punto', input.numero_punto)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error('Ya existe un reglamento con ese número de punto');
      }
    }

    const { data, error } = await supabase
      .from('reglamentos')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Desactivar/activar reglamento (soft delete)
  async toggleActive(id: string) {
    const reglamento = await this.getById(id);
    
    const { data, error } = await supabase
      .from('reglamentos')
      .update({ activo: !reglamento.activo })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar reglamento (verificar que no tenga faltas predefinidas)
  async delete(id: string) {
    // Verificar si tiene faltas predefinidas asociadas
    const { data: faltas } = await supabase
      .from('faltas_predefinidas')
      .select('id')
      .eq('reglamento_id', id)
      .limit(1);

    if (faltas && faltas.length > 0) {
      throw new Error('No se puede eliminar un reglamento con faltas predefinidas. Desactívalo en su lugar.');
    }

    const { error } = await supabase
      .from('reglamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Reglamento eliminado exitosamente' };
  }

  // Reordenar reglamentos
  async reorder(reglamentos: { id: string; orden: number }[]) {
    const updates = reglamentos.map(({ id, orden }) =>
      supabase
        .from('reglamentos')
        .update({ orden })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      throw new Error('Error al reordenar reglamentos');
    }

    return { message: 'Reglamentos reordenados exitosamente' };
  }

  // Obtener reglamentos con conteo de faltas predefinidas
  async getWithFaltasCount() {
    const { data, error } = await supabase
      .from('reglamentos')
      .select(`
        *,
        faltas_predefinidas(count)
      `)
      .order('orden', { ascending: true })
      .order('numero_punto', { ascending: true });

    if (error) throw error;
    return data;
  }
}

export const reglamentoService = new ReglamentoService();