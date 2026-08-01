import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { plazaService } from '../services/plaza.service';

interface Evento {
  id: string;
  tipo_origen: string;
  tipo_nota_manual: string | null;
  descripcion: string;
  created_at: string;
  usuarios: { nombre: string };
}

interface Local {
  id: string;
  nombre: string;
  giro: string;
}

interface Plaza {
  id: string;
  nombre: string;
}

const HistorialLocatario: React.FC = () => {
  const { user } = useAuth();
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [plazaSeleccionada, setPlazaSeleccionada] = useState<string>('');
  const [localSeleccionado, setLocalSeleccionado] = useState<string>('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [error, setError] = useState('');
  const [modalNota, setModalNota] = useState(false);
  const [tipoNota, setTipoNota] = useState('LLAMADA');
  const [textoNota, setTextoNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  useEffect(() => {
    if (user?.id) loadPlazas();
  }, [user]);

  useEffect(() => {
    if (plazaSeleccionada) {
      setLocalSeleccionado('');
      setEventos([]);
      loadLocales(plazaSeleccionada);
    }
  }, [plazaSeleccionada]);

  useEffect(() => {
    if (localSeleccionado) loadHistorial(localSeleccionado);
  }, [localSeleccionado]);

  const loadPlazas = async () => {
    try {
      const todasPlazas: Plaza[] = await plazaService.getAll();
      setPlazas(todasPlazas);

      try {
        const resAlertas = await api.get(`/alertas/coordinador/${user!.id}`);
        const plazasIds = [...new Set((resAlertas.data as any[]).map((a: any) => a.plaza_id))] as string[];
        if (plazasIds.length > 0) {
          setPlazas(todasPlazas.filter(p => plazasIds.includes(p.id)));
        }
      } catch {
        // Si alertas falla, mantenemos todas las plazas para no bloquear la pantalla.
      }
    } catch {
      setError('Error cargando plazas');
    }
  };

  const loadLocales = async (plazaId: string) => {
    try {
      setLoadingLocales(true);
      const res = await api.get(`/locales?plaza_id=${plazaId}`);
      setLocales(res.data?.data || []);
    } catch {
      setError('Error cargando locales');
    } finally {
      setLoadingLocales(false);
    }
  };

  const loadHistorial = async (localId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/historial/${localId}`);
      setEventos(res.data);
    } catch {
      setError('Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  const guardarNota = async () => {
    if (!localSeleccionado || !textoNota.trim() || !user?.id) return;
    try {
      setGuardandoNota(true);
      await api.post('/historial/nota', {
        local_id: localSeleccionado,
        tipo_nota_manual: tipoNota,
        descripcion: textoNota,
        coordinador_id: user.id,
      });
      setModalNota(false);
      setTextoNota('');
      loadHistorial(localSeleccionado);
    } catch {
      setError('Error guardando nota');
    } finally {
      setGuardandoNota(false);
    }
  };

  const iconoTipo = (tipo: string) => {
    const m: Record<string, string> = {
      INFRACCION: '⚠️', ALERTA_CUMPLIMIENTO: '📉', MANIFIESTO: '📄',
      CERTIFICADO: '🏆', ANOMALIA: '🔍', MANUAL: '📝',
    };
    return m[tipo] || '📌';
  };

  const colorFondo = (tipo: string) => {
    const m: Record<string, string> = {
      INFRACCION: '#fef2f2', ALERTA_CUMPLIMIENTO: '#fff7ed',
      MANIFIESTO: '#eff6ff', CERTIFICADO: '#f0fdf4',
      ANOMALIA: '#fdf4ff', MANUAL: '#f9fafb',
    };
    return m[tipo] || '#f9fafb';
  };

  const colorBorde = (tipo: string) => {
    const m: Record<string, string> = {
      INFRACCION: '#fca5a5', ALERTA_CUMPLIMIENTO: '#fed7aa',
      MANIFIESTO: '#bfdbfe', CERTIFICADO: '#bbf7d0',
      ANOMALIA: '#e9d5ff', MANUAL: '#e5e7eb',
    };
    return m[tipo] || '#e5e7eb';
  };

  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const localInfo = locales.find(l => l.id === localSeleccionado);

  const imprimirHistorial = () => {
    const localNombre = localInfo?.nombre || 'Locatario';
    const plazaNombre = plazas.find(p => p.id === plazaSeleccionada)?.nombre || '';
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const colorFondoImp = (tipo: string) => {
      const m: Record<string, string> = {
        INFRACCION: '#fef2f2', ALERTA_CUMPLIMIENTO: '#fff7ed',
        MANIFIESTO: '#eff6ff', CERTIFICADO: '#f0fdf4',
        ANOMALIA: '#fdf4ff', MANUAL: '#f9fafb',
      };
      return m[tipo] || '#f9fafb';
    };

    const colorBordeImp = (tipo: string) => {
      const m: Record<string, string> = {
        INFRACCION: '#fca5a5', ALERTA_CUMPLIMIENTO: '#fed7aa',
        MANIFIESTO: '#bfdbfe', CERTIFICADO: '#bbf7d0',
        ANOMALIA: '#e9d5ff', MANUAL: '#e5e7eb',
      };
      return m[tipo] || '#e5e7eb';
    };

    const iconoImp = (tipo: string) => {
      const m: Record<string, string> = {
        INFRACCION: '⚠️', ALERTA_CUMPLIMIENTO: '📉', MANIFIESTO: '📄',
        CERTIFICADO: '🏆', ANOMALIA: '🔍', MANUAL: '📝',
      };
      return m[tipo] || '📌';
    };

    const eventosHTML = eventos.map(e => `
      <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start">
        <div style="width:32px;height:32px;border-radius:50%;background:${colorFondoImp(e.tipo_origen)};border:2px solid ${colorBordeImp(e.tipo_origen)};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">
          ${iconoImp(e.tipo_origen)}
        </div>
        <div style="flex:1;background:${colorFondoImp(e.tipo_origen)};border:1px solid ${colorBordeImp(e.tipo_origen)};border-radius:8px;padding:10px 14px">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;margin-bottom:4px">
            <span style="font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.05em">
              ${e.tipo_nota_manual || e.tipo_origen.replace(/_/g, ' ')}
            </span>
            <span style="font-size:11px;color:#9ca3af">
              ${new Date(e.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
          <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">${e.descripcion}</p>
          ${e.usuarios?.nombre ? `<div style="font-size:11px;color:#9ca3af;margin-top:4px">Por: ${e.usuarios.nombre}</div>` : ''}
        </div>
      </div>
    `).join('');

    const ventana = window.open('', '_blank');
    if (!ventana) return;

    ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Historial — ${localNombre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; font-size:13px; color:#1a1a1a; padding:40px; }
    .header { border-bottom:3px solid #15803d; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end; }
    .header h1 { font-size:22px; color:#15803d; font-weight:700; }
    .header h2 { font-size:13px; color:#555; font-weight:400; margin-top:4px; }
    .header-right { text-align:right; font-size:11px; color:#888; line-height:1.8; }
    .meta { background:#f0fdf4; border:1px solid #d1fae5; border-radius:8px; padding:12px 16px; margin-bottom:24px; display:flex; gap:24px; flex-wrap:wrap; }
    .meta-item { font-size:12px; color:#374151; }
    .meta-item strong { color:#15803d; display:block; font-size:16px; font-weight:700; }
    .timeline { position:relative; padding-left:8px; }
    .footer { margin-top:32px; border-top:1px solid #d1fae5; padding-top:12px; display:flex; justify-content:space-between; font-size:10px; color:#aaa; }
    @media print { body { padding:20px; } @page { margin:1.5cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Historial de Locatario</h1>
      <h2>${localNombre} · ${plazaNombre}</h2>
    </div>
    <div class="header-right">
      ${fecha}<br/>${hora}<br/>Acrux Bio — Elefantes Verdes
    </div>
  </div>
  <div class="meta">
    <div class="meta-item"><strong>${eventos.length}</strong>Eventos totales</div>
    <div class="meta-item"><strong>${eventos.filter(e => e.tipo_origen === 'INFRACCION').length}</strong>Infracciones</div>
    <div class="meta-item"><strong>${eventos.filter(e => e.tipo_origen === 'ALERTA_CUMPLIMIENTO').length}</strong>Alertas</div>
    <div class="meta-item"><strong>${eventos.filter(e => e.tipo_origen === 'MANUAL').length}</strong>Notas manuales</div>
  </div>
  <div class="timeline">
    ${eventosHTML}
  </div>
  <div class="footer">
    <span>Acrux Bio · Sistema de Trazabilidad Ambiental</span>
    <span>Elefantes Verdes / Estrategias Ambientales · Confidencial</span>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    ventana.document.close();
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Historial de Locatario
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Línea de tiempo de eventos por locatario
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {/* Selectores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '0.375rem', fontWeight: 500 }}>Plaza</label>
          <select value={plazaSeleccionada} onChange={e => setPlazaSeleccionada(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', outline: 'none' }}>
            <option value=''>Seleccionar plaza...</option>
            {plazas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '0.375rem', fontWeight: 500 }}>Locatario</label>
          <select value={localSeleccionado} onChange={e => setLocalSeleccionado(e.target.value)}
            disabled={!plazaSeleccionada || loadingLocales}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', background: !plazaSeleccionada ? '#f9fafb' : '#fff', outline: 'none' }}>
            <option value=''>{loadingLocales ? 'Cargando...' : 'Seleccionar locatario...'}</option>
            {locales.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Info local + botón nota */}
      {localInfo && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{localInfo.nombre}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{localInfo.giro} · {eventos.length} eventos registrados</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={imprimirHistorial}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#15803d', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
              🖨️ Imprimir
            </button>
            <button onClick={() => setModalNota(true)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
              + Agregar nota
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Cargando historial...</div>
      ) : !localSeleccionado ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          Selecciona una plaza y un locatario para ver su historial
        </div>
      ) : eventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          Este locatario no tiene eventos registrados aún
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1rem' }}>
          <div style={{ position: 'absolute', left: '1.75rem', top: 0, bottom: 0, width: '2px', background: '#e5e7eb' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {eventos.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: colorFondo(e.tipo_origen), border: `2px solid ${colorBorde(e.tipo_origen)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0, zIndex: 1 }}>
                  {iconoTipo(e.tipo_origen)}
                </div>
                <div style={{ flex: 1, background: colorFondo(e.tipo_origen), border: `1px solid ${colorBorde(e.tipo_origen)}`, borderRadius: '10px', padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {e.tipo_nota_manual || e.tipo_origen.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{formatFecha(e.created_at)}</span>
                  </div>
                  <p style={{ margin: '0.375rem 0 0', fontSize: '0.875rem', color: '#374151', lineHeight: '1.5' }}>{e.descripcion}</p>
                  {e.usuarios?.nombre && (
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.375rem' }}>Por: {e.usuarios.nombre}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal nota */}
      {modalNota && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
              Nueva nota — {localInfo?.nombre}
            </h3>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '0.375rem', fontWeight: 500 }}>Tipo de nota</label>
              <select value={tipoNota} onChange={e => setTipoNota(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}>
                {['LLAMADA', 'VISITA', 'ACUERDO', 'SEGUIMIENTO_INFRACCION', 'SOLICITUD', 'OTRO'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#374151', marginBottom: '0.375rem', fontWeight: 500 }}>Nota</label>
              <textarea value={textoNota} onChange={e => setTextoNota(e.target.value)}
                placeholder="Describe el contacto o acuerdo con el locatario..."
                rows={4}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalNota(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={guardarNota} disabled={!textoNota.trim() || guardandoNota}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: textoNota.trim() ? '#16a34a' : '#86efac', color: '#fff', cursor: textoNota.trim() ? 'pointer' : 'default' }}>
                {guardandoNota ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialLocatario;
