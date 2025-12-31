import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Reglamento {
  id: string;
  numero_punto: string;
  descripcion: string;
}

interface FaltaPredefinida {
  id: string;
  descripcion: string;
  reglamento_id: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  reglamento?: {
    id: string;
    numero_punto: string;
    descripcion: string;
  };
}

const FaltasPredefinidas: React.FC = () => {
  const [faltas, setFaltas] = useState<FaltaPredefinida[]>([]);
  const [filteredFaltas, setFilteredFaltas] = useState<FaltaPredefinida[]>([]);
  const [reglamentos, setReglamentos] = useState<Reglamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFalta, setEditingFalta] = useState<FaltaPredefinida | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReglamento, setFilterReglamento] = useState('');
  const [filterActivo, setFilterActivo] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    descripcion: '',
    reglamento_id: '',
    activo: true
  });

  // Cargar faltas y reglamentos
  useEffect(() => {
    fetchFaltas();
    fetchReglamentos();
  }, []);

  // Filtrar faltas
  useEffect(() => {
    let filtered = [...faltas];

    // Filtro de búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(f =>
        f.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.reglamento?.numero_punto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por reglamento
    if (filterReglamento !== '') {
      filtered = filtered.filter(f => f.reglamento_id === filterReglamento);
    }

    // Filtro por activo
    if (filterActivo === 'active') {
      filtered = filtered.filter(f => f.activo);
    } else if (filterActivo === 'inactive') {
      filtered = filtered.filter(f => !f.activo);
    }

    setFilteredFaltas(filtered);
  }, [searchTerm, filterReglamento, filterActivo, faltas]);

  const fetchFaltas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/faltas-predefinidas');
      setFaltas(response.data.data);
      setFilteredFaltas(response.data.data);
    } catch (error) {
      console.error('Error al cargar faltas:', error);
      alert('Error al cargar faltas predefinidas');
    } finally {
      setLoading(false);
    }
  };

  const fetchReglamentos = async () => {
    try {
      const response = await api.get('/reglamentos?active_only=true');
      setReglamentos(response.data.data);
    } catch (error) {
      console.error('Error al cargar reglamentos:', error);
    }
  };

  const handleOpenModal = (falta?: FaltaPredefinida) => {
    if (falta) {
      setEditingFalta(falta);
      setFormData({
        descripcion: falta.descripcion,
        reglamento_id: falta.reglamento_id,
        activo: falta.activo
      });
    } else {
      setEditingFalta(null);
      setFormData({
        descripcion: '',
        reglamento_id: reglamentos.length > 0 ? reglamentos[0].id : '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFalta(null);
    setFormData({
      descripcion: '',
      reglamento_id: '',
      activo: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFalta) {
        await api.put(`/faltas-predefinidas/${editingFalta.id}`, formData);
        alert('Falta actualizada exitosamente');
      } else {
        await api.post('/faltas-predefinidas', formData);
        alert('Falta creada exitosamente');
      }
      
      handleCloseModal();
      fetchFaltas();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(error.response?.data?.error || 'Error al guardar falta predefinida');
    }
  };

  const handleToggleActive = async (falta: FaltaPredefinida) => {
    if (!confirm(`¿Estás seguro de ${falta.activo ? 'desactivar' : 'activar'} esta falta?`)) {
      return;
    }

    try {
      await api.patch(`/faltas-predefinidas/${falta.id}/toggle-active`);
      fetchFaltas();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (falta: FaltaPredefinida) => {
    if (!confirm(`¿Estás seguro de ELIMINAR esta falta?\n\n"${falta.descripcion}"\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/faltas-predefinidas/${falta.id}`);
      alert('Falta eliminada exitosamente');
      fetchFaltas();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al eliminar falta');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterReglamento('');
    setFilterActivo('all');
  };

  // Estadísticas
  const stats = {
    total: faltas.length,
    activos: faltas.filter(f => f.activo).length,
    inactivos: faltas.filter(f => !f.activo).length,
    filtrados: filteredFaltas.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando faltas predefinidas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">❌ Faltas Predefinidas</h1>
        <p className="text-gray-600">Gestión de faltas predefinidas por reglamento</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Activas</div>
          <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Inactivas</div>
          <div className="text-2xl font-bold text-gray-400">{stats.inactivos}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Filtradas</div>
          <div className="text-2xl font-bold text-blue-600">{stats.filtrados}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Buscador */}
          <div>
            <input
              type="text"
              placeholder="🔍 Buscar por descripción o punto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Reglamento */}
          <div>
            <select
              value={filterReglamento}
              onChange={(e) => setFilterReglamento(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Todos los reglamentos</option>
              {reglamentos.map(r => (
                <option key={r.id} value={r.id}>
                  {r.numero_punto}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filterActivo}
              onChange={(e) => setFilterActivo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activas</option>
              <option value="inactive">Solo inactivas</option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + Nueva Falta
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
                  Reglamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción Falta
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
              {filteredFaltas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterReglamento || filterActivo !== 'all' 
                      ? 'No se encontraron faltas con esos criterios' 
                      : 'No hay faltas predefinidas registradas'}
                  </td>
                </tr>
              ) : (
                filteredFaltas.map((falta) => (
                  <tr key={falta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {falta.reglamento?.numero_punto}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {falta.reglamento?.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {falta.descripcion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        falta.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {falta.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(falta)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleActive(falta)}
                        className={`${
                          falta.activo ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                        } mr-3`}
                        title={falta.activo ? 'Desactivar' : 'Activar'}
                      >
                        {falta.activo ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDelete(falta)}
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
                {editingFalta ? 'Editar Falta Predefinida' : 'Nueva Falta Predefinida'}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                {/* Reglamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reglamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.reglamento_id}
                    onChange={(e) => setFormData({ ...formData, reglamento_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un reglamento</option>
                    {reglamentos.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.numero_punto} - {r.descripcion.substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de la Falta <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Descripción de la falta..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe qué incumplimiento específico del reglamento representa esta falta
                  </p>
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
                    Activa
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
                  {editingFalta ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaltasPredefinidas;