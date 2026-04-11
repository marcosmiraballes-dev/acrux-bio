interface ClienteReporte {
  local_nombre: string;
  razon_social: string;
  rfc: string;
  plaza_nombre: string;
  modo_pago: string;
  forma_pago: string;
  numero_servicio: number | null;
  folio: string | null;
  servicios: { nombre_servicio: string; costo: number }[];
  subtotal: number;
  iva: number;
  total_mensual: number;
  monto_cobrado: number | null;
  monto_pagado: number | null;
  estado: string;
  fecha_pago: string | null;
}

interface GrupoPlaza {
  plaza: string;
  clientes: ClienteReporte[];
}

interface ReportePorPlazaParams {
  mes: number;
  anio: number;
  grupos: GrupoPlaza[];
  userName?: string;
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const fmt = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const fmtFecha = (fecha: string | null) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const estadoBadge = (estado: string) => {
  const colores: Record<string, string> = {
    pagado: 'background:#dcfce7;color:#166534;',
    parcial: 'background:#ffedd5;color:#9a3412;',
    pendiente: 'background:#fef9c3;color:#854d0e;',
  };
  return `<span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;${colores[estado] || colores.pendiente}">${estado}</span>`;
};

export const generateReportePorPlazaHTML = (params: ReportePorPlazaParams): string => {
  const { mes, anio, grupos, userName } = params;
  const mesNombre = MESES[mes - 1];
  const fechaEmision = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const totalGeneral = {
    esperado: 0,
    cobrado: 0,
    pagado: 0,
  };

  const seccionesPlaza = grupos.map(grupo => {
    const totPlaza = {
      esperado: grupo.clientes.reduce((s, c) => s + c.total_mensual, 0),
      cobrado: grupo.clientes.reduce((s, c) => s + (c.monto_cobrado || 0), 0),
      pagado: grupo.clientes.reduce((s, c) => s + (c.monto_pagado || 0), 0),
    };
    totalGeneral.esperado += totPlaza.esperado;
    totalGeneral.cobrado += totPlaza.cobrado;
    totalGeneral.pagado += totPlaza.pagado;

    const filas = grupo.clientes.map(c => `
      <tr>
        <td>${c.numero_servicio ?? '-'}</td>
        <td>${c.local_nombre}</td>
        <td>${c.folio || '-'}</td>
        <td class="num">${fmt(c.total_mensual)}</td>
        <td class="num">${c.monto_cobrado != null ? fmt(c.monto_cobrado) : '-'}</td>
        <td class="num">${c.monto_pagado != null ? fmt(c.monto_pagado) : '-'}</td>
        <td>${fmtFecha(c.fecha_pago)}</td>
        <td>${estadoBadge(c.estado)}</td>
      </tr>
    `).join('');

    return `
      <div class="plaza-section">
        <div class="plaza-header">${grupo.plaza}</div>
        <table>
          <thead>
            <tr>
              <th>Nº Servicio</th>
              <th>Local</th>
              <th>Folio</th>
              <th>Monto esperado</th>
              <th>Monto cobrado</th>
              <th>Monto pagado</th>
              <th>Fecha pago</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="plaza-totales">
          <span>Subtotal plaza:</span>
          <span>Esperado: <strong>${fmt(totPlaza.esperado)}</strong></span>
          <span>Cobrado: <strong>${fmt(totPlaza.cobrado)}</strong></span>
          <span>Pagado: <strong>${fmt(totPlaza.pagado)}</strong></span>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte por Plaza — ${mesNombre} ${anio}</title>
<style>
  @page { size: letter portrait; margin: 15mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 0 8px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #047857; padding-bottom: 16px; }
  .logo { height: 44px; width: auto; }
  .header-right { text-align: right; font-size: 11px; color: #6b7280; }
  .header-right strong { color: #1a1a1a; }
  .titulo { font-size: 16px; font-weight: 700; color: #047857; margin-bottom: 2px; }
  .subtitulo { font-size: 13px; color: #374151; }
  .plaza-section { margin-bottom: 28px; page-break-inside: avoid; }
  .plaza-header { background: #047857; color: white; padding: 8px 14px; font-size: 13px; font-weight: 700; border-radius: 6px 6px 0 0; }
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #f0fdf4; color: #166534; padding: 7px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #bbf7d0; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  .num { text-align: right; font-family: monospace; }
  .plaza-totales { display: flex; gap: 24px; justify-content: flex-end; padding: 8px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-top: none; border-radius: 0 0 6px 6px; font-size: 12px; color: #374151; }
  .gran-total { margin-top: 24px; border: 2px solid #047857; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: flex-end; gap: 32px; }
  .gran-total-item { text-align: center; }
  .gran-total-item label { display: block; font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 4px; }
  .gran-total-item span { font-size: 15px; font-weight: 700; color: #047857; }
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <img src="/logo.png" alt="Elefantes Verdes" class="logo" />
      <div class="titulo" style="margin-top:8px;">Reporte de Cobros por Plaza</div>
      <div class="subtitulo">${mesNombre} ${anio}</div>
    </div>
    <div class="header-right">
      <div>Fecha de emisión: <strong>${fechaEmision}</strong></div>
      <div>Emitido por: <strong>${userName || 'Sistema'}</strong></div>
    </div>
  </div>

  ${seccionesPlaza}

  <div class="gran-total">
    <div class="gran-total-item"><label>Total esperado</label><span>${fmt(totalGeneral.esperado)}</span></div>
    <div class="gran-total-item"><label>Total cobrado</label><span>${fmt(totalGeneral.cobrado)}</span></div>
    <div class="gran-total-item"><label>Total pagado</label><span>${fmt(totalGeneral.pagado)}</span></div>
  </div>

  <div class="footer">Acrux-Bio · Elefantes Verdes — Estrategias Ambientales · Quintana Roo, México · ${fechaEmision}</div>
</body>
</html>`;
};
