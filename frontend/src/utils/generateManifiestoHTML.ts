// frontend/src/utils/generateManifiestoHTML.ts

interface ManifiestoData {
  folio: string;
  fecha_emision: string;
  
  // Datos del Generador (Local)
  generador_nombre_comercial: string;
  generador_razon_social: string;
  generador_rfc: string;
  generador_domicilio_completo: string;
  generador_municipio: string;
  generador_telefono: string;
  generador_email: string;
  generador_actividad_principal: string;
  
  // Datos del Transportista (Arcelin)
  recolector_empresa: string;
  recolector_rfc: string;
  recolector_domicilio: string;
  recolector_telefono: string;
  recolector_email: string;
  recolector_registro_sema: string;
  recolector_nombre_chofer: string;
  
  // Vehículo (NUEVO)
  vehiculo_tipo: string;
  vehiculo_placas: string;
  
  // Destino Final (NUEVO)
  destino_nombre: string;
  destino_domicilio: string;
  destino_autorizacion: string;
  
  // Residuos
  residuos: Array<{
    tipo: string;
    cantidad: number;
    unidad: string;
  }>;
  total_kilos: number;
  
  // Destino (oficio)
  destino_final_oficio: string;
}

// Función para convertir imagen a base64
const getImageBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error cargando imagen:', error);
    return '';
  }
};

