import { supabase } from '../config/supabase';
import type { CreateLocatarioInfraccionInput, UpdateLocatarioInfraccionInput } from '../schemas/locatario-infraccion.schema';

export class LocatarioInfraccionService {
  // Obtener todos los locatarios de infracciones
  async getAll(plazaId?: string) {
    let query = supabase
      .from('locatarios_infracciones')
      .select(`
        *,
        plaza:plazas(id, nombre)
      `)
      .order('nombre_comercial', { ascending: true });

    if (plazaId) {
      query = query.eq('plaza_id', plazaId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Obtener un locatario por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('locatarios_infracciones')
      .select(`
        *,
        plaza:plazas(id, nombre)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Buscar locatarios por nombre o código
  async search(searchTerm: string, plazaId?: string) {
    let query = supabase
      .from('locatarios_infracciones')
      .select(`
        *,
        plaza:plazas(id, nombre)
      `)
      .or(`nombre_comercial.ilike.%${searchTerm}%,codigo_local.ilike.%${searchTerm}%`);

    if (plazaId) {
      query = query.eq('plaza_id', plazaId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  // Crear locatario de infracciones
  async create(input: CreateLocatarioInfraccionInput) {
    // Verificar que no exista el mismo código en la misma plaza
    const { data: existing } = await supabase
      .from('locatarios_infracciones')
      .select('id')
      .eq('codigo_local', input.codigo_local)
      .eq('plaza_id', input.plaza_id)
      .single();

    if (existing) {
      throw new Error('Ya existe un locatario con ese código en esta plaza');
    }

    const { data, error } = await supabase
      .from('locatarios_infracciones')
      .insert(input)
      .select(`
        *,
        plaza:plazas(id, nombre)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar locatario
  async update(id: string, input: UpdateLocatarioInfraccionInput) {
    // Si se actualiza código o plaza, verificar unicidad
    if (input.codigo_local || input.plaza_id) {
      const locatario = await this.getById(id);
      
      const codigoFinal = input.codigo_local || locatario.codigo_local;
      const plazaFinal = input.plaza_id || locatario.plaza_id;

      const { data: existing } = await supabase
        .from('locatarios_infracciones')
        .select('id')
        .eq('codigo_local', codigoFinal)
        .eq('plaza_id', plazaFinal)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error('Ya existe un locatario con ese código en esta plaza');
      }
    }

    const { data, error } = await supabase
      .from('locatarios_infracciones')
      .update(input)
      .eq('id', id)
      .select(`
        *,
        plaza:plazas(id, nombre)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Desactivar/activar locatario (soft delete)
  async toggleActive(id: string) {
    const locatario = await this.getById(id);
    
    const { data, error } = await supabase
      .from('locatarios_infracciones')
      .update({ activo: !locatario.activo })
      .eq('id', id)
      .select(`
        *,
        plaza:plazas(id, nombre)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar locatario (verificar que no tenga infracciones)
  async delete(id: string) {
    // Verificar si tiene infracciones
    const { data: infracciones } = await supabase
      .from('infracciones')
      .select('id')
      .eq('locatario_id', id)
      .limit(1);

    if (infracciones && infracciones.length > 0) {
      throw new Error('No se puede eliminar un locatario con infracciones. Desactívalo en su lugar.');
    }

    const { error } = await supabase
      .from('locatarios_infracciones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Locatario eliminado exitosamente' };
  }

  // Obtener locatarios con conteo de infracciones
  async getWithInfraccionesCount(plazaId?: string) {
    let query = supabase
      .from('locatarios_infracciones')
      .select(`
        *,
        plaza:plazas(id, nombre),
        infracciones:infracciones(count)
      `)
      .order('nombre_comercial', { ascending: true });

    if (plazaId) {
      query = query.eq('plaza_id', plazaId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }
}

export const locatarioInfraccionService = new LocatarioInfraccionService();