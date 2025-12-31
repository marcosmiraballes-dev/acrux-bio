interface DirectorHTMLData {
  stats: {
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  };
  statsByTipo: Array<{
    tipo_residuo_nombre: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  tendencia: Array<{
    mes: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  comparativaPlazas: Array<{
    plaza_nombre: string;
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  }>;
  topLocales: Array<{
    local_nombre: string;
    plaza_nombre: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  comparativaMensual?: any;
  comparativaAnual?: any;
  comparativaTrimestral?: any;
  plazaSeleccionada?: string;
  userName?: string;
}

// Mapeo de emojis
const EMOJI_MAP: { [key: string]: string } = {
  'Orgánico': '🍌',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🍾',
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '🧃',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

export const generateDirectorHTML = (data: DirectorHTMLData) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calcular árboles equivalentes
  const co2Toneladas = data.stats.co2_evitado / 1000;
  const arbolesEquivalentes = Math.round(co2Toneladas * 45);

  // Ordenar materiales por kilos
  const materialesOrdenados = [...data.statsByTipo]
    .sort((a, b) => b.total_kilos - a.total_kilos)
    .slice(0, 9); // Top 9 para el grid

  // Calcular porcentajes
  const totalKilos = data.stats.total_kilos;
  const materialesConPorcentaje = materialesOrdenados.map(m => ({
    ...m,
    porcentaje: ((m.total_kilos / totalKilos) * 100).toFixed(1)
  }));

  // Ordenar plazas por kilos
  const plazasOrdenadas = [...data.comparativaPlazas]
    .sort((a, b) => b.total_kilos - a.total_kilos);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Ejecutivo - Elefantes Verdes</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      background: white;
      color: #1f2937;
    }

    /* Estilos para impresión */
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }

      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .page-break {
        page-break-before: always;
      }

      .no-break {
        page-break-inside: avoid;
      }
    }

    /* PORTADA */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
    }

    .cover-header {
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      color: white;
      padding: 40px 60px;
      border-radius: 15px;
      margin-bottom: 50px;
      box-shadow: 0 10px 30px rgba(4, 120, 87, 0.3);
    }

    .cover-header h1 {
      font-size: 42px;
      margin-bottom: 15px;
      font-weight: bold;
    }

    .cover-header p {
      font-size: 20px;
      opacity: 0.95;
    }

    .logo-container {
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 50%;
      margin: 40px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }

    .cover-info {
      color: #6b7280;
      margin-top: 60px;
      font-size: 16px;
    }

    .cover-info p {
      margin: 12px 0;
    }

    .cover-info strong {
      color: #047857;
    }

    .cover-footer {
      margin-top: 80px;
      padding-top: 20px;
      border-top: 2px solid #047857;
      color: #6b7280;
      font-size: 14px;
    }

    /* PÁGINAS DE CONTENIDO */
    .content-page {
      padding: 20px 0;
    }

    .page-title {
      color: #047857;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 25px;
      padding-bottom: 12px;
      border-bottom: 3px solid #047857;
    }

    .section-title {
      color: #059669;
      font-size: 20px;
      font-weight: bold;
      margin: 30px 0 15px;
    }

    /* KPIs */
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .kpi-card {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #047857;
    }

    .kpi-card.blue {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #3b82f6;
    }

    .kpi-card.purple {
      background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
      border-color: #8b5cf6;
    }

    .kpi-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: bold;
      color: #047857;
      line-height: 1.2;
    }

    .kpi-card.blue .kpi-value {
      color: #3b82f6;
    }

    .kpi-card.purple .kpi-value {
      color: #8b5cf6;
    }

    .kpi-unit {
      font-size: 12px;
      color: #6b7280;
      margin-top: 5px;
    }

    /* GRID DE MATERIALES */
    .materials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
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

    .material-name {
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

    .material-bar {
      width: 100%;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      margin-top: 12px;
      overflow: hidden;
    }

    .material-bar-fill {
      height: 100%;
      background: var(--color);
      border-radius: 3px;
    }

    /* TENDENCIA Y PLAZAS */
    .ranking-list {
      background: #f9fafb;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .ranking-item.first {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-color: #047857;
    }

    .ranking-number {
      font-size: 16px;
      font-weight: bold;
      color: #9ca3af;
      margin-right: 12px;
      min-width: 30px;
    }

    .ranking-item.first .ranking-number {
      color: #047857;
    }

    .ranking-name {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    .ranking-bar-container {
      flex: 1;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      margin: 0 15px;
      overflow: hidden;
    }

    .ranking-bar {
      height: 100%;
      background: #9ca3af;
      border-radius: 4px;
    }

    .ranking-item.first .ranking-bar {
      background: #047857;
    }

    .ranking-value {
      font-size: 14px;
      font-weight: bold;
      color: #047857;
      min-width: 100px;
      text-align: right;
    }

    /* TABLA TOP LOCALES */
    .table-container {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
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
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 12px;
      font-size: 13px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }

    tr.top-3 {
      background: #fef3c7;
    }

    .medal {
      font-size: 18px;
      margin-right: 5px;
    }

    /* COMPARATIVAS */
    .comparativas-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .comparativa-card {
      padding: 20px;
      border-radius: 12px;
      border: 2px solid;
    }

    .comparativa-card.mensual {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #3b82f6;
    }

    .comparativa-card.anual {
      background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
      border-color: #8b5cf6;
    }

    .comparativa-card.trimestral {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-color: #f59e0b;
    }

    .comparativa-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #1f2937;
    }

    .comparativa-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .comparativa-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .comparativa-value {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
    }

    .variacion {
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
    }

    .variacion.positiva {
      color: #10b981;
    }

    .variacion.negativa {
      color: #ef4444;
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

  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-header">
      <h1>Dashboard Ejecutivo</h1>
      <p>Elefantes Verdes - ${data.plazaSeleccionada || 'Todas las Plazas'}</p>
    </div>

    <div class="logo-container">
    <img src="/logo-blanco.png" alt="Elefantes Verdes" style="width: 100px; height: 100px; object-fit: contain;" />
    </div>

    <div class="cover-info">
      <p><strong>Fecha de generación:</strong> ${fechaGeneracion}</p>
      ${data.userName ? `<p><strong>Generado por:</strong> ${data.userName}</p>` : ''}
    </div>

    <div class="cover-footer">
      <p>Elefantes Verdes - Estrategias Ambientales</p>
      <p>Sistema de Trazabilidad de Residuos</p>
    </div>
  </div>

  <!-- PÁGINA 1: RESUMEN GENERAL -->
  <div class="content-page page-break">
    <h1 class="page-title">📊 RESUMEN GENERAL</h1>

    <!-- KPIs Principales -->
    <div class="kpis-grid no-break">
      <div class="kpi-card">
        <div class="kpi-label">Total Recolecciones</div>
        <div class="kpi-value">${data.stats.total_recolecciones.toLocaleString('es-MX')}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Total Kilos</div>
        <div class="kpi-value">${data.stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
        <div class="kpi-unit">kg</div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-label">CO2 Evitado</div>
        <div class="kpi-value">${co2Toneladas.toFixed(2)}</div>
        <div class="kpi-unit">toneladas</div>
      </div>
    </div>

    <!-- Grid de Materiales -->
    <h2 class="section-title">♻️ Materiales Recolectados</h2>
    <div class="materials-grid no-break">
      ${materialesConPorcentaje.map((material, index) => {
        const colors = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
        const color = colors[index % colors.length];
        const emoji = EMOJI_MAP[material.tipo_residuo_nombre] || '♻️';
        const maxPorcentaje = parseFloat(materialesConPorcentaje[0].porcentaje);
        const barWidth = (parseFloat(material.porcentaje) / maxPorcentaje) * 100;
        
        return `
        <div class="material-card" style="--color: ${color};">
          <div class="material-icon">${emoji}</div>
          <div class="material-name">${material.tipo_residuo_nombre}</div>
          <div class="material-percentage">${material.porcentaje}%</div>
          <div class="material-kilos">${material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</div>
          <div class="material-bar">
            <div class="material-bar-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
        `;
      }).join('')}
    </div>

    <!-- Tendencia Mensual -->
    <h2 class="section-title">📈 Tendencia Mensual (Últimos 6 meses)</h2>
    <div class="ranking-list no-break">
      ${data.tendencia.slice(0, 6).map((mes, index) => {
        const maxKilos = Math.max(...data.tendencia.slice(0, 6).map(m => m.total_kilos));
        const porcentaje = (mes.total_kilos / maxKilos) * 100;
        
        return `
        <div class="ranking-item ${index === 0 ? 'first' : ''}">
          <span class="ranking-number">#${index + 1}</span>
          <span class="ranking-name">${mes.mes}</span>
          <div class="ranking-bar-container">
            <div class="ranking-bar" style="width: ${porcentaje}%;"></div>
          </div>
          <span class="ranking-value">${mes.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</span>
        </div>
        `;
      }).join('')}
    </div>

    <div class="page-footer">
      Página 1 de 3
    </div>
  </div>

  <!-- PÁGINA 2: PLAZAS Y TOP LOCALES -->
  <div class="content-page page-break">
    <h1 class="page-title">🏢 Por Plaza y Locales</h1>

    <!-- Por Plaza -->
    <h2 class="section-title">Comparativa por Plaza</h2>
    <div class="ranking-list no-break">
      ${plazasOrdenadas.map((plaza, index) => {
        const maxKilos = plazasOrdenadas[0].total_kilos;
        const porcentaje = (plaza.total_kilos / maxKilos) * 100;
        
        return `
        <div class="ranking-item ${index === 0 ? 'first' : ''}">
          <span class="ranking-number">#${index + 1}</span>
          <span class="ranking-name">${plaza.plaza_nombre}</span>
          <div class="ranking-bar-container">
            <div class="ranking-bar" style="width: ${porcentaje}%;"></div>
          </div>
          <span class="ranking-value">${plaza.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</span>
        </div>
        `;
      }).join('')}
    </div>

    <!-- Top 10 Locales -->
    <h2 class="section-title">🏆 Top 10 Locales Más Productivos</h2>
    <div class="table-container no-break">
      <table>
        <thead>
          <tr>
            <th>Posición</th>
            <th>Local</th>
            <th>Plaza</th>
            <th style="text-align: right;">Kilos</th>
            <th style="text-align: right;">CO2 (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${data.topLocales.slice(0, 10).map((local, index) => `
          <tr class="${index < 3 ? 'top-3' : ''}">
            <td>
              ${index === 0 ? '<span class="medal">🥇</span>' : ''}
              ${index === 1 ? '<span class="medal">🥈</span>' : ''}
              ${index === 2 ? '<span class="medal">🥉</span>' : ''}
              #${index + 1}
            </td>
            <td><strong>${local.local_nombre}</strong></td>
            <td>${local.plaza_nombre}</td>
            <td style="text-align: right;"><strong>${local.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</strong></td>
            <td style="text-align: right;">${local.co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 1 })}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="page-footer">
      Página 2 de 3
    </div>
  </div>

  <!-- PÁGINA 3: COMPARATIVAS -->
  <div class="content-page page-break">
    <h1 class="page-title">📈 Comparativas Temporales</h1>

    ${data.comparativaMensual || data.comparativaAnual || data.comparativaTrimestral ? `
    <div class="comparativas-grid no-break">
      ${data.comparativaMensual ? `
      <div class="comparativa-card mensual">
        <div class="comparativa-title">MENSUAL</div>
        <div class="comparativa-row">
          <span class="comparativa-label">Mes Actual</span>
          <span class="comparativa-value">${(data.comparativaMensual.mes_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div class="comparativa-row">
          <span class="comparativa-label">Mes Anterior</span>
          <span class="comparativa-value">${(data.comparativaMensual.mes_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div class="variacion ${(data.comparativaMensual.variacion_kilos || 0) >= 0 ? 'positiva' : 'negativa'}">
          ${(data.comparativaMensual.variacion_kilos || 0) >= 0 ? '↑' : '↓'} ${Math.abs(data.comparativaMensual.variacion_kilos || 0).toFixed(1)}%
        </div>
      </div>
      ` : ''}

      ${data.comparativaAnual ? `
      <div class="comparativa-card anual">
        <div class="comparativa-title">ANUAL</div>
        <div class="comparativa-row">
          <span class="comparativa-label">Año Actual</span>
          <span class="comparativa-value">${(data.comparativaAnual.anio_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div class="comparativa-row">
          <span class="comparativa-label">Año Anterior</span>
          <span class="comparativa-value">${(data.comparativaAnual.anio_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div class="variacion ${(data.comparativaAnual.variacion_kilos || 0) >= 0 ? 'positiva' : 'negativa'}">
          ${(data.comparativaAnual.variacion_kilos || 0) >= 0 ? '↑' : '↓'} ${Math.abs(data.comparativaAnual.variacion_kilos || 0).toFixed(1)}%
        </div>
      </div>
      ` : ''}

      ${data.comparativaTrimestral ? `
      <div class="comparativa-card trimestral">
        <div class="comparativa-title">TRIMESTRAL</div>
        <div class="comparativa-row">
          <span class="comparativa-label">Trimestre Actual</span>
          <span class="comparativa-value">${(data.comparativaTrimestral.trimestre_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div class="comparativa-row">
          <span class="comparativa-label">Trimestre Anterior</span>
          <span class="comparativa-value">${(data.comparativaTrimestral.trimestre_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
        </div>
        <div class="variacion ${(data.comparativaTrimestral.variacion_kilos || 0) >= 0 ? 'positiva' : 'negativa'}">
          ${(data.comparativaTrimestral.variacion_kilos || 0) >= 0 ? '↑' : '↓'} ${Math.abs(data.comparativaTrimestral.variacion_kilos || 0).toFixed(1)}%
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Impacto Ambiental -->
    <h2 class="section-title">🌳 Impacto Ambiental</h2>
    <div class="kpis-grid no-break">
      <div class="kpi-card">
        <div class="kpi-label">Árboles Equivalentes</div>
        <div class="kpi-value">${arbolesEquivalentes.toLocaleString('es-MX')}</div>
        <div class="kpi-unit">árboles plantados</div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-label">Kilómetros de Auto</div>
        <div class="kpi-value">${(co2Toneladas * 4500).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
        <div class="kpi-unit">km evitados</div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-label">Promedio por Recolección</div>
        <div class="kpi-value">${(data.stats.total_kilos / data.stats.total_recolecciones).toFixed(1)}</div>
        <div class="kpi-unit">kg / recolección</div>
      </div>
    </div>

    <div class="page-footer">
      Página 3 de 3
    </div>
  </div>

  <script>
    // Auto-abrir diálogo de impresión
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>

</body>
</html>
  `;

  // Abrir en nueva ventana
  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  } else {
    alert('Por favor permite ventanas emergentes para generar el reporte');
  }
};