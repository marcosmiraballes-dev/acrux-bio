import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { plazaService } from '../services/plaza.service';
import { generateDirectorHTML } from '../utils/generateDirectorHTML';

export interface Stats {
  total_recolecciones: number;
  total_kilos: number;
  co2_evitado: number;
}

export interface StatsByTipo {
  tipo_residuo_nombre: string;
  tipo_residuo_icono: string;
  total_kilos: number;
  co2_evitado: number;
}

export interface TendenciaMensual {
  mes: string;
  total_kilos: number;
  co2_evitado: number;
}

export interface ComparativaPlazas {
  plaza_nombre: string;
  total_recolecciones: number;
  total_kilos: number;
  co2_evitado: number;
}

export interface TopLocal {
  local_nombre: string;
  plaza_nombre: string;
  total_kilos: number;
  co2_evitado: number;
}

export interface Comparativa {
  mes_actual_total_recolecciones?: number;
  mes_actual_total_kilos?: number;
  mes_actual_co2_evitado?: number;
  mes_anterior_total_recolecciones?: number;
  mes_anterior_total_kilos?: number;
  mes_anterior_co2_evitado?: number;
  anio_actual_total_recolecciones?: number;
  anio_actual_total_kilos?: number;
  anio_actual_co2_evitado?: number;
  anio_anterior_total_recolecciones?: number;
  anio_anterior_total_kilos?: number;
  anio_anterior_co2_evitado?: number;
  trimestre_actual_total_recolecciones?: number;
  trimestre_actual_total_kilos?: number;
  trimestre_actual_co2_evitado?: number;
  trimestre_anterior_total_recolecciones?: number;
  trimestre_anterior_total_kilos?: number;
  trimestre_anterior_co2_evitado?: number;
  variacion_recolecciones?: number;
  variacion_kilos?: number;
  variacion_co2?: number;
}

export interface Plaza {
  id: string;
  nombre: string;
}

export function useDashboardDirectorData() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({ total_recolecciones: 0, total_kilos: 0, co2_evitado: 0 });
  const [statsByTipo, setStatsByTipo] = useState<StatsByTipo[]>([]);
  const [tendencia, setTendencia] = useState<TendenciaMensual[]>([]);
  const [comparativaPlazas, setComparativaPlazas] = useState<ComparativaPlazas[]>([]);
  const [topLocales, setTopLocales] = useState<TopLocal[]>([]);
  const [comparativaMensual, setComparativaMensual] = useState<Comparativa | null>(null);
  const [comparativaAnual, setComparativaAnual] = useState<Comparativa | null>(null);
  const [comparativaTrimestral, setComparativaTrimestral] = useState<Comparativa | null>(null);

  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [selectedPlaza, setSelectedPlaza] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlazas();
    loadAllData();
  }, []);

  const loadPlazas = async () => {
    try {
      const plazasData = await plazaService.getAll();
      setPlazas(plazasData);
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {};
      if (selectedPlaza) filters.plaza_id = selectedPlaza;
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;

      console.log('🔍 Filtros enviados:', filters);

      const [
        statsRes,
        tiposRes,
        tendenciaRes,
        plazasRes,
        localesRes,
        compMensualRes,
        compAnualRes,
        compTrimestreRes
      ] = await Promise.all([
        api.get('/recolecciones/stats/general', { params: filters }),
        api.get('/recolecciones/stats/tipo', { params: filters }),
        api.get('/recolecciones/stats/tendencia-mensual', { params: filters }),
        api.get('/recolecciones/stats/comparativa-plazas', { params: filters }),
        api.get('/recolecciones/stats/top-locales', { params: filters }),
        api.get('/recolecciones/stats/comparativa-mensual', { params: filters }),
        api.get('/recolecciones/stats/comparativa-anual', { params: filters }),
        api.get('/recolecciones/stats/comparativa-trimestral', { params: filters })
      ]);

      setStats(statsRes.data.data || { total_recolecciones: 0, total_kilos: 0, co2_evitado: 0 });
      setStatsByTipo(tiposRes.data.data || []);
      setTendencia(tendenciaRes.data.data || []);
      setComparativaPlazas(plazasRes.data.data || []);
      setTopLocales(localesRes.data.data || []);
      setComparativaMensual(compMensualRes.data.data || null);
      setComparativaAnual(compAnualRes.data.data || null);
      setComparativaTrimestral(compTrimestreRes.data.data || null);

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    loadAllData();
  };

  const handleLimpiarFiltros = () => {
    setSelectedPlaza('');
    setFechaDesde('');
    setFechaHasta('');
    setTimeout(() => loadAllData(), 100);
  };

  const handleExportarPDF = () => {
    const plazaSeleccionada = plazas.find(p => p.id === selectedPlaza);
    const nombrePlaza = plazaSeleccionada ? plazaSeleccionada.nombre : 'Todas las Plazas';

    generateDirectorHTML({
      stats,
      statsByTipo,
      tendencia,
      comparativaPlazas,
      topLocales,
      comparativaMensual,
      comparativaAnual,
      comparativaTrimestral,
      plazaSeleccionada: nombrePlaza,
      userName: user?.nombre
    });
  };

  return {
    stats,
    statsByTipo,
    tendencia,
    comparativaPlazas,
    topLocales,
    comparativaMensual,
    comparativaAnual,
    comparativaTrimestral,
    plazas,
    selectedPlaza,
    setSelectedPlaza,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    loading,
    error,
    handleAplicarFiltros,
    handleLimpiarFiltros,
    handleExportarPDF,
  };
}
