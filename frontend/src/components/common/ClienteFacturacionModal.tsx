import React, { useEffect, useMemo, useState } from 'react';
import { plazaService } from '../../services/plaza.service';
import { localService } from '../../services/local.service';

interface ClienteFacturacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void | Promise<void>;
  cliente?: any;
}

interface ServicioForm {
  nombre_servicio: string;
  costo: number | '';
}

const ClienteFacturacionModal: React.FC<ClienteFacturacionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cliente,
}) => {
  const [plazas, setPlazas] = useState<any[]>([]);
  const [locales, setLocales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlazas, setLoadingPlazas] = useState(false);
  const [loadingLocales, setLoadingLocales] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    clienteExterno: false,
    plaza_id: '',
    local_id: '',
    modo_pago: 'PUE',
    forma_pago: 'TRANSFERENCIA',
    fecha_inicio: '',
  });

  const [servicios, setServicios] = useState<ServicioForm[]>([
    { nombre_servicio: '', costo: '' },
  ]);

  const localSeleccionado = useMemo(
    () => locales.find((local) => local.id === formData.local_id),
    [locales, formData.local_id]
  );

  const subtotal = useMemo(
    () => servicios.reduce((sum, servicio) => sum + Number(servicio.costo || 0), 0),
    [servicios]
  );

  const iva = subtotal * 0.16;
  const totalMensual = subtotal + iva;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value || 0);

  const getPlazas = async () => {
    setLoadingPlazas(true);
    try {
      const getPlazasFn = (plazaService as any).getPlazas || plazaService.getAll;
      const plazasData = await getPlazasFn();
      setPlazas((plazasData || []).filter((plaza: any) => plaza.activo));
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    } finally {
      setLoadingPlazas(false);
    }
  };

  const getLocalesPorPlaza = async (plazaId: string) => {
    if (!plazaId) {
      setLocales([]);
      return;
    }

    setLoadingLocales(true);
    try {
      const localesData = await localService.getAll(plazaId);
      setLocales((localesData || []).filter((local: any) => local.activo));
    } catch (error) {
      console.error('Error al cargar locales por plaza:', error);
      setLocales([]);
    } finally {
      setLoadingLocales(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    getPlazas();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (cliente) {
      const local = cliente.locales || {};
      setFormData({
        clienteExterno: !cliente.local_id,
        plaza_id: local.plaza_id || '',
        local_id: cliente.local_id || '',
        modo_pago: cliente.modo_pago || 'PUE',
        forma_pago: cliente.forma_pago || 'TRANSFERENCIA',
        fecha_inicio: cliente.fecha_inicio ? String(cliente.fecha_inicio).slice(0, 10) : '',
      });

      const serviciosCliente = (cliente.servicios_cliente || []).map((servicio: any) => ({
        nombre_servicio: servicio.nombre_servicio || '',
        costo: Number(servicio.costo || 0),
      }));

      setServicios(
        serviciosCliente.length > 0 ? serviciosCliente : [{ nombre_servicio: '', costo: '' }]
      );

      if (local.plaza_id) {
        getLocalesPorPlaza(local.plaza_id);
      } else {
        setLocales([]);
      }
    } else {
      setFormData({
        clienteExterno: false,
        plaza_id: '',
        local_id: '',
        modo_pago: 'PUE',
        forma_pago: 'TRANSFERENCIA',
        fecha_inicio: '',
      });
      setServicios([{ nombre_servicio: '', costo: '' }]);
      setLocales([]);
    }

    setErrors({});
  }, [cliente, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!formData.clienteExterno && formData.plaza_id) {
      getLocalesPorPlaza(formData.plaza_id);
    }
  }, [formData.plaza_id, formData.clienteExterno, isOpen]);

  const updateServicio = (index: number, key: keyof ServicioForm, value: string) => {
    const next = [...servicios];
    if (key === 'costo') {
      next[index][key] = value === '' ? '' : Number(value);
    } else {
      next[index][key] = value;
    }
    setServicios(next);
  };

  const addServicio = () => {
    setServicios([...servicios, { nombre_servicio: '', costo: '' }]);
  };

  const removeServicio = (index: number) => {
    if (servicios.length === 1) return;
    setServicios(servicios.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clienteExterno && !formData.plaza_id) {
      newErrors.plaza_id = 'La plaza es requerida';
    }

    if (!formData.clienteExterno && !formData.local_id) {
      newErrors.local_id = 'El local es requerido';
    }

    if (!formData.modo_pago) {
      newErrors.modo_pago = 'El modo de pago es requerido';
    }

    if (!formData.forma_pago.trim()) {
      newErrors.forma_pago = 'La forma de pago es requerida';
    }

    const serviciosValidos = servicios.filter(
      (servicio) => servicio.nombre_servicio.trim() && Number(servicio.costo) > 0
    );

    if (serviciosValidos.length === 0) {
      newErrors.servicios = 'Agrega al menos un servicio con nombre y costo mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const serviciosLimpios = servicios
        .filter((servicio) => servicio.nombre_servicio.trim() && Number(servicio.costo) > 0)
        .map((servicio) => ({
          nombre_servicio: servicio.nombre_servicio.trim(),
          costo: Number(servicio.costo),
        }));

      await onSave({
        clienteData: {
          local_id: formData.clienteExterno ? null : formData.local_id,
          modo_pago: formData.modo_pago,
          forma_pago: formData.forma_pago.trim(),
          fecha_inicio: formData.fecha_inicio ? new Date(formData.fecha_inicio).toISOString() : null,
        },
        servicios: serviciosLimpios,
      });

      onClose();
    } catch (error) {
      console.error('Error al guardar cliente de facturación:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {cliente ? 'Editar Cliente de Facturación' : 'Nuevo Cliente de Facturación'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Seleccionar local</h3>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="clienteExterno"
                checked={formData.clienteExterno}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    clienteExterno: e.target.checked,
                    plaza_id: e.target.checked ? '' : formData.plaza_id,
                    local_id: e.target.checked ? '' : formData.local_id,
                  })
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="clienteExterno" className="ml-2 text-sm font-medium text-gray-700">
                Cliente externo (sin local vinculado)
              </label>
            </div>

            {!formData.clienteExterno && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Plaza</label>
                    <select
                      value={formData.plaza_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plaza_id: e.target.value,
                          local_id: '',
                        })
                      }
                      className={`input ${errors.plaza_id ? 'border-red-500' : ''}`}
                      disabled={loading || loadingPlazas}
                    >
                      <option value="">Selecciona una plaza</option>
                      {plazas.map((plaza) => (
                        <option key={plaza.id} value={plaza.id}>
                          {plaza.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.plaza_id && <p className="text-red-500 text-sm mt-1">{errors.plaza_id}</p>}
                  </div>

                  <div>
                    <label className="label">Local</label>
                    <select
                      value={formData.local_id}
                      onChange={(e) => setFormData({ ...formData, local_id: e.target.value })}
                      className={`input ${errors.local_id ? 'border-red-500' : ''}`}
                      disabled={loading || !formData.plaza_id || loadingLocales}
                    >
                      <option value="">Selecciona un local</option>
                      {locales.map((local) => (
                        <option key={local.id} value={local.id}>
                          {local.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.local_id && <p className="text-red-500 text-sm mt-1">{errors.local_id}</p>}
                  </div>
                </div>

                {localSeleccionado && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre:</span>{' '}
                      <span className="font-medium text-gray-800">{localSeleccionado.nombre || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Razón social:</span>{' '}
                      <span className="font-medium text-gray-800">{localSeleccionado.razon_social || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">RFC:</span>{' '}
                      <span className="font-medium text-gray-800">{localSeleccionado.rfc || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{' '}
                      <span className="font-medium text-gray-800">{localSeleccionado.email || '-'}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datos de facturación</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Modo de pago</label>
                <select
                  value={formData.modo_pago}
                  onChange={(e) => setFormData({ ...formData, modo_pago: e.target.value })}
                  className={`input ${errors.modo_pago ? 'border-red-500' : ''}`}
                  disabled={loading}
                >
                  <option value="PUE">PUE</option>
                  <option value="PPD">PPD</option>
                </select>
                {errors.modo_pago && <p className="text-red-500 text-sm mt-1">{errors.modo_pago}</p>}
              </div>

              <div>
                <label className="label">Forma de pago</label>
                <input
                  type="text"
                  value={formData.forma_pago}
                  onChange={(e) => setFormData({ ...formData, forma_pago: e.target.value })}
                  className={`input ${errors.forma_pago ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.forma_pago && <p className="text-red-500 text-sm mt-1">{errors.forma_pago}</p>}
              </div>

              <div>
                <label className="label">Fecha de inicio de actividades</label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="input"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Servicios contratados</h3>
              <button
                type="button"
                onClick={addServicio}
                className="btn btn-secondary text-sm"
                disabled={loading}
              >
                + Agregar servicio
              </button>
            </div>

            {servicios.map((servicio, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_180px_44px] gap-3 items-end">
                <div>
                  <label className="label">Nombre del servicio</label>
                  <input
                    type="text"
                    value={servicio.nombre_servicio}
                    onChange={(e) => updateServicio(index, 'nombre_servicio', e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="label">Costo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={servicio.costo}
                    onChange={(e) => updateServicio(index, 'costo', e.target.value)}
                    className="input"
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeServicio(index)}
                  className="btn btn-secondary h-10"
                  disabled={loading || servicios.length === 1}
                >
                  X
                </button>
              </div>
            ))}

            {errors.servicios && <p className="text-red-500 text-sm">{errors.servicios}</p>}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>IVA 16%</span>
                <span className="font-medium">{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 pt-1 border-t border-gray-300">
                <span>Total mensual</span>
                <span>{formatCurrency(totalMensual)}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteFacturacionModal;
