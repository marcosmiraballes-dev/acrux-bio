import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { generateResiduosTotalesHTML } from '../utils/generateResiduosTotalesHTML';

// Interfaces
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

interface Plaza {
  id: string;
  nombre: string;
}

interface Local {
  id: string;
  nombre: string;
  plaza_id: string;
}

// Colores para gráficas
const COLORS_CHART = [
  '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F97316', '#06B6D4', '#84CC16', '#6366F1', '#EF4444'
];

// Emojis por tipo de residuo
const EMOJI_RESIDUOS: { [key: string]: string } = {
  'Orgánico': '🍃',
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

const ResiduosTotales: React.FC = () => {
  // Estados
  const [stats, setStats] = useState<Stats>({ total_recolecciones: 0, total_kilos: 0, co2_evitado: 0 });
  const [statsByTipo, setStatsByTipo] = useState<StatsByTipo[]>([]);
  
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);
  
  const [plazaId, setPlazaId] = useState<string>('');
  const [localId, setLocalId] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlazasYLocales();
  }, []);

  useEffect(() => {
    if (plazaId) {
      const filtrados = locales.filter(l => l.plaza_id === plazaId);
      setLocalesFiltrados(filtrados);
      setLocalId('');
    } else {
      setLocalesFiltrados([]);
      setLocalId('');
    }
  }, [plazaId, locales]);

  useEffect(() => {
    if (plazas.length > 0) {
      loadAllData();
    }
  }, [plazas]);

  const loadPlazasYLocales = async () => {
    try {
      const [plazasRes, localesRes] = await Promise.all([
        api.get('/plazas'),
        api.get('/locales')
      ]);
      
      setPlazas(plazasRes.data.data || []);
      setLocales(localesRes.data.data || []);
    } catch (err) {
      console.error('Error cargando plazas/locales:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {};
      if (plazaId) filters.plaza_id = plazaId;
      if (localId) filters.local_id = localId;
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;

      const [statsRes, tiposRes] = await Promise.all([
        api.get('/recolecciones/stats/general', { params: filters }),
        api.get('/recolecciones/stats/tipo', { params: filters })
      ]);

      setStats(statsRes.data.data || { total_recolecciones: 0, total_kilos: 0, co2_evitado: 0 });
      setStatsByTipo(tiposRes.data.data || []);

    } catch (err: any) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    loadAllData();
  };

  const handleLimpiarFiltros = () => {
    setPlazaId('');
    setLocalId('');
    setFechaDesde('');
    setFechaHasta('');
    setTimeout(() => loadAllData(), 100);
  };

  const handleExportarPDF = () => {
    const plazaSeleccionada = plazas.find(p => p.id === plazaId);
    const localSeleccionado = locales.find(l => l.id === localId);

    generateResiduosTotalesHTML({
      stats,
      statsByTipo,
      plazaSeleccionada: plazaSeleccionada?.nombre,
      localSeleccionado: localSeleccionado?.nombre
    });
  };

  // Calcular métricas
  const arbolesEquivalentes = Math.round((stats.co2_evitado / 1000) * 45);
  const kwh = Math.round((stats.co2_evitado / 1000) * 4500);
  const kmAuto = Math.round((stats.co2_evitado / 1000) * 4500);

  // Obtener nombre de plaza/local seleccionado
  const plazaSeleccionada = plazas.find(p => p.id === plazaId);
  const localSeleccionado = locales.find(l => l.id === localId);
  
  const nombreMostrar = localSeleccionado 
    ? `${plazaSeleccionada?.nombre} - ${localSeleccionado.nombre}`
    : plazaSeleccionada?.nombre || 'Todas las plazas';

  // Preparar TODOS los materiales (11) para el grid
  const todosMateriales = statsByTipo.slice(0, 11);

  // Preparar datos para PieChart
  const datosPieChart = statsByTipo.slice(0, 11).map(item => ({
    name: item.tipo_residuo_nombre,
    value: item.total_kilos
  }));

  if (loading && plazas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      
      {/* LOGO ELEFANTES VERDES */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <img 
            src="/logo.png" 
            alt="Elefantes Verdes" 
            className="h-20 object-contain"
          />
        </div>
      </div>

      {/* HEADER MOTIVACIONAL */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-primary-800 mb-3">🌍 TU IMPACTO AMBIENTAL</h1>
        <p className="text-2xl text-primary-700">Juntos estamos salvando el planeta</p>
        <p className="text-xl text-gray-700 mt-2 font-semibold">{nombreMostrar}</p>
      </div>

      {/* FILTROS */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Plaza</label>
            <select value={plazaId} onChange={(e) => setPlazaId(e.target.value)} className="input">
              <option value="">Todas las plazas</option>
              {plazas.map(plaza => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Fecha Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Fecha Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex space-x-4">
          <button onClick={handleAplicarFiltros} className="btn btn-primary">
            Aplicar Filtros
          </button>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary">
            Limpiar
          </button>
          <button 
            onClick={handleExportarPDF}
            disabled={loading}
            className="btn bg-red-600 hover:bg-red-700 text-white"
          >
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500 text-white rounded-2xl p-4 mb-6 text-center">
          ⚠️ {error}
        </div>
      )}

      {/* 4 KPIs GRANDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI 1: Árboles */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center transform hover:scale-105 transition-transform">
          <div className="text-5xl mb-3">🌳</div>
          <p className="text-3xl font-bold text-emerald-700 mb-2">
            {arbolesEquivalentes.toLocaleString('es-MX')}
          </p>
          <p className="text-sm text-gray-600 font-medium">Árboles Plantados</p>
          <p className="text-xs text-gray-500 mt-1">Equivalente de CO₂</p>
        </div>

        {/* KPI 2: CO₂ */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center transform hover:scale-105 transition-transform">
          <div className="text-5xl mb-3">🌍</div>
          <p className="text-3xl font-bold text-blue-600 mb-2">
            {(stats.co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })}
          </p>
          <p className="text-sm text-gray-600 font-medium">Toneladas de CO₂</p>
          <p className="text-xs text-gray-500 mt-1">Evitadas</p>
        </div>

        {/* KPI 3: Kilos */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center transform hover:scale-105 transition-transform">
          <div className="text-5xl mb-3">⚖️</div>
          <p className="text-3xl font-bold text-purple-600 mb-2">
            {stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-600 font-medium">Kilos Reciclados</p>
          <p className="text-xs text-gray-500 mt-1">En total</p>
        </div>

        {/* KPI 4: Recolecciones */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center transform hover:scale-105 transition-transform">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-3xl font-bold text-orange-600 mb-2">
            {stats.total_recolecciones.toLocaleString('es-MX')}
          </p>
          <p className="text-sm text-gray-600 font-medium">Recolecciones</p>
          <p className="text-xs text-gray-500 mt-1">Realizadas</p>
        </div>

      </div>

      {/* FILA: GRÁFICA PIE + TABLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfica Distribución */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">📊 Distribución de Materiales</h3>
          {datosPieChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={datosPieChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {datosPieChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Tabla de Materiales */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">♻️ Materiales Recolectados</h3>
          <div className="overflow-y-auto max-h-[350px]">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Material</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Kilos</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statsByTipo.slice(0, 11).map((material, index) => {
                  const porcentaje = ((material.total_kilos / stats.total_kilos) * 100).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{EMOJI_RESIDUOS[material.tipo_residuo_nombre] || '♻️'}</span>
                          <span className="text-sm font-medium text-gray-800">{material.tipo_residuo_nombre}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-bold" style={{ color: COLORS_CHART[index] }}>
                        {material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-600">
                        {porcentaje}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* GRID 11 MATERIALES */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">📦 Todos los Materiales</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {todosMateriales.map((material, index) => {
            const colores = [
              'from-green-50 to-green-100 border-green-200 text-green-700',
              'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
              'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
              'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
              'from-pink-50 to-pink-100 border-pink-200 text-pink-700',
              'from-teal-50 to-teal-100 border-teal-200 text-teal-700',
              'from-red-50 to-red-100 border-red-200 text-red-700',
              'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
              'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
              'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-700',
              'from-lime-50 to-lime-100 border-lime-200 text-lime-700'
            ];

            return (
              <div key={index} className={`bg-gradient-to-br ${colores[index % 11]} rounded-lg p-3 border-2`}>
                <div className="text-3xl mb-1 text-center">
                  {EMOJI_RESIDUOS[material.tipo_residuo_nombre] || '♻️'}
                </div>
                <p className="text-xs font-semibold text-gray-700 text-center truncate">
                  {material.tipo_residuo_nombre}
                </p>
                <p className="text-lg font-bold text-center">
                  {material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-center text-gray-600">kg</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* EQUIVALENCIAS AMBIENTALES */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">🌟 Equivalencias Ambientales</h3>
        <p className="text-center text-gray-600 mb-8">Tu reciclaje equivale a...</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Equivalencia 1 */}
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-300">
            <div className="text-7xl mb-4">🌳</div>
            <p className="text-4xl font-bold text-emerald-700 mb-2">
              {arbolesEquivalentes.toLocaleString('es-MX')}
            </p>
            <p className="text-lg font-semibold text-gray-700">Árboles plantados</p>
            <p className="text-sm text-gray-600 mt-2">durante un año completo</p>
          </div>

          {/* Equivalencia 2 */}
          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300">
            <div className="text-7xl mb-4">💡</div>
            <p className="text-4xl font-bold text-yellow-700 mb-2">
              {kwh.toLocaleString('es-MX')}
            </p>
            <p className="text-lg font-semibold text-gray-700">kWh de energía</p>
            <p className="text-sm text-gray-600 mt-2">suficiente para 50 casas/año</p>
          </div>

          {/* Equivalencia 3 */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300">
            <div className="text-7xl mb-4">🚗</div>
            <p className="text-4xl font-bold text-blue-700 mb-2">
              {kmAuto.toLocaleString('es-MX')}
            </p>
            <p className="text-lg font-semibold text-gray-700">Km evitados en auto</p>
            <p className="text-sm text-gray-600 mt-2">~{Math.round(kmAuto / 40000)} vueltas al mundo</p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ResiduosTotales;