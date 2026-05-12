import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../config/supabase';

const SYSTEM_PROMPT = `Eres el asistente operativo de Elefantes Verdes — Estrategias Ambientales, integrado en Acrux-Bio.

Tu rol es ayudar al Coordinador a:
- Monitorear el estado operativo de sus plazas y locatarios
- Revisar alertas de cumplimiento y detectar locales problemáticos
- Consultar el historial de comunicación e infracciones de locatarios
- Redactar informes profesionales para elevar al Director

REGLAS CRÍTICAS:
1. NUNCA inventes números, porcentajes ni datos. Solo usa los datos que recibes de las herramientas.
2. Si no tienes los datos para responder algo, usa la herramienta correspondiente para obtenerlos.
3. Si una pregunta requiere datos que no puedes obtener con las herramientas disponibles, dilo explícitamente.
4. Cuando el Coordinador mencione un local por nombre y no tengas su ID:
   a) Usa get_locatarios_plaza para obtener el ID exacto.
   b) Si hay más de un local con nombre similar, PREGUNTA cuál quiere antes de continuar.
5. NUNCA accedas a datos de plazas que no están asignadas al coordinador.
6. Responde siempre en español.
7. Sé directo y operativo. El Coordinador trabaja en campo y necesita respuestas rápidas.
8. Cuando presentes listas de locales, ordénalas por relevancia operativa (peor desempeño primero).
9. Cuando presentes números, usa formato mexicano: 1,234,567.89
10. Cuando el Coordinador pida redactar un informe, genera un texto profesional y formal listo para elevar al Director.

Contexto del sistema:
- Elefantes Verdes gestiona residuos reciclables en plazas comerciales de Quintana Roo, México
- Los materiales principales son: Cartón, Orgánico, PET, Playo, Vidrio, Aluminio, Plástico Duro, Archivo, Chatarra, Tetra Pak, Inorgánico
- El umbral de alerta es caída ≥20% respecto al promedio histórico de los últimos 3 meses
- Las alertas tienen tres estatus: PENDIENTE, REVISADA, INFORMADA
- Las infracciones tienen estatus: ACTIVA, RESUELTA`;

// ── DEFINICIÓN DE HERRAMIENTAS ────────────────────────────────────────────────
const tools: Anthropic.Tool[] = [
  {
    name: 'get_mis_plazas',
    description: 'Obtiene las plazas asignadas al coordinador actual con sus IDs y nombres. Usar siempre como primer paso cuando se necesite una plaza.',
    input_schema: {
      type: 'object' as const,
      properties: {
        coordinador_id: { type: 'string', description: 'ID UUID del coordinador' },
      },
      required: ['coordinador_id'],
    },
  },
  {
    name: 'get_alertas_coordinador',
    description: 'Obtiene las alertas de cumplimiento del coordinador. Puede filtrar por plaza, mes y estatus. Usar para responder preguntas sobre locales con caídas o ausencias.',
    input_schema: {
      type: 'object' as const,
      properties: {
        coordinador_id: { type: 'string', description: 'ID UUID del coordinador' },
        plaza_id: { type: 'string', description: 'ID UUID de la plaza (opcional)' },
        mes: { type: 'string', description: 'Mes en formato YYYY-MM-DD (opcional, ej: 2026-04-01)' },
        estatus: { type: 'string', description: 'Estatus de la alerta: PENDIENTE, REVISADA, INFORMADA (opcional)' },
      },
      required: ['coordinador_id'],
    },
  },
  {
    name: 'get_locatarios_plaza',
    description: 'Obtiene los locatarios de una plaza con sus totales de kilos en un período. Usar para buscar IDs de locales o ver desempeño por plaza.',
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
    name: 'get_historial_local',
    description: 'Obtiene el historial completo de comunicación de un locatario: infracciones aplicadas, alertas elevadas, manifiestos y notas del coordinador.',
    input_schema: {
      type: 'object' as const,
      properties: {
        local_id: { type: 'string', description: 'ID UUID del locatario' },
      },
      required: ['local_id'],
    },
  },
  {
    name: 'get_infracciones_local',
    description: 'Obtiene las infracciones de un locatario específico o de todos los locatarios de una plaza. Incluye estatus, tipo de aviso y fecha.',
    input_schema: {
      type: 'object' as const,
      properties: {
        local_id: { type: 'string', description: 'ID UUID del locatario (opcional si se provee plaza_id)' },
        plaza_id: { type: 'string', description: 'ID UUID de la plaza (opcional, devuelve todas las infracciones de la plaza)' },
        solo_activas: { type: 'boolean', description: 'Si es true, devuelve solo infracciones sin resolver. Por defecto false.' },
      },
      required: [],
    },
  },
  {
    name: 'redactar_informe',
    description: 'Genera un borrador profesional de informe para elevar al Director. Usar cuando el coordinador pida ayuda para redactar un informe sobre un locatario.',
    input_schema: {
      type: 'object' as const,
      properties: {
        local_nombre: { type: 'string', description: 'Nombre del locatario' },
        plaza_nombre: { type: 'string', description: 'Nombre de la plaza' },
        situacion: { type: 'string', description: 'Descripción de la situación operativa del locatario' },
        acciones_tomadas: { type: 'string', description: 'Acciones ya tomadas por el coordinador' },
        kilos_promedio: { type: 'number', description: 'Promedio histórico de kilos del locatario' },
        kilos_mes: { type: 'number', description: 'Kilos reales del mes en alerta' },
        porcentaje_desviacion: { type: 'number', description: 'Porcentaje de caída respecto al promedio' },
      },
      required: ['local_nombre', 'plaza_nombre', 'situacion'],
    },
  },
];

