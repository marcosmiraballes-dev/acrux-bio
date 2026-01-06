// backend/src/services/manifiesto.service.ts

import { supabase } from '../config/supabase';
import { CreateManifiestoInput, UpdateManifiestoInput } from '../schemas/manifiesto.schema';

export class ManifiestoService {
  
  /**
   * Obtener todos los manifiestos con paginación
   */
  async getAll(page: number = 1, limit: number = 50, plazaId?: string, localId?: string) {
    let query = supabase
      .from('manifiestos')
      .select(`
        *,
        local:locales(id, nombre, plaza_id),
        recolector:recolectores(id, nombre)
      `)
      .order('created_at', { ascending: false });

    // Filtros opcionales
    if (localId) {
      query = query.eq('local_id', localId);
    }

    // Paginación
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener manifiestos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtener un manifiesto por ID con residuos del PERIODO
   */
  async getById(id: string) {
    // Obtener manifiesto con snapshots
    const { data, error } = await supabase
      .from('manifiestos')
      .select(`
        *,
        local:locales(id, nombre, plaza_id, giro),
        recolector:recolectores(id, nombre)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener manifiesto: ${error.message}`);
    }

    // ⭐ CARGAR RESIDUOS VALORIZABLES DEL PERIODO
    const residuosValorizables = await this.obtenerResiduosDelPeriodo(
      data.local_id,
      data.fecha_desde,
      data.fecha_hasta
    );

    // Agregar residuos al resultado
    return {
      ...data,
      residuos: residuosValorizables
    };
  }

/**
 * ⭐ NUEVO: Obtener residuos valorizables de un local en un periodo
 * Retorna los 9 tipos con sus kilos (0 si no hubo recolección)
 */
  private async obtenerResiduosDelPeriodo(
    localId: string,
    fechaDesde: string,
    fechaHasta: string
  ) {
    console.log('🔍 PARÁMETROS:', { localId, fechaDesde, fechaHasta });

    // Los 9 tipos valorizables
    const tiposValorizables = [
      'Cartón',
      'Vidrio',
      'PET',
      'Plástico Duro',
      'Playo',
      'Tetra Pak',
      'Aluminio',
      'Chatarra',
      'Archivo'
    ];

    // 1. Obtener IDs de tipos valorizables
    const { data: tipos, error: tiposError } = await supabase
      .from('tipos_residuos')
      .select('id, nombre')
      .in('nombre', tiposValorizables);

    console.log('🔍 TIPOS ENCONTRADOS:', tipos);

    if (tiposError) {
      console.error('❌ Error al obtener tipos:', tiposError);
      return [];
    }

    // 2. Obtener recolecciones del local en el periodo
    const { data: recolecciones, error: recoleccionesError } = await supabase
      .from('recolecciones')
      .select('id')
      .eq('local_id', localId)
      .gte('fecha_recoleccion', fechaDesde)  // ⭐ CORREGIDO
      .lte('fecha_recoleccion', fechaHasta); // ⭐ CORREGIDO

    console.log('🔍 RECOLECCIONES ENCONTRADAS:', recolecciones);
    console.log('🔍 ERROR RECOLECCIONES:', recoleccionesError);

    if (recoleccionesError || !recolecciones || recolecciones.length === 0) {
      console.log('⚠️ No hay recolecciones en el periodo - retornando 0s');
      return tiposValorizables.map(tipo => ({
        tipo: tipo,
        cantidad_kg: 0
      }));
    }

    const recoleccionIds = recolecciones.map(r => r.id);
    console.log('🔍 IDs DE RECOLECCIONES:', recoleccionIds);

    // 3. Obtener detalles de residuos valorizables
    const { data: detalles, error: detallesError } = await supabase
      .from('detalle_recolecciones')
      .select(`
        tipo_residuo_id,
        kilos
      `)
      .in('recoleccion_id', recoleccionIds)
      .in('tipo_residuo_id', tipos.map(t => t.id));

    console.log('🔍 DETALLES ENCONTRADOS:', detalles);
    console.log('🔍 ERROR DETALLES:', detallesError);

    if (detallesError) {
      console.error('❌ Error al obtener detalles:', detallesError);
      return [];
    }

    // 4. Agrupar por tipo y sumar kilos
    const kilosPorTipo: Record<string, number> = {};
    
    detalles?.forEach(detalle => {
      const tipo = tipos.find(t => t.id === detalle.tipo_residuo_id);
      if (tipo) {
        if (!kilosPorTipo[tipo.nombre]) {
          kilosPorTipo[tipo.nombre] = 0;
        }
        kilosPorTipo[tipo.nombre] += detalle.kilos;
      }
    });

    console.log('🔍 KILOS POR TIPO:', kilosPorTipo);

    // 5. Retornar los 9 tipos en orden (con 0 si no hay datos)
    const resultado = tiposValorizables.map(tipo => ({
      tipo: tipo,
      cantidad_kg: kilosPorTipo[tipo] || 0
    }));

    console.log('✅ RESULTADO FINAL:', resultado);

    return resultado;
  }

