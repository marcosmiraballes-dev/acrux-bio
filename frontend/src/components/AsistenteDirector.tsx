import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { generarReporteHuella, TipoReporte } from '../utils/generarReporteHuella';

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

interface Accion {
  action: string;
  tipo?: 'locatario' | 'plaza';
  id?: string;
  anio?: number;
  mes?: number;
  local_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

const AsistenteDirector: React.FC = () => {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de análisis. Puedo ayudarte a consultar datos de plazas y locatarios, analizar tendencias de CO₂ y generar reportes. ¿En qué te puedo ayudar?'
    }
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<Accion | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [abierto]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  // Ejecutar acción de generación de reporte
  useEffect(() => {
    if (!accionPendiente) return;

    const ejecutarAccion = async () => {
      try {
        if (accionPendiente.action === 'GENERATE_REPORT') {
          if (!accionPendiente.tipo || !accionPendiente.id || !accionPendiente.anio) {
            throw new Error('Acción GENERATE_REPORT incompleta');
          }

          const endpoint = accionPendiente.tipo === 'locatario'
            ? `/reportes/huella/locatario?local_id=${accionPendiente.id}&anio=${accionPendiente.anio}${accionPendiente.mes ? `&mes=${accionPendiente.mes}` : ''}`
            : `/reportes/huella/plaza?plaza_id=${accionPendiente.id}&anio=${accionPendiente.anio}${accionPendiente.mes ? `&mes=${accionPendiente.mes}` : ''}`;

          const res = await api.get(endpoint);
          if (res.data.success) {
            generarReporteHuella(res.data.data, accionPendiente.tipo as TipoReporte);
          }
          return;
        }

        if (accionPendiente.action === 'GENERATE_BITACORA') {
          if (!accionPendiente.local_id || !accionPendiente.fecha_desde || !accionPendiente.fecha_hasta) {
            throw new Error('Acción GENERATE_BITACORA incompleta');
          }

          const local_id = accionPendiente.local_id;
          const fecha_desde = accionPendiente.fecha_desde;
          const fecha_hasta = accionPendiente.fecha_hasta;

          const response = await api.get('/bitacoras/locatario', {
            params: { local_id, fecha_desde, fecha_hasta },
            responseType: 'arraybuffer',
          });

          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `bitacora_${local_id}_${fecha_desde}_${fecha_hasta}.xlsx`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Error ejecutando acción del asistente:', error);
      } finally {
        setAccionPendiente(null);
      }
    };

    ejecutarAccion();
  }, [accionPendiente]);

  const enviarMensaje = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;

    const nuevosMensajes: Mensaje[] = [...mensajes, { role: 'user', content: texto }];
    setMensajes(nuevosMensajes);
    setInput('');
    setCargando(true);

    try {
      // El historial excluye el mensaje de bienvenida inicial
      const historialParaAPI = nuevosMensajes.slice(
        mensajes[0]?.content.startsWith('¡Hola!') ? 1 : 0,
        -1
      );

      const res = await api.post('/asistente/director', {
        mensaje: texto,
        historial: historialParaAPI,
      });

      const respuesta = res.data.respuesta || 'No pude procesar tu solicitud.';
      setMensajes(prev => [...prev, { role: 'assistant', content: respuesta }]);

      if (res.data.accion) {
        setAccionPendiente(res.data.accion);
      }

    } catch (err: any) {
      console.error('Error asistente:', err);
      setMensajes(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.'
      }]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const limpiarChat = () => {
    setMensajes([{
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de análisis. Puedo ayudarte a consultar datos de plazas y locatarios, analizar tendencias de CO₂ y generar reportes. ¿En qué te puedo ayudar?'
    }]);
  };

  // Renderizar markdown básico
  const renderMensaje = (content: string) => {
    const lineas = content.split('\n');
    return lineas.map((linea, i) => {
      // Tabla markdown
      if (linea.startsWith('|')) {
        return null; // Se maneja por bloque
      }
      // Negrita
      linea = linea.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Código inline
      linea = linea.replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:11px;">$1</code>');
      return (
        <p key={i} style={{ margin: '2px 0' }}
          dangerouslySetInnerHTML={{ __html: linea || '&nbsp;' }} />
      );
    });
  };

  // Detectar y renderizar tablas markdown
  const renderContenido = (content: string) => {
    const bloques = content.split(/(\|[^\n]+\|(?:\n\|[^\n]+\|)*)/g);
    return bloques.map((bloque, i) => {
      if (bloque.startsWith('|')) {
        const filas = bloque.trim().split('\n').filter(f => !f.match(/^\|[-|\s]+\|$/));
        return (
          <div key={i} style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '11px', width: '100%' }}>
              <tbody>
                {filas.map((fila, j) => {
                  const celdas = fila.split('|').filter(c => c.trim() !== '');
                  const Tag = j === 0 ? 'th' : 'td';
                  return (
                    <tr key={j} style={{ background: j === 0 ? '#1A5C38' : j % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      {celdas.map((celda, k) => (
                        <Tag key={k} style={{
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          color: j === 0 ? 'white' : '#333',
                          fontWeight: j === 0 ? 'bold' : 'normal',
                          whiteSpace: 'nowrap',
                        }}>
                          {celda.trim()}
                        </Tag>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      return (
        <div key={i}>
          {bloque.split('\n').map((linea, j) => {
            if (!linea.trim()) return <br key={j} />;
            const conNegrita = linea.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            const conCodigo = conNegrita.replace(/`(.*?)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:11px;">$1</code>');
            if (linea.startsWith('- ') || linea.startsWith('• ')) {
              return <div key={j} style={{ paddingLeft: '12px', margin: '2px 0' }}>
                <span dangerouslySetInnerHTML={{ __html: '• ' + conCodigo.replace(/^[-•]\s/, '') }} />
              </div>;
            }
            return <div key={j} style={{ margin: '2px 0' }}
              dangerouslySetInnerHTML={{ __html: conCodigo }} />;
          })}
        </div>
      );
    });
  };

  const SUGERENCIAS = [
    '¿Qué plaza tiene más CO₂ evitado en 2025?',
    'Muéstrame el top 5 de locatarios de Plaza Malecón',
    'Genera el reporte de huella de Liverpool 2025',
  ];

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1A5C38 0%, #2E7D52 100%)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(26,92,56,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
          fontSize: '24px',
        }}
        title="Asistente de análisis"
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {abierto ? '✕' : '🤖'}
      </button>

      {/* Ventana del chat */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px', zIndex: 999,
          width: '380px', height: '520px',
          background: 'white', borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #E8F5EE',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1A5C38 0%, #2E7D52 100%)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}>🤖</div>
              <div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                  Asistente Acrux-Bio
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                  Análisis en tiempo real
                </div>
              </div>
            </div>
            <button
              onClick={limpiarChat}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: '6px', padding: '4px 8px',
                color: 'rgba(255,255,255,0.8)', fontSize: '11px',
                cursor: 'pointer',
              }}
              title="Limpiar conversación"
            >
              Limpiar
            </button>
          </div>

          {/* Mensajes */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px',
            display: 'flex', flexDirection: 'column', gap: '10px',
          }}>
            {mensajes.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '88%',
                  padding: '10px 12px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? '#1A5C38' : '#F4F7F5',
                  color: msg.role === 'user' ? 'white' : '#1C2B20',
                  fontSize: '12px', lineHeight: '1.5',
                }}>
                  {renderContenido(msg.content)}
                </div>
              </div>
            ))}

            {/* Indicador de carga */}
            {cargando && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                  background: '#F4F7F5', fontSize: '12px', color: '#666',
                  display: 'flex', gap: '4px', alignItems: 'center',
                }}>
                  <span style={{ animation: 'bounce 1s infinite' }}>●</span>
                  <span style={{ animation: 'bounce 1s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'bounce 1s infinite 0.4s' }}>●</span>
                </div>
              </div>
            )}

            {/* Sugerencias — solo al inicio */}
            {mensajes.length === 1 && !cargando && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>
                  Sugerencias
                </div>
                {SUGERENCIAS.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)}
                    style={{
                      background: '#E8F5EE', border: '1px solid #C0DEC8',
                      borderRadius: '8px', padding: '6px 10px',
                      fontSize: '11px', color: '#1A5C38', cursor: 'pointer',
                      textAlign: 'left', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#D4EDE0')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#E8F5EE')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid #E8F5EE',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta algo..."
              disabled={cargando}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '10px',
                border: '1px solid #D4E6DB', outline: 'none',
                fontSize: '12px', background: cargando ? '#f9f9f9' : 'white',
              }}
            />
            <button
              onClick={enviarMensaje}
              disabled={cargando || !input.trim()}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: cargando || !input.trim() ? '#ccc' : '#1A5C38',
                border: 'none', cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', transition: 'background 0.2s',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </>
  );
};

export default AsistenteDirector;