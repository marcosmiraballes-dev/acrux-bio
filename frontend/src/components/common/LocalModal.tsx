import React, { useState } from 'react';
import { Local } from '../../types';
import { useLocalForm } from '../../hooks/useLocalForm';
import { useSectoresLocal } from '../../hooks/useSectoresLocal';

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
  const [acordeon, setAcordeon] = useState({
    legal: false,
    ubicacion: false,
    contacto: false,
    recoleccion: false,
    portal: false,
    tablet: false,
    sectores: false,
  });

  const toggleAcordeon = (seccion: keyof typeof acordeon) => {
    setAcordeon({ ...acordeon, [seccion]: !acordeon[seccion] });
  };

  const {
    plazas,
    formData,
    setFormData,
    errors,
    loading,
    pinTablet,
    setPinTablet,
    handleSubmit,
    handleIndependienteChange,
  } = useLocalForm({ local, isOpen, onSave, onClose });

  const {
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
  } = useSectoresLocal({ isOpen, localId: local?.id });

  const abrirCerrarSectores = () => {
    const seAbrira = !acordeon.sectores;
    setAcordeon({ ...acordeon, sectores: seAbrira });
    if (seAbrira && local?.id) {
      loadSectores(local.id);
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

          {/* SECCIÓN: SECTORES DEL LOCAL */}
          <div className="border border-amber-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={abrirCerrarSectores}
                className="w-full px-4 py-3 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏨</span>
                  <span className="font-semibold text-gray-700">Sectores del Local</span>
                  <span className="text-xs text-gray-500">(Para registro por área)</span>
                </div>
                <span className="text-gray-500">{acordeon.sectores ? '▼' : '▶'}</span>
              </button>

              {acordeon.sectores && (
                <div className="p-4 bg-white space-y-3">
                  {!local?.id ? (
                    <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      Guarda el local primero para poder configurar sus sectores.
                    </p>
                  ) : (
                    <>
                      {mensajeSector && (
                        <div className={`rounded-lg border px-3 py-2 text-sm ${
                          mensajeSector.tipo === 'ok'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          {mensajeSector.texto}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Administración de sectores</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSectorEditandoId(null);
                            setSectorForm({ nombre: '', icono: '', orden: 0 });
                            setMostrarSectorForm(!mostrarSectorForm);
                            setMensajeSector(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50"
                          disabled={loading || guardandoSector}
                        >
                          + Agregar sector
                        </button>
                      </div>

                      {mostrarSectorForm && (
                        <div className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={sectorForm.nombre}
                              onChange={(e) => setSectorForm({ ...sectorForm, nombre: e.target.value })}
                              className="input"
                              placeholder="Nombre del sector"
                              disabled={guardandoSector}
                            />
                            <input
                              type="text"
                              value={sectorForm.icono}
                              onChange={(e) => setSectorForm({ ...sectorForm, icono: e.target.value })}
                              className="input"
                              placeholder="Emoji"
                              disabled={guardandoSector}
                            />
                            <input
                              type="number"
                              value={sectorForm.orden}
                              onChange={(e) => setSectorForm({ ...sectorForm, orden: Number(e.target.value) })}
                              className="input"
                              placeholder="Orden"
                              disabled={guardandoSector}
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-3">
                            <button
                              type="button"
                              onClick={resetSectorForm}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm"
                              disabled={guardandoSector}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={guardarSector}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
                              disabled={guardandoSector}
                            >
                              {guardandoSector ? 'Guardando...' : (sectorEditandoId ? 'Guardar cambios' : 'Guardar sector')}
                            </button>
                          </div>
                        </div>
                      )}

                      {cargandoSectores ? (
                        <p className="text-sm text-gray-500">Cargando sectores...</p>
                      ) : sectores.length === 0 ? (
                        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
                          Este local no tiene sectores configurados — el panel del locatario irá directo al registro de residuos.
                        </p>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Icono</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Nombre</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Orden</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Estado</th>
                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sectores.map((sector) => (
                                <tr key={sector.id} className="border-t border-gray-100">
                                  <td className="px-3 py-2 text-xl">{sector.icono}</td>
                                  <td className="px-3 py-2 text-gray-800">{sector.nombre}</td>
                                  <td className="px-3 py-2 text-gray-700">{sector.orden}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                      sector.activo
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {sector.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => editarSector(sector)}
                                        className="px-2 py-1 rounded border border-blue-200 text-blue-700 text-xs hover:bg-blue-50"
                                        disabled={guardandoSector}
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleActivoSector(sector)}
                                        className={`px-2 py-1 rounded text-xs border ${
                                          sector.activo
                                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                        }`}
                                        disabled={guardandoSector}
                                      >
                                        {sector.activo ? 'Desactivar' : 'Activar'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
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
                    value={pinTablet}
                    onChange={(e) => setPinTablet(e.target.value)}
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
