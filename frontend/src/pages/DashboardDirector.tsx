import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
// ✅ NUEVO: Import para PDF construido con código
import { generateDirectorHTML } from '../utils/generateDirectorHTML';

// Interfaces - SIN arboles_equivalentes
interface Stats {
  total_recolecciones: number;
  total_kilos: number;
  co2_evitado: number;
}

interface StatsByTipo {
  tipo_residuo_nombre: string;
  total_kilos: number;
  co2_evitado: number;
}

interface TendenciaMensual {
  mes: string;
  total_kilos: number;
  co2_evitado: number;
}

interface ComparativaPlazas {
  plaza_nombre: string;
  total_recolecciones: number;
  total_kilos: number;
  co2_evitado: number;
}

interface TopLocal {
  local_nombre: string;
  plaza_nombre: string;
  total_kilos: number;
  co2_evitado: number;
}

interface Comparativa {
  mes_actual_total_recolecciones?: number;
  mes_actual_total_kilos?: number;
  mes_actual_co2_evitado?: number;
  mes_anterior_total_recolecciones?: number;
  mes_anterior_total_kilos?: number;
  mes_anterior_co2_evitado?: number;
  anio_actual_total_recolecciones?: number;
  anio_actual_total_kilos?: number;
  anio_actual_co2_evitado?: number;
  anio_anterior_total_recolecciones?: number;
  anio_anterior_total_kilos?: number;
  anio_anterior_co2_evitado?: number;
  trimestre_actual_total_recolecciones?: number;
  trimestre_actual_total_kilos?: number;
  trimestre_actual_co2_evitado?: number;
  trimestre_anterior_total_recolecciones?: number;
  trimestre_anterior_total_kilos?: number;
  trimestre_anterior_co2_evitado?: number;
  variacion_recolecciones?: number;
  variacion_kilos?: number;
  variacion_co2?: number;
}

interface Plaza {
  id: string;
  nombre: string;
}

// ✅ CORREGIDO: Mapeo de emojis con Vidrio y Tetra Pak correctos
const EMOJI_MAP: { [key: string]: string } = {
  'Orgánico': '🍌',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🍷',
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '🧃',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

// Colores para gráficas
const COLORS_CHART = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#6366F1'
];

const DashboardDirector: React.FC = () => {
  const { user } = useAuth();
  
  // Estados
  const [stats, setStats] = useState<Stats>({ total_recolecciones: 0, total_kilos: 0, co2_evitado: 0 });
  const [statsByTipo, setStatsByTipo] = useState<StatsByTipo[]>([]);
  const [tendencia, setTendencia] = useState<TendenciaMensual[]>([]);
  const [comparativaPlazas, setComparativaPlazas] = useState<ComparativaPlazas[]>([]);
  const [topLocales, setTopLocales] = useState<TopLocal[]>([]);
  const [comparativaMensual, setComparativaMensual] = useState<Comparativa | null>(null);
  const [comparativaAnual, setComparativaAnual] = useState<Comparativa | null>(null);
  const [comparativaTrimestral, setComparativaTrimestral] = useState<Comparativa | null>(null);
  
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    loadPlazas();
    loadAllData();
  }, []);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const filters: any = {};
      if (selectedPlaza) filters.plaza_id = selectedPlaza;
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;

      // DEBUG: Ver qué filtros se están enviando
      console.log('🔍 Filtros enviados:', filters);

      const [
        statsRes,
        tiposRes,
        tendenciaRes,
        plazasRes,
        localesRes,
        compMensualRes,
        compAnualRes,
        compTrimestreRes
      ] = await Promise.all([
        api.get('/recolecciones/stats/general', { params: filters }),
        api.get('/recolecciones/stats/tipo', { params: filters }),
        api.get('/recolecciones/stats/tendencia-mensual', { params: filters }),
        api.get('/recolecciones/stats/comparativa-plazas', { params: filters }),
        api.get('/recolecciones/stats/top-locales', { params: filters }),
        api.get('/recolecciones/stats/comparativa-mensual', { params: filters }),
        api.get('/recolecciones/stats/comparativa-anual', { params: filters }),
        api.get('/recolecciones/stats/comparativa-trimestral', { params: filters })
      ]);

      setStats(statsRes.data.data || { total_recolecciones: 0, total_kilos: 0, co2_evitado: 0 });
      setStatsByTipo(tiposRes.data.data || []);
      setTendencia(tendenciaRes.data.data || []);
      setComparativaPlazas(plazasRes.data.data || []);
      setTopLocales(localesRes.data.data || []);
      setComparativaMensual(compMensualRes.data.data || null);
      setComparativaAnual(compAnualRes.data.data || null);
      setComparativaTrimestral(compTrimestreRes.data.data || null);

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    loadAllData();
  };

  const handleLimpiarFiltros = () => {
    setSelectedPlaza('');
    setFechaDesde('');
    setFechaHasta('');
    setTimeout(() => loadAllData(), 100);
  };

  // ✅ NUEVO: Función para exportar a PDF (construido con código)
  const handleExportarPDF = () => {
    const plazaSeleccionada = plazas.find(p => p.id === selectedPlaza);
    const nombrePlaza = plazaSeleccionada ? plazaSeleccionada.nombre : 'Todas las Plazas';
    
    generateDirectorHTML({
      stats,
      statsByTipo,
      tendencia,
      comparativaPlazas,
      topLocales,
      comparativaMensual,
      comparativaAnual,
      comparativaTrimestral,
      plazaSeleccionada: nombrePlaza,
      userName: user?.nombre
    });
  };

  if (loading && !stats.total_recolecciones) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Dashboard Ejecutivo</h1>
        <p className="text-gray-600 mt-1">Bienvenida, {user?.nombre} - Panel de Control y Análisis</p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
        </div>
        
        {/* Fila 1: Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Plaza</label>
            <select 
              value={selectedPlaza} 
              onChange={(e) => setSelectedPlaza(e.target.value)} 
              className="input"
            >
              <option value="">Todas las plazas</option>
              {plazas.filter(p => p.nombre).map((plaza) => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Fecha Desde</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
              className="input"
            />
          </div>

          <div>
            <label className="label">Fecha Hasta</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
              className="input"
            />
          </div>
        </div>

        {/* Fila 2: Botones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={handleAplicarFiltros} className="btn btn-primary w-full">
            Aplicar Filtros
          </button>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary w-full">
            Limpiar Filtros
          </button>
          <button 
            onClick={handleExportarPDF} 
            className="btn bg-red-600 hover:bg-red-700 text-white w-full"
            title="Descargar Dashboard en PDF"
          >
            📄 Descargar PDF
          </button>
        </div>
      </div>

      {/* ✅ NUEVO: Wrapper con ID para capturar */}
      <div id="dashboard-content">
        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Resumen General
            </button>

            <button
              onClick={() => setActiveTab('comparativas')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'comparativas'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📈 Comparativas
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'rankings'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏆 Rankings
            </button>
          </div>
        </div>

        {/* TAB: RESUMEN GENERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs - SOLO 3 TARJETAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Recolecciones</h3>
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-3xl font-bold text-primary-600">
                  {(stats?.total_recolecciones || 0).toLocaleString('es-MX')}
                </p>
              </div>

              <div className="card bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Kilos</h3>
                  <span className="text-3xl">⚖️</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {(stats?.total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">kilogramos</p>
              </div>

              <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">CO₂ Evitado</h3>
                  <span className="text-3xl">🌍</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {((stats?.co2_evitado || 0) / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">toneladas</p>
              </div>
            </div>

            {/* ✅ CORREGIDO: Grid de Materiales - AHORA MUESTRA LOS 11 COMPLETOS */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">♻️ Materiales Recolectados</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {statsByTipo.slice(0, 11).map((tipo) => (
                  <div key={tipo.tipo_residuo_nombre} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-3xl">{EMOJI_MAP[tipo.tipo_residuo_nombre] || '♻️'}</span>
                      <h3 className="text-sm font-semibold text-gray-700">{tipo.tipo_residuo_nombre}</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">
                      {(tipo.total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualizaciones */}
            <div className="grid grid-cols-1 gap-6">
              {/* Tendencia Mensual - BARCHART VERTICAL */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">📈 Tendencia Mensual (Últimos 6 Meses)</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={[...tendencia].slice(0, 6).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`} />
                    <Legend />
                    <Bar dataKey="total_kilos" fill="#10B981" name="Kilos Recolectados" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparativa por Plaza - PIE CHART */}
              <div className="card" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">🏢 Distribución por Plaza</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={[...comparativaPlazas].sort((a, b) => (b.total_kilos || 0) - (a.total_kilos || 0))}
                      dataKey="total_kilos"
                      nameKey="plaza_nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ plaza_nombre, total_kilos }) => 
                        `${plaza_nombre}: ${(total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`
                      }
                    >
                      {comparativaPlazas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 Locales */}
            <div className="card" style={{ pageBreakInside: 'avoid' }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🏆 Top 10 Locales</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">Posición</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Local</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plaza</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">Total Kilos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">CO₂ Evitado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topLocales.map((local, index) => (
                      <tr 
                        key={index} 
                        className={`${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className="px-4 py-4 text-center">
                          <span className="text-3xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                          </span>
                          <span className={`ml-2 text-lg font-bold ${index < 3 ? 'text-yellow-700' : 'text-gray-500'}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-800 text-base">{local.local_nombre}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600 text-sm">{local.plaza_nombre}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-primary-600 text-base">
                            {(local.total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">kg</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-gray-700 font-medium text-sm">
                            {(local.co2_evitado || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">kg</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COMPARATIVAS */}
        {activeTab === 'comparativas' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Análisis Comparativo Temporal</h2>

            {/* Comparativa Mensual */}
            {comparativaMensual && (
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">📅</span>
                  <h3 className="text-xl font-semibold text-gray-800">Comparativa Mensual</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mes Actual</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(comparativaMensual.mes_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mes Anterior</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {(comparativaMensual.mes_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Variación</p>
                    <p className={`text-2xl font-bold ${(comparativaMensual.variacion_kilos || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(comparativaMensual.variacion_kilos || 0) >= 0 ? '↑' : '↓'} {Math.abs(comparativaMensual.variacion_kilos || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparativa Anual */}
            {comparativaAnual && (
              <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">📆</span>
                  <h3 className="text-xl font-semibold text-gray-800">Comparativa Anual</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Año Actual</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(comparativaAnual.anio_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Año Anterior</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {(comparativaAnual.anio_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Variación</p>
                    <p className={`text-2xl font-bold ${(comparativaAnual.variacion_kilos || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(comparativaAnual.variacion_kilos || 0) >= 0 ? '↑' : '↓'} {Math.abs(comparativaAnual.variacion_kilos || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparativa Trimestral */}
            {comparativaTrimestral && (
              <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">📊</span>
                  <h3 className="text-xl font-semibold text-gray-800">Comparativa Trimestral</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trimestre Actual</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(comparativaTrimestral.trimestre_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Trimestre Anterior</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {(comparativaTrimestral.trimestre_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Variación</p>
                    <p className={`text-2xl font-bold ${(comparativaTrimestral.variacion_kilos || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(comparativaTrimestral.variacion_kilos || 0) >= 0 ? '↑' : '↓'} {Math.abs(comparativaTrimestral.variacion_kilos || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: RANKINGS */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            {/* Top 10 Locales */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🏆 Top 10 Locales Más Productivos</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">Posición</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Local</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plaza</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">Total Kilos</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">CO₂ Evitado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topLocales.map((local, index) => (
                      <tr 
                        key={index} 
                        className={`${index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className="px-4 py-4 text-center">
                          <span className="text-3xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                          </span>
                          <span className={`ml-2 text-lg font-bold ${index < 3 ? 'text-yellow-700' : 'text-gray-500'}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-800 text-base">{local.local_nombre}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600 text-sm">{local.plaza_nombre}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-primary-600 text-base">
                            {(local.total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">kg</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-gray-700 font-medium text-sm">
                            {(local.co2_evitado || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">kg</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales por Plaza */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">🏢 Totales por Plaza</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[...comparativaPlazas]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="plaza_nombre" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_kilos" fill="#047857" name="Kilos" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top 5 Materiales */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">♻️ Top 5 Materiales</h2>
              <div className="space-y-3">
                {statsByTipo.slice(0, 5).map((tipo, index) => (
                  <div key={tipo.tipo_residuo_nombre} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <span className="text-3xl">{EMOJI_MAP[tipo.tipo_residuo_nombre] || '♻️'}</span>
                      <span className="font-semibold text-gray-700">{tipo.tipo_residuo_nombre}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">
                        {(tipo.total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                      </p>
                      <p className="text-sm text-gray-500">
                        {(((tipo.total_kilos || 0) / (stats?.total_kilos || 1)) * 100).toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardDirector;