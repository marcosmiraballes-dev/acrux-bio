import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Informe {
  id: string;
  local_id: string;
  plaza_id: string;
  mes_alerta: string;
  kilos_promedio_historico: number;
  kilos_mes_actual: number;
  porcentaje_desviacion: number;
  tipo_alerta: 'CAIDA' | 'AUSENCIA_TOTAL';
  nota_coordinador: string;
  informe_fecha: string;
  locales: { nombre: string; giro: string };
  plazas: { nombre: string };
  usuarios: { nombre: string };
}

const InformesOperativos: React.FC = () => {
  const [informes, setInformes] = useState<Informe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => { loadInformes(); }, []);

  const loadInformes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alertas/director');
      setInformes(res.data);
    } catch {
      setError('Error cargando informes');
    } finally {
      setLoading(false);
    }
  };

  const formatMes = (fecha: string) => {
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const colorDesviacion = (pct: number) => {
    if (pct <= -80) return '#dc2626';
    if (pct <= -50) return '#d97706';
    return '#ca8a04';
  };

  // Agrupar por plaza
  const porPlaza = informes.reduce((acc, inf) => {
    const plaza = inf.plazas?.nombre || 'Sin plaza';
    if (!acc[plaza]) acc[plaza] = [];
    acc[plaza].push(inf);
    return acc;
  }, {} as Record<string, Informe[]>);

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      Cargando informes...
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Informes Operativos
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Alertas elevadas por los coordinadores que requieren atención del Director
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total informes', valor: informes.length, color: '#1d4ed8' },
          { label: 'Plazas afectadas', valor: Object.keys(porPlaza).length, color: '#7c3aed' },
          { label: 'Ausencias totales', valor: informes.filter(i => i.tipo_alerta === 'AUSENCIA_TOTAL').length, color: '#dc2626' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: k.color }}>{k.valor}</div>
          </div>
        ))}
      </div>

      {informes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          No hay informes operativos pendientes. ✓
        </div>
      ) : (
        Object.entries(porPlaza).map(([plaza, items]) => (
          <div key={plaza} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', margin: 0 }}>{plaza}</h2>
              <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.15rem 0.6rem', borderRadius: '999px' }}>
                {items.length} informe{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map(inf => (
                <div key={inf.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Cabecera del informe */}
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>
                        {inf.locales?.nombre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                        {inf.locales?.giro} · {formatMes(inf.mes_alerta)} · Coordinador: {inf.usuarios?.nombre}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
                        background: inf.tipo_alerta === 'AUSENCIA_TOTAL' ? '#fdf4ff' : '#fef2f2',
                        color: inf.tipo_alerta === 'AUSENCIA_TOTAL' ? '#7c3aed' : '#dc2626',
                        border: `1px solid ${inf.tipo_alerta === 'AUSENCIA_TOTAL' ? '#e9d5ff' : '#fca5a5'}` }}>
                        {inf.tipo_alerta === 'AUSENCIA_TOTAL' ? 'Sin actividad' : 'Caída'}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: colorDesviacion(inf.porcentaje_desviacion) }}>
                        {inf.porcentaje_desviacion.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
                    {[
                      { label: 'Promedio histórico', valor: `${inf.kilos_promedio_historico.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg` },
                      { label: 'Kilos en el mes', valor: `${inf.kilos_mes_actual.toLocaleString('es-MX', { minimumFractionDigits: 1 })} kg` },
                    ].map(m => (
                      <div key={m.label} style={{ padding: '0.625rem 1.25rem', background: '#f9fafb' }}>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{m.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{m.valor}</div>
                      </div>
                    ))}
                  </div>

                  {/* Nota del coordinador (expandible) */}
                  <div style={{ padding: '0.875rem 1.25rem' }}>
                    <button onClick={() => setExpandido(expandido === inf.id ? null : inf.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#1d4ed8', padding: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {expandido === inf.id ? '▼' : '▶'} Nota del coordinador
                    </button>
                    {expandido === inf.id && (
                      <div style={{ marginTop: '0.625rem', background: '#f9fafb', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151', lineHeight: '1.6', borderLeft: '3px solid #1d4ed8' }}>
                        {inf.nota_coordinador}
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                          Enviado: {formatFecha(inf.informe_fecha)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default InformesOperativos;
