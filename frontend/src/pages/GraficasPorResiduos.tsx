import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { generateGraficasResiduosHTML } from '../utils/generateGraficasResiduosHTML';

interface Plaza {
  id: string;
  nombre: string;
}

interface Stats {
  total_recolecciones: number;
  total_kilos: number;
  co2_evitado: number;
}

interface StatsByTipo {
  tipo_residuo_id: string;
  tipo_residuo_nombre: string;
  total_kilos: number;
  co2_evitado: number;
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
  'Tetra Pak': '🧃',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

// Colores para PieChart y grid
const COLORS_CHART = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#6366F1'
];

const GraficasPorResiduos: React.FC = () => {
  const { user } = useAuth();
  
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  const [stats, setStats] = useState<Stats>({
    total_recolecciones: 0,
    total_kilos: 0,
    co2_evitado: 0
  });
  
  const [statsByTipo, setStatsByTipo] = useState<StatsByTipo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlazas();
    loadStats();
  }, []);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (selectedPlaza) params.plaza_id = selectedPlaza;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const [statsResponse, statsByTipoResponse] = await Promise.all([
        api.get('/recolecciones/stats/general', { params }),
        api.get('/recolecciones/stats/tipo', { params })
      ]);

      setStats(statsResponse.data.data || {
        total_recolecciones: 0,
        total_kilos: 0,
        co2_evitado: 0
      });

      const tipos = statsByTipoResponse.data.data || [];
      setStatsByTipo(tipos.sort((a: StatsByTipo, b: StatsByTipo) => b.total_kilos - a.total_kilos));

    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    loadStats();
  };

  const handleLimpiarFiltros = () => {
    setSelectedPlaza('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const handleExportarPDF = () => {
    const plazaSeleccionada = plazas.find(p => p.id === selectedPlaza);
    const nombrePlaza = plazaSeleccionada ? plazaSeleccionada.nombre : 'Todas las Plazas';
    
    generateGraficasResiduosHTML({
      stats,
      statsByTipo,
      plazaSeleccionada: nombrePlaza,
      userName: user?.nombre
    });
  };

  // Datos para PieChart (Recharts requiere formato específico)
  const pieData = statsByTipo.map(tipo => ({
    name: tipo.tipo_residuo_nombre,
    value: tipo.total_kilos
  }));

  // Calcular porcentajes para tabla
  const totalKilos = stats.total_kilos;
  const materialesConPorcentaje = statsByTipo.map(m => ({
    ...m,
    porcentaje: totalKilos > 0 ? ((m.total_kilos / totalKilos) * 100).toFixed(1) : '0.0'
  }));

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Gráficas por Residuo</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.nombre} - Análisis Detallado por Tipo de Material
        </p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <label className="label">Fecha Desde</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
              className="input"
              disabled={loading}
            />
          </div>

          <div>
            <label className="label">Fecha Hasta</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
              className="input"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={handleAplicarFiltros}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Cargando...' : 'Aplicar Filtros'}
          </button>
          <button 
            onClick={handleLimpiarFiltros}
            disabled={loading}
            className="btn btn-secondary"
          >
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

      {/* Contenido */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-4">Cargando estadísticas...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Distribución por Tipo - PieChart + Tabla */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📊 Distribución por Tipo de Material
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* PieChart */}
              <div>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => value.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' kg'}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla de Datos */}
              <div className="overflow-auto max-h-[400px]">
                <table className="min-w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Material</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Kilos</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {materialesConPorcentaje.map((material, index) => (
                      <tr key={material.tipo_residuo_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS_CHART[index % COLORS_CHART.length] }}
                          ></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{EMOJI_MAP[material.tipo_residuo_nombre] || '♻️'}</span>
                            <span className="font-medium text-gray-800">{material.tipo_residuo_nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                            {material.porcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Impacto Ambiental */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🌍 Impacto Ambiental</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-300">
                <p className="text-sm text-blue-700 mb-2">CO2 Evitado Total</p>
                <p className="text-3xl font-bold text-blue-600">
                  {(stats.co2_evitado / 1000).toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">toneladas</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-300">
                <p className="text-sm text-green-700 mb-2">Total Kilos Procesados</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-green-600 mt-1">kilogramos</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-2 border-purple-300">
                <p className="text-sm text-purple-700 mb-2">Total Recolecciones</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.total_recolecciones.toLocaleString('es-MX')}
                </p>
                <p className="text-xs text-purple-600 mt-1">visitas</p>
              </div>
            </div>
          </div>

          {/* Grid de Detalle de Materiales */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ♻️ Detalle por Material
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {statsByTipo.map((tipo, index) => {
                const porcentaje = totalKilos > 0 
                  ? ((tipo.total_kilos / totalKilos) * 100).toFixed(1) 
                  : '0.0';
                const color = COLORS_CHART[index % COLORS_CHART.length];

                return (
                  <div 
                    key={tipo.tipo_residuo_id}
                    className="bg-white border-2 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    style={{ borderColor: color }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {EMOJI_MAP[tipo.tipo_residuo_nombre] || '♻️'}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-2">
                        {tipo.tipo_residuo_nombre}
                      </h3>
                      <p className="text-2xl font-bold mb-1" style={{ color }}>
                        {tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">kg</p>
                      <p className="text-sm font-medium text-gray-500">
                        {porcentaje}% del total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default GraficasPorResiduos;