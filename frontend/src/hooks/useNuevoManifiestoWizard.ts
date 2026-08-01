import { useState, useEffect } from 'react';
import api from '../utils/api';
import { generateManifiestoHTML } from '../utils/generateManifiestoHTML';
import { obtenerFechaEmisionUltimoDia } from '../utils/manifiestoFechas';

export interface Plaza {
  id: string;
  nombre: string;
}

export interface Local {
  id: string;
  nombre: string;
  giro: string;
}

export interface Vehiculo {
  id: string;
  tipo: string;
  placas: string;
}

export interface DestinoFinal {
  id: string;
  nombre_destino: string;
  domicilio: string;
  numero_autorizacion: string;
}

export interface Recolector {
  id: string;
  nombre: string;
}

export interface FolioReservado {
  id: string;
  folio_manual: string;
}

export interface Recoleccion {
  id: string;
  fecha_recoleccion: string;
  total_kilos: number;
}

interface UseNuevoManifiestoWizardParams {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function useNuevoManifiestoWizard({ isOpen, onClose, onSuccess }: UseNuevoManifiestoWizardParams) {
  const [step, setStep] = useState(1);

  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [plazaSeleccionada, setPlazaSeleccionada] = useState<string>('');

  const [tipoFolio, setTipoFolio] = useState<'automatico' | 'manual'>('automatico');
  const [foliosDisponibles, setFoliosDisponibles] = useState<FolioReservado[]>([]);
  const [folioManualSeleccionado, setFolioManualSeleccionado] = useState<string>('');
  const [fechaEmisionPersonalizada, setFechaEmisionPersonalizada] = useState<string>('');

  const [locales, setLocales] = useState<Local[]>([]);
  const [localSeleccionado, setLocalSeleccionado] = useState<string>('');
  const [busquedaLocal, setBusquedaLocal] = useState('');

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [recoleccionesDelPeriodo, setRecoleccionesDelPeriodo] = useState<Recoleccion[]>([]);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string>('');

  const [destinosFinales, setDestinosFinales] = useState<DestinoFinal[]>([]);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState<string>('');

