import { supabase } from '../config/supabase';
import type { CreateTipoAvisoDTO, UpdateTipoAvisoDTO } from '../schemas/tipo-aviso.schema';

export class TipoAvisoService {
  // Obtener todos los tipos de aviso
  async getAll() {
    const { data, error } = await supabase
      .from('tipos_aviso')
      .select('*')
      .order('orden', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Obtener un tipo de aviso por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('tipos_aviso')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Crear tipo de aviso
  async create(input: CreateTipoAvisoDTO) {
    // Verificar que no exista el mismo orden
    const { data: existing } = await supabase
      .from('tipos_aviso')
      .select('id')
      .eq('orden', input.orden)
      .single();

    if (existing) {
      throw new Error('Ya existe un tipo de aviso con ese orden');
    }

    const { data, error } = await supabase
      .from('tipos_aviso')
      .insert(input)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar tipo de aviso
  async update(id: string, input: UpdateTipoAvisoDTO) {
    // Si se actualiza el orden, verificar unicidad
    if (input.orden) {
      const { data: existing } = await supabase
        .from('tipos_aviso')
        .select('id')
        .eq('orden', input.orden)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error('Ya existe un tipo de aviso con ese orden');
      }
    }

    const { data, error } = await supabase
      .from('tipos_aviso')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar tipo de aviso (verificar que no tenga infracciones)
  async delete(id: string) {
    // Verificar si tiene infracciones asociadas
    const { data: infracciones } = await supabase
      .from('infracciones')
      .select('id')
      .eq('tipo_aviso_id', id)
      .limit(1);

    if (infracciones && infracciones.length > 0) {
      throw new Error('No se puede eliminar un tipo de aviso con infracciones asociadas.');
    }

    const { error } = await supabase
      .from('tipos_aviso')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Tipo de aviso eliminado exitosamente' };
  }

  // Reordenar tipos de aviso
  async reorder(tiposAviso: { id: string; orden: number }[]) {
    const updates = tiposAviso.map(({ id, orden }) =>
      supabase
        .from('tipos_aviso')
        .update({ orden })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      throw new Error('Error al reordenar tipos de aviso');
    }

    return { message: 'Tipos de aviso reordenados exitosamente' };
  }

  // Obtener tipos de aviso con conteo de infracciones
  async getWithInfraccionesCount() {
    const { data, error } = await supabase
      .from('tipos_aviso')
      .select(`
        *,
        infracciones(count)
      `)
      .order('orden', { ascending: true });

    if (error) throw error;
    return data;
  }
}

export const tipoAvisoService = new TipoAvisoService();