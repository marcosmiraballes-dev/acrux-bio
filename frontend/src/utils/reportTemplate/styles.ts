// Extraído literal de generateDirectorHTML.ts (líneas 72-254), con dos cambios:
// - @page: letter en vez de A4
// - font-family ya era 'Arial', 'Helvetica', sans-serif en el original — sin cambios

export const REPORT_STYLES = `
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
        size: letter;
        margin: 15mm;
        @bottom-right {
          content: "Página " counter(page) " de " counter(pages);
          font-size: 10px;
          color: #6b7280;
          font-family: 'Arial', 'Helvetica', sans-serif;
        }
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
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 30px;
    }
`;

// Extraído literal de generateGraficasResiduosHTML.ts / generateResiduosTotalesHTML.ts
export const COLORS_CHART = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#6366F1'
];
