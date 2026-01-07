// frontend/src/pages/LogsAuditoria.tsx

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Log {
  id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_rol: string;
  accion: string;
  modulo: string;
  descripcion: string;
  ip_address: string;
  created_at: string;
}

interface Stats {
  total_logs: string;
  logs_hoy: string;
  logs_mes: string;
  accion_mas_comun: string;
  modulo_mas_usado: string;
  usuario_mas_activo: string;
}

const LogsAuditoria: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    accion: '',
    modulo: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Cargar estadísticas al montar
  useEffect(() => {
    fetchStats();
  }, []);

  // Cargar logs cuando cambian filtros u offset
  useEffect(() => {
    fetchLogs();
  }, [offset]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/logs-auditoria/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.accion) params.append('accion', filtros.accion);
      if (filtros.modulo) params.append('modulo', filtros.modulo);
      if (filtros.fecha_desde) params.append('fecha_desde', filtros.fecha_desde);
      if (filtros.fecha_hasta) params.append('fecha_hasta', filtros.fecha_hasta);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await api.get(`/logs-auditoria?${params}`);
      setLogs(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    setOffset(0); // Reset a primera página
    fetchLogs();
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' });
    setOffset(0);
    setTimeout(() => fetchLogs(), 100);
  };

  const handleLimpiarLogsAntiguos = async () => {
    if (!window.confirm('¿Estás seguro de eliminar logs con más de 1 año de antigüedad?')) {
      return;
    }

    try {
      const response = await api.post('/logs-auditoria/limpiar');
      alert(response.data.message);
      fetchLogs();
      fetchStats();
    } catch (error: any) {
      console.error('Error limpiando logs:', error);
      alert('Error limpiando logs antiguos');
    }
  };

  const getAccionBadge = (accion: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      VIEW: 'bg-yellow-100 text-yellow-800'
    };
    return colors[accion] || 'bg-gray-100 text-gray-800';
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Logs de Auditoría</h1>
        <button
          onClick={handleLimpiarLogsAntiguos}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          🧹 Limpiar Logs Antiguos
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Logs</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.total_logs}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Hoy</div>
            <div className="text-2xl font-bold text-blue-700">{stats.logs_hoy}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Este Mes</div>
            <div className="text-2xl font-bold text-purple-700">{stats.logs_mes}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Acción + Común</div>
            <div className="text-lg font-bold text-gray-800">{stats.accion_mas_comun}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Módulo + Usado</div>
            <div className="text-lg font-bold text-gray-800">{stats.modulo_mas_usado}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Usuario + Activo</div>
            <div className="text-lg font-bold text-gray-800">{stats.usuario_mas_activo}</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Acción</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={filtros.accion}
              onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="VIEW">VIEW</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Módulo</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={filtros.modulo}
              onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="auth">Autenticación</option>
              <option value="usuarios">Usuarios</option>
              <option value="recolecciones">Recolecciones</option>
              <option value="manifiestos">Manifiestos</option>
              <option value="infracciones">Infracciones</option>
              <option value="plazas">Plazas</option>
              <option value="locales">Locales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Desde</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Hasta</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAplicarFiltros}
            className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800 font-medium"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={handleLimpiarFiltros}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 font-medium"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto mb-4"></div>
            Cargando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron logs con los filtros seleccionados
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFecha(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{log.usuario_nombre}</div>
                      <div className="text-gray-500 text-xs">{log.usuario_email}</div>
                      <div className="text-gray-400 text-xs">{log.usuario_rol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccionBadge(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                      {log.modulo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.descripcion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogsAuditoria;