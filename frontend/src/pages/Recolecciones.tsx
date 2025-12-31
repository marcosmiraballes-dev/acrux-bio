import React, { useState, useEffect } from 'react';
import { recoleccionService } from '../services/recoleccion.service';
import { plazaService } from '../services/plaza.service';
import { localService } from '../services/local.service';
import { Recoleccion, Plaza, Local } from '../types';
import { useAuth } from '../context/AuthContext';
import RecoleccionModal from '../components/common/RecoleccionModal';

const Recolecciones: React.FC = () => {
  const { user } = useAuth();
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterPlaza, setFilterPlaza] = useState<string>('');
  const [filterLocal, setFilterLocal] = useState<string>('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedRecoleccion, setSelectedRecoleccion] = useState<Recoleccion | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canEdit = user?.rol === 'ADMIN';
  const canDelete = user?.rol === 'ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterPlaza && filterPlaza !== 'independientes') {
      setLocalesFiltrados(locales.filter(l => l.plaza_id === filterPlaza));
      setFilterLocal('');
    } else if (filterPlaza === 'independientes') {
      setLocalesFiltrados(locales.filter(l => !l.plaza_id));
      setFilterLocal('');
    } else {
      setLocalesFiltrados(locales);
    }
  }, [filterPlaza, locales]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recoleccionesData, plazasData, localesData] = await Promise.all([
        recoleccionService.getAll(),
        plazaService.getAll(),
        localService.getAll(),
      ]);
      
      // 🔍 DEBUG: Ver qué datos están llegando
      console.log('🔍 DATOS DE RECOLECCIONES:', recoleccionesData);
      console.log('🔍 PRIMER ELEMENTO:', recoleccionesData[0]);
      console.log('🔍 PLAZA DEL PRIMER ELEMENTO:', recoleccionesData[0]?.plazas);
      console.log('🔍 LOCAL DEL PRIMER ELEMENTO:', recoleccionesData[0]?.locales);
      
      setRecolecciones(recoleccionesData);
      setPlazas(plazasData);
      setLocales(localesData);
      setLocalesFiltrados(localesData);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (recoleccion: Recoleccion) => {
    setSelectedRecoleccion(recoleccion);
    setIsWizardOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedRecoleccion) {
        await recoleccionService.update(selectedRecoleccion.id, data);
        setSuccessMessage('Recolección actualizada correctamente');
      }
      await loadData();
      setIsWizardOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
      setTimeout(() => setError(''), 3000);
      throw err;
    }
  };

  const handleDelete = async (recoleccion: Recoleccion) => {
    if (!window.confirm('¿Estás seguro de eliminar esta recolección FÍSICAMENTE de la base de datos? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await recoleccionService.delete(recoleccion.id);
      setSuccessMessage('Recolección eliminada correctamente');
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (filterPlaza && filterPlaza !== 'independientes') {
        filters.plaza_id = filterPlaza;
      }
      
      if (filterLocal) {
        filters.local_id = filterLocal;
      }
      
      if (filterFechaDesde) filters.fecha_desde = filterFechaDesde;
      if (filterFechaHasta) filters.fecha_hasta = filterFechaHasta;
      
      const data = await recoleccionService.getAll(filters);
      
      if (filterPlaza === 'independientes') {
        setRecolecciones(data.filter(r => !r.plaza_id));
      } else {
        setRecolecciones(data);
      }
    } catch (err) {
      setError('Error al aplicar filtros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterPlaza('');
    setFilterLocal('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    loadData();
  };

  if (loading && recolecciones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Recolecciones</h1>
        <p className="text-gray-600">Busca y edita recolecciones existentes</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{successMessage}</div>
      )}

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={filterPlaza} onChange={(e) => setFilterPlaza(e.target.value)} className="input">
            <option value="">Todas las ubicaciones</option>
            <option value="independientes">🏪 Solo Independientes</option>
            <optgroup label="Plazas">
              {plazas.map((plaza) => (<option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>))}
            </optgroup>
          </select>

          <select value={filterLocal} onChange={(e) => setFilterLocal(e.target.value)} className="input" disabled={!filterPlaza && localesFiltrados.length > 50}>
            <option value="">{!filterPlaza && localesFiltrados.length > 50 ? 'Selecciona plaza primero' : 'Todos los locales'}</option>
            {localesFiltrados.map((local) => (<option key={local.id} value={local.id}>{local.nombre}</option>))}
          </select>

          <input type="date" value={filterFechaDesde} onChange={(e) => setFilterFechaDesde(e.target.value)} className="input" />
          <input type="date" value={filterFechaHasta} onChange={(e) => setFilterFechaHasta(e.target.value)} className="input" />

          <div className="flex gap-2">
            <button onClick={applyFilters} className="btn btn-secondary flex-1" disabled={loading}>🔍 Filtrar</button>
            <button onClick={clearFilters} className="btn btn-secondary" disabled={loading}>✕</button>
          </div>
        </div>

        {(filterPlaza || filterLocal || filterFechaDesde || filterFechaHasta) && (
          <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            {filterPlaza && filterPlaza !== 'independientes' && (
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">Plaza: {plazas.find(p => p.id === filterPlaza)?.nombre}</span>
            )}
            {filterPlaza === 'independientes' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Solo Independientes</span>
            )}
            {filterLocal && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Local: {locales.find(l => l.id === filterLocal)?.nombre}</span>
            )}
            {filterFechaDesde && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Desde: {new Date(filterFechaDesde).toLocaleDateString('es-MX')}</span>
            )}
            {filterFechaHasta && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Hasta: {new Date(filterFechaHasta).toLocaleDateString('es-MX')}</span>
            )}
          </div>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {recolecciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg">{filterPlaza || filterLocal || filterFechaDesde || filterFechaHasta ? 'No se encontraron recolecciones' : 'No hay recolecciones'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Kilos</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recolecciones.map((recoleccion) => (
                  <tr key={recoleccion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(recoleccion.fecha_recoleccion + 'T00:00:00').toLocaleDateString('es-MX')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recoleccion.plazas ? (
                        <div className="text-sm text-gray-900">🏢 {recoleccion.plazas.nombre}</div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">🏪 Independiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{recoleccion.locales?.nombre || 'N/A'}</div>
                      {recoleccion.notas && (
                        <div className="text-xs text-gray-500 mt-1">{recoleccion.notas.substring(0, 40)}{recoleccion.notas.length > 40 ? '...' : ''}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-green-700">{(recoleccion.total_kilos || 0).toFixed(2)} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {(recoleccion as any).detalle_recolecciones?.length || 0} tipos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button onClick={() => handleEdit(recoleccion)} className="text-primary-600 hover:text-primary-800 font-medium">✏️ Editar</button>
                      {canDelete && (
                        <button onClick={() => handleDelete(recoleccion)} className="text-red-600 hover:text-red-800 font-medium">🗑️ Eliminar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecoleccionModal isOpen={isWizardOpen} onClose={() => { setIsWizardOpen(false); setSelectedRecoleccion(null); }} onSave={handleSave} recoleccion={selectedRecoleccion} />
    </div>
  );
};

export default Recolecciones;