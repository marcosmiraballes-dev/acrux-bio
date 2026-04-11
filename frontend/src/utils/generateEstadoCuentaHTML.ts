import { MovimientoCuenta } from '../types';

interface CobroMensual {
  mes: number;
  anio: number;
  folio: string | null;
  numero_servicio: number | null;
  monto_esperado: number;
  monto_cobrado: number | null;
  monto_pagado: number | null;
  estado: string;
  fecha_pago: string | null;
  notas: string | null;
}

interface EstadoCuentaParams {
  clienteNombre: string;
  razonSocial: string;
  rfc: string;
  plaza: string;
  modoPago: string;
  formaPago: string;
  cobros: CobroMensual[];
  movimientos: MovimientoCuenta[];
  userName?: string;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const formatFecha = (fecha: string | null) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const TIPO_LABEL: Record<string, string> = {
  penalizacion: 'Penalización',
  descuento: 'Descuento',
  ajuste: 'Ajuste',
  nota_credito: 'Nota de crédito',
};

export const generateEstadoCuentaHTML = (params: EstadoCuentaParams): string => {
  const { clienteNombre, razonSocial, rfc, plaza, modoPago, formaPago, cobros, movimientos, userName } = params;

  // Construir líneas de movimiento unificadas ordenadas por fecha
  type Linea = {
    fecha: string;
    concepto: string;
    referencia: string;
    cargo: number;
    abono: number;
  };

  const lineas: Linea[] = [];

  cobros.forEach(c => {
    const subtotal = c.monto_esperado || 0;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const fechaRef = `${String(c.mes).padStart(2,'0')}/${c.anio}`;
    lineas.push({
      fecha: `${c.anio}-${String(c.mes).padStart(2,'0')}-01`,
      concepto: `Cobro mensual ${MESES[c.mes - 1]} ${c.anio}`,
      referencia: c.folio || c.numero_servicio?.toString() || '-',
      cargo: total,
      abono: c.monto_pagado || 0,
    });
  });

  movimientos.forEach(m => {
    lineas.push({
      fecha: m.fecha,
      concepto: TIPO_LABEL[m.tipo] || m.tipo,
      referencia: m.descripcion || '-',
      cargo: m.es_cargo ? m.monto : 0,
      abono: m.es_cargo ? 0 : m.monto,
    });
  });

  lineas.sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Calcular saldo acumulado
  let saldo = 0;
  const lineasConSaldo = lineas.map(l => {
    saldo += l.cargo - l.abono;
    return { ...l, saldo };
  });

  const totalCargos = lineas.reduce((s, l) => s + l.cargo, 0);
  const totalAbonos = lineas.reduce((s, l) => s + l.abono, 0);
  const saldoFinal = totalCargos - totalAbonos;

  const filas = lineasConSaldo.map(l => `
    <tr>
      <td>${formatFecha(l.fecha)}</td>
      <td>${l.concepto}</td>
      <td>${l.referencia}</td>
      <td class="num ${l.cargo > 0 ? 'cargo' : ''}">${l.cargo > 0 ? formatCurrency(l.cargo) : '-'}</td>
      <td class="num ${l.abono > 0 ? 'abono' : ''}">${l.abono > 0 ? formatCurrency(l.abono) : '-'}</td>
      <td class="num ${l.saldo > 0 ? 'cargo' : 'abono'}">${formatCurrency(l.saldo)}</td>
    </tr>
  `).join('');

  const fechaEmision = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Estado de Cuenta — ${clienteNombre}</title>
<style>
  @page { size: letter portrait; margin: 20mm 25mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #047857; padding-bottom: 16px; }
  .logo-area h1 { font-size: 20px; color: #047857; font-weight: 700; }
  .logo-area h2 { font-size: 14px; color: #374151; margin-top: 4px; }
  .meta { text-align: right; font-size: 11px; color: #6b7280; }
  .meta strong { color: #1a1a1a; }
  .cliente-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .cliente-field label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
  .cliente-field span { font-size: 13px; font-weight: 600; color: #111827; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #047857; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  .num { text-align: right; font-family: monospace; }
  .cargo { color: #dc2626; }
  .abono { color: #059669; }
  .totales { display: flex; justify-content: flex-end; margin-top: 8px; }
  .totales-card { border: 2px solid #047857; border-radius: 8px; padding: 16px; min-width: 320px; }
  .totales-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .totales-row.final { font-weight: 700; font-size: 15px; border-top: 2px solid #047857; margin-top: 8px; padding-top: 8px; }
  .totales-row.final span:last-child { color: ${saldoFinal > 0 ? '#dc2626' : '#059669'}; }
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { 
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; padding: 0; }
    @page { size: letter portrait; margin: 20mm 25mm; }
  }
  .logo { height: 48px; width: auto; }
  body { padding: 0 24px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <img src="/logo.png" alt="Elefantes Verdes" class="logo" />
      <h2 style="font-size:14px;color:#374151;margin-top:6px;font-weight:600;">Estado de Cuenta General</h2>
    </div>
    <div class="meta">
      <div>Fecha de emisión: <strong>${fechaEmision}</strong></div>
      <div>Emitido por: <strong>${userName || 'Sistema'}</strong></div>
      <div>Plaza: <strong>${plaza}</strong></div>
    </div>
  </div>

  <div class="cliente-card">
    <div class="cliente-field"><label>Local</label><span>${clienteNombre}</span></div>
    <div class="cliente-field"><label>Razón social</label><span>${razonSocial || '-'}</span></div>
    <div class="cliente-field"><label>RFC</label><span>${rfc || '-'}</span></div>
    <div class="cliente-field"><label>Modo de pago</label><span>${modoPago || '-'}</span></div>
    <div class="cliente-field"><label>Forma de pago</label><span>${formaPago || '-'}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Concepto</th>
        <th>Referencia</th>
        <th style="text-align:right">Cargo</th>
        <th style="text-align:right">Abono</th>
        <th style="text-align:right">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="totales">
    <div class="totales-card">
      <div class="totales-row"><span>Total cargos</span><span class="cargo">${formatCurrency(totalCargos)}</span></div>
      <div class="totales-row"><span>Total abonos</span><span class="abono">${formatCurrency(totalAbonos)}</span></div>
      <div class="totales-row final"><span>Saldo pendiente</span><span>${formatCurrency(saldoFinal)}</span></div>
    </div>
  </div>

  <div class="footer">
    Acrux-Bio · Elefantes Verdes — Estrategias Ambientales · Quintana Roo, México · ${fechaEmision}
  </div>
</body>
</html>`;
};
