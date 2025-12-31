import jsPDF from 'jspdf';

interface MaterialComparado {
  nombre: string;
  periodo1_kilos: number;
  periodo2_kilos: number;
  variacion: number;
}

interface GraficaPorLugarPDFData {
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
  materialesComparados: MaterialComparado[];
  // Filtros aplicados
  nombrePlaza: string;
  nombreLocal?: string;
  periodo1Desde: string;
  periodo1Hasta: string;
  periodo2Desde: string;
  periodo2Hasta: string;
  userName?: string;
}

export const generateGraficaPorLugarPDF = async (data: GraficaPorLugarPDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // ===== PORTADA =====
  await createCoverPage(pdf, data, pageWidth, pageHeight, margin, contentWidth);
  
  pdf.addPage();
  let yPos = margin;

  // ===== CONTENIDO PRINCIPAL =====
  
  // Título
  pdf.setFontSize(18);
  pdf.setTextColor(4, 120, 87);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPARACION DE PERIODOS', margin, yPos);
  yPos += 15;

  // Cards de los 2 periodos
  yPos = drawPeriodos(pdf, data, margin, yPos, contentWidth);
  yPos += 10;

  // Verificar espacio
  if (yPos > pageHeight - 100) {
    pdf.addPage();
    yPos = margin;
  }

  // Cards de variaciones
  yPos = drawVariaciones(pdf, data.variacion, data.periodo1, data.periodo2, margin, yPos, contentWidth);
  yPos += 10;

  // Verificar espacio
  if (yPos > pageHeight - 100) {
    pdf.addPage();
    yPos = margin;
  }

  // Comparativa de Kilos Totales
  yPos = drawComparativaKilos(pdf, data.periodo1.total_kilos, data.periodo2.total_kilos, margin, yPos, contentWidth);
  yPos += 10;

  // Verificar espacio
  if (yPos > pageHeight - 120) {
    pdf.addPage();
    yPos = margin;
  }

  // Tabla comparativa de materiales
  yPos = drawTablaMateriales(pdf, data.materialesComparados, margin, yPos, contentWidth);

  // Números de página
  const totalPages = pdf.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  // Descargar
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`Grafica_Por_Lugar_${timestamp}.pdf`);
};

// ===== FUNCIONES AUXILIARES =====

async function createCoverPage(
  pdf: jsPDF,
  data: GraficaPorLugarPDFData,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  contentWidth: number
) {
  // Rectángulo verde
  pdf.setFillColor(4, 120, 87);
  pdf.rect(margin, 20, contentWidth, 40, 'F');

  // Título
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Comparacion por Lugar', pageWidth / 2, 45, { align: 'center' });

  // Subtítulo
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const subtitle = `Elefantes Verdes - ${data.nombrePlaza}${data.nombreLocal ? ' - ' + data.nombreLocal : ''}`;
  pdf.text(subtitle, pageWidth / 2, 55, { align: 'center' });

  // Logo (si existe)
  try {
    const logoImg = new Image();
    logoImg.src = '/logo-blanco.png';
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
      setTimeout(reject, 2000);
    });

    const logoWidth = 40;
    const logoHeight = 40;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 70;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(logoX - 2, logoY - 2, logoWidth + 4, logoHeight + 4, 'F');
    pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (err) {
    console.warn('Logo no disponible');
  }

  // Fecha
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(12);
  const fecha = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  pdf.text(`Fecha de generacion: ${fecha}`, pageWidth / 2, 125, { align: 'center' });

  if (data.userName) {
    pdf.text(`Generado por: ${data.userName}`, pageWidth / 2, 135, { align: 'center' });
  }

  // Línea decorativa
  pdf.setDrawColor(4, 120, 87);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 145, pageWidth - margin, 145);

  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Elefantes Verdes - Estrategias Ambientales', pageWidth / 2, 280, { align: 'center' });
  pdf.text('Sistema de Trazabilidad de Residuos', pageWidth / 2, 285, { align: 'center' });
}

