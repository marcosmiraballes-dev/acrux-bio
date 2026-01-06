// frontend/src/pages/Vehiculos.tsx

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Vehiculo {
  id: string;
  tipo: string;
  placas: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const Vehiculos: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    placas: '',
    activo: true
  });

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehiculos');
      setVehiculos(response.data.data);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehiculo) {
        await api.put(`/vehiculos/${editingVehiculo.id}`, formData);
      } else {
        await api.post('/vehiculos', formData);
      }
      fetchVehiculos();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar vehículo');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/vehiculos/${id}/toggle-active`);
      fetchVehiculos();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este vehículo?')) return;
    try {
      await api.delete(`/vehiculos/${id}`);
      fetchVehiculos();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const openModal = (vehiculo?: Vehiculo) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setFormData({
        tipo: vehiculo.tipo,
        placas: vehiculo.placas,
        activo: vehiculo.activo
      });
    } else {
      setEditingVehiculo(null);
      setFormData({ tipo: '', placas: '', activo: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehiculo(null);
    setFormData({ tipo: '', placas: '', activo: true });
  };

  const filteredVehiculos = vehiculos.filter(v =>
    v.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.placas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: vehiculos.length,
    activos: vehiculos.filter(v => v.activo).length,
    inactivos: vehiculos.filter(v => !v.activo).length
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehículos</h1>
        <button
          onClick={() => openModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
        >
          + Nuevo Vehículo
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
          placeholder="Buscar por tipo o placas..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVehiculos.map((vehiculo) => (
              <tr key={vehiculo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{vehiculo.tipo}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">{vehiculo.placas}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    vehiculo.activo 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {vehiculo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  <button
                    onClick={() => openModal(vehiculo)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggleActive(vehiculo.id)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    {vehiculo.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(vehiculo.id)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Vehículo *
                </label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: F350 con remolque"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placas *
                </label>
                <input
                  type="text"
                  value={formData.placas}
                  onChange={(e) => setFormData({ ...formData, placas: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Ej: LF65825"
                  required
                  maxLength={20}
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

export default Vehiculos;