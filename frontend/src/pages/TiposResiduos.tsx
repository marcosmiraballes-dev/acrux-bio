import React, { useState, useEffect } from 'react';
import { tipoResiduoService } from '../services/tipo-residuo.service';
import { TipoResiduo } from '../types';
import TipoResiduoModal from '../components/common/TipoResiduoModal';

const TiposResiduos: React.FC = () => {
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoResiduo | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar tipos de residuos
  useEffect(() => {
    loadTiposResiduos();
  }, []);

  const loadTiposResiduos = async () => {
    try {
      setLoading(true);
      const data = await tipoResiduoService.getAll();
      setTiposResiduos(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los tipos de residuos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTipo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tipo: TipoResiduo) => {
    setSelectedTipo(tipo);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<TipoResiduo>) => {
    try {
      if (selectedTipo) {
        // Editar
        await tipoResiduoService.update(selectedTipo.id, data);
        setSuccessMessage('Tipo de residuo actualizado correctamente');
      } else {
        // Crear
        await tipoResiduoService.create(data);
        setSuccessMessage('Tipo de residuo creado correctamente');
      }
      await loadTiposResiduos();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (tipo: TipoResiduo) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${tipo.nombre}"?`)) {
      return;
    }

    try {
      await tipoResiduoService.delete(tipo.id);
      setSuccessMessage('Tipo de residuo eliminado correctamente');
      await loadTiposResiduos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filtrar tipos de residuos
  const filteredTipos = tiposResiduos.filter((tipo) =>
    tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Tipos de Residuos
        </h1>
        <p className="text-gray-600">
          Gestiona los diferentes tipos de residuos reciclables
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
              placeholder="Buscar por nombre o descripción..."
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
            ➕ Nuevo Tipo de Residuo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        {filteredTipos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">♻️</div>
            <p className="text-lg">
              {searchTerm
                ? 'No se encontraron tipos de residuos'
                : 'No hay tipos de residuos registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factor CO₂
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
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
                {filteredTipos.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: tipo.color_hex || '#10B981' }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tipo.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {tipo.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tipo.factor_co2}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {tipo.unidad || 'kg'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tipo.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tipo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(tipo)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tipo)}
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
          <p className="text-sm text-gray-600 mb-1">Total Tipos</p>
          <p className="text-2xl font-bold text-primary-700">
            {tiposResiduos.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-700">
            {tiposResiduos.filter((t) => t.activo).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Factor CO₂ Promedio</p>
          <p className="text-2xl font-bold text-blue-700">
            {tiposResiduos.length > 0
              ? (
                  tiposResiduos.reduce((sum, t) => sum + t.factor_co2, 0) /
                  tiposResiduos.length
                ).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>

      {/* Modal */}
      <TipoResiduoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        tipoResiduo={selectedTipo}
        title={selectedTipo ? 'Editar Tipo de Residuo' : 'Nuevo Tipo de Residuo'}
      />
    </div>
  );
};

export default TiposResiduos;