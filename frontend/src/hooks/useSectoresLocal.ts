import { useState, useEffect } from 'react';
import api from '../utils/api';

export interface SectorLocal {
  id: string;
  local_id: string;
  nombre: string;
  icono: string;
  orden: number;
  activo: boolean;
}

interface UseSectoresLocalParams {
  isOpen: boolean;
  localId?: string;
}

export function useSectoresLocal({ isOpen, localId }: UseSectoresLocalParams) {
  const [sectores, setSectores] = useState<SectorLocal[]>([]);
  const [cargandoSectores, setCargandoSectores] = useState(false);
  const [guardandoSector, setGuardandoSector] = useState(false);
  const [mostrarSectorForm, setMostrarSectorForm] = useState(false);
  const [sectorEditandoId, setSectorEditandoId] = useState<string | null>(null);
  const [sectorForm, setSectorForm] = useState({ nombre: '', icono: '', orden: 0 });
  const [mensajeSector, setMensajeSector] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (isOpen && localId) {
      loadSectores(localId);
    }
    if (!localId) {
      setSectores([]);
      setMostrarSectorForm(false);
      setSectorEditandoId(null);
      setMensajeSector(null);
      setSectorForm({ nombre: '', icono: '', orden: 0 });
    }
  }, [isOpen, localId]);

  const loadSectores = async (id: string) => {
    setCargandoSectores(true);
    try {
      const response = await api.get(`/locales/${id}/sectores`);
      setSectores(response.data.data || []);
    } catch (error: any) {
      console.error('Error al cargar sectores:', error);
      setMensajeSector({
        tipo: 'error',
        texto: error?.response?.data?.error || 'Error al cargar sectores del local'
      });
    } finally {
      setCargandoSectores(false);
    }
  };

  const resetSectorForm = () => {
    setMostrarSectorForm(false);
    setSectorEditandoId(null);
    setSectorForm({ nombre: '', icono: '', orden: 0 });
  };

  const guardarSector = async () => {
    if (!localId) return;
    if (!sectorForm.nombre.trim() || !sectorForm.icono.trim()) {
      setMensajeSector({ tipo: 'error', texto: 'Nombre e icono son requeridos' });
      return;
    }

    setGuardandoSector(true);
    try {
      const payload = {
        nombre: sectorForm.nombre.trim(),
        icono: sectorForm.icono.trim(),
        orden: Number(sectorForm.orden) || 0,
      };

      if (sectorEditandoId) {
        await api.put(`/sectores/${sectorEditandoId}`, payload);
        setMensajeSector({ tipo: 'ok', texto: 'Sector actualizado correctamente' });
      } else {
        await api.post(`/locales/${localId}/sectores`, payload);
        setMensajeSector({ tipo: 'ok', texto: 'Sector agregado correctamente' });
      }

      await loadSectores(localId);
      resetSectorForm();
    } catch (error: any) {
      console.error('Error al guardar sector:', error);
      setMensajeSector({
        tipo: 'error',
        texto: error?.response?.data?.error || 'Error al guardar sector'
      });
    } finally {
      setGuardandoSector(false);
    }
  };

  const editarSector = (sector: SectorLocal) => {
    setSectorEditandoId(sector.id);
    setSectorForm({
      nombre: sector.nombre,
      icono: sector.icono,
      orden: sector.orden ?? 0,
    });
    setMostrarSectorForm(true);
    setMensajeSector(null);
  };

  const toggleActivoSector = async (sector: SectorLocal) => {
    if (!localId) return;
    setGuardandoSector(true);
    try {
      await api.put(`/sectores/${sector.id}`, { activo: !sector.activo });
      setMensajeSector({
        tipo: 'ok',
        texto: sector.activo ? 'Sector desactivado correctamente' : 'Sector activado correctamente'
      });
      await loadSectores(localId);
    } catch (error: any) {
      console.error('Error al cambiar estado del sector:', error);
      setMensajeSector({
        tipo: 'error',
        texto: error?.response?.data?.error || 'Error al cambiar estado del sector'
      });
    } finally {
      setGuardandoSector(false);
    }
  };

  return {
    sectores,
    cargandoSectores,
    guardandoSector,
    mostrarSectorForm,
    setMostrarSectorForm,
    sectorEditandoId,
    setSectorEditandoId,
    sectorForm,
    setSectorForm,
    mensajeSector,
    setMensajeSector,
    loadSectores,
    resetSectorForm,
    guardarSector,
    editarSector,
    toggleActivoSector,
  };
}
