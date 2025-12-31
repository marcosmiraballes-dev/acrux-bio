import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface TipoAviso {
  id: string;
  tipo: string;
  orden: number;
  color_badge: string;
  created_at: string;
}

const TiposAvisoInfracciones: React.FC = () => {
  const [tiposAviso, setTiposAviso] = useState<TipoAviso[]>([]);
  const [filteredTipos, setFilteredTipos] = useState<TipoAviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAviso | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    tipo: '',
    orden: 1,
    color_badge: '#10B981'
  });

  // Cargar tipos de aviso
  useEffect(() => {
    fetchTiposAviso();
  }, []);

  // Filtrar cuando cambia búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTipos(tiposAviso);
    } else {
      const filtered = tiposAviso.filter(t =>
        t.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTipos(filtered);
    }
  }, [searchTerm, tiposAviso]);

  const fetchTiposAviso = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tipos-aviso');
      setTiposAviso(response.data.data);
      setFilteredTipos(response.data.data);
    } catch (error) {
      console.error('Error al cargar tipos de aviso:', error);
      alert('Error al cargar tipos de aviso');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tipo?: TipoAviso) => {
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        tipo: tipo.tipo,
        orden: tipo.orden,
        color_badge: tipo.color_badge
      });
    } else {
      setEditingTipo(null);
      setFormData({
        tipo: '',
        orden: tiposAviso.length + 1,
        color_badge: '#10B981'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTipo(null);
    setFormData({
      tipo: '',
      orden: 1,
      color_badge: '#10B981'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTipo) {
        await api.put(`/tipos-aviso/${editingTipo.id}`, formData);
        alert('Tipo de aviso actualizado exitosamente');
      } else {
        await api.post('/tipos-aviso', formData);
        alert('Tipo de aviso creado exitosamente');
      }
      
      handleCloseModal();
      fetchTiposAviso();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(error.response?.data?.error || 'Error al guardar tipo de aviso');
    }
  };

  const handleDelete = async (tipo: TipoAviso) => {
    if (!confirm(`¿Estás seguro de ELIMINAR "${tipo.tipo}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/tipos-aviso/${tipo.id}`);
      alert('Tipo de aviso eliminado exitosamente');
      fetchTiposAviso();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al eliminar tipo de aviso');
    }
  };

  // Estadísticas
  const stats = {
    total: tiposAviso.length,
    filtrados: filteredTipos.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando tipos de aviso...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">⚠️ Tipos de Aviso</h1>
        <p className="text-gray-600">Gestión de tipos de aviso para infracciones</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Tipos</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
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
              placeholder="🔍 Buscar tipo de aviso..."
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
            + Nuevo Tipo
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
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color Badge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vista Previa
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTipos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron tipos de aviso' : 'No hay tipos de aviso registrados'}
                  </td>
                </tr>
              ) : (
                filteredTipos.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {tipo.orden}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tipo.tipo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {tipo.color_badge}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                        style={{ backgroundColor: tipo.color_badge }}
                      >
                        {tipo.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(tipo)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(tipo)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTipo ? 'Editar Tipo de Aviso' : 'Nuevo Tipo de Aviso'}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Aviso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ej: 1er aviso"
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
                    min={1}
                    value={formData.orden}
                    onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número para ordenar en la lista</p>
                </div>

                {/* Color Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Badge <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.color_badge}
                      onChange={(e) => setFormData({ ...formData, color_badge: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      pattern="^#[0-9A-Fa-f]{6}$"
                      value={formData.color_badge}
                      onChange={(e) => setFormData({ ...formData, color_badge: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                      placeholder="#10B981"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Color en formato hexadecimal</p>
                </div>

                {/* Vista previa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vista Previa
                  </label>
                  <span 
                    className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                    style={{ backgroundColor: formData.color_badge }}
                  >
                    {formData.tipo || 'Ejemplo'}
                  </span>
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
                  {editingTipo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TiposAvisoInfracciones;