function drawPeriodos(
  pdf: jsPDF,
  data: GraficaPorLugarPDFData,
  x: number,
  y: number,
  width: number
): number {
  const cardWidth = (width - 6) / 2;

  // Periodo 1 (Azul)
  pdf.setFillColor(219, 234, 254);
  pdf.rect(x, y, cardWidth, 75, 'F');

  pdf.setFontSize(14);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PERIODO 1', x + 5, y + 8);

  pdf.setFontSize(8);
  pdf.setTextColor(59, 130, 246);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.periodo1Desde} - ${data.periodo1Hasta}`, x + 5, y + 14);

  // Nombre de plaza/local
  pdf.setFontSize(8);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  const plazaText = data.nombreLocal 
    ? `${data.nombrePlaza} - ${data.nombreLocal}`
    : data.nombrePlaza;
  // Truncar si es muy largo
  const plazaTruncated = plazaText.length > 35 ? plazaText.substring(0, 32) + '...' : plazaText;
  pdf.text(plazaTruncated, x + 5, y + 20);

  // Línea separadora
  pdf.setDrawColor(147, 197, 253);
  pdf.setLineWidth(0.3);
  pdf.line(x + 5, y + 23, x + cardWidth - 5, y + 23);

  // Datos periodo 1
  let yData = y + 30;

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Recolecciones', x + 5, yData);
  pdf.setFontSize(16);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.periodo1.total_recolecciones.toLocaleString('es-MX'), x + 5, yData + 7);
  yData += 15;

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Kilos', x + 5, yData);
  pdf.setFontSize(16);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.periodo1.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x + 5, yData + 7);
  yData += 15;

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CO2 Evitado', x + 5, yData);
  pdf.setFontSize(14);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${(data.periodo1.co2_evitado / 1000).toFixed(2)} Ton`, x + 5, yData + 7);

  // Periodo 2 (Morado)
  pdf.setFillColor(233, 213, 255);
  pdf.rect(x + cardWidth + 6, y, cardWidth, 75, 'F');

  pdf.setFontSize(14);
  pdf.setTextColor(109, 40, 217);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PERIODO 2', x + cardWidth + 11, y + 8);

  pdf.setFontSize(8);
  pdf.setTextColor(139, 92, 246);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.periodo2Desde} - ${data.periodo2Hasta}`, x + cardWidth + 11, y + 14);

  // Nombre de plaza/local
  pdf.setFontSize(8);
  pdf.setTextColor(109, 40, 217);
  pdf.setFont('helvetica', 'bold');
  pdf.text(plazaTruncated, x + cardWidth + 11, y + 20);

  // Línea separadora
  pdf.setDrawColor(216, 180, 254);
  pdf.setLineWidth(0.3);
  pdf.line(x + cardWidth + 11, y + 23, x + width - 5, y + 23);

  // Datos periodo 2
  yData = y + 30;

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Recolecciones', x + cardWidth + 11, yData);
  pdf.setFontSize(16);
  pdf.setTextColor(109, 40, 217);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.periodo2.total_recolecciones.toLocaleString('es-MX'), x + cardWidth + 11, yData + 7);
  yData += 15;

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Kilos', x + cardWidth + 11, yData);
  pdf.setFontSize(16);
  pdf.setTextColor(109, 40, 217);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.periodo2.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x + cardWidth + 11, yData + 7);
  yData += 15;

  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CO2 Evitado', x + cardWidth + 11, yData);
  pdf.setFontSize(14);
  pdf.setTextColor(109, 40, 217);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${(data.periodo2.co2_evitado / 1000).toFixed(2)} Ton`, x + cardWidth + 11, yData + 7);

  pdf.setFont('helvetica', 'normal');
  return y + 80;
}

function drawVariaciones(
  pdf: jsPDF,
  variacion: any,
  periodo1: any,
  periodo2: any,
  x: number,
  y: number,
  width: number
): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ANALISIS COMPARATIVO', x, y);
  y += 10;

  const cardWidth = (width - 12) / 3;

  // Card 1: Recolecciones
  const colorRec = variacion.recolecciones >= 0 ? [220, 252, 231] : [254, 226, 226];
  const textColorRec = variacion.recolecciones >= 0 ? [34, 197, 94] : [220, 38, 38];
  
  pdf.setFillColor(...colorRec);
  pdf.rect(x, y, cardWidth, 30, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Variacion en Recolecciones', x + 3, y + 7);
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColorRec);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${variacion.recolecciones >= 0 ? '^' : 'v'} ${Math.abs(variacion.recolecciones).toFixed(1)}%`, x + 3, y + 18);

  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  const difRec = periodo2.total_recolecciones - periodo1.total_recolecciones;
  pdf.text(`${difRec >= 0 ? '+' : ''}${difRec} recolecciones`, x + 3, y + 25);

  // Card 2: Kilos
  const colorKg = variacion.kilos >= 0 ? [220, 252, 231] : [254, 226, 226];
  const textColorKg = variacion.kilos >= 0 ? [34, 197, 94] : [220, 38, 38];
  
  pdf.setFillColor(...colorKg);
  pdf.rect(x + cardWidth + 6, y, cardWidth, 30, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Variacion en Kilos', x + cardWidth + 9, y + 7);
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColorKg);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${variacion.kilos >= 0 ? '^' : 'v'} ${Math.abs(variacion.kilos).toFixed(1)}%`, x + cardWidth + 9, y + 18);

  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  const difKg = periodo2.total_kilos - periodo1.total_kilos;
  pdf.text(`${difKg >= 0 ? '+' : ''}${difKg.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + cardWidth + 9, y + 25);

  // Card 3: CO2
  const colorCo2 = variacion.co2 >= 0 ? [220, 252, 231] : [254, 226, 226];
  const textColorCo2 = variacion.co2 >= 0 ? [34, 197, 94] : [220, 38, 38];
  
  pdf.setFillColor(...colorCo2);
  pdf.rect(x + (cardWidth + 6) * 2, y, cardWidth, 30, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Variacion en CO2', x + (cardWidth + 6) * 2 + 3, y + 7);
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColorCo2);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${variacion.co2 >= 0 ? '^' : 'v'} ${Math.abs(variacion.co2).toFixed(1)}%`, x + (cardWidth + 6) * 2 + 3, y + 18);

  pdf.setFontSize(8);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  const difCo2 = (periodo2.co2_evitado - periodo1.co2_evitado) / 1000;
  pdf.text(`${difCo2 >= 0 ? '+' : ''}${difCo2.toFixed(2)} Ton`, x + (cardWidth + 6) * 2 + 3, y + 25);

  pdf.setFont('helvetica', 'normal');
  return y + 35;
}

