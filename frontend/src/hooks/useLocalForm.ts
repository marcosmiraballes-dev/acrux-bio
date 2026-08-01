import { useState, useEffect } from 'react';
import { Local, Plaza } from '../types';
import { plazaService } from '../services/plaza.service';
import api from '../utils/api';

interface UseLocalFormParams {
  local?: Local | null;
  isOpen: boolean;
  onSave: (data: Partial<Local>) => Promise<void>;
  onClose: () => void;
}

export function useLocalForm({ local, isOpen, onSave, onClose }: UseLocalFormParams) {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    numero_local: '',
    plaza_id: '',
    esIndependiente: false,
    giro: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    razon_social: '',
    rfc: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    encargado_entrega: '',
    codigo_acceso: '',
    pin_tablet: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [pinTablet, setPinTablet] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlazas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (local) {
      setFormData({
        nombre: local.nombre,
        numero_local: (local as any).numero_local || '',
        plaza_id: local.plaza_id || '',
        esIndependiente: !local.plaza_id,
        giro: local.giro || '',
        contacto: local.contacto || '',
        telefono: local.telefono || '',
        email: local.email || '',
        direccion: local.direccion || '',
        razon_social: (local as any).razon_social || '',
        rfc: (local as any).rfc || '',
        ciudad: (local as any).ciudad || '',
        estado: (local as any).estado || '',
        codigo_postal: (local as any).codigo_postal || '',
        encargado_entrega: (local as any).encargado_entrega || '',
        codigo_acceso: (local as any).codigo_acceso || '',
        pin_tablet: (local as any).pin_tablet || '',
      });
      api.get(`/locales/${local.id}/pin-locatario`)
        .then(res => setPinTablet(res.data.pin || ''))
        .catch(() => setPinTablet(''));
    } else {
      setFormData({
        nombre: '',
        numero_local: '',
        plaza_id: '',
        esIndependiente: false,
        giro: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        razon_social: '',
        rfc: '',
        ciudad: '',
        estado: '',
        codigo_postal: '',
        encargado_entrega: '',
        codigo_acceso: '',
        pin_tablet: '',
      });
      setPinTablet('');
    }
    setErrors({});
  }, [local, isOpen]);

  const loadPlazas = async () => {
    try {
      const data = await plazaService.getAll();
      setPlazas(data.filter((p) => p.activo));
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.esIndependiente && !formData.plaza_id) {
      newErrors.plaza_id = 'Debes seleccionar una plaza o marcar como independiente';
    }

    if (formData.telefono && !/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    if (formData.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(formData.rfc.toUpperCase())) {
      newErrors.rfc = 'RFC inválido. Debe tener 13 caracteres (ej: ABC123456XYZ)';
    }

    if (formData.codigo_postal && !/^\d{5}$/.test(formData.codigo_postal)) {
      newErrors.codigo_postal = 'Código postal debe tener 5 dígitos';
    }

    if (formData.codigo_acceso && !/^[A-Z0-9\-]{1,20}$/.test(formData.codigo_acceso.toUpperCase())) {
      newErrors.codigo_acceso = 'Solo letras, números y guión. Máximo 20 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSave({
        nombre: formData.nombre.trim(),
        numero_local: formData.numero_local.trim() || undefined,
        plaza_id: formData.esIndependiente ? null : formData.plaza_id || null,
        giro: formData.giro.trim() || undefined,
        contacto: formData.contacto.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
        direccion: formData.direccion.trim() || undefined,
        razon_social: formData.razon_social.trim() || undefined,
        rfc: formData.rfc.trim().toUpperCase() || undefined,
        ciudad: formData.ciudad.trim() || undefined,
        estado: formData.estado.trim() || undefined,
        codigo_postal: formData.codigo_postal.trim() || undefined,
        encargado_entrega: formData.encargado_entrega.trim() || undefined,
        codigo_acceso: formData.codigo_acceso.trim().toUpperCase() || undefined,
        pin_tablet: pinTablet.trim(),
      } as any);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIndependienteChange = (checked: boolean) => {
    setFormData({
      ...formData,
      esIndependiente: checked,
      plaza_id: checked ? '' : formData.plaza_id,
    });
    if (checked && errors.plaza_id) {
      const newErrors = { ...errors };
      delete newErrors.plaza_id;
      setErrors(newErrors);
    }
  };

  return {
    plazas,
    formData,
    setFormData,
    errors,
    loading,
    pinTablet,
    setPinTablet,
    handleSubmit,
    handleIndependienteChange,
  };
}
