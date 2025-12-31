import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFOptions {
  title?: string;
  subtitle?: string;
  author?: string;
  logoPath?: string;
}

/**
 * Exporta un elemento HTML a PDF con portada y paginado
 * @param elementId - ID del elemento a capturar
 * @param fileName - Nombre del archivo PDF (sin extensión)
 * @param options - Opciones adicionales (título, subtítulo, autor, logo)
 */
export const exportToPDF = async (
  elementId: string, 
  fileName: string = 'reporte',
  options: PDFOptions = {}
) => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      console.error(`No se encontró el elemento con ID: ${elementId}`);
      alert('No se pudo encontrar el contenido para exportar');
      return;
    }

    console.log('Generando PDF...');

    // Crear PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // ===== PORTADA =====
    if (options.title) {
      // Rectángulo verde con título
      pdf.setFillColor(4, 120, 87); // Verde Elefantes Verdes
      pdf.rect(margin, 20, contentWidth, 40, 'F');
      
      // Título
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(options.title, pageWidth / 2, 45, { align: 'center' });
      
      // Subtítulo
      if (options.subtitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text(options.subtitle, pageWidth / 2, 55, { align: 'center' });
      }
      
      // Logo (si existe)
      if (options.logoPath) {
        try {
          const logoImg = new Image();
          logoImg.src = options.logoPath;
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
          });
          
          // Agregar logo centrado debajo del rectángulo verde
          const logoWidth = 40;
          const logoHeight = 40;
          const logoX = (pageWidth - logoWidth) / 2;
          const logoY = 70;
          
          // Fondo blanco para el logo (en caso de PNG con transparencia o fondo oscuro)
          pdf.setFillColor(255, 255, 255);
          pdf.rect(logoX - 2, logoY - 2, logoWidth + 4, logoHeight + 4, 'F');
          
          pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (err) {
          console.warn('No se pudo cargar el logo:', err);
        }
      }
      
      // Información adicional
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(12);
      const fecha = new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const infoY = options.logoPath ? 125 : 100;
      pdf.text(`Fecha de generación: ${fecha}`, pageWidth / 2, infoY, { align: 'center' });
      
      if (options.author) {
        pdf.text(`Generado por: ${options.author}`, pageWidth / 2, infoY + 10, { align: 'center' });
      }
      
      // Línea decorativa
      pdf.setDrawColor(4, 120, 87);
      pdf.setLineWidth(0.5);
      const lineY = options.logoPath ? 145 : 130;
      pdf.line(margin, lineY, pageWidth - margin, lineY);
      
      // Pie de página portada
      pdf.setFontSize(10);
      pdf.text('Elefantes Verdes - Estrategias Ambientales', pageWidth / 2, 280, { align: 'center' });
      pdf.text('Sistema de Trazabilidad de Residuos', pageWidth / 2, 285, { align: 'center' });
      
      // Nueva página para contenido
      pdf.addPage();
    }

    // ===== CAPTURAR CONTENIDO =====
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Altura útil por página (dejando espacio para número de página)
    const usableHeight = pageHeight - (margin * 2) - 10;
    
    // Calcular cuántas páginas se necesitan
    const totalContentPages = Math.ceil(imgHeight / usableHeight);
    const totalPages = totalContentPages + (options.title ? 1 : 0);
    
    let currentPage = options.title ? 2 : 1;
    let currentY = 0;

    // Agregar contenido página por página
    for (let i = 0; i < totalContentPages; i++) {
      if (i > 0) {
        pdf.addPage();
        currentPage++;
      }
      
      // Calcular qué porción de la imagen mostrar
      const sourceY = i * usableHeight * (canvas.height / imgHeight);
      const sourceHeight = Math.min(
        usableHeight * (canvas.height / imgHeight),
        canvas.height - sourceY
      );
      
      // Crear canvas temporal con solo la porción visible
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sourceHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.drawImage(
          canvas,
          0, sourceY,           // fuente x, y
          canvas.width, sourceHeight,  // fuente ancho, alto
          0, 0,                 // destino x, y
          canvas.width, sourceHeight   // destino ancho, alto
        );
        
        const pageImgData = tempCanvas.toDataURL('image/png');
        const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
        
        // Agregar imagen en la posición correcta
        pdf.addImage(
          pageImgData, 
          'PNG', 
          margin, 
          margin, 
          imgWidth, 
          pageImgHeight
        );
      }
      
      // Número de página
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${currentPage} de ${totalPages}`, 
        pageWidth / 2, 
        pageHeight - 5, 
        { align: 'center' }
      );
    }

    // Descargar PDF
    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`${fileName}_${timestamp}.pdf`);
    
    console.log('✅ PDF generado exitosamente');
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
  }
};

/**
 * Exporta múltiples secciones a PDF (para tabs o secciones separadas)
 * @param sections - Array de {id, title} para cada sección
 * @param fileName - Nombre del archivo
 * @param options - Opciones del PDF
 */
export const exportMultipleSectionsToPDF = async (
  sections: Array<{ id: string; title: string }>,
  fileName: string = 'reporte',
  options: PDFOptions = {}
) => {
  try {
    console.log('Generando PDF con múltiples secciones...');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentPage = 1;

    // ===== PORTADA =====
    if (options.title) {
      pdf.setFillColor(4, 120, 87);
      pdf.rect(margin, 20, contentWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(options.title, pageWidth / 2, 45, { align: 'center' });
      
      if (options.subtitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text(options.subtitle, pageWidth / 2, 55, { align: 'center' });
      }
      
      // Logo
      if (options.logoPath) {
        try {
          const logoImg = new Image();
          logoImg.src = options.logoPath;
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
          });
          
          const logoWidth = 40;
          const logoHeight = 40;
          const logoX = (pageWidth - logoWidth) / 2;
          const logoY = 70;
          
          // Fondo blanco para el logo
          pdf.setFillColor(255, 255, 255);
          pdf.rect(logoX - 2, logoY - 2, logoWidth + 4, logoHeight + 4, 'F');
          
          pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } catch (err) {
          console.warn('No se pudo cargar el logo');
        }
      }
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(12);
      const fecha = new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const infoY = options.logoPath ? 125 : 100;
      pdf.text(`Fecha: ${fecha}`, pageWidth / 2, infoY, { align: 'center' });
      
      pdf.setDrawColor(4, 120, 87);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 130, pageWidth - margin, 130);
      
      pdf.setFontSize(10);
      pdf.text('Elefantes Verdes - Estrategias Ambientales', pageWidth / 2, 280, { align: 'center' });
      
      pdf.addPage();
      currentPage++;
    }

    // ===== PROCESAR CADA SECCIÓN =====
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const element = document.getElementById(section.id);
      
      if (!element) {
        console.warn(`⚠️ No se encontró la sección: ${section.id}`);
        continue;
      }

      if (i > 0) {
        pdf.addPage();
        currentPage++;
      }
      
      pdf.setFontSize(16);
      pdf.setTextColor(4, 120, 87);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.title, margin, margin + 5);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(
        imgData, 
        'PNG', 
        margin, 
        margin + 15, 
        imgWidth, 
        Math.min(imgHeight, pageHeight - margin - 20)
      );
    }

    const timestamp = new Date().toISOString().split('T')[0];
    pdf.save(`${fileName}_${timestamp}.pdf`);
    
    console.log('✅ PDF con múltiples secciones generado');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al generar el PDF');
  }
};