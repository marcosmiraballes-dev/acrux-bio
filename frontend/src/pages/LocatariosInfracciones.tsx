import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Plaza {
  id: string;
  nombre: string;
}

interface Locatario {
  id: string;
  codigo_local: string;
  nombre_comercial: string;
  plaza_id: string;
  activo: boolean;
  notas?: string;
  created_at: string;
  updated_at: string;
}

interface LocatarioWithPlaza extends Locatario {
  plaza?: {
    nombre: string;
  };
}

interface LocatarioForm {
  codigo_local: string;
  nombre_comercial: string;
  plaza_id: string;
  activo: boolean;
  notas: string;
}

const LocatariosInfracciones: React.FC = () => {
  const [locatarios, setLocatarios] = useState<LocatarioWithPlaza[]>([]);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLocatario, setEditingLocatario] = useState<Locatario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [plazaFilter, setPlazaFilter] = useState('');
  
  const [formData, setFormData] = useState<LocatarioForm>({
    codigo_local: '',
    nombre_comercial: '',
    plaza_id: '',
    activo: true,
    notas: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPlazas();
    loadLocatarios();
  }, []);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    }
  };

  const loadLocatarios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/locatarios-infracciones');
      const locatariosData = response.data.data || [];
      
      // Cargar nombres de plazas
      const plazasResponse = await api.get('/plazas');
      const plazasMap = new Map(
        (plazasResponse.data.data || []).map((p: Plaza) => [p.id, p])
      );

      const locatariosConPlaza = locatariosData.map((loc: Locatario) => ({
        ...loc,
        plaza: plazasMap.get(loc.plaza_id)
      }));

      setLocatarios(locatariosConPlaza);
    } catch (error) {
      console.error('Error al cargar locatarios:', error);
      alert('Error al cargar locatarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (locatario?: Locatario) => {
    if (locatario) {
      setEditingLocatario(locatario);
      setFormData({
        codigo_local: locatario.codigo_local,
        nombre_comercial: locatario.nombre_comercial,
        plaza_id: locatario.plaza_id,
        activo: locatario.activo,
        notas: locatario.notas || ''
      });
    } else {
      setEditingLocatario(null);
      setFormData({
        codigo_local: '',
        nombre_comercial: '',
        plaza_id: '',
        activo: true,
        notas: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLocatario(null);
    setFormData({
      codigo_local: '',
      nombre_comercial: '',
      plaza_id: '',
      activo: true,
      notas: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo_local.trim()) {
      newErrors.codigo_local = 'El código del local es requerido';
    }
    if (!formData.nombre_comercial.trim()) {
      newErrors.nombre_comercial = 'El nombre comercial es requerido';
    }
    if (!formData.plaza_id) {
      newErrors.plaza_id = 'Debe seleccionar una plaza';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        codigo_local: formData.codigo_local.trim(),
        nombre_comercial: formData.nombre_comercial.trim(),
        plaza_id: formData.plaza_id,
        activo: formData.activo,
        notas: formData.notas.trim() || null
      };

      if (editingLocatario) {
        await api.put(`/locatarios-infracciones/${editingLocatario.id}`, payload);
        alert('Locatario actualizado exitosamente');
      } else {
        await api.post('/locatarios-infracciones', payload);
        alert('Locatario creado exitosamente');
      }

      handleCloseModal();
      loadLocatarios();
    } catch (error: any) {
      console.error('Error al guardar locatario:', error);
      alert(error.response?.data?.error || 'Error al guardar locatario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (locatario: Locatario) => {
    if (!confirm(`¿Estás seguro de eliminar el locatario "${locatario.nombre_comercial}"?\n\nEsto solo funcionará si no tiene infracciones asociadas.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/locatarios-infracciones/${locatario.id}`);
      alert('Locatario eliminado exitosamente');
      loadLocatarios();
    } catch (error: any) {
      console.error('Error al eliminar locatario:', error);
      alert(error.response?.data?.error || 'Error al eliminar locatario. Puede que tenga infracciones asociadas.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLocatarios = locatarios.filter(locatario => {
    const matchesSearch = 
      locatario.codigo_local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locatario.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlaza = !plazaFilter || locatario.plaza_id === plazaFilter;

    return matchesSearch && matchesPlaza;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👥 Locatarios - Catálogo Infracciones</h1>
        <p className="text-gray-600">Gestión de locatarios para el módulo de infracciones</p>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Buscador */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="🔍 Buscar por código o nombre comercial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtro Plaza */}
          <div>
            <select
              value={plazaFilter}
              onChange={(e) => setPlazaFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las plazas</option>
              {plazas.filter(p => p.activo).map((plaza) => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón Nueva */}
        <div className="flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            + Nuevo Locatario
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{locatarios.length}</p>
            <p className="text-sm text-gray-600">Total Locatarios</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{locatarios.filter(l => l.activo).length}</p>
            <p className="text-sm text-gray-600">Activos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{locatarios.filter(l => !l.activo).length}</p>
            <p className="text-sm text-gray-600">Inactivos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{filteredLocatarios.length}</p>
            <p className="text-sm text-gray-600">Filtrados</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Cargando locatarios...</p>
          </div>
        ) : filteredLocatarios.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchTerm || plazaFilter ? 'No se encontraron locatarios con esos criterios' : 'No hay locatarios registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Comercial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLocatarios.map((locatario) => (
                  <tr key={locatario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{locatario.codigo_local}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{locatario.nombre_comercial}</div>
                        {locatario.notas && (
                          <div className="text-sm text-gray-500 line-clamp-1">{locatario.notas}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {locatario.plaza?.nombre || 'Sin plaza'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        locatario.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {locatario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal(locatario)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                          title="Editar locatario"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(locatario)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="Eliminar locatario"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLocatario ? '✏️ Editar Locatario' : '➕ Nuevo Locatario'}
              </h2>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código del Local *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo_local}
                    onChange={(e) => setFormData({ ...formData, codigo_local: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.codigo_local ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: L-28"
                  />
                  {errors.codigo_local && (
                    <p className="mt-1 text-sm text-red-600">{errors.codigo_local}</p>
                  )}
                </div>

                {/* Plaza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plaza *
                  </label>
                  <select
                    value={formData.plaza_id}
                    onChange={(e) => setFormData({ ...formData, plaza_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.plaza_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar plaza</option>
                    {plazas.filter(p => p.activo).map((plaza) => (
                      <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
                    ))}
                  </select>
                  {errors.plaza_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.plaza_id}</p>
                  )}
                </div>

                {/* Nombre Comercial */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_comercial}
                    onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.nombre_comercial ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Tienda ABC"
                  />
                  {errors.nombre_comercial && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre_comercial}</p>
                  )}
                </div>

                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Notas adicionales sobre el locatario"
                  />
                </div>

                {/* Activo */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Locatario Activo</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Los locatarios inactivos no aparecerán en los filtros de infracciones
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : (editingLocatario ? 'Actualizar' : 'Crear')} Locatario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocatariosInfracciones;