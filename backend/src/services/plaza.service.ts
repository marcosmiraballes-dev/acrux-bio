import { supabase } from '../config/supabase';
import { Plaza } from '../types';

export class PlazaService {
  
  /**
   * Obtener todas las plazas
   */
  async getAll(): Promise<Plaza[]> {
    const { data, error } = await supabase
      .from('plazas')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo plazas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener una plaza por ID
   */
  async getById(id: string): Promise<Plaza | null> {
    const { data, error } = await supabase
      .from('plazas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error obteniendo plaza: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener plazas con conteo de locales
   */
  async getAllWithStats(): Promise<any[]> {
    const { data, error } = await supabase
      .from('plazas')
      .select(`
        *,
        locales:locales(count)
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo plazas con stats: ${error.message}`);
    }

    // Transformar resultado
    return (data || []).map(plaza => ({
      ...plaza,
      total_locales: plaza.locales?.[0]?.count || 0,
      locales: undefined // Remover el objeto anidado
    }));
  }

  /**
   * Crear una nueva plaza
   */
  async create(input: any): Promise<any> {
    const { data, error } = await supabase
      .from('plazas')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando plaza: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar una plaza existente
   */
  async update(id: string, input: any): Promise<any> {
    const { data, error } = await supabase
      .from('plazas')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando plaza: ${error.message}`);
    }

    if (!data) {
      throw new Error('Plaza no encontrada');
    }

    return data;
  }

  /**
   * Eliminar una plaza FÍSICAMENTE de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    // Verificar que no tenga locales asociados
    const { data: locales } = await supabase
      .from('locales')
      .select('id')
      .eq('plaza_id', id)
      .limit(1);

    if (locales && locales.length > 0) {
      throw new Error('No se puede eliminar una plaza con locales asociados. Elimina primero los locales.');
    }

    // Verificar que no tenga recolecciones asociadas
    const { data: recolecciones } = await supabase
      .from('recolecciones')
      .select('id')
      .eq('plaza_id', id)
      .limit(1);

    if (recolecciones && recolecciones.length > 0) {
      throw new Error('No se puede eliminar una plaza con recolecciones asociadas.');
    }

    // ELIMINACIÓN FÍSICA - Borrar completamente de la BD
    const { error } = await supabase
      .from('plazas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error eliminando plaza: ${error.message}`);
    }

    return true;
  }
}