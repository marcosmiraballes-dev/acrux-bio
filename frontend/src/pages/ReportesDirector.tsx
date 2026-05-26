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
  const [tipoPeriodo, setTipoPeriodo] = useState<'anual' | 'mensual'>('anual');
  const [anoCert, setAnoCert] = useState<string>(new Date().getFullYear().toString());
  const [mesCert, setMesCert] = useState<string>('');
  const [selectedLocalCert, setSelectedLocalCert] = useState<string>('');
  const [selectedPlazaCert, setSelectedPlazaCert] = useState<string>('');
  const [localesFiltradosCert, setLocalesFiltradosCert] = useState<Local[]>([]);
  const [loadingCert, setLoadingCert] = useState(false);
  const [errorCert, setErrorCert] = useState('');

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

  useEffect(() => {
    if (selectedPlazaCert) {
      setLocalesFiltradosCert(locales.filter(l => l.plaza_id === selectedPlazaCert));
      setSelectedLocalCert('');
    } else {
      setLocalesFiltradosCert(locales);
    }
  }, [selectedPlazaCert, locales]);

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

  const handleGenerarCertificado = async () => {
    if (!selectedLocalCert) { setErrorCert('Por favor selecciona un locatario'); return; }
    if (!anoCert) { setErrorCert('Por favor selecciona el año'); return; }
    if (tipoPeriodo === 'mensual' && !mesCert) { setErrorCert('Por favor selecciona el mes'); return; }
    setLoadingCert(true);
    setErrorCert('');
    try {
      const params: any = { local_id: selectedLocalCert, anio: anoCert, tipo: tipoPeriodo };
      if (tipoPeriodo === 'mensual') params.mes = mesCert;
      const response = await api.get('/certificados/reciclaje', { params, responseType: 'blob' });
      const local = locales.find(l => l.id === selectedLocalCert);
      const periodo = tipoPeriodo === 'anual' ? anoCert : `${mesCert}-${anoCert}`;
      const nombreArchivo = `certificado-${local?.nombre.replace(/\s+/g, '-') || 'locatario'}-${periodo}.html`;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
    } catch (err: any) {
      setErrorCert('Error al generar el certificado. Por favor, intenta de nuevo.');
    } finally {
      setLoadingCert(false);
    }
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

      <div className="card mt-6">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">🏆</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Certificado de Reciclaje</h2>
            <p className="text-sm text-gray-600">Genera el certificado de impacto ambiental por locatario</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="label">Plaza</label>
            <select value={selectedPlazaCert} onChange={(e) => setSelectedPlazaCert(e.target.value)} className="input" disabled={loadingCert}>
              <option value="">Todas las plazas</option>
              {plazas.filter(p => p.nombre).map((plaza) => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Locatario *</label>
            <select value={selectedLocalCert} onChange={(e) => setSelectedLocalCert(e.target.value)} className="input" disabled={loadingCert}>
              <option value="">Selecciona un locatario</option>
              {localesFiltradosCert.filter(l => l.nombre).map((local) => (
                <option key={local.id} value={local.id}>{local.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Período *</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="tipoPeriodo" value="anual" checked={tipoPeriodo === 'anual'} onChange={() => setTipoPeriodo('anual')} />
                Anual
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="tipoPeriodo" value="mensual" checked={tipoPeriodo === 'mensual'} onChange={() => setTipoPeriodo('mensual')} />
                Mensual
              </label>
            </div>
          </div>
          <div>
            <label className="label">Año *</label>
            <select value={anoCert} onChange={(e) => setAnoCert(e.target.value)} className="input" disabled={loadingCert}>
              {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {tipoPeriodo === 'mensual' && (
          <div className="mb-6 w-48">
            <label className="label">Mes *</label>
            <select value={mesCert} onChange={(e) => setMesCert(e.target.value)} className="input" disabled={loadingCert}>
              <option value="">Selecciona mes</option>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                <option key={m} value={m}>{new Date(2000, i, 1).toLocaleDateString('es-MX', { month: 'long' })}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <button onClick={handleGenerarCertificado} disabled={loadingCert} className="btn btn-primary flex items-center space-x-2">
            <span>🏆</span>
            <span>{loadingCert ? 'Generando...' : 'Generar Certificado'}</span>
          </button>
          <button onClick={() => { setSelectedPlazaCert(''); setSelectedLocalCert(''); setAnoCert(new Date().getFullYear().toString()); setMesCert(''); setTipoPeriodo('anual'); setErrorCert(''); }} disabled={loadingCert} className="btn btn-secondary">Limpiar</button>
        </div>

        {errorCert && (
          <div className="mt-4 card bg-red-50 border-red-200">
            <p className="text-red-700">{errorCert}</p>
          </div>
        )}

        <div className="mt-6 card bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-sm font-semibold text-green-800 mb-1">Información</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Selecciona el locatario y el período deseado</li>
                <li>• El certificado incluye CO₂ evitado, equivalencias y firma</li>
                <li>• Se descarga en formato HTML listo para imprimir o compartir</li>
                <li>• Metodología EPA WARM v16 · Factor SEMARNAT/RENE 2026</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesDirector;