import React, { useState, useEffect } from 'react';
import { Recoleccion, Plaza, Local, TipoResiduo } from '../../types';
import { plazaService } from '../../services/plaza.service';
import { localService } from '../../services/local.service';
import { tipoResiduoService } from '../../services/tipo-residuo.service';

interface RecoleccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  recoleccion: Recoleccion | null;
}

const RecoleccionModal: React.FC<RecoleccionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recoleccion,
}) => {
  const [loading, setLoading] = useState(false);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [tiposResiduos, setTiposResiduos] = useState<TipoResiduo[]>([]);
  
  const [formData, setFormData] = useState({
    plaza_id: '',
    local_id: '',
    fecha_recoleccion: '',
    notas: '',
    detalles: [] as Array<{ tipo_residuo_id: string; kilos: string }>,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Cargar datos de la recolección a editar
  useEffect(() => {
    if (recoleccion && isOpen) {
      // IMPORTANTE: Aseguramos que la fecha se cargue correctamente
      const fechaSoloFecha = recoleccion.fecha_recoleccion.split('T')[0];
      
      setFormData({
        plaza_id: recoleccion.plaza_id || '',
        local_id: recoleccion.local_id,
        fecha_recoleccion: fechaSoloFecha,
        notas: recoleccion.notas || '',
        detalles: recoleccion.detalle_recolecciones?.map(d => ({
          tipo_residuo_id: d.tipos_residuos?.id || d.tipo_residuo_id,
          kilos: d.kilos.toString(),
        })) || [],
      });
      
      if (recoleccion.plaza_id) {
        loadLocalesByPlaza(recoleccion.plaza_id);
      } else {
        loadLocalesIndependientes();
      }
    }
  }, [recoleccion, isOpen]);

  const loadInitialData = async () => {
    try {
      const [plazasData, localesData, tiposData] = await Promise.all([
        plazaService.getAll(),
        localService.getAll(),
        tipoResiduoService.getAll(),
      ]);
      setPlazas(plazasData.filter(p => p.activo));
      setLocales(localesData.filter(l => l.activo));
      setTiposResiduos(tiposData.filter(t => t.activo));
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const loadLocalesByPlaza = async (plazaId: string) => {
    try {
      const localesData = await localService.getAll();
      setLocales(localesData.filter(l => l.activo && l.plaza_id === plazaId));
    } catch (error) {
      console.error('Error cargando locales:', error);
    }
  };

  const loadLocalesIndependientes = async () => {
    try {
      const localesData = await localService.getAll();
      setLocales(localesData.filter(l => l.activo && !l.plaza_id));
    } catch (error) {
      console.error('Error cargando locales independientes:', error);
    }
  };

  const handlePlazaChange = (plazaId: string) => {
    setFormData({ 
      ...formData, 
      plaza_id: plazaId, 
      local_id: '',
    });
    if (plazaId) {
      loadLocalesByPlaza(plazaId);
    } else {
      loadLocalesIndependientes();
    }
  };

  const handleDetalleChange = (tipoId: string, kilos: string) => {
    const newDetalles = [...formData.detalles];
    const index = newDetalles.findIndex(d => d.tipo_residuo_id === tipoId);
    
    if (index >= 0) {
      if (kilos === '' || parseFloat(kilos) === 0) {
        newDetalles.splice(index, 1);
      } else {
        newDetalles[index].kilos = kilos;
      }
    } else if (kilos !== '' && parseFloat(kilos) > 0) {
      newDetalles.push({ tipo_residuo_id: tipoId, kilos });
    }
    
    setFormData({ ...formData, detalles: newDetalles });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.local_id) {
      newErrors.local_id = 'Selecciona un local';
    }

    if (!formData.fecha_recoleccion) {
      newErrors.fecha_recoleccion = 'La fecha es requerida';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.fecha_recoleccion > today) {
        newErrors.fecha_recoleccion = 'No puedes registrar fechas futuras';
      }
    }

    if (formData.detalles.length === 0) {
      newErrors.detalles = 'Debes agregar al menos un tipo de residuo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const dataToSend = {
        plaza_id: formData.plaza_id || undefined,
        local_id: formData.local_id,
        fecha_recoleccion: formData.fecha_recoleccion,
        notas: formData.notas || undefined,
        detalles: formData.detalles.map(d => ({
          tipo_residuo_id: d.tipo_residuo_id,
          kilos: parseFloat(d.kilos),
        })),
      };

      await onSave(dataToSend);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalKilos = () => {
    return formData.detalles.reduce((sum, d) => sum + (parseFloat(d.kilos) || 0), 0);
  };

  const getTotalCO2 = () => {
    return formData.detalles.reduce((sum, d) => {
      const tipo = tiposResiduos.find(t => t.id === d.tipo_residuo_id);
      const kilos = parseFloat(d.kilos) || 0;
      return sum + (kilos * (tipo?.factor_co2 || 0));
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">
            Editar Recolección
          </h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Datos del Local */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📍 Ubicación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plaza */}
              <div>
                <label className="label">Plaza</label>
                <select
                  value={formData.plaza_id}
                  onChange={(e) => handlePlazaChange(e.target.value)}
                  className="input"
                >
                  <option value="">Independiente (sin plaza)</option>
                  {plazas.map((plaza) => (
                    <option key={plaza.id} value={plaza.id}>
                      {plaza.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Local */}
              <div>
                <label className="label">Local *</label>
                <select
                  value={formData.local_id}
                  onChange={(e) => setFormData({ ...formData, local_id: e.target.value })}
                  className={`input ${errors.local_id ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">Selecciona un local</option>
                  {locales.map((local) => (
                    <option key={local.id} value={local.id}>
                      {local.nombre}
                    </option>
                  ))}
                </select>
                {errors.local_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.local_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fecha y Notas */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📅 Fecha y Observaciones
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha */}
              <div>
                <label className="label">Fecha de Recolección *</label>
                <input
                  type="date"
                  value={formData.fecha_recoleccion}
                  onChange={(e) => setFormData({ ...formData, fecha_recoleccion: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className={`input ${errors.fecha_recoleccion ? 'border-red-500' : ''}`}
                  required
                />
                {errors.fecha_recoleccion && (
                  <p className="text-red-500 text-sm mt-1">{errors.fecha_recoleccion}</p>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="label">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input"
                  rows={1}
                  placeholder="Observaciones..."
                />
              </div>
            </div>
          </div>

          {/* Tipos de Residuos */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ♻️ Residuos Recolectados
            </h3>
            
            <div className="space-y-2">
              {tiposResiduos.map((tipo) => {
                const detalle = formData.detalles.find(d => d.tipo_residuo_id === tipo.id);
                const kilos = detalle?.kilos || '';
                const co2 = kilos ? parseFloat(kilos) * tipo.factor_co2 : 0;

                return (
                  <div
                    key={tipo.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className="w-5 h-5 rounded-full mr-3 flex-shrink-0"
                      style={{ backgroundColor: tipo.color_hex || '#10B981' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{tipo.nombre}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={kilos}
                          onChange={(e) => handleDetalleChange(tipo.id, e.target.value)}
                          className="input w-20 text-right text-sm"
                          placeholder="0.0"
                        />
                        <span className="ml-2 text-sm text-gray-600">kg</span>
                      </div>
                      {co2 > 0 && (
                        <div className="text-sm text-green-700 font-medium min-w-[80px] text-right">
                          {co2.toFixed(2)} CO₂
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.detalles && (
              <p className="text-red-500 text-sm mt-2">{errors.detalles}</p>
            )}

            {/* Resumen Total */}
            {formData.detalles.length > 0 && (
              <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-primary-700">{getTotalKilos().toFixed(2)} kg</span>
                  <span className="text-green-700">{getTotalCO2().toFixed(2)} kg CO₂</span>
                </div>
              </div>
            )}
          </div>

        </form>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoleccionModal;