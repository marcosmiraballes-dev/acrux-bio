import { useState } from 'react';
import { MovimientoCuenta } from '../../types';
import { crearMovimiento } from '../../services/facturacion.service';

interface Props {
  clienteId: string;
  clienteNombre: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TIPOS = [
  { value: 'penalizacion', label: 'Penalización', es_cargo: true },
  { value: 'descuento', label: 'Descuento', es_cargo: false },
  { value: 'ajuste', label: 'Ajuste', es_cargo: true },
  { value: 'nota_credito', label: 'Nota de crédito', es_cargo: false },
];

export default function MovimientoModal({ clienteId, clienteNombre, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<MovimientoCuenta['tipo']>('penalizacion');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tipoSeleccionado = TIPOS.find(t => t.value === tipo)!;

  const handleSubmit = async () => {
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      setError('El monto debe ser un número mayor a 0');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await crearMovimiento({
        cliente_id: clienteId,
        tipo,
        descripcion: descripcion || undefined,
        monto: Number(monto),
        es_cargo: tipoSeleccionado.es_cargo,
        fecha,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError('Error al guardar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">Nuevo movimiento</h2>
          <p className="text-sm text-gray-500 mt-1">{clienteNombre}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={tipo}
              onChange={e => setTipo(e.target.value as MovimientoCuenta['tipo'])}
            >
              {TIPOS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs font-medium" style={{ color: tipoSeleccionado.es_cargo ? '#dc2626' : '#059669' }}>
              {tipoSeleccionado.es_cargo ? '▲ Cargo' : '▼ Abono'}
            </p>
          </div>

          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              type="text"
              className="input"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Detalle del movimiento"
            />
          </div>

          <div>
            <label className="label">Monto</label>
            <input
              type="number"
              className="input"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
