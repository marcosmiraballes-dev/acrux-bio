import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import { RecoleccionService } from '../recoleccion.service';
import { calculosAmbientalesService } from './calculos-ambientales.service';

const recoleccionService = new RecoleccionService();

export class ReportePlazaPDFService {

  /**
   * Genera el reporte PDF para una plaza
   */
  async generarReporte(
    plazaId: string | null,
    fechaInicio: string,
    fechaFin: string
  ): Promise<any> {
    
    // Crear documento PDF
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Obtener datos
    const datos = await this.obtenerDatos(plazaId, fechaInicio, fechaFin);

    // Generar páginas
    await this.generarPortada(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarKPIs(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarRankingLocales(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarDistribucionMaterial(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarDesempenoBrigadistas(doc, datos);

    // Finalizar documento
    doc.end();

    return doc;
  }

  /**
   * Obtiene todos los datos necesarios para el reporte
   */
  private async obtenerDatos(plazaId: string | null, fechaInicio: string, fechaFin: string) {
    const filters = {
      plazaId: plazaId || undefined,
      fechaInicio,
      fechaFin
    };

    const [
      stats,
      statsByTipo,
      topLocales,
      comparativaMensual,
      plazaInfo
    ] = await Promise.all([
      recoleccionService.getStats(filters),
      recoleccionService.getStatsByTipo(filters),
      recoleccionService.getTopLocales({ ...filters, limit: 15 }),
      recoleccionService.getComparativaMensual(filters),
      plazaId ? this.obtenerInfoPlaza(plazaId) : null
    ]);

    return {
      plaza: plazaInfo,
      fechaInicio,
      fechaFin,
      stats,
      statsByTipo,
      topLocales,
      comparativaMensual
    };
  }

  /**
   * Obtiene información de la plaza desde la base de datos
   */
  private async obtenerInfoPlaza(plazaId: string) {
    // Aquí harías una consulta a la BD para obtener info de la plaza
    // Por ahora retorno datos de ejemplo
    return {
      id: plazaId,
      nombre: 'Plaza Ejemplo',
      ciudad: 'Ciudad',
      estado: 'Estado'
    };
  }

  /**
   * Página 1: Portada
   */
  private async generarPortada(doc: any, datos: any) {
    const centerX = doc.page.width / 2;
    
    // Logo o nombre empresa (centrado, arriba)
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Elefantes Verdes', centerX - 120, 150);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('Sistema de Trazabilidad de Residuos', centerX - 110, 180);

    // Título del reporte (centro)
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Reporte Ejecutivo', centerX - 120, 280);

    if (datos.plaza) {
      doc.fontSize(22)
         .fillColor('#000000')
         .text(datos.plaza.nombre, centerX - 100, 320);
    } else {
      doc.fontSize(22)
         .fillColor('#000000')
         .text('Todas las Plazas', centerX - 90, 320);
    }

    // Período
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Período: ${this.formatearFecha(datos.fechaInicio)} - ${this.formatearFecha(datos.fechaFin)}`, 
             centerX - 150, 380);

    // Fecha de generación
    doc.fontSize(12)
       .text(`Generado: ${this.formatearFecha(new Date().toISOString().split('T')[0])}`, 
             centerX - 100, 420);

    // Línea decorativa
    doc.moveTo(100, 500)
       .lineTo(doc.page.width - 100, 500)
       .strokeColor('#047857')
       .lineWidth(2)
       .stroke();
  }

  /**
   * Página 2: KPIs Principales
   */
  private async generarKPIs(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Indicadores Principales', 50, 50);

    const y = 100;
    const boxWidth = (doc.page.width - 140) / 2;
    const boxHeight = 80;
    const gap = 20;

    // KPI 1: Total Recolecciones
    this.dibujarKPI(doc, 50, y, boxWidth, boxHeight, 
      'Total Recolecciones', 
      datos.stats.total_recolecciones.toLocaleString(),
      '#3B82F6');

    // KPI 2: Total Kilos
    this.dibujarKPI(doc, 50 + boxWidth + gap, y, boxWidth, boxHeight,
      'Total Kilos',
      datos.stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }),
      '#10B981');

    // KPI 3: CO₂ Evitado
    this.dibujarKPI(doc, 50, y + boxHeight + gap, boxWidth, boxHeight,
      'CO₂ Evitado (ton)',
      (datos.stats.co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 }),
      '#F59E0B');

    // KPI 4: Locales Activos
    this.dibujarKPI(doc, 50 + boxWidth + gap, y + boxHeight + gap, boxWidth, boxHeight,
      'Locales Activos',
      datos.topLocales.length.toString(),
      '#8B5CF6');

    // Variaciones vs Período Anterior
    if (datos.comparativaMensual) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('Comparativa vs Período Anterior', 50, y + (boxHeight + gap) * 2 + 40);

      const yVar = y + (boxHeight + gap) * 2 + 80;
      
      this.dibujarVariacion(doc, 50, yVar, 
        'Recolecciones', 
        datos.comparativaMensual.variacion_recolecciones || 0);
      
      this.dibujarVariacion(doc, 50, yVar + 40,
        'Kilos',
        datos.comparativaMensual.variacion_kilos || 0);
      
      this.dibujarVariacion(doc, 50, yVar + 80,
        'CO₂ Evitado',
        datos.comparativaMensual.variacion_co2 || 0);
    }
  }

  /**
   * Dibuja un KPI box
   */
  private dibujarKPI(doc: any, x: number, y: number, width: number, height: number, 
                     label: string, value: string, color: string) {
    // Box con borde
    doc.rect(x, y, width, height)
       .strokeColor(color)
       .lineWidth(2)
       .stroke();

    // Label
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(label, x + 10, y + 15, { width: width - 20 });

    // Value
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor(color)
       .text(value, x + 10, y + 35, { width: width - 20 });
  }

  /**
   * Dibuja una variación porcentual
   */
  private dibujarVariacion(doc: any, x: number, y: number, label: string, variacion: number) {
    const color = variacion >= 0 ? '#10B981' : '#EF4444';
    const simbolo = variacion >= 0 ? '↑' : '↓';
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000000')
       .text(label, x, y);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(color)
       .text(`${simbolo} ${Math.abs(variacion).toFixed(1)}%`, x + 150, y);
  }

  /**
   * Página 3: Ranking de Locales
   */
  private async generarRankingLocales(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Ranking de Locales', 50, 50);

    // Tabla
    const startY = 100;
    const rowHeight = 30;
    const colWidths = [40, 200, 150, 100, 100];

    // Headers
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000');

    let x = 50;
    doc.text('#', x, startY);
    x += colWidths[0];
    doc.text('Local', x, startY);
    x += colWidths[1];
    doc.text('Plaza', x, startY);
    x += colWidths[2];
    doc.text('Kilos', x, startY);
    x += colWidths[3];
    doc.text('CO₂ (kg)', x, startY);

    // Línea separadora
    doc.moveTo(50, startY + 15)
       .lineTo(doc.page.width - 50, startY + 15)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    // Datos
    doc.fontSize(9).font('Helvetica');

    datos.topLocales.slice(0, 15).forEach((local: any, index: number) => {
      const y = startY + 25 + (index * rowHeight);
      
      // Fondo para top 3
      if (index < 3) {
        doc.rect(50, y - 5, doc.page.width - 100, rowHeight - 5)
           .fillColor('#FEF3C7')
           .fill();
      }

      doc.fillColor('#000000');
      
      x = 50;
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
      doc.text(emoji, x, y);
      
      x += colWidths[0];
      doc.text(local.local_nombre, x, y, { width: colWidths[1] - 10 });
      
      x += colWidths[1];
      doc.text(local.plaza_nombre || 'N/A', x, y, { width: colWidths[2] - 10 });
      
      x += colWidths[2];
      doc.font('Helvetica-Bold')
         .fillColor('#047857')
         .text(local.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x, y);
      
      x += colWidths[3];
      doc.font('Helvetica')
         .fillColor('#666666')
         .text(local.co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x, y);
    });
  }

  /**
   * Página 4: Distribución por Material
   */
  private async generarDistribucionMaterial(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Distribución por Tipo de Material', 50, 50);

    // Tabla
    const startY = 100;
    const rowHeight = 30;
    const colWidths = [150, 100, 80, 100];

    // Headers
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000');

    let x = 50;
    doc.text('Material', x, startY);
    x += colWidths[0];
    doc.text('Kilos', x, startY);
    x += colWidths[1];
    doc.text('% Total', x, startY);
    x += colWidths[2];
    doc.text('CO₂ (kg)', x, startY);

    // Línea separadora
    doc.moveTo(50, startY + 15)
       .lineTo(doc.page.width - 50, startY + 15)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    // Datos
    doc.fontSize(9).font('Helvetica');

    datos.statsByTipo.forEach((tipo: any, index: number) => {
      const y = startY + 25 + (index * rowHeight);
      const porcentaje = ((tipo.total_kilos / datos.stats.total_kilos) * 100).toFixed(1);

      x = 50;
      doc.fillColor('#000000')
         .text(tipo.tipo_residuo_nombre, x, y);
      
      x += colWidths[0];
      doc.font('Helvetica-Bold')
         .fillColor('#047857')
         .text(tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x, y);
      
      x += colWidths[1];
      doc.font('Helvetica')
         .fillColor('#666666')
         .text(`${porcentaje}%`, x, y);
      
      x += colWidths[2];
      doc.text(tipo.co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 0 }), x, y);
    });
  }

  /**
   * Página 5: Desempeño por Brigadista
   */
  private async generarDesempenoBrigadistas(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Desempeño por Brigadista', 50, 50);

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Esta sección estará disponible en futuras versiones', 50, 100);

    // TODO: Implementar cuando tengamos datos de brigadistas por recolección
  }

  /**
   * Agrega una nueva página
   */
  private agregarNuevaPagina(doc: any) {
    doc.addPage();
  }

  /**
   * Formatea fecha a formato legible
   */
  private formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', options);
  }
}

export const reportePlazaPDFService = new ReportePlazaPDFService();