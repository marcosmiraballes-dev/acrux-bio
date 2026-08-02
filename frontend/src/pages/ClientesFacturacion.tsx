import React, { useEffect, useState } from 'react';
import ClienteFacturacionModal from '../components/common/ClienteFacturacionModal';
import { facturacionService } from '../services/facturacion.service';

const ClientesFacturacion: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await facturacionService.getClientes();
      setClientes(data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar clientes de facturación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value || 0);

  const getServiciosTotalConIva = (cliente: any) => {
    const subtotal = (cliente.servicios_cliente || []).reduce(
      (sum: number, servicio: any) => sum + Number(servicio.costo || 0),
      0
    );
    return subtotal * 1.16;
  };

  const handleCreate = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cliente: any) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: any) => {
    const { clienteData, servicios } = payload;

    if (!selectedCliente) {
      const created = await facturacionService.createCliente(clienteData);
      const clienteId = created.id;

      await Promise.all(
        servicios.map((servicio: any) =>
          facturacionService.createServicio({
            ...servicio,
            cliente_id: clienteId,
          })
        )
      );

      setSuccessMessage('Cliente de facturación creado correctamente');
    } else {
      await facturacionService.updateCliente(selectedCliente.id, clienteData);

      const actuales = await facturacionService.getServiciosByCliente(selectedCliente.id);

      const buildKey = (servicio: any) => `${String(servicio.nombre_servicio).trim().toLowerCase()}||${Number(servicio.costo || 0)}`;

      const incomingMap = new Map<string, number>();
      servicios.forEach((servicio: any) => {
        const key = buildKey(servicio);
        incomingMap.set(key, (incomingMap.get(key) || 0) + 1);
      });

      const existingMap = new Map<string, any[]>();
      actuales.forEach((servicio: any) => {
        const key = buildKey(servicio);
        const list = existingMap.get(key) || [];
        list.push(servicio);
        existingMap.set(key, list);
      });

      const serviciosACrear: any[] = [];

      for (const servicio of servicios) {
        const key = buildKey(servicio);
        const matched = existingMap.get(key) || [];

        if (matched.length > 0) {
          matched.pop();
          existingMap.set(key, matched);
        } else {
          serviciosACrear.push(servicio);
        }
      }

      const idsABorrar: string[] = [];
      for (const [, restantes] of existingMap) {
        for (const servicio of restantes) {
          idsABorrar.push(servicio.id);
        }
      }

      await Promise.all([
        ...serviciosACrear.map((servicio: any) =>
          facturacionService.createServicio({
            ...servicio,
            cliente_id: selectedCliente.id,
          })
        ),
        ...idsABorrar.map((id: string) => facturacionService.deleteServicio(id)),
      ]);

      setSuccessMessage('Cliente de facturación actualizado correctamente');
    }

    await loadClientes();
    setIsModalOpen(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = async (cliente: any) => {
    if (!window.confirm('¿Estás seguro de desactivar este cliente de facturación?')) {
      return;
    }

    try {
      await facturacionService.deleteCliente(cliente.id);
      setSuccessMessage('Cliente de facturación desactivado correctamente');
      await loadClientes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al desactivar cliente');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Clientes de facturación</h1>
          <p className="text-gray-600">Gestiona clientes, servicios y configuración de cobro</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          + Nuevo cliente
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {clientes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">🧾</div>
            <p className="text-lg">No hay clientes de facturación registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón social</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modo de pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicios</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total mensual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{cliente.locales?.nombre || 'Cliente externo'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{cliente.locales?.razon_social || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{cliente.locales?.rfc || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{cliente.modo_pago || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(cliente.servicios_cliente || []).length}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(getServiciosTotalConIva(cliente))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cliente.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cliente)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClienteFacturacionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        cliente={selectedCliente}
      />
    </div>
  );
};

export default ClientesFacturacion;
