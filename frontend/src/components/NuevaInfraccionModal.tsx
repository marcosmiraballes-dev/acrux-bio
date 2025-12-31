import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Plaza {
  id: string;
  nombre: string;
}

interface Locatario {
  id: string;
  codigo_local: string;
  nombre_comercial: string;
  plaza_id: string;
}

interface Reglamento {
  id: string;
  numero_punto: string;
  descripcion: string;
  orden: number;
}

const NuevaInfraccionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingReglamentos, setLoadingReglamentos] = useState(false);
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locatarios, setLocatarios] = useState<Locatario[]>([]);
  const [reglamentos, setReglamentos] = useState<Reglamento[]>([]);

  // Form data
  const [plazaId, setPlazaId] = useState('');
  const [locatarioId, setLocatarioId] = useState('');
  const [fechaInfraccion, setFechaInfraccion] = useState(new Date().toISOString().split('T')[0]);
  const [reglamentoId, setReglamentoId] = useState('');
  const [descripcionFalta, setDescripcionFalta] = useState('');
  const [notas, setNotas] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadPlazas();
      loadReglamentos();
    }
  }, [isOpen]);

  // Cargar locatarios cuando cambia la plaza
  useEffect(() => {
    if (plazaId) {
      loadLocatarios();
    } else {
      setLocatarios([]);
      setLocatarioId('');
    }
  }, [plazaId]);

  const loadPlazas = async () => {
    try {
      const response = await api.get('/plazas');
      setPlazas(response.data.data);
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    }
  };

  const loadLocatarios = async () => {
    try {
      const response = await api.get(`/locatarios-infracciones?plaza_id=${plazaId}`);
      setLocatarios(response.data.data);
    } catch (error) {
      console.error('Error al cargar locatarios:', error);
    }
  };

  const loadReglamentos = async () => {
    setLoadingReglamentos(true);
    try {
      const response = await api.get('/reglamentos?active_only=true');
      setReglamentos(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar reglamentos:', error);
      // Fallback a hardcoded si falla el endpoint
      setReglamentos([
        {
          id: 'd14f6636-b6b6-4190-8d22-9f071b4a39f4',
          numero_punto: 'Punto 1',
          descripcion: 'Se deberá cumplir con los horarios establecidos para la recepción de residuos sólidos en la cámara de basura.',
          orden: 1
        },
        {
          id: '107ade00-5887-4181-b6a5-512845f533c4',
          numero_punto: 'Punto 2',
          descripcion: 'Los residuos generados se deberán entregar en la cámara de basura debidamente separados.',
          orden: 2
        },
        {
          id: '8baaf39a-44e7-4261-8e23-e5682c261692',
          numero_punto: 'Punto 3',
          descripcion: 'Restricciones de peso y estado durante la entrega.',
          orden: 3
        },
        {
          id: 'a3595a26-87c2-4a6c-8c55-6a0ca2f13c14',
          numero_punto: 'Punto 4',
          descripcion: 'Mantener limpia el área de la cámara de basura después de depositar los residuos.',
          orden: 4
        },
        {
          id: '1d6ce833-9580-4360-a413-25f287be7d77',
          numero_punto: 'Punto 5',
          descripcion: 'Respetar las indicaciones del personal de Elefantes Verdes.',
          orden: 5
        }
      ]);
    } finally {
      setLoadingReglamentos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locatarioId || !fechaInfraccion || !reglamentoId || !descripcionFalta) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await api.post('/infracciones', {
        locatario_id: locatarioId,
        fecha_infraccion: `${fechaInfraccion}T12:00:00`,
        reglamento_id: reglamentoId,
        descripcion_falta: descripcionFalta,
        notas: notas || null
      });

      alert('Infracción creada exitosamente');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error al crear infracción:', error);
      alert(error.response?.data?.error || 'Error al crear la infracción');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPlazaId('');
    setLocatarioId('');
    setFechaInfraccion(new Date().toISOString().split('T')[0]);
    setReglamentoId('');
    setDescripcionFalta('');
    setNotas('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Nueva Infracción</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Plaza */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plaza <span className="text-red-500">*</span>
            </label>
            <select
              value={plazaId}
              onChange={(e) => {
                setPlazaId(e.target.value);
                setLocatarioId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Selecciona una plaza</option>
              {plazas.map((plaza) => (
                <option key={plaza.id} value={plaza.id}>
                  {plaza.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local <span className="text-red-500">*</span>
            </label>
            <select
              value={locatarioId}
              onChange={(e) => setLocatarioId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
              disabled={!plazaId}
            >
              <option value="">Selecciona un local</option>
              {locatarios.map((locatario) => (
                <option key={locatario.id} value={locatario.id}>
                  {locatario.nombre_comercial}
                </option>
              ))}
            </select>
            {!plazaId && (
              <p className="mt-1 text-xs text-gray-500">
                Selecciona una plaza primero
              </p>
            )}
            {plazaId && locatarios.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {locatarios.length} locales disponibles
              </p>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Infracción <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fechaInfraccion}
              onChange={(e) => setFechaInfraccion(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Artículo del Reglamento con botón Refrescar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Artículo del Reglamento <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={loadReglamentos}
                disabled={loadingReglamentos}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center space-x-1"
                title="Recargar reglamentos"
              >
                <span>🔄</span>
                <span>{loadingReglamentos ? 'Cargando...' : 'Refrescar'}</span>
              </button>
            </div>
            <select
              value={reglamentoId}
              onChange={(e) => setReglamentoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
              disabled={loadingReglamentos}
            >
              <option value="">Selecciona un artículo</option>
              {reglamentos.map((reglamento) => (
                <option key={reglamento.id} value={reglamento.id}>
                  {reglamento.numero_punto} - {reglamento.descripcion}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {reglamentos.length} reglamentos disponibles
            </p>
          </div>

          {/* Descripción de la Falta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de la Falta <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descripcionFalta}
              onChange={(e) => setDescripcionFalta(e.target.value)}
              rows={4}
              placeholder="Describe detalladamente la infracción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
              minLength={10}
            />
            <p className="mt-1 text-xs text-gray-500">
              Mínimo 10 caracteres
            </p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (Opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Observaciones adicionales..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Nota informativa sobre tipo de aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              ℹ️ <strong>Tipo de Aviso:</strong> Se asignará automáticamente según el historial del locatario. A partir del 3er aviso se aplica multa de $5,000 MXN.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Crear Infracción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaInfraccionModal;