// backend/src/services/Folio reservado.service.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { CreateFolioReservadoInput, UpdateFolioReservadoInput } from '../schemas/folio-reservado.schema';

export class FolioReservadoService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Obtener todos los folios
  async getAll() {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener folios reservados: ${error.message}`);
    }

    return data;
  }

  // Obtener folios disponibles (no usados) de un mes/año específico
  async getDisponibles(mes: number, anio: number) {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .select('*')
      .eq('usado', false)
      .eq('mes', mes)
      .eq('anio', anio)
      .order('folio_manual', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener folios disponibles: ${error.message}`);
    }

    return data || [];
  }

  // Obtener estadísticas de un mes/año
  async getEstadisticasMes(mes: number, anio: number) {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .select('*')
      .eq('mes', mes)
      .eq('anio', anio);

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    const total = data?.length || 0;
    const usados = data?.filter(f => f.usado).length || 0;
    const disponibles = total - usados;

    return {
      total,
      usados,
      disponibles,
      limite: 10
    };
  }

  // Obtener folio por ID
  async getById(id: string) {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener folio reservado: ${error.message}`);
    }

    return data;
  }

  // Crear folio reservado
  async create(folioData: CreateFolioReservadoInput, userId: string) {
    // Verificar que el folio manual no esté duplicado
    const { data: existing } = await this.supabase
      .from('folios_reservados')
      .select('id')
      .eq('folio_manual', folioData.folio_manual)
      .maybeSingle();

    if (existing) {
      throw new Error('Ya existe un folio con ese número');
    }

    // Extraer año del folio_manual (formato: AmPDC-001-2026)
    const parts = folioData.folio_manual.split('-');
    const anio = parseInt(parts[2]) || new Date().getFullYear();
    const mes = 1; // Default, ya no se usa pero la BD lo requiere

    // Crear el folio
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .insert([{
        folio_manual: folioData.folio_manual,
        plaza_id: folioData.plaza_id,
        mes: mes,
        anio: anio,
        created_by: userId
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear folio reservado: ${error.message}`);
    }

    return data;
  }

  // Actualizar folio
  async update(id: string, folioData: UpdateFolioReservadoInput) {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .update(folioData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar folio reservado: ${error.message}`);
    }

    return data;
  }

  // Marcar folio como usado (se llama desde manifiesto.service)
  async marcarComoUsado(folioManual: string, manifiestoId: string) {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .update({
        usado: true,
        manifiesto_id: manifiestoId,
        used_at: new Date().toISOString()
      })
      .eq('folio_manual', folioManual)
      .eq('usado', false)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al marcar folio como usado: ${error.message}`);
    }

    if (!data) {
      throw new Error('El folio no existe o ya fue utilizado');
    }

    return data;
  }

  // Liberar folio (si se elimina el manifiesto)
  async liberarFolio(manifiestoId: string) {
    const { data, error } = await this.supabase
      .from('folios_reservados')
      .update({
        usado: false,
        manifiesto_id: null,
        used_at: null
      })
      .eq('manifiesto_id', manifiestoId)
      .select();

    if (error) {
      throw new Error(`Error al liberar folio: ${error.message}`);
    }

    return data;
  }

  // Eliminar folio (solo si no está usado)
  async delete(id: string) {
    const folio = await this.getById(id);

    if (folio.usado) {
      throw new Error('No se puede eliminar un folio que ya fue utilizado');
    }

    const { error } = await this.supabase
      .from('folios_reservados')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar folio reservado: ${error.message}`);
    }

    return true;
  }

  // Contar total de folios
  async count() {
    const { count, error } = await this.supabase
      .from('folios_reservados')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Error al contar folios: ${error.message}`);
    }

    return count || 0;
  }
}
