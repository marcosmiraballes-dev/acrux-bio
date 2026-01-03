interface InfraccionData {
  id: string;
  nro_aviso: string;
  fecha_infraccion: string;
  locatario: {
    id: string;
    codigo_local: string;
    nombre_comercial: string;
    plaza: {
      id: string;
      nombre: string;
    };
  };
  reglamento: {
    numero_punto: string;
    descripcion: string;
  };
  tipo_aviso: {
    tipo: string;
    orden: number;
    color_badge: string;
  };
  descripcion_falta: string;
  notas?: string;
  created_by_user?: {
    nombre: string;
  };
}

interface HistorialAviso {
  nro_aviso: string;
  fecha_infraccion: string;
  descripcion_falta: string;
}

// Mapeo de plaza_id a logo
const PLAZA_LOGOS: Record<string, string> = {
  '2c983cd6-f756-494d-a1c1-ff251b337ad5': 'plaza-americas-malecon.png',
  '3dece273-3dfe-495a-b15c-4508451a01ae': 'plaza-americas-playa.png',
  'eef705d0-709d-47b6-853a-c88b57984c59': 'plaza-mall.png',
  '3b48675e-8a3c-4b2b-8616-dc944a139cb0': 'plaza-puerto-cancun.png'
};

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

// Función para formatear fecha sin bug de zona horaria
const formatearFecha = (fechaISO: string): string => {
  const [year, month, day] = fechaISO.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

export const generateInfraccionHTML = async (data: InfraccionData) => {
  // Obtener historial de infracciones del locatario
  let historial: HistorialAviso[] = [];
  try {
    const api = (await import('../utils/api')).default;
    const response = await api.get(`/infracciones?locatario_id=${data.locatario.id}&limit=100`);
    historial = response.data.data
      .filter((inf: any) => inf.id !== data.id)
      .sort((a: any, b: any) => new Date(a.fecha_infraccion).getTime() - new Date(b.fecha_infraccion).getTime())
      .map((inf: any) => ({
        nro_aviso: inf.nro_aviso,
        fecha_infraccion: inf.fecha_infraccion,
        descripcion_falta: inf.descripcion_falta
      }));
  } catch (error) {
    console.error('Error al cargar historial:', error);
  }

  // Cargar logos en base64
  const logoPlazaFile = PLAZA_LOGOS[data.locatario.plaza.id] || 'plaza-mall.png';
  const logoPlazaBase64 = await getImageBase64(`/logos-plazas/${logoPlazaFile}`);
  const logoElefanteBase64 = await getImageBase64('/logo-blanco.png');

  // CORREGIDO: Formatear fecha sin conversión de zona horaria
  const [year, month, day] = data.fecha_infraccion.split('T')[0].split('-');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const fechaObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const diaSemana = dias[fechaObj.getDay()];
  const fechaCapitalizada = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;

  // ✅ CORRECCIÓN: Extraer el número del nro_aviso (AV-004 → 4)
  const numeroAviso = parseInt(data.nro_aviso.split('-')[1]);
  
  // Determinar color basado en el número de aviso
  let colorBadge = '#991B1B';
  if (numeroAviso === 1) colorBadge = '#10B981';
  else if (numeroAviso === 2) colorBadge = '#F59E0B';
  else if (numeroAviso === 3) colorBadge = '#EF4444';
  
  // ✅ NUEVO: Generar texto del aviso basado en el número real
  const getTextoAviso = (num: number): string => {
    if (num === 1) return '1er aviso';
    if (num === 2) return '2do aviso';
    if (num === 3) return '3er aviso';
    if (num === 4) return '4to aviso';
    if (num === 5) return '5to aviso';
    if (num === 6) return '6to aviso';
    if (num === 7) return '7mo aviso';
    if (num === 8) return '8vo aviso';
    if (num === 9) return '9no aviso';
    if (num === 10) return '10mo aviso';
    return `${num}° aviso`;
  };
  
  const textoAviso = getTextoAviso(numeroAviso);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso ${data.nro_aviso} - ${data.locatario.nombre_comercial}</title>
  <style>
    @media print {
      @page { size: A4; margin: 12mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; background: white; padding: 12px; }
    .container { max-width: 800px; margin: 0 auto; }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 3px solid #047857; }
    .logo-box { width: 100px; height: 65px; display: flex; align-items: center; justify-content: center; }
    .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
    
    .title { text-align: center; margin: 12px 0; }
    .title h1 { color: #DC2626; font-size: 22px; font-weight: bold; text-decoration: underline; }
    
    .green-bar { width: 100%; height: 3px; background: #047857; margin: 10px 0; }
    
    .info-section { margin: 10px 0; }
    .info-row { display: flex; margin-bottom: 6px; font-size: 12px; }
    .info-label { font-weight: bold; min-width: 150px; color: #1f2937; }
    .info-value { color: #374151; }
    
    .greeting { margin: 10px 0; font-size: 12px; font-weight: bold; }
    
    .regulation-text { margin: 10px 0; padding: 8px; background: #f9fafb; border-left: 4px solid #047857; font-size: 11px; line-height: 1.5; }
    .regulation-text strong { color: #047857; }
    .regulation-text p { display: inline; }
    
    .fault-description { margin: 10px 0; font-size: 12px; }
    .fault-description strong { color: #DC2626; }
    
    .aviso-line { margin: 12px 0; text-align: center; font-size: 13px; }
    .aviso-badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-weight: bold; background: ${colorBadge}; color: white; margin-left: 6px; font-size: 13px; }
    
    .multa-alert { margin: 12px 0; padding: 8px 12px; background: #FEF2F2; border: 2px solid #DC2626; border-radius: 6px; text-align: center; }
    .multa-alert p { color: #DC2626; font-size: 13px; font-weight: bold; line-height: 1.3; }
    
    .notas-section { margin: 10px 0; padding: 8px; background: #fffbeb; border-left: 4px solid #f59e0b; font-size: 11px; }
    .notas-section strong { color: #d97706; }
    
    .historial-section { margin: 12px 0; }
    .historial-section h2 { font-size: 14px; color: #1f2937; margin-bottom: 8px; border-bottom: 2px solid #047857; padding-bottom: 4px; }
    
    .historial-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 6px; }
    .historial-table thead { background: #047857; color: white; }
    .historial-table th { padding: 5px 6px; text-align: left; font-weight: bold; font-size: 10px; }
    .historial-table td { padding: 4px 6px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 10px; line-height: 1.3; }
    .historial-table tbody tr:nth-child(even) { background: #f3f4f6; }
    .historial-table .current-row { background: #fef2f2 !important; font-weight: 500; }
    
    .no-historial { padding: 12px; text-align: center; color: #6b7280; font-style: italic; font-size: 11px; }
    
    .signature-section { margin-top: 25px; display: flex; justify-content: space-around; }
    .signature-box { text-align: center; width: 180px; }
    .signature-line { border-top: 2px solid #333; margin-top: 35px; padding-top: 5px; font-size: 11px; color: #374151; }
    
    .footer { margin-top: 20px; padding-top: 8px; border-top: 2px solid #047857; text-align: center; font-size: 10px; color: #6b7280; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header con logos -->
    <div class="header">
      <div class="logo-box">
        ${logoPlazaBase64 ? `<img src="${logoPlazaBase64}" alt="Logo Plaza">` : '<div style="background: #e5e7eb; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280;">Logo Plaza</div>'}
      </div>
      <div class="logo-box">
        ${logoElefanteBase64 ? `<img src="${logoElefanteBase64}" alt="Elefantes Verdes">` : '<div style="background: #e5e7eb; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6b7280;">Logo EV</div>'}
      </div>
    </div>

    <!-- Título principal -->
    <div class="title">
      <h1>Aviso de Infracción</h1>
    </div>

    <!-- Barra verde -->
    <div class="green-bar"></div>

    <!-- Información del local -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Fecha:</span>
        <span class="info-value">${fechaCapitalizada}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Local:</span>
        <span class="info-value">${data.locatario.codigo_local}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Nombre Comercial:</span>
        <span class="info-value">${data.locatario.nombre_comercial}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Plaza:</span>
        <span class="info-value">${data.locatario.plaza.nombre}</span>
      </div>
    </div>

    <!-- Saludo -->
    <div class="greeting">
      <p>Estimado Locatario:</p>
    </div>

    <!-- Texto del reglamento - TODO EN 1 LÍNEA -->
    <div class="regulation-text">
      <p>De acuerdo al reglamento interno de la <strong>${data.locatario.plaza.nombre}</strong> en el <strong>${data.reglamento.numero_punto}</strong> - ${data.reglamento.descripcion}</p>
    </div>

    <!-- Descripción de la falta -->
    <div class="fault-description">
      <p><strong>Incurrió en la siguiente falta:</strong></p>
      <p style="margin-top: 8px; padding-left: 15px;">${data.descripcion_falta}${data.notas ? ' NOTAS: ' + data.notas : ''}</p>
    </div>

    <!-- Badge de tipo de aviso - ✅ AHORA USA textoAviso CALCULADO -->
    <div class="aviso-line">
      <span>Le informamos que este es el</span>
      <span class="aviso-badge">${textoAviso}</span>
    </div>

    <!-- Alerta de multa -->
    <div class="multa-alert">
      <p>Al tercer aviso, serán acreedores a una multa por un valor de $ 5,000 + IVA</p>
    </div>

    <!-- Historial de avisos -->
    <div class="historial-section">
      <h2>Historial de avisos anteriores:</h2>
      ${historial.length > 0 ? `
      <table class="historial-table">
        <thead>
          <tr>
            <th style="width: 90px;">N° Aviso</th>
            <th style="width: 100px;">Fecha</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          ${historial.map(h => `
          <tr>
            <td><strong>${h.nro_aviso}</strong></td>
            <td>${formatearFecha(h.fecha_infraccion)}</td>
            <td>${h.descripcion_falta}</td>
          </tr>
          `).join('')}
          <tr class="current-row">
            <td><strong>${data.nro_aviso}</strong></td>
            <td>${formatearFecha(data.fecha_infraccion)}</td>
            <td>${data.descripcion_falta}${data.notas ? ' NOTAS: ' + data.notas : ''}</td>
          </tr>
        </tbody>
      </table>
      ` : `
      <div class="no-historial">Esta es la primera infracción registrada para este local.</div>
      `}
    </div>

    <!-- Sección de firmas -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">
          ${data.created_by_user?.nombre || 'Coordinador de Plaza'}
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          Representante del Local
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Elefantes Verdes - Estrategias Ambientales</strong></p>
      <p>${data.locatario.plaza.nombre} | Quintana Roo, México</p>
      <p>Documento generado el ${new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
    </div>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); }, 500);
    };
  </script>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};