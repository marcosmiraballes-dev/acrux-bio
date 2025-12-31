import { supabase } from '../config/supabase';

type Recoleccion = any;
type RecoleccionInsert = any;
type RecoleccionUpdate = any;

export class RecoleccionService {
  private tableName = 'recolecciones';

  /**
   * Crear una nueva recolección CON sus detalles
   */
  async create(data: any, usuarioId: string): Promise<Recoleccion> {
    // Separar detalles del resto de datos
    const { detalles, ...recoleccionData } = data;

    // Ajustar fecha para evitar problemas de zona horaria
    let fechaAjustada = recoleccionData.fecha_recoleccion;
    if (typeof fechaAjustada === 'string' && fechaAjustada.includes('T')) {
      fechaAjustada = fechaAjustada.split('T')[0];
    }

    // 1. Crear la recolección (sin detalles)
    const { data: recoleccion, error: createError } = await supabase
      .from(this.tableName)
      .insert({
        ...recoleccionData,
        fecha_recoleccion: fechaAjustada,
        usuario_id: usuarioId
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error al crear recolección: ${createError.message}`);
    }

    // 2. Insertar detalles si existen
    if (detalles && Array.isArray(detalles) && detalles.length > 0) {
      const detallesConId = detalles.map(d => ({
        recoleccion_id: recoleccion.id,
        tipo_residuo_id: d.tipo_residuo_id,
        kilos: d.kilos
      }));

      const { error: insertError } = await supabase
        .from('detalle_recolecciones')
        .insert(detallesConId);

      if (insertError) {
        // Si falla insertar detalles, eliminar la recolección creada
        await supabase.from(this.tableName).delete().eq('id', recoleccion.id);
        throw new Error(`Error al insertar detalles: ${insertError.message}`);
      }
    }

    // 3. Retornar recolección completa con relaciones
    const { data: recoleccionCompleta, error: selectError } = await supabase
      .from(this.tableName)
      .select(`
        *,
        plazas (id, nombre),
        locales (id, nombre),
        usuarios (id, nombre, email),
        detalle_recolecciones (
          id,
          kilos,
          tipo_residuo_id,
          tipos_residuos (id, nombre, color_hex, factor_co2)
        )
      `)
      .eq('id', recoleccion.id)
      .single();

    if (selectError) {
      throw new Error(`Error al obtener recolección creada: ${selectError.message}`);
    }

    return recoleccionCompleta;
  }

  /**
   * Obtener todas las recolecciones con filtros opcionales
   */
  async getAll(filters: any = {}): Promise<{
    data: Recoleccion[];
    count: number;
    limit: number;
    offset: number;
  }> {
    // Extraer limit y offset de filters
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Contar total con filtros (sin limit/offset)
    let countQuery = supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true });

    // Aplicar filtros al count
    if (filters.plazaId) {
      countQuery = countQuery.eq('plaza_id', filters.plazaId);
    }
    if (filters.localId) {
      countQuery = countQuery.eq('local_id', filters.localId);
    }
    if (filters.usuarioId) {
      countQuery = countQuery.eq('usuario_id', filters.usuarioId);
    }
    if (filters.fechaInicio) {
      countQuery = countQuery.gte('fecha_recoleccion', filters.fechaInicio);
    }
    if (filters.fechaFin) {
      countQuery = countQuery.lte('fecha_recoleccion', filters.fechaFin);
    }

    const { count } = await countQuery;

    // Query de datos con paginación
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        plazas (id, nombre),
        locales (id, nombre),
        usuarios (id, nombre, email),
        detalle_recolecciones (
          id,
          kilos,
          tipo_residuo_id,
          tipos_residuos (id, nombre, color_hex)
        )
      `);

    // Aplicar filtros
    if (filters.plazaId) {
      query = query.eq('plaza_id', filters.plazaId);
    }

    if (filters.localId) {
      query = query.eq('local_id', filters.localId);
    }

    if (filters.usuarioId) {
      query = query.eq('usuario_id', filters.usuarioId);
    }

    if (filters.fechaInicio) {
      query = query.gte('fecha_recoleccion', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('fecha_recoleccion', filters.fechaFin);
    }

    // Ordenar, paginar
    query = query
      .order('fecha_recoleccion', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener recolecciones: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      limit,
      offset
    };
  }

  /**
   * Obtener una recolección por ID
   */
  async getById(id: string): Promise<Recoleccion | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        plazas (id, nombre),
        locales (id, nombre),
        usuarios (id, nombre, email),
        detalle_recolecciones (
          id,
          kilos,
          tipo_residuo_id,
          tipos_residuos (id, nombre, color_hex, factor_co2)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener recolección: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualizar una recolección CON sus detalles
   */
  async update(id: string, updateData: any): Promise<Recoleccion> {
    // Separar detalles del resto de datos
    const { detalles, ...recoleccionData } = updateData;

    // Ajustar fecha si viene en el update
    if (recoleccionData.fecha_recoleccion) {
      let fechaAjustada = recoleccionData.fecha_recoleccion;
      if (typeof fechaAjustada === 'string' && fechaAjustada.includes('T')) {
        fechaAjustada = fechaAjustada.split('T')[0];
      }
      recoleccionData.fecha_recoleccion = fechaAjustada;
    }

    // 1. Actualizar datos de la recolección (sin detalles)
    const { data: recoleccion, error: updateError } = await supabase
      .from(this.tableName)
      .update(recoleccionData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar recolección: ${updateError.message}`);
    }

    // 2. Si hay detalles, actualizar la tabla detalle_recolecciones
    if (detalles && Array.isArray(detalles)) {
      // Eliminar detalles existentes
      const { error: deleteError } = await supabase
        .from('detalle_recolecciones')
        .delete()
        .eq('recoleccion_id', id);

      if (deleteError) {
        throw new Error(`Error al eliminar detalles antiguos: ${deleteError.message}`);
      }

      // Insertar nuevos detalles
      const detallesConId = detalles.map(d => ({
        recoleccion_id: id,
        tipo_residuo_id: d.tipo_residuo_id,
        kilos: d.kilos
      }));

      const { error: insertError } = await supabase
        .from('detalle_recolecciones')
        .insert(detallesConId);

      if (insertError) {
        throw new Error(`Error al insertar nuevos detalles: ${insertError.message}`);
      }
    }

    // 3. Retornar recolección actualizada con todas las relaciones
    const { data: recoleccionCompleta, error: selectError } = await supabase
      .from(this.tableName)
      .select(`
        *,
        plazas (id, nombre),
        locales (id, nombre),
        usuarios (id, nombre, email),
        detalle_recolecciones (
          id,
          kilos,
          tipo_residuo_id,
          tipos_residuos (id, nombre, color_hex, factor_co2)
        )
      `)
      .eq('id', id)
      .single();

    if (selectError) {
      throw new Error(`Error al obtener recolección actualizada: ${selectError.message}`);
    }

    return recoleccionCompleta;
  }

  /**
   * Eliminar una recolección
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar recolección: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas generales (SIN arboles_equivalentes)
   */
  async getStats(filters: any = {}): Promise<any> {
    const { data, error } = await supabase.rpc('get_recolecciones_stats', {
      p_plaza_id: filters.plazaId || null,
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null,
      p_fecha_inicio: filters.fechaInicio || null,
      p_fecha_fin: filters.fechaFin || null
    });

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    // Las funciones SQL devuelven un array, tomamos el primer elemento
    if (data && data.length > 0) {
      return data[0];
    }

    return {
      total_recolecciones: 0,
      total_kilos: 0,
      co2_evitado: 0
    };
  }

  /**
   * Obtener estadísticas por tipo de residuo (SIN arboles_equivalentes)
   */
  async getStatsByTipo(filters: any = {}): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_recolecciones_by_tipo', {
      p_plaza_id: filters.plazaId || null,
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null,
      p_fecha_inicio: filters.fechaInicio || null,
      p_fecha_fin: filters.fechaFin || null
    });

    if (error) {
      throw new Error(`Error al obtener estadísticas por tipo: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener recolecciones recientes
   */
  async getRecientes(limit: number = 10, filters: any = {}): Promise<Recoleccion[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        plazas (id, nombre),
        locales (id, nombre),
        usuarios (id, nombre, email)
      `);

    // Aplicar filtros
    if (filters.plazaId) {
      query = query.eq('plaza_id', filters.plazaId);
    }

    if (filters.localId) {
      query = query.eq('local_id', filters.localId);
    }

    if (filters.usuarioId) {
      query = query.eq('usuario_id', filters.usuarioId);
    }

    if (filters.fechaInicio) {
      query = query.gte('fecha_recoleccion', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('fecha_recoleccion', filters.fechaFin);
    }

    query = query
      .order('fecha_recoleccion', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener recolecciones recientes: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Validar que existan las referencias (plaza, local, usuario)
   */
  async validateReferences(data: RecoleccionInsert | RecoleccionUpdate): Promise<void> {
    // Validar plaza
    if (data.plaza_id) {
      const { data: plaza, error: plazaError } = await supabase
        .from('plazas')
        .select('id')
        .eq('id', data.plaza_id)
        .single();

      if (plazaError || !plaza) {
        throw new Error('Plaza no encontrada');
      }
    }

    // Validar local
    if (data.local_id) {
      const { data: local, error: localError } = await supabase
        .from('locales')
        .select('id')
        .eq('id', data.local_id)
        .single();

      if (localError || !local) {
        throw new Error('Local no encontrado');
      }
    }

    // Validar usuario
    if (data.usuario_id) {
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', data.usuario_id)
        .single();

      if (usuarioError || !usuario) {
        throw new Error('Usuario no encontrado');
      }
    }
  }

  /**
   * Obtener recolecciones por rango de fechas
   */
  async getByDateRange(fechaInicio: string, fechaFin: string, filters: any = {}): Promise<Recoleccion[]> {
    const result = await this.getAll({
      ...filters,
      fechaInicio,
      fechaFin
    });
    return result.data;
  }

  /**
   * Obtener recolecciones por plaza
   */
  async getByPlaza(plazaId: string, filters: any = {}): Promise<Recoleccion[]> {
    const result = await this.getAll({
      ...filters,
      plazaId
    });
    return result.data;
  }

  /**
   * Obtener recolecciones por local
   */
  async getByLocal(localId: string, filters: any = {}): Promise<Recoleccion[]> {
    const result = await this.getAll({
      ...filters,
      localId
    });
    return result.data;
  }

  /**
   * Obtener recolecciones por usuario
   */
  async getByUsuario(usuarioId: string, filters: any = {}): Promise<Recoleccion[]> {
    const result = await this.getAll({
      ...filters,
      usuarioId
    });
    return result.data;
  }

  /**
   * Contar recolecciones con filtros
   */
  async count(filters: any = {}): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true });

    // Aplicar filtros
    if (filters.plazaId) {
      query = query.eq('plaza_id', filters.plazaId);
    }

    if (filters.localId) {
      query = query.eq('local_id', filters.localId);
    }

    if (filters.usuarioId) {
      query = query.eq('usuario_id', filters.usuarioId);
    }

    if (filters.fechaInicio) {
      query = query.gte('fecha_recoleccion', filters.fechaInicio);
    }

    if (filters.fechaFin) {
      query = query.lte('fecha_recoleccion', filters.fechaFin);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Error al contar recolecciones: ${error.message}`);
    }

    return count || 0;
  }

  // ========================================================================
  // FUNCIONES PARA DASHBOARD DIRECTOR (SIN arboles_equivalentes)
  // ========================================================================

  /**
   * Obtener tendencia mensual de recolecciones
   */
  async getTendenciaMensual(filters: any = {}): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_recolecciones_tendencia_mensual', {
      p_plaza_id: filters.plazaId || null,
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null,
      p_fecha_inicio: filters.fechaInicio || null,
      p_fecha_fin: filters.fechaFin || null
    });

    if (error) {
      throw new Error(`Error al obtener tendencia mensual: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener comparativa entre plazas
   */
  async getComparativaPlazas(filters: any = {}): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_recolecciones_comparativa_plazas', {
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null,
      p_fecha_inicio: filters.fechaInicio || null,
      p_fecha_fin: filters.fechaFin || null
    });

    if (error) {
      throw new Error(`Error al obtener comparativa de plazas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener top de locales con más recolecciones
   */
  async getTopLocales(filters: any = {}): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_recolecciones_top_locales', {
      p_plaza_id: filters.plazaId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null,
      p_fecha_inicio: filters.fechaInicio || null,
      p_fecha_fin: filters.fechaFin || null,
      p_limit: 10
    });

    if (error) {
      throw new Error(`Error al obtener top de locales: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener comparativa mensual (SIN arboles_equivalentes)
   */
  async getComparativaMensual(filters: any = {}): Promise<any> {
    const { data, error } = await supabase.rpc('get_comparativa_mensual', {
      p_plaza_id: filters.plazaId || null,
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null
    });

    if (error) {
      throw new Error(`Error al obtener comparativa mensual: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        mes_actual_total_recolecciones: 0,
        mes_actual_total_kilos: 0,
        mes_actual_co2_evitado: 0,
        mes_anterior_total_recolecciones: 0,
        mes_anterior_total_kilos: 0,
        mes_anterior_co2_evitado: 0,
        variacion_recolecciones: 0,
        variacion_kilos: 0,
        variacion_co2: 0
      };
    }

    return data[0];
  }

