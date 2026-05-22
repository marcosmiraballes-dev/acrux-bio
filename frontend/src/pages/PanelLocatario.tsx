import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface TipoResiduo {
  id: string;
  nombre: string;
  factor_co2: number;
  color_hex: string;
}

interface DetalleRegistro {
  tipo_residuo_id: string;
  nombre: string;
  kilos: number;
  color_hex: string;
  emoji: string;
}

interface InfoLocal {
  id: string;
  nombre: string;
  plaza: { id: string; nombre: string; ciudad: string };
}

const EMOJIS: Record<string, string> = {
  'Orgánico': '🌿',
  'Inorgánico': '🗑️',
  'PET': '🥤',
  'Cartón': '📦',
  'Aluminio': '🥫',
  'Archivo': '📄',
  'Tetra Pak': '🧃',
  'Plástico Duro': '🪣',
  'Playo': '🛍️',
  'Vidrio': '🫙',
  'Chatarra': '⚙️',
};

const getEmoji = (nombre: string) => EMOJIS[nombre] || '♻️';

const ORDEN_PREFERIDO = ['Orgánico', 'Inorgánico'];

const ordenarResiduos = (tipos: TipoResiduo[]) => {
  const primeros = ORDEN_PREFERIDO
    .map(n => tipos.find(t => t.nombre === n))
    .filter(Boolean) as TipoResiduo[];
  const resto = tipos.filter(t => !ORDEN_PREFERIDO.includes(t.nombre));
  return [...primeros, ...resto];
};

