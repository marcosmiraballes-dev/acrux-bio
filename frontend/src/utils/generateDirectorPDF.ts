import jsPDF from 'jspdf';

interface DirectorPDFData {
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
  // Tendencia mensual
  tendencia: Array<{
    mes: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  // Comparativa por plaza
  comparativaPlazas: Array<{
    plaza_nombre: string;
    total_recolecciones: number;
    total_kilos: number;
    co2_evitado: number;
  }>;
  // Top locales
  topLocales: Array<{
    local_nombre: string;
    plaza_nombre: string;
    total_kilos: number;
    co2_evitado: number;
  }>;
  // Comparativas temporales
  comparativaMensual: any;
  comparativaAnual: any;
  comparativaTrimestral: any;
  // Info adicional
  plazaSeleccionada?: string;
  userName?: string;
}

// Mapeo de emojis (para texto)
const EMOJI_MAP: { [key: string]: string } = {
  'Orgánico': '🍌',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🍾',
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '📦',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

export const generateDirectorPDF = async (data: DirectorPDFData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let currentPage = 1;

  // ===== PORTADA =====
  await createCoverPage(pdf, data, pageWidth, pageHeight, margin, contentWidth);
  
  pdf.addPage();
  currentPage = 2;

  // ===== TAB 1: RESUMEN GENERAL =====
  let yPos = margin;
  
  // Título del tab
  pdf.setFontSize(18);
  pdf.setTextColor(4, 120, 87);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMEN GENERAL', margin, yPos);
  yPos += 15;

  // KPIs (3 cards horizontales)
  yPos = drawKPIs(pdf, data.stats, margin, yPos, contentWidth);
  yPos += 10;

  // Grid de materiales (primeros 6)
  yPos = drawMaterialesGrid(pdf, data.statsByTipo.slice(0, 6), margin, yPos, contentWidth);
  yPos += 10;

  // Verificar si necesitamos nueva página
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    currentPage++;
    yPos = margin;
  }

  // Tendencia Mensual (cards con barras)
  yPos = drawTendenciaMensual(pdf, data.tendencia.slice(0, 6), margin, yPos, contentWidth);
  yPos += 10;

  // Verificar nueva página
  if (yPos > pageHeight - 60) {
    pdf.addPage();
    currentPage++;
    yPos = margin;
  }

  // Por Plaza (cards con barras)
  yPos = drawPorPlaza(pdf, data.comparativaPlazas, margin, yPos, contentWidth);
  yPos += 10;

  // Verificar nueva página antes de Top 10
  if (yPos > pageHeight - 120) {
    pdf.addPage();
    currentPage++;
    yPos = margin;
  }

  // Top 10 Locales (tabla)
  yPos = drawTopLocales(pdf, data.topLocales, margin, yPos, contentWidth);

  // ===== TAB 2: COMPARATIVAS =====
  pdf.addPage();
  currentPage++;
  yPos = margin;

  pdf.setFontSize(18);
  pdf.setTextColor(4, 120, 87);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPARATIVAS TEMPORALES', margin, yPos);
  yPos += 15;

  // Comparativas (3 cards)
  yPos = drawComparativas(pdf, data.comparativaMensual, data.comparativaAnual, data.comparativaTrimestral, margin, yPos, contentWidth);

  // ===== TAB 3: RANKINGS =====
  pdf.addPage();
  currentPage++;
  yPos = margin;

  pdf.setFontSize(18);
  pdf.setTextColor(4, 120, 87);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RANKINGS', margin, yPos);
  yPos += 15;

  // Top 10 Locales (repetimos)
  yPos = drawTopLocales(pdf, data.topLocales, margin, yPos, contentWidth);
  yPos += 10;

  // Top 5 Materiales
  yPos = drawTop5Materiales(pdf, data.statsByTipo.slice(0, 5), data.stats.total_kilos, margin, yPos, contentWidth);

  // Números de página en todas las páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  // Descargar
  const timestamp = new Date().toISOString().split('T')[0];
  pdf.save(`Dashboard_Director_${timestamp}.pdf`);
};

// ===== FUNCIONES AUXILIARES =====

async function createCoverPage(
  pdf: jsPDF,
  data: DirectorPDFData,
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
  pdf.text('Dashboard Ejecutivo', pageWidth / 2, 45, { align: 'center' });

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
      setTimeout(reject, 2000); // timeout 2s
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

function drawKPIs(pdf: jsPDF, stats: any, x: number, y: number, width: number): number {
  const kpiWidth = width / 3 - 4;
  
  // KPI 1: Recolecciones
  pdf.setFillColor(220, 252, 231); // Verde muy claro
  pdf.rect(x, y, kpiWidth, 25, 'F');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99); // Gris oscuro
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Recolecciones', x + 5, y + 8);
  pdf.setFontSize(20);
  pdf.setTextColor(4, 120, 87); // Verde
  pdf.setFont('helvetica', 'bold');
  pdf.text(stats.total_recolecciones.toLocaleString('es-MX'), x + 5, y + 20);

  // KPI 2: Kilos
  pdf.setFillColor(220, 252, 231); // Verde muy claro
  pdf.rect(x + kpiWidth + 6, y, kpiWidth, 25, 'F');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99); // Gris oscuro
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Kilos', x + kpiWidth + 11, y + 8);
  pdf.setFontSize(20);
  pdf.setTextColor(4, 120, 87); // Verde
  pdf.setFont('helvetica', 'bold');
  pdf.text(stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' kg', x + kpiWidth + 11, y + 20);

