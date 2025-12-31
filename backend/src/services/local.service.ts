import { supabase } from '../config/supabase';

export class LocalService {
  
  /**
   * Obtener todos los locales
   */
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('locales')
      .select(`
        *,
        plazas (
          id,
          nombre
        )
      `)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo locales: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener un local por ID
   */
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('locales')
      .select(`
        *,
        plazas (
          id,
          nombre
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error obteniendo local: ${error.message}`);
    }

    return data;
  }

  /**
   * Crear un nuevo local
   */
  async create(input: any): Promise<any> {
    const { data, error } = await supabase
      .from('locales')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando local: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar un local existente
   */
  async update(id: string, input: any): Promise<any> {
    const { data, error } = await supabase
      .from('locales')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando local: ${error.message}`);
    }

    if (!data) {
      throw new Error('Local no encontrado');
    }

    return data;
  }

  /**
   * Eliminar un local FÍSICAMENTE de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    // Verificar que no tenga recolecciones asociadas
    const { data: recolecciones } = await supabase
      .from('recolecciones')
      .select('id')
      .eq('local_id', id)
      .limit(1);

    if (recolecciones && recolecciones.length > 0) {
      throw new Error('No se puede eliminar un local con recolecciones asociadas.');
    }

    // ELIMINACIÓN FÍSICA - Borrar completamente de la BD
    const { error } = await supabase
      .from('locales')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error eliminando local: ${error.message}`);
    }

    return true;
  }

  /**
   * Obtener locales por plaza
   */
  async getByPlaza(plazaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('locales')
      .select('*')
      .eq('plaza_id', plazaId)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo locales por plaza: ${error.message}`);
    }

    return data || [];
  }
}