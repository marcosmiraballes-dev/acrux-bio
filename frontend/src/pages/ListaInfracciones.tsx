import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { generateInfraccionHTML } from '../utils/generateInfraccionHTML';
import NuevaInfraccionModal from '../components/NuevaInfraccionModal';

interface Infraccion {
  id: string;
  nro_aviso: string;
  fecha_infraccion: string;
  descripcion_falta: string;
  estatus: 'Pendiente' | 'Resuelto' | 'Cancelado';
  notas?: string;
  locatario: {
    id: string;
    codigo_local: string;
    nombre_comercial: string;
    plaza: {
      id: string;
      nombre: string;
    };
  };
  reglamento: {
    id: string;
    numero_punto: string;
    descripcion: string;
  };
  tipo_aviso: {
    id: string;
    tipo: string;
    orden: number;
    color_badge: string;
  };
  created_at: string;
  resuelto_fecha?: string;
}

interface Plaza {
  id: string;
  nombre: string;
}

interface Locatario {
  id: string;
  codigo_local: string;
  nombre_comercial: string;
  plaza_id: string;
}

interface TipoAviso {
  id: string;
  tipo: string;
  orden: number;
  color_badge: string;
}

const ListaInfracciones: React.FC = () => {
  const { user } = useAuth();
  const [infracciones, setInfracciones] = useState<Infraccion[]>([]);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [tiposAviso, setTiposAviso] = useState<TipoAviso[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Filtros
  const [plazaId, setPlazaId] = useState('');
  const [locatarioId, setLocatarioId] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [tipoAvisoId, setTipoAvisoId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const limit = 50;

  // Cargar datos iniciales
  useEffect(() => {
    loadPlazas();
    loadTiposAviso();
    // Cargar infracciones al inicio SIN filtros
    loadInfracciones();
  }, []);

  // Cargar locatarios cuando cambia la plaza
  useEffect(() => {
    if (plazaId) {
      loadLocatarios();
    } else {
      setLocatarios([]);
      setLocatarioId('');
    }
  }, [plazaId]);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data);
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    }
  };

  const loadLocatarios = async () => {
    try {
      const response = await api.get(`/locatarios-infracciones?plaza_id=${plazaId}`);
      setLocatarios(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar locatarios:', error);
      setLocatarios([]);
    }
  };

  const loadTiposAviso = async () => {
    // Tipos de aviso hardcodeados
    setTiposAviso([
      { id: 'e5874eff-4e5f-4fed-aee9-1e30fc2ac5b5', tipo: '1er aviso', orden: 1, color_badge: '#10B981' },
      { id: '204a4302-53fb-4ff2-9c8b-420ab3a619c1', tipo: '2do aviso', orden: 2, color_badge: '#F59E0B' },
      { id: 'e5cae3bb-320d-48ad-b48a-b833fc674be4', tipo: '3er aviso', orden: 3, color_badge: '#EF4444' },
      { id: 'ee668e6f-135a-404f-b3f4-765b79e748ca', tipo: '4to aviso', orden: 4, color_badge: '#991B1B' },
      { id: 'db2b42cf-d6ae-47f0-9a9a-fd7edfef7006', tipo: '5to aviso', orden: 5, color_badge: '#991B1B' }
    ]);
  };

  const loadInfracciones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (plazaId) params.append('plaza_id', plazaId);
      if (locatarioId) params.append('locatario_id', locatarioId);
      if (estatusFilter) params.append('estatus', estatusFilter);
      if (tipoAvisoId) params.append('tipo_aviso_id', tipoAvisoId);
      if (fechaDesde) params.append('fecha_desde', fechaDesde);
      if (fechaHasta) params.append('fecha_hasta', fechaHasta);
      params.append('limit', limit.toString());
      params.append('offset', ((page - 1) * limit).toString());

      console.log('🔍 Filtros enviados:', { plazaId, locatarioId, estatusFilter, tipoAvisoId, fechaDesde, fechaHasta, page, limit });

      const [infraccionesRes, countRes] = await Promise.all([
        api.get(`/infracciones?${params}`),
        api.get(`/infracciones/count?${params}`)
      ]);

      console.log('✅ Infracciones recibidas:', infraccionesRes.data.data?.length || 0);
      console.log('✅ Total count:', countRes.data.count);

      setInfracciones(infraccionesRes.data.data || []);
      setTotalCount(countRes.data.count || 0);
    } catch (error) {
      console.error('Error al cargar infracciones:', error);
      setInfracciones([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setPlazaId('');
    setLocatarioId('');
    setEstatusFilter('');
    setTipoAvisoId('');
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
    setLocatarios([]);
  };

  const handleResolver = async (id: string) => {
    if (!confirm('¿Marcar esta infracción como resuelta?')) return;

    try {
      await api.patch(`/infracciones/${id}/resolver`, {
        resuelto_fecha: new Date().toISOString().split('T')[0]
      });
      loadInfracciones();
      alert('Infracción marcada como resuelta');
    } catch (error) {
      console.error('Error al resolver infracción:', error);
      alert('Error al resolver la infracción');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('⚠️ ¿ELIMINAR esta infracción permanentemente?\n\nEsta acción NO se puede deshacer.')) return;

    try {
      await api.delete(`/infracciones/${id}`);
      loadInfracciones();
      alert('✅ Infracción eliminada correctamente');
    } catch (error: any) {
      console.error('Error al eliminar infracción:', error);
      const mensaje = error.response?.data?.message || 'Error al eliminar la infracción';
      alert(`❌ ${mensaje}`);
    }
  };

  const handleGenerarHTML = (infraccion: Infraccion) => {
    generateInfraccionHTML(infraccion);
  };

  const getBadgeColor = (nroAviso: string) => {
    // Extraer número del formato AV-XXX
    const match = nroAviso.match(/AV-(\d+)/);
    if (!match) {
      return {
        backgroundColor: '#7F1D1D',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
      };
    }

    const numero = parseInt(match[1], 10);

    let color = '#7F1D1D'; // Default: rojo oscuro

    if (numero === 1) {
      color = '#10B981'; // 1er aviso: Verde
    } else if (numero === 2) {
      color = '#F59E0B'; // 2do aviso: Amarillo
    } else if (numero === 3) {
      color = '#EF4444'; // 3er aviso: Rojo
    } else {
      color = '#991B1B'; // 4to en adelante: Rojo oscuro
    }

    return {
      backgroundColor: color,
      color: 'white',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500'
    };
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resuelto':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  // Verificar permisos
  const puedeCrearResolver = user?.rol === 'ADMIN' || user?.rol === 'COORDINADOR';
  const puedeEliminar = user?.rol === 'ADMIN'; // SOLO ADMIN puede eliminar

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Infracciones</h1>
        <p className="text-gray-600">Gestión de infracciones de locatarios</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Plaza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plaza
            </label>
            <select
              value={plazaId}
              onChange={(e) => {
                setPlazaId(e.target.value);
                setLocatarioId(''); // Limpiar locatario al cambiar plaza
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las plazas</option>
              {plazas.map((plaza) => (
                <option key={plaza.id} value={plaza.id}>
                  {plaza.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local
            </label>
            <select
              value={locatarioId}
              onChange={(e) => setLocatarioId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              disabled={!plazaId}
            >
              <option value="">Todos los locales</option>
              {locatarios.map((locatario) => (
                <option key={locatario.id} value={locatario.id}>
                  {locatario.nombre_comercial}
                </option>
              ))}
            </select>
            {!plazaId && (
              <p className="mt-1 text-xs text-gray-500">
                Selecciona una plaza primero
              </p>
            )}
            {plazaId && locatarios.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {locatarios.length} locales disponibles
              </p>
            )}
          </div>

          {/* Tipo de Aviso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Aviso
            </label>
            <select
              value={tipoAvisoId}
              onChange={(e) => setTipoAvisoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los tipos</option>
              {tiposAviso.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Estatus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estatus
            </label>
            <select
              value={estatusFilter}
              onChange={(e) => setEstatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center space-x-2">
          <button
            onClick={loadInfracciones}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            disabled={loading}
          >
            {loading ? 'Buscando...' : '🔍 Buscar'}
          </button>
          <button
            onClick={handleLimpiarFiltros}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Limpiar Filtros
          </button>
          {/* Botón Nueva Infracción - Solo ADMIN y COORDINADOR */}
          {puedeCrearResolver && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Nueva Infracción
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{infracciones.length}</span> de{' '}
          <span className="font-semibold">{totalCount}</span> infracciones
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Cargando infracciones...</p>
          </div>
        ) : infracciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No se encontraron infracciones. Haz click en "🔍 Buscar" para cargar datos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nro Aviso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locatario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Aviso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {infracciones.map((infraccion) => (
                  <tr key={infraccion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        {infraccion.nro_aviso}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {infraccion.fecha_infraccion.split('-').reverse().join('/')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {infraccion.locatario.nombre_comercial}
                        </div>
                        <div className="text-sm text-gray-500">
                          {infraccion.locatario.codigo_local}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {infraccion.locatario.plaza.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span style={getBadgeColor(infraccion.nro_aviso)}>
                        {infraccion.nro_aviso}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstatusColor(infraccion.estatus)}`}>
                        {infraccion.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {/* Botón Resolver - Solo ADMIN y COORDINADOR */}
                        {infraccion.estatus === 'Pendiente' && puedeCrearResolver && (
                          <button
                            onClick={() => handleResolver(infraccion.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                            title="Marcar como resuelta"
                          >
                            ✓ Resolver
                          </button>
                        )}
                        {/* Botón PDF - Todos */}
                        <button
                          onClick={() => handleGenerarHTML(infraccion)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                          title="Generar documento"
                        >
                          📄 PDF
                        </button>
                        {/* Botón Eliminar - SOLO ADMIN */}
                        {puedeEliminar && (
                          <button
                            onClick={() => handleEliminar(infraccion.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                            title="Eliminar infracción (solo ADMIN)"
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => {
              setPage(page - 1);
              loadInfracciones();
            }}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => {
              setPage(page + 1);
              loadInfracciones();
            }}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Nueva Infracción */}
      {puedeCrearResolver && (
        <NuevaInfraccionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadInfracciones();
          }}
        />
      )}
    </div>
  );
};

export default ListaInfracciones;