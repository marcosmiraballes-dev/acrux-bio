import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { plazaService } from '../services/plaza.service';
import { localService } from '../services/local.service';

interface Plaza { id: string; nombre: string; }
interface Local { id: string; nombre: string; plaza_id: string; }

const ReportesDirector: React.FC = () => {
  const { user } = useAuth();
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);
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
  const [selectedPlazaCertPlaza, setSelectedPlazaCertPlaza] = useState<string>('');
  const [tipoPeriodoCertPlaza, setTipoPeriodoCertPlaza] = useState<'anual' | 'mensual'>('anual');
  const [anoCertPlaza, setAnoCertPlaza] = useState<string>(new Date().getFullYear().toString());
  const [mesCertPlaza, setMesCertPlaza] = useState<string>('');
  const [loadingCertPlaza, setLoadingCertPlaza] = useState(false);
  const [errorCertPlaza, setErrorCertPlaza] = useState('');

  useEffect(() => { loadPlazas(); loadLocales(); }, []);

  useEffect(() => {
    if (selectedPlaza) { setLocalesFiltrados(locales.filter(l => l.plaza_id === selectedPlaza)); setSelectedLocal(''); }
    else setLocalesFiltrados(locales);
  }, [selectedPlaza, locales]);

  useEffect(() => {
    if (selectedPlazaCert) { setLocalesFiltradosCert(locales.filter(l => l.plaza_id === selectedPlazaCert)); setSelectedLocalCert(''); }
    else setLocalesFiltradosCert(locales);
  }, [selectedPlazaCert, locales]);

  const loadPlazas = async () => {
    try { const r = await plazaService.getAll(); setPlazas(r); } catch {}
  };

  const loadLocales = async () => {
    try { const r = await localService.getAll(); setLocales(r); setLocalesFiltrados(r); } catch {}
  };

  const handleGenerarBitacora = async () => {
    if (!selectedLocal) { setError('Por favor selecciona un locatario'); return; }
    if (!fechaDesde || !fechaHasta) { setError('Por favor selecciona las fechas'); return; }
    setLoading(true); setError('');
    try {
      const response = await api.get('/bitacoras/locatario', { params: { local_id: selectedLocal, fecha_desde: fechaDesde, fecha_hasta: fechaHasta }, responseType: 'arraybuffer' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const local = locales.find(l => l.id === selectedLocal);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `bitacora-${local?.nombre.replace(/\s+/g,'-') || 'locatario'}-${Date.now()}.xlsx`;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
    } catch { setError('Error al generar la bitácora. Por favor, intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  const handleLimpiar = () => { setSelectedPlaza(''); setSelectedLocal(''); setFechaDesde(''); setFechaHasta(''); setError(''); };

  const handleGenerarCertificado = async () => {
    if (!selectedLocalCert) { setErrorCert('Por favor selecciona un locatario'); return; }
    if (!anoCert) { setErrorCert('Por favor selecciona el año'); return; }
    if (tipoPeriodo === 'mensual' && !mesCert) { setErrorCert('Por favor selecciona el mes'); return; }
    setLoadingCert(true); setErrorCert('');
    try {
      const params: any = { local_id: selectedLocalCert, anio: anoCert, tipo: tipoPeriodo };
      if (tipoPeriodo === 'mensual') params.mes = mesCert;
      const response = await api.get('/certificados/reciclaje', { params, responseType: 'blob' });
      const local = locales.find(l => l.id === selectedLocalCert);
      const periodo = tipoPeriodo === 'anual' ? anoCert : `${mesCert}-${anoCert}`;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url; link.download = `certificado-${local?.nombre.replace(/\s+/g,'-') || 'locatario'}-${periodo}.html`;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
    } catch { setErrorCert('Error al generar el certificado. Por favor, intenta de nuevo.'); }
    finally { setLoadingCert(false); }
  };

  const handleGenerarCertificadoPlaza = async () => {
    if (!selectedPlazaCertPlaza) { setErrorCertPlaza('Por favor selecciona una plaza'); return; }
    if (!anoCertPlaza) { setErrorCertPlaza('Por favor selecciona el año'); return; }
    if (tipoPeriodoCertPlaza === 'mensual' && !mesCertPlaza) { setErrorCertPlaza('Por favor selecciona el mes'); return; }
    setLoadingCertPlaza(true); setErrorCertPlaza('');
    try {
      const params: any = { plaza_id: selectedPlazaCertPlaza, anio: anoCertPlaza, tipo: tipoPeriodoCertPlaza };
      if (tipoPeriodoCertPlaza === 'mensual') params.mes = mesCertPlaza;
      const response = await api.get('/certificados/plaza', { params, responseType: 'blob' });
      const plaza = plazas.find(p => p.id === selectedPlazaCertPlaza);
      const periodo = tipoPeriodoCertPlaza === 'anual' ? anoCertPlaza : `${mesCertPlaza}-${anoCertPlaza}`;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url; link.download = `certificado-plaza-${plaza?.nombre.replace(/\s+/g,'-') || 'plaza'}-${periodo}.html`;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
    } catch { setErrorCertPlaza('Error al generar el certificado. Por favor, intenta de nuevo.'); }
    finally { setLoadingCertPlaza(false); }
  };

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Reportes y Certificados</h1>
        <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
      </div>

      {/* CARD 1 — Bitácora */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">📊</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Bitácora de Locatario</h2>
            <p className="text-sm text-gray-600">Genera el reporte detallado de recolecciones por local</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="label">Plaza</label>
            <select value={selectedPlaza} onChange={(e) => setSelectedPlaza(e.target.value)} className="input" disabled={loading}>
              <option value="">Todas las plazas</option>
              {plazas.filter(p => p.nombre).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Locatario *</label>
            <select value={selectedLocal} onChange={(e) => setSelectedLocal(e.target.value)} className="input" disabled={loading}>
              <option value="">Selecciona un locatario</option>
              {localesFiltrados.filter(l => l.nombre).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fecha Desde *</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input" disabled={loading} />
          </div>
          <div>
            <label className="label">Fecha Hasta *</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input" disabled={loading} />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleGenerarBitacora} disabled={loading} className="btn btn-primary flex items-center space-x-2">
            <span>📥</span><span>{loading ? 'Generando...' : 'Generar Bitácora'}</span>
          </button>
          <button onClick={handleLimpiar} disabled={loading} className="btn btn-secondary">Limpiar</button>
        </div>
        {error && <div className="mt-4 card bg-red-50 border-red-200"><p className="text-red-700">{error}</p></div>}
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

      {/* CARD 2 — Certificado Locatario */}
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
              {plazas.filter(p => p.nombre).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Locatario *</label>
            <select value={selectedLocalCert} onChange={(e) => setSelectedLocalCert(e.target.value)} className="input" disabled={loadingCert}>
              <option value="">Selecciona un locatario</option>
              {localesFiltradosCert.filter(l => l.nombre).map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Período *</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="tipoPeriodo" value="anual" checked={tipoPeriodo === 'anual'} onChange={() => setTipoPeriodo('anual')} /> Anual
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="tipoPeriodo" value="mensual" checked={tipoPeriodo === 'mensual'} onChange={() => setTipoPeriodo('mensual')} /> Mensual
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
            <span>🏆</span><span>{loadingCert ? 'Generando...' : 'Generar Certificado'}</span>
          </button>
          <button onClick={() => { setSelectedPlazaCert(''); setSelectedLocalCert(''); setAnoCert(new Date().getFullYear().toString()); setMesCert(''); setTipoPeriodo('anual'); setErrorCert(''); }} disabled={loadingCert} className="btn btn-secondary">Limpiar</button>
        </div>
        {errorCert && <div className="mt-4 card bg-red-50 border-red-200"><p className="text-red-700">{errorCert}</p></div>}
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

      {/* CARD 3 — Certificado Plaza */}
      <div className="card mt-6">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">🏢</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Certificado de Reciclaje — Plaza</h2>
            <p className="text-sm text-gray-600">Genera el certificado de impacto ambiental consolidado por plaza</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label">Plaza *</label>
            <select value={selectedPlazaCertPlaza} onChange={(e) => setSelectedPlazaCertPlaza(e.target.value)} className="input" disabled={loadingCertPlaza}>
              <option value="">Selecciona una plaza</option>
              {plazas.filter(p => p.nombre).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Período *</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="tipoPeriodoCertPlaza" value="anual" checked={tipoPeriodoCertPlaza === 'anual'} onChange={() => setTipoPeriodoCertPlaza('anual')} /> Anual
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" name="tipoPeriodoCertPlaza" value="mensual" checked={tipoPeriodoCertPlaza === 'mensual'} onChange={() => setTipoPeriodoCertPlaza('mensual')} /> Mensual
              </label>
            </div>
          </div>
          <div>
            <label className="label">Año *</label>
            <select value={anoCertPlaza} onChange={(e) => setAnoCertPlaza(e.target.value)} className="input" disabled={loadingCertPlaza}>
              {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        {tipoPeriodoCertPlaza === 'mensual' && (
          <div className="mb-6 w-48">
            <label className="label">Mes *</label>
            <select value={mesCertPlaza} onChange={(e) => setMesCertPlaza(e.target.value)} className="input" disabled={loadingCertPlaza}>
              <option value="">Selecciona mes</option>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                <option key={m} value={m}>{new Date(2000, i, 1).toLocaleDateString('es-MX', { month: 'long' })}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <button onClick={handleGenerarCertificadoPlaza} disabled={loadingCertPlaza} className="btn btn-primary flex items-center space-x-2">
            <span>🏢</span><span>{loadingCertPlaza ? 'Generando...' : 'Generar Certificado Plaza'}</span>
          </button>
          <button onClick={() => { setSelectedPlazaCertPlaza(''); setAnoCertPlaza(new Date().getFullYear().toString()); setMesCertPlaza(''); setTipoPeriodoCertPlaza('anual'); setErrorCertPlaza(''); }} disabled={loadingCertPlaza} className="btn btn-secondary">Limpiar</button>
        </div>
        {errorCertPlaza && <div className="mt-4 card bg-red-50 border-red-200"><p className="text-red-700">{errorCertPlaza}</p></div>}
        <div className="mt-6 card bg-emerald-50 border-emerald-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 mb-1">Información</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Selecciona la plaza y el período deseado</li>
                <li>• El certificado consolida todos los locatarios de la plaza</li>
                <li>• Incluye total de CO₂, locatarios participantes y equivalencias</li>
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
