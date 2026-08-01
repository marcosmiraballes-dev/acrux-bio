import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { plazaService } from '../services/plaza.service';
import { localService } from '../services/local.service';
import { generarReporteHuella } from '../utils/generarReporteHuella';

interface Plaza {
  id: string;
  nombre: string;
  ciudad?: string;
}

interface Local {
  id: string;
  nombre: string;
  giro?: string;
  plaza_id: string;
}

type TipoReporte = 'locatario' | 'plaza';

const ANIOS = [2026, 2025, 2024, 2023];

type TipoPeriodo = 'anual' | 'mensual';

const MESES = [
  { value: 1,  label: 'Enero' },
  { value: 2,  label: 'Febrero' },
  { value: 3,  label: 'Marzo' },
  { value: 4,  label: 'Abril' },
  { value: 5,  label: 'Mayo' },
  { value: 6,  label: 'Junio' },
  { value: 7,  label: 'Julio' },
  { value: 8,  label: 'Agosto' },
  { value: 9,  label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const HuellaCarbonoDirector: React.FC = () => {
  const { user } = useAuth();
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);

  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('locatario');
  const [selectedPlaza, setSelectedPlaza] = useState('');
  const [selectedLocal, setSelectedLocal] = useState('');
  const [anio, setAnio] = useState(2026);
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('anual');
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadPlazas(); loadLocales(); }, []);

  useEffect(() => {
    if (selectedPlaza) {
      setLocalesFiltrados(locales.filter(l => l.plaza_id === selectedPlaza));
      setSelectedLocal('');
    } else {
      setLocalesFiltrados(locales);
    }
  }, [selectedPlaza, locales]);

  const loadPlazas = async () => {
    try {
      const res = await plazaService.getAll();
      setPlazas(res.filter((p: Plaza) => p.nombre));
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  const loadLocales = async () => {
    try {
      const res = await localService.getAll();
      setLocales(res);
      setLocalesFiltrados(res);
    } catch (err) {
      console.error('Error cargando locales:', err);
    }
  };

  const handleGenerar = async () => {
    setError('');

    if (tipoReporte === 'locatario' && !selectedLocal) {
      setError('Selecciona un locatario'); return;
    }
    if (tipoReporte === 'plaza' && !selectedPlaza) {
      setError('Selecciona una plaza'); return;
    }

    try {
      setLoading(true);

      let data: any;
      const params = tipoPeriodo === 'mensual'
        ? { anio, mes }
        : { anio };

      if (tipoReporte === 'locatario') {
        const res = await api.get('/reportes/huella/locatario', {
          params: { local_id: selectedLocal, ...params }
        });
        data = res.data.data;
      } else {
        const res = await api.get('/reportes/huella/plaza', {
          params: { plaza_id: selectedPlaza, ...params }
        });
        data = res.data.data;
      }

      generarReporteHuella(data, tipoReporte);

    } catch (err: any) {
      console.error('Error generando reporte:', err);
      setError('Error al generar el reporte. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setSelectedPlaza('');
    setSelectedLocal('');
    setError('');
  };

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">🌍 Reporte de Huella de Carbono</h1>
        <p className="text-gray-600 mt-1">
          Genera reportes de CO₂ evitado por reciclaje — metodología EPA WARM v16
        </p>
      </div>

      <div className="card">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">♻️</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Configurar Reporte</h2>
            <p className="text-sm text-gray-600">Selecciona el tipo, período y destinatario</p>
          </div>
        </div>

        {/* Tipo de reporte */}
        <div className="mb-6">
          <label className="label">Tipo de reporte</label>
          <div className="flex gap-3 mt-1">
            <button
              onClick={() => { setTipoReporte('locatario'); setSelectedLocal(''); }}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                tipoReporte === 'locatario'
                  ? 'border-green-600 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              📍 Por Locatario
              <div className="text-xs font-normal mt-1 opacity-70">Reporte individual de un negocio</div>
            </button>
            <button
              onClick={() => { setTipoReporte('plaza'); setSelectedLocal(''); }}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                tipoReporte === 'plaza'
                  ? 'border-green-600 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              🏢 Por Plaza
              <div className="text-xs font-normal mt-1 opacity-70">Reporte consolidado con ranking</div>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Plaza */}
          <div>
            <label className="label">Plaza {tipoReporte === 'plaza' ? '*' : ''}</label>
            <select
              value={selectedPlaza}
              onChange={e => setSelectedPlaza(e.target.value)}
              className="input"
              disabled={loading}
            >
              <option value="">
                {tipoReporte === 'plaza' ? 'Selecciona una plaza' : 'Todas las plazas'}
              </option>
              {plazas.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Locatario (solo si tipo = locatario) */}
          {tipoReporte === 'locatario' && (
            <div>
              <label className="label">Locatario *</label>
              <select
                value={selectedLocal}
                onChange={e => setSelectedLocal(e.target.value)}
                className="input"
                disabled={loading}
              >
                <option value="">Selecciona un locatario</option>
                {localesFiltrados.filter(l => l.nombre).map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Período */}
          <div>
            <label className="label">Período</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setTipoPeriodo('anual')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  tipoPeriodo === 'anual'
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Anual
              </button>
              <button
                onClick={() => setTipoPeriodo('mensual')}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  tipoPeriodo === 'mensual'
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Mensual
              </button>
            </div>
          </div>

          {/* Año */}
          <div>
            <label className="label">Año</label>
            <select
              value={anio}
              onChange={e => setAnio(parseInt(e.target.value))}
              className="input"
              disabled={loading}
            >
              {ANIOS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Mes — solo visible si período = mensual */}
          {tipoPeriodo === 'mensual' && (
            <div>
              <label className="label">Mes</label>
              <select
                value={mes}
                onChange={e => setMes(parseInt(e.target.value))}
                className="input"
                disabled={loading}
              >
                {MESES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerar}
            disabled={loading}
            className="btn btn-primary flex items-center space-x-2"
          >
            <span>📄</span>
            <span>{loading ? 'Generando...' : 'Generar Reporte'}</span>
          </button>
          <button
            onClick={handleLimpiar}
            disabled={loading}
            className="btn btn-secondary"
          >
            Limpiar
          </button>
        </div>

        {error && (
          <div className="mt-4 card bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 card bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="text-sm font-semibold text-green-800 mb-1">Metodología</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Factores de CO₂ basados en <strong>EPA Waste Reduction Model (WARM) v16</strong>, diciembre 2023</li>
                <li>• Equivalencias: EPA GHG Equivalencies Calculator · CFE/INECC FESEN 2023 · IPCC 2006 Guidelines</li>
                <li>• El reporte se abre en una nueva pestaña listo para imprimir o guardar como PDF</li>
                <li>• El inorgánico se reporta como residuo gestionado — sin CO₂ evitado atribuible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HuellaCarbonoDirector;