// ── EJECUTOR DE HERRAMIENTAS ──────────────────────────────────────────────────
async function ejecutarHerramienta(nombre: string, input: any, coordinador_id: string): Promise<string> {
  try {
    switch (nombre) {

      case 'get_mis_plazas': {
        const { data, error } = await supabase
          .from('coordinador_plazas')
          .select('plaza_id, plazas(id, nombre, ciudad)')
          .eq('coordinador_id', input.coordinador_id || coordinador_id);
        if (error) throw new Error(error.message);
        const plazas = (data || []).map((cp: any) => cp.plazas);
        return JSON.stringify(plazas);
      }

      case 'get_alertas_coordinador': {
        let query = supabase
          .from('alertas_cumplimiento')
          .select('*, locales(nombre, giro), plazas(nombre)')
          .eq('coordinador_id', input.coordinador_id || coordinador_id)
          .order('porcentaje_desviacion', { ascending: true });

        if (input.plaza_id) query = query.eq('plaza_id', input.plaza_id);
        if (input.mes) query = query.eq('mes_alerta', input.mes);
        if (input.estatus) query = query.eq('estatus', input.estatus);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        const resumen = (data || []).map((a: any) => ({
          id: a.id,
          local: a.locales?.nombre,
          giro: a.locales?.giro,
          plaza: a.plazas?.nombre,
          mes: a.mes_alerta,
          kilos_promedio: a.kilos_promedio_historico,
          kilos_mes: a.kilos_mes_actual,
          desviacion: a.porcentaje_desviacion,
          tipo: a.tipo_alerta,
          estatus: a.estatus,
          informe_generado: a.informe_generado,
        }));

        return JSON.stringify(resumen);
      }

      case 'get_locatarios_plaza': {
        const { plaza_id, fecha_desde, fecha_hasta } = input;
        const { data, error } = await supabase
          .from('locales')
          .select(`id, nombre, giro, activo,
            recolecciones!left(total_kilos, fecha_recoleccion)`)
          .eq('plaza_id', plaza_id)
          .eq('activo', true);
        if (error) throw new Error(error.message);

        const resumen = (data || []).map((l: any) => {
          const recs = (l.recolecciones || []).filter((r: any) =>
            r.fecha_recoleccion >= fecha_desde && r.fecha_recoleccion <= fecha_hasta
          );
          return {
            id: l.id,
            nombre: l.nombre,
            giro: l.giro,
            recolecciones_periodo: recs.length,
            total_kilos_periodo: Math.round(recs.reduce((s: number, r: any) => s + parseFloat(r.total_kilos || 0), 0) * 100) / 100,
          };
        }).sort((a: any, b: any) => a.total_kilos_periodo - b.total_kilos_periodo);

        return JSON.stringify(resumen);
      }

      case 'get_historial_local': {
        const { data, error } = await supabase
          .from('historial_comunicacion')
          .select('tipo_origen, tipo_nota_manual, descripcion, created_at, usuarios!coordinador_id(nombre)')
          .eq('local_id', input.local_id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw new Error(error.message);

        const { data: local } = await supabase
          .from('locales')
          .select('nombre, giro, plazas(nombre)')
          .eq('id', input.local_id)
          .single();

        return JSON.stringify({
          local: (local as any)?.nombre,
          plaza: (local as any)?.plazas?.nombre,
          total_eventos: (data || []).length,
          eventos: (data || []).map((e: any) => ({
            tipo: e.tipo_nota_manual || e.tipo_origen,
            descripcion: e.descripcion,
            fecha: e.created_at,
            coordinador: e.usuarios?.nombre,
          })),
        });
      }

      case 'get_infracciones_local': {
        const { local_id, plaza_id, solo_activas } = input;

        let locatarioIds: string[] = [];

        if (local_id) {
          // Buscar en locatarios_infracciones por nombre_comercial del local
          const { data: localData } = await supabase
            .from('locales')
            .select('nombre')
            .eq('id', local_id)
            .single();

          if (localData) {
            const { data: liData } = await supabase
              .from('locatarios_infracciones')
              .select('id')
              .ilike('nombre_comercial', `%${localData.nombre}%`);
            locatarioIds = (liData || []).map((li: any) => li.id);
          }
        } else if (plaza_id) {
          const { data: liData } = await supabase
            .from('locatarios_infracciones')
            .select('id')
            .eq('plaza_id', plaza_id);
          locatarioIds = (liData || []).map((li: any) => li.id);
        }

        if (locatarioIds.length === 0) {
          return JSON.stringify({ total: 0, infracciones: [], mensaje: 'No se encontraron registros de infracciones para este locatario.' });
        }

        let query = supabase
          .from('infracciones')
          .select(`
            id, nro_aviso, descripcion_falta, estatus,
            fecha_infraccion, resuelto_fecha,
            tipos_aviso!tipo_aviso_id(nombre),
            reglamentos!reglamento_id(nombre)
          `)
          .in('locatario_id', locatarioIds)
          .order('fecha_infraccion', { ascending: false });

        if (solo_activas) query = query.neq('estatus', 'RESUELTA');

        const { data, error } = await query.limit(50);
        if (error) throw new Error(error.message);

        return JSON.stringify({
          total: (data || []).length,
          infracciones: (data || []).map((i: any) => ({
            nro_aviso: i.nro_aviso,
            descripcion: i.descripcion_falta,
            tipo_aviso: i.tipos_aviso?.nombre,
            reglamento: i.reglamentos?.nombre,
            estatus: i.estatus,
            fecha: i.fecha_infraccion,
            resuelto_fecha: i.resuelto_fecha,
          }))
        });
      }

      case 'redactar_informe': {
        const { local_nombre, plaza_nombre, situacion, acciones_tomadas, kilos_promedio, kilos_mes, porcentaje_desviacion } = input;
        const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

        const informe = `INFORME OPERATIVO — ${local_nombre.toUpperCase()}
${plaza_nombre} · ${fecha}

SITUACIÓN DETECTADA:
${situacion}

DATOS DE CUMPLIMIENTO:
${kilos_promedio ? `• Promedio histórico: ${kilos_promedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg` : ''}
${kilos_mes !== undefined ? `• Kilos registrados en el período: ${kilos_mes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} kg` : ''}
${porcentaje_desviacion ? `• Desviación respecto al promedio: ${porcentaje_desviacion.toFixed(1)}%` : ''}

ACCIONES TOMADAS:
${acciones_tomadas || 'Se notifica al Director para determinar acciones a seguir.'}

RECOMENDACIÓN:
Se solicita atención del Director para definir las medidas correspondientes con el locatario.

Coordinador responsable: [Nombre del coordinador]
Fecha de informe: ${fecha}`;

        return JSON.stringify({ informe });
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
export async function procesarMensajeCoordinador(
  mensaje: string,
  historial: MensajeChat[],
  coordinador_id: string
): Promise<{ respuesta: string }> {

  const messages: Anthropic.MessageParam[] = historial.map(m => ({
    role: m.role,
    content: m.content,
  }));

  messages.push({ role: 'user', content: mensaje });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const MODEL = 'claude-sonnet-4-6';

  const SYSTEM_PROMPT_DINAMICO = SYSTEM_PROMPT + `\n\nTU CONTEXTO ACTUAL:\n- coordinador_id: ${coordinador_id}\n- Este es tu ID permanente. SIEMPRE úsalo automáticamente en todas las herramientas sin pedírselo al coordinador.\n- NUNCA pidas el coordinador_id al usuario — ya lo tienes.`;

  while (true) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT_DINAMICO,
      tools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const texto = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as any).text)
        .join('');
      return { respuesta: texto };
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content as any });

      const resultados: Anthropic.ToolResultBlockParam[] = [];

      for (const bloque of response.content) {
        if (bloque.type === 'tool_use') {
          console.log(`🔧 Asistente Coordinador usando herramienta: ${bloque.name}`);
          const resultado = await ejecutarHerramienta(bloque.name, bloque.input, coordinador_id);
          resultados.push({
            type: 'tool_result',
            tool_use_id: bloque.id,
            content: resultado,
          });
        }
      }

      messages.push({ role: 'user', content: resultados });
    }
  }
}