  // KPI 3: CO2
  pdf.setFillColor(219, 234, 254); // Azul muy claro
  pdf.rect(x + (kpiWidth + 6) * 2, y, kpiWidth, 25, 'F');
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99); // Gris oscuro
  pdf.setFont('helvetica', 'normal');
  pdf.text('CO2 Evitado (Ton)', x + (kpiWidth + 6) * 2 + 5, y + 8);
  pdf.setFontSize(20);
  pdf.setTextColor(59, 130, 246); // Azul
  pdf.setFont('helvetica', 'bold');
  const co2Ton = (stats.co2_evitado / 1000).toFixed(2);
  pdf.text(co2Ton, x + (kpiWidth + 6) * 2 + 5, y + 20);

  pdf.setFont('helvetica', 'normal');
  return y + 30;
}

function drawMaterialesGrid(pdf: jsPDF, materiales: any[], x: number, y: number, width: number): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55); // Gris muy oscuro
  pdf.setFont('helvetica', 'bold');
  pdf.text('MATERIALES RECOLECTADOS', x, y);
  y += 8;

  const cardWidth = width / 3 - 4;
  const cardHeight = 20;
  let currentX = x;
  let currentY = y;

  materiales.forEach((material, index) => {
    if (index > 0 && index % 3 === 0) {
      currentX = x;
      currentY += cardHeight + 3;
    }

    // Card
    pdf.setFillColor(243, 244, 246); // Gris claro
    pdf.rect(currentX, currentY, cardWidth, cardHeight, 'F');

    // Nombre (sin emoji)
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81); // Gris oscuro
    pdf.setFont('helvetica', 'bold');
    pdf.text(material.tipo_residuo_nombre, currentX + 3, currentY + 7);

    // Kilos
    pdf.setFontSize(16);
    pdf.setTextColor(4, 120, 87); // Verde
    pdf.setFont('helvetica', 'bold');
    const kilos = material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 });
    pdf.text(kilos, currentX + 3, currentY + 16);

    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128); // Gris medio
    pdf.setFont('helvetica', 'normal');
    pdf.text('kg', currentX + 3 + pdf.getTextWidth(kilos) + 2, currentY + 16);

    currentX += cardWidth + 6;
  });

  pdf.setFont('helvetica', 'normal');
  return currentY + cardHeight + 5;
}

