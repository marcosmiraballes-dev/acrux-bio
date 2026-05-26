import { supabase } from '../config/supabase';

export class LocalService {
  
  /**
   * Obtener todos los locales (opcionalmente filtrado por plaza)
   */
  async getAll(plazaId?: string): Promise<any[]> {
    let query = supabase
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

    // ⭐ FILTRO POR PLAZA (OPCIONAL)
    if (plazaId) {
      console.log('🔍 FILTRANDO LOCALES POR PLAZA:', plazaId);
      query = query.eq('plaza_id', plazaId);
    } else {
      console.log('🔍 OBTENIENDO TODOS LOS LOCALES (sin filtro)');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error obteniendo locales: ${error.message}`);
    }

    console.log('📦 LOCALES ENCONTRADOS:', data?.length || 0);

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
    const { pin_tablet, ...localData } = input;

    const { data, error } = await supabase
      .from('locales')
      .insert(localData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando local: ${error.message}`);
    }

    if (pin_tablet && pin_tablet.trim()) {
      await this.upsertUsuarioLocatario(data.id, data.nombre, pin_tablet.trim());
    }

    return data;
  }

  /**
   * Actualizar un local existente
   */
  async update(id: string, input: any): Promise<any> {
    const { pin_tablet, ...localData } = input;

    const { data, error } = await supabase
      .from('locales')
      .update({
        ...localData,
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

    if (pin_tablet !== undefined) {
      if (pin_tablet.trim()) {
        await this.upsertUsuarioLocatario(id, data.nombre, pin_tablet.trim());
      } else {
        await this.desactivarUsuarioLocatario(id);
      }
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

  /**
   * Obtener locales por plaza CON estadísticas
   */
  async getByPlazaWithStats(plazaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('locales')
      .select(`
        *,
        plazas (
          id,
          nombre
        )
      `)
      .eq('plaza_id', plazaId)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo locales con stats: ${error.message}`);
    }

    return data || [];
  }

  private async upsertUsuarioLocatario(localId: string, nombre: string, pin: string): Promise<void> {
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('local_id', localId)
      .eq('rol', 'LOCATARIO')
      .maybeSingle();

    if (existente) {
      const { error } = await supabase
        .from('usuarios')
        .update({ pin, activo: true, nombre, updated_at: new Date().toISOString() })
        .eq('id', existente.id);
      if (error) throw new Error(`Error actualizando usuario LOCATARIO: ${error.message}`);
    } else {
      const { error } = await supabase
        .from('usuarios')
        .insert({
          nombre,
          email: `local-${localId}@acruxbio.local`,
          password_hash: 'no-aplica',
          rol: 'LOCATARIO',
          activo: true,
          pin,
          local_id: localId
        });
      if (error) {
        throw new Error(`Error creando usuario LOCATARIO: ${error.message}`);
      }
    }
  }

  private async desactivarUsuarioLocatario(localId: string): Promise<void> {
    await supabase
      .from('usuarios')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('local_id', localId)
      .eq('rol', 'LOCATARIO');
  }

  async getPinLocatario(localId: string): Promise<{ pin: string | null }> {
    const { data } = await supabase
      .from('usuarios')
      .select('pin')
      .eq('local_id', localId)
      .eq('rol', 'LOCATARIO')
      .eq('activo', true)
      .maybeSingle();

    return { pin: data?.pin || null };
  }
}