  const [recolectores, setRecolectores] = useState<Recolector[]>([]);
  const [recolectorSeleccionado, setRecolectorSeleccionado] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlazas();
      loadVehiculos();
      loadDestinosFinales();
      loadRecolectores();
    }
  }, [isOpen]);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data || []);
    } catch (err) {
      console.error('Error al cargar plazas:', err);
    }
  };

  const loadVehiculos = async () => {
    try {
      const response = await api.get('/vehiculos');
      setVehiculos(response.data.data?.filter((v: Vehiculo & { activo: boolean }) => v.activo) || []);
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
    }
  };

  const loadDestinosFinales = async () => {
    try {
      const response = await api.get('/destinos-finales');
      setDestinosFinales(response.data.data?.filter((d: DestinoFinal & { activo: boolean }) => d.activo) || []);
    } catch (err) {
      console.error('Error al cargar destinos finales:', err);
    }
  };

  const loadRecolectores = async () => {
    try {
      const response = await api.get('/recolectores');
      setRecolectores(response.data.data?.filter((r: Recolector & { activo: boolean }) => r.activo) || []);
    } catch (err) {
      console.error('Error al cargar recolectores:', err);
    }
  };

  const loadFoliosDisponibles = async () => {
    if (!plazaSeleccionada) return;

    try {
      const anioActual = new Date().getFullYear();

      const response = await api.get(`/folios-reservados/disponibles`, {
        params: {
          anio: anioActual,
          plaza_id: plazaSeleccionada
        }
      });

      setFoliosDisponibles(response.data.data || []);
    } catch (err) {
      console.error('Error al cargar folios:', err);
      setFoliosDisponibles([]);
    }
  };

  useEffect(() => {
    if (tipoFolio === 'manual' && plazaSeleccionada) {
      loadFoliosDisponibles();
    }
  }, [tipoFolio, plazaSeleccionada]);

  const loadLocales = async () => {
    if (!plazaSeleccionada) {
      setLocales([]);
      return;
    }

    try {
      const response = await api.get('/locales', {
        params: { plaza_id: plazaSeleccionada }
      });

      console.log('🏢 LOCALES FILTRADOS POR PLAZA:', response.data.data);

      setLocales(response.data.data || []);
    } catch (err) {
      console.error('Error al cargar locales:', err);
      setLocales([]);
    }
  };

  useEffect(() => {
    if (plazaSeleccionada) {
      loadLocales();
    } else {
      setLocales([]);
    }
  }, [plazaSeleccionada]);

  const loadRecoleccionesDelPeriodo = async () => {
    if (!localSeleccionado || !fechaDesde || !fechaHasta) return;

    try {
      const response = await api.get('/recolecciones', {
        params: {
          local_id: localSeleccionado,
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta
        }
      });
      setRecoleccionesDelPeriodo(response.data.data || []);
    } catch (err) {
      console.error('Error al cargar recolecciones:', err);
      setRecoleccionesDelPeriodo([]);
    }
  };

  useEffect(() => {
    if (localSeleccionado && fechaDesde && fechaHasta) {
      loadRecoleccionesDelPeriodo();
    }
  }, [localSeleccionado, fechaDesde, fechaHasta]);

  const handleNext = () => {
    if (step === 1 && !plazaSeleccionada) {
      setError('Selecciona una plaza');
      return;
    }
    if (step === 2 && tipoFolio === 'manual' && !folioManualSeleccionado) {
      setError('Selecciona un folio manual');
      return;
    }
    if (step === 2 && tipoFolio === 'manual' && !fechaEmisionPersonalizada) {
      setError('Selecciona la fecha de emisión del manifiesto');
      return;
    }
    if (step === 3 && !localSeleccionado) {
      setError('Selecciona un local');
      return;
    }
    if (step === 4) {
      if (!fechaDesde || !fechaHasta) {
        setError('Selecciona el periodo completo');
        return;
      }
      if (fechaHasta < fechaDesde) {
        setError('La fecha hasta debe ser mayor o igual a la fecha desde');
        return;
      }
    }
    if (step === 5 && !vehiculoSeleccionado) {
      setError('Selecciona un vehículo');
      return;
    }
    if (step === 6 && !destinoSeleccionado) {
      setError('Selecciona un destino final');
      return;
    }

    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleCrear = async () => {
    if (!recolectorSeleccionado) {
      setError('Selecciona un recolector');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        local_id: localSeleccionado,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        recolector_id: recolectorSeleccionado,
        vehiculo_id: vehiculoSeleccionado,
        destino_final_id: destinoSeleccionado
      };

      if (tipoFolio === 'manual') {
        payload.folio_manual = folioManualSeleccionado;
        console.log('🧪 fechaEmisionPersonalizada antes de obtenerFechaEmisionUltimoDia:', fechaEmisionPersonalizada);
        payload.fecha_emision = obtenerFechaEmisionUltimoDia(fechaEmisionPersonalizada);
        console.log('🧪 payload.fecha_emision normalizada (último día del mes):', payload.fecha_emision);
      }

      const fechaBase = fechaEmisionPersonalizada || fechaHasta;
      payload.fecha_emision = obtenerFechaEmisionUltimoDia(fechaBase);

      console.log('🧪 payload completo:', JSON.stringify(payload, null, 2));
      const response = await api.post('/manifiestos', payload);
      const manifiestoCreado = response.data.data;

      console.log('✅ MANIFIESTO CREADO:', manifiestoCreado);

      const responseCompleto = await api.get(`/manifiestos/${manifiestoCreado.id}`);
      const manifiestoCompleto = responseCompleto.data.data;

      console.log('📄 MANIFIESTO COMPLETO:', manifiestoCompleto);
      console.log('📦 RESIDUOS:', manifiestoCompleto.residuos);

      await generateManifiestoHTML(manifiestoCompleto);

      onSuccess();
      handleCloseModal();
    } catch (err: any) {
      console.error('❌ ERROR AL CREAR MANIFIESTO:', err);
      setError(err.response?.data?.message || 'Error al crear manifiesto');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setStep(1);
    setPlazaSeleccionada('');
    setTipoFolio('automatico');
    setFolioManualSeleccionado('');
    setFechaEmisionPersonalizada('');
    setLocalSeleccionado('');
    setBusquedaLocal('');
    setFechaDesde('');
    setFechaHasta('');
    setRecoleccionesDelPeriodo([]);
    setVehiculoSeleccionado('');
    setDestinoSeleccionado('');
    setRecolectorSeleccionado('');
    setError('');
    onClose();
  };

  const localesFiltrados = locales.filter(local =>
    local.nombre.toLowerCase().includes(busquedaLocal.toLowerCase()) ||
    local.giro.toLowerCase().includes(busquedaLocal.toLowerCase())
  );

  return {
    step,
    plazas,
    plazaSeleccionada,
    setPlazaSeleccionada,
    tipoFolio,
    setTipoFolio,
    foliosDisponibles,
    folioManualSeleccionado,
    setFolioManualSeleccionado,
    fechaEmisionPersonalizada,
    setFechaEmisionPersonalizada,
    locales,
    localesFiltrados,
    localSeleccionado,
    setLocalSeleccionado,
    busquedaLocal,
    setBusquedaLocal,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    recoleccionesDelPeriodo,
    vehiculos,
    vehiculoSeleccionado,
    setVehiculoSeleccionado,
    destinosFinales,
    destinoSeleccionado,
    setDestinoSeleccionado,
    recolectores,
    recolectorSeleccionado,
    setRecolectorSeleccionado,
    loading,
    error,
    handleNext,
    handleBack,
    handleCrear,
    handleCloseModal,
  };
}
