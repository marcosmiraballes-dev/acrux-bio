import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Plaza {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  direccion?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface PlazaForm {
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  contacto: string;
  telefono: string;
  email: string;
  activo: boolean;
}

const PlazasInfracciones: React.FC = () => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlaza, setEditingPlaza] = useState<Plaza | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<PlazaForm>({
    nombre: '',
    ciudad: '',
    estado: '',
    direccion: '',
    contacto: '',
    telefono: '',
    email: '',
    activo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPlazas();
  }, []);

  const loadPlazas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar plazas:', error);
      alert('Error al cargar plazas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plaza?: Plaza) => {
    if (plaza) {
      setEditingPlaza(plaza);
      setFormData({
        nombre: plaza.nombre,
        ciudad: plaza.ciudad,
        estado: plaza.estado,
        direccion: plaza.direccion || '',
        contacto: plaza.contacto || '',
        telefono: plaza.telefono || '',
        email: plaza.email || '',
        activo: plaza.activo
      });
    } else {
      setEditingPlaza(null);
      setFormData({
        nombre: '',
        ciudad: '',
        estado: '',
        direccion: '',
        contacto: '',
        telefono: '',
        email: '',
        activo: true
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlaza(null);
    setFormData({
      nombre: '',
      ciudad: '',
      estado: '',
      direccion: '',
      contacto: '',
      telefono: '',
      email: '',
      activo: true
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }
    if (!formData.estado.trim()) {
      newErrors.estado = 'El estado es requerido';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
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
        nombre: formData.nombre.trim(),
        ciudad: formData.ciudad.trim(),
        estado: formData.estado.trim(),
        direccion: formData.direccion.trim() || null,
        contacto: formData.contacto.trim() || null,
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        activo: formData.activo
      };

      if (editingPlaza) {
        await api.put(`/plazas/${editingPlaza.id}`, payload);
        alert('Plaza actualizada exitosamente');
      } else {
        await api.post('/plazas', payload);
        alert('Plaza creada exitosamente');
      }

      handleCloseModal();
      loadPlazas();
    } catch (error: any) {
      console.error('Error al guardar plaza:', error);
      alert(error.response?.data?.error || 'Error al guardar plaza');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (plaza: Plaza) => {
    if (!confirm(`¿Estás seguro de eliminar la plaza "${plaza.nombre}"?\n\nEsto solo funcionará si no tiene locatarios asociados.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/plazas/${plaza.id}`);
      alert('Plaza eliminada exitosamente');
      loadPlazas();
    } catch (error: any) {
      console.error('Error al eliminar plaza:', error);
      alert(error.response?.data?.error || 'Error al eliminar plaza. Puede que tenga locatarios asociados.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlazas = plazas.filter(plaza =>
    plaza.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plaza.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plaza.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🏢 Plazas - Catálogo Infracciones</h1>
        <p className="text-gray-600">Gestión de plazas para el módulo de infracciones</p>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Buscador */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, ciudad o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Botón Nueva Plaza */}
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap"
          >
            + Nueva Plaza
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{plazas.length}</p>
            <p className="text-sm text-gray-600">Total de Plazas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{plazas.filter(p => p.activo).length}</p>
            <p className="text-sm text-gray-600">Plazas Activas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">{plazas.filter(p => !p.activo).length}</p>
            <p className="text-sm text-gray-600">Plazas Inactivas</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Cargando plazas...</p>
          </div>
        ) : filteredPlazas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchTerm ? 'No se encontraron plazas con ese criterio de búsqueda' : 'No hay plazas registradas'}
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
                    Ciudad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
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
                {filteredPlazas.map((plaza) => (
                  <tr key={plaza.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{plaza.nombre}</div>
                      {plaza.direccion && (
                        <div className="text-sm text-gray-500">{plaza.direccion}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {plaza.ciudad}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {plaza.estado}
                    </td>
                    <td className="px-6 py-4">
                      {plaza.contacto && (
                        <div className="text-sm text-gray-900">{plaza.contacto}</div>
                      )}
                      {plaza.telefono && (
                        <div className="text-sm text-gray-500">📞 {plaza.telefono}</div>
                      )}
                      {plaza.email && (
                        <div className="text-sm text-gray-500">✉️ {plaza.email}</div>
                      )}
                      {!plaza.contacto && !plaza.telefono && !plaza.email && (
                        <span className="text-sm text-gray-400">Sin contacto</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        plaza.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plaza.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenModal(plaza)}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                          title="Editar plaza"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(plaza)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="Eliminar plaza"
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
                {editingPlaza ? '✏️ Editar Plaza' : '➕ Nueva Plaza'}
              </h2>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Plaza *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Plaza Américas"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.ciudad ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Cancún"
                  />
                  {errors.ciudad && (
                    <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.estado ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Quintana Roo"
                  />
                  {errors.estado && (
                    <p className="mt-1 text-sm text-red-600">{errors.estado}</p>
                  )}
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="Dirección completa de la plaza"
                  />
                </div>

                {/* Contacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Nombre del responsable"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 998-123-4567"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="correo@plaza.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
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
                    <span className="text-sm font-medium text-gray-700">Plaza Activa</span>
                  </label>
                  <p className="mt-1 text-sm text-gray-500">
                    Las plazas inactivas no aparecerán en los filtros de infracciones
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
                  {loading ? 'Guardando...' : (editingPlaza ? 'Actualizar' : 'Crear')} Plaza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlazasInfracciones;