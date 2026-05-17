// backend/src/services/infraccion.service.ts

import { supabase } from '../config/supabase';
import type { CreateInfraccionInput, UpdateInfraccionInput, ResolverInfraccionInput } from '../schemas/infraccion.schema';

export class InfraccionService {
  // Obtener todas las infracciones con filtros
  async getAll(filters?: {
    plazaId?: string;
    locatarioId?: string;
    tipoAvisoId?: string;
    estatus?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('infracciones')
      .select('*')
      .order('fecha_infraccion', { ascending: false });

    // Filtros directos
    if (filters?.locatarioId) {
      query = query.eq('locatario_id', filters.locatarioId);
    }
    if (filters?.tipoAvisoId) {
      query = query.eq('tipo_aviso_id', filters.tipoAvisoId);
    }
    if (filters?.estatus) {
      query = query.eq('estatus', filters.estatus);
    }

    const fechaDesdeLimpia = filters?.fechaDesde ? filters.fechaDesde.split('T')[0] : null;
    const fechaHastaLimpia = filters?.fechaHasta ? filters.fechaHasta.split('T')[0] : null;

    if (fechaDesdeLimpia) {
      query = query.gte('fecha_infraccion', fechaDesdeLimpia);
    }
    if (fechaHastaLimpia) {
      query = query.lte('fecha_infraccion', fechaHastaLimpia);
    }

    // ⭐ MIGRADO: Filtro de plaza directo via local_id → locales.plaza_id
    if (filters?.plazaId) {
      console.log('🔍 Obteniendo locales de plaza:', filters.plazaId);
      const { data: localesPlaza } = await supabase
        .from('locales')
        .select('id')
        .eq('plaza_id', filters.plazaId);

      const localIds = localesPlaza?.map((l: any) => l.id) || [];
      console.log('✅ Locales de la plaza:', localIds.length);

      if (localIds.length === 0) {
        return [];
      }

      query = query.in('local_id', localIds);
    }

    // Paginación
    if (filters?.limit && filters?.offset !== undefined && filters.offset > 0) {
      const start = filters.offset;
      const end = start + filters.limit - 1;
      query = query.range(start, end);
    } else if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error en query infracciones:', error);
      throw error;
    }

    console.log('✅ Infracciones obtenidas del query:', data?.length || 0);

    if (!data || data.length === 0) {
      return [];
    }

    // ⭐ MIGRADO: Enriquecer via local_id → locales (con fallback a locatarios_infracciones)
    const localIds = [...new Set(data.map((i: any) => i.local_id).filter(Boolean))];
    const locatarioIds = [...new Set(data.map((i: any) => i.locatario_id).filter(Boolean))];

    // Obtener locales directamente
    const { data: locales } = localIds.length > 0
      ? await supabase.from('locales').select('id, nombre, plaza_id').in('id', localIds)
      : { data: [] };

    // Fallback: locatarios_infracciones para registros sin local_id
    const { data: locatarios } = locatarioIds.length > 0
      ? await supabase.from('locatarios_infracciones').select('id, codigo_local, nombre_comercial, plaza_id').in('id', locatarioIds)
      : { data: [] };

    // Obtener plazas
    const plazaIdsSet = new Set([
      ...(locales?.map((l: any) => l.plaza_id) || []),
      ...(locatarios?.map((l: any) => l.plaza_id) || [])
    ]);
    const plazaIds = [...plazaIdsSet];

    const { data: plazas } = plazaIds.length > 0
      ? await supabase.from('plazas').select('id, nombre').in('id', plazaIds)
      : { data: [] };

    // Mapas para lookup rápido
    const localesMap = new Map(locales?.map((l: any) => [l.id, l]) || []);
    const locatariosMap = new Map(locatarios?.map((l: any) => [l.id, l]) || []);
    const plazasMap = new Map(plazas?.map((p: any) => [p.id, p]) || []);

    const result = data.map((infraccion: any) => {
      let locatarioData = null;

      if (infraccion.local_id && localesMap.has(infraccion.local_id)) {
        // ⭐ Camino nuevo: usar local_id → locales
        const local = localesMap.get(infraccion.local_id);
        const plaza = local ? plazasMap.get(local.plaza_id) : null;
        locatarioData = {
          id: infraccion.locatario_id,
          local_id: infraccion.local_id,
          codigo_local: local?.codigo_local || null,
          nombre_comercial: local?.nombre || '',
          plaza_id: local?.plaza_id,
          plaza: plaza ? { id: plaza.id, nombre: plaza.nombre } : null
        };
      } else if (infraccion.locatario_id && locatariosMap.has(infraccion.locatario_id)) {
        // Fallback: camino anterior via locatarios_infracciones
        const locatario = locatariosMap.get(infraccion.locatario_id);
        const plaza = locatario ? plazasMap.get(locatario.plaza_id) : null;
        locatarioData = {
          id: locatario.id,
          codigo_local: locatario.codigo_local,
          nombre_comercial: locatario.nombre_comercial,
          plaza_id: locatario.plaza_id,
          plaza: plaza ? { id: plaza.id, nombre: plaza.nombre } : null
        };
      }

      return {
        ...infraccion,
        locatario: locatarioData,
        reglamento: this.getReglamentoById(infraccion.reglamento_id),
        tipo_aviso: this.getTipoAvisoById(infraccion.tipo_aviso_id)
      };
    });

    console.log('✅ Infracciones finales:', result.length);
    return result;
  }

