// backend/src/services/vehiculo.service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { CreateVehiculoInput, UpdateVehiculoInput } from '../schemas/vehiculo.schema';

export class VehiculoService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Obtener todos los vehículos
  async getAll() {
    const { data, error } = await this.supabase
      .from('vehiculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener vehículos: ${error.message}`);
    }

    return data;
  }

  // Obtener solo vehículos activos
  async getActive() {
    const { data, error } = await this.supabase
      .from('vehiculos')
      .select('*')
      .eq('activo', true)
      .order('tipo', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener vehículos activos: ${error.message}`);
    }

    return data;
  }

  // Obtener vehículo por ID
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('vehiculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener vehículo: ${error.message}`);
    }

    return data;
  }

  // Crear vehículo
  async create(vehiculoData: CreateVehiculoInput) {
    // Verificar que las placas no estén duplicadas
    const { data: existing } = await this.supabase
      .from('vehiculos')
      .select('id')
      .eq('placas', vehiculoData.placas)
      .single();

    if (existing) {
      throw new Error('Ya existe un vehículo con esas placas');
    }

    const { data, error } = await this.supabase
      .from('vehiculos')
      .insert([vehiculoData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear vehículo: ${error.message}`);
    }

    return data;
  }

  // Actualizar vehículo
  async update(id: string, vehiculoData: UpdateVehiculoInput) {
    // Si se actualizan las placas, verificar que no estén duplicadas
    if (vehiculoData.placas) {
      const { data: existing } = await this.supabase
        .from('vehiculos')
        .select('id')
        .eq('placas', vehiculoData.placas)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error('Ya existe un vehículo con esas placas');
      }
    }

    const { data, error } = await this.supabase
      .from('vehiculos')
      .update({
        ...vehiculoData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar vehículo: ${error.message}`);
    }

    return data;
  }

  // Toggle activo/inactivo
  async toggleActive(id: string) {
    const vehiculo = await this.getById(id);
    
    return this.update(id, { activo: !vehiculo.activo });
  }

  // Eliminar vehículo (solo si no está en uso)
  async delete(id: string) {
    // Verificar si el vehículo está siendo usado en manifiestos
    const { data: manifiestos, error: checkError } = await this.supabase
      .from('manifiestos')
      .select('id')
      .eq('vehiculo_id', id)
      .limit(1);

    if (checkError) {
      throw new Error(`Error al verificar uso del vehículo: ${checkError.message}`);
    }

    if (manifiestos && manifiestos.length > 0) {
      throw new Error('No se puede eliminar el vehículo porque está siendo usado en manifiestos');
    }

    const { error } = await this.supabase
      .from('vehiculos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar vehículo: ${error.message}`);
    }

    return true;
  }

  // Contar vehículos
  async count() {
    const { count, error } = await this.supabase
      .from('vehiculos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Error al contar vehículos: ${error.message}`);
    }

    return count || 0;
  }
}