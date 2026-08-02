import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../config/supabase';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Eres el asistente de análisis de Elefantes Verdes — Estrategias Ambientales, integrado en Acrux-Bio, el sistema de trazabilidad de residuos de la empresa.

Tu rol es ayudar al Director a:
- Analizar datos de reciclaje, CO₂ evitado y recolecciones por plaza y locatario
- Detectar tendencias, comparar períodos y generar insights operativos
- Generar reportes y documentos formales cuando se soliciten
- Responder preguntas sobre el desempeño ambiental del sistema

REGLAS CRÍTICAS:
1. NUNCA inventes números, porcentajes ni datos. Solo usa los datos que recibes de las herramientas.
2. Si no tienes los datos para responder algo, usa la herramienta correspondiente para obtenerlos.
3. Si una pregunta requiere datos que no puedes obtener con las herramientas disponibles, dilo explícitamente.
4. Cuando el Director pida generar un reporte de huella de carbono:
  a) Primero usa get_plazas para obtener los IDs si no los tienes.
  b) Luego usa get_locatarios_plaza para obtener el ID exacto del locatario.
  c) Si hay más de un locatario con nombre similar, PREGUNTA al Director cuál quiere antes de generar.
  d) Solo cuando tengas el ID exacto y confirmado, usa generate_huella_report.
  e) NUNCA intentes generar múltiples reportes en una sola respuesta.
5. Cuando el Director pida manifiestos de un local y no tengas el local_id exacto:
  a) Usa primero get_locatarios_plaza para localizar el ID correcto.
  b) Solo con el local_id confirmado usa get_manifiestos_local.
6. Cuando el Director pida generar una bitácora:
  a) Si hay ambigüedad en el nombre del local, pregunta antes de generar.
  b) NUNCA generes bitácora sin local_id confirmado, fecha_desde y fecha_hasta exactas.
7. NUNCA intentes generar múltiples bitácoras o reportes en una sola respuesta.
8. Responde siempre en español.
9. Sé conciso y directo. El Director es una persona ocupada.
10. Cuando presentes números, usa formato mexicano: 1,234,567.89