function drawTendenciaMensual(pdf: jsPDF, tendencia: any[], x: number, y: number, width: number): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55); // Gris muy oscuro
  pdf.setFont('helvetica', 'bold');
  pdf.text('TENDENCIA MENSUAL', x, y);
  y += 8;

  const maxKilos = Math.max(...tendencia.map(m => m.total_kilos || 0));

  tendencia.forEach((mes, index) => {
    const porcentaje = ((mes.total_kilos || 0) / maxKilos) * 100;
    const barWidth = (width * 0.6) * (porcentaje / 100);

    // Fondo gris
    pdf.setFillColor(229, 231, 235); // Gris claro
    pdf.rect(x + 30, y, width * 0.6, 6, 'F');

    // Barra verde
    pdf.setFillColor(4, 120, 87); // Verde
    pdf.rect(x + 30, y, barWidth, 6, 'F');

    // Ranking
    pdf.setFontSize(9);
    pdf.setTextColor(156, 163, 175); // Gris medio
    pdf.setFont('helvetica', 'bold');
    pdf.text(`#${index + 1}`, x, y + 4);

    // Mes
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text(mes.mes, x + 8, y + 4);

    // Kilos
    pdf.setFontSize(10);
    pdf.setTextColor(4, 120, 87); // Verde
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${mes.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + width * 0.6 + 35, y + 4);

    y += 9;
  });

  pdf.setFont('helvetica', 'normal');
  return y + 3;
}

function drawPorPlaza(pdf: jsPDF, plazas: any[], x: number, y: number, width: number): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55); // Gris muy oscuro
  pdf.setFont('helvetica', 'bold');
  pdf.text('POR PLAZA', x, y);
  y += 8;

  const sortedPlazas = [...plazas].sort((a, b) => (b.total_kilos || 0) - (a.total_kilos || 0));
  const maxKilos = Math.max(...sortedPlazas.map(p => p.total_kilos || 0));

  sortedPlazas.forEach((plaza, index) => {
    const porcentaje = ((plaza.total_kilos || 0) / maxKilos) * 100;
    const barWidth = (width * 0.6) * (porcentaje / 100);

    // Destacar primera
    if (index === 0) {
      pdf.setFillColor(220, 252, 231); // Verde muy claro
      pdf.rect(x - 2, y - 3, width + 4, 12, 'F');
    }

    // Fondo barra
    pdf.setFillColor(229, 231, 235); // Gris claro
    pdf.rect(x + 60, y, width * 0.5, 7, 'F');

    // Barra
    if (index === 0) {
      pdf.setFillColor(4, 120, 87); // Verde
    } else {
      pdf.setFillColor(107, 114, 128); // Gris medio
    }
    pdf.rect(x + 60, y, barWidth * 0.83, 7, 'F');

    // Ranking
    pdf.setFontSize(10);
    if (index === 0) {
      pdf.setTextColor(4, 120, 87); // Verde
    } else {
      pdf.setTextColor(156, 163, 175); // Gris medio
    }
    pdf.setFont('helvetica', 'bold');
    pdf.text(`#${index + 1}`, x, y + 5);

    // Nombre plaza
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55); // Gris muy oscuro
    pdf.setFont('helvetica', index === 0 ? 'bold' : 'normal');
    pdf.text(plaza.plaza_nombre.substring(0, 25), x + 10, y + 5);

    // Kilos
    pdf.setFontSize(11);
    pdf.setTextColor(4, 120, 87); // Verde
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${plaza.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + width * 0.5 + 65, y + 5);

    y += 11;
  });

  pdf.setFont('helvetica', 'normal');
  return y + 3;
}

