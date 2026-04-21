import { supabase } from '../config/supabase';

const FACTORES_WARM: Record<string, number> = {
  'Aluminio':      10.08,
  'Archivo':        4.41,
  'Cartón':         3.66,
  'Chatarra':       2.04,
  'Orgánico':       0.65,
  'PET':            1.16,
  'Plástico Duro':  0.86,
  'Playo':          0.86,
  'Vidrio':         0.33,
  'Tetra Pak':      0.50,
  'Inorgánico':     0,
};

const ARBOLES_FACTOR = 21.77;
const KWH_FACTOR     = 0.444;
const KM_AUTO_FACTOR = 0.192;

function calcularEquivalencias(co2Kg: number) {
  return {
    arboles:  Math.round(co2Kg / ARBOLES_FACTOR),
    kwh:      Math.round(co2Kg / KWH_FACTOR),
    km_auto:  Math.round(co2Kg / KM_AUTO_FACTOR),
  };
}

export class HuellaCarbononService {

  async getReporteLocatario(local_id: string, anio: number, mes?: number) {
    const fechaDesde = mes ? `${anio}-${String(mes).padStart(2,'0')}-01` : `${anio}-01-01`;
    const ultimoDia = mes ? new Date(anio, mes, 0).getDate() : 31;
    const fechaHasta = mes ? `${anio}-${String(mes).padStart(2,'0')}-${ultimoDia}` : `${anio}-12-31`;

    const { data: local, error: localError } = await supabase
      .from('locales')
      .select('id, nombre, giro, plaza:plazas(nombre, ciudad, estado)')
      .eq('id', local_id)
      .single();

    if (localError || !local) throw new Error('Locatario no encontrado');

    const { data: totales, error: totalesError } = await supabase
      .from('recolecciones')
      .select('total_kilos, co2_evitado')
      .eq('local_id', local_id)
      .gte('fecha_recoleccion', fechaDesde)
      .lte('fecha_recoleccion', fechaHasta);

    if (totalesError) throw new Error(totalesError.message);

    const totalRecolecciones = totales?.length ?? 0;
    const totalKilos = totales?.reduce((s, r) => s + parseFloat(r.total_kilos ?? 0), 0) ?? 0;

    const { data: detalles, error: detError } = await supabase
      .from('detalle_recolecciones')
      .select(`
        kilos,
        co2_evitado,
        tipo_residuo:tipos_residuos(nombre),
        recoleccion:recolecciones!inner(
          local_id,
          fecha_recoleccion
        )
      `)
      .eq('recoleccion.local_id', local_id)
      .gte('recoleccion.fecha_recoleccion', fechaDesde)
      .lte('recoleccion.fecha_recoleccion', fechaHasta);

    if (detError) throw new Error(detError.message);

    const porMaterial: Record<string, { kilos: number; co2_evitado: number; factor: number }> = {};
    const porMes: Record<string, number> = {};

    for (const d of detalles ?? []) {
      const nombre = (d.tipo_residuo as any)?.nombre ?? 'Desconocido';
      const factor = FACTORES_WARM[nombre] ?? 0;
      const esInorganico = nombre === 'Inorgánico';
      const kilos = parseFloat(d.kilos ?? 0);
      // co2_evitado real: para inorgánico siempre 0 (va a relleno sanitario)
      const co2Real = esInorganico ? 0 : parseFloat(d.co2_evitado ?? 0);

      if (!porMaterial[nombre]) porMaterial[nombre] = { kilos: 0, co2_evitado: 0, factor };
      porMaterial[nombre].kilos       += kilos;
      porMaterial[nombre].co2_evitado += co2Real;

      if (!esInorganico) {
        const fecha = (d.recoleccion as any)?.fecha_recoleccion?.substring(0, 7);
        if (fecha) porMes[fecha] = (porMes[fecha] ?? 0) + co2Real;
      }
    }

    const totalCO2 = Object.values(porMaterial)
      .reduce((s, m) => s + m.co2_evitado, 0);

    return {
      locatario: {
        id:     local.id,
        nombre: local.nombre,
        giro:   local.giro,
        plaza:  (local.plaza as any)?.nombre ?? '',
        ciudad: (local.plaza as any)?.ciudad ?? '',
      },
      periodo: { anio, fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
      resumen: {
        total_recolecciones: totalRecolecciones,
        total_kilos:         Math.round(totalKilos * 100) / 100,
        total_co2_evitado:   Math.round(totalCO2 * 100) / 100,
        equivalencias:       calcularEquivalencias(totalCO2),
      },
      por_material: Object.entries(porMaterial)
        .map(([nombre, v]) => ({
          nombre,
          factor_co2:    v.factor,
          kilos:         Math.round(v.kilos * 100) / 100,
          co2_evitado:   Math.round(v.co2_evitado * 100) / 100,
          porcentaje:    totalCO2 > 0 ? Math.round((v.co2_evitado / totalCO2) * 1000) / 10 : 0,
          es_inorganico: nombre === 'Inorgánico',
        }))
        .sort((a, b) => b.co2_evitado - a.co2_evitado),
      tendencia_mensual: Object.entries(porMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, co2]) => ({ mes, co2_evitado: Math.round(co2 * 100) / 100 })),
      metodologia: {
        fuente_factores: 'EPA Waste Reduction Model (WARM) v16 — diciembre 2023',
        fuente_arboles:  'EPA GHG Equivalencies Calculator — 21.77 kg CO₂/árbol/año',
        fuente_kwh:      'SEMARNAT/RENE — Sistema Eléctrico Nacional 2025 — 0.444 kg CO₂/kWh',
        fuente_km:       'IPCC 2006 Guidelines / INECC — 0.192 kg CO₂/km',
        nota_inorganico: 'Residuo inorgánico gestionado en sitio autorizado. Sin CO₂ evitado atribuible.',
      },
    };
  }

  async getReportePlaza(plaza_id: string, anio: number, mes?: number) {
    const fechaDesde = mes ? `${anio}-${String(mes).padStart(2,'0')}-01` : `${anio}-01-01`;
    const ultimoDia = mes ? new Date(anio, mes, 0).getDate() : 31;
    const fechaHasta = mes ? `${anio}-${String(mes).padStart(2,'0')}-${ultimoDia}` : `${anio}-12-31`;

    const { data: plaza, error: plazaError } = await supabase
      .from('plazas')
      .select('id, nombre, ciudad, estado, direccion')
      .eq('id', plaza_id)
      .single();

    if (plazaError || !plaza) throw new Error('Plaza no encontrada');

    const { data: locatarios, error: locError } = await supabase
      .from('locales')
      .select(`
        id, nombre, giro,
        recolecciones!inner(
          total_kilos,
          co2_evitado,
          fecha_recoleccion
        )
      `)
      .eq('plaza_id', plaza_id)
      .gte('recolecciones.fecha_recoleccion', fechaDesde)
      .lte('recolecciones.fecha_recoleccion', fechaHasta);

    if (locError) throw new Error(locError.message);

    const rankingMap: Record<string, {
      nombre: string; giro: string;
      recolecciones: number; kilos: number; co2: number;
    }> = {};

    for (const l of locatarios ?? []) {
      const recs = (l.recolecciones as any[]) ?? [];
      rankingMap[l.id] = {
        nombre:        l.nombre,
        giro:          l.giro ?? '',
        recolecciones: recs.length,
        kilos:         recs.reduce((s: number, r: any) => s + parseFloat(r.total_kilos ?? 0), 0),
        co2:           recs.reduce((s: number, r: any) => s + parseFloat(r.co2_evitado ?? 0), 0),
      };
    }

    const ranking = Object.values(rankingMap)
      .sort((a, b) => b.co2 - a.co2)
      .map((l, i) => ({
        posicion:      i + 1,
        nombre:        l.nombre,
        giro:          l.giro,
        recolecciones: l.recolecciones,
        total_kilos:   Math.round(l.kilos * 100) / 100,
        co2_evitado:   Math.round(l.co2 * 100) / 100,
      }));

    // Materiales por plaza — función SQL con índices optimizados
    const { data: materialesPlaza, error: matError } = await supabase
      .rpc('get_huella_plaza_materiales', {
        p_plaza_id: plaza_id,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      });

    if (matError) throw new Error(matError.message);

    // Tendencia mensual — función SQL con índices optimizados
    const { data: mensualPlaza, error: menPlazaError } = await supabase
      .rpc('get_huella_plaza_mensual', {
        p_plaza_id: plaza_id,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta
      });

    if (menPlazaError) throw new Error(menPlazaError.message);

    const porMaterial: Record<string, { kilos: number; co2_evitado: number; factor: number }> = {};

    for (const m of materialesPlaza ?? []) {
      const nombre = m.nombre;
      const factor = FACTORES_WARM[nombre] ?? 0;
      const esInorganico = nombre === 'Inorgánico';
      porMaterial[nombre] = {
        kilos:       parseFloat(m.total_kilos ?? 0),
        co2_evitado: esInorganico ? 0 : parseFloat(m.total_co2_evitado ?? 0),
        factor,
      };
    }

    const totalCO2   = Object.values(porMaterial)
      .filter(m => m.factor > 0)
      .reduce((s, m) => s + m.co2_evitado, 0);
    const totalKilos = Object.values(porMaterial).reduce((s, m) => s + m.kilos, 0);
    const totalRecs  = ranking.reduce((s, l) => s + l.recolecciones, 0);

    return {
      plaza: {
        id:        plaza.id,
        nombre:    plaza.nombre,
        ciudad:    plaza.ciudad,
        estado:    plaza.estado,
        direccion: plaza.direccion,
      },
      periodo: { anio, fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
      resumen: {
        total_locatarios:    ranking.length,
        total_recolecciones: totalRecs,
        total_kilos:         Math.round(totalKilos * 100) / 100,
        total_co2_evitado:   Math.round(totalCO2 * 100) / 100,
        equivalencias:       calcularEquivalencias(totalCO2),
      },
      ranking_locatarios: ranking,
      por_material: Object.entries(porMaterial)
        .map(([nombre, v]) => ({
          nombre,
          factor_co2:    v.factor,
          kilos:         Math.round(v.kilos * 100) / 100,
          co2_evitado:   Math.round(v.co2_evitado * 100) / 100,
          porcentaje:    totalCO2 > 0 ? Math.round((v.co2_evitado / totalCO2) * 1000) / 10 : 0,
          es_inorganico: nombre === 'Inorgánico',
        }))
        .sort((a, b) => b.co2_evitado - a.co2_evitado),
      tendencia_mensual: (mensualPlaza ?? []).map((m: { mes: string; co2_evitado: string }) => ({
        mes:         m.mes,
        co2_evitado: parseFloat(m.co2_evitado ?? 0),
      })),
      metodologia: {
        fuente_factores: 'EPA Waste Reduction Model (WARM) v16 — diciembre 2023',
        fuente_arboles:  'EPA GHG Equivalencies Calculator — 21.77 kg CO₂/árbol/año',
        fuente_kwh:      'SEMARNAT/RENE — Sistema Eléctrico Nacional 2025 — 0.444 kg CO₂/kWh',
        fuente_km:       'IPCC 2006 Guidelines / INECC — 0.192 kg CO₂/km',
        nota_inorganico: 'Residuo inorgánico gestionado en sitio autorizado. Sin CO₂ evitado atribuible.',
      },
    };
  }
}

export const huellaCarbonoService = new HuellaCarbononService();