const PanelLocatario = () => {
  const { user, logout } = useAuth();
  const [infoLocal, setInfoLocal] = useState<InfoLocal | null>(null);
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  const [seleccionado, setSeleccionado] = useState<TipoResiduo | null>(null);
  const [kilos, setKilos] = useState('');
  const [detalles, setDetalles] = useState<DetalleRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [infoRes, tiposRes] = await Promise.all([
          api.get('/locatario/info'),
          api.get('/locatario/tipos-residuos')
        ]);
        setInfoLocal(infoRes.data.data);
        setTiposResiduos(ordenarResiduos(tiposRes.data.data));
      } catch (err) {
        setMensaje({ tipo: 'error', texto: 'Error al cargar datos' });
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const seleccionarResiduo = (tipo: TipoResiduo) => {
    setSeleccionado(tipo);
    const existente = detalles.find(d => d.tipo_residuo_id === tipo.id);
    setKilos(existente ? existente.kilos.toString() : '');
  };

  const agregarResiduo = () => {
    const kg = parseFloat(kilos);
    if (!seleccionado || isNaN(kg) || kg <= 0) return;
    setDetalles(prev => {
      const sin = prev.filter(d => d.tipo_residuo_id !== seleccionado.id);
      return [...sin, {
        tipo_residuo_id: seleccionado.id,
        nombre: seleccionado.nombre,
        kilos: kg,
        color_hex: seleccionado.color_hex,
        emoji: getEmoji(seleccionado.nombre)
      }];
    });
    setSeleccionado(null);
    setKilos('');
  };

  const eliminarDetalle = (id: string) => {
    setDetalles(prev => prev.filter(d => d.tipo_residuo_id !== id));
  };

  const totalKilos = detalles.reduce((s, d) => s + d.kilos, 0);

  const guardar = async () => {
    if (detalles.length === 0) return;
    setGuardando(true);
    try {
      await api.post('/locatario/registro', {
        detalles: detalles.map(d => ({
          tipo_residuo_id: d.tipo_residuo_id,
          kilos: d.kilos
        }))
      });
      setMensaje({ tipo: 'ok', texto: `✓ Registro guardado — ${totalKilos.toFixed(1)} kg` });
      setDetalles([]);
      setSeleccionado(null);
      setKilos('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar el registro' });
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const limpiar = () => {
    if (detalles.length === 0) return;
    if (!window.confirm('¿Borrar todos los residuos ingresados?')) return;
    setDetalles([]);
    setSeleccionado(null);
    setKilos('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo-blanco.png" alt="Elefantes Verdes" className="h-10 w-auto" />
          <div>
            <p className="text-emerald-200 text-xs font-medium">Elefantes Verdes</p>
            <h1 className="font-semibold text-base leading-tight">Registro de residuos</h1>
            <p className="text-emerald-300 text-xs">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-sm font-medium leading-tight">{infoLocal?.plaza?.nombre}</p>
          <p className="text-emerald-200 text-xs">{infoLocal?.nombre}</p>
          <button
            onClick={logout}
            className="mt-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Mensaje toast */}
      {mensaje && (
        <div className={`mx-4 mt-3 px-4 py-3 rounded-lg text-sm font-medium ${
          mensaje.tipo === 'ok'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <div className="flex-1 p-4 space-y-4">
        {/* Grid de residuos */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Toca el tipo de residuo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {tiposResiduos.map(tipo => {
              const tieneKilos = detalles.find(d => d.tipo_residuo_id === tipo.id);
              const isActive = seleccionado?.id === tipo.id;
              return (
                <button
                  key={tipo.id}
                  onClick={() => seleccionarResiduo(tipo)}
                  className="rounded-xl p-3 text-center border-2 transition-all active:scale-95"
                  style={{
                    borderColor: isActive ? tipo.color_hex : tieneKilos ? tipo.color_hex + '60' : '#e5e7eb',
                    background: isActive ? tipo.color_hex + '18' : tieneKilos ? 'white' : '#f9fafb'
                  }}
                >
                  <div className="text-3xl mb-1">{getEmoji(tipo.nombre)}</div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{tipo.nombre}</p>
                  <p className="text-xs mt-0.5" style={{ color: tieneKilos ? tipo.color_hex : '#9ca3af' }}>
                    {tieneKilos ? tieneKilos.kilos.toFixed(1) + ' kg' : '—'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input kilos */}
        {seleccionado && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-2">
              {getEmoji(seleccionado.nombre)} Kilos de{' '}
              <span className="font-semibold" style={{ color: seleccionado.color_hex }}>
                {seleccionado.nombre}
              </span>
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                inputMode="decimal"
                value={kilos}
                onChange={e => setKilos(e.target.value)}
                placeholder="0.0"
                className="flex-1 text-2xl font-semibold text-center border-2 rounded-lg py-3 outline-none"
                style={{ borderColor: seleccionado.color_hex }}
                autoFocus
              />
              <span className="text-gray-400 text-sm">kg</span>
              <button
                onClick={agregarResiduo}
                className="px-4 py-3 rounded-lg text-white text-sm font-semibold"
                style={{ background: seleccionado.color_hex }}
              >
                + Agregar
              </button>
            </div>
          </div>
        )}

        {/* Lista residuos registrados */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Residuos registrados
          </p>
          {detalles.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-400 text-sm">
              Ningún residuo agregado aún
            </div>
          ) : (
            <div className="space-y-2">
              {detalles.map(d => (
                <div key={d.tipo_residuo_id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">{d.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{d.nombre}</span>
                  <span className="text-sm font-semibold text-gray-700">{d.kilos.toFixed(1)} kg</span>
                  <button
                    onClick={() => eliminarDetalle(d.tipo_residuo_id)}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Total a entregar</p>
          <p className="text-2xl font-semibold text-emerald-700">
            {totalKilos.toFixed(1)} <span className="text-sm text-gray-400">kg</span>
          </p>
        </div>
        <button
          onClick={limpiar}
          className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm"
        >
          Corregir
        </button>
        <button
          onClick={guardar}
          disabled={detalles.length === 0 || guardando}
          className="px-6 py-3 rounded-xl bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40"
        >
          {guardando ? 'Guardando...' : 'Guardar registro'}
        </button>
      </div>
    </div>
  );
};

export default PanelLocatario;
