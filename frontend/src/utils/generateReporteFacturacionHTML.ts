interface ClienteCobroReporte {
  local_nombre: string;
  razon_social: string;
  rfc: string;
  plaza_nombre: string;
  modo_pago: string;
  forma_pago: string;
  numero_servicio: number | null;
  folio: string | null;
  servicios: Array<{ nombre_servicio: string; costo: number }>;
  subtotal: number;
  iva: number;
  total_mensual: number;
  monto_cobrado: number | null;
  monto_pagado: number | null;
  estado: 'pendiente' | 'pagado' | 'parcial';
  fecha_pago: string | null;
}

interface ReporteFacturacionData {
  mes: number;
  anio: number;
  clientes: ClienteCobroReporte[];
  userName?: string;
}

export const generateReporteFacturacionHTML = (data: ReporteFacturacionData): string => {
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const mesNombre = MESES[data.mes - 1];

  const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalSubtotal = data.clientes.reduce((s, c) => s + c.subtotal, 0);
  const totalIva = data.clientes.reduce((s, c) => s + c.iva, 0);
  const totalMensual = data.clientes.reduce((s, c) => s + c.total_mensual, 0);
  const totalCobrado = data.clientes.reduce((s, c) => s + (c.monto_cobrado || 0), 0);
  const totalPagado = data.clientes.reduce((s, c) => s + (c.monto_pagado || 0), 0);
  const totalPendiente = totalMensual - totalPagado;

  const badgeEstado = (estado: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pagado:   { bg: '#d1fae5', color: '#065f46', label: 'Pagado' },
      parcial:  { bg: '#fef3c7', color: '#92400e', label: 'Parcial' },
      pendiente:{ bg: '#fee2e2', color: '#991b1b', label: 'Pendiente' },
    };
    const s = map[estado] || map.pendiente;
    return `<span style="background:${s.bg};color:${s.color};padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">${s.label}</span>`;
  };

  const filas = data.clientes.map((c, i) => {
    const serviciosStr = c.servicios.map(s => `${s.nombre_servicio}: $${fmt(s.costo)}`).join('<br/>');
    const fechaPago = c.fecha_pago ? new Date(c.fecha_pago).toLocaleDateString('es-MX') : '-';
    const bgRow = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    return `
      <tr style="background:${bgRow};">
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;">${c.numero_servicio || '-'}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;">
          <div style="font-weight:600;color:#1f2937;">${c.local_nombre}</div>
          <div style="font-size:10px;color:#6b7280;">${c.plaza_nombre}</div>
        </td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;">
          <div>${c.razon_social}</div>
          <div style="font-size:10px;color:#6b7280;font-family:monospace;">${c.rfc}</div>
        </td>
        <td style="padding:9px 8px;font-size:10px;color:#374151;border-bottom:1px solid #f3f4f6;line-height:1.6;">${serviciosStr}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center;">
          <span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;">${c.modo_pago}</span>
        </td>
        <td style="padding:9px 8px;font-size:11px;color:#047857;font-weight:600;border-bottom:1px solid #f3f4f6;text-align:right;">$${fmt(c.subtotal)}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;">$${fmt(c.iva)}</td>
        <td style="padding:9px 8px;font-size:12px;color:#047857;font-weight:700;border-bottom:1px solid #f3f4f6;text-align:right;">$${fmt(c.total_mensual)}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center;">${c.folio || '-'}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;">$${fmt(c.monto_cobrado || 0)}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;">$${fmt(c.monto_pagado || 0)}</td>
        <td style="padding:9px 8px;font-size:11px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center;">${fechaPago}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #f3f4f6;text-align:center;">${badgeEstado(c.estado)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Facturación - ${mesNombre} ${data.anio}</title>
  <style>
    @media print {
      @page { size: Letter landscape; margin: 10mm 12mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; color: #1f2937; line-height: 1.5; }
    .page { max-width: 279mm; margin: 0 auto; padding: 8mm 10mm; background: white; }
    .cover-page { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; page-break-after: always; }
    .cover-header { background: linear-gradient(135deg, #047857 0%, #059669 100%); color: white; padding: 40px 60px; border-radius: 15px; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(4,120,87,0.3); }
    .cover-header h1 { font-size: 38px; margin-bottom: 12px; font-weight: bold; }
    .cover-header p { font-size: 18px; opacity: 0.95; }
    .logo-container { width: 120px; height: 120px; background: white; border-radius: 50%; margin: 30px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
    .cover-info { font-size: 15px; color: #374151; margin-bottom: 30px; line-height: 2; }
    .cover-footer { margin-top: 40px; padding-top: 15px; border-top: 2px solid #047857; color: #6b7280; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #047857; }
    .header-left h1 { font-size: 22px; color: #047857; margin-bottom: 4px; }
    .header-left p { font-size: 12px; color: #6b7280; }
    .header-right { text-align: right; font-size: 11px; color: #6b7280; line-height: 1.8; }
    .kpis-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { padding: 12px 10px; border-radius: 8px; text-align: center; }
    .kpi-card.green  { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); }
    .kpi-card.blue   { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
    .kpi-card.amber  { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
    .kpi-card.red    { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
    .kpi-card.emerald{ background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); }
    .kpi-label { font-size: 10px; color: #4b5563; font-weight: 600; margin-bottom: 5px; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: bold; color: #047857; }
    .kpi-unit { font-size: 10px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    thead { background: #047857; }
    th { padding: 9px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.03em; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    .tfoot-row td { padding: 10px 8px; font-size: 12px; font-weight: 700; color: #047857; border-top: 2px solid #047857; background: #f0fdf4; }
    .footer { position: fixed; bottom: 8mm; left: 12mm; right: 12mm; text-align: center; font-size: 9px; color: #9ca3af; padding-top: 6px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="cover-page">
    <div class="cover-header">
      <h1>Reporte de Facturación</h1>
      <p>${mesNombre} ${data.anio} — Elefantes Verdes</p>
    </div>
    <div class="logo-container">
      <img src="/logo-blanco.png" alt="Elefantes Verdes" style="width:100px;height:100px;object-fit:contain;" />
    </div>
    <div class="cover-info">
      <p><strong>Período:</strong> ${mesNombre} ${data.anio}</p>
      <p><strong>Total de clientes:</strong> ${data.clientes.length}</p>
      <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</p>
      ${data.userName ? `<p><strong>Generado por:</strong> ${data.userName}</p>` : ''}
    </div>
    <div class="cover-footer">
      <p>Elefantes Verdes — Estrategias Ambientales</p>
      <p>Sistema Acrux-Bio · Módulo de Facturación</p>
    </div>
  </div>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <h1>Facturación — ${mesNombre} ${data.anio}</h1>
        <p>Elefantes Verdes — Estrategias Ambientales · ${data.clientes.length} clientes activos</p>
      </div>
      <div class="header-right">
        <div><strong>Generado:</strong> ${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
        ${data.userName ? `<div><strong>Por:</strong> ${data.userName}</div>` : ''}
        <div><img src="/logo-blanco.png" alt="EV" style="height:36px;object-fit:contain;margin-top:4px;" /></div>
      </div>
    </div>
    <div class="kpis-grid">
      <div class="kpi-card green">
        <div class="kpi-label">Subtotal total</div>
        <div class="kpi-value" style="font-size:15px;">$${fmt(totalSubtotal)}</div>
        <div class="kpi-unit">sin IVA</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">IVA 16%</div>
        <div class="kpi-value" style="font-size:15px;">$${fmt(totalIva)}</div>
      </div>
      <div class="kpi-card emerald">
        <div class="kpi-label">Total mensual</div>
        <div class="kpi-value" style="font-size:15px;">$${fmt(totalMensual)}</div>
        <div class="kpi-unit">con IVA</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-label">Total cobrado</div>
        <div class="kpi-value" style="font-size:15px;color:#92400e;">$${fmt(totalCobrado)}</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">Por cobrar</div>
        <div class="kpi-value" style="font-size:15px;color:#991b1b;">$${fmt(totalPendiente)}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">Nº</th>
          <th style="width:130px;">Local</th>
          <th style="width:160px;">Razón social / RFC</th>
          <th style="width:180px;">Servicios</th>
          <th class="center" style="width:55px;">Modo</th>
          <th class="right" style="width:80px;">Subtotal</th>
          <th class="right" style="width:70px;">IVA</th>
          <th class="right" style="width:85px;">Total</th>
          <th class="center" style="width:80px;">Folio</th>
          <th class="right" style="width:80px;">Cobrado</th>
          <th class="right" style="width:80px;">Pagado</th>
          <th class="center" style="width:90px;">Fecha pago</th>
          <th class="center" style="width:70px;">Estado</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr class="tfoot-row">
          <td colspan="5">TOTALES</td>
          <td style="text-align:right;">$${fmt(totalSubtotal)}</td>
          <td style="text-align:right;">$${fmt(totalIva)}</td>
          <td style="text-align:right;">$${fmt(totalMensual)}</td>
          <td></td>
          <td style="text-align:right;">$${fmt(totalCobrado)}</td>
          <td style="text-align:right;">$${fmt(totalPagado)}</td>
          <td></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
  <div class="footer">
    Acrux-Bio · Elefantes Verdes — Estrategias Ambientales · Quintana Roo, México · Reporte generado el ${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}
  </div>
</body>
</html>`;
};
