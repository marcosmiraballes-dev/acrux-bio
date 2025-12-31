import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Plaza {
  id: string;
  nombre: string;
}

interface Local {
  id: string;
  nombre: string;
  plaza_id: string;
}

const ReportesDirector: React.FC = () => {
  const { user } = useAuth();
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);
  
  // Filtros
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [selectedLocal, setSelectedLocal] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlazas();
    loadLocales();
  }, []);

  useEffect(() => {
    // Filtrar locales por plaza seleccionada
    if (selectedPlaza) {
      setLocalesFiltrados(locales.filter(l => l.plaza_id === selectedPlaza));
      setSelectedLocal(''); // Reset local cuando cambia plaza
    } else {
      setLocalesFiltrados(locales);
    }
  }, [selectedPlaza, locales]);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  const loadLocales = async () => {
    try {
      const response = await api.get('/locales');
      setLocales(response.data.data || []);
      setLocalesFiltrados(response.data.data || []);
    } catch (err) {
      console.error('Error cargando locales:', err);
    }
  };

  const handleGenerarBitacora = async () => {
    try {
      // Validaciones
      if (!selectedLocal) {
        setError('Por favor selecciona un locatario');
        return;
      }
      if (!fechaDesde || !fechaHasta) {
        setError('Por favor selecciona las fechas');
        return;
      }
      
      setLoading(true);
      setError('');
      
      const params: any = {
        local_id: selectedLocal,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };

      console.log('📋 Generando bitácora con params:', params);
      
      // Usar arraybuffer para mejor manejo del archivo
      const response = await api.get('/bitacoras/locatario', {
        params: params,
        responseType: 'arraybuffer'
      });

      console.log('📄 Bitácora recibida:', response.data.byteLength, 'bytes');

      // Crear blob desde arraybuffer
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Obtener nombre del local para el archivo
      const local = locales.find(l => l.id === selectedLocal);
      const nombreArchivo = `bitacora-${local?.nombre.replace(/\s+/g, '-') || 'locatario'}-${Date.now()}.xlsx`;
      
      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('✅ Bitácora descargada exitosamente');
      }, 100);
      
      setError('');
    } catch (err: any) {
      console.error('❌ Error generando bitácora:', err);
      setError('Error al generar la bitácora. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setSelectedPlaza('');
    setSelectedLocal('');
    setFechaDesde('');
    setFechaHasta('');
    setError('');
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Reportes y Bitácoras</h1>
        <p className="text-gray-600 mt-1">Bienvenida, {user?.nombre} - Generación de Reportes</p>
      </div>

      {/* Card Principal */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
            📊
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Bitácora de Locatario</h2>
            <p className="text-sm text-gray-600">Genera el reporte detallado de recolecciones por local</p>
          </div>
        </div>

        {/* Formulario de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Plaza */}
          <div>
            <label className="label">Plaza</label>
            <select 
              value={selectedPlaza} 
              onChange={(e) => setSelectedPlaza(e.target.value)} 
              className="input"
              disabled={loading}
            >
              <option value="">Todas las plazas</option>
              {plazas.filter(p => p.nombre).map((plaza) => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>

          {/* Locatario */}
          <div>
            <label className="label">Locatario *</label>
            <select 
              value={selectedLocal} 
              onChange={(e) => setSelectedLocal(e.target.value)} 
              className="input"
              disabled={loading}
            >
              <option value="">Selecciona un locatario</option>
              {localesFiltrados.filter(l => l.nombre).map((local) => (
                <option key={local.id} value={local.id}>{local.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="label">Fecha Desde *</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
              className="input"
              disabled={loading}
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="label">Fecha Hasta *</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
              className="input"
              disabled={loading}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleGenerarBitacora}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <span>📥</span>
            <span>{loading ? 'Generando...' : 'Generar Bitácora'}</span>
          </button>
          
          <button 
            onClick={handleLimpiar}
            disabled={loading}
            className="btn btn-secondary"
          >
            Limpiar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 card bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 card bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Información</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Selecciona un locatario y el rango de fechas</li>
                <li>• El reporte incluirá todas las recolecciones del periodo</li>
                <li>• Se descargará un archivo Excel con el formato oficial</li>
                <li>• El archivo incluye el logo de Elefantes Verdes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesDirector;