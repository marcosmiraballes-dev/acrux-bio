import React, { useEffect, useMemo, useState } from 'react';
import { facturacionService } from '../services/facturacion.service';
import { generateReporteFacturacionHTML } from '../utils/generateReporteFacturacionHTML';
import { generateEstadoCuentaHTML } from '../utils/generateEstadoCuentaHTML';
import { generateReportePorPlazaHTML } from '../utils/generateReportePorPlazaHTML';
import { listarMovimientosPorCliente } from '../services/facturacion.service';
import { plazaService } from '../services/plaza.service';
import { useAuth } from '../context/AuthContext';
import MovimientoModal from '../components/common/MovimientoModal';

const CobrosFacturacion: React.FC = () => {
  const { user } = useAuth();
  const now = useMemo(() => new Date(), []);
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [anio, setAnio] = useState<number>(now.getFullYear());
  const [cobros, setCobros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [movimientoClienteId, setMovimientoClienteId] = useState<string | null>(null);
  const [movimientoClienteNombre, setMovimientoClienteNombre] = useState<string>('');
  const [plazas, setPlazas] = useState<any[]>([]);
  const [plazaFiltro, setPlazaFiltro] = useState<string>('');

  const [editingCobro, setEditingCobro] = useState<any | null>(null);
  const [pagoData, setPagoData] = useState({
    folio: '',
    monto_cobrado: '',
    monto_pagado: '',
    estado: 'pendiente',
    fecha_pago: '',
    notas: '',
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value || 0);

  const loadCobros = async () => {
    try {
      setLoading(true);
      const data = await facturacionService.getCobrosMes(mes, anio);
      setCobros(data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar cobros del mes');
    } finally {
      setLoading(false);
    }
  };

  const loadPlazas = async () => {
    try {
      const getPlazasFn = (plazaService as any).getPlazas || plazaService.getAll;
      const data = await getPlazasFn();
      setPlazas((data || []).filter((p: any) => p.activo));
    } catch (err) {
      console.error('Error cargando plazas:', err);
    }
  };

  useEffect(() => {
    loadCobros();
    loadPlazas();
  }, [mes, anio]);

  const cobrosFiltrados = plazaFiltro
    ? cobros.filter(c => c.clientes_facturacion?.locales?.plazas?.id === plazaFiltro)
    : cobros;

  const handleGenerarCobros = async () => {
    try {
      await facturacionService.generarCobrosMes(mes, anio);
      setSuccessMessage('Cobros del mes generados correctamente');
      await loadCobros();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al generar cobros del mes');
      setTimeout(() => setError(''), 3000);
    }
  };

  const editableInputStyle: React.CSSProperties = {
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '13px',
    width: '100%',
    background: 'white',
    outline: 'none',
  };

  const handleFolioBlur = async (cobro: any, value: string) => {
    const nextValue = value.trim();
    const currentValue = cobro.folio ? String(cobro.folio).trim() : '';

    if (nextValue === currentValue) return;

    try {
      await facturacionService.updateCobro(cobro.id, { folio: nextValue || null });
      await loadCobros();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error actualizando folio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleNumeroServicioBlur = async (cobro: any, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    const nextValue = digits ? Number(digits) : null;
    const currentValue = cobro.numero_servicio != null ? Number(cobro.numero_servicio) : null;

    if (nextValue === currentValue) return;

    try {
      await facturacionService.updateCobro(cobro.id, { numero_servicio: nextValue });
      await loadCobros();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error actualizando número de servicio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFechaPagoBlur = async (cobro: any, value: string) => {
    const nextValue = value || '';
    const currentValue = cobro.fecha_pago ? String(cobro.fecha_pago).slice(0, 10) : '';

    if (nextValue === currentValue) return;

    try {
      await facturacionService.updateCobro(cobro.id, { fecha_pago: nextValue || null });
      await loadCobros();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error actualizando fecha de pago');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleExportarReporte = () => {
    const clientes = cobros.map((cobro) => {
      const servicios = (cobro.servicios_cliente || []).map((servicio: any) => ({
        nombre_servicio: servicio.nombre_servicio,
        costo: Number(servicio.costo || 0),
      }));

      const subtotal = servicios.reduce((sum: number, servicio: any) => sum + Number(servicio.costo || 0), 0);
      const iva = subtotal * 0.16;
      const total_mensual = subtotal + iva;

      return {
        local_nombre: cobro.clientes_facturacion?.locales?.nombre || 'Cliente externo',
        razon_social: cobro.clientes_facturacion?.locales?.razon_social || '-',
        rfc: cobro.clientes_facturacion?.locales?.rfc || '-',
        plaza_nombre: cobro.clientes_facturacion?.locales?.plaza_nombre || '-',
        modo_pago: cobro.clientes_facturacion?.modo_pago || '-',
        forma_pago: cobro.clientes_facturacion?.forma_pago || '-',
        numero_servicio: cobro.numero_servicio ?? null,
        folio: cobro.folio ?? null,
        servicios,
        subtotal,
        iva,
        total_mensual,
        monto_cobrado: cobro.monto_cobrado ?? null,
        monto_pagado: cobro.monto_pagado ?? null,
        estado: cobro.estado,
        fecha_pago: cobro.fecha_pago ?? null,
      };
    });

    const html = generateReporteFacturacionHTML({
      mes,
      anio,
      clientes,
      userName: user?.nombre,
    });

    const ventana = window.open('', '_blank');
    ventana?.document.write(html);
    ventana?.document.close();
    ventana?.print();
  };

  const handleExportarPorPlaza = () => {
    const plazasEnCobros = Array.from(
      new Map(
        cobros
          .filter(c => c.clientes_facturacion?.locales?.plazas?.id)
          .map(c => [
            c.clientes_facturacion.locales.plazas.id,
            c.clientes_facturacion.locales.plazas.nombre
          ])
      ).entries()
    ).map(([id, nombre]) => ({ id, nombre }));

    const grupos = plazasEnCobros.map(plaza => {
      const cobrosPlaza = cobros.filter(
        c => c.clientes_facturacion?.locales?.plazas?.id === plaza.id
      );
      const clientes = cobrosPlaza.map((cobro) => {
        const servicios = (cobro.servicios_cliente || []).map((s: any) => ({
          nombre_servicio: s.nombre_servicio,
          costo: Number(s.costo || 0),
        }));
        const subtotal = servicios.reduce((sum: number, s: any) => sum + s.costo, 0);
        const iva = subtotal * 0.16;
        const total_mensual = subtotal + iva;
        return {
          local_nombre: cobro.clientes_facturacion?.locales?.nombre || 'Cliente externo',
          razon_social: cobro.clientes_facturacion?.locales?.razon_social || '-',
          rfc: cobro.clientes_facturacion?.locales?.rfc || '-',
          plaza_nombre: plaza.nombre,
          modo_pago: cobro.clientes_facturacion?.modo_pago || '-',
          forma_pago: cobro.clientes_facturacion?.forma_pago || '-',
          numero_servicio: cobro.numero_servicio ?? null,
          folio: cobro.folio ?? null,
          servicios,
          subtotal,
          iva,
          total_mensual,
          monto_cobrado: cobro.monto_cobrado ?? null,
          monto_pagado: cobro.monto_pagado ?? null,
          estado: cobro.estado,
          fecha_pago: cobro.fecha_pago ?? null,
        };
      });
      return { plaza: plaza.nombre, clientes };
    });

    const html = generateReportePorPlazaHTML({ mes, anio, grupos, userName: user?.nombre });
    const ventana = window.open('', '_blank');
    ventana?.document.write(html);
    ventana?.document.close();
    ventana?.print();
  };

  const handleEstadoCuenta = async (cobro: any) => {
    try {
      const clienteId = cobro.clientes_facturacion?.id;
      if (!clienteId) return;

      const movimientos = await listarMovimientosPorCliente(clienteId);

      const cobrosMapeados = [{
        mes: cobro.mes,
        anio: cobro.anio,
        folio: cobro.folio ?? null,
        numero_servicio: cobro.numero_servicio ?? null,
        monto_esperado: Number(cobro.monto_esperado || 0),
        monto_cobrado: cobro.monto_cobrado ?? null,
        monto_pagado: cobro.monto_pagado ?? null,
        estado: cobro.estado,
        fecha_pago: cobro.fecha_pago ?? null,
        notas: cobro.notas ?? null,
      }];

      const html = generateEstadoCuentaHTML({
        clienteNombre: cobro.clientes_facturacion?.locales?.nombre || 'Cliente externo',
        razonSocial: cobro.clientes_facturacion?.locales?.razon_social || '-',
        rfc: cobro.clientes_facturacion?.locales?.rfc || '-',
        plaza: cobro.clientes_facturacion?.locales?.plazas?.nombre || '-',
        modoPago: cobro.clientes_facturacion?.modo_pago || '-',
        formaPago: cobro.clientes_facturacion?.forma_pago || '-',
        cobros: cobrosMapeados,
        movimientos,
        userName: user?.nombre,
      });

      const ventana = window.open('', '_blank');
      ventana?.document.write(html);
      ventana?.document.close();
      ventana?.print();
    } catch (err) {
      setError('Error al generar estado de cuenta');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openPago = (cobro: any) => {
    setEditingCobro(cobro);
    setPagoData({
      folio: cobro.folio || '',
      monto_cobrado: cobro.monto_cobrado != null ? String(cobro.monto_cobrado) : '',
      monto_pagado: cobro.monto_pagado != null ? String(cobro.monto_pagado) : '',
      estado: cobro.estado || 'pendiente',
      fecha_pago: cobro.fecha_pago ? String(cobro.fecha_pago).slice(0, 10) : '',
      notas: cobro.notas || '',
    });
  };

  const handleGuardarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCobro) return;

    try {
      await facturacionService.updateCobro(editingCobro.id, {
        folio: pagoData.folio || null,
        monto_cobrado: pagoData.monto_cobrado === '' ? null : Number(pagoData.monto_cobrado),
        monto_pagado: pagoData.monto_pagado === '' ? 0 : Number(pagoData.monto_pagado),
        estado: pagoData.estado,
        fecha_pago: pagoData.fecha_pago ? new Date(pagoData.fecha_pago).toISOString() : null,
        notas: pagoData.notas || null,
      });

      setSuccessMessage('Pago registrado correctamente');
      setEditingCobro(null);
      await loadCobros();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar pago');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    if (estado === 'pagado') return 'bg-green-100 text-green-800';
    if (estado === 'parcial') return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
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
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cobros del mes</h1>
          <p className="text-gray-600">Gestiona cobros mensuales y registro de pagos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="input w-full sm:w-44">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((numeroMes) => (
              <option key={numeroMes} value={numeroMes}>Mes {numeroMes}</option>
            ))}
          </select>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="input w-full sm:w-36"
            min={2000}
            max={9999}
          />
          <select value={plazaFiltro} onChange={(e) => setPlazaFiltro(e.target.value)} className="input w-full sm:w-52">
            <option value="">Todas las plazas</option>
            {plazas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button onClick={handleGenerarCobros} className="btn btn-primary whitespace-nowrap">
            Generar cobros del mes
          </button>
          <button onClick={handleExportarReporte} className="btn btn-secondary whitespace-nowrap">
            Exportar reporte
          </button>
          <button
            onClick={handleExportarPorPlaza}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Exportar por plaza
          </button>
        </div>
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

      {editingCobro && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar pago</h3>
          <form onSubmit={handleGuardarPago} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Folio</label>
              <input
                type="text"
                value={pagoData.folio}
                onChange={(e) => setPagoData({ ...pagoData, folio: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Monto cobrado</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pagoData.monto_cobrado}
                onChange={(e) => setPagoData({ ...pagoData, monto_cobrado: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Monto pagado</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pagoData.monto_pagado}
                onChange={(e) => setPagoData({ ...pagoData, monto_pagado: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                value={pagoData.estado}
                onChange={(e) => setPagoData({ ...pagoData, estado: e.target.value })}
                className="input"
              >
                <option value="pendiente">pendiente</option>
                <option value="pagado">pagado</option>
                <option value="parcial">parcial</option>
              </select>
            </div>

            <div>
              <label className="label">Fecha de pago</label>
              <input
                type="date"
                value={pagoData.fecha_pago}
                onChange={(e) => setPagoData({ ...pagoData, fecha_pago: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notas</label>
              <textarea
                value={pagoData.notas}
                onChange={(e) => setPagoData({ ...pagoData, notas: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={() => setEditingCobro(null)} className="btn btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                Guardar pago
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {cobros.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">💵</div>
            <p className="text-lg">No hay cobros para el mes seleccionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Servicio</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto esperado</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto cobrado</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto pagado</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de pago</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cobrosFiltrados.map((cobro) => (
                  <tr key={cobro.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm text-gray-900">
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue={cobro.numero_servicio ?? ''}
                        maxLength={6}
                        style={{ ...editableInputStyle, width: '70px' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#047857'; }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          handleNumeroServicioBlur(cobro, e.currentTarget.value);
                        }}
                        onInput={(e) => {
                          const target = e.currentTarget;
                          const digits = target.value.replace(/\D/g, '').slice(0, 6);
                          target.value = digits;
                        }}
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{cobro.clientes_facturacion?.locales?.nombre || 'Cliente externo'}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">
                      <input
                        type="text"
                        placeholder="Sin folio"
                        defaultValue={cobro.folio || ''}
                        style={{ ...editableInputStyle, minWidth: '90px', maxWidth: '120px' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#047857'; }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          handleFolioBlur(cobro, e.currentTarget.value);
                        }}
                      />
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(Number(cobro.monto_esperado || 0) * 1.16)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900">{formatCurrency(Number(cobro.monto_cobrado || 0))}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">{formatCurrency(Number(cobro.monto_pagado || 0))}</td>
                    <td className="px-3 py-3 text-sm text-gray-900">
                      <input
                        type="date"
                        defaultValue={cobro.fecha_pago ? String(cobro.fecha_pago).slice(0, 10) : ''}
                        style={{ ...editableInputStyle, width: '130px' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#047857'; }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          handleFechaPagoBlur(cobro, e.currentTarget.value);
                        }}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadgeClass(cobro.estado)}`}>
                        {cobro.estado}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col items-stretch gap-1">
                        <button
                          onClick={() => {
                            setMovimientoClienteId(cobro.clientes_facturacion?.id);
                            setMovimientoClienteNombre(cobro.clientes_facturacion?.locales?.nombre || 'Cliente externo');
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          + Movimiento
                        </button>
                        <button
                          onClick={() => handleEstadoCuenta(cobro)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Estado de cuenta
                        </button>
                        <button
                          onClick={() => openPago(cobro)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Registrar pago
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {movimientoClienteId && (
        <MovimientoModal
          clienteId={movimientoClienteId}
          clienteNombre={movimientoClienteNombre}
          onClose={() => setMovimientoClienteId(null)}
          onSuccess={() => loadCobros()}
        />
      )}
    </div>
  );
};

export default CobrosFacturacion;