  /**
   * Obtener manifiestos de un local específico
   */
  async getByLocal(localId: string) {
    const { data, error } = await supabase
      .from('manifiestos')
      .select(`
        *,
        recolector:recolectores(id, nombre)
      `)
      .eq('local_id', localId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener manifiestos del local: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Contar total de manifiestos
   */
  async count() {
    const { count, error } = await supabase
      .from('manifiestos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Error al contar manifiestos: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Crear un nuevo manifiesto con snapshots automáticos
   */
  async create(input: CreateManifiestoInput, userId: string) {
    // ========================================
    // VALIDACIÓN: fecha_hasta >= fecha_desde
    // ========================================
    if (input.fecha_hasta < input.fecha_desde) {
      throw new Error('La fecha hasta debe ser mayor o igual a la fecha desde');
    }

    // ========================================
    // PASO 1: Obtener datos del LOCAL (generador)
    // ========================================
    const { data: local, error: localError } = await supabase
      .from('locales')
      .select('*')
      .eq('id', input.local_id)
      .single();

    if (localError || !local) {
      throw new Error('Local no encontrado');
    }

    // ========================================
    // PASO 2: Obtener datos del RECOLECTOR (chofer)
    // ========================================
    const { data: recolector, error: recolectorError } = await supabase
      .from('recolectores')
      .select('*')
      .eq('id', input.recolector_id)
      .single();

    if (recolectorError || !recolector) {
      throw new Error('Recolector no encontrado');
    }

    // ========================================
    // PASO 3: Obtener datos del VEHÍCULO
    // ========================================
    const { data: vehiculo, error: vehiculoError } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('id', input.vehiculo_id)
      .single();

    if (vehiculoError || !vehiculo) {
      throw new Error('Vehículo no encontrado');
    }

    if (!vehiculo.activo) {
      throw new Error('El vehículo seleccionado está inactivo');
    }

    // ========================================
    // PASO 4: Obtener datos del DESTINO FINAL
    // ========================================
    const { data: destino, error: destinoError } = await supabase
      .from('destinos_finales')
      .select('*')
      .eq('id', input.destino_final_id)
      .single();

    if (destinoError || !destino) {
      throw new Error('Destino final no encontrado');
    }

    if (!destino.activo) {
      throw new Error('El destino final seleccionado está inactivo');
    }

    // ========================================
    // PASO 5: Obtener configuración del sistema (Elefante Verde)
    // ========================================
    const { data: config, error: configError } = await supabase
      .from('configuracion_sistema')
      .select('clave, valor');

    if (configError) {
      throw new Error('Error al obtener configuración del sistema');
    }

    const configMap: Record<string, string> = {};
    config?.forEach((item) => {
      configMap[item.clave] = item.valor || '';
    });

    // ========================================
    // PASO 6: Construir domicilio completo del generador
    // ========================================
    const domicilioPartes = [
      local.direccion,
      local.ciudad,
      local.estado,
      local.codigo_postal ? `C.P. ${local.codigo_postal}` : null,
    ].filter(Boolean);

    const domicilioCompleto = domicilioPartes.join(', ') || 'No especificado';

    // ========================================
    // PASO 7: Generar folio (automático o manual)
    // ========================================
    let folio = input.folio_manual;
    
    if (input.folio_manual) {
      // FOLIO MANUAL: Verificar que esté disponible
      const { data: folioDisponible } = await supabase.rpc(
        'folio_manual_disponible',
        { p_folio: input.folio_manual }
      );

      if (!folioDisponible) {
        throw new Error(`El folio ${input.folio_manual} no está disponible`);
      }

      folio = input.folio_manual;
    } else {
      // FOLIO AUTOMÁTICO: Generar usando plaza_id del local
      const anioActual = new Date().getFullYear();
      
      const { data: folioData, error: folioError } = await supabase.rpc(
        'obtener_proximo_folio',
        { 
          p_plaza_id: local.plaza_id,
          p_anio: anioActual
        }
      );

      if (folioError) {
        throw new Error(`Error al generar folio: ${folioError.message}`);
      }

      folio = folioData;
    }

    // ========================================
    // PASO 8: Crear el manifiesto con TODOS los snapshots
    // ========================================
    const manifiestoData = {
      // Referencias
      local_id: input.local_id,
      recolector_id: input.recolector_id,
      vehiculo_id: input.vehiculo_id,
      destino_final_id: input.destino_final_id,

      // ⭐ PERIODO
      fecha_desde: input.fecha_desde,
      fecha_hasta: input.fecha_hasta,

      // Control
      folio: folio,
      fecha_emision: input.fecha_emision || new Date().toISOString().split('T')[0],

      // SNAPSHOTS DEL GENERADOR (local)
      generador_nombre_comercial: local.nombre,
      generador_razon_social: local.razon_social || local.nombre,
      generador_rfc: local.rfc || 'No especificado',
      generador_domicilio_completo: domicilioCompleto,
      generador_email: local.email || 'No especificado',
      generador_telefono: local.telefono || 'No especificado',
      generador_encargado_entrega: local.encargado_entrega || 'No especificado',

      // SNAPSHOTS DEL RECOLECTOR (Elefante Verde)
      recolector_empresa: configMap.empresa_recolector || 'Arcelin, S.A. de C.V.',
      recolector_domicilio: configMap.domicilio_recolector || 'No especificado',
      recolector_email: configMap.email_recolector || 'direccion@elefantesverdes.com',
      recolector_telefono: configMap.telefono_recolector || '9987449963',
      recolector_registro_sema: configMap.numero_registro_sema || 'PENDIENTE',
      recolector_nombre_chofer: recolector.nombre,

      // SNAPSHOTS DEL VEHÍCULO
      vehiculo_tipo: vehiculo.tipo,
      vehiculo_placas: vehiculo.placas,

      // SNAPSHOTS DEL DESTINO FINAL
      destino_nombre: destino.nombre_destino,
      destino_domicilio: destino.domicilio,
      destino_autorizacion: destino.numero_autorizacion,

      // SNAPSHOT DESTINO (oficio)
      destino_final_oficio: configMap.destino_final_oficio || 'Oficio No. PENDIENTE/2026',

      // Control PDF
      pdf_generado: false,
      pdf_path: null,

      // Auditoría
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('manifiestos')
      .insert(manifiestoData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear manifiesto: ${error.message}`);
    }

    // ========================================
    // PASO 9: Si es folio manual, marcarlo como usado
    // ========================================
    if (input.folio_manual) {
      const { error: updateError } = await supabase
        .from('folios_reservados')
        .update({
          usado: true,
          manifiesto_id: data.id,
          used_at: new Date().toISOString(),
        })
        .eq('folio_manual', input.folio_manual);

      if (updateError) {
        console.error('Error al marcar folio como usado:', updateError);
      }
    }

    return data;
  }

  /**
   * Actualizar manifiesto (solo PDF)
   */
  async update(id: string, input: UpdateManifiestoInput) {
    const { data, error } = await supabase
      .from('manifiestos')
      .update({
        pdf_generado: input.pdf_generado,
        pdf_path: input.pdf_path,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar manifiesto: ${error.message}`);
    }

    return data;
  }

  /**
   * Eliminar manifiesto (solo ADMIN)
   */
  async delete(id: string): Promise<boolean> {
    // Primero obtener el manifiesto para liberar folio si es manual
    const { data: manifiesto } = await supabase
      .from('manifiestos')
      .select('folio')
      .eq('id', id)
      .single();
    
    // Si tiene folio manual, liberarlo
    if (manifiesto && manifiesto.folio && manifiesto.folio.includes('ESP')) {
      const { error: updateError } = await supabase
        .from('folios_reservados')
        .update({
          usado: false,
          manifiesto_id: null,
          used_at: null,
        })
        .eq('folio_manual', manifiesto.folio);

      if (updateError) {
        console.error('Error al liberar folio:', updateError);
      }
    }

    // Eliminar el manifiesto
    const { error } = await supabase
      .from('manifiestos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar manifiesto: ${error.message}`);
    }

    return true;
  }
}

export const manifiestoService = new ManifiestoService();