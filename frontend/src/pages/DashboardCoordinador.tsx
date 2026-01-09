import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { generateCoordinadorHTML } from '../utils/generateCoordinadorHTML';

// Interfaces
interface Stats {
  total_recolecciones: number;
  total_kilos: number;
  total_co2_evitado: number;
}

interface StatsByTipo {
  tipo_residuo: string;
  total_kilos: number;
  total_co2_evitado: number;
}

interface Plaza {
  id: string;
  nombre: string;
}

interface Recoleccion {
  id: string;
  fecha_recoleccion: string;
  local_nombre: string;
  plaza_nombre: string;
  brigadista_nombre: string;
  total_kilos: number;
  total_co2_evitado: number;
  created_at: string;
}

interface TopLocal {
  local_nombre: string;
  plaza_nombre: string;
  total_kilos: number;
  total_co2_evitado: number;
}

const DashboardCoordinador: React.FC = () => {
  const { user } = useAuth();
  
  // Estados
  const [stats, setStats] = useState<Stats>({ total_recolecciones: 0, total_kilos: 0, total_co2_evitado: 0 });
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [statsByTipo, setStatsByTipo] = useState<StatsByTipo[]>([]);
  const [recoleccionesRecientes, setRecoleccionesRecientes] = useState<Recoleccion[]>([]);
  const [topLocales, setTopLocales] = useState<TopLocal[]>([]);
  const [totalRecolecciones, setTotalRecolecciones] = useState<number>(0);
  
  // Filtros
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlazas();
  }, []);

  useEffect(() => {
    if (plazas.length > 0) {
      loadAllData();
    }
  }, [plazas]);

  useEffect(() => {
    if (plazas.length > 0) {
      loadRecoleccionesRecientes();
    }
  }, [currentPage, selectedPlaza]);

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
      
      const params: any = {};
      if (selectedPlaza) params.plaza_id = selectedPlaza;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const [
        statsRes,
        tiposRes,
        localesRes,
        countRes
      ] = await Promise.all([
        api.get('/coordinador/stats/general', { params }),
        api.get('/coordinador/stats/tipo', { params }),
        api.get('/coordinador/stats/top-locales', { params }),
        api.get('/coordinador/recolecciones/count', { params })
      ]);

      setStats(statsRes.data.data || { total_recolecciones: 0, total_kilos: 0, total_co2_evitado: 0 });
      setStatsByTipo(tiposRes.data.data || []);
      setTopLocales(localesRes.data.data || []);
      setTotalRecolecciones(countRes.data.data || 0);

      await loadRecoleccionesRecientes();

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecoleccionesRecientes = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const params: any = {
        limit: itemsPerPage,
        offset: offset
      };
      if (selectedPlaza) params.plaza_id = selectedPlaza;

      const response = await api.get('/coordinador/recolecciones/recientes', { params });
      setRecoleccionesRecientes(response.data.data || []);
    } catch (err: any) {
      console.error('Error cargando recolecciones recientes:', err);
    }
  };

  const handleAplicarFiltros = () => {
    setCurrentPage(1);
    loadAllData();
  };

  const handleLimpiarFiltros = () => {
    setSelectedPlaza('');
    setFechaDesde('');
    setFechaHasta('');
    setCurrentPage(1);
    setTimeout(() => loadAllData(), 100);
  };

  const handleExportarPDF = () => {
    const plazaSeleccionada = plazas.find(p => p.id === selectedPlaza);
    const nombrePlaza = plazaSeleccionada ? plazaSeleccionada.nombre : 'Todas las Plazas';
    
    generateCoordinadorHTML({
      stats,
      statsByTipo,
      topLocales,
      recoleccionesRecientes,
      plazaSeleccionada: nombrePlaza,
      userName: user?.nombre
    });
  };

  const calcularArbolesEquivalentes = (co2Kg: number): number => {
    return Math.round((co2Kg / 1000) * 45);
  };

  const totalPages = Math.ceil(totalRecolecciones / itemsPerPage);

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
      {/* Desktop - Header grande */}
      <div className="hidden sm:block">
        <h1 className="text-3xl font-bold text-gray-800">📊 Dashboard Coordinador</h1>
        <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre} - Panel de Control Operativo</p>
      </div>
      
      {/* Mobile - Header compacto */}
      <div className="block sm:hidden">
        <h1 className="text-lg font-bold text-gray-800">📊 Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">{user?.nombre}</p>
      </div>
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
              {plazas.map((plaza) => (
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

      {/* KPIs */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Resumen Ejecutivo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Recolecciones</h3>
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats.total_recolecciones.toLocaleString('es-MX')}</p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Kilos</h3>
              <span className="text-3xl">⚖️</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">kilogramos</p>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">CO₂ Evitado</h3>
              <span className="text-3xl">🌍</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {(stats.total_co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">toneladas</p>
          </div>

          <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Árboles Equiv.</h3>
              <span className="text-3xl">🌳</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {calcularArbolesEquivalentes(stats.total_co2_evitado).toLocaleString('es-MX')}
            </p>
            <p className="text-sm text-gray-500 mt-1">árboles</p>
          </div>
        </div>

        {/* Top 5 Materiales */}
        {statsByTipo.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">♻️ Top 5 Materiales</h3>
            <div className="space-y-3">
              {statsByTipo.slice(0, 5).map((tipo, index) => (
                <div key={tipo.tipo_residuo} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                      <span className="font-semibold text-gray-800">{tipo.tipo_residuo}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.total_kilos > 0 ? ((tipo.total_kilos / stats.total_kilos) * 100).toFixed(1) : 0}% del total
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista Operativa */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📝 Recolecciones Recientes</h2>
          <button 
            className="btn btn-secondary text-sm"
            onClick={() => window.location.href = '/reportes'}
          >
            📋 Generar Bitácora
          </button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '28%'}}>Local</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '22%'}}>Plaza</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '18%'}}>Capturador</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">Kilos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">CO₂ Evitado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recoleccionesRecientes.length > 0 ? (
                  recoleccionesRecientes.map((recoleccion) => (
                    <tr key={recoleccion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(recoleccion.fecha_recoleccion + 'T00:00:00').toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{recoleccion.local_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{recoleccion.plaza_nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{recoleccion.brigadista_nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        {recoleccion.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {recoleccion.total_co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay recolecciones recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecolecciones)} de {totalRecolecciones} recolecciones
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 10 Locales */}
      {topLocales.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">🏆 Top 10 Locales Más Productivos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Posición</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '38%'}}>Local</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '28%'}}>Plaza</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Kilos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">CO₂ Evitado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topLocales.map((local, index) => (
                  <tr key={index} className={index < 3 ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-center">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                      </span>
                      {index > 2 && <span className="text-sm font-semibold text-gray-600">#{index + 1}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{local.local_nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{local.plaza_nombre}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      {local.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {local.total_co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card bg-red-50 border border-red-200 mt-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default DashboardCoordinador;