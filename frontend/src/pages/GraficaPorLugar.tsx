import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { generateGraficaPorLugarHTML } from '../utils/generateGraficaPorLugarHTML';

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

interface PorTipo {
  tipo_nombre: string;
  total_kilos: number;
  co2_evitado: number;
}

interface Periodo {
  total_recolecciones: number;
  total_kilos: number;
  co2_evitado: number;
  por_tipo: PorTipo[];
}

interface Variacion {
  recolecciones: number;
  kilos: number;
  co2: number;
}

interface ComparacionData {
  periodo1: Periodo;
  periodo2: Periodo;
  variacion: Variacion;
}

// Mapeo de emojis
const EMOJI_MAP: { [key: string]: string } = {
  'Orgánico': '🍌',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🍾',
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '📦',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

const GraficaPorLugar: React.FC = () => {
  const { user } = useAuth();
  
  // Estados
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);
  
  // Filtros
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [selectedLocal, setSelectedLocal] = useState<string>('');
  const [periodo1Desde, setPeriodo1Desde] = useState<string>('');
  const [periodo1Hasta, setPeriodo1Hasta] = useState<string>('');
  const [periodo2Desde, setPeriodo2Desde] = useState<string>('');
  const [periodo2Hasta, setPeriodo2Hasta] = useState<string>('');
  
  const [comparacion, setComparacion] = useState<ComparacionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlazas();
    loadLocales();
  }, []);

  useEffect(() => {
    // Filtrar locales por plaza seleccionada
    if (selectedPlaza) {
      setLocalesFiltrados(locales.filter(l => l.plaza_id === selectedPlaza));
      setSelectedLocal('');
    } else {
      setLocalesFiltrados(locales);
    }
  }, [selectedPlaza, locales]);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  const loadLocales = async () => {
    try {
      const response = await api.get('/locales');
      setLocales(response.data.data || []);
      setLocalesFiltrados(response.data.data || []);
    } catch (err) {
      console.error('Error cargando locales:', err);
    }
  };

  const handleComparar = async () => {
    try {
      // Validaciones
      if (!periodo1Desde || !periodo1Hasta || !periodo2Desde || !periodo2Hasta) {
        setError('Por favor selecciona las fechas de ambos periodos');
        return;
      }

      setLoading(true);
      setError('');

      const params: any = {
        periodo1_desde: periodo1Desde,
        periodo1_hasta: periodo1Hasta,
        periodo2_desde: periodo2Desde,
        periodo2_hasta: periodo2Hasta
      };

      if (selectedPlaza) params.plaza_id = selectedPlaza;
      if (selectedLocal) params.local_id = selectedLocal;

      console.log('📊 Comparando periodos con params:', params);

      const response = await api.get('/comparacion/periodos', { params });

      setComparacion(response.data.data);
      setError('');

    } catch (err: any) {
      console.error('❌ Error comparando periodos:', err);
      setError('Error al comparar periodos. Por favor, intenta de nuevo.');
      setComparacion(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setSelectedPlaza('');
    setSelectedLocal('');
    setPeriodo1Desde('');
    setPeriodo1Hasta('');
    setPeriodo2Desde('');
    setPeriodo2Hasta('');
    setComparacion(null);
    setError('');
  };

  // Obtener nombres para mostrar
  const nombrePlaza = selectedPlaza ? plazas.find(p => p.id === selectedPlaza)?.nombre : 'Todas las plazas';
  const nombreLocal = selectedLocal ? locales.find(l => l.id === selectedLocal)?.nombre : '';

  // Calcular variación de materiales para la tabla
  const materialesComparados = comparacion ?
    comparacion.periodo1.por_tipo.slice(0, 5).map(tipo => {
      const periodo2Tipo = comparacion.periodo2.por_tipo.find(t => t.tipo_nombre === tipo.tipo_nombre);
      const kilos2 = periodo2Tipo ? periodo2Tipo.total_kilos : 0;
      const variacion = tipo.total_kilos > 0 
        ? ((kilos2 - tipo.total_kilos) / tipo.total_kilos * 100)
        : 0;
      
      return {
        nombre: tipo.tipo_nombre,
        periodo1_kilos: tipo.total_kilos,
        periodo2_kilos: kilos2,
        variacion: variacion
      };
    }) : [];

  const handleExportarPDF = () => {
    if (!comparacion) return;

    generateGraficaPorLugarHTML({
      periodo1: comparacion.periodo1,
      periodo2: comparacion.periodo2,
      variacion: comparacion.variacion,
      materialesComparados,
      nombrePlaza,
      nombreLocal,
      periodo1Desde,
      periodo1Hasta,
      periodo2Desde,
      periodo2Hasta,
      userName: user?.nombre
    });
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🏢 Gráfica por Lugar</h1>
        <p className="text-gray-600 mt-1">Bienvenida, {user?.nombre} - Análisis Comparativo por Plaza y Local</p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold text-gray-800">Filtros de Comparación</h2>
        </div>

        {/* Fila 1: Plaza, Local, Periodo 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="label">Plaza</label>
            <select 
              value={selectedPlaza} 
              onChange={(e) => setSelectedPlaza(e.target.value)} 
              className="input"
              disabled={loading}
            >
              <option value="">Todas las plazas</option>
              {plazas.filter(p => p.nombre).map((plaza) => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Local (Opcional)</label>
            <select 
              value={selectedLocal} 
              onChange={(e) => setSelectedLocal(e.target.value)} 
              className="input"
              disabled={loading}
            >
              <option value="">Todos los locales</option>
              {localesFiltrados.filter(l => l.nombre).map((local) => (
                <option key={local.id} value={local.id}>{local.nombre}</option>
              ))}
            </select>
          </div>

          {/* Periodo 1 */}
          <div className="border-l-2 border-blue-300 pl-4">
            <label className="label text-blue-700">Periodo 1 - Desde</label>
            <input 
              type="date" 
              value={periodo1Desde} 
              onChange={(e) => setPeriodo1Desde(e.target.value)} 
              className="input border-blue-300 focus:ring-blue-600"
              disabled={loading}
            />
          </div>

          <div>
            <label className="label text-blue-700">Periodo 1 - Hasta</label>
            <input 
              type="date" 
              value={periodo1Hasta} 
              onChange={(e) => setPeriodo1Hasta(e.target.value)} 
              className="input border-blue-300 focus:ring-blue-600"
              disabled={loading}
            />
          </div>
        </div>

        {/* Fila 2: Periodo 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-start-3 border-l-2 border-purple-300 pl-4">
            <label className="label text-purple-700">Periodo 2 - Desde</label>
            <input 
              type="date" 
              value={periodo2Desde} 
              onChange={(e) => setPeriodo2Desde(e.target.value)} 
              className="input border-purple-300 focus:ring-purple-600"
              disabled={loading}
            />
          </div>

          <div>
            <label className="label text-purple-700">Periodo 2 - Hasta</label>
            <input 
              type="date" 
              value={periodo2Hasta} 
              onChange={(e) => setPeriodo2Hasta(e.target.value)} 
              className="input border-purple-300 focus:ring-purple-600"
              disabled={loading}
            />
          </div>
        </div>

        {/* Fila 3: Botones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleComparar}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Comparando...' : 'Comparar Periodos'}
          </button>
          <button 
            onClick={handleLimpiar}
            disabled={loading}
            className="btn btn-secondary w-full"
          >
            Limpiar
          </button>
          <button 
            onClick={handleExportarPDF}
            className="btn bg-red-600 hover:bg-red-700 text-white w-full"
            disabled={!comparacion || loading}
            title="Descargar Comparativa en PDF"
          >
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Resultados de Comparación */}
      {comparacion && (
        <div className="space-y-6">
          
          {/* Cards de Periodos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Periodo 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">Periodo 1</h3>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                    {periodo1Desde} - {periodo1Hasta}
                  </span>
                </div>
                {/* Nombre de Plaza/Local */}
                <div className="mt-3 pt-3 border-t border-blue-300">
                  <p className="text-sm font-semibold text-blue-700">
                    {nombrePlaza}
                    {nombreLocal && <span className="ml-2">→ {nombreLocal}</span>}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total Recolecciones</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {comparacion.periodo1.total_recolecciones.toLocaleString('es-MX')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total Kilos</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {comparacion.periodo1.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-blue-600">kg</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">CO2 Evitado</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {(comparacion.periodo1.co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-blue-600">toneladas</p>
                </div>
              </div>
            </div>

            {/* Periodo 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-purple-800 mb-2">Periodo 2</h3>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                    {periodo2Desde} - {periodo2Hasta}
                  </span>
                </div>
                {/* Nombre de Plaza/Local */}
                <div className="mt-3 pt-3 border-t border-purple-300">
                  <p className="text-sm font-semibold text-purple-700">
                    {nombrePlaza}
                    {nombreLocal && <span className="ml-2">→ {nombreLocal}</span>}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-purple-700 mb-1">Total Recolecciones</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {comparacion.periodo2.total_recolecciones.toLocaleString('es-MX')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-1">Total Kilos</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {comparacion.periodo2.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-purple-600">kg</p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 mb-1">CO2 Evitado</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {(comparacion.periodo2.co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-purple-600">toneladas</p>
                </div>
              </div>
            </div>

          </div>

          {/* Análisis de Variación */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Análisis Comparativo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Variación Recolecciones */}
              <div className={`p-4 rounded-lg border ${
                comparacion.variacion.recolecciones >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
              }`}>
                <p className="text-sm text-gray-600 mb-2">Variación en Recolecciones</p>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${
                    comparacion.variacion.recolecciones >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparacion.variacion.recolecciones >= 0 ? '↑' : '↓'} {Math.abs(comparacion.variacion.recolecciones).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {comparacion.periodo2.total_recolecciones - comparacion.periodo1.total_recolecciones >= 0 ? '+' : ''}
                  {comparacion.periodo2.total_recolecciones - comparacion.periodo1.total_recolecciones} recolecciones
                </p>
              </div>

              {/* Variación Kilos */}
              <div className={`p-4 rounded-lg border ${
                comparacion.variacion.kilos >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
              }`}>
                <p className="text-sm text-gray-600 mb-2">Variación en Kilos</p>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${
                    comparacion.variacion.kilos >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparacion.variacion.kilos >= 0 ? '↑' : '↓'} {Math.abs(comparacion.variacion.kilos).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {comparacion.periodo2.total_kilos - comparacion.periodo1.total_kilos >= 0 ? '+' : ''}
                  {(comparacion.periodo2.total_kilos - comparacion.periodo1.total_kilos).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                </p>
              </div>

              {/* Variación CO2 */}
              <div className={`p-4 rounded-lg border ${
                comparacion.variacion.co2 >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
              }`}>
                <p className="text-sm text-gray-600 mb-2">Variación en CO2</p>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${
                    comparacion.variacion.co2 >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparacion.variacion.co2 >= 0 ? '↑' : '↓'} {Math.abs(comparacion.variacion.co2).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {comparacion.periodo2.co2_evitado - comparacion.periodo1.co2_evitado >= 0 ? '+' : ''}
                  {((comparacion.periodo2.co2_evitado - comparacion.periodo1.co2_evitado) / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })} Ton
                </p>
              </div>

            </div>
          </div>

          {/* Comparativa de Kilos - Cards con barras */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativa de Kilos Totales</h3>
            <div className="space-y-4">
              {/* Periodo 1 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-700">Periodo 1</span>
                  <span className="text-xl font-bold text-blue-600">
                    {comparacion.periodo1.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ 
                      width: `${(comparacion.periodo1.total_kilos / Math.max(comparacion.periodo1.total_kilos, comparacion.periodo2.total_kilos)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Periodo 2 */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-purple-700">Periodo 2</span>
                  <span className="text-xl font-bold text-purple-600">
                    {comparacion.periodo2.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-4">
                  <div 
                    className="bg-purple-600 h-4 rounded-full"
                    style={{ 
                      width: `${(comparacion.periodo2.total_kilos / Math.max(comparacion.periodo1.total_kilos, comparacion.periodo2.total_kilos)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparativa por Material - Cards con barras */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativa por Material (Top 5)</h3>
            <div className="space-y-4">
              {materialesComparados.map((material, index) => {
                const maxKilos = Math.max(material.periodo1_kilos, material.periodo2_kilos);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{EMOJI_MAP[material.nombre] || '♻️'}</span>
                      <span className="font-semibold text-gray-700">{material.nombre}</span>
                    </div>
                    
                    {/* Periodo 1 */}
                    <div className="pl-7">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-blue-600">Periodo 1</span>
                        <span className="text-sm font-bold text-blue-600">
                          {material.periodo1_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                        </span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(material.periodo1_kilos / maxKilos) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Periodo 2 */}
                    <div className="pl-7">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-purple-600">Periodo 2</span>
                        <span className="text-sm font-bold text-purple-600">
                          {material.periodo2_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                        </span>
                      </div>
                      <div className="w-full bg-purple-100 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(material.periodo2_kilos / maxKilos) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla Comparativa */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Materiales - Tabla Comparativa</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Material</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-blue-700 bg-blue-50">Periodo 1 (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-purple-700 bg-purple-50">Periodo 2 (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materialesComparados.map((material, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{EMOJI_MAP[material.nombre] || '♻️'}</span>
                          <span className="font-medium text-gray-800">{material.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700 bg-blue-50">
                        {material.periodo1_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-700 bg-purple-50">
                        {material.periodo2_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          material.variacion >= 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {material.variacion >= 0 ? '↑' : '↓'} {Math.abs(material.variacion).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Estado vacío */}
      {!comparacion && !loading && (
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Comparación de Periodos</h3>
          <p className="text-gray-500">
            Selecciona los filtros y presiona "Comparar Periodos" para ver el análisis
          </p>
        </div>
      )}

    </div>
  );
};

export default GraficaPorLugar;