Contexto del sistema:
- Elefantes Verdes gestiona residuos reciclables en plazas comerciales de Quintana Roo, México
- Los materiales principales son: Cartón, Orgánico, PET, Playo, Vidrio, Aluminio, Plástico Duro, Archivo, Chatarra, Tetra Pak, Inorgánico
- El Inorgánico va a relleno sanitario — no tiene CO₂ evitado atribuible
- Los factores de CO₂ son de EPA WARM v16 (diciembre 2023)
- Las plazas activas son: Plaza Malecón Cancún, Marina Puerto Cancún, Plaza Las Américas Playa, Plaza Las Américas Cancún, Plaza Mall`;

// ── DEFINICIÓN DE HERRAMIENTAS ────────────────────────────────────────────────
const tools: Anthropic.Tool[] = [
  {
    name: 'get_plazas',
    description: 'Obtiene la lista de todas las plazas activas con sus IDs. Usar cuando necesites conocer las plazas disponibles.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_locatarios_plaza',
    description: 'Obtiene los locatarios de una plaza específica con sus totales de kilos y CO₂ evitado en un período.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plaza_id: { type: 'string', description: 'ID UUID de la plaza' },
        fecha_desde: { type: 'string', description: 'Fecha inicio en formato YYYY-MM-DD' },
        fecha_hasta: { type: 'string', description: 'Fecha fin en formato YYYY-MM-DD' },
      },
      required: ['plaza_id', 'fecha_desde', 'fecha_hasta'],
    },
  },
  {
    name: 'get_huella_locatario',
    description: 'Obtiene el reporte completo de huella de carbono de un locatario específico por año y opcionalmente por mes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        local_id: { type: 'string', description: 'ID UUID del locatario' },
        anio: { type: 'number', description: 'Año del reporte (ej. 2025)' },
        mes: { type: 'number', description: 'Mes opcional (1-12). Si no se especifica, devuelve el año completo.' },
      },
      required: ['local_id', 'anio'],
    },
  },
  {
    name: 'get_huella_plaza',
    description: 'Obtiene el reporte completo de huella de carbono de una plaza por año y opcionalmente por mes. Incluye ranking de locatarios.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plaza_id: { type: 'string', description: 'ID UUID de la plaza' },
        anio: { type: 'number', description: 'Año del reporte (ej. 2025)' },
        mes: { type: 'number', description: 'Mes opcional (1-12). Si no se especifica, devuelve el año completo.' },
      },
      required: ['plaza_id', 'anio'],
    },
  },
  {
    name: 'get_comparacion_periodos',
    description: 'Compara estadísticas de recolección entre dos períodos de tiempo. Útil para analizar tendencias y variaciones.',
    input_schema: {
      type: 'object' as const,
      properties: {
        plaza_id: { type: 'string', description: 'ID UUID de la plaza (opcional)' },
        local_id: { type: 'string', description: 'ID UUID del locatario (opcional)' },
        periodo1_desde: { type: 'string', description: 'Inicio período 1 (YYYY-MM-DD)' },
        periodo1_hasta: { type: 'string', description: 'Fin período 1 (YYYY-MM-DD)' },
        periodo2_desde: { type: 'string', description: 'Inicio período 2 (YYYY-MM-DD)' },
        periodo2_hasta: { type: 'string', description: 'Fin período 2 (YYYY-MM-DD)' },
      },
      required: ['periodo1_desde', 'periodo1_hasta', 'periodo2_desde', 'periodo2_hasta'],
    },
  },
  {
    name: 'get_manifiestos_local',
    description: 'Obtiene los manifiestos de un locatario específico para consulta del Director.',
    input_schema: {
      type: 'object' as const,
      properties: {
        local_id: { type: 'string', description: 'ID UUID del locatario' },
        plaza_id: { type: 'string', description: 'ID UUID de la plaza (opcional)' },
      },
      required: ['local_id'],
    },
  },
  {
    name: 'generate_bitacora_report',
    description: 'Genera y descarga la bitácora de un locatario en Excel. Usar cuando el Director solicite generar bitácora.',
    input_schema: {
      type: 'object' as const,
      properties: {
        local_id: { type: 'string', description: 'ID UUID del locatario' },
        fecha_desde: { type: 'string', description: 'Fecha inicio en formato YYYY-MM-DD' },
        fecha_hasta: { type: 'string', description: 'Fecha fin en formato YYYY-MM-DD' },
      },
      required: ['local_id', 'fecha_desde', 'fecha_hasta'],
    },
  },
  {
    name: 'generate_huella_report',
    description: 'Genera y abre el reporte de huella de carbono en formato HTML. Usar cuando el Director solicite generar o ver un reporte.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tipo: { type: 'string', enum: ['locatario', 'plaza'], description: 'Tipo de reporte' },
        id: { type: 'string', description: 'ID UUID del locatario o plaza' },
        anio: { type: 'number', description: 'Año del reporte' },
        mes: { type: 'number', description: 'Mes opcional (1-12)' },
      },
      required: ['tipo', 'id', 'anio'],
    },
  },
];

import { z } from 'zod';

// ── VALIDACIÓN DE INPUT DE HERRAMIENTAS ────────────────────────────────────────
const TOOL_SCHEMAS: Record<string, z.ZodTypeAny> = {
  get_plazas: z.object({}),
  get_locatarios_plaza: z.object({
    plaza_id: z.string(),
    fecha_desde: z.string(),
    fecha_hasta: z.string(),
  }),
  get_huella_locatario: z.object({
    local_id: z.string(),
    anio: z.number(),
    mes: z.number().optional(),
  }),
  get_huella_plaza: z.object({
    plaza_id: z.string(),
    anio: z.number(),
    mes: z.number().optional(),
  }),
  get_comparacion_periodos: z.object({
    plaza_id: z.string().optional(),
    local_id: z.string().optional(),
    periodo1_desde: z.string(),
    periodo1_hasta: z.string(),
    periodo2_desde: z.string(),
    periodo2_hasta: z.string(),
  }),
  get_manifiestos_local: z.object({
    local_id: z.string(),
    plaza_id: z.string().optional(),
  }),
  generate_bitacora_report: z.object({
    local_id: z.string(),
    fecha_desde: z.string(),
    fecha_hasta: z.string(),
  }),
  generate_huella_report: z.object({
    tipo: z.enum(['locatario', 'plaza']),
    id: z.string(),
    anio: z.number(),
    mes: z.number().optional(),
  }),
};

// ── EJECUTOR DE HERRAMIENTAS ──────────────────────────────────────────────────
async function ejecutarHerramienta(nombre: string, input: any): Promise<string> {
  try {
    const schema = TOOL_SCHEMAS[nombre];
    if (schema) {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        return JSON.stringify({ error: `Input inválido para ${nombre}: ${parsed.error.message}` });
      }
      input = parsed.data;
    }

    switch (nombre) {

      case 'get_plazas': {
        const { data, error } = await supabase
          .from('plazas')
          .select('id, nombre, ciudad, estado')
          .eq('activo', true)
          .order('nombre');
        if (error) throw new Error(error.message);
        return JSON.stringify(data);
      }

      case 'get_locatarios_plaza': {
        const { plaza_id, fecha_desde, fecha_hasta } = input;
        const { data, error } = await supabase
          .from('locales')
          .select(`
            id, nombre, giro,
            recolecciones!inner(total_kilos, co2_evitado, fecha_recoleccion)
          `)
          .eq('plaza_id', plaza_id)
          .gte('recolecciones.fecha_recoleccion', fecha_desde)
          .lte('recolecciones.fecha_recoleccion', fecha_hasta);
        if (error) throw new Error(error.message);

        const resumen = (data || []).map((l: any) => {
          const recs = l.recolecciones || [];
          return {
            id: l.id,
            nombre: l.nombre,
            giro: l.giro,
            recolecciones: recs.length,
            total_kilos: Math.round(recs.reduce((s: number, r: any) => s + parseFloat(r.total_kilos || 0), 0) * 100) / 100,
            co2_evitado: Math.round(recs.reduce((s: number, r: any) => s + parseFloat(r.co2_evitado || 0), 0) * 100) / 100,
          };
        }).sort((a: any, b: any) => b.co2_evitado - a.co2_evitado);

        return JSON.stringify(resumen);
      }

      case 'get_huella_locatario': {
        const { local_id, anio, mes } = input;
        const fechaDesde = mes ? `${anio}-${String(mes).padStart(2,'0')}-01` : `${anio}-01-01`;
        const ultimoDia = mes ? new Date(anio, mes, 0).getDate() : 31;
        const fechaHasta = mes ? `${anio}-${String(mes).padStart(2,'0')}-${ultimoDia}` : `${anio}-12-31`;

        const { data: totales } = await supabase
          .from('recolecciones')
          .select('total_kilos, co2_evitado')
          .eq('local_id', local_id)
          .gte('fecha_recoleccion', fechaDesde)
          .lte('fecha_recoleccion', fechaHasta);

        const { data: local } = await supabase
          .from('locales')
          .select('nombre, giro, plaza:plazas(nombre)')
          .eq('id', local_id)
          .single();

        const totalKilos = (totales || []).reduce((s: number, r: any) => s + parseFloat(r.total_kilos || 0), 0);
        const totalCO2 = (totales || []).reduce((s: number, r: any) => s + parseFloat(r.co2_evitado || 0), 0);

        return JSON.stringify({
          locatario: (local as any)?.nombre,
          giro: (local as any)?.giro,
          plaza: (local as any)?.plaza?.nombre,
          periodo: mes ? `${mes}/${anio}` : `Año ${anio}`,
          total_recolecciones: (totales || []).length,
          total_kilos: Math.round(totalKilos * 100) / 100,
          total_co2_evitado: Math.round(totalCO2 * 100) / 100,
          equivalencias: {
            arboles: Math.round(totalCO2 / 21.77),
            kwh: Math.round(totalCO2 / 0.444),
            km_auto: Math.round(totalCO2 / 0.192),
          }
        });
      }

      case 'get_huella_plaza': {
        const { plaza_id, anio, mes } = input;

        const { data: materialesPlaza } = await supabase
          .rpc('get_huella_plaza_materiales', {
            p_plaza_id: plaza_id,
            p_fecha_desde: mes ? `${anio}-${String(mes).padStart(2,'0')}-01` : `${anio}-01-01`,
            p_fecha_hasta: mes ? `${anio}-${String(mes).padStart(2,'0')}-${new Date(anio, mes, 0).getDate()}` : `${anio}-12-31`,
          });

        const { data: plaza } = await supabase
          .from('plazas')
          .select('nombre, ciudad')
          .eq('id', plaza_id)
          .single();

        const totalCO2 = (materialesPlaza || [])
          .filter((m: any) => m.nombre !== 'Inorgánico')
          .reduce((s: number, m: any) => s + parseFloat(m.total_co2_evitado || 0), 0);

        const totalKilos = (materialesPlaza || [])
          .reduce((s: number, m: any) => s + parseFloat(m.total_kilos || 0), 0);

        return JSON.stringify({
          plaza: (plaza as any)?.nombre,
          ciudad: (plaza as any)?.ciudad,
          periodo: mes ? `${mes}/${anio}` : `Año ${anio}`,
          total_kilos: Math.round(totalKilos * 100) / 100,
          total_co2_evitado: Math.round(totalCO2 * 100) / 100,
          equivalencias: {
            arboles: Math.round(totalCO2 / 21.77),
            kwh: Math.round(totalCO2 / 0.444),
            km_auto: Math.round(totalCO2 / 0.192),
          },
          por_material: (materialesPlaza || []).map((m: any) => ({
            nombre: m.nombre,
            kilos: parseFloat(m.total_kilos),
            co2_evitado: m.nombre === 'Inorgánico' ? 0 : parseFloat(m.total_co2_evitado),
          })),
        });
      }

      case 'get_comparacion_periodos': {
        const { plaza_id, local_id, periodo1_desde, periodo1_hasta, periodo2_desde, periodo2_hasta } = input;
        const { data, error } = await supabase.rpc('comparar_periodos_recolecciones', {
          p_plaza_id: plaza_id || null,
          p_local_id: local_id || null,
          p_periodo1_desde: periodo1_desde,
          p_periodo1_hasta: periodo1_hasta,
          p_periodo2_desde: periodo2_desde,
          p_periodo2_hasta: periodo2_hasta,
        });
        if (error) throw new Error(error.message);
        return JSON.stringify(data);
      }

      case 'get_manifiestos_local': {
        const { local_id, plaza_id } = input;

        const baseUrl = process.env.ASISTENTE_API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const params = new URLSearchParams({ local_id });
        if (plaza_id) params.append('plaza_id', plaza_id);

        const authToken = process.env.ASISTENTE_INTERNAL_TOKEN || process.env.INTERNAL_API_TOKEN;
        const headers: Record<string, string> = {};
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`${baseUrl}/api/manifiestos?${params.toString()}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Error consultando /api/manifiestos: ${response.status} ${response.statusText}`);
        }

        const payload: any = await response.json();
        const manifiestos = Array.isArray(payload?.data) ? payload.data : [];

        const resumen = manifiestos.map((m: any) => {
          const rawSnapshot = m.residuos_snapshot;
          let residuosSnapshot: any[] = [];

          if (Array.isArray(rawSnapshot)) {
            residuosSnapshot = rawSnapshot;
          } else if (typeof rawSnapshot === 'string') {
            try {
              const parsed = JSON.parse(rawSnapshot);
              residuosSnapshot = Array.isArray(parsed) ? parsed : [];
            } catch {
              residuosSnapshot = [];
            }
          }

          const totalKilos = residuosSnapshot.reduce((sum: number, residuo: any) => {
            const cantidad = Number(residuo?.cantidad_kg || 0);
            return sum + (Number.isFinite(cantidad) ? cantidad : 0);
          }, 0);

          return {
            folio: m.folio,
            fecha_emision: m.fecha_emision,
            generador_nombre_comercial: m.generador_nombre_comercial,
            total_kilos: Math.round(totalKilos * 100) / 100,
          };
        });

        return JSON.stringify(resumen);
      }

      case 'generate_bitacora_report': {
        return JSON.stringify({
          action: 'GENERATE_BITACORA',
          local_id: input.local_id,
          fecha_desde: input.fecha_desde,
          fecha_hasta: input.fecha_hasta,
        });
      }

      case 'generate_huella_report': {
        // Esta herramienta le indica al frontend que debe generar el reporte
        // El frontend intercepta esta acción y llama a HuellaCarbonoDirector
        return JSON.stringify({
          action: 'GENERATE_REPORT',
          tipo: input.tipo,
          id: input.id,
          anio: input.anio,
          mes: input.mes || null,
        });
      }

      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${nombre}` });
    }
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' });
  }
}

