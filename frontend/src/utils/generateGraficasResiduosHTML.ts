import { REPORT_STYLES, COLORS_CHART } from './reportTemplate/styles';
import { buildCoverPage } from './reportTemplate/buildCoverPage';
import { buildClosing } from './reportTemplate/buildClosing';

interface GraficasResiduosHTMLData {
  stats: {
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  };
  statsByTipo: Array<{
    tipo_residuo_nombre: string;
    tipo_residuo_icono: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  plazaSeleccionada?: string;
  userName?: string;
}

export const generateGraficasResiduosHTML = (data: GraficasResiduosHTMLData) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const co2Toneladas = data.stats.co2_evitado / 1000;
  const totalKilos = data.stats.total_kilos;

  // Ordenar y calcular porcentajes
  const materialesOrdenados = [...data.statsByTipo]
    .sort((a, b) => b.total_kilos - a.total_kilos);

  const materialesConPorcentaje = materialesOrdenados.map(m => ({
    ...m,
    porcentaje: ((m.total_kilos / totalKilos) * 100).toFixed(1)
  }));

  // Generar SVG del pie chart
  const generatePieChartSVG = () => {
    const cx = 200;
    const cy = 200;
    const radius = 150;
    let currentAngle = -90;
    const slices: string[] = [];

    materialesConPorcentaje.forEach((material, index) => {
      const porcentaje = parseFloat(material.porcentaje);
      const sliceAngle = (porcentaje / 100) * 360;
      const endAngle = currentAngle + sliceAngle;

      const startRad = (currentAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const color = COLORS_CHART[index % COLORS_CHART.length];

      const pathData = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArcFlag + ' 1 ' + x2 + ' ' + y2 + ' Z';

      slices.push('<path d="' + pathData + '" fill="' + color + '" stroke="white" stroke-width="2"/>');

      currentAngle = endAngle;
    });

    return '<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">' + slices.join('') + '</svg>';
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gráficas por Residuo - Elefantes Verdes</title>
  <style>
    ${REPORT_STYLES}

    /* Ajuste local: este reporte usa 15px de separación en la grilla de materiales */
    .materials-grid {
      gap: 15px;
    }

    /* PIE CHART Y TABLA */
    .pie-chart-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }

    .pie-chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* TABLA */
    .table-container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    @media print {
      .table-container {
        overflow: visible;
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f3f4f6;
    }

    th {
      padding: 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }

    th.text-right {
      text-align: right;
    }

    td {
      padding: 10px 12px;
      font-size: 12px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }

    td.text-right {
      text-align: right;
    }

    .color-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }

    .material-name {
      display: flex;
      align-items: center;
    }

    .material-emoji {
      font-size: 18px;
      margin-right: 8px;
    }

    .percentage-badge {
      background: #d1fae5;
      color: #047857;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 11px;
    }

    .material-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .material-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--color);
    }

    .material-icon {
      font-size: 42px;
      margin-bottom: 8px;
    }

    .material-card-name {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .material-percentage {
      font-size: 36px;
      font-weight: bold;
      color: var(--color);
      line-height: 1;
      margin-bottom: 8px;
    }

    .material-kilos {
      font-size: 14px;
      color: #6b7280;
      font-weight: 600;
    }

    /* LEYENDA PIE CHART */
    .legend {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      font-size: 11px;
      color: #374151;
    }

    .legend-color {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      margin-right: 6px;
    }

    /* FOOTER */
    .page-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 11px;
    }
  </style>
</head>
<body>

  ${buildCoverPage({
    titulo: 'Gráficas por Residuo',
    plaza: data.plazaSeleccionada,
    fecha: fechaGeneracion,
    userName: data.userName,
  })}

  <!-- PÁGINA 1: DISTRIBUCIÓN -->
  <div class="content-page page-break">
    <h1 class="page-title">📊 DISTRIBUCIÓN POR TIPO DE MATERIAL</h1>

    <div class="no-break">
      <div class="pie-chart-section">
        
        <!-- Pie Chart -->
        <div class="pie-chart-container">
          <div>
            ${generatePieChartSVG()}
            <div class="legend">
              ${materialesConPorcentaje.slice(0, 8).map((material, index) => 
                '<div class="legend-item"><div class="legend-color" style="background: ' + COLORS_CHART[index % COLORS_CHART.length] + ';"></div><span>' + material.tipo_residuo_nombre + ' (' + material.porcentaje + '%)</span></div>'
              ).join('')}
            </div>
          </div>
        </div>

        <!-- Tabla -->
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Material</th>
                <th class="text-right">Kilos</th>
                <th class="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              ${materialesConPorcentaje.map((material, index) => 
                '<tr><td><span class="color-indicator" style="background: ' + COLORS_CHART[index % COLORS_CHART.length] + ';"></span></td><td><div class="material-name"><span class="material-emoji">' + (material.tipo_residuo_icono || '♻️') + '</span><span><strong>' + material.tipo_residuo_nombre + '</strong></span></div></td><td class="text-right"><strong>' + material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + '</strong></td><td class="text-right"><span class="percentage-badge">' + material.porcentaje + '%</span></td></tr>'
              ).join('')}
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <div class="page-footer">
      Página <span class="page-number"></span> de <span class="page-total"></span>
    </div>
  </div>

  <!-- PÁGINA 2: IMPACTO Y DETALLE -->
  <div class="content-page page-break">
    <h1 class="page-title">🌍 IMPACTO AMBIENTAL Y DETALLE</h1>

    <!-- KPIs -->
    <div class="no-break">
      <div class="kpis-grid">
        <div class="kpi-card blue">
          <div class="kpi-label">CO2 Evitado Total</div>
          <div class="kpi-value">${co2Toneladas.toFixed(2)}</div>
          <div class="kpi-unit">toneladas</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Total Kilos</div>
          <div class="kpi-value">${data.stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
          <div class="kpi-unit">kilogramos</div>
        </div>

        <div class="kpi-card purple">
          <div class="kpi-label">Total Recolecciones</div>
          <div class="kpi-value">${data.stats.total_recolecciones.toLocaleString('es-MX')}</div>
          <div class="kpi-unit">visitas</div>
        </div>
      </div>
    </div>

    <!-- Grid de Materiales -->
    <div class="no-break">
      <h2 class="section-title">♻️ Detalle por Material (Top 11)</h2>
      <div class="materials-grid">
        ${materialesConPorcentaje.slice(0, 11).map((material, index) => {
          const color = COLORS_CHART[index % COLORS_CHART.length];
          const emoji = material.tipo_residuo_icono || '♻️';
          
          return '<div class="material-card" style="--color: ' + color + ';"><div class="material-icon">' + emoji + '</div><div class="material-card-name">' + material.tipo_residuo_nombre + '</div><div class="material-percentage">' + material.porcentaje + '%</div><div class="material-kilos">' + material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' kg</div></div>';
        }).join('')}
      </div>
    </div>

    <div class="page-footer">
      Página <span class="page-number"></span> de <span class="page-total"></span>
    </div>
  </div>

  ${buildClosing()}

</body>
</html>
  `;

  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  } else {
    alert('Por favor permite ventanas emergentes para generar el reporte');
  }
};