function drawComparativaKilos(
  pdf: jsPDF,
  kilos1: number,
  kilos2: number,
  x: number,
  y: number,
  width: number
): number {
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPARATIVA DE KILOS TOTALES', x, y);
  y += 10;

  const maxKilos = Math.max(kilos1, kilos2);

  // Periodo 1
  pdf.setFillColor(219, 234, 254);
  pdf.rect(x, y, width, 18, 'F');

  pdf.setFontSize(10);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Periodo 1', x + 5, y + 8);

  pdf.setFontSize(12);
  pdf.text(`${kilos1.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + width - 5, y + 8, { align: 'right' });

  // Barra periodo 1
  const barWidth1 = (width - 10) * (kilos1 / maxKilos);
  pdf.setFillColor(59, 130, 246);
  pdf.rect(x + 5, y + 11, barWidth1, 5, 'F');

  y += 20;

  // Periodo 2
  pdf.setFillColor(233, 213, 255);
  pdf.rect(x, y, width, 18, 'F');

  pdf.setFontSize(10);
  pdf.setTextColor(109, 40, 217);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Periodo 2', x + 5, y + 8);

  pdf.setFontSize(12);
  pdf.text(`${kilos2.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + width - 5, y + 8, { align: 'right' });

  // Barra periodo 2
  const barWidth2 = (width - 10) * (kilos2 / maxKilos);
  pdf.setFillColor(139, 92, 246);
  pdf.rect(x + 5, y + 11, barWidth2, 5, 'F');

  pdf.setFont('helvetica', 'normal');
  return y + 20;
}

function drawTablaMateriales(
  pdf: jsPDF,
  materiales: MaterialComparado[],
  x: number,
  y: number,
  width: number
): number {
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOP 5 MATERIALES - TABLA COMPARATIVA', x, y);
  y += 10;

  // Headers
  pdf.setFillColor(243, 244, 246);
  pdf.rect(x, y, width, 8, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(55, 65, 81);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Material', x + 2, y + 5);
  pdf.text('Periodo 1 (kg)', x + width * 0.4, y + 5);
  pdf.text('Periodo 2 (kg)', x + width * 0.6, y + 5);
  pdf.text('Variacion', x + width * 0.8, y + 5);
  
  y += 10;

  // Filas
  materiales.forEach((material, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'normal');
    pdf.text(material.nombre, x + 2, y + 5);

    // Periodo 1 - fondo azul
    pdf.setFillColor(219, 234, 254);
    pdf.rect(x + width * 0.35, y, width * 0.2, 7, 'F');
    pdf.setTextColor(30, 64, 175);
    pdf.setFont('helvetica', 'bold');
    pdf.text(material.periodo1_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x + width * 0.5, y + 5, { align: 'center' });

    // Periodo 2 - fondo morado
    pdf.setFillColor(233, 213, 255);
    pdf.rect(x + width * 0.55, y, width * 0.2, 7, 'F');
    pdf.setTextColor(109, 40, 217);
    pdf.text(material.periodo2_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x + width * 0.7, y + 5, { align: 'center' });

    // Variación
    const varColor = material.variacion >= 0 ? [34, 197, 94] : [220, 38, 38];
    pdf.setTextColor(...varColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${material.variacion >= 0 ? '^' : 'v'} ${Math.abs(material.variacion).toFixed(1)}%`, x + width * 0.9, y + 5, { align: 'center' });

    y += 9;
  });

  pdf.setFont('helvetica', 'normal');
  return y;
}