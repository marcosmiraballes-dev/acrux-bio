/**
 * SERVICIO PDF CON JSPDF - 100% CONFIABLE
 * Diseño profesional sin corrupción de archivos
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Request, Response } from 'express';
import { RecoleccionService } from '../services/recoleccion.service';

const recoleccionService = new RecoleccionService();

export class ReportePDFServiceSimple {
  
  // Colores corporativos
  private colors = {
    primary: [4, 120, 87],        // #047857
    primaryLight: [16, 185, 129],  // #10B981
    secondary: [5, 150, 105],      // #059669
    gray: [107, 114, 128],         // #6B7280
    grayLight: [156, 163, 175],    // #9CA3AF
    grayDark: [31, 41, 55],        // #1F2937
    background: [249, 250, 251],   // #F9FAFB
    white: [255, 255, 255],
    gold: [245, 158, 11],          // #F59E0B
    silver: [156, 163, 175],       // #9CA3AF
    bronze: [205, 127, 50]         // #CD7F32
  };
  
  /**
   * Agregar portada profesional
   */
  private agregarPortada(doc: jsPDF, filtros: any) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Fondo verde
    doc.setFillColor(...this.colors.primary);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');
    doc.text('NUESTRO IMPACTO', pageWidth / 2, 80, { align: 'center' });
    doc.text('AMBIENTAL', pageWidth / 2, 110, { align: 'center' });
    
    // Período
    if (filtros.fecha_desde && filtros.fecha_hasta) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      const fechaDesde = new Date(filtros.fecha_desde).toLocaleDateString('es-MX', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      const fechaHasta = new Date(filtros.fecha_hasta).toLocaleDateString('es-MX', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      doc.text(`${fechaDesde} - ${fechaHasta}`, pageWidth / 2, 140, { align: 'center' });
    }
    
    // Empresa
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Elefantes Verdes', pageWidth / 2, pageHeight - 80, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Quintana Roo, México', pageWidth / 2, pageHeight - 60, { align: 'center' });
    
    // Fecha generación
    doc.setFontSize(10);
    doc.text(
      `Generado: ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      pageWidth / 2, 
      pageHeight - 30, 
      { align: 'center' }
    );
  }
  
  /**
   * Agregar header de página
   */
  private agregarHeader(doc: jsPDF, titulo: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setTextColor(...this.colors.primary);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, 20, 25);
    
    // Línea separadora
    doc.setDrawColor(...this.colors.primary);
    doc.setLineWidth(2);
    doc.line(20, 30, pageWidth - 20, 30);
  }
  
  /**
   * Agregar footer de página
   */
  private agregarFooter(doc: jsPDF, numeroPagina: number, totalPaginas: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setDrawColor(...this.colors.grayLight);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    
    doc.setTextColor(...this.colors.gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Página ${numeroPagina} de ${totalPaginas}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - 20, pageHeight - 12, { align: 'right' });
  }
  
  /**
   * Dibujar KPI card
   */
  private dibujarKPI(doc: jsPDF, x: number, y: number, width: number, label: string, value: string) {
    // Box con borde
    doc.setFillColor(...this.colors.background);
    doc.setDrawColor(...this.colors.grayLight);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, 30, 3, 3, 'FD');
    
    // Borde izquierdo verde
    doc.setFillColor(...this.colors.primary);
    doc.rect(x, y, 3, 30, 'F');
    
    // Label
    doc.setTextColor(...this.colors.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x + 8, y + 10);
    
    // Value
    doc.setTextColor(...this.colors.primary);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 8, y + 23);
  }
  
  /**
   * Dibujar box de impacto
   */
  private dibujarImpacto(doc: jsPDF, y: number, icono: string, titulo: string, valor: string, detalle: string) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...this.colors.grayLight);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, y, pageWidth - 40, 22, 3, 3, 'FD');
    
    // Círculo del ícono
    doc.setFillColor(...this.colors.primary);
    doc.circle(35, y + 11, 8, 'F');
    
    // Ícono
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(icono, 35, y + 14, { align: 'center' });
    
    // Título
    doc.setTextColor(...this.colors.gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo, 50, y + 8);
    
    // Valor
    doc.setTextColor(...this.colors.primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(valor, 50, y + 17);
    
    // Detalle
    doc.setTextColor(...this.colors.grayLight);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(detalle, pageWidth - 25, y + 14, { align: 'right' });
  }
  
  /**
   * Dibujar barra de progreso
   */
  private dibujarBarra(doc: jsPDF, x: number, y: number, width: number, porcentaje: number, color: string) {
    // Fondo
    doc.setFillColor(...this.colors.grayLight);
    doc.roundedRect(x, y, width, 6, 2, 2, 'F');
    
    // Barra
    const barWidth = (width * porcentaje) / 100;
    const rgb = this.hexToRgb(color);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(x, y, barWidth, 6, 2, 2, 'F');
    
    // Porcentaje
    doc.setTextColor(...this.colors.gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${porcentaje.toFixed(1)}%`, x + width + 5, y + 5);
  }
  
  /**
   * Convertir HEX a RGB
   */
  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 4, g: 120, b: 87 };
  }
  
  /**
   * Generar reporte CLIENTES
   */
  async generarReporteClientes(req: Request, res: Response) {
    try {
      console.log('🔄 Generando reporte CLIENTES con jsPDF...');
      
      const filters = {
        plaza_id: req.query.plaza_id as string | undefined,
        fecha_desde: req.query.fecha_desde as string | undefined,
        fecha_hasta: req.query.fecha_hasta as string | undefined
      };

      const [stats, statsByTipo, topLocales] = await Promise.all([
        recoleccionService.getStats(filters),
        recoleccionService.getStatsByTipo(filters),
        recoleccionService.getTopLocales(filters)
      ]);
      
      const co2Evitado = stats.co2_evitado || 0;
      const arbolesEquivalentes = Math.round((co2Evitado / 1000) * 45);
      const kmAuto = Math.round((co2Evitado / 1000) * 8333);
      const energiaKwh = Math.round(stats.total_kilos * 1.17);
      const aguaLitros = Math.round(stats.total_kilos * 4.38);
      
      // Crear PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // ==================== PORTADA ====================
      this.agregarPortada(doc, filters);
      
      // ==================== PÁGINA 2: PANORAMA GENERAL ====================
      doc.addPage();
      this.agregarHeader(doc, 'El Panorama General');
      
      // KPIs en grid 2x2
      const kpiWidth = (pageWidth - 50) / 2;
      this.dibujarKPI(doc, 20, 45, kpiWidth, 'KG Materiales Reciclados', 
        Math.round(stats.total_kilos).toLocaleString('es-MX'));
      this.dibujarKPI(doc, 20 + kpiWidth + 10, 45, kpiWidth, 'TON CO₂ Evitado', 
        (co2Evitado / 1000).toFixed(1));
      this.dibujarKPI(doc, 20, 80, kpiWidth, 'Recolecciones Realizadas', 
        stats.total_recolecciones.toLocaleString('es-MX'));
      this.dibujarKPI(doc, 20 + kpiWidth + 10, 80, kpiWidth, 'Plazas Operando', 
        new Set(topLocales.map((l: any) => l.plaza_nombre)).size.toString());
      
      this.agregarFooter(doc, 1, 4);
      
      // ==================== PÁGINA 3: NUESTRO IMPACTO ====================
      doc.addPage();
      this.agregarHeader(doc, 'Nuestro Impacto Equivale a:');
      
      let impactoY = 50;
      this.dibujarImpacto(doc, impactoY, 'A', 'Árboles Plantados', 
        arbolesEquivalentes.toLocaleString('es-MX'), 'CO₂ capturado en 1 año');
      
      impactoY += 28;
      this.dibujarImpacto(doc, impactoY, 'K', 'Kilómetros NO Recorridos', 
        kmAuto.toLocaleString('es-MX'), 'en auto promedio');
      
      impactoY += 28;
      this.dibujarImpacto(doc, impactoY, 'E', 'Energía Ahorrada', 
        `${energiaKwh.toLocaleString('es-MX')} kWh`, 'producción evitada');
      
      impactoY += 28;
      this.dibujarImpacto(doc, impactoY, 'A', 'Agua Ahorrada', 
        `${aguaLitros.toLocaleString('es-MX')} L`, 'en producción de materiales');
      
      this.agregarFooter(doc, 2, 4);
      
      // ==================== PÁGINA 4: DESGLOSE POR MATERIAL ====================
      doc.addPage();
      this.agregarHeader(doc, 'Desglose por Material');
      
      let materialY = 50;
      statsByTipo.slice(0, 6).forEach((tipo: any) => {
        const tipoNombre = tipo.tipo_residuo_nombre || tipo.tipo_residuo || 'Desconocido';
        const porcentaje = ((tipo.total_kilos / stats.total_kilos) * 100);
        const factorCO2 = tipo.factor_co2_promedio || (tipo.co2_evitado / tipo.total_kilos) || 0;
        const co2Total = ((tipo.total_kilos * factorCO2) / 1000).toFixed(2);
        
        // Box
        doc.setFillColor(...this.colors.background);
        doc.setDrawColor(...this.colors.grayLight);
        doc.roundedRect(20, materialY, pageWidth - 40, 25, 3, 3, 'FD');
        
        // Borde lateral con color
        const rgb = this.hexToRgb(tipo.tipo_residuo_color || '#047857');
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(20, materialY, 3, 25, 'F');
        
        // Nombre
        doc.setTextColor(...this.colors.grayDark);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(tipoNombre.toUpperCase(), 28, materialY + 8);
        
        // Barra
        this.dibujarBarra(doc, 28, materialY + 12, 120, porcentaje, tipo.tipo_residuo_color || '#047857');
        
        // Kilos
        doc.setTextColor(...this.colors.primary);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Math.round(tipo.total_kilos).toLocaleString('es-MX')} kg`, pageWidth - 25, materialY + 10, { align: 'right' });
        
        // CO2
        doc.setTextColor(...this.colors.gray);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${co2Total} ton CO₂`, pageWidth - 25, materialY + 18, { align: 'right' });
        
        materialY += 30;
      });
      
      this.agregarFooter(doc, 3, 4);
      
      // ==================== PÁGINA 5: TOP 10 LOCALES ====================
      doc.addPage();
      this.agregarHeader(doc, 'Top 10 Locales Más Productivos');
      
      let localY = 50;
      topLocales.slice(0, 10).forEach((local: any, index: number) => {
        const porcentaje = ((local.total_kilos / stats.total_kilos) * 100);
        
        // Círculo de ranking
        const colores = [this.colors.gold, this.colors.silver, this.colors.bronze];
        const color = index < 3 ? colores[index] : this.colors.primary;
        
        doc.setFillColor(...color);
        doc.circle(30, localY + 6, 6, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}`, 30, localY + 8, { align: 'center' });
        
        // Nombre
        doc.setTextColor(...this.colors.grayDark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(local.local_nombre, 42, localY + 5);
        
        // Plaza
        doc.setTextColor(...this.colors.gray);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(local.plaza_nombre, 42, localY + 10);
        
        // Kilos
        doc.setTextColor(...this.colors.primary);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Math.round(local.total_kilos).toLocaleString('es-MX')} kg`, pageWidth - 25, localY + 7, { align: 'right' });
        
        // Porcentaje
        doc.setTextColor(...this.colors.gray);
        doc.setFontSize(8);
        doc.text(`${porcentaje.toFixed(1)}%`, pageWidth - 25, localY + 12, { align: 'right' });
        
        localY += 18;
      });
      
      this.agregarFooter(doc, 4, 4);
      
      // Generar PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=impacto-ambiental-clientes-${Date.now()}.pdf`);
      res.send(pdfBuffer);
      
      console.log('✅ PDF generado con jsPDF - SIN CORRUPCIÓN');
      
    } catch (error) {
      console.error('❌ Error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generando reporte',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  }
  
  /**
   * Generar reporte INTERNO
   */
  async generarReporteInterno(req: Request, res: Response) {
    return this.generarReporteClientes(req, res);
  }
}