  // Contar infracciones con filtros
  async count(filters?: {
    plazaId?: string;
    locatarioId?: string;
    tipoAvisoId?: string;
    estatus?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    let query = supabase
      .from('infracciones')
      .select('id', { count: 'exact', head: true });

    if (filters?.locatarioId) {
      query = query.eq('locatario_id', filters.locatarioId);
    }
    if (filters?.tipoAvisoId) {
      query = query.eq('tipo_aviso_id', filters.tipoAvisoId);
    }
    if (filters?.estatus) {
      query = query.eq('estatus', filters.estatus);
    }

    const fechaDesdeLimpia = filters?.fechaDesde ? filters.fechaDesde.split('T')[0] : null;
    const fechaHastaLimpia = filters?.fechaHasta ? filters.fechaHasta.split('T')[0] : null;

    if (fechaDesdeLimpia) {
      query = query.gte('fecha_infraccion', fechaDesdeLimpia);
    }
    if (fechaHastaLimpia) {
      query = query.lte('fecha_infraccion', fechaHastaLimpia);
    }

    // ⭐ MIGRADO: Filtro de plaza directo via locales
    if (filters?.plazaId) {
      console.log('🔍 Contando infracciones de plaza:', filters.plazaId);
      const { data: localesPlaza } = await supabase
        .from('locales')
        .select('id')
        .eq('plaza_id', filters.plazaId);

      const localIds = localesPlaza?.map((l: any) => l.id) || [];

      if (localIds.length === 0) {
        return 0;
      }

      query = query.in('local_id', localIds);
    }

    const { count, error } = await query;

    if (error) {
      console.error('❌ Error contando infracciones:', error);
      throw error;
    }

    console.log('✅ Total count:', count);
    return count || 0;
  }

  // Obtener una infracción por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('infracciones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    let locatarioData = null;

    if (data.local_id) {
      // ⭐ Camino nuevo: local_id → locales
      const { data: local } = await supabase
        .from('locales')
        .select('id, nombre, plaza_id')
        .eq('id', data.local_id)
        .single();

      let plaza = null;
      if (local) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', local.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = {
        id: data.locatario_id,
        local_id: data.local_id,
        nombre_comercial: local?.nombre || '',
        plaza_id: local?.plaza_id,
        plaza: plaza ? { id: plaza.id, nombre: plaza.nombre } : null
      };
    } else if (data.locatario_id) {
      // Fallback: locatarios_infracciones
      const { data: locatario } = await supabase
        .from('locatarios_infracciones')
        .select('id, codigo_local, nombre_comercial, plaza_id')
        .eq('id', data.locatario_id)
        .single();

      let plaza = null;
      if (locatario) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', locatario.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = locatario ? { ...locatario, plaza } : null;
    }

