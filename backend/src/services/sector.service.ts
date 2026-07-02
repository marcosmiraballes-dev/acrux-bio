import { supabase } from '../config/supabase';

export class SectorService {

  async getByLocal(localId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('sectores_local')
      .select('*')
      .eq('local_id', localId)
      .order('orden', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo sectores: ${error.message}`);
    }

    return data || [];
  }

  async create(localId: string, input: any): Promise<any> {
    const { data, error } = await supabase
      .from('sectores_local')
      .insert({
        local_id: localId,
        ...input
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando sector: ${error.message}`);
    }

    return data;
  }

  async update(id: string, input: any): Promise<any> {
    const allowedFields: any = {};

    if (input.nombre !== undefined) allowedFields.nombre = input.nombre;
    if (input.icono !== undefined) allowedFields.icono = input.icono;
    if (input.orden !== undefined) allowedFields.orden = input.orden;
    if (input.activo !== undefined) allowedFields.activo = input.activo;

    const { data, error } = await supabase
      .from('sectores_local')
      .update(allowedFields)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error actualizando sector: ${error.message}`);
    }

    if (!data) {
      throw new Error('Sector no encontrado');
    }

    return data;
  }

  async delete(id: string): Promise<boolean> {
    const { data: sector, error: fetchError } = await supabase
      .from('sectores_local')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !sector) {
      throw new Error('Sector no encontrado');
    }

    const { error: updateError } = await supabase
      .from('sectores_local')
      .update({
        activo: false
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Error al desactivar sector: ${updateError.message}`);
    }

    return true;
  }
}