export const generateManifiestoHTML = async (data: ManifiestoData) => {
  // ⭐ CALCULAR TOTAL DE KILOS
  const totalKilos = data.residuos?.reduce((sum, r) => sum + (r.cantidad_kg || 0), 0) || 0;
  
  // Formatear fecha: "04 de enero de 2026"
  const formatearFecha = (fechaISO: string): string => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const [year, month, day] = fechaISO.split('T')[0].split('-');
    const mesNombre = meses[parseInt(month) - 1];
    return `${parseInt(day)} de ${mesNombre} de ${year}`;
  };

  // ⭐ CARGAR LOGO Y FIRMA EN BASE64
  const logoArcelinBase64 = await getImageBase64('/logo-arcelin.png');
  const firmaGabrielBase64 = await getImageBase64('/firma_gabriel.png');
  
  console.log('🖼️ Logo cargado:', logoArcelinBase64 ? `${logoArcelinBase64.substring(0, 50)}...` : 'NO CARGADO');
  console.log('✍️ Firma cargada:', firmaGabrielBase64 ? `${firmaGabrielBase64.substring(0, 50)}...` : 'NO CARGADO');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manifiesto ${data.folio}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 10mm 10mm 10mm 10mm;
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
      font-family: Arial, sans-serif;
      background: white;
      color: #1f2937;
      font-size: 8pt;
      line-height: 1.2;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      padding: 10mm;
    }

    /* TIMESTAMP */
    .timestamp {
      position: absolute;
      top: 5mm;
      left: 5mm;
      font-size: 6pt;
      color: #666;
    }

    /* HEADER - CAMBIO 1: margin-bottom de 12px a 20px */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 3px solid #047857;
    }

    .header-left h1 {
      font-size: 10pt;
      color: #047857;
      margin-bottom: 0px;
      font-weight: bold;
      text-align: center;
    }

    .header-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .logo-container {
      width: 120px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 3px;
    }

    .logo-container img {
      max-width: 120px;
      max-height: 50px;
      object-fit: contain;
    }

    .logo-separator {
      width: 120px;
      height: 1px;
      background: #d1d5db;
      margin-bottom: 5px;
    }

    .folio-info {
      background: #f0fdf4;
      border: 2px solid #047857;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 0px;
    }

    .folio-info div {
      font-weight: bold;
      color: #047857;
      font-size: 8pt;
      margin: 1px 0;
    }

    .folio-info .folio-number {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
    }

    /* SECCIONES */
    .seccion {
      margin: 4px 0;
      page-break-inside: avoid;
    }

    .seccion-title {
      background: linear-gradient(135deg, #047857 0%, #10b981 100%);
      color: white;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 9pt;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .seccion-content {
      border: 1px solid #d1d5db;
      padding: 4px;
      background: #fafafa;
      border-radius: 4px;
    }

    /* CAMBIO 2: Grid 2 columnas para datos del generador */
    .seccion-content.two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 15px;
      row-gap: 4px;
    }

    /* DATA ROWS */
    .data-row {
      display: flex;
      margin-bottom: 2px;
      align-items: baseline;
      font-size: 7pt;
    }

    .data-row .label {
      font-weight: bold;
      color: #047857;
      min-width: 160px;
      flex-shrink: 0;
    }

    .data-row .value {
      color: #374151;
      flex: 1;
    }

    .data-row .value.mono {
      font-family: 'Courier New', monospace;
    }

    /* DATA GRID */
    .data-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      margin: 6px 0;
    }

    .data-grid-item {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .data-grid-item .label {
      font-weight: bold;
      color: #047857;
      font-size: 8pt;
      white-space: nowrap;
    }

    .data-grid-item .value {
      color: #374151;
      font-size: 8pt;
    }

    /* TABLA DE RESIDUOS */
    .residuos-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }

    .residuos-table thead {
      background: #047857;
      color: white;
    }

    .residuos-table th {
      padding: 3px 4px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #047857;
      font-size: 8pt;
    }

    .residuos-table th:first-child {
      width: 60%;
    }

    .residuos-table th:nth-child(2) {
      width: 20%;
      text-align: right;
    }

    .residuos-table th:last-child {
      width: 20%;
      text-align: center;
    }

    .residuos-table td {
      padding: 2px 4px;
      border: 1px solid #d1d5db;
      font-size: 7pt;
    }

    .residuos-table tbody tr {
      background: white;
    }

    .residuos-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }

    .residuos-table .cantidad-cell {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .residuos-table .unidad-cell {
      text-align: center;
    }

    .residuos-table .total-row {
      background: #dcfce7 !important;
      font-weight: bold;
    }

    .residuos-table .total-row td {
      border-top: 2px solid #047857;
      padding: 5px 6px;
    }

    /* DESTINO BOX */
    .destino-section {
      background: #fff7ed;
      border: 2px solid #f59e0b;
      border-radius: 4px;
      padding: 6px;
      margin: 6px 0;
    }

    .destino-section .destino-title {
      font-weight: bold;
      color: #ea580c;
      margin-bottom: 6px;
      font-size: 9pt;
    }

    /* DECLARACIONES */
    .declaraciones {
      background: #f0fdf4;
      border-left: 4px solid #047857;
      padding: 4px;
      margin: 4px 0;
      font-size: 6.5pt;
      color: #374151;
      line-height: 1.3;
    }

    .declaraciones p {
      margin-bottom: 3px;
    }

    .declaraciones .warning {
      font-weight: bold;
      color: #dc2626;
      margin-top: 6px;
    }

    /* FIRMAS - CAMBIO 3: align-items: flex-end */
    .firmas-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 8px;
      align-items: flex-end;
    }

    .firma-box {
      text-align: center;
    }

    .firma-image {
      max-width: 180px;
      max-height: 50px;
      object-fit: contain;
      margin-bottom: 5px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }

    .firma-label {
      font-weight: bold;
      color: #047857;
      font-size: 7pt;
      margin-bottom: 10px;
    }

    .firma-line {
      border-top: 1px solid #374151;
      margin: 0 15px;
    }

    /* FOOTER */
    .footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #d1d5db;
      text-align: center;
      font-size: 6pt;
      color: #6b7280;
    }

    /* HELPERS */
    .text-right {
      text-align: right;
    }

    .font-mono {
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="page">
    
    <!-- Timestamp -->
    <div class="timestamp">${new Date().toLocaleString('es-MX')}</div>

    <!-- ========== HEADER ========== -->
    <div class="header">
      <div class="header-left">
        <h1>Manifiesto de recolección y transporte de residuos valorizables</h1>
      </div>
      <div class="header-right">
        <div class="logo-container">
          ${logoArcelinBase64 ? `<img src="${logoArcelinBase64}" alt="Arcelin" />` : '<div style="background: #e5e7eb; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280;">Logo Arcelin</div>'}
        </div>
        <div class="logo-separator"></div>
        <div class="folio-info">
          <div>FOLIO: <span class="folio-number">${data.folio}</span></div>
          <div>FECHA: <span>${formatearFecha(data.fecha_emision)}</span></div>
        </div>
      </div>
    </div>

    <!-- ========== 1. DATOS GENERALES DEL GENERADOR ========== -->
    <div class="seccion">
      <div class="seccion-title">1. Datos Generales del Generador</div>
      <div class="seccion-content two-columns">
        <div class="data-row">
          <span class="label">Nombre/Razón Social:</span>
          <span class="value">${data.generador_razon_social || data.generador_nombre_comercial}</span>
        </div>
        <div class="data-row">
          <span class="label">RFC:</span>
          <span class="value mono">${data.generador_rfc || '_______________________________'}</span>
        </div>
        <div class="data-row">
          <span class="label">Domicilio de recolección:</span>
          <span class="value">${data.generador_domicilio_completo}</span>
        </div>
        <div class="data-row">
          <span class="label">Municipio:</span>
          <span class="value">${data.generador_municipio || 'Playa del Carmen'}</span>
        </div>
        <div class="data-row">
          <span class="label">Teléfono:</span>
          <span class="value">${data.generador_telefono || '_______________________________'}</span>
        </div>
        <div class="data-row">
          <span class="label">Correo electrónico:</span>
          <span class="value">${data.generador_email || '_______________________________'}</span>
        </div>
        <div class="data-row">
          <span class="label">Autorización de Plan de Manejo:</span>
          <span class="value">_______________________________</span>
        </div>
        <div class="data-row">
          <span class="label">Actividad principal:</span>
          <span class="value">${data.generador_actividad_principal || 'Comercial'}</span>
        </div>
      </div>
    </div>

    <!-- ========== 2. DATOS DEL TRANSPORTISTA AUTORIZADO ========== -->
    <div class="seccion">
      <div class="seccion-title">2. Datos del Transportista Autorizado</div>
      <div class="seccion-content">
        <div class="data-row">
          <span class="label">Nombre/Razón Social:</span>
          <span class="value">${data.recolector_empresa}</span>
        </div>
        <div class="data-row">
          <span class="label">RFC:</span>
          <span class="value mono">${data.recolector_rfc}</span>
        </div>
        <div class="data-row">
          <span class="label">Domicilio:</span>
          <span class="value">${data.recolector_domicilio}</span>
        </div>
        
        <div class="data-grid">
          <div class="data-grid-item">
            <span class="label">Teléfonos:</span>
            <span class="value">${data.recolector_telefono}</span>
          </div>
          <div class="data-grid-item">
            <span class="label">Correo electrónico:</span>
            <span class="value">${data.recolector_email}</span>
          </div>
          <div class="data-grid-item">
            <span class="label">No. de Autorización Estatal:</span>
            <span class="value mono">${data.recolector_registro_sema}</span>
          </div>
          <div class="data-grid-item">
            <span class="label">Conductor asignado:</span>
            <span class="value">${data.recolector_nombre_chofer}</span>
          </div>
          <div class="data-grid-item">
            <span class="label">Tipo de unidad:</span>
            <span class="value">${data.vehiculo_tipo}</span>
          </div>
          <div class="data-grid-item">
            <span class="label">Placas del vehículo:</span>
            <span class="value mono">${data.vehiculo_placas}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 3. DESCRIPCIÓN DE LOS RESIDUOS VALORIZABLES ========== -->
    <div class="seccion">
      <div class="seccion-title">3. Descripción de los Residuos Valorizables</div>
      <div class="seccion-content">
        <table class="residuos-table">
          <thead>
            <tr>
              <th>Tipo de residuo</th>
              <th>Cantidad</th>
              <th>Unidad (kg o ton)</th>
            </tr>
          </thead>
          <tbody>
            ${data.residuos?.map(r => `
              <tr>
                <td>${r.tipo}</td>
                <td class="cantidad-cell">${(r.cantidad_kg || 0) > 0 ? (r.cantidad_kg || 0).toFixed(1) : '0'}</td>
                <td class="unidad-cell">${(r.cantidad_kg || 0) > 0 ? 'Kg' : '_________________'}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td class="cantidad-cell"><strong>${totalKilos.toFixed(1)}</strong></td>
              <td class="unidad-cell"><strong>Kg</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========== 4. DESTINO ========== -->
    <div class="seccion">
      <div class="seccion-title">4. Destino</div>
      <div class="seccion-content">
        <div class="destino-section">
          <div class="destino-title">Destino final para aprovechamiento:</div>
          <div class="data-row">
            <span class="label">Nombre:</span>
            <span class="value">${data.destino_nombre}</span>
          </div>
          <div class="data-row">
            <span class="label">Domicilio del destino:</span>
            <span class="value">${data.destino_domicilio}</span>
          </div>
          <div class="data-row">
            <span class="label">No. de autorización:</span>
            <span class="value mono">${data.destino_final_oficio}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 5. DECLARACIONES Y FIRMAS ========== -->
    <div class="seccion">
      <div class="seccion-title">5. Declaraciones y Firmas</div>
      <div class="seccion-content">
        
        <div class="declaraciones">
          <p>
            <strong>El generador</strong> declara que los datos asentados en este manifiesto son verídicos y que los residuos declarados 
            cumplen con las condiciones establecidas por la normatividad aplicable.
          </p>
          <p>
            <strong>El transportista</strong> declara que cuenta con la autorización vigente para el transporte de residuos valorizables 
            de competencia estatal y que entregará la totalidad de los residuos al destino final autorizado.
          </p>
          <p class="warning">
            Se prohíbe la reproducción no autorizada y la difusión de su contenido total o parcial.
          </p>
        </div>

        <div class="firmas-container">
          <div class="firma-box">
            <div class="firma-label">Firma del Generador</div>
            <div class="firma-line"></div>
          </div>
          <div class="firma-box">
            ${firmaGabrielBase64 ? `<img src="${firmaGabrielBase64}" alt="Firma Gabriel" class="firma-image" />` : ''}
            <div class="firma-label">Firma del Recolector</div>
            <div class="firma-line"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== FOOTER ========== -->
    <div class="footer">
      <div style="margin-bottom: 3px;">
        <strong>Acrux-Bio / Elefante Verde</strong> - Sistema de Trazabilidad de Residuos
      </div>
      <div>
        Generado: ${new Date().toLocaleString('es-MX')} | Sistema automatizado
      </div>
    </div>

  </div>

  <script>
    // Auto-print al cargar
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  // Abrir en nueva ventana para imprimir
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};