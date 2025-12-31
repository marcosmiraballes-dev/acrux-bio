interface CoordinadorData {
  stats: {
    total_recolecciones: number;
    total_kilos: number;
    total_co2_evitado: number;
  };
  statsByTipo: Array<{
    tipo_residuo: string;
    total_kilos: number;
    total_co2_evitado: number;
  }>;
  topLocales: Array<{
    local_nombre: string;
    plaza_nombre: string;
    total_kilos: number;
    total_co2_evitado: number;
  }>;
  recoleccionesRecientes: Array<{
    fecha_recoleccion: string;
    local_nombre: string;
    plaza_nombre: string;
    brigadista_nombre: string;
    total_kilos: number;
    total_co2_evitado: number;
  }>;
  plazaSeleccionada?: string;
  userName?: string;
}

export const generateCoordinadorHTML = (data: CoordinadorData) => {
  const timestamp = new Date().toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-');

  const arbolesEquivalentes = Math.round((data.stats.total_co2_evitado / 1000) * 45);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Coordinador - ${timestamp}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: white;
      color: #1f2937;
      line-height: 1.5;
    }
    
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm;
      background: white;
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

    .logo {
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
    
    /* CONTENIDO */
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 3px solid #047857;
    }
    
    .header h1 {
      font-size: 28px;
      color: #047857;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 14px;
      color: #6b7280;
    }
    
    /* KPIS */
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .kpi-card {
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .kpi-card.blue { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
    .kpi-card.green { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); }
    .kpi-card.emerald { background: linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%); }
    .kpi-card.primary { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); }
    
    .kpi-label {
      font-size: 11px;
      color: #4b5563;
      font-weight: 600;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    
    .kpi-value {
      font-size: 26px;
      font-weight: bold;
      color: #047857;
    }
    
    .kpi-unit {
      font-size: 10px;
      color: #6b7280;
      margin-top: 2px;
    }
    
    /* SECCIONES */
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    /* TOP 5 MATERIALES */
    .materiales-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .material-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .material-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .material-rank {
      font-size: 16px;
      font-weight: bold;
      color: #9ca3af;
      width: 30px;
    }
    
    .material-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .material-right {
      text-align: right;
    }
    
    .material-kilos {
      font-size: 16px;
      font-weight: bold;
      color: #047857;
    }
    
    .material-percent {
      font-size: 11px;
      color: #6b7280;
    }
    
    /* TABLA */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    thead {
      background: #f3f4f6;
    }
    
    th {
      padding: 10px 8px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
    }
    
    th.center { text-align: center; }
    th.right { text-align: right; }
    
    td {
      padding: 10px 8px;
      font-size: 11px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }
    
    td.center { text-align: center; }
    td.right { text-align: right; }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .top3 {
      background: #fef3c7;
    }
    
    .medal {
      font-size: 20px;
    }
    
    .rank-number {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
    }
    
    /* FOOTER */
    .footer {
      position: fixed;
      bottom: 10mm;
      left: 15mm;
      right: 15mm;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }
    
    /* UTILIDADES */
    .text-green { color: #047857; font-weight: 600; }
    .text-gray { color: #6b7280; }
    .font-bold { font-weight: 700; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-header">
      <h1>Dashboard Coordinador</h1>
      <p>Elefantes Verdes - ${data.plazaSeleccionada || 'Todas las Plazas'}</p>
    </div>

    <div class="logo-container">
      <img src="/logo-blanco.png" alt="Elefantes Verdes" style="width: 100px; height: 100px; object-fit: contain;" />
    </div>

    <div class="cover-info">
      <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
      ${data.userName ? `<p><strong>Generado por:</strong> ${data.userName}</p>` : ''}
    </div>

    <div class="cover-footer">
      <p>Elefantes Verdes - Estrategias Ambientales</p>
      <p>Sistema de Trazabilidad de Residuos</p>
    </div>
  </div>

  <!-- PÁGINA DE CONTENIDO -->
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>Resumen Ejecutivo</h1>
      <p>${data.plazaSeleccionada || 'Todas las Plazas'} - Dashboard Coordinador</p>
    </div>

    <!-- KPIs -->
    <div class="section">
      <div class="kpis-grid">
        <div class="kpi-card primary">
          <div class="kpi-label">Total Recolecciones</div>
          <div class="kpi-value">${data.stats.total_recolecciones.toLocaleString('es-MX')}</div>
        </div>
        
        <div class="kpi-card green">
          <div class="kpi-label">Total Kilos</div>
          <div class="kpi-value">${data.stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
          <div class="kpi-unit">kilogramos</div>
        </div>
        
        <div class="kpi-card blue">
          <div class="kpi-label">CO2 Evitado</div>
          <div class="kpi-value">${(data.stats.total_co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })}</div>
          <div class="kpi-unit">toneladas</div>
        </div>
        
        <div class="kpi-card emerald">
          <div class="kpi-label">Arboles Equiv.</div>
          <div class="kpi-value">${arbolesEquivalentes.toLocaleString('es-MX')}</div>
          <div class="kpi-unit">arboles</div>
        </div>
      </div>
    </div>

    <!-- Top 5 Materiales -->
    <div class="section">
      <h2 class="section-title">Top 5 Materiales</h2>
      <div class="materiales-list">
        ${data.statsByTipo.slice(0, 5).map((tipo, index) => {
          const porcentaje = data.stats.total_kilos > 0 
            ? ((tipo.total_kilos / data.stats.total_kilos) * 100).toFixed(1) 
            : '0';
          
          return `
            <div class="material-item">
              <div class="material-left">
                <span class="material-rank">#${index + 1}</span>
                <span class="material-name">${tipo.tipo_residuo}</span>
              </div>
              <div class="material-right">
                <div class="material-kilos">${tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</div>
                <div class="material-percent">${porcentaje}% del total</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Top 10 Locales -->
    <div class="section page-break">
      <h2 class="section-title">Top 10 Locales Mas Productivos</h2>
      <table>
        <thead>
          <tr>
            <th class="center" style="width: 80px;">Posicion</th>
            <th>Local</th>
            <th>Plaza</th>
            <th class="right" style="width: 100px;">Kilos</th>
            <th class="right" style="width: 100px;">CO2 Evitado</th>
          </tr>
        </thead>
        <tbody>
          ${data.topLocales.slice(0, 10).map((local, index) => `
            <tr class="${index < 3 ? 'top3' : ''}">
              <td class="center">
                ${index === 0 ? '<span class="medal">🥇</span>' : 
                  index === 1 ? '<span class="medal">🥈</span>' : 
                  index === 2 ? '<span class="medal">🥉</span>' : 
                  `<span class="rank-number">#${index + 1}</span>`}
              </td>
              <td class="font-bold">${local.local_nombre}</td>
              <td class="text-gray">${local.plaza_nombre}</td>
              <td class="right text-green">${local.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</td>
              <td class="right text-gray">${local.total_co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Recolecciones Recientes -->
    <div class="section">
      <h2 class="section-title">Recolecciones Recientes (Ultimas 10)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 90px;">Fecha</th>
            <th>Local</th>
            <th>Plaza</th>
            <th>Capturador</th>
            <th class="right" style="width: 80px;">Kilos</th>
            <th class="right" style="width: 90px;">CO2 Evitado</th>
          </tr>
        </thead>
        <tbody>
          ${data.recoleccionesRecientes.slice(0, 10).map(rec => `
            <tr>
              <td>${rec.fecha_recoleccion.split('-').reverse().join('/')}</td>
              <td class="font-bold">${rec.local_nombre}</td>
              <td class="text-gray">${rec.plaza_nombre}</td>
              <td class="text-gray">${rec.brigadista_nombre}</td>
              <td class="right text-green">${rec.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</td>
              <td class="right text-gray">${rec.total_co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Footer en todas las páginas -->
  <div class="footer">
    <p>Elefantes Verdes - Estrategias Ambientales | Dashboard Coordinador | Pagina <span class="page-number"></span></p>
  </div>

  <script>
    // Auto-print cuando se carga la página
    window.onload = function() {
      // Agregar números de página
      const pages = document.querySelectorAll('.page, .cover-page');
      const pageNumbers = document.querySelectorAll('.page-number');
      pageNumbers.forEach((el, i) => {
        el.textContent = i + 1;
      });
      
      // Abrir diálogo de impresión
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  // Crear blob y abrir en nueva ventana
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};