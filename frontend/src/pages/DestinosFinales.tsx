// frontend/src/pages/DestinosFinales.tsx

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface DestinoFinal {
  id: string;
  nombre_destino: string;
  domicilio: string;
  numero_autorizacion: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const DestinosFinales: React.FC = () => {
  const [destinos, setDestinos] = useState<DestinoFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestino, setEditingDestino] = useState<DestinoFinal | null>(null);
  const [formData, setFormData] = useState({
    nombre_destino: '',
    domicilio: '',
    numero_autorizacion: '',
    activo: true
  });

  useEffect(() => {
    fetchDestinos();
  }, []);

  const fetchDestinos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/destinos-finales');
      setDestinos(response.data.data);
    } catch (error) {
      console.error('Error al cargar destinos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDestino) {
        await api.put(`/destinos-finales/${editingDestino.id}`, formData);
      } else {
        await api.post('/destinos-finales', formData);
      }
      fetchDestinos();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar destino');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/destinos-finales/${id}/toggle-active`);
      fetchDestinos();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este destino final?')) return;
    try {
      await api.delete(`/destinos-finales/${id}`);
      fetchDestinos();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const openModal = (destino?: DestinoFinal) => {
    if (destino) {
      setEditingDestino(destino);
      setFormData({
        nombre_destino: destino.nombre_destino,
        domicilio: destino.domicilio,
        numero_autorizacion: destino.numero_autorizacion,
        activo: destino.activo
      });
    } else {
      setEditingDestino(null);
      setFormData({ nombre_destino: '', domicilio: '', numero_autorizacion: '', activo: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDestino(null);
    setFormData({ nombre_destino: '', domicilio: '', numero_autorizacion: '', activo: true });
  };

  const filteredDestinos = destinos.filter(d =>
    d.nombre_destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.numero_autorizacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: destinos.length,
    activos: destinos.filter(d => d.activo).length,
    inactivos: destinos.filter(d => !d.activo).length
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Destinos Finales</h1>
        <button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
        >
          + Nuevo Destino
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Activos</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.activos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Inactivos</p>
          <p className="text-2xl font-bold text-gray-400">{stats.inactivos}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o número de autorización..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domicilio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Autorización</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDestinos.map((destino) => (
              <tr key={destino.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{destino.nombre_destino}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{destino.domicilio}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">{destino.numero_autorizacion}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    destino.activo 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {destino.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  <button
                    onClick={() => openModal(destino)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(destino.id)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    {destino.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(destino.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingDestino ? 'Editar Destino Final' : 'Nuevo Destino Final'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Destino *
                </label>
                <input
                  type="text"
                  value={formData.nombre_destino}
                  onChange={(e) => setFormData({ ...formData, nombre_destino: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Centro de Acopio Temporal"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domicilio Completo *
                </label>
                <textarea
                  value={formData.domicilio}
                  onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Calle, número, colonia, CP, ciudad, estado"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Autorización *
                </label>
                <input
                  type="text"
                  value={formData.numero_autorizacion}
                  onChange={(e) => setFormData({ ...formData, numero_autorizacion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Ej: SEMA-QROO-2025-001"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinosFinales;