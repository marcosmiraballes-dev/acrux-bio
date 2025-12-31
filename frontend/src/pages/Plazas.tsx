import React, { useState, useEffect } from 'react';
import { plazaService } from '../services/plaza.service';
import { Plaza } from '../types';
import PlazaModal from '../components/common/PlazaModal';

const Plazas: React.FC = () => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaza, setSelectedPlaza] = useState<Plaza | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar plazas
  useEffect(() => {
    loadPlazas();
  }, []);

  const loadPlazas = async () => {
    try {
      setLoading(true);
      const data = await plazaService.getAll();
      setPlazas(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar las plazas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPlaza(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plaza: Plaza) => {
    setSelectedPlaza(plaza);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<Plaza>) => {
    try {
      if (selectedPlaza) {
        // Editar
        await plazaService.update(selectedPlaza.id, data);
        setSuccessMessage('Plaza actualizada correctamente');
      } else {
        // Crear
        await plazaService.create(data);
        setSuccessMessage('Plaza creada correctamente');
      }
      await loadPlazas();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (plaza: Plaza) => {
    if (!window.confirm(`¿Estás seguro de eliminar la plaza "${plaza.nombre}"?`)) {
      return;
    }

    try {
      await plazaService.delete(plaza.id);
      setSuccessMessage('Plaza eliminada correctamente');
      await loadPlazas();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filtrar plazas
  const filteredPlazas = plazas.filter((plaza) =>
    plaza.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plaza.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plaza.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Plazas Comerciales</h1>
        <p className="text-gray-600">
          Gestiona las plazas donde se realizan las recolecciones
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* Botón crear */}
          <button onClick={handleCreate} className="btn btn-primary">
            ➕ Nueva Plaza
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        {filteredPlazas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-lg">
              {searchTerm
                ? 'No se encontraron plazas'
                : 'No hay plazas registradas'}
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
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
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
                {filteredPlazas.map((plaza) => (
                  <tr key={plaza.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {plaza.nombre}
                      </div>
                      {plaza.direccion && (
                        <div className="text-xs text-gray-500 mt-1">
                          {plaza.direccion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{plaza.ciudad}</div>
                      <div className="text-xs text-gray-500">{plaza.estado}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {plaza.contacto || '-'}
                      </div>
                      {plaza.email && (
                        <div className="text-xs text-gray-500">{plaza.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {plaza.telefono || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          plaza.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {plaza.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(plaza)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(plaza)}
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
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total Plazas</p>
          <p className="text-2xl font-bold text-primary-700">
            {plazas.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-700">
            {plazas.filter((p) => p.activo).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Ciudades</p>
          <p className="text-2xl font-bold text-blue-700">
            {new Set(plazas.map((p) => p.ciudad)).size}
          </p>
        </div>
      </div>

      {/* Modal */}
      <PlazaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        plaza={selectedPlaza}
        title={selectedPlaza ? 'Editar Plaza' : 'Nueva Plaza'}
      />
    </div>
  );
};

export default Plazas;