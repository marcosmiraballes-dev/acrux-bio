import React, { useState, useEffect } from 'react';
import { Plaza } from '../../types';

interface PlazaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Plaza>) => Promise<void>;
  plaza?: Plaza | null;
  title: string;
}

const PlazaModal: React.FC<PlazaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  plaza,
  title,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: '',
    estado: 'Quintana Roo',
    direccion: '',
    contacto: '',
    telefono: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (plaza) {
      setFormData({
        nombre: plaza.nombre,
        ciudad: plaza.ciudad,
        estado: plaza.estado,
        direccion: plaza.direccion || '',
        contacto: plaza.contacto || '',
        telefono: plaza.telefono || '',
        email: plaza.email || '',
      });
    } else {
      // Reset form
      setFormData({
        nombre: '',
        ciudad: '',
        estado: 'Quintana Roo',
        direccion: '',
        contacto: '',
        telefono: '',
        email: '',
      });
    }
    setErrors({});
  }, [plaza, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }

    if (!formData.estado.trim()) {
      newErrors.estado = 'El estado es requerido';
    }

    // Validar email si se proporciona
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    // Validar teléfono si se proporciona (10 dígitos)
    if (formData.telefono && !/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'El teléfono debe tener 10 dígitos';
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
        ciudad: formData.ciudad.trim(),
        estado: formData.estado.trim(),
        direccion: formData.direccion.trim() || undefined,
        contacto: formData.contacto.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
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
              Nombre de la Plaza <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`input ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ej: Plaza Las Américas"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Ciudad y Estado en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div>
              <label className="label">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className={`input ${errors.ciudad ? 'border-red-500' : ''}`}
                placeholder="Ej: Playa del Carmen"
                disabled={loading}
              />
              {errors.ciudad && (
                <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="label">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className={`input ${errors.estado ? 'border-red-500' : ''}`}
                disabled={loading}
              >
                <option value="Quintana Roo">Quintana Roo</option>
                <option value="Yucatán">Yucatán</option>
                <option value="Campeche">Campeche</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.estado && (
                <p className="text-red-500 text-sm mt-1">{errors.estado}</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="label">Dirección</label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="input"
              placeholder="Dirección completa de la plaza"
              rows={2}
              disabled={loading}
            />
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
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
            </div>

            {/* Teléfono y Email en grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teléfono */}
              <div>
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
                  placeholder="contacto@plaza.com"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
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

export default PlazaModal;