function drawTopLocales(pdf: jsPDF, locales: any[], x: number, y: number, width: number): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55); // Gris muy oscuro
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOP 10 LOCALES', x, y);
  y += 8;

  // Headers
  pdf.setFillColor(243, 244, 246); // Gris claro
  pdf.rect(x, y, width, 8, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(55, 65, 81); // Gris oscuro
  pdf.setFont('helvetica', 'bold');
  pdf.text('Pos', x + 2, y + 5);
  pdf.text('Local', x + 15, y + 5);
  pdf.text('Plaza', x + 80, y + 5);
  pdf.text('Kilos', x + 130, y + 5);
  pdf.text('CO2 (kg)', x + 165, y + 5);
  y += 10;

  // Filas
  locales.forEach((local, index) => {
    if (index < 3) {
      pdf.setFillColor(254, 249, 195); // Amarillo muy claro
      pdf.rect(x, y - 2, width, 7, 'F');
    }

    pdf.setFontSize(8);
    if (index < 3) {
      pdf.setTextColor(202, 138, 4); // Amarillo oscuro
    } else {
      pdf.setTextColor(156, 163, 175); // Gris medio
    }
    pdf.setFont('helvetica', 'bold');
    // Sin emojis de medallas
    pdf.text(`#${index + 1}`, x + 2, y + 3);

    pdf.setFontSize(8);
    pdf.setTextColor(31, 41, 55); // Gris muy oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text(local.local_nombre.substring(0, 30), x + 15, y + 3);
    pdf.text(local.plaza_nombre.substring(0, 22), x + 80, y + 3);

    pdf.setFontSize(9);
    pdf.setTextColor(4, 120, 87); // Verde
    pdf.setFont('helvetica', 'bold');
    pdf.text(local.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x + 130, y + 3);

    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128); // Gris medio
    pdf.setFont('helvetica', 'normal');
    pdf.text(local.co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 1 }), x + 165, y + 3);

    y += 7;
  });

  pdf.setFont('helvetica', 'normal');
  return y + 3;
}

function drawComparativas(
  pdf: jsPDF,
  mensual: any,
  anual: any,
  trimestral: any,
  x: number,
  y: number,
  width: number
): number {
  // Mensual
  if (mensual) {
    pdf.setFillColor(219, 234, 254); // Azul muy claro
    pdf.rect(x, y, width, 30, 'F');

    pdf.setFontSize(12);
    pdf.setTextColor(59, 130, 246); // Azul
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPARATIVA MENSUAL', x + 5, y + 8);

    const w3 = width / 3;
    
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Mes Actual', x + 5, y + 15);
    pdf.setFontSize(14);
    pdf.setTextColor(59, 130, 246); // Azul
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(mensual.mes_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + 5, y + 24);

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Mes Anterior', x + w3 + 5, y + 15);
    pdf.setFontSize(14);
    pdf.setTextColor(107, 114, 128); // Gris medio
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(mensual.mes_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + w3 + 5, y + 24);

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Variacion', x + w3 * 2 + 5, y + 15);
    const variacion = mensual.variacion_kilos || 0;
    pdf.setFontSize(14);
    if (variacion >= 0) {
      pdf.setTextColor(34, 197, 94); // Verde
      pdf.setFont('helvetica', 'bold');
      pdf.text(`^ ${Math.abs(variacion).toFixed(1)}%`, x + w3 * 2 + 5, y + 24);
    } else {
      pdf.setTextColor(220, 38, 38); // Rojo
      pdf.setFont('helvetica', 'bold');
      pdf.text(`v ${Math.abs(variacion).toFixed(1)}%`, x + w3 * 2 + 5, y + 24);
    }

    y += 35;
  }

  // Anual
  if (anual) {
    pdf.setFillColor(233, 213, 255); // Morado muy claro
    pdf.rect(x, y, width, 30, 'F');

    pdf.setFontSize(12);
    pdf.setTextColor(139, 92, 246); // Morado
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPARATIVA ANUAL', x + 5, y + 8);

    const w3 = width / 3;
    
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Año Actual', x + 5, y + 15);
    pdf.setFontSize(14);
    pdf.setTextColor(139, 92, 246); // Morado
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(anual.anio_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + 5, y + 24);

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Año Anterior', x + w3 + 5, y + 15);
    pdf.setFontSize(14);
    pdf.setTextColor(107, 114, 128); // Gris medio
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(anual.anio_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + w3 + 5, y + 24);

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Variacion', x + w3 * 2 + 5, y + 15);
    const variacion = anual.variacion_kilos || 0;
    pdf.setFontSize(14);
    if (variacion >= 0) {
      pdf.setTextColor(34, 197, 94); // Verde
      pdf.setFont('helvetica', 'bold');
      pdf.text(`^ ${Math.abs(variacion).toFixed(1)}%`, x + w3 * 2 + 5, y + 24);
    } else {
      pdf.setTextColor(220, 38, 38); // Rojo
      pdf.setFont('helvetica', 'bold');
      pdf.text(`v ${Math.abs(variacion).toFixed(1)}%`, x + w3 * 2 + 5, y + 24);
    }

    y += 35;
  }

  // Trimestral
  if (trimestral) {
    pdf.setFillColor(254, 243, 199); // Naranja muy claro
    pdf.rect(x, y, width, 30, 'F');

    pdf.setFontSize(12);
    pdf.setTextColor(245, 158, 11); // Naranja
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPARATIVA TRIMESTRAL', x + 5, y + 8);

    const w3 = width / 3;
    
    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Trimestre Actual', x + 5, y + 15);
    pdf.setFontSize(14);
    pdf.setTextColor(245, 158, 11); // Naranja
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(trimestral.trimestre_actual_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + 5, y + 24);

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Trimestre Anterior', x + w3 + 5, y + 15);
    pdf.setFontSize(14);
    pdf.setTextColor(107, 114, 128); // Gris medio
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${(trimestral.trimestre_anterior_total_kilos || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + w3 + 5, y + 24);

    pdf.setFontSize(9);
    pdf.setTextColor(75, 85, 99); // Gris oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text('Variacion', x + w3 * 2 + 5, y + 15);
    const variacion = trimestral.variacion_kilos || 0;
    pdf.setFontSize(14);
    if (variacion >= 0) {
      pdf.setTextColor(34, 197, 94); // Verde
      pdf.setFont('helvetica', 'bold');
      pdf.text(`^ ${Math.abs(variacion).toFixed(1)}%`, x + w3 * 2 + 5, y + 24);
    } else {
      pdf.setTextColor(220, 38, 38); // Rojo
      pdf.setFont('helvetica', 'bold');
      pdf.text(`v ${Math.abs(variacion).toFixed(1)}%`, x + w3 * 2 + 5, y + 24);
    }

    y += 35;
  }

  pdf.setFont('helvetica', 'normal');
  return y;
}

function drawTop5Materiales(pdf: jsPDF, materiales: any[], totalKilos: number, x: number, y: number, width: number): number {
  pdf.setFontSize(14);
  pdf.setTextColor(31, 41, 55); // Gris muy oscuro
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOP 5 MATERIALES', x, y);
  y += 10;

  materiales.forEach((material, index) => {
    const porcentaje = ((material.total_kilos || 0) / totalKilos) * 100;
    const barWidth = width * 0.5 * (porcentaje / 100);

    // Fondo gris
    pdf.setFillColor(243, 244, 246); // Gris claro
    pdf.rect(x + 50, y, width * 0.5, 8, 'F');

    // Barra de color
    pdf.setFillColor(4, 120, 87); // Verde
    pdf.rect(x + 50, y, barWidth, 8, 'F');

    // Ranking
    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175); // Gris medio
    pdf.setFont('helvetica', 'bold');
    pdf.text(`#${index + 1}`, x, y + 6);

    // Nombre (sin emoji)
    pdf.setFontSize(9);
    pdf.setTextColor(31, 41, 55); // Gris muy oscuro
    pdf.setFont('helvetica', 'normal');
    pdf.text(material.tipo_residuo_nombre, x + 10, y + 6);

    // Kilos
    pdf.setFontSize(11);
    pdf.setTextColor(4, 120, 87); // Verde
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, x + width * 0.5 + 55, y + 6);

    // Porcentaje
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128); // Gris medio
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${porcentaje.toFixed(1)}%`, x + width * 0.5 + 105, y + 6);

    y += 12;
  });

  pdf.setFont('helvetica', 'normal');
  return y;
}