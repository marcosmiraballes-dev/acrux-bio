import React, { useState, useEffect } from 'react';
import { TipoResiduo } from '../../types';

interface TipoResiduoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<TipoResiduo>) => Promise<void>;
  tipoResiduo?: TipoResiduo | null;
  title: string;
}

const TipoResiduoModal: React.FC<TipoResiduoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tipoResiduo,
  title,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    factor_co2: '',
    unidad: 'kg',
    color_hex: '#10B981',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Cargar datos si es edición
  useEffect(() => {
    if (tipoResiduo) {
      setFormData({
        nombre: tipoResiduo.nombre,
        descripcion: tipoResiduo.descripcion || '',
        factor_co2: tipoResiduo.factor_co2.toString(),
        unidad: tipoResiduo.unidad || 'kg',
        color_hex: tipoResiduo.color_hex || '#10B981',
      });
    } else {
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        factor_co2: '',
        unidad: 'kg',
        color_hex: '#10B981',
      });
    }
    setErrors({});
  }, [tipoResiduo, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.factor_co2) {
      newErrors.factor_co2 = 'El factor CO₂ es requerido';
    } else if (parseFloat(formData.factor_co2) <= 0) {
      newErrors.factor_co2 = 'El factor CO₂ debe ser mayor a 0';
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
        descripcion: formData.descripcion.trim() || undefined,
        factor_co2: parseFloat(formData.factor_co2),
        unidad: formData.unidad,
        color_hex: formData.color_hex,
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="label">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`input ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ej: Plástico PET"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="input"
              placeholder="Descripción del tipo de residuo"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Factor CO2 */}
          <div>
            <label className="label">
              Factor CO₂ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.factor_co2}
              onChange={(e) => setFormData({ ...formData, factor_co2: e.target.value })}
              className={`input ${errors.factor_co2 ? 'border-red-500' : ''}`}
              placeholder="Ej: 1.5"
              disabled={loading}
            />
            {errors.factor_co2 && (
              <p className="text-red-500 text-sm mt-1">{errors.factor_co2}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              kg CO₂ evitado por kg de residuo
            </p>
          </div>

          {/* Unidad */}
          <div>
            <label className="label">Unidad</label>
            <select
              value={formData.unidad}
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              className="input"
              disabled={loading}
            >
              <option value="kg">Kilogramos (kg)</option>
              <option value="ton">Toneladas (ton)</option>
              <option value="lt">Litros (lt)</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="label">Color (para visualización)</label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color_hex}
                onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                disabled={loading}
              />
              <input
                type="text"
                value={formData.color_hex}
                onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                className="input flex-1"
                placeholder="#10B981"
                disabled={loading}
              />
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

export default TipoResiduoModal;