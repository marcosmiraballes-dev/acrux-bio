import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Interfaces
interface Plaza {
  id: string;
  nombre: string;
}

interface Local {
  id: string;
  nombre: string;
  plaza_id: string;
}

interface TipoResiduo {
  id: string;
  nombre: string;
  factor_co2: number;
}

interface MaterialInput {
  tipo_residuo_id: string;
  kilos: number;
}

interface Recoleccion {
  id: string;
  fecha_recoleccion: string;
  plaza_nombre: string;
  local_nombre: string;
  total_kilos: number;
  co2_evitado: number;
  created_at: string;
}

// Emojis para cada tipo de residuo
const EMOJI_MAP: { [key: string]: string } = {
  'Orgánico': '🌱',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🫙',
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '🧃',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

const PanelCapturador: React.FC = () => {
  const { user } = useAuth();
  
  // Estados para catálogos
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  
  // Estados del formulario
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [selectedLocal, setSelectedLocal] = useState<string>('');
  const [fechaRecoleccion, setFechaRecoleccion] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [materiales, setMateriales] = useState<{ [key: string]: string }>({});
  
  // Estados de lista
  const [misRecolecciones, setMisRecolecciones] = useState<Recoleccion[]>([]);
  const [totalRecolecciones, setTotalRecolecciones] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => {
    loadCatalogos();
    loadMisRecolecciones();
  }, []);

  useEffect(() => {
    loadMisRecolecciones();
  }, [currentPage]);

  const loadCatalogos = async () => {
    try {
      const [plazasRes, localesRes, tiposRes] = await Promise.all([
        api.get('/plazas'),
        api.get('/locales'),
        api.get('/tipos-residuos')
      ]);
      
      setPlazas(plazasRes.data.data || []);
      setLocales(localesRes.data.data || []);
      setTiposResiduos(tiposRes.data.data || []);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error al cargar catálogos');
    }
  };

  const loadMisRecolecciones = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const [recoleccionesRes, countRes] = await Promise.all([
        api.get('/capturador/mis-recolecciones', {
          params: { limit: itemsPerPage, offset }
        }),
        api.get('/capturador/mis-recolecciones/count')
      ]);
      
      setMisRecolecciones(recoleccionesRes.data.data || []);
      setTotalRecolecciones(countRes.data.data || 0);
    } catch (err) {
      console.error('Error cargando mis recolecciones:', err);
    }
  };

  const handlePlazaChange = (plazaId: string) => {
    setSelectedPlaza(plazaId);
    setSelectedLocal('');
  };

  const handleMaterialChange = (tipoId: string, valor: string) => {
    const valorLimpio = valor.replace(/[^0-9.]/g, '');
    const partes = valorLimpio.split('.');
    const valorFinal = partes.length > 2 
      ? partes[0] + '.' + partes.slice(1).join('')
      : valorLimpio;
    
    setMateriales(prev => ({
      ...prev,
      [tipoId]: valorFinal
    }));
  };

  const calcularTotales = () => {
    let totalKilos = 0;
    let totalCO2 = 0;
    
    Object.entries(materiales).forEach(([tipoId, kilosStr]) => {
      const kilos = parseFloat(kilosStr) || 0;
      if (kilos > 0) {
        const tipo = tiposResiduos.find(t => t.id === tipoId);
        if (tipo) {
          totalKilos += kilos;
          totalCO2 += kilos * tipo.factor_co2;
        }
      }
    });
    
    return { totalKilos, totalCO2 };
  };

  const handleGuardar = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      if (!selectedPlaza) {
        setError('Selecciona una plaza');
        return;
      }
      if (!selectedLocal) {
        setError('Selecciona un local');
        return;
      }
      if (!fechaRecoleccion) {
        setError('Selecciona la fecha de recolección');
        return;
      }
      
      const materialesArray: MaterialInput[] = [];
      Object.entries(materiales).forEach(([tipoId, kilosStr]) => {
        const kilos = parseFloat(kilosStr);
        if (!isNaN(kilos) && kilos > 0) {
          materialesArray.push({
            tipo_residuo_id: tipoId,
            kilos: Number(kilos.toFixed(2))
          });
        }
      });
      
      if (materialesArray.length === 0) {
        setError('Ingresa al menos un material con kilos mayor a 0');
        return;
      }
      
      const payload = {
        plaza_id: selectedPlaza,
        local_id: selectedLocal,
        fecha_recoleccion: fechaRecoleccion + 'T12:00:00',
        detalles: materialesArray
      };
      
      if (editando) {
        await api.put(`/recolecciones/${editando}`, payload);
        setSuccess('✅ Recolección actualizada exitosamente');
        setEditando(null);
      } else {
        await api.post('/recolecciones', payload);
        setSuccess('✅ Recolección guardada exitosamente');
      }
      
      handleLimpiar();
      loadMisRecolecciones();
      
    } catch (err: any) {
      console.error('Error guardando recolección:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al guardar la recolección');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setSelectedPlaza('');
    setSelectedLocal('');
    setFechaRecoleccion(new Date().toISOString().split('T')[0]);
    setMateriales({});
    setEditando(null);
    setError('');
    setSuccess('');
  };

  const handleEditar = async (recoleccionId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/capturador/recolecciones/${recoleccionId}`);
      const { recoleccion, detalles } = response.data.data;
      
      setSelectedPlaza(recoleccion.plaza_id);
      setSelectedLocal(recoleccion.local_id);
      setFechaRecoleccion(recoleccion.fecha_recoleccion);
      
      const nuevosMateriales: { [key: string]: string } = {};
      detalles.forEach((detalle: any) => {
        nuevosMateriales[detalle.tipos_residuos.id] = detalle.kilos.toString();
      });
      setMateriales(nuevosMateriales);
      
      setEditando(recoleccionId);
      setSuccess('');
      setError('');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      console.error('Error cargando recolección:', err);
      setError('Error al cargar la recolección para editar');
    } finally {
      setLoading(false);
    }
  };

  const localesFiltrados = locales.filter(l => !selectedPlaza || l.plaza_id === selectedPlaza);
  const { totalKilos, totalCO2 } = calcularTotales();
  const totalPages = Math.ceil(totalRecolecciones / itemsPerPage);

  // Organizar materiales en pares (2 por fila)
  const materialesPares: TipoResiduo[][] = [];
  for (let i = 0; i < tiposResiduos.length; i += 2) {
    materialesPares.push(tiposResiduos.slice(i, i + 2));
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          📝 Panel de Captura
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.nombre} - Captura rápida de recolecciones
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* FORMULARIO DE CAPTURA */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            {editando ? '✏️ Editar Recolección' : '➕ Nueva Recolección'}
          </h2>
          {editando && (
            <button onClick={handleLimpiar} className="btn btn-secondary text-sm">
              Cancelar Edición
            </button>
          )}
        </div>

        {/* Selectores: Plaza, Local, Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plaza <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPlaza}
              onChange={(e) => handlePlazaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              disabled={loading}
            >
              <option value="">Selecciona una plaza...</option>
              {plazas.map(plaza => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedLocal}
              onChange={(e) => setSelectedLocal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              disabled={!selectedPlaza || loading}
            >
              <option value="">Selecciona un local...</option>
              {localesFiltrados.map(local => (
                <option key={local.id} value={local.id}>{local.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Recolección <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fechaRecoleccion}
              onChange={(e) => setFechaRecoleccion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              disabled={loading}
            />
          </div>
        </div>

        {/* Título de Materiales */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ♻️ Materiales Recolectados
        </h3>

        {/* Grid de Materiales - 2 POR LÍNEA */}
        <div className="space-y-2 mb-6">
          {materialesPares.map((par, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {par.map((tipo) => {
                const kilos = parseFloat(materiales[tipo.id] || '0');
                const co2 = kilos * tipo.factor_co2;
                const emoji = EMOJI_MAP[tipo.nombre] || '♻️';

                return (
                  <div key={tipo.id} className="grid grid-cols-[140px_100px_110px] items-center gap-2">
                    {/* Nombre del material con emoji */}
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      {emoji} {tipo.nombre}
                    </span>

                    {/* Input de kilos */}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={materiales[tipo.id] || ''}
                      onChange={(e) => handleMaterialChange(tipo.id, e.target.value)}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        if (!isNaN(num) && num > 0) {
                          handleMaterialChange(tipo.id, num.toFixed(2));
                        } else if (e.target.value && (isNaN(num) || num <= 0)) {
                          handleMaterialChange(tipo.id, '');
                        }
                      }}
                      className="w-full px-3 py-1.5 text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono"
                      placeholder="0.00"
                      disabled={loading}
                    />

                    {/* CO2 calculado */}
                    <span className="text-sm font-semibold text-primary-600 text-right whitespace-nowrap">
                      {co2.toFixed(2)} kg CO₂
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* CARD DE TOTALES - DESTACADO */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-5 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-xs uppercase text-white/90 font-semibold tracking-wider mb-2">
                Total Kilos
              </div>
              <div className="text-4xl font-bold text-white font-mono">
                {totalKilos.toFixed(2)} <span className="text-xl text-white/80">kg</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase text-white/90 font-semibold tracking-wider mb-2">
                CO₂ Evitado
              </div>
              <div className="text-4xl font-bold text-white font-mono">
                {totalCO2.toFixed(2)} <span className="text-xl text-white/80">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción - SIN BITÁCORAS */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGuardar}
            disabled={loading || totalKilos === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {loading ? '⏳ Guardando...' : editando ? '💾 Actualizar' : '💾 Guardar Recolección'}
          </button>
          <button
            onClick={handleLimpiar}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 border border-gray-300 transition-all"
          >
            🗑️ Limpiar Formulario
          </button>
        </div>
      </div>

      {/* LISTA DE MIS RECOLECCIONES */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📋 Mis Últimas Recolecciones
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plaza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Local
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Kilos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CO₂ Evitado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {misRecolecciones.length > 0 ? (
                misRecolecciones.map(recoleccion => (
                  <tr key={recoleccion.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {recoleccion.fecha_recoleccion}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {recoleccion.plaza_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {recoleccion.local_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-primary-600">
                      {recoleccion.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                      {recoleccion.co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <button
                        onClick={() => handleEditar(recoleccion.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        disabled={loading}
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">📋</span>
                      <p className="text-sm">No tienes recolecciones registradas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecolecciones)} de {totalRecolecciones}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                ← Anterior
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelCapturador;