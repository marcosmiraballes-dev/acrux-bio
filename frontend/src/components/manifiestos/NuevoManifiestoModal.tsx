// frontend/src/components/manifiestos/NuevoManifiestoModal.tsx

import React from 'react';
import { useNuevoManifiestoWizard } from '../../hooks/useNuevoManifiestoWizard';
import { formatearFechaDDMMYYYY, obtenerFechaEmisionUltimoDia } from '../../utils/manifiestoFechas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NuevoManifiestoModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const {
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
  } = useNuevoManifiestoWizard({ isOpen, onClose, onSuccess });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-6 text-white">
          <h2 className="text-2xl font-bold">Nuevo Manifiesto</h2>
          <p className="text-emerald-100 mt-1">Paso {step} de 7</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div
            className="bg-emerald-600 h-2 transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* PASO 1: PLAZA */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Selecciona la Plaza</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plazas.map((plaza) => (
                  <button
                    key={plaza.id}
                    onClick={() => setPlazaSeleccionada(plaza.id)}
                    className={`p-6 border-2 rounded-lg text-left transition-all ${
                      plazaSeleccionada === plaza.id
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <div className="text-lg font-semibold text-gray-800">{plaza.nombre}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: TIPO DE FOLIO */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Tipo de Folio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setTipoFolio('automatico');
                    setFolioManualSeleccionado('');
                  }}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    tipoFolio === 'automatico'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-800 mb-2">📄 Folio Automático</div>
                  <div className="text-sm text-gray-600">El sistema generará el folio automáticamente</div>
                </button>

                <button
                  onClick={() => setTipoFolio('manual')}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    tipoFolio === 'manual'
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-800 mb-2">📋 Folio Manual/Reservado</div>
                  <div className="text-sm text-gray-600">Usar un folio previamente reservado</div>
                </button>
              </div>

              {tipoFolio === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona un Folio Reservado:
                  </label>
                  {foliosDisponibles.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                      No hay folios reservados disponibles para esta plaza en el mes actual.
                      <br />
                      <span className="text-sm">Ve a Catálogos → Folios Reservados para crear uno.</span>
                    </div>
                  ) : (
                    <select
                      value={folioManualSeleccionado}
                      onChange={(e) => setFolioManualSeleccionado(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Selecciona un folio --</option>
                      {foliosDisponibles.map((folio) => (
                        <option key={folio.id} value={folio.folio_manual}>
                          {folio.folio_manual}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Campo de fecha de emisión */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Fecha de Emisión del Manifiesto:
                    </label>
                    <input
                      type="date"
                      value={fechaEmisionPersonalizada}
                      onChange={(e) => setFechaEmisionPersonalizada(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta será la fecha que aparecerá en el PDF del manifiesto
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: LOCAL */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Selecciona el Local</h3>

              <input
                type="text"
                placeholder="🔍 Buscar local por nombre o giro..."
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {localesFiltrados.map((local) => (
                  <button
                    key={local.id}
                    onClick={() => setLocalSeleccionado(local.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      localSeleccionado === local.id
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{local.nombre}</div>
                    <div className="text-sm text-gray-600">{local.giro}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 4: PERIODO */}
          {step === 4 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Periodo de Recolecciones</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Desde:
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Hasta:
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    min={fechaDesde}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {fechaDesde && fechaHasta && recoleccionesDelPeriodo.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="font-semibold text-emerald-800 mb-2">
                    ✅ {recoleccionesDelPeriodo.length} recolección(es) encontrada(s) en este periodo
                  </div>
                  <div className="text-sm text-emerald-700">
                    Total de kilos: {recoleccionesDelPeriodo.reduce((sum, r) => sum + r.total_kilos, 0).toFixed(2)} kg
                  </div>
                </div>
              )}

              {fechaDesde && fechaHasta && recoleccionesDelPeriodo.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  ⚠️ No hay recolecciones en este periodo. El manifiesto se creará con 0 kg en todos los residuos.
                </div>
              )}
            </div>
          )}

          {/* PASO 5: VEHÍCULO */}
          {step === 5 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Selecciona el Vehículo</h3>
              {vehiculos.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  No hay vehículos activos.
                  <br />
                  <span className="text-sm">Ve a Catálogos → Vehículos para agregar uno.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehiculos.map((vehiculo) => (
                    <button
                      key={vehiculo.id}
                      onClick={() => setVehiculoSeleccionado(vehiculo.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        vehiculoSeleccionado === vehiculo.id
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{vehiculo.tipo}</div>
                      <div className="text-sm text-gray-600 font-mono">{vehiculo.placas}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 6: DESTINO FINAL */}
          {step === 6 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Selecciona el Destino Final</h3>
              {destinosFinales.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  No hay destinos finales activos.
                  <br />
                  <span className="text-sm">Ve a Catálogos → Destinos Finales para agregar uno.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {destinosFinales.map((destino) => (
                    <button
                      key={destino.id}
                      onClick={() => setDestinoSeleccionado(destino.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        destinoSeleccionado === destino.id
                          ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{destino.nombre_destino}</div>
                      <div className="text-sm text-gray-600 mt-1">{destino.domicilio}</div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        No. Autorización: {destino.numero_autorizacion}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASO 7: RECOLECTOR + RESUMEN */}
          {step === 7 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Recolector y Confirmación</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona el Recolector (Chofer):
                </label>
                <select
                  value={recolectorSeleccionado}
                  onChange={(e) => setRecolectorSeleccionado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Selecciona un recolector --</option>
                  {recolectores.map((recolector) => (
                    <option key={recolector.id} value={recolector.id}>
                      {recolector.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Resumen del Manifiesto:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Tipo de folio:</span>{' '}
                    {tipoFolio === 'automatico' ? 'Automático' : `Manual: ${folioManualSeleccionado}`}
                  </div>
                  {tipoFolio === 'manual' && fechaEmisionPersonalizada && (
                    <div>
                      <span className="font-medium">Fecha de emisión:</span>{' '}
                      {formatearFechaDDMMYYYY(obtenerFechaEmisionUltimoDia(fechaEmisionPersonalizada))}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Plaza:</span>{' '}
                    {plazas.find(p => p.id === plazaSeleccionada)?.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Local:</span>{' '}
                    {locales.find(l => l.id === localSeleccionado)?.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Periodo:</span>{' '}
                    {fechaDesde} al {fechaHasta}
                  </div>
                  <div>
                    <span className="font-medium">Recolecciones:</span>{' '}
                    {recoleccionesDelPeriodo.length} en el periodo
                  </div>
                  <div>
                    <span className="font-medium">Vehículo:</span>{' '}
                    {vehiculos.find(v => v.id === vehiculoSeleccionado)?.tipo}
                  </div>
                  <div>
                    <span className="font-medium">Destino:</span>{' '}
                    {destinosFinales.find(d => d.id === destinoSeleccionado)?.nombre_destino}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between border-t">
          <button
            onClick={step === 1 ? handleCloseModal : handleBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>

          {step < 7 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleCrear}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Manifiesto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevoManifiestoModal;
