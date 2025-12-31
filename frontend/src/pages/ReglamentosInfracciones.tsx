import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Reglamento {
  id: string;
  numero_punto: string;
  descripcion: string;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

const ReglamentosInfracciones: React.FC = () => {
  const [reglamentos, setReglamentos] = useState<Reglamento[]>([]);
  const [filteredReglamentos, setFilteredReglamentos] = useState<Reglamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReglamento, setEditingReglamento] = useState<Reglamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    numero_punto: '',
    descripcion: '',
    orden: 0,
    activo: true
  });

  // Cargar reglamentos
  useEffect(() => {
    fetchReglamentos();
  }, []);

  // Filtrar reglamentos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReglamentos(reglamentos);
    } else {
      const filtered = reglamentos.filter(r =>
        r.numero_punto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReglamentos(filtered);
    }
  }, [searchTerm, reglamentos]);

  const fetchReglamentos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reglamentos');
      setReglamentos(response.data.data);
      setFilteredReglamentos(response.data.data);
    } catch (error) {
      console.error('Error al cargar reglamentos:', error);
      alert('Error al cargar reglamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reglamento?: Reglamento) => {
    if (reglamento) {
      setEditingReglamento(reglamento);
      setFormData({
        numero_punto: reglamento.numero_punto,
        descripcion: reglamento.descripcion,
        orden: reglamento.orden,
        activo: reglamento.activo
      });
    } else {
      setEditingReglamento(null);
      setFormData({
        numero_punto: '',
        descripcion: '',
        orden: reglamentos.length + 1,
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReglamento(null);
    setFormData({
      numero_punto: '',
      descripcion: '',
      orden: 0,
      activo: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingReglamento) {
        // Actualizar
        await api.put(`/reglamentos/${editingReglamento.id}`, formData);
        alert('Reglamento actualizado exitosamente');
      } else {
        // Crear
        await api.post('/reglamentos', formData);
        alert('Reglamento creado exitosamente');
      }
      
      handleCloseModal();
      fetchReglamentos();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(error.response?.data?.error || 'Error al guardar reglamento');
    }
  };

  const handleToggleActive = async (reglamento: Reglamento) => {
    if (!confirm(`¿Estás seguro de ${reglamento.activo ? 'desactivar' : 'activar'} este reglamento?`)) {
      return;
    }

    try {
      await api.patch(`/reglamentos/${reglamento.id}/toggle-active`);
      fetchReglamentos();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (reglamento: Reglamento) => {
    if (!confirm(`¿Estás seguro de ELIMINAR el reglamento "${reglamento.numero_punto}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/reglamentos/${reglamento.id}`);
      alert('Reglamento eliminado exitosamente');
      fetchReglamentos();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al eliminar reglamento');
    }
  };

  // Estadísticas
  const stats = {
    total: reglamentos.length,
    activos: reglamentos.filter(r => r.activo).length,
    inactivos: reglamentos.filter(r => !r.activo).length,
    filtrados: filteredReglamentos.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando reglamentos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Reglamentos</h1>
        <p className="text-gray-600">Gestión de reglamentos para infracciones</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Activos</div>
          <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Inactivos</div>
          <div className="text-2xl font-bold text-gray-400">{stats.inactivos}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Filtrados</div>
          <div className="text-2xl font-bold text-blue-600">{stats.filtrados}</div>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Buscador */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por número de punto o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Botón Nuevo */}
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
          >
            + Nuevo Reglamento
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número Punto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
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
              {filteredReglamentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron reglamentos con ese criterio' : 'No hay reglamentos registrados'}
                  </td>
                </tr>
              ) : (
                filteredReglamentos.map((reglamento) => (
                  <tr key={reglamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reglamento.orden}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reglamento.numero_punto}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {reglamento.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reglamento.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reglamento.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(reglamento)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleActive(reglamento)}
                        className={`${
                          reglamento.activo ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                        } mr-3`}
                        title={reglamento.activo ? 'Desactivar' : 'Activar'}
                      >
                        {reglamento.activo ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDelete(reglamento)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingReglamento ? 'Editar Reglamento' : 'Nuevo Reglamento'}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                {/* Número de Punto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Punto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formData.numero_punto}
                    onChange={(e) => setFormData({ ...formData, numero_punto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ej: Punto 1"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Descripción del reglamento..."
                  />
                </div>

                {/* Orden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número para ordenar el reglamento en la lista</p>
                </div>

                {/* Activo */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-700">
                    Activo
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingReglamento ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReglamentosInfracciones;