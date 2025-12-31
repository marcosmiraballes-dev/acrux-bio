import React, { useState, useEffect } from 'react';
import { localService } from '../services/local.service';
import { plazaService } from '../services/plaza.service';
import { Local, Plaza } from '../types';
import LocalModal from '../components/common/LocalModal';

const Locales: React.FC = () => {
  const [locales, setLocales] = useState<Local[]>([]);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlaza, setFilterPlaza] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar locales y plazas
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [localesData, plazasData] = await Promise.all([
        localService.getAll(),
        plazaService.getAll(),
      ]);
      setLocales(localesData);
      setPlazas(plazasData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedLocal(null);
    setIsModalOpen(true);
  };

  const handleEdit = (local: Local) => {
    setSelectedLocal(local);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<Local>) => {
    try {
      if (selectedLocal) {
        // Editar
        await localService.update(selectedLocal.id, data);
        setSuccessMessage('Local actualizado correctamente');
      } else {
        // Crear
        await localService.create(data);
        setSuccessMessage('Local creado correctamente');
      }
      await loadData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (local: Local) => {
    if (!window.confirm(`¿Estás seguro de eliminar el local "${local.nombre}"?`)) {
      return;
    }

    try {
      await localService.delete(local.id);
      setSuccessMessage('Local eliminado correctamente');
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Obtener nombre de plaza
  const getPlazaNombre = (plazaId: string | null) => {
    if (!plazaId) return 'Independiente';
    const plaza = plazas.find((p) => p.id === plazaId);
    return plaza ? plaza.nombre : 'Desconocida';
  };

  // Filtrar locales
  const filteredLocales = locales.filter((local) => {
    const matchesSearch =
      local.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      local.giro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      local.contacto?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlaza =
      !filterPlaza ||
      (filterPlaza === 'independientes' && !local.plaza_id) ||
      local.plaza_id === filterPlaza;

    return matchesSearch && matchesPlaza;
  });

  // Estadísticas
  const stats = {
    total: locales.length,
    activos: locales.filter((l) => l.activo).length,
    independientes: locales.filter((l) => !l.plaza_id).length,
    conPlaza: locales.filter((l) => l.plaza_id).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Locales</h1>
        <p className="text-gray-600">
          Gestiona los locales comerciales dentro de plazas o independientes
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Barra de acciones */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Buscar por nombre, giro o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* Filtro por plaza */}
          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <select
              value={filterPlaza}
              onChange={(e) => setFilterPlaza(e.target.value)}
              className="input flex-1 lg:flex-none lg:w-64"
            >
              <option value="">Todas las ubicaciones</option>
              <option value="independientes">🏪 Solo Independientes</option>
              <optgroup label="Plazas">
                {plazas.map((plaza) => (
                  <option key={plaza.id} value={plaza.id}>
                    {plaza.nombre}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Botón crear */}
            <button onClick={handleCreate} className="btn btn-primary whitespace-nowrap">
              ➕ Nuevo Local
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        {filteredLocales.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">🏪</div>
            <p className="text-lg">
              {searchTerm || filterPlaza
                ? 'No se encontraron locales'
                : 'No hay locales registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocales.map((local) => (
                  <tr key={local.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {local.nombre}
                      </div>
                      {local.notas && (
                        <div className="text-xs text-gray-500 mt-1">
                          {local.notas.substring(0, 50)}
                          {local.notas.length > 50 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {local.plaza_id ? (
                          <>
                            <span className="text-sm text-gray-900">
                              🏢 {getPlazaNombre(local.plaza_id)}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🏪 Independiente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{local.giro || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {local.contacto || '-'}
                      </div>
                      {local.telefono && (
                        <div className="text-xs text-gray-500">{local.telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          local.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {local.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(local)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(local)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Locales</p>
          <p className="text-2xl font-bold text-primary-700">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-700">{stats.activos}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">En Plazas</p>
          <p className="text-2xl font-bold text-blue-700">{stats.conPlaza}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Independientes</p>
          <p className="text-2xl font-bold text-purple-700">{stats.independientes}</p>
        </div>
      </div>

      {/* Modal */}
      <LocalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        local={selectedLocal}
        title={selectedLocal ? 'Editar Local' : 'Nuevo Local'}
      />
    </div>
  );
};

export default Locales;