import React, { useState, useEffect } from 'react';
import { Local, Plaza } from '../../types';
import { plazaService } from '../../services/plaza.service';

interface LocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Local>) => Promise<void>;
  local?: Local | null;
  title: string;
}

const LocalModal: React.FC<LocalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  local,
  title,
}) => {
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    plaza_id: '',
    esIndependiente: false,
    giro: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '', // ✅ CAMBIADO: 'notas' → 'direccion'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Cargar plazas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadPlazas();
    }
  }, [isOpen]);

  // Cargar datos si es edición
  useEffect(() => {
    if (local) {
      setFormData({
        nombre: local.nombre,
        plaza_id: local.plaza_id || '',
        esIndependiente: !local.plaza_id,
        giro: local.giro || '',
        contacto: local.contacto || '',
        telefono: local.telefono || '',
        email: local.email || '',
        direccion: local.direccion || '', // ✅ CAMBIADO: 'notas' → 'direccion'
      });
    } else {
      // Reset form
      setFormData({
        nombre: '',
        plaza_id: '',
        esIndependiente: false,
        giro: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '', // ✅ CAMBIADO: 'notas' → 'direccion'
      });
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

    // Validar teléfono si se proporciona (10 dígitos)
    if (formData.telefono && !/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
    }

    // Validar email si se proporciona
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
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
        plaza_id: formData.esIndependiente ? null : formData.plaza_id || null,
        giro: formData.giro.trim() || undefined,
        contacto: formData.contacto.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
        direccion: formData.direccion.trim() || undefined, // ✅ CAMBIADO: 'notas' → 'direccion'
      });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="label">
              Nombre del Local <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`input ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ej: Restaurante El Sabor"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Plaza o Independiente */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="esIndependiente"
                checked={formData.esIndependiente}
                onChange={(e) => handleIndependienteChange(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="esIndependiente" className="ml-2 text-sm font-medium text-gray-700">
                🏪 Local Independiente (sin plaza asignada)
              </label>
            </div>

            {!formData.esIndependiente && (
              <div>
                <label className="label">
                  Plaza <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.plaza_id}
                  onChange={(e) => setFormData({ ...formData, plaza_id: e.target.value })}
                  className={`input ${errors.plaza_id ? 'border-red-500' : ''}`}
                  disabled={loading}
                >
                  <option value="">Selecciona una plaza</option>
                  {plazas.map((plaza) => (
                    <option key={plaza.id} value={plaza.id}>
                      {plaza.nombre} - {plaza.ciudad}
                    </option>
                  ))}
                </select>
                {errors.plaza_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.plaza_id}</p>
                )}
              </div>
            )}

            {formData.esIndependiente && (
              <p className="text-sm text-gray-600 italic">
                Este local no está asociado a ninguna plaza comercial
              </p>
            )}
          </div>

          {/* Giro */}
          <div>
            <label className="label">Giro / Tipo de Negocio</label>
            <input
              type="text"
              value={formData.giro}
              onChange={(e) => setFormData({ ...formData, giro: e.target.value })}
              className="input"
              placeholder="Ej: Restaurante, Tienda de ropa, Cafetería"
              disabled={loading}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="label">
              📍 Dirección del Local
            </label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="input"
              placeholder="Ej: Av. Constituyentes 123, Col. Centro, Playa del Carmen"
              rows={2}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta dirección se utilizará en reportes y bitácoras
            </p>
          </div>

          {/* Datos de contacto */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Datos de Contacto (Opcional)
            </h3>

            {/* Nombre de contacto */}
            <div className="mb-4">
              <label className="label">Nombre del Contacto</label>
              <input
                type="text"
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                className="input"
                placeholder="Ej: María González"
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div className="mb-4">
              <label className="label">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className={`input ${errors.telefono ? 'border-red-500' : ''}`}
                placeholder="9841234567"
                disabled={loading}
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="contacto@local.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocalModal;