export type TipoReporte = 'locatario' | 'plaza';

export function generarReporteHuella(data: any, tipo: TipoReporte): void {
  const COLORES_MAT: Record<string, string> = {
    'Cartón': '#D4A017', 'Orgánico': '#4CAF50', 'Aluminio': '#607D8B',
    'PET': '#2196F3', 'Vidrio': '#9C27B0', 'Plástico Duro': '#E91E63',
    'Playo': '#FF5722', 'Chatarra': '#795548', 'Archivo': '#009688',
    'Tetra Pak': '#FF9800', 'Inorgánico': '#BDBDBD',
  };

  const titulo = tipo === 'locatario' ? data.locatario.nombre : data.plaza.nombre;
  const periodo = `Enero — Diciembre ${data.periodo.anio}`;
  const resumen = data.resumen;
  const eq = resumen.equivalencias;
  const matsReciclados = (data.por_material || []).filter((m: any) => !m.es_inorganico);
  const matInorganico = (data.por_material || []).find((m: any) => m.es_inorganico);
  const totalCO2 = resumen.total_co2_evitado;

  const filasMat = matsReciclados.map((m: any) => `
    <tr>
      <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLORES_MAT[m.nombre] || '#888'};margin-right:8px;vertical-align:middle;"></span>${m.nombre}</td>
      <td style="text-align:right;">${m.factor_co2}</td>
      <td style="text-align:right;">${m.kilos.toLocaleString('es-MX')}</td>
      <td style="text-align:right;">${m.co2_evitado.toLocaleString('es-MX')}</td>
      <td style="text-align:right;">${m.porcentaje}%</td>
      <td><span style="background:#E8F5EE;color:#2E7D52;border:1px solid #C0DEC8;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:600;">Reciclado</span></td>
    </tr>`).join('');

  const filaInorg = matInorganico ? `
    <tr>
      <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#BDBDBD;margin-right:8px;vertical-align:middle;"></span>Inorgánico</td>
      <td style="text-align:right;">—</td>
      <td style="text-align:right;">${matInorganico.kilos.toLocaleString('es-MX')}</td>
      <td style="text-align:right;">—</td>
      <td style="text-align:right;">—</td>
      <td><span style="background:#FFF3E8;color:#C07030;border:1px solid #F0CCA8;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:600;">Sitio autorizado</span></td>
    </tr>` : '';

  const meses = (data.tendencia_mensual || []).map((m: any) => {
    const [, mes] = m.mes.split('-');
    const nombres = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return nombres[parseInt(mes)];
  });
  const co2Mes = (data.tendencia_mensual || []).map((m: any) => m.co2_evitado);
  const matLabels = matsReciclados.map((m: any) => m.nombre);
  const matData = matsReciclados.map((m: any) => m.co2_evitado);
  const matColors = matsReciclados.map((m: any) => COLORES_MAT[m.nombre] || '#888');
  const matKilos = matsReciclados.map((m: any) => m.kilos);

  let rankingHTML = '';
  if (tipo === 'plaza' && data.ranking_locatarios?.length) {
    const top10 = data.ranking_locatarios.slice(0, 10);
    rankingHTML = `
      <div class="contenido page">
        <div class="section-header">
          <div class="section-icon">🏆</div>
          <div>
            <div class="section-title">Ranking de Locatarios</div>
            <div class="section-subtitle">Top 10 por CO₂ evitado — ${data.periodo.anio}</div>
          </div>
        </div>
        <div class="tabla-wrapper">
          <table>
            <thead><tr>
              <th>#</th><th>Locatario</th><th>Giro</th>
              <th style="text-align:right;">Recolecciones</th>
              <th style="text-align:right;">Total kg</th>
              <th style="text-align:right;">CO₂ evitado (kg)</th>
            </tr></thead>
            <tbody>
              ${top10.map((l: any, i: number) => `
                <tr class="${i < 3 ? `rank-${i+1}` : ''}">
                  <td><span class="rank-num">${l.posicion}</span></td>
                  <td style="font-weight:500;">${l.nombre}</td>
                  <td>${l.giro}</td>
                  <td style="text-align:right;">${l.recolecciones.toLocaleString('es-MX')}</td>
                  <td style="text-align:right;">${l.total_kilos.toLocaleString('es-MX')}</td>
                  <td style="text-align:right;font-weight:600;">${l.co2_evitado.toLocaleString('es-MX')}</td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4">Total plaza (todos los locatarios)</td>
                <td style="text-align:right;">${resumen.total_kilos.toLocaleString('es-MX')} kg</td>
                <td style="text-align:right;">${totalCO2.toLocaleString('es-MX')} kg CO₂eq</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="nota-box">
          <div class="nota-icon">ℹ️</div>
          <div>
            <div class="nota-titulo">Nota sobre residuo inorgánico</div>
            <div class="nota-texto">El residuo inorgánico es gestionado en sitio de disposición final autorizado conforme a la normativa SEMARNAT/LGPGIR.</div>
          </div>
        </div>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte CO₂ — ${titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
:root{--vd:#1A5C38;--vm:#2E7D52;--vl:#8DC63F;--vc:#E8F5EE;--gt:#1C2B20;--gs:#F4F7F5;--gb:#D4E6DB;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'DM Sans',sans-serif;color:var(--gt);background:#fff;font-size:13px;line-height:1.6;}
@media print{
  @page{size:letter portrait;margin:0;}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
  .no-print{display:none!important;}
  .page{width:8.5in;min-height:11in;max-height:11in;overflow:hidden;page-break-after:always;page-break-inside:avoid;}
  .page:last-child{page-break-after:avoid;}
  .portada{min-height:11in!important;max-height:11in!important;padding:40px 48px!important;}
  .contenido{padding:32px 48px!important;max-width:100%!important;}
  .section-header{margin-bottom:14px!important;}
  .equiv-grid{gap:10px!important;margin-bottom:18px!important;}
  .equiv-card{padding:14px 12px!important;}
  .tabla-wrapper{margin-bottom:18px!important;}
  .nota-box{margin-bottom:16px!important;}
  .chart-full{margin-bottom:18px!important;padding:12px!important;}
  .charts-grid{gap:12px!important;margin-bottom:18px!important;}
  .chart-card{padding:12px!important;}
  .metodo-grid{gap:10px!important;}
  .portada-kpi{padding:18px 24px!important;margin-bottom:20px!important;}
  .kpi-value{font-size:26px!important;}
  .portada-titulo{font-size:36px!important;}
  .portada-body{padding:24px 0 16px!important;}
}
.portada{background:linear-gradient(160deg,#1A5C38 0%,#2E7D52 60%,#3A9E6A 100%);min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:60px 64px;position:relative;overflow:hidden;}
.portada::before{content:'';position:absolute;top:-120px;right:-120px;width:500px;height:500px;border-radius:50%;background:rgba(141,198,63,0.08);pointer-events:none;}
.portada-header{display:flex;justify-content:space-between;align-items:flex-start;}
.portada-badge{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:10px 18px;text-align:right;}
.portada-badge .label{font-size:10px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:.1em;}
.portada-badge .value{font-size:12px;color:#8DC63F;font-weight:600;margin-top:2px;}
.portada-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:48px 0 32px;}
.portada-tag{display:inline-flex;align-items:center;background:rgba(141,198,63,0.2);border:1px solid rgba(141,198,63,0.4);border-radius:20px;padding:6px 16px;margin-bottom:20px;width:fit-content;}
.portada-tag span{font-size:11px;color:#8DC63F;font-weight:600;text-transform:uppercase;letter-spacing:.08em;}
.portada-titulo{font-family:'Playfair Display',serif;font-size:46px;font-weight:700;color:#fff;line-height:1.1;margin-bottom:10px;}
.portada-subtitulo{font-size:16px;color:rgba(255,255,255,0.7);font-weight:300;margin-bottom:28px;}
.portada-divider{width:56px;height:3px;background:#8DC63F;border-radius:2px;margin-bottom:28px;}
.portada-kpi{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:24px 32px;margin-bottom:28px;display:grid;gap:0;}
.portada-kpi-3{grid-template-columns:repeat(3,1fr);}
.portada-kpi-4{grid-template-columns:repeat(4,1fr);}
.kpi-item{padding:0 24px;border-right:1px solid rgba(255,255,255,0.12);}
.kpi-item:first-child{padding-left:0;}
.kpi-item:last-child{border-right:none;}
.kpi-label{font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;font-weight:500;}
.kpi-value{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#8DC63F;line-height:1;margin-bottom:3px;}
.kpi-unit{font-size:11px;color:rgba(255,255,255,0.45);}
.portada-info{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:580px;}
.portada-info-item .label{font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.1em;margin-bottom:3px;}
.portada-info-item .value{font-size:13px;color:#fff;font-weight:500;}
.portada-footer{display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(255,255,255,0.15);padding-top:20px;}
.portada-footer .metodologia{font-size:10px;color:rgba(255,255,255,0.4);max-width:400px;line-height:1.5;}
.portada-footer .num-pag{font-size:11px;color:rgba(255,255,255,0.25);}
.contenido{max-width:860px;margin:0 auto;padding:48px 64px;}
.section-header{display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #E8F5EE;}
.section-icon{width:34px;height:34px;background:#1A5C38;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.section-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#1A5C38;}
.section-subtitle{font-size:11px;color:#6B8F74;margin-top:2px;}
.equiv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:32px;}
.equiv-card{background:#E8F5EE;border:1px solid #D4E6DB;border-radius:12px;padding:20px 16px;text-align:center;}
.equiv-icon{font-size:28px;margin-bottom:8px;}
.equiv-value{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#1A5C38;line-height:1;margin-bottom:4px;}
.equiv-label{font-size:12px;color:#2E7D52;font-weight:500;margin-bottom:3px;}
.equiv-fuente{font-size:9px;color:#8FAF97;font-style:italic;}
.tabla-wrapper{border:1px solid #D4E6DB;border-radius:12px;overflow:hidden;margin-bottom:32px;}
table{width:100%;border-collapse:collapse;font-size:12px;}
thead th{background:#1A5C38;color:#fff;padding:10px 14px;text-align:left;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
tbody tr{border-bottom:1px solid #D4E6DB;}
tbody tr:last-child{border-bottom:none;}
tbody tr:nth-child(even){background:#F4F7F5;}
tbody td{padding:10px 14px;}
tfoot td{padding:10px 14px;font-weight:600;background:#E8F5EE;border-top:2px solid #D4E6DB;font-size:12px;}
.rank-num{display:inline-flex;width:22px;height:22px;border-radius:50%;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin-right:8px;background:#1A5C38;color:#fff;}
.rank-1 .rank-num{background:#C9A227;}
.rank-2 .rank-num{background:#8A9BA8;}
.rank-3 .rank-num{background:#A0785A;}
.charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px;}
.chart-card{background:#fff;border:1px solid #D4E6DB;border-radius:12px;padding:18px;}
.chart-full{background:#fff;border:1px solid #D4E6DB;border-radius:12px;padding:18px;margin-bottom:32px;}
.chart-title{font-size:11px;font-weight:600;color:#1A5C38;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em;}
.chart-sub{font-size:10px;color:#8FAF97;margin-bottom:14px;}
.metodo-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:32px;}
.metodo-item{background:#F4F7F5;border-left:3px solid #8DC63F;border-radius:0 8px 8px 0;padding:14px;}
.metodo-titulo{font-size:11px;font-weight:600;color:#1A5C38;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;}
.metodo-texto{font-size:11px;color:#4A6B54;line-height:1.55;}
.metodo-url{font-size:10px;color:#8FAF97;margin-top:3px;font-style:italic;}
.nota-box{background:#FFF8F0;border:1px solid #F0CCA8;border-radius:8px;padding:14px 18px;margin-bottom:32px;display:flex;gap:10px;align-items:flex-start;}
.nota-icon{font-size:16px;flex-shrink:0;margin-top:2px;}
.nota-titulo{font-size:11px;font-weight:600;color:#A05A20;margin-bottom:3px;text-transform:uppercase;letter-spacing:.05em;}
.nota-texto{font-size:11px;color:#7A4A10;line-height:1.5;}
.footer{background:#1A5C38;padding:24px 64px;display:flex;justify-content:space-between;align-items:center;}
.footer-texto{font-size:10px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;}
.footer-texto strong{color:rgba(255,255,255,0.6);font-weight:500;}
.print-bar{position:fixed;bottom:24px;right:24px;display:flex;gap:10px;z-index:100;}
.btn-print{display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:10px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;background:#1A5C38;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.15);}
.btn-print:hover{background:#2E7D52;}
</style>
</head>
<body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Imprimir / Guardar PDF
  </button>
</div>
<div class="portada page">
  <div class="portada-header">
    <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fff;">
      Elefantes Verdes
      <div style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:300;color:rgba(255,255,255,0.6);margin-top:2px;">Estrategias Ambientales</div>
    </div>
    <div class="portada-badge">
      <div class="label">Metodología verificada</div>
      <div class="value">EPA WARM v16 · CFE/INECC · IPCC</div>
    </div>
  </div>
  <div class="portada-body">
    <div class="portada-tag">
      <span>Reporte ${tipo === 'locatario' ? 'Anual · Locatario' : 'Anual · Plaza Comercial'} de Impacto Ambiental</span>
    </div>
    <div class="portada-titulo">Reporte de<br>CO₂ Evitado<br>por Reciclaje</div>
    <div class="portada-subtitulo">${periodo}</div>
    <div class="portada-divider"></div>
    <div class="portada-kpi ${tipo === 'locatario' ? 'portada-kpi-3' : 'portada-kpi-4'}">
      <div class="kpi-item">
        <div class="kpi-label">CO₂ total evitado</div>
        <div class="kpi-value">${totalCO2.toLocaleString('es-MX')}</div>
        <div class="kpi-unit">kg CO₂ equivalente</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-label">Total reciclado</div>
        <div class="kpi-value">${resumen.total_kilos.toLocaleString('es-MX')}</div>
        <div class="kpi-unit">kilogramos</div>
      </div>
      ${tipo === 'plaza' ? `
      <div class="kpi-item">
        <div class="kpi-label">Locatarios activos</div>
        <div class="kpi-value">${resumen.total_locatarios}</div>
        <div class="kpi-unit">negocios participantes</div>
      </div>` : ''}
      <div class="kpi-item">
        <div class="kpi-label">Recolecciones</div>
        <div class="kpi-value">${resumen.total_recolecciones.toLocaleString('es-MX')}</div>
        <div class="kpi-unit">eventos registrados</div>
      </div>
    </div>
    <div class="portada-info">
      <div class="portada-info-item">
        <div class="label">${tipo === 'locatario' ? 'Locatario' : 'Plaza'}</div>
        <div class="value">${titulo}</div>
      </div>
      <div class="portada-info-item">
        <div class="label">${tipo === 'locatario' ? 'Plaza' : 'Ciudad'}</div>
        <div class="value">${tipo === 'locatario' ? data.locatario.plaza : data.plaza.ciudad}</div>
      </div>
      <div class="portada-info-item">
        <div class="label">${tipo === 'locatario' ? 'Giro' : 'Estado'}</div>
        <div class="value">${tipo === 'locatario' ? data.locatario.giro : data.plaza.estado}</div>
      </div>
    </div>
  </div>
  <div class="portada-footer">
    <div class="metodologia">Factores EPA WARM v16 (dic. 2023) · EPA GHG Equivalencies Calculator · CFE/INECC FESEN 2023 · IPCC 2006 Guidelines. Elaborado por Elefantes Verdes — Estrategias Ambientales · Quintana Roo, México.</div>
    <div class="num-pag">1</div>
  </div>
</div>
<div class="contenido page">
  <div class="section-header">
    <div class="section-icon">🌍</div>
    <div>
      <div class="section-title">Equivalencias Ambientales</div>
      <div class="section-subtitle">Traducción del CO₂ evitado a referencias cotidianas verificables</div>
    </div>
  </div>
  <div class="equiv-grid">
    <div class="equiv-card">
      <div class="equiv-icon">🌳</div>
      <div class="equiv-value">${eq.arboles.toLocaleString('es-MX')}</div>
      <div class="equiv-label">Árboles plantados</div>
      <div class="equiv-fuente">trabajando 1 año · EPA: 21.77 kg CO₂/árbol/año</div>
    </div>
    <div class="equiv-card">
      <div class="equiv-icon">⚡</div>
      <div class="equiv-value">${eq.kwh.toLocaleString('es-MX')}</div>
      <div class="equiv-label">kWh de energía ahorrada</div>
      <div class="equiv-fuente">CFE/INECC FESEN 2023: 0.454 kg CO₂/kWh</div>
    </div>
    <div class="equiv-card">
      <div class="equiv-icon">🚗</div>
      <div class="equiv-value">${eq.km_auto.toLocaleString('es-MX')}</div>
      <div class="equiv-label">Km en auto evitados</div>
      <div class="equiv-fuente">IPCC 2006 / INECC: 0.192 kg CO₂/km</div>
    </div>
  </div>
  <div class="section-header">
    <div class="section-icon">♻️</div>
    <div>
      <div class="section-title">Desglose por Material</div>
      <div class="section-subtitle">${data.periodo.anio} · Factores EPA WARM v16</div>
    </div>
  </div>
  <div class="tabla-wrapper">
    <table>
      <thead><tr>
        <th>Material</th>
        <th style="text-align:right;">Factor CO₂ (kg/kg)</th>
        <th style="text-align:right;">Total kg</th>
        <th style="text-align:right;">CO₂ evitado (kg)</th>
        <th style="text-align:right;">% del total</th>
        <th>Estado</th>
      </tr></thead>
      <tbody>${filasMat}${filaInorg}</tbody>
      <tfoot>
        <tr>
          <td colspan="2">Total</td>
          <td style="text-align:right;">${resumen.total_kilos.toLocaleString('es-MX')} kg</td>
          <td style="text-align:right;">${totalCO2.toLocaleString('es-MX')} kg CO₂eq</td>
          <td style="text-align:right;">100%</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  </div>
  <div class="nota-box">
    <div class="nota-icon">ℹ️</div>
    <div>
      <div class="nota-titulo">Nota sobre residuo inorgánico</div>
      <div class="nota-texto">El residuo inorgánico es gestionado en sitio de disposición final autorizado conforme a la normativa SEMARNAT/LGPGIR. No se le atribuye CO₂ evitado al no pasar por proceso de reciclaje o compostaje.</div>
    </div>
  </div>
</div>
${rankingHTML}
<div class="contenido page">
  <div class="section-header">
    <div class="section-icon">📈</div>
    <div>
      <div class="section-title">Tendencia Mensual de CO₂ Evitado</div>
      <div class="section-subtitle">kg CO₂eq — ${data.periodo.anio}</div>
    </div>
  </div>
  <div class="chart-full">
    <div style="position:relative;height:200px;"><canvas id="chartTendencia"></canvas></div>
  </div>
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-title">Distribución por material</div>
      <div class="chart-sub">% de CO₂ evitado total</div>
      <div style="position:relative;height:185px;"><canvas id="chartDonut"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-title">kg reciclados por material</div>
      <div class="chart-sub">Total acumulado ${data.periodo.anio}</div>
      <div style="position:relative;height:185px;"><canvas id="chartBarras"></canvas></div>
    </div>
  </div>
  <div class="section-header">
    <div class="section-icon">📋</div>
    <div>
      <div class="section-title">Metodología y Fuentes</div>
      <div class="section-subtitle">Todos los factores provienen de fuentes oficiales verificables</div>
    </div>
  </div>
  <div class="metodo-grid">
    <div class="metodo-item">
      <div class="metodo-titulo">Factores de emisión evitada</div>
      <div class="metodo-texto">EPA Waste Reduction Model (WARM) v16, diciembre 2023. Factores netos de CO₂eq evitado al reciclar 1 kg vs. enviarlo a relleno sanitario. Metodología ciclo de vida completo (ISO 14040).</div>
      <div class="metodo-url">epa.gov/waste-reduction-model</div>
    </div>
    <div class="metodo-item">
      <div class="metodo-titulo">Factor eléctrico (kWh)</div>
      <div class="metodo-texto">FESEN 2023: 0.454 kg CO₂/kWh. Publicado por CFE/SEMARNAT/INECC. Referencia oficial para cálculos de huella de carbono en México.</div>
      <div class="metodo-url">gob.mx/inecc · gob.mx/semarnat</div>
    </div>
    <div class="metodo-item">
      <div class="metodo-titulo">Equivalencia de árboles</div>
      <div class="metodo-texto">EPA GHG Equivalencies Calculator: 21.77 kg CO₂/árbol/año. Factor de secuestro de carbono para árbol adulto en bosques templados de América del Norte.</div>
      <div class="metodo-url">epa.gov/energy/greenhouse-gas-equivalencies-calculator</div>
    </div>
    <div class="metodo-item">
      <div class="metodo-titulo">Equivalencia km en auto</div>
      <div class="metodo-texto">IPCC 2006 Guidelines / INECC: 0.192 kg CO₂/km para vehículo particular promedio en México. Categoría fuentes móviles terrestres del INEGYCEI.</div>
      <div class="metodo-url">ipcc-nggip.iges.or.jp · gob.mx/inecc</div>
    </div>
  </div>
</div>
<div class="footer no-print">
  <div style="font-family:'Playfair Display',serif;font-size:20px;color:#fff;opacity:.8;">Elefantes Verdes</div>
  <div class="footer-texto">
    <strong>Elefantes Verdes — Estrategias Ambientales</strong><br>
    Quintana Roo, México · elefantesverdes.com.mx<br>
    Generado con Acrux-Bio · Sistema de Trazabilidad de Residuos
  </div>
  <div style="font-size:10px;color:rgba(255,255,255,0.25);">${data.periodo.anio}</div>
</div>
<script>
const meses=${JSON.stringify(meses)};
const co2Mes=${JSON.stringify(co2Mes)};
const matLabels=${JSON.stringify(matLabels)};
const matData=${JSON.stringify(matData)};
const matColors=${JSON.stringify(matColors)};
const matKilos=${JSON.stringify(matKilos)};
new Chart(document.getElementById('chartTendencia'),{type:'bar',data:{labels:meses,datasets:[{label:'CO₂ evitado',data:co2Mes,backgroundColor:'rgba(26,92,56,0.75)',borderColor:'#1A5C38',borderWidth:1,borderRadius:5},{label:'Tendencia',data:co2Mes,type:'line',borderColor:'#8DC63F',borderWidth:2,pointBackgroundColor:'#8DC63F',pointRadius:3,tension:0.4,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.raw.toLocaleString('es-MX')+' kg CO₂'}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{ticks:{font:{size:10},callback:v=>(v/1000).toFixed(0)+'k'},grid:{color:'rgba(0,0,0,0.05)'}}}}});
new Chart(document.getElementById('chartDonut'),{type:'doughnut',data:{labels:matLabels,datasets:[{data:matData,backgroundColor:matColors,borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:true,position:'right',labels:{font:{size:10},boxWidth:10,padding:6}},tooltip:{callbacks:{label:ctx=>' '+ctx.raw.toLocaleString('es-MX')+' kg'}}}}});
new Chart(document.getElementById('chartBarras'),{type:'bar',data:{labels:matLabels,datasets:[{data:matKilos,backgroundColor:matColors,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+ctx.raw.toLocaleString('es-MX')+' kg'}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{ticks:{font:{size:10},callback:v=>v>=1000?(v/1000).toFixed(0)+'k':v},grid:{color:'rgba(0,0,0,0.05)'}}}}});
</script>
</body></html>`;

  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
}
