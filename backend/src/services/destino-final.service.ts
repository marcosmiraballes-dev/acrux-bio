// backend/src/services/destino-final.service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { CreateDestinoFinalInput, UpdateDestinoFinalInput } from '../schemas/destino-final.schema';

export class DestinoFinalService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Obtener todos los destinos
  async getAll() {
    const { data, error } = await this.supabase
      .from('destinos_finales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener destinos finales: ${error.message}`);
    }

    return data;
  }

  // Obtener solo destinos activos
  async getActive() {
    const { data, error } = await this.supabase
      .from('destinos_finales')
      .select('*')
      .eq('activo', true)
      .order('nombre_destino', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener destinos activos: ${error.message}`);
    }

    return data;
  }

  // Obtener destino por ID
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('destinos_finales')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener destino final: ${error.message}`);
    }

    return data;
  }

  // Crear destino
  async create(destinoData: CreateDestinoFinalInput) {
    const { data, error } = await this.supabase
      .from('destinos_finales')
      .insert([destinoData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear destino final: ${error.message}`);
    }

    return data;
  }

  // Actualizar destino
  async update(id: string, destinoData: UpdateDestinoFinalInput) {
    const { data, error } = await this.supabase
      .from('destinos_finales')
      .update({
        ...destinoData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar destino final: ${error.message}`);
    }

    return data;
  }

  // Toggle activo/inactivo
  async toggleActive(id: string) {
    const destino = await this.getById(id);
    
    return this.update(id, { activo: !destino.activo });
  }

  // Eliminar destino (solo si no está en uso)
  async delete(id: string) {
    // Verificar si el destino está siendo usado en manifiestos
    const { data: manifiestos, error: checkError } = await this.supabase
      .from('manifiestos')
      .select('id')
      .eq('destino_final_id', id)
      .limit(1);

    if (checkError) {
      throw new Error(`Error al verificar uso del destino: ${checkError.message}`);
    }

    if (manifiestos && manifiestos.length > 0) {
      throw new Error('No se puede eliminar el destino porque está siendo usado en manifiestos');
    }

    const { error } = await this.supabase
      .from('destinos_finales')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar destino final: ${error.message}`);
    }

    return true;
  }

  // Contar destinos
  async count() {
    const { count, error } = await this.supabase
      .from('destinos_finales')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Error al contar destinos: ${error.message}`);
    }

    return count || 0;
  }
}