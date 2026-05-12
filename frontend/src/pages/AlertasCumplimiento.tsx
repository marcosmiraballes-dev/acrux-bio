import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Alerta {
  id: string;
  local_id: string;
  plaza_id: string;
  mes_alerta: string;
  kilos_promedio_historico: number;
  kilos_mes_actual: number;
  porcentaje_desviacion: number;
  tipo_alerta: 'CAIDA' | 'AUSENCIA_TOTAL';
  estatus: 'PENDIENTE' | 'REVISADA' | 'INFORMADA';
  nota_coordinador: string | null;
  informe_generado: boolean;
  informe_fecha: string | null;
  locales: { nombre: string; giro: string };
  plazas: { nombre: string };
}

interface Tendencia {
  tendencia: { mes: string; kilos: number }[];
  alertas_anteriores: number;
}

const MESES = [
  { valor: '2026-05-01', label: 'Mayo 2026' },
  { valor: '2026-04-01', label: 'Abril 2026' },
  { valor: '2026-03-01', label: 'Marzo 2026' },
  { valor: '2026-02-01', label: 'Febrero 2026' },
  { valor: '2026-01-01', label: 'Enero 2026' },
  { valor: '2025-12-01', label: 'Diciembre 2025' },
];

const AlertasCumplimiento: React.FC = () => {
  const { user } = useAuth();
  const [todasAlertas, setTodasAlertas] = useState<Alerta[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [plazas, setPlazas] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('');
  const [filtroPlaza, setFiltroPlaza] = useState<string>('');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('2026-04-01');
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [notaInforme, setNotaInforme] = useState('');
  const [enviandoInforme, setEnviandoInforme] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tendencias, setTendencias] = useState<Record<string, Tendencia>>({});
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadAlertas();
  }, [user, mesSeleccionado]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroEstatus, filtroPlaza, todasAlertas]);

  const loadAlertas = async () => {
    try {
      setLoading(true);
      setTendencias({});
      setExpandido(null);
      const res = await api.get(`/alertas/coordinador/${user!.id}?mes=${mesSeleccionado}`);
      const data: Alerta[] = res.data;
      setTodasAlertas(data);
      const plazasMap = new Map<string, string>();
      data.forEach(a => {
        if (a.plaza_id && a.plazas?.nombre) plazasMap.set(a.plaza_id, a.plazas.nombre);
      });
      setPlazas(Array.from(plazasMap.entries()).map(([id, nombre]) => ({ id, nombre })));
    } catch {
      setError('Error cargando alertas');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtradas = [...todasAlertas];
    if (filtroPlaza) filtradas = filtradas.filter(a => a.plaza_id === filtroPlaza);
    if (filtroEstatus) filtradas = filtradas.filter(a => a.estatus === filtroEstatus);
    setAlertas(filtradas);
  };

  const loadTendencia = useCallback(async (alerta: Alerta) => {
    if (tendencias[alerta.local_id]) {
      setExpandido(expandido === alerta.id ? null : alerta.id);
      return;
    }
    try {
      const res = await api.get(`/alertas/tendencia/${alerta.local_id}?mes_alerta=${alerta.mes_alerta}`);
      setTendencias(prev => ({ ...prev, [alerta.local_id]: res.data }));
      setExpandido(alerta.id);
    } catch {
      setError('Error cargando tendencia');
    }
  }, [tendencias, expandido]);

  const marcarRevisada = async (alerta: Alerta) => {
    if (alerta.estatus !== 'PENDIENTE') return;
    try {
      await api.patch(`/alertas/${alerta.id}`, { estatus: 'REVISADA' });
      loadAlertas();
    } catch {
      setError('Error actualizando alerta');
    }
  };

  const abrirModalInforme = (alerta: Alerta) => {
    setAlertaSeleccionada(alerta);
    setNotaInforme('');
    setModalAbierto(true);
  };

  const enviarInforme = async () => {
    if (!alertaSeleccionada || !notaInforme.trim()) return;
    try {
      setEnviandoInforme(true);
      await api.post(`/alertas/${alertaSeleccionada.id}/informe`, { nota: notaInforme });
      setModalAbierto(false);
      loadAlertas();
    } catch {
      setError('Error enviando informe');
    } finally {
      setEnviandoInforme(false);
    }
  };

  const formatMes = (fecha: string) => {
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const formatMesCorto = (mesStr: string) => {
    const [anio, mes] = mesStr.split('-');
    const nombres = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${nombres[parseInt(mes)]} ${anio}`;
  };

  const colorEstatus = (estatus: string) => {
    if (estatus === 'PENDIENTE') return '#dc2626';
    if (estatus === 'REVISADA') return '#d97706';
    return '#16a34a';
  };

  const colorDesviacion = (pct: number) => {
    if (pct <= -80) return '#dc2626';
    if (pct <= -50) return '#d97706';
    return '#ca8a04';
  };

  const pendientes = alertas.filter(a => a.estatus === 'PENDIENTE').length;
  const ausencias = alertas.filter(a => a.tipo_alerta === 'AUSENCIA_TOTAL').length;

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Cargando alertas...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Alertas de Cumplimiento
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Locatarios con caída ≥20% respecto a su promedio histórico
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Alertas visibles', valor: alertas.length, color: '#1d4ed8' },
          { label: 'Pendientes', valor: pendientes, color: '#dc2626' },
          { label: 'Ausencia total', valor: ausencias, color: '#7c3aed' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: k.color }}>{k.valor}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Mes</label>
          <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', background: '#fff', outline: 'none', minWidth: '160px' }}>
            {MESES.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Plaza</label>
          <select value={filtroPlaza} onChange={e => setFiltroPlaza(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.8rem', background: '#fff', outline: 'none', minWidth: '200px' }}>
            <option value=''>Todas las plazas</option>
            {plazas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.75rem', color: '#6b7280' }}>Estatus:</label>
          {['', 'PENDIENTE', 'REVISADA', 'INFORMADA'].map(e => (
            <button key={e} onClick={() => setFiltroEstatus(e)}
              style={{ padding: '0.375rem 0.875rem', borderRadius: '6px', border: '1px solid', fontSize: '0.8rem', cursor: 'pointer',
                borderColor: filtroEstatus === e ? '#1d4ed8' : '#d1d5db',
                background: filtroEstatus === e ? '#1d4ed8' : '#fff',
                color: filtroEstatus === e ? '#fff' : '#374151' }}>
              {e === '' ? 'Todas' : e}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {alertas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          No hay alertas para {formatMes(mesSeleccionado)} con los filtros seleccionados.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alertas.map(a => {
            const tend = tendencias[a.local_id];
            const isExp = expandido === a.id;
            return (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>
                        {a.locales?.nombre || 'Local desconocido'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                        {a.plazas?.nombre} · {a.locales?.giro} · {formatMes(a.mes_alerta)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
                        background: a.tipo_alerta === 'AUSENCIA_TOTAL' ? '#fdf4ff' : '#fef2f2',
                        color: a.tipo_alerta === 'AUSENCIA_TOTAL' ? '#7c3aed' : '#dc2626',
                        border: `1px solid ${a.tipo_alerta === 'AUSENCIA_TOTAL' ? '#e9d5ff' : '#fca5a5'}` }}>
                        {a.tipo_alerta === 'AUSENCIA_TOTAL' ? 'Sin actividad' : 'Caída'}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#f9fafb', color: colorEstatus(a.estatus), border: '1px solid #e5e7eb', fontWeight: 600 }}>
                        {a.estatus}
                      </span>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.875rem' }}>
                    {[
                      { label: 'Promedio histórico', valor: `${a.kilos_promedio_historico.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg` },
                      { label: 'Kilos en el mes', valor: `${a.kilos_mes_actual.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg` },
                      { label: 'Desviación', valor: `${a.porcentaje_desviacion.toFixed(1)}%`, color: colorDesviacion(a.porcentaje_desviacion) },
                    ].map(m => (
                      <div key={m.label} style={{ background: '#f9fafb', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{m.label}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: m.color || '#111827' }}>{m.valor}</div>
                      </div>
                    ))}
                  </div>

                  {/* Botón tendencia */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <button onClick={() => loadTendencia(a)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#1d4ed8', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {isExp ? '▼' : '▶'} Ver tendencia de los últimos meses
                    </button>
                  </div>
                </div>

                {/* Panel tendencia expandible */}
                {isExp && tend && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Kilos por mes</span>
                      {tend.alertas_anteriores > 0 ? (
                        <span style={{ fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #fca5a5' }}>
                          ⚠️ Reincidente — {tend.alertas_anteriores} alerta{tend.alertas_anteriores !== 1 ? 's' : ''} anterior{tend.alertas_anteriores !== 1 ? 'es' : ''}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
                          Primera alerta
                        </span>
                      )}
                    </div>

                    {tend.tendencia.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>Sin datos históricos disponibles</p>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '110px', overflowX: 'auto', paddingTop: '1.5rem' }}>
                        {(() => {
                          const maxKilos = Math.max(...tend.tendencia.map(t => t.kilos), 1);
                          return tend.tendencia.map(t => {
                            const altura = Math.max((t.kilos / maxKilos) * 60, 4);
                            const esMesAlerta = t.mes === a.mes_alerta.substring(0, 7);
                            return (
                              <div key={t.mes} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '48px' }}>
                                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                  {t.kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                </span>
                                <div style={{ width: '32px', height: `${altura}px`, background: esMesAlerta ? '#dc2626' : '#1d4ed8', borderRadius: '4px 4px 0 0', opacity: esMesAlerta ? 1 : 0.6 }} />
                                <span style={{ fontSize: '0.65rem', color: esMesAlerta ? '#dc2626' : '#9ca3af', fontWeight: esMesAlerta ? 700 : 400 }}>
                                  {formatMesCorto(t.mes)}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem', justifyContent: 'flex-end', borderTop: '1px solid #f3f4f6' }}>
                  {a.estatus === 'PENDIENTE' && (
                    <button onClick={() => marcarRevisada(a)}
                      style={{ padding: '0.375rem 0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Marcar revisada
                    </button>
                  )}
                  {a.estatus !== 'INFORMADA' && (
                    <button onClick={() => abrirModalInforme(a)}
                      style={{ padding: '0.375rem 0.875rem', borderRadius: '6px', border: 'none', background: '#1d4ed8', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
                      Elevar al Director
                    </button>
                  )}
                  {a.informe_generado && (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', alignSelf: 'center' }}>✓ Informe enviado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal informe */}
      {modalAbierto && alertaSeleccionada && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
              Elevar informe al Director
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
              {alertaSeleccionada.locales?.nombre} · {alertaSeleccionada.plazas?.nombre}
            </p>
            <textarea value={notaInforme} onChange={e => setNotaInforme(e.target.value)}
              placeholder="Describe la situación y las acciones tomadas o planificadas..."
              rows={5}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0.75rem', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setModalAbierto(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={enviarInforme} disabled={!notaInforme.trim() || enviandoInforme}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: notaInforme.trim() ? '#1d4ed8' : '#93c5fd', color: '#fff', cursor: notaInforme.trim() ? 'pointer' : 'default' }}>
                {enviandoInforme ? 'Enviando...' : 'Enviar informe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasCumplimiento;
