interface GraficasResiduoClienteHTMLData {
  materialSeleccionado: {
    nombre: string;
    total_kilos: number;
    co2_evitado: number;
    recolecciones: number;
  };
  topLocales: Array<{
    local_nombre: string;
    plaza_nombre: string;
    total_kilos: number;
  }>;
  datosGrafica?: Array<{
    mes: string;
    kilos: number;
  }>;
  plazaSeleccionada?: string;
  userName?: string;
}

// Mapeo de emojis
const EMOJI_MAP: { [key: string]: string } = {
  'Orgánico': '🍌',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🍷',
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '🧃',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

// Tips de reciclaje por material
const TIPS_RECICLAJE: { [key: string]: { si: string[]; no: string[]; dato: string } } = {
  'Orgánico': {
    si: ['Frutas y verduras', 'Cáscaras', 'Residuos de jardín', 'Café y té'],
    no: ['Aceites', 'Lácteos', 'Carne o pescado', 'Comida cocinada'],
    dato: 'Los residuos orgánicos pueden reducir hasta un 50% la basura doméstica'
  },
  'Cartón': {
    si: ['Cajas limpias', 'Papel', 'Periódicos', 'Revistas'],
    no: ['Cartón mojado', 'Con grasa', 'Encerado', 'Plastificado'],
    dato: 'Reciclar 1 tonelada de papel salva 17 árboles'
  },
  'PET': {
    si: ['Botellas limpias', 'Sin etiquetas', 'Aplastadas', 'Secas'],
    no: ['Con líquido', 'Sucias', 'Con tapas', 'Rotas'],
    dato: 'Una botella PET tarda 450 años en degradarse'
  },
  'Vidrio': {
    si: ['Botellas limpias', 'Frascos', 'Envases', 'Sin tapas'],
    no: ['Cristal', 'Espejos', 'Focos', 'Vidrio roto'],
    dato: 'El vidrio es 100% reciclable infinitas veces'
  },
  'Aluminio': {
    si: ['Latas limpias', 'Aplastadas', 'Secas', 'Sin residuos'],
    no: ['Con comida', 'Oxidadas', 'Sucias', 'Con pintura'],
    dato: 'Reciclar aluminio ahorra 95% de la energía para producirlo'
  }
};

export const generateGraficasResiduoClienteHTML = (data: GraficasResiduoClienteHTMLData) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emoji = EMOJI_MAP[data.materialSeleccionado.nombre] || '♻️';
  const co2Toneladas = data.materialSeleccionado.co2_evitado / 1000;
  const tips = TIPS_RECICLAJE[data.materialSeleccionado.nombre] || {
    si: ['Material limpio', 'Seco', 'Sin residuos', 'Separado'],
    no: ['Sucio', 'Mojado', 'Mezclado', 'Contaminado'],
    dato: 'El reciclaje ayuda a conservar nuestros recursos naturales'
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Análisis de ${data.materialSeleccionado.nombre} - Elefantes Verdes</title>
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
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .cover-header {
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
      color: white;
      padding: 50px 70px;
      border-radius: 20px;
      margin-bottom: 40px;
      box-shadow: 0 15px 40px rgba(4, 120, 87, 0.3);
    }

    .cover-emoji {
      font-size: 80px;
      margin-bottom: 20px;
    }

    .cover-header h1 {
      font-size: 42px;
      margin-bottom: 15px;
      font-weight: bold;
    }

    .cover-header p {
      font-size: 22px;
      opacity: 0.95;
    }

    .logo-container {
      width: 140px;
      height: 140px;
      background: white;
      border-radius: 50%;
      margin: 40px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .logo-container img {
      width: 110px;
      height: 110px;
      object-fit: contain;
    }

    .cover-info {
      color: #047857;
      margin-top: 40px;
      font-size: 18px;
      font-weight: 600;
    }

    /* CONTENIDO */
    .content-page {
      padding: 20px 0;
    }

    .page-title {
      color: #047857;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }

    .page-title .emoji {
      font-size: 40px;
    }

    .page-subtitle {
      text-align: center;
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 30px;
    }

    /* KPIs */
    .kpis-material {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 35px;
    }

    .kpi-material-card {
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      border: 3px solid #10b981;
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .kpi-material-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      font-weight: 700;
    }

    .kpi-material-value {
      font-size: 42px;
      font-weight: bold;
      color: #047857;
      line-height: 1;
      margin-bottom: 8px;
    }

    .kpi-material-unit {
      font-size: 14px;
      color: #6b7280;
      font-weight: 600;
    }

    /* GRÁFICA DE BARRAS */
    .chart-section {
      background: white;
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 30px;
      border: 2px solid #10b981;
    }

    .chart-title {
      font-size: 20px;
      color: #047857;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }

    .chart-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      padding: 10px;
      border-bottom: 2px solid #d1d5db;
      position: relative;
    }

    .chart-bar {
      flex: 1;
      max-width: 80px;
      background: linear-gradient(180deg, #10b981 0%, #047857 100%);
      border-radius: 8px 8px 0 0;
      margin: 0 8px;
      position: relative;
      transition: all 0.3s ease;
    }

    .chart-bar-value {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: bold;
      color: #047857;
      white-space: nowrap;
    }

    .chart-labels {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
      padding: 0 10px;
    }

    .chart-label {
      flex: 1;
      max-width: 80px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      font-weight: 600;
      margin: 0 8px;
    }

    /* RANKING */
    .ranking-section {
      background: #f9fafb;
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 30px;
      border: 2px solid #e5e7eb;
    }

    .ranking-title {
      font-size: 22px;
      color: #047857;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    }

    .ranking-item {
      background: white;
      padding: 15px 20px;
      border-radius: 10px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 2px solid #e5e7eb;
    }

    .ranking-item.top-3 {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-color: #f59e0b;
    }

    .ranking-position {
      font-size: 18px;
      font-weight: bold;
      color: #6b7280;
      min-width: 40px;
    }

    .ranking-item.top-3 .ranking-position {
      color: #b45309;
    }

    .ranking-name {
      flex: 1;
      margin: 0 15px;
    }

    .ranking-local {
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
    }

    .ranking-plaza {
      font-size: 11px;
      color: #6b7280;
    }

    .ranking-value {
      font-size: 18px;
      font-weight: bold;
      color: #047857;
    }

    /* TIPS */
    .tips-section {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      padding: 30px;
      border-radius: 20px;
      border: 3px solid #3b82f6;
      margin-bottom: 30px;
    }

    .tips-title {
      font-size: 26px;
      color: #1e40af;
      font-weight: bold;
      margin-bottom: 25px;
      text-align: center;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }

    .tips-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      border: 2px solid #3b82f6;
    }

    .tips-card h3 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tips-card.si h3 {
      color: #10b981;
    }

    .tips-card.no h3 {
      color: #ef4444;
    }

    .tips-card ul {
      list-style: none;
      padding: 0;
    }

    .tips-card li {
      padding: 6px 0;
      padding-left: 20px;
      font-size: 13px;
      color: #374151;
      position: relative;
    }

    .tips-card.si li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    .tips-card.no li::before {
      content: '✗';
      position: absolute;
      left: 0;
      color: #ef4444;
      font-weight: bold;
    }

    .tips-dato {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      border: 2px solid #3b82f6;
    }

    .tips-dato-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .tips-dato-text {
      font-size: 16px;
      color: #1e40af;
      font-weight: 600;
      line-height: 1.6;
    }

    /* MENSAJE FINAL */
    .final-message {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      border: 3px solid #10b981;
    }

    .final-message p {
      font-size: 20px;
      color: #047857;
      line-height: 1.8;
      font-weight: 600;
    }

    .final-message .emoji {
      font-size: 40px;
      margin: 15px 0;
    }

    /* FOOTER */
    .page-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #d1fae5;
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
      <div class="cover-emoji">${emoji}</div>
      <h1>${data.materialSeleccionado.nombre}</h1>
      <p>Análisis Detallado de Reciclaje</p>
    </div>

    <div class="logo-container">
      <img src="/logo-blanco.png" alt="Elefantes Verdes" />
    </div>

    <div class="cover-info">
      <p>📅 ${fechaGeneracion}</p>
      ${data.plazaSeleccionada ? '<p>📍 ' + data.plazaSeleccionada + '</p>' : ''}
    </div>
  </div>

  <!-- PÁGINA 1: MÉTRICAS Y RANKING -->
  <div class="content-page page-break">
    
    <!-- KPIs del Material -->
    <div class="no-break">
      <h1 class="page-title">
        <span class="emoji">${emoji}</span>
        <span>Métricas de ${data.materialSeleccionado.nombre}</span>
      </h1>
      <p class="page-subtitle">Resultados de tu esfuerzo en este material</p>

      <div class="kpis-material">
        <div class="kpi-material-card">
          <div class="kpi-material-label">Total Reciclado</div>
          <div class="kpi-material-value">${data.materialSeleccionado.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
          <div class="kpi-material-unit">kilogramos</div>
        </div>

        <div class="kpi-material-card">
          <div class="kpi-material-label">CO2 Evitado</div>
          <div class="kpi-material-value">${co2Toneladas.toFixed(2)}</div>
          <div class="kpi-material-unit">toneladas</div>
        </div>

        <div class="kpi-material-card">
          <div class="kpi-material-label">Recolecciones</div>
          <div class="kpi-material-value">${data.materialSeleccionado.recolecciones.toLocaleString('es-MX')}</div>
          <div class="kpi-material-unit">visitas</div>
        </div>
      </div>
    </div>

    <!-- Gráfica Top 5 Meses -->
    ${data.datosGrafica && data.datosGrafica.length > 0 ? `
    <div class="chart-section no-break">
      <h2 class="chart-title">📊 Top 5 Meses - ${data.materialSeleccionado.nombre}</h2>
      <div class="chart-container">
        ${(() => {
          const maxKilos = Math.max(...data.datosGrafica.map(d => d.kilos));
          return data.datosGrafica.map(item => {
            const altura = (item.kilos / maxKilos) * 180; // 180px = altura máxima
            return `
              <div class="chart-bar" style="height: ${altura}px;">
                <div class="chart-bar-value">${item.kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</div>
              </div>
            `;
          }).join('');
        })()}
      </div>
      <div class="chart-labels">
        ${data.datosGrafica.map(item => `<div class="chart-label">${item.mes}</div>`).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Ranking de Locales -->
    <div class="ranking-section no-break">
      <h2 class="ranking-title">🏆 Top 10 Locales en ${data.materialSeleccionado.nombre}</h2>
      
      ${data.topLocales.slice(0, 10).map((local, index) => 
        '<div class="ranking-item ' + (index < 3 ? 'top-3' : '') + '"><div class="ranking-position">' +
        (index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1)) +
        '</div><div class="ranking-name"><div class="ranking-local">' + local.local_nombre + 
        '</div><div class="ranking-plaza">' + local.plaza_nombre + 
        '</div></div><div class="ranking-value">' + 
        local.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' kg</div></div>'
      ).join('')}
    </div>

    <div class="page-footer">
      Página 1 de 2
    </div>
  </div>

  <!-- PÁGINA 2: TIPS DE RECICLAJE -->
  <div class="content-page page-break">
    
    <!-- Tips envueltos en no-break -->
    <div class="no-break">
      <h1 class="page-title">
        <span class="emoji">💡</span>
        <span>Tips de Reciclaje</span>
      </h1>
      <p class="page-subtitle">Aprende a reciclar ${data.materialSeleccionado.nombre} correctamente</p>

      <div class="tips-section">
        <h2 class="tips-title">Guía de Reciclaje de ${data.materialSeleccionado.nombre}</h2>
        
        <div class="tips-grid">
          <div class="tips-card si">
            <h3>✓ SÍ reciclar:</h3>
            <ul>
              ${tips.si.map(item => '<li>' + item + '</li>').join('')}
            </ul>
          </div>

          <div class="tips-card no">
            <h3>✗ NO reciclar:</h3>
            <ul>
              ${tips.no.map(item => '<li>' + item + '</li>').join('')}
            </ul>
          </div>
        </div>

        <div class="tips-dato">
          <div class="tips-dato-label">💡 Sabías que...</div>
          <div class="tips-dato-text">${tips.dato}</div>
        </div>
      </div>
    </div>

    <!-- Mensaje Final -->
    <div class="final-message no-break">
      <p>
        Gracias por reciclar ${data.materialSeleccionado.nombre} de manera responsable.
        Tu esfuerzo ayuda a construir un futuro más sustentable.
      </p>
      <div class="emoji">${emoji} 🌍 💚</div>
      <p style="font-size: 18px; font-weight: 700;">
        ¡Sigue haciendo la diferencia!
      </p>
    </div>

    <div class="page-footer">
      Página 2 de 2 | Elefantes Verdes - Estrategias Ambientales
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