  /**
   * Obtener comparativa anual (SIN arboles_equivalentes)
   */
  async getComparativaAnual(filters: any = {}): Promise<any> {
    const { data, error } = await supabase.rpc('get_comparativa_anual', {
      p_plaza_id: filters.plazaId || null,
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null
    });

    if (error) {
      throw new Error(`Error al obtener comparativa anual: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        anio_actual_total_recolecciones: 0,
        anio_actual_total_kilos: 0,
        anio_actual_co2_evitado: 0,
        anio_anterior_total_recolecciones: 0,
        anio_anterior_total_kilos: 0,
        anio_anterior_co2_evitado: 0,
        variacion_recolecciones: 0,
        variacion_kilos: 0,
        variacion_co2: 0
      };
    }

    return data[0];
  }

  /**
   * Obtener comparativa trimestral (SIN arboles_equivalentes)
   */
  async getComparativaTrimestral(filters: any = {}): Promise<any> {
    const { data, error } = await supabase.rpc('get_comparativa_trimestral', {
      p_plaza_id: filters.plazaId || null,
      p_local_id: filters.localId || null,
      p_tipo_residuo_id: filters.tipoResiduoId || null,
      p_usuario_id: filters.usuarioId || null
    });

    if (error) {
      throw new Error(`Error al obtener comparativa trimestral: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        trimestre_actual_total_recolecciones: 0,
        trimestre_actual_total_kilos: 0,
        trimestre_actual_co2_evitado: 0,
        trimestre_anterior_total_recolecciones: 0,
        trimestre_anterior_total_kilos: 0,
        trimestre_anterior_co2_evitado: 0,
        variacion_recolecciones: 0,
        variacion_kilos: 0,
        variacion_co2: 0
      };
    }

    return data[0];
  }