    return {
      ...data,
      locatario: locatarioData,
      reglamento: this.getReglamentoById(data.reglamento_id),
      tipo_aviso: this.getTipoAvisoById(data.tipo_aviso_id)
    };
  }

  // Obtener infracciones de un locatario
  async getByLocatario(locatarioId: string) {
    const { data, error } = await supabase
      .from('infracciones')
      .select('*')
      .eq('locatario_id', locatarioId)
      .order('fecha_infraccion', { ascending: false });

    if (error) throw error;

    return (data || []).map((infraccion: any) => ({
      ...infraccion,
      reglamento: this.getReglamentoById(infraccion.reglamento_id),
      tipo_aviso: this.getTipoAvisoById(infraccion.tipo_aviso_id)
    }));
  }

  // Obtener siguiente número de aviso para un locatario
  async getNextNroAviso(locatarioId: string): Promise<string> {
    const { data } = await supabase
      .from('infracciones')
      .select('nro_aviso')
      .eq('locatario_id', locatarioId)
      .order('nro_aviso', { ascending: false })
      .limit(1)
      .single();

    if (!data || !data.nro_aviso) {
      return 'AV-001';
    }

    const match = data.nro_aviso.match(/AV-(\d+)/);
    if (!match) {
      return 'AV-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `AV-${String(nextNumber).padStart(3, '0')}`;
  }

  // Crear infracción
  async create(input: CreateInfraccionInput, createdBy: string) {
    console.log('📅 FECHA RECIBIDA:', input.fecha_infraccion);

    if (!input.nro_aviso) {
      input.nro_aviso = await this.getNextNroAviso(input.locatario_id);
    }

    if (!input.tipo_aviso_id) {
      const match = input.nro_aviso.match(/AV-(\d+)/);
      const numero = match ? parseInt(match[1], 10) : 1;

      const tipoAvisoMap: { [key: number]: string } = {
        1: 'e5874eff-4e5f-4fed-aee9-1e30fc2ac5b5',
        2: '204a4302-53fb-4ff2-9c8b-420ab3a619c1',
        3: 'e5cae3bb-320d-48ad-b48a-b833fc674be4',
        4: 'ee668e6f-135a-404f-b3f4-765b79e748ca',
        5: 'db2b42cf-d6ae-47f0-9a9a-fd7edfef7006'
      };

      input.tipo_aviso_id = tipoAvisoMap[numero] || tipoAvisoMap[5];
      console.log('🔔 Tipo de aviso auto-asignado:', numero, '→', input.tipo_aviso_id);
    }

    // ⭐ MIGRADO: Resolver local_id desde locatarios_infracciones al crear
    let localId: string | null = null;
    if (input.locatario_id) {
      const { data: li } = await supabase
        .from('locatarios_infracciones')
        .select('local_id')
        .eq('id', input.locatario_id)
        .single();
      localId = li?.local_id || null;
    }

    const fechaLimpia = input.fecha_infraccion.split('T')[0];
    console.log('📅 FECHA LIMPIA:', fechaLimpia);

    const { data, error } = await supabase
      .from('infracciones')
      .insert({
        ...input,
        fecha_infraccion: fechaLimpia,
        local_id: localId,
        created_by: createdBy
      })
      .select('*')
      .single();

    if (error) throw error;

    // Registrar en historial_comunicacion
    try {
      const tipoAviso = this.getTipoAvisoById(data.tipo_aviso_id);
      await supabase.from('historial_comunicacion').insert({
        local_id: data.local_id,
        tipo_origen: 'INFRACCION',
        tipo_nota_manual: null,
        descripcion: `${tipoAviso?.tipo || 'Aviso'} aplicado (${data.nro_aviso}): ${data.descripcion_falta}`,
        coordinador_id: createdBy,
      });
    } catch (historialError) {
      console.error('⚠️ Error registrando infracción en historial:', historialError);
    }

    // Enriquecer respuesta
    let locatarioData = null;

    if (data.local_id) {
      const { data: local } = await supabase
        .from('locales')
        .select('id, nombre, plaza_id')
        .eq('id', data.local_id)
        .single();

      let plaza = null;
      if (local) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', local.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = {
        id: data.locatario_id,
        local_id: data.local_id,
        nombre_comercial: local?.nombre || '',
        plaza_id: local?.plaza_id,
        plaza: plaza ? { id: plaza.id, nombre: plaza.nombre } : null
      };
    } else {
      const { data: locatario } = await supabase
        .from('locatarios_infracciones')
        .select('id, codigo_local, nombre_comercial, plaza_id')
        .eq('id', data.locatario_id)
        .single();

      let plaza = null;
      if (locatario) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', locatario.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = locatario ? { ...locatario, plaza } : null;
    }

    return {
      ...data,
      locatario: locatarioData,
      reglamento: this.getReglamentoById(data.reglamento_id),
      tipo_aviso: this.getTipoAvisoById(data.tipo_aviso_id)
    };
  }

  // Actualizar infracción
  async update(id: string, input: UpdateInfraccionInput) {
    const { data, error } = await supabase
      .from('infracciones')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    let locatarioData = null;

    if (data.local_id) {
      const { data: local } = await supabase
        .from('locales')
        .select('id, nombre, plaza_id')
        .eq('id', data.local_id)
        .single();

      let plaza = null;
      if (local) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', local.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = {
        id: data.locatario_id,
        local_id: data.local_id,
        nombre_comercial: local?.nombre || '',
        plaza_id: local?.plaza_id,
        plaza: plaza ? { id: plaza.id, nombre: plaza.nombre } : null
      };
    } else {
      const { data: locatario } = await supabase
        .from('locatarios_infracciones')
        .select('id, codigo_local, nombre_comercial, plaza_id')
        .eq('id', data.locatario_id)
        .single();

      let plaza = null;
      if (locatario) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', locatario.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = locatario ? { ...locatario, plaza } : null;
    }

    return {
      ...data,
      locatario: locatarioData,
      reglamento: this.getReglamentoById(data.reglamento_id),
      tipo_aviso: this.getTipoAvisoById(data.tipo_aviso_id)
    };
  }

  // Marcar infracción como resuelta
  async resolver(id: string, input: ResolverInfraccionInput, resueltoBy: string) {
    const fechaResolucion = input.resuelto_fecha || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('infracciones')
      .update({
        estatus: 'Resuelto',
        resuelto_fecha: fechaResolucion,
        resuelto_por: resueltoBy,
        notas: input.notas
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Registrar resolución en historial_comunicacion
    try {
      await supabase.from('historial_comunicacion').insert({
        local_id: data.local_id,
        tipo_origen: 'INFRACCION',
        tipo_nota_manual: 'RESOLUCION',
        descripcion: `Infracción resuelta (${data.nro_aviso}): ${input.notas || 'Situación corregida por el locatario.'}`,
        coordinador_id: resueltoBy,
      });
    } catch (historialError) {
      console.error('⚠️ Error registrando resolución en historial:', historialError);
    }

    let locatarioData = null;

    if (data.local_id) {
      const { data: local } = await supabase
        .from('locales')
        .select('id, nombre, plaza_id')
        .eq('id', data.local_id)
        .single();

      let plaza = null;
      if (local) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', local.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = {
        id: data.locatario_id,
        local_id: data.local_id,
        nombre_comercial: local?.nombre || '',
        plaza_id: local?.plaza_id,
        plaza: plaza ? { id: plaza.id, nombre: plaza.nombre } : null
      };
    } else {
      const { data: locatario } = await supabase
        .from('locatarios_infracciones')
        .select('id, codigo_local, nombre_comercial, plaza_id')
        .eq('id', data.locatario_id)
        .single();

      let plaza = null;
      if (locatario) {
        const { data: plazaData } = await supabase
          .from('plazas')
          .select('id, nombre')
          .eq('id', locatario.plaza_id)
          .single();
        plaza = plazaData;
      }

      locatarioData = locatario ? { ...locatario, plaza } : null;
    }

    return {
      ...data,
      locatario: locatarioData,
      reglamento: this.getReglamentoById(data.reglamento_id),
      tipo_aviso: this.getTipoAvisoById(data.tipo_aviso_id)
    };
  }

  // Cancelar infracción
  async cancelar(id: string, notas: string) {
    const { data, error } = await supabase
      .from('infracciones')
      .update({
        estatus: 'Cancelado',
        notas
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar infracción
  async delete(id: string) {
    const { error } = await supabase
      .from('infracciones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Infracción eliminada exitosamente' };
  }

  // Obtener estadísticas
  async getStats(plazaId?: string, fechaDesde?: string, fechaHasta?: string) {
    const { data, error } = await supabase
      .rpc('get_infracciones_stats', {
        p_plaza_id: plazaId || null,
        p_fecha_desde: fechaDesde || null,
        p_fecha_hasta: fechaHasta || null
      });

    if (error) throw error;
    return data;
  }

  // Obtener top locatarios con más infracciones
  async getTopLocatarios(plazaId?: string, limit: number = 10) {
    const { data, error } = await supabase
      .rpc('get_top_locatarios_infracciones', {
        p_plaza_id: plazaId || null,
        p_limit: limit
      });

    if (error) throw error;
    return data;
  }

  private getReglamentoById(id: string | null) {
    if (!id) return null;

    const reglamentosMap: { [key: string]: any } = {
      'd14f6636-b6b6-4190-8d22-9f071b4a39f4': {
        id: 'd14f6636-b6b6-4190-8d22-9f071b4a39f4',
        numero_punto: 'Punto 1',
        descripcion: 'Queda estrictamente prohibido abandonar residuos en pasillos, áreas comunes, estacionamiento, fuera de la camara o sin registrarse.'
      },
      '107ade00-5887-4181-b6a5-512845f533c4': {
        id: '107ade00-5887-4181-b6a5-512845f533c4',
        numero_punto: 'Punto 2',
        descripcion: 'Los residuos solo se entregarán en los horarios establecidos.'
      },
      '8baaf39a-44e7-4261-8e23-e5682c261692': {
        id: '8baaf39a-44e7-4261-8e23-e5682c261692',
        numero_punto: 'Punto 3',
        descripcion: 'Los residuos sólo se aceptarán separados en las siguientes categorías: Orgánicos, Inorgánicos no reciclables, Lata de aluminio, Lata de conserva, Chatarra, Plástico suave tipo 1 - PET, Plástico duro tipo 2 - HDPE, Playo tipo 4 - PEBD, Cartón, Archivo muerto, Tetra pak, Envase multicapa, Aceite vegetal quemado.'
      },
      'a3595a26-87c2-4a6c-8c55-6a0ca2f13c14': {
        id: 'a3595a26-87c2-4a6c-8c55-6a0ca2f13c14',
        numero_punto: 'Punto 4',
        descripcion: 'Condiciones de disposición e identificación del generador.'
      },
      '1d6ce833-9580-4360-a413-25f287be7d77': {
        id: '1d6ce833-9580-4360-a413-25f287be7d77',
        numero_punto: 'Punto 5',
        descripcion: 'Se prohíbe depositar los siguientes residuos en la cámara: manteca o grasa, poda, madera, escombro, Tablaroca, cerámica, vidrio, unicel, electrodomésticos, fierros, muebles, jeringas, medicamentos, ampolletas, baterías/pilas, insecticidas, botes de pintura, aceite de motor, voluminosos, residuos peligrosos.'
      }
    };

    return reglamentosMap[id] || {
      id,
      numero_punto: 'Reglamento',
      descripcion: 'Artículo del reglamento'
    };
  }

  private getTipoAvisoById(id: string | null) {
    if (!id) return null;

    const tiposAvisoMap: { [key: string]: any } = {
      'e5874eff-4e5f-4fed-aee9-1e30fc2ac5b5': { id: 'e5874eff-4e5f-4fed-aee9-1e30fc2ac5b5', tipo: '1er aviso', orden: 1, color_badge: '#F59E0B' },
      '204a4302-53fb-4ff2-9c8b-420ab3a619c1': { id: '204a4302-53fb-4ff2-9c8b-420ab3a619c1', tipo: '2do aviso', orden: 2, color_badge: '#EF4444' },
      'e5cae3bb-320d-48ad-b48a-b833fc674be4': { id: 'e5cae3bb-320d-48ad-b48a-b833fc674be4', tipo: '3er aviso', orden: 3, color_badge: '#DC2626' },
      'ee668e6f-135a-404f-b3f4-765b79e748ca': { id: 'ee668e6f-135a-404f-b3f4-765b79e748ca', tipo: '4to aviso', orden: 4, color_badge: '#991B1B' },
      'db2b42cf-d6ae-47f0-9a9a-fd7edfef7006': { id: 'db2b42cf-d6ae-47f0-9a9a-fd7edfef7006', tipo: '5to aviso', orden: 5, color_badge: '#7F1D1D' },
      'de616fa8-696c-44a6-b9d0-e94a8937df11': { id: 'de616fa8-696c-44a6-b9d0-e94a8937df11', tipo: '6to aviso', orden: 6, color_badge: '#7F1D1D' },
      '5b19efba-f238-44de-8f1a-d1b14c0b042a': { id: '5b19efba-f238-44de-8f1a-d1b14c0b042a', tipo: '7mo aviso', orden: 7, color_badge: '#7F1D1D' },
      'c950b4b9-62d4-4623-a02d-118177666ad4': { id: 'c950b4b9-62d4-4623-a02d-118177666ad4', tipo: '8vo aviso', orden: 8, color_badge: '#7F1D1D' },
      '9ed66536-2bb5-4ea1-bbbc-f5a4500611f2': { id: '9ed66536-2bb5-4ea1-bbbc-f5a4500611f2', tipo: '9no aviso', orden: 9, color_badge: '#7F1D1D' }
    };

    return tiposAvisoMap[id] || {
      id,
      tipo: 'Aviso',
      orden: 1,
      color_badge: '#7F1D1D'
    };
  }
}

export const infraccionService = new InfraccionService();