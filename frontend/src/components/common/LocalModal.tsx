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

  const [acordeon, setAcordeon] = useState({
    legal: false,
    ubicacion: false,
    contacto: false,
    recoleccion: false,
    portal: false,
    tablet: false,
  });

  const toggleAcordeon = (seccion: keyof typeof acordeon) => {
    setAcordeon({ ...acordeon, [seccion]: !acordeon[seccion] });
  };

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

    // Código acceso: solo letras, números y guión, máx 20 caracteres
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
        pin_tablet: formData.pin_tablet.trim() || '',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
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

          {/* Número de Local */}
          <div>
            <label className="label">Número de Local</label>
            <input
              type="text"
              value={formData.numero_local}
              onChange={(e) => setFormData({ ...formData, numero_local: e.target.value })}
              className="input"
              placeholder="Ej: L-12"
              disabled={loading}
            />
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

          {/* ========================================
              SECCIÓN: PORTAL DE LOCATARIOS (Acordeón)
              ======================================== */}
          <div className="border border-green-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAcordeon('portal')}
              className="w-full px-4 py-3 flex items-center justify-between bg-green-50 hover:bg-green-100 transition-colors"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <span className="font-semibold text-gray-700">Portal de Locatarios</span>
                <span className="text-xs text-gray-500">(Acceso web)</span>
              </div>
              <span className="text-gray-500">{acordeon.portal ? '▼' : '▶'}</span>
            </button>

            {acordeon.portal && (
              <div className="p-4 bg-white space-y-3">
                <div>
                  <label className="label">Código de Acceso</label>
                  <input
                    type="text"
                    value={formData.codigo_acceso}
                    onChange={(e) => setFormData({ ...formData, codigo_acceso: e.target.value.toUpperCase() })}
                    className={`input ${errors.codigo_acceso ? 'border-red-500' : ''}`}
                    placeholder="Ej: EV-0001"
                    maxLength={20}
                    disabled={loading}
                  />
                  {errors.codigo_acceso && (
                    <p className="text-red-500 text-sm mt-1">{errors.codigo_acceso}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Código único que el locatario usa para acceder a <strong>elefantesverdes.com.mx/acceso-a-usuarios</strong>. 
                    Solo letras, números y guión. Déjalo vacío si no tiene acceso.
                  </p>
                </div>

                {formData.codigo_acceso && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    ✅ Este local tiene acceso al portal con el código <strong>{formData.codigo_acceso}</strong>
                  </div>
                )}

                {!formData.codigo_acceso && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
                    🔒 Sin código asignado — el locatario no puede acceder al portal
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN: ACCESO TABLET */}
          <div className="border border-blue-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAcordeon('tablet')}
              className="w-full px-4 py-3 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <span className="font-semibold text-gray-700">Acceso Tablet</span>
                <span className="text-xs text-gray-500">(PIN para registro de residuos)</span>
              </div>
              <span className="text-gray-500">{acordeon.tablet ? '▼' : '▶'}</span>
            </button>

            {acordeon.tablet && (
              <div className="p-4 bg-white space-y-3">
                <div>
                  <label className="label">PIN de acceso</label>
                  <input
                    type="text"
                    value={formData.pin_tablet}
                    onChange={(e) => setFormData({ ...formData, pin_tablet: e.target.value.replace(/\D/g, '') })}
                    className="input"
                    placeholder="Ej: 1234"
                    maxLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PIN numérico de 4 a 6 dígitos. El locatario lo usa para entrar al panel de registro en la tablet.
                    Dejá vacío si no tiene acceso.
                  </p>
                </div>

                {formData.pin_tablet && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    📱 PIN asignado — el locatario puede registrar residuos desde la tablet
                  </div>
                )}

                {!formData.pin_tablet && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
                    🔒 Sin PIN asignado — el locatario no puede acceder a la tablet
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================
              SECCIÓN: INFORMACIÓN LEGAL (Acordeón)
              ======================================== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAcordeon('legal')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-semibold text-gray-700">Información Legal</span>
                <span className="text-xs text-gray-500">(Opcional - Para manifiestos)</span>
              </div>
              <span className="text-gray-500">{acordeon.legal ? '▼' : '▶'}</span>
            </button>
            
            {acordeon.legal && (
              <div className="p-4 bg-white space-y-4">
                <div>
                  <label className="label">Razón Social / Nombre Legal</label>
                  <input
                    type="text"
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    className="input"
                    placeholder="Ej: Restaurante El Sabor S.A. de C.V."
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre legal o fiscal del local (para manifiestos oficiales)
                  </p>
                </div>

                <div>
                  <label className="label">RFC</label>
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    className={`input ${errors.rfc ? 'border-red-500' : ''}`}
                    placeholder="ABC123456XYZ"
                    maxLength={13}
                    disabled={loading}
                  />
                  {errors.rfc && (
                    <p className="text-red-500 text-sm mt-1">{errors.rfc}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Registro Federal de Contribuyentes (13 caracteres)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ========================================
              SECCIÓN: UBICACIÓN (Acordeón)
              ======================================== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAcordeon('ubicacion')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span className="font-semibold text-gray-700">Ubicación</span>
                <span className="text-xs text-gray-500">(Opcional - Para manifiestos)</span>
              </div>
              <span className="text-gray-500">{acordeon.ubicacion ? '▼' : '▶'}</span>
            </button>
            
            {acordeon.ubicacion && (
              <div className="p-4 bg-white space-y-4">
                <div>
                  <label className="label">Dirección</label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="input"
                    placeholder="Ej: Av. Constituyentes 123, Col. Centro"
                    rows={2}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Ciudad</label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      className="input"
                      placeholder="Ej: Playa del Carmen"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="label">Estado</label>
                    <input
                      type="text"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="input"
                      placeholder="Ej: Quintana Roo"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Código Postal</label>
                  <input
                    type="text"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value.replace(/\D/g, '') })}
                    className={`input ${errors.codigo_postal ? 'border-red-500' : ''}`}
                    placeholder="77710"
                    maxLength={5}
                    disabled={loading}
                  />
                  {errors.codigo_postal && (
                    <p className="text-red-500 text-sm mt-1">{errors.codigo_postal}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">5 dígitos numéricos</p>
                </div>
              </div>
            )}
          </div>

          {/* ========================================
              SECCIÓN: CONTACTO (Acordeón)
              ======================================== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAcordeon('contacto')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📞</span>
                <span className="font-semibold text-gray-700">Contacto</span>
                <span className="text-xs text-gray-500">(Opcional)</span>
              </div>
              <span className="text-gray-500">{acordeon.contacto ? '▼' : '▶'}</span>
            </button>
            
            {acordeon.contacto && (
              <div className="p-4 bg-white space-y-4">
                <div>
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
            )}
          </div>

          {/* ========================================
              SECCIÓN: RECOLECCIÓN (Acordeón)
              ======================================== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleAcordeon('recoleccion')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <span className="font-semibold text-gray-700">Recolección</span>
                <span className="text-xs text-gray-500">(Opcional - Para manifiestos)</span>
              </div>
              <span className="text-gray-500">{acordeon.recoleccion ? '▼' : '▶'}</span>
            </button>
            
            {acordeon.recoleccion && (
              <div className="p-4 bg-white">
                <div>
                  <label className="label">Encargado de Entrega de Residuos</label>
                  <input
                    type="text"
                    value={formData.encargado_entrega}
                    onChange={(e) => setFormData({ ...formData, encargado_entrega: e.target.value })}
                    className="input"
                    placeholder="Ej: Juan Pérez"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de la persona que entrega los residuos reciclables (aparecerá en manifiestos)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
