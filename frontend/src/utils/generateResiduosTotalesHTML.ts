interface ResiduosTotalesHTMLData {
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
  plazaSeleccionada?: string;
  localSeleccionado?: string;
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

const COLORS_CHART = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#6366F1'
];

export const generateResiduosTotalesHTML = (data: ResiduosTotalesHTMLData) => {
  const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const co2Toneladas = data.stats.co2_evitado / 1000;
  const arbolesEquivalentes = Math.round(co2Toneladas * 45);
  const kwhAhorrados = Math.round(co2Toneladas * 5000);
  const kmAutoEvitados = Math.round(co2Toneladas * 4500);

  const totalKilos = data.stats.total_kilos;
  const materialesOrdenados = [...data.statsByTipo]
    .sort((a, b) => b.total_kilos - a.total_kilos);

  const materialesConPorcentaje = materialesOrdenados.map(m => ({
    ...m,
    porcentaje: ((m.total_kilos / totalKilos) * 100).toFixed(1)
  }));

  const lugarTexto = data.localSeleccionado 
    ? `${data.plazaSeleccionada} - ${data.localSeleccionado}`
    : data.plazaSeleccionada || 'Tu Negocio';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Impacto Ambiental - Elefantes Verdes</title>
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
      padding: 30px;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }

    .cover-header {
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
      color: white;
      padding: 40px 50px;
      border-radius: 20px;
      margin-bottom: 30px;
      box-shadow: 0 15px 40px rgba(4, 120, 87, 0.3);
    }

    .cover-header h1 {
      font-size: 42px;
      margin-bottom: 12px;
      font-weight: bold;
    }

    .cover-header .emoji {
      font-size: 50px;
      margin-bottom: 15px;
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
      margin: 30px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    .logo-container img {
      width: 100px;
      height: 100px;
      object-fit: contain;
    }

    .cover-info {
      color: #047857;
      margin-top: 30px;
      font-size: 16px;
      font-weight: 600;
    }

    .cover-info p {
      margin: 12px 0;
    }

    .motivational-message {
      margin-top: 40px;
      padding: 20px 35px;
      background: white;
      border-radius: 15px;
      border-left: 6px solid #10b981;
      max-width: 550px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .motivational-message p {
      font-size: 16px;
      color: #047857;
      line-height: 1.6;
      font-weight: 500;
    }

    /* PÁGINAS DE CONTENIDO */
    .content-page {
      padding: 20px 0;
    }

    .page-title {
      color: #047857;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
    }

    .page-subtitle {
      text-align: center;
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 30px;
    }

    /* KPIs GRANDES */
    .kpis-hero {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 35px;
    }

    .kpi-hero-card {
      padding: 25px 20px;
      border-radius: 15px;
      text-align: center;
      border: 3px solid;
      position: relative;
      overflow: hidden;
    }

    .kpi-hero-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: var(--color);
    }

    .kpi-hero-card.verde {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-color: #10b981;
      --color: #10b981;
    }

    .kpi-hero-card.azul {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #3b82f6;
      --color: #3b82f6;
    }

    .kpi-hero-card.amarillo {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-color: #f59e0b;
      --color: #f59e0b;
    }

    .kpi-hero-card.morado {
      background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
      border-color: #8b5cf6;
      --color: #8b5cf6;
    }

    .kpi-emoji {
      font-size: 40px;
      margin-bottom: 10px;
    }

    .kpi-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .kpi-value {
      font-size: 36px;
      font-weight: bold;
      line-height: 1;
      margin-bottom: 5px;
    }

    .kpi-hero-card.verde .kpi-value {
      color: #047857;
    }

    .kpi-hero-card.azul .kpi-value {
      color: #1e40af;
    }

    .kpi-hero-card.amarillo .kpi-value {
      color: #b45309;
    }

    .kpi-hero-card.morado .kpi-value {
      color: #6b21a8;
    }

    .kpi-unit {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
    }

    /* GRID DE MATERIALES */
    .materials-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-bottom: 35px;
    }

    .material-card {
      background: white;
      border: 3px solid #e5e7eb;
      border-radius: 15px;
      padding: 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .material-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: var(--color);
    }

    .material-icon {
      font-size: 50px;
      margin-bottom: 10px;
    }

    .material-name {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .material-percentage {
      font-size: 42px;
      font-weight: bold;
      color: var(--color);
      line-height: 1;
      margin-bottom: 10px;
    }

    .material-kilos {
      font-size: 16px;
      color: #374151;
      font-weight: 700;
    }

    /* EQUIVALENCIAS */
    .equivalencias-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      border: 3px solid #f59e0b;
    }

    .equivalencias-title {
      text-align: center;
      font-size: 26px;
      color: #78350f;
      font-weight: bold;
      margin-bottom: 25px;
    }

    .equivalencias-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .equiv-card {
      background: white;
      padding: 25px;
      border-radius: 15px;
      text-align: center;
      border: 3px solid #f59e0b;
      box-shadow: 0 6px 12px rgba(245, 158, 11, 0.2);
    }

    .equiv-emoji {
      font-size: 50px;
      margin-bottom: 15px;
    }

    .equiv-value {
      font-size: 36px;
      font-weight: bold;
      color: #92400e;
      margin-bottom: 8px;
    }

    .equiv-label {
      font-size: 13px;
      color: #78350f;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* MENSAJE FINAL */
    .final-message {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      padding: 30px;
      border-radius: 20px;
      text-align: center;
      border: 3px solid #10b981;
      margin-top: 30px;
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
      <div class="emoji">🌍💚</div>
      <h1>Tu Impacto Ambiental</h1>
      <p>${lugarTexto}</p>
    </div>

    <div class="logo-container">
      <img src="/logo-blanco.png" alt="Elefantes Verdes" />
    </div>

    <div class="cover-info">
      <p>📅 ${fechaGeneracion}</p>
    </div>

    <div class="motivational-message">
      <p>
        ¡Gracias por tu compromiso con el medio ambiente! 
        Este reporte muestra tu impacto positivo. 
        <strong>Cada kilogramo cuenta.</strong> 🌱
      </p>
    </div>
  </div>

  <!-- PÁGINA 1: TU IMPACTO EN NÚMEROS -->
  <div class="content-page page-break">
    <h1 class="page-title">🌍 Tu Impacto en Números</h1>
    <p class="page-subtitle">Estas son las cifras de tu contribución ambiental</p>

    <!-- KPIs Principales -->
    <div class="kpis-hero no-break">
      <div class="kpi-hero-card verde">
        <div class="kpi-emoji">⚖️</div>
        <div class="kpi-label">Total Reciclado</div>
        <div class="kpi-value">${data.stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
        <div class="kpi-unit">kilogramos</div>
      </div>

      <div class="kpi-hero-card azul">
        <div class="kpi-emoji">🌫️</div>
        <div class="kpi-label">CO2 Evitado</div>
        <div class="kpi-value">${co2Toneladas.toFixed(2)}</div>
        <div class="kpi-unit">toneladas</div>
      </div>

      <div class="kpi-hero-card amarillo">
        <div class="kpi-emoji">🌳</div>
        <div class="kpi-label">Árboles</div>
        <div class="kpi-value">${arbolesEquivalentes.toLocaleString('es-MX')}</div>
        <div class="kpi-unit">equivalentes</div>
      </div>

      <div class="kpi-hero-card morado">
        <div class="kpi-emoji">📋</div>
        <div class="kpi-label">Recolecciones</div>
        <div class="kpi-value">${data.stats.total_recolecciones.toLocaleString('es-MX')}</div>
        <div class="kpi-unit">visitas</div>
      </div>
    </div>

    <!-- Grid de Materiales -->
    <h2 style="color: #047857; font-size: 24px; font-weight: bold; margin: 30px 0 20px; text-align: center;">
      ♻️ Distribución por Material
    </h2>

    <div class="materials-grid no-break">
      ${materialesConPorcentaje.slice(0, 9).map((material, index) => {
        const color = COLORS_CHART[index % COLORS_CHART.length];
        const emoji = EMOJI_MAP[material.tipo_residuo_nombre] || '♻️';
        
        return `
        <div class="material-card" style="--color: ${color};">
          <div class="material-icon">${emoji}</div>
          <div class="material-name">${material.tipo_residuo_nombre}</div>
          <div class="material-percentage">${material.porcentaje}%</div>
          <div class="material-kilos">${material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg</div>
        </div>
        `;
      }).join('')}
    </div>

    <div class="page-footer">
      Página 1 de 2
    </div>
  </div>

  <!-- PÁGINA 2: EQUIVALENCIAS Y MENSAJE -->
  <div class="content-page page-break">
    <h1 class="page-title">✨ Equivalencias Ambientales</h1>
    <p class="page-subtitle">Tu esfuerzo traducido en impacto real</p>

    <div class="equivalencias-section no-break">
      <h2 class="equivalencias-title">Tu reciclaje equivale a:</h2>
      
      <div class="equivalencias-grid">
        <div class="equiv-card">
          <div class="equiv-emoji">🌳</div>
          <div class="equiv-value">${arbolesEquivalentes.toLocaleString('es-MX')}</div>
          <div class="equiv-label">Árboles Plantados</div>
        </div>

        <div class="equiv-card">
          <div class="equiv-emoji">💡</div>
          <div class="equiv-value">${kwhAhorrados.toLocaleString('es-MX')}</div>
          <div class="equiv-label">kWh Ahorrados</div>
        </div>

        <div class="equiv-card">
          <div class="equiv-emoji">🚗</div>
          <div class="equiv-value">${kmAutoEvitados.toLocaleString('es-MX')}</div>
          <div class="equiv-label">km de Auto Evitados</div>
        </div>
      </div>
    </div>

    <!-- Desglose -->
    <div style="background: #f9fafb; padding: 25px; border-radius: 15px; margin-bottom: 25px;" class="no-break">
      <h3 style="color: #047857; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
        📊 Desglose de tu Desempeño
      </h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 5px;">Promedio por recolección:</p>
          <p style="font-size: 24px; font-weight: bold; color: #047857;">
            ${(data.stats.total_kilos / data.stats.total_recolecciones).toFixed(1)} kg
          </p>
        </div>
        
        <div>
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 5px;">Material más reciclado:</p>
          <p style="font-size: 20px; font-weight: bold; color: #047857;">
            ${EMOJI_MAP[materialesConPorcentaje[0].tipo_residuo_nombre] || '♻️'} ${materialesConPorcentaje[0].tipo_residuo_nombre}
          </p>
        </div>
      </div>
    </div>

    <!-- Mensaje Final -->
    <div class="final-message no-break">
      <p>
        ¡Felicidades! Con tu compromiso ambiental estás contribuyendo 
        activamente a un planeta más limpio y sustentable.
      </p>
      <div class="emoji">🌍💚♻️</div>
      <p style="font-size: 18px; font-weight: 700;">
        Gracias por hacer la diferencia
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