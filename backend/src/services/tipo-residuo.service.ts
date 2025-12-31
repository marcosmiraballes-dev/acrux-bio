import { supabase } from '../config/supabase';

export class TipoResiduoService {
  
  /**
   * Obtener todos los tipos de residuos
   */
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('tipos_residuos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo tipos de residuos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener un tipo de residuo por ID
   */
  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('tipos_residuos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error obteniendo tipo de residuo: ${error.message}`);
    }

    return data;
  }

  /**
   * Crear un nuevo tipo de residuo
   */
  async create(input: any): Promise<any> {
    const { data, error } = await supabase
      .from('tipos_residuos')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando tipo de residuo: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar un tipo de residuo existente
   */
  async update(id: string, input: any): Promise<any> {
    const { data, error } = await supabase
      .from('tipos_residuos')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando tipo de residuo: ${error.message}`);
    }

    if (!data) {
      throw new Error('Tipo de residuo no encontrado');
    }

    return data;
  }

  /**
   * Eliminar un tipo de residuo FÍSICAMENTE de la base de datos
   */
  async delete(id: string): Promise<boolean> {
    // Verificar que no tenga detalles de recolección asociados
    const { data: detalles } = await supabase
      .from('detalle_recolecciones')
      .select('id')
      .eq('tipo_residuo_id', id)
      .limit(1);

    if (detalles && detalles.length > 0) {
      throw new Error('No se puede eliminar un tipo de residuo que tiene recolecciones asociadas.');
    }

    // ELIMINACIÓN FÍSICA - Borrar completamente de la BD
    const { error } = await supabase
      .from('tipos_residuos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error eliminando tipo de residuo: ${error.message}`);
    }

    return true;
  }
}