  // ================================================================
// AGREGAR ESTE MÉTODO AL FINAL de recoleccion.service.ts
// (Después de los métodos existentes, antes del cierre del objeto)
// ================================================================

  // Obtener recolecciones por tipo de residuo (para historial en dashboard cliente)
  async getRecoleccionesPorTipo(
    tipoResiduoId: string,
    filters?: {
      plaza_id?: string;
      local_id?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
      limit?: number;
    }
  ) {
    try {
      // Query base - buscar en detalle_recolecciones
      let query = supabase
        .from('detalle_recolecciones')
        .select(`
          id,
          kilos,
          co2_evitado,
          recoleccion:recolecciones!inner (
            id,
            fecha_recoleccion,
            plaza_id,
            local_id,
            plaza:plazas (nombre),
            local:locales (nombre)
          )
        `)
        .eq('tipo_residuo_id', tipoResiduoId)
        .gt('kilos', 0);

      // Aplicar filtros si existen
      if (filters?.plaza_id) {
        query = query.eq('recoleccion.plaza_id', filters.plaza_id);
      }

      if (filters?.local_id) {
        query = query.eq('recoleccion.local_id', filters.local_id);
      }

      if (filters?.fecha_desde) {
        query = query.gte('recoleccion.fecha_recoleccion', filters.fecha_desde);
      }

      if (filters?.fecha_hasta) {
        query = query.lte('recoleccion.fecha_recoleccion', filters.fecha_hasta);
      }

      // Limitar resultados (default 10)
      const limit = filters?.limit || 10;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Transformar datos y ORDENAR por fecha (más reciente primero)
      const recolecciones = (data?.map((item: any) => ({
        id: item.id,
        fecha_recoleccion: item.recoleccion?.fecha_recoleccion || '',
        kilos: item.kilos,
        co2_evitado: item.co2_evitado,
        plaza_nombre: item.recoleccion?.plaza?.nombre || '',
        local_nombre: item.recoleccion?.local?.nombre || ''
      })) || []).sort((a, b) => {
        // Ordenar por fecha descendente (más reciente primero)
        const fechaA = new Date(a.fecha_recoleccion).getTime();
        const fechaB = new Date(b.fecha_recoleccion).getTime();
        return fechaB - fechaA;
      });

      return {
        success: true,
        data: recolecciones,
        total: recolecciones.length
      };

    } catch (error: any) {
      console.error('Error en getRecoleccionesPorTipo:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }


}

export const recoleccionService = new RecoleccionService();