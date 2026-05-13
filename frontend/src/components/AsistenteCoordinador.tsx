import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
}

const SUGERENCIAS = [
  '¿Qué alertas tengo pendientes?',
  '¿Qué locales no han reciclado este mes?',
  '¿Cuáles son mis plazas asignadas?',
  '¿Qué infracciones activas hay en mis plazas?',
];

const AsistenteCoordinador: React.FC = () => {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente operativo. Puedo ayudarte a revisar alertas, consultar el historial de locatarios, ver infracciones y redactar informes para el Director. ¿En qué te puedo ayudar?'
    }
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 100);
  }, [abierto]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  const enviarMensaje = async (texto?: string) => {
    const mensajeTexto = texto || input.trim();
    if (!mensajeTexto || cargando || !user?.id) return;

    const nuevoMensaje: Mensaje = { role: 'user', content: mensajeTexto };
    const historialActual = [...mensajes, nuevoMensaje];
    setMensajes(historialActual);
    setInput('');
    setCargando(true);

    try {
      const res = await api.post('/asistente/coordinador', {
        mensaje: mensajeTexto,
        historial: mensajes,
        coordinador_id: user.id,
      });

      if (res.data.success) {
        setMensajes([...historialActual, {
          role: 'assistant',
          content: res.data.respuesta,
        }]);
      } else {
        throw new Error(res.data.error || 'Error desconocido');
      }
    } catch (error: any) {
      setMensajes([...historialActual, {
        role: 'assistant',
        content: `Lo siento, ocurrió un error: ${error.message || 'Error desconocido'}. Por favor intenta de nuevo.`,
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

  const formatearMensaje = (texto: string) => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', zIndex: 1000, transition: 'transform 0.2s',
        }}
        title="Asistente Operativo"
      >
        🤝
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      width: '380px', height: '560px',
      background: '#fff', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column',
      zIndex: 1000, overflow: 'hidden',
      border: '1px solid #e5e7eb',
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #16a34a, #15803d)',
        padding: '1rem 1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
            🤝 Asistente Operativo
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.1rem' }}>
            {user?.nombre} · Coordinador
          </div>
        </div>
        <button onClick={() => setAbierto(false)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '0.375rem 0.625rem', fontSize: '0.8rem' }}>
          ✕
        </button>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Sugerencias iniciales */}
        {mensajes.length === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Preguntas frecuentes:</span>
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => enviarMensaje(s)}
                style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #d1fae5', background: '#f0fdf4', color: '#15803d', fontSize: '0.78rem', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {mensajes.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '0.625rem 0.875rem',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? '#16a34a' : '#f9fafb',
              color: m.role === 'user' ? '#fff' : '#111827',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              border: m.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
            }}
              dangerouslySetInnerHTML={{ __html: formatearMensaje(m.content) }}
            />
          </div>
        ))}

        {cargando && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '0.625rem 0.875rem', borderRadius: '12px 12px 12px 2px',
              background: '#f9fafb', border: '1px solid #e5e7eb',
              fontSize: '0.85rem', color: '#9ca3af',
            }}>
              Consultando datos...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.875rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre tus plazas..."
          disabled={cargando}
          style={{
            flex: 1, padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.85rem', outline: 'none',
            background: cargando ? '#f9fafb' : '#fff',
          }}
        />
        <button
          onClick={() => enviarMensaje()}
          disabled={!input.trim() || cargando}
          style={{
            padding: '0.5rem 0.875rem', borderRadius: '8px', border: 'none',
            background: input.trim() && !cargando ? '#16a34a' : '#d1fae5',
            color: input.trim() && !cargando ? '#fff' : '#86efac',
            cursor: input.trim() && !cargando ? 'pointer' : 'default',
            fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default AsistenteCoordinador;
