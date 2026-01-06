// frontend/src/pages/FoliosReservados.tsx

import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface FolioReservado {
  id: string;
  folio_manual: string;
  plaza_id: string;
  usado: boolean;
  manifiesto_id: string | null;
  created_at: string;
}

interface Plaza {
  id: string;
  nombre: string;
  codigo_folio: string;
}

interface Estadisticas {
  total: number;
  usados: number;
  disponibles: number;
  limite: number;
  puede_crear: boolean;
}

const FoliosReservados: React.FC = () => {
  const [folios, setFolios] = useState<FolioReservado[]>([]);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolio, setEditingFolio] = useState<FolioReservado | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  
  // Filtro de plaza
  const [plazaFiltro, setPlazaFiltro] = useState('');

  const [formData, setFormData] = useState({
    folio_manual: '',
    plaza_id: ''
  });

  useEffect(() => {
    fetchPlazas();
  }, []);

  useEffect(() => {
    if (plazas.length > 0) {
      fetchFolios();
      // fetchEstadisticas(); // COMENTADO - endpoint no existe
    }
  }, [plazaFiltro, plazas]);

  const fetchPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      // Filtrar solo plazas que tienen código de folio
      const plazasConCodigo = response.data.data.filter((p: Plaza) => p.codigo_folio);
      setPlazas(plazasConCodigo);
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    }
  };

  const fetchFolios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/folios-reservados');
      
      // Filtrar por plaza si hay filtro seleccionado
      let foliosFiltrados = response.data.data;
      if (plazaFiltro) {
        foliosFiltrados = foliosFiltrados.filter((f: FolioReservado) => f.plaza_id === plazaFiltro);
      }
      
      setFolios(foliosFiltrados);
    } catch (error) {
      console.error('Error al cargar folios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    // TEMPORALMENTE DESHABILITADO - endpoint no existe
    // try {
    //   const response = await api.get('/folios-reservados/count');
    //   setEstadisticas({
    //     total: response.data.data,
    //     disponibles: folios.filter(f => !f.usado).length,
    //     usados: folios.filter(f => f.usado).length,
    //     limite: 10,
    //     puede_crear: response.data.data < 10
    //   });
    // } catch (error) {
    //   console.error('Error al cargar estadísticas:', error);
    // }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plaza_id) {
      alert('Debes seleccionar una plaza');
      return;
    }
    
    try {
      if (editingFolio) {
        await api.put(`/folios-reservados/${editingFolio.id}`, { 
          folio_manual: formData.folio_manual 
        });
      } else {
        await api.post('/folios-reservados', formData);
      }
      fetchFolios();
      // fetchEstadisticas(); // COMENTADO
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar folio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este folio reservado?')) return;
    try {
      await api.delete(`/folios-reservados/${id}`);
      fetchFolios();
      // fetchEstadisticas(); // COMENTADO
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar');
    }
  };

  const openModal = (folio?: FolioReservado) => {
    if (folio) {
      setEditingFolio(folio);
      setFormData({
        folio_manual: folio.folio_manual,
        plaza_id: folio.plaza_id
      });
    } else {
      setEditingFolio(null);
      setFormData({ 
        folio_manual: '', 
        plaza_id: plazas.length > 0 ? plazas[0].id : ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFolio(null);
    setFormData({ folio_manual: '', plaza_id: '' });
  };

  const generarFolioSugerido = () => {
    if (!formData.plaza_id) return '';
    
    const plaza = plazas.find(p => p.id === formData.plaza_id);
    if (!plaza) return '';
    
    const anioActual = new Date().getFullYear();
    
    // Contar cuántos folios de esta plaza ya existen para este año
    const foliosPlazaAnio = folios.filter(f => {
      const esPlaza = f.plaza_id === formData.plaza_id;
      const esAnio = f.folio_manual.includes(`-${anioActual}`);
      return esPlaza && esAnio;
    });
    
    const numero = (foliosPlazaAnio.length + 1).toString().padStart(3, '0');
    return `${plaza.codigo_folio}-${numero}-${anioActual}`;
  };

  const getNombrePlaza = (plazaId: string) => {
    const plaza = plazas.find(p => p.id === plazaId);
    return plaza ? plaza.nombre : 'N/A';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📌 Folios Reservados</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gestión de folios especiales reservados por plaza
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          + Nuevo Folio
        </button>
      </div>

      {/* Filtro de Plaza */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Plaza</label>
        <select
          value={plazaFiltro}
          onChange={(e) => setPlazaFiltro(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todas las plazas</option>
          {plazas.map((plaza) => (
            <option key={plaza.id} value={plaza.id}>
              {plaza.nombre} ({plaza.codigo_folio})
            </option>
          ))}
        </select>
      </div>

      {/* Estadísticas - TEMPORALMENTE COMENTADO */}
      {/* {estadisticas && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-800">{estadisticas.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Disponibles</p>
            <p className="text-2xl font-bold text-emerald-600">{estadisticas.disponibles}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Usados</p>
            <p className="text-2xl font-bold text-gray-400">{estadisticas.usados}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Límite Máximo</p>
            <p className="text-2xl font-bold text-blue-600">{estadisticas.limite}</p>
          </div>
        </div>
      )} */}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plaza</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {folios.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay folios reservados
                  {plazaFiltro && ' para la plaza seleccionada'}
                </td>
              </tr>
            ) : (
              folios.map((folio) => (
                <tr key={folio.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">
                    {folio.folio_manual}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getNombrePlaza(folio.plaza_id)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      folio.usado 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {folio.usado ? 'Usado' : 'Disponible'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    {!folio.usado && (
                      <>
                        <button
                          onClick={() => openModal(folio)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(folio.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                    {folio.usado && (
                      <span className="text-gray-400">No editable</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingFolio ? 'Editar Folio Reservado' : 'Nuevo Folio Reservado'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Selector de Plaza */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plaza *
                </label>
                <select
                  value={formData.plaza_id}
                  onChange={(e) => setFormData({ ...formData, plaza_id: e.target.value, folio_manual: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={!!editingFolio}
                >
                  <option value="">Selecciona una plaza</option>
                  {plazas.map((plaza) => (
                    <option key={plaza.id} value={plaza.id}>
                      {plaza.nombre} ({plaza.codigo_folio})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sugerencia de folio */}
              {!editingFolio && formData.plaza_id && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Sugerencia: <span className="font-mono font-bold">{generarFolioSugerido()}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, folio_manual: generarFolioSugerido() })}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Usar esta sugerencia
                  </button>
                </div>
              )}

              {/* Input de Folio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folio Reservado *
                </label>
                <input
                  type="text"
                  value={formData.folio_manual}
                  onChange={(e) => setFormData({ ...formData, folio_manual: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Ej: AmPDC-001-2026"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: CODIGO-NNN-YYYY (ejemplo: AmPDC-001-2026)
                </p>
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

export default FoliosReservados;