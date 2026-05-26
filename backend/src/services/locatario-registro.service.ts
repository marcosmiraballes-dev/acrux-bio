import { supabase } from '../config/supabase';

interface DetalleRegistro {
  tipo_residuo_id: string;
  kilos: number;
}

export class LocatarioRegistroService {

  async registrarResiduos(usuarioId: string, localId: string, detalles: DetalleRegistro[], sectorId?: string): Promise<any> {
    if (!detalles || detalles.length === 0) {
      throw new Error('Debe incluir al menos un tipo de residuo');
    }

    // Obtener local con plaza
    const { data: local, error: localError } = await supabase
      .from('locales')
      .select('id, nombre, plaza_id, plaza:plazas(id, nombre)')
      .eq('id', localId)
      .single();

    if (localError || !local) {
      throw new Error('Local no encontrado');
    }

    // Calcular total kilos y co2
    const tiposIds = detalles.map(d => d.tipo_residuo_id);
    const { data: tipos } = await supabase
      .from('tipos_residuos')
      .select('id, factor_co2')
      .in('id', tiposIds);

    const factores: Record<string, number> = {};
    tipos?.forEach(t => { factores[t.id] = t.factor_co2; });

    const totalKilos = detalles.reduce((sum, d) => sum + d.kilos, 0);
    const totalCo2 = detalles.reduce((sum, d) => {
      return sum + (d.kilos * (factores[d.tipo_residuo_id] || 0));
    }, 0);

    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0];

    let notaRegistro = 'Autoservicio locatario';
    if (sectorId) {
      const { data: sector } = await supabase
        .from('sectores_local')
        .select('nombre')
        .eq('id', sectorId)
        .single();
      if (sector) notaRegistro = `Autoservicio · ${sector.nombre}`;
    }

    // Crear recolección principal
    const { data: recoleccion, error: recError } = await supabase
      .from('recolecciones')
      .insert({
        usuario_id: usuarioId,
        plaza_id: (local.plaza as any)?.id || local.plaza_id,
        local_id: localId,
        fecha_recoleccion: fecha,
        hora_recoleccion: hora,
        total_kilos: totalKilos,
        co2_evitado: totalCo2,
        notas: notaRegistro,
        sector_id: sectorId || null
      })
      .select()
      .single();

    if (recError || !recoleccion) {
      throw new Error('Error al crear el registro: ' + recError?.message);
    }

    // Crear detalles
    const detallesInsert = detalles.map(d => ({
      recoleccion_id: recoleccion.id,
      tipo_residuo_id: d.tipo_residuo_id,
      kilos: d.kilos,
      co2_evitado: d.kilos * (factores[d.tipo_residuo_id] || 0)
    }));

    const { error: detError } = await supabase
      .from('detalle_recolecciones')
      .insert(detallesInsert);

    if (detError) {
      throw new Error('Error al guardar detalles: ' + detError.message);
    }

    return {
      recoleccion_id: recoleccion.id,
      total_kilos: totalKilos,
      co2_evitado: totalCo2,
      detalles: detalles.length,
      fecha,
      hora
    };
  }

  async getInfoLocal(localId: string): Promise<any> {
    const { data, error } = await supabase
      .from('locales')
      .select('id, nombre, plaza_id, plaza:plazas(id, nombre, ciudad)')
      .eq('id', localId)
      .single();

    if (error || !data) throw new Error('Local no encontrado');
    return data;
  }

  async getTiposResiduos(): Promise<any> {
    const { data, error } = await supabase
      .from('tipos_residuos')
      .select('id, nombre, factor_co2, color_hex')
      .eq('activo', true)
      .order('nombre');

    if (error) throw new Error('Error al obtener tipos de residuos');
    return data;
  }

  async getSectores(localId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('sectores_local')
      .select('id, nombre, icono, orden')
      .eq('local_id', localId)
      .eq('activo', true)
      .order('orden');
    if (error) throw new Error('Error al obtener sectores: ' + error.message);
    return data || [];
  }
}
