import jsPDF from 'jspdf';

interface GraficasResiduosPDFData {
  // Stats generales
  stats: {
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  };
  // Por tipo de residuo
  statsByTipo: Array<{
    tipo_residuo_nombre: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  // Info adicional
  plazaSeleccionada?: string;
  userName?: string;
}

export const generateGraficasResiduosPDF = async (data: GraficasResiduosPDFData) => {
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
  pdf.text('DISTRIBUCION POR TIPO DE MATERIAL', margin, yPos);
  yPos += 15;

  // Distribución con barras (tabla)
  yPos = drawDistribucionBarras(pdf, data.statsByTipo, data.stats.total_kilos, margin, yPos, contentWidth);
  yPos += 10;

  // Verificar si necesitamos nueva página
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    yPos = margin;
  }

  // Impacto Ambiental (3 cards)
  yPos = drawImpactoAmbiental(pdf, data.stats, margin, yPos, contentWidth);
  yPos += 10;

  // Verificar si necesitamos nueva página
  if (yPos > pageHeight - 100) {
    pdf.addPage();
    yPos = margin;
  }

  // Detalle de Todos los Materiales (grid)
  yPos = drawDetalleMateriales(pdf, data.statsByTipo, data.stats.total_kilos, margin, yPos, contentWidth);

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
  pdf.save(`Graficas_Residuos_${timestamp}.pdf`);
};

// ===== FUNCIONES AUXILIARES =====

async function createCoverPage(
  pdf: jsPDF,
  data: GraficasResiduosPDFData,
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
  pdf.text('Graficas por Residuo', pageWidth / 2, 45, { align: 'center' });

  // Subtítulo
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const subtitle = `Elefantes Verdes - ${data.plazaSeleccionada || 'Todas las Plazas'}`;
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

function drawDistribucionBarras(
  pdf: jsPDF,
  statsByTipo: any[],
  totalKilos: number,
  x: number,
  y: number,
  width: number
): number {
  const sortedStats = [...statsByTipo].sort((a, b) => (b.total_kilos || 0) - (a.total_kilos || 0));
  const maxKilos = Math.max(...sortedStats.map(s => s.total_kilos || 0));

  sortedStats.forEach((tipo, index) => {
    const porcentaje = ((tipo.total_kilos || 0) / maxKilos) * 100;
    const porcentajeTotal = ((tipo.total_kilos || 0) / totalKilos) * 100;
    const barWidth = (width * 0.6) * (porcentaje / 100);

    // Fondo gris claro
    pdf.setFillColor(249, 250, 251);
    pdf.rect(x - 2, y - 2, width + 4, 12, 'F');

    // Ranking
    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`#${index + 1}`, x, y + 5);

    // Nombre del tipo
    pdf.setFontSize(10);
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tipo.tipo_residuo_nombre, x + 10, y + 5);

    // Barra de progreso - fondo
    pdf.setFillColor(229, 231, 235);
    pdf.rect(x + 60, y + 1, width * 0.4, 6, 'F');

    // Barra de progreso - verde
    pdf.setFillColor(4, 120, 87);
    pdf.rect(x + 60, y + 1, (width * 0.4) * (porcentaje / 100), 6, 'F');

    // Kilos
    pdf.setFontSize(11);
    pdf.setTextColor(4, 120, 87);
    pdf.setFont('helvetica', 'bold');
    const kilosText = `${tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`;
    pdf.text(kilosText, x + width * 0.4 + 65, y + 5);

    // Porcentaje del total
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${porcentajeTotal.toFixed(1)}%`, x + width * 0.4 + 105, y + 5);

    y += 13;
  });

  return y;
}

function drawImpactoAmbiental(pdf: jsPDF, stats: any, x: number, y: number, width: number): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IMPACTO AMBIENTAL', x, y);
  y += 8;

  const cardWidth = width / 3 - 4;

  // Card 1: CO2
  pdf.setFillColor(219, 234, 254);
  pdf.rect(x, y, cardWidth, 25, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('CO2 Total Evitado', x + 5, y + 8);
  pdf.setFontSize(18);
  pdf.setTextColor(59, 130, 246);
  pdf.setFont('helvetica', 'bold');
  const co2Ton = (stats.co2_evitado / 1000).toFixed(2);
  pdf.text(`${co2Ton} Ton`, x + 5, y + 20);

  // Card 2: Kilos
  pdf.setFillColor(220, 252, 231);
  pdf.rect(x + cardWidth + 6, y, cardWidth, 25, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Kilos Procesados', x + cardWidth + 11, y + 8);
  pdf.setFontSize(18);
  pdf.setTextColor(34, 197, 94);
  pdf.setFont('helvetica', 'bold');
  pdf.text(stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x + cardWidth + 11, y + 20);

  // Card 3: Recolecciones
  pdf.setFillColor(233, 213, 255);
  pdf.rect(x + (cardWidth + 6) * 2, y, cardWidth, 25, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Recolecciones', x + (cardWidth + 6) * 2 + 5, y + 8);
  pdf.setFontSize(18);
  pdf.setTextColor(139, 92, 246);
  pdf.setFont('helvetica', 'bold');
  pdf.text(stats.total_recolecciones.toLocaleString('es-MX'), x + (cardWidth + 6) * 2 + 5, y + 20);

  pdf.setFont('helvetica', 'normal');
  return y + 30;
}

function drawDetalleMateriales(
  pdf: jsPDF,
  statsByTipo: any[],
  totalKilos: number,
  x: number,
  y: number,
  width: number
): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DETALLE DE TODOS LOS MATERIALES', x, y);
  y += 10;

  const cardWidth = width / 3 - 4;
  const cardHeight = 22;
  let currentX = x;
  let currentY = y;
  let cardCount = 0;

  statsByTipo.forEach((tipo, index) => {
    // Verificar si necesitamos nueva página
    if (currentY > 250) {
      pdf.addPage();
      currentY = 15;
      currentX = x;
      cardCount = 0;
    }

    // Si es múltiplo de 3, nueva fila
    if (cardCount > 0 && cardCount % 3 === 0) {
      currentX = x;
      currentY += cardHeight + 3;
    }

    const porcentaje = ((tipo.total_kilos || 0) / totalKilos) * 100;

    // Card fondo
    pdf.setFillColor(243, 244, 246);
    pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F');

    // Nombre
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tipo.tipo_residuo_nombre, currentX + 3, currentY + 6);

    // Total Kilos label
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Total Kilos', currentX + 3, currentY + 11);

    // Kilos valor
    pdf.setFontSize(14);
    pdf.setTextColor(4, 120, 87);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), currentX + 3, currentY + 18);

    // % del total
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${porcentaje.toFixed(1)}% del total`, currentX + cardWidth - 3, currentY + 18, { align: 'right' });

    currentX += cardWidth + 6;
    cardCount++;
  });

  pdf.setFont('helvetica', 'normal');
  return currentY + cardHeight + 5;
}