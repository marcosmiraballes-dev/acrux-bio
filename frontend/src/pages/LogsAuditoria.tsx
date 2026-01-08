import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface LogAuditoria {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  usuario_email: string | null;
  usuario_rol: string | null;
  accion: string;
  modulo: string;
  registro_id: string | null;
  tabla: string | null;
  datos_anteriores: any;
  datos_nuevos: any;
  descripcion: string | null;
  ip_address: string | null;
  user_agent: string | null;
  endpoint: string | null;
  metodo: string | null;
  created_at: string;
}

interface LogEstadisticas {
  total_logs: number;
  logs_hoy: number;
  logs_mes: number;
  accion_mas_comun: string | null;
  modulo_mas_usado: string | null;
  usuario_mas_activo: string | null;
}

const LogsAuditoria: React.FC = () => {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [estadisticas, setEstadisticas] = useState<LogEstadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const registrosPorPagina = 100;

  const [filtros, setFiltros] = useState({
    accion: '',
    modulo: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  useEffect(() => {
    cargarEstadisticas();
    cargarLogs();
  }, [pagina, filtrosAplicados]);

  const cargarEstadisticas = async () => {
    try {
      const response = await api.get('/logs-auditoria/stats');
      setEstadisticas(response.data.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const cargarLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: registrosPorPagina,
        offset: (pagina - 1) * registrosPorPagina
      };

      if (filtrosAplicados.accion) params.accion = filtrosAplicados.accion;
      if (filtrosAplicados.modulo) params.modulo = filtrosAplicados.modulo;
      if (filtrosAplicados.fecha_desde) params.fecha_desde = filtrosAplicados.fecha_desde;
      if (filtrosAplicados.fecha_hasta) params.fecha_hasta = filtrosAplicados.fecha_hasta;

      const response = await api.get('/logs-auditoria', { params });
      setLogs(response.data.data);
      setTotalRegistros(response.data.pagination.total);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    const filtrosVacios = { accion: '', modulo: '', fecha_desde: '', fecha_hasta: '' };
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
    setPagina(1);
  };

  const handleImprimir = () => {
    window.print();
  };

  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

  const getAccionBgColor = (accion: string): string => {
    switch (accion) {
      case 'CREATE': return '#e8f5e9';
      case 'UPDATE': return '#e3f2fd';
      case 'DELETE': return '#ffebee';
      case 'LOGIN': return '#f3e5f5';
      case 'LOGOUT': return '#f5f5f5';
      default: return '#ffffff';
    }
  };

  const truncateText = (text: string | null, maxLength: number = 50): string => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Cargando logs de auditoría...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Estilos para impresión - MEJORADOS */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-area, .print-area * {
            visibility: visible;
          }
          
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-header {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          
          .print-header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin: 0;
          }
          
          .print-header p {
            font-size: 9pt;
            margin: 2px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-top: 10px;
          }
          
          th {
            background-color: #047857 !important;
            color: white !important;
            font-weight: bold;
            padding: 6px 4px;
            text-align: left;
            border: 1px solid #000;
          }
          
          td {
            padding: 4px;
            border: 1px solid #ccc;
            vertical-align: top;
          }
          
          tr:nth-child(even) {
            background-color: #f9f9f9 !important;
          }
          
          .descripcion-cell {
            max-width: 250px;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-size: 7pt;
            line-height: 1.2;
          }
          
          .fecha-cell {
            white-space: nowrap;
            font-size: 7pt;
          }
          
          .accion-cell {
            text-align: center;
            font-weight: bold;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          /* Ocultar la barra de scroll en impresión */
          .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Header - NO IMPRIMIR */}
      <div className="mb-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">📋 Logs de Auditoría</h1>
          <button
            onClick={handleImprimir}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center gap-2"
          >
            🖨️ Imprimir
          </button>
        </div>

        {/* Estadísticas compactas */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white border p-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold">{estadisticas?.total_logs || 0}</p>
          </div>
          <div className="bg-white border p-3 text-center">
            <p className="text-xs text-gray-500">Hoy</p>
            <p className="text-lg font-bold text-green-600">{estadisticas?.logs_hoy || 0}</p>
          </div>
          <div className="bg-white border p-3 text-center">
            <p className="text-xs text-gray-500">Este Mes</p>
            <p className="text-lg font-bold text-purple-600">{estadisticas?.logs_mes || 0}</p>
          </div>
          <div className="bg-white border p-3 text-center">
            <p className="text-xs text-gray-500">Acción +Común</p>
            <p className="text-sm font-bold">{estadisticas?.accion_mas_comun || 'N/A'}</p>
          </div>
          <div className="bg-white border p-3 text-center">
            <p className="text-xs text-gray-500">Módulo +Usado</p>
            <p className="text-sm font-bold">{estadisticas?.modulo_mas_usado || 'N/A'}</p>
          </div>
          <div className="bg-white border p-3 text-center">
            <p className="text-xs text-gray-500">Usuario +Activo</p>
            <p className="text-sm font-bold">{estadisticas?.usuario_mas_activo || 'N/A'}</p>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="bg-white border p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Filtros</h3>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <select
              value={filtros.accion}
              onChange={(e) => setFiltros({...filtros, accion: e.target.value})}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>

            <select
              value={filtros.modulo}
              onChange={(e) => setFiltros({...filtros, modulo: e.target.value})}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Todos los módulos</option>
              <option value="auth">auth</option>
              <option value="usuarios">usuarios</option>
              <option value="manifiestos">manifiestos</option>
              <option value="infracciones">infracciones</option>
              <option value="recolecciones">recolecciones</option>
              <option value="plazas">plazas</option>
              <option value="locales">locales</option>
              <option value="tipos_residuos">tipos_residuos</option>
              <option value="vehiculos">vehiculos</option>
              <option value="destinos_finales">destinos_finales</option>
              <option value="folios_reservados">folios_reservados</option>
            </select>

            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Desde"
            />

            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Hasta"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltros}
              className="bg-emerald-700 text-white px-4 py-1 rounded hover:bg-emerald-800 text-sm"
            >
              Aplicar
            </button>
            <button
              onClick={limpiarFiltros}
              className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla - ÁREA DE IMPRESIÓN MEJORADA */}
      <div className="print-area">
        {/* Header para impresión - MEJORADO */}
        <div className="print-header" style={{ display: 'none' }}>
          <h1>LOGS DE AUDITORÍA - SISTEMA ACRUX-BIO</h1>
          <p>Elefante Verde - Estrategias Ambientales</p>
          <p>Generado: {new Date().toLocaleString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p>Página {pagina} de {totalPaginas} | Total registros: {totalRegistros}</p>
          {filtrosAplicados.accion && <p>Filtro Acción: {filtrosAplicados.accion}</p>}
          {filtrosAplicados.modulo && <p>Filtro Módulo: {filtrosAplicados.modulo}</p>}
        </div>

        {/* Tabla mejorada para impresión */}
        <div className="overflow-x-auto overflow-y-auto bg-white border" style={{ maxHeight: '600px' }}>
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">#</th>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">Fecha/Hora</th>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">Usuario</th>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">Rol</th>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">Acción</th>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">Módulo</th>
                <th className="border px-2 py-2 text-left font-semibold bg-emerald-700 text-white">Descripción Detallada</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr 
                  key={log.id}
                  style={{ backgroundColor: getAccionBgColor(log.accion) }}
                  className="hover:bg-gray-50"
                >
                  <td className="border px-2 py-2 text-center">
                    {(pagina - 1) * registrosPorPagina + index + 1}
                  </td>
                  <td className="border px-2 py-2 whitespace-nowrap font-mono fecha-cell">
                    {new Date(log.created_at).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="border px-2 py-2">
                    <div>
                      <p className="font-semibold">{log.usuario_nombre || '-'}</p>
                      <p className="text-xs text-gray-600 font-mono">{log.usuario_email || '-'}</p>
                    </div>
                  </td>
                  <td className="border px-2 py-2 text-center">
                    <span className="font-semibold text-xs">{log.usuario_rol || '-'}</span>
                  </td>
                  <td className="border px-2 py-2 text-center accion-cell">
                    <span className="font-bold text-xs">{log.accion}</span>
                  </td>
                  <td className="border px-2 py-2">
                    <span className="text-xs">{log.modulo}</span>
                  </td>
                  <td className="border px-2 py-2 descripcion-cell">
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '10px', lineHeight: '1.3' }}>
                      {log.descripcion || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron registros con los filtros aplicados.
          </div>
        )}
      </div>

      {/* Paginación - NO IMPRIMIR */}
      <div className="flex justify-between items-center mt-4 no-print">
        <p className="text-sm text-gray-600">
          Mostrando {((pagina - 1) * registrosPorPagina) + 1} - {Math.min(pagina * registrosPorPagina, totalRegistros)} de {totalRegistros} registros
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2 border rounded bg-gray-50">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina >= totalPaginas}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogsAuditoria;