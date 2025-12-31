interface GraficaPorLugarHTMLData {
  periodo1: {
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  };
  periodo2: {
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  };
  variacion: {
    recolecciones: number;
    kilos: number;
    co2: number;
  };
  materialesComparados: Array<{
    nombre: string;
    periodo1_kilos: number;
    periodo2_kilos: number;
    variacion: number;
  }>;
  nombrePlaza: string;
  nombreLocal?: string;
  periodo1Desde: string;
  periodo1Hasta: string;
  periodo2Desde: string;
  periodo2Hasta: string;
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

export const generateGraficaPorLugarHTML = (data: GraficaPorLugarHTMLData) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const lugarTexto = data.nombreLocal 
    ? `${data.nombrePlaza} - ${data.nombreLocal}`
    : data.nombrePlaza;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparación por Lugar - Elefantes Verdes</title>
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
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }

    .logo-container img {
      width: 100px;
      height: 100px;
      object-fit: contain;
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

    /* PERIODOS GRID */
    .periodos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .periodo-card {
      padding: 25px;
      border-radius: 12px;
      border: 3px solid;
    }

    .periodo-card.azul {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #3b82f6;
    }

    .periodo-card.morado {
      background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
      border-color: #8b5cf6;
    }

    .periodo-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #1f2937;
    }

    .periodo-dates {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .periodo-lugar {
      font-size: 11px;
      font-weight: 600;
      padding-top: 8px;
      border-top: 2px solid rgba(0,0,0,0.1);
      margin-bottom: 15px;
    }

    .periodo-card.azul .periodo-title,
    .periodo-card.azul .periodo-lugar {
      color: #1e40af;
    }

    .periodo-card.morado .periodo-title,
    .periodo-card.morado .periodo-lugar {
      color: #6b21a8;
    }

    .periodo-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 20px;
      font-weight: bold;
    }

    .periodo-card.azul .stat-value {
      color: #1e40af;
    }

    .periodo-card.morado .stat-value {
      color: #6b21a8;
    }

    .stat-unit {
      font-size: 10px;
      color: #6b7280;
      margin-left: 4px;
    }

    /* VARIACIONES */
    .variaciones-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .variacion-card {
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid;
    }

    .variacion-card.positiva {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-color: #10b981;
    }

    .variacion-card.negativa {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-color: #ef4444;
    }

    .variacion-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .variacion-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .variacion-card.positiva .variacion-value {
      color: #10b981;
    }

    .variacion-card.negativa .variacion-value {
      color: #ef4444;
    }

    .variacion-diff {
      font-size: 11px;
      color: #6b7280;
    }

    /* BARRAS COMPARATIVAS */
    .barras-comparativas {
      background: #f9fafb;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .barra-item {
      margin-bottom: 20px;
    }

    .barra-item:last-child {
      margin-bottom: 0;
    }

    .barra-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .barra-label {
      font-size: 12px;
      font-weight: 600;
    }

    .barra-label.azul {
      color: #1e40af;
    }

    .barra-label.morado {
      color: #6b21a8;
    }

    .barra-value {
      font-size: 14px;
      font-weight: bold;
    }

    .barra-container {
      width: 100%;
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .barra-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.3s ease;
    }

    .barra-fill.azul {
      background: #3b82f6;
    }

    .barra-fill.morado {
      background: #8b5cf6;
    }

    /* TABLA MATERIALES */
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

    th.text-right {
      text-align: right;
    }

    th.bg-blue {
      background: #dbeafe;
      color: #1e40af;
    }

    th.bg-purple {
      background: #e9d5ff;
      color: #6b21a8;
    }

    td {
      padding: 12px;
      font-size: 12px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }

    td.text-right {
      text-align: right;
      font-weight: 600;
    }

    .material-name {
      display: flex;
      align-items: center;
    }

    .material-emoji {
      font-size: 20px;
      margin-right: 8px;
    }

    .variacion-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 11px;
      white-space: nowrap;
    }

    .variacion-badge.positiva {
      background: #d1fae5;
      color: #10b981;
    }

    .variacion-badge.negativa {
      background: #fee2e2;
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
      <h1>Comparación por Lugar</h1>
      <p>Elefantes Verdes - ${lugarTexto}</p>
    </div>

    <div class="logo-container">
      <img src="/logo-blanco.png" alt="Elefantes Verdes" />
    </div>

    <div class="cover-info">
      <p><strong>Fecha de generación:</strong> ${fechaGeneracion}</p>
      ${data.userName ? `<p><strong>Generado por:</strong> ${data.userName}</p>` : ''}
      <p style="margin-top: 20px;"><strong>Periodo 1:</strong> ${data.periodo1Desde} - ${data.periodo1Hasta}</p>
      <p><strong>Periodo 2:</strong> ${data.periodo2Desde} - ${data.periodo2Hasta}</p>
    </div>

    <div class="cover-footer">
      <p>Elefantes Verdes - Estrategias Ambientales</p>
      <p>Sistema de Trazabilidad de Residuos</p>
    </div>
  </div>

  <!-- PÁGINA 1: COMPARACIÓN DE PERIODOS -->
  <div class="content-page page-break">
    <h1 class="page-title">📊 COMPARACIÓN DE PERIODOS</h1>

    <!-- Cards de Periodos -->
    <div class="periodos-grid no-break">
      
      <!-- Periodo 1 -->
      <div class="periodo-card azul">
        <div class="periodo-title">PERIODO 1</div>
        <div class="periodo-dates">${data.periodo1Desde} - ${data.periodo1Hasta}</div>
        <div class="periodo-lugar">${lugarTexto}</div>
        
        <div class="periodo-stats">
          <div class="stat-row">
            <span class="stat-label">Recolecciones</span>
            <span class="stat-value">${data.periodo1.total_recolecciones.toLocaleString('es-MX')}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Kilos</span>
            <span class="stat-value">${data.periodo1.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}<span class="stat-unit">kg</span></span>
          </div>
          <div class="stat-row">
            <span class="stat-label">CO2 Evitado</span>
            <span class="stat-value">${(data.periodo1.co2_evitado / 1000).toFixed(2)}<span class="stat-unit">Ton</span></span>
          </div>
        </div>
      </div>

      <!-- Periodo 2 -->
      <div class="periodo-card morado">
        <div class="periodo-title">PERIODO 2</div>
        <div class="periodo-dates">${data.periodo2Desde} - ${data.periodo2Hasta}</div>
        <div class="periodo-lugar">${lugarTexto}</div>
        
        <div class="periodo-stats">
          <div class="stat-row">
            <span class="stat-label">Recolecciones</span>
            <span class="stat-value">${data.periodo2.total_recolecciones.toLocaleString('es-MX')}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Kilos</span>
            <span class="stat-value">${data.periodo2.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}<span class="stat-unit">kg</span></span>
          </div>
          <div class="stat-row">
            <span class="stat-label">CO2 Evitado</span>
            <span class="stat-value">${(data.periodo2.co2_evitado / 1000).toFixed(2)}<span class="stat-unit">Ton</span></span>
          </div>
        </div>
      </div>

    </div>

    <!-- Análisis Comparativo -->
    <h2 class="section-title">📈 Análisis Comparativo</h2>
    <div class="variaciones-grid no-break">
      
      <div class="variacion-card ${data.variacion.recolecciones >= 0 ? 'positiva' : 'negativa'}">
        <div class="variacion-label">Variación Recolecciones</div>
        <div class="variacion-value">
          ${data.variacion.recolecciones >= 0 ? '↑' : '↓'} ${Math.abs(data.variacion.recolecciones).toFixed(1)}%
        </div>
        <div class="variacion-diff">
          ${data.periodo2.total_recolecciones - data.periodo1.total_recolecciones >= 0 ? '+' : ''}${data.periodo2.total_recolecciones - data.periodo1.total_recolecciones} recolecciones
        </div>
      </div>

      <div class="variacion-card ${data.variacion.kilos >= 0 ? 'positiva' : 'negativa'}">
        <div class="variacion-label">Variación Kilos</div>
        <div class="variacion-value">
          ${data.variacion.kilos >= 0 ? '↑' : '↓'} ${Math.abs(data.variacion.kilos).toFixed(1)}%
        </div>
        <div class="variacion-diff">
          ${data.periodo2.total_kilos - data.periodo1.total_kilos >= 0 ? '+' : ''}${(data.periodo2.total_kilos - data.periodo1.total_kilos).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
        </div>
      </div>

      <div class="variacion-card ${data.variacion.co2 >= 0 ? 'positiva' : 'negativa'}">
        <div class="variacion-label">Variación CO2</div>
        <div class="variacion-value">
          ${data.variacion.co2 >= 0 ? '↑' : '↓'} ${Math.abs(data.variacion.co2).toFixed(1)}%
        </div>
        <div class="variacion-diff">
          ${data.periodo2.co2_evitado - data.periodo1.co2_evitado >= 0 ? '+' : ''}${((data.periodo2.co2_evitado - data.periodo1.co2_evitado) / 1000).toFixed(2)} Ton
        </div>
      </div>

    </div>

    <!-- Comparativa de Kilos -->
    <h2 class="section-title">⚖️ Comparativa de Kilos Totales</h2>
    <div class="barras-comparativas no-break">
      
      <div class="barra-item">
        <div class="barra-header">
          <span class="barra-label azul">Periodo 1</span>
          <span class="barra-value">${data.periodo1.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</span>
        </div>
        <div class="barra-container">
          <div class="barra-fill azul" style="width: ${(data.periodo1.total_kilos / Math.max(data.periodo1.total_kilos, data.periodo2.total_kilos)) * 100}%;"></div>
        </div>
      </div>

      <div class="barra-item">
        <div class="barra-header">
          <span class="barra-label morado">Periodo 2</span>
          <span class="barra-value">${data.periodo2.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</span>
        </div>
        <div class="barra-container">
          <div class="barra-fill morado" style="width: ${(data.periodo2.total_kilos / Math.max(data.periodo1.total_kilos, data.periodo2.total_kilos)) * 100}%;"></div>
        </div>
      </div>

    </div>

    <div class="page-footer">
      Página 1 de 2
    </div>
  </div>

  <!-- PÁGINA 2: TOP 5 MATERIALES -->
  <div class="content-page page-break">
    <h1 class="page-title">♻️ TOP 5 MATERIALES - COMPARATIVA</h1>

    <div class="table-container no-break">
      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th class="text-right bg-blue">Periodo 1 (kg)</th>
            <th class="text-right bg-purple">Periodo 2 (kg)</th>
            <th class="text-right">Variación</th>
          </tr>
        </thead>
        <tbody>
          ${data.materialesComparados.map(material => `
            <tr>
              <td>
                <div class="material-name">
                  <span class="material-emoji">${EMOJI_MAP[material.nombre] || '♻️'}</span>
                  <strong>${material.nombre}</strong>
                </div>
              </td>
              <td class="text-right" style="background: #eff6ff;">
                ${material.periodo1_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </td>
              <td class="text-right" style="background: #f3e8ff;">
                ${material.periodo2_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </td>
              <td class="text-right">
                <span class="variacion-badge ${material.variacion >= 0 ? 'positiva' : 'negativa'}">
                  ${material.variacion >= 0 ? '↑' : '↓'} ${Math.abs(material.variacion).toFixed(1)}%
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Comparativa por Material con barras -->
    <h2 class="section-title">📊 Comparativa Detallada por Material</h2>
    
    ${data.materialesComparados.map(material => {
      const maxKilos = Math.max(material.periodo1_kilos, material.periodo2_kilos);
      const emoji = EMOJI_MAP[material.nombre] || '♻️';
      
      return `
      <div class="no-break" style="margin-bottom: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 24px; margin-right: 10px;">${emoji}</span>
          <span style="font-weight: 600; font-size: 14px;">${material.nombre}</span>
        </div>
        
        <div class="barras-comparativas" style="margin-bottom: 0;">
          <div class="barra-item">
            <div class="barra-header">
              <span class="barra-label azul">Periodo 1</span>
              <span class="barra-value">${material.periodo1_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</span>
            </div>
            <div class="barra-container">
              <div class="barra-fill azul" style="width: ${(material.periodo1_kilos / maxKilos) * 100}%;"></div>
            </div>
          </div>

          <div class="barra-item">
            <div class="barra-header">
              <span class="barra-label morado">Periodo 2</span>
              <span class="barra-value">${material.periodo2_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</span>
            </div>
            <div class="barra-container">
              <div class="barra-fill morado" style="width: ${(material.periodo2_kilos / maxKilos) * 100}%;"></div>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('')}

    <div class="page-footer">
      Página 2 de 2
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>

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