// ── INTERFAZ DE MENSAJE ───────────────────────────────────────────────────────
export interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────
export async function procesarMensajeDirector(
  mensaje: string,
  historial: MensajeChat[]
): Promise<{ respuesta: string; accion?: any }> {

  // Construir mensajes para la API
  const messages: Anthropic.MessageParam[] = historial.map(m => ({
    role: m.role,
    content: m.content,
  }));

  messages.push({ role: 'user', content: mensaje });

  let accion: any = null;

  // Bucle de tool use — Claude puede llamar múltiples herramientas
  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Si Claude terminó de responder
    if (response.stop_reason === 'end_turn') {
      const texto = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('');
      return { respuesta: texto, accion };
    }

    // Si Claude quiere usar herramientas
    if (response.stop_reason === 'tool_use') {
      // Agregar respuesta de Claude al historial
      messages.push({ role: 'assistant', content: response.content as any });

      const resultados: Anthropic.ToolResultBlockParam[] = [];

      for (const bloque of response.content) {
        if (bloque.type === 'tool_use') {
          console.log(`🔧 Asistente Director usando herramienta: ${bloque.name}`);
          const resultado = await ejecutarHerramienta(bloque.name, bloque.input);

          // Capturar acción de generación de reporte
          try {
            const parsed = JSON.parse(resultado);
            if (parsed.action === 'GENERATE_REPORT' || parsed.action === 'GENERATE_BITACORA') {
              accion = parsed;
            }
          } catch {}

          resultados.push({
            type: 'tool_result',
            tool_use_id: bloque.id,
            content: resultado,
          });
        }
      }

      // Agregar resultados al historial
      messages.push({ role: 'user', content: resultados });
    }
  }
}
