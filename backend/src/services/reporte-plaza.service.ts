/**
 * SERVICIO PARA REPORTES POR PLAZA
 * Genera reportes ejecutivos con estadísticas, rankings y análisis por plaza
 */

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Request, Response } from 'express';
import { RecoleccionService } from '../services/recoleccion.service';

const recoleccionService = new RecoleccionService();

export class ReportePlazaService {
  
  // Colores corporativos
  private colors = {
    primary: [4, 120, 87],
    primaryLight: [16, 185, 129],
    gray: [107, 114, 128],
    grayLight: [156, 163, 175],
    grayDark: [31, 41, 55],
    background: [249, 250, 251],
    gold: [245, 158, 11],
    silver: [156, 163, 175],
    bronze: [205, 127, 50]
  };
  
  /**
   * Generar reporte EXCEL por plaza
   */
  async generarReporteExcel(req: Request, res: Response) {
    try {
      console.log('📊 Generando reporte EXCEL por plaza...');
      
      const filters = {
        plaza_id: req.query.plaza_id as string | undefined,
        fecha_desde: req.query.fecha_desde as string | undefined,
        fecha_hasta: req.query.fecha_hasta as string | undefined
      };
      
      console.log('🔍 Filtros recibidos:', filters);
      console.log('🔍 Query params completos:', req.query);
      
      // Convertir filtros a camelCase para RecoleccionService
      const serviceFilters = {
        plazaId: filters.plaza_id,
        fechaInicio: filters.fecha_desde,
        fechaFin: filters.fecha_hasta
      };
      
      console.log('🔍 Filtros convertidos para service:', serviceFilters);
      
      // Obtener datos
      const [stats, statsByTipo, topLocales, plazas] = await Promise.all([
        recoleccionService.getStats(serviceFilters),
        recoleccionService.getStatsByTipo(serviceFilters),
        recoleccionService.getTopLocales(serviceFilters),
        this.obtenerPlazas()
      ]);
      
      console.log('📊 Stats obtenidos:', stats);
      console.log('📊 Tipos obtenidos:', statsByTipo.length);
      console.log('📊 Locales obtenidos:', topLocales.length);
      
      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Elefantes Verdes';
      workbook.created = new Date();
      
      // Obtener nombre de la plaza si está filtrada
      let plazaNombre = 'Todas las Plazas';
      if (filters.plaza_id && topLocales.length > 0) {
        plazaNombre = topLocales[0].plaza_nombre || 'Plaza Seleccionada';
      }
      
      // ==================== HOJA 1: RESUMEN EJECUTIVO ====================
      const sheetResumen = workbook.addWorksheet('Resumen Ejecutivo', {
        properties: { tabColor: { argb: 'FF047857' } }
      });
      
      // Título
      sheetResumen.mergeCells('A1:F1');
      const titleCell = sheetResumen.getCell('A1');
      titleCell.value = filters.plaza_id 
        ? `REPORTE EJECUTIVO - ${plazaNombre.toUpperCase()}`
        : 'REPORTE EJECUTIVO POR PLAZA';
      titleCell.font = { size: 18, bold: true, color: { argb: 'FF047857' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' }
      };
      sheetResumen.getRow(1).height = 30;
      
      // Período
      if (filters.fecha_desde && filters.fecha_hasta) {
        sheetResumen.mergeCells('A2:F2');
        const periodoCell = sheetResumen.getCell('A2');
        periodoCell.value = `Período: ${new Date(filters.fecha_desde).toLocaleDateString('es-MX')} - ${new Date(filters.fecha_hasta).toLocaleDateString('es-MX')}`;
        periodoCell.font = { size: 11, color: { argb: 'FF6B7280' } };
        periodoCell.alignment = { horizontal: 'center' };
        sheetResumen.getRow(2).height = 20;
      }
      
      // KPIs
      sheetResumen.addRow([]);
      sheetResumen.addRow(['INDICADORES CLAVE']);
      sheetResumen.getCell('A4').font = { size: 12, bold: true, color: { argb: 'FF047857' } };
      
      const kpis = [
        ['Total Kilos Reciclados', Math.round(stats.total_kilos).toLocaleString('es-MX') + ' kg'],
        ['CO₂ Evitado', (stats.co2_evitado / 1000).toFixed(2) + ' ton'],
        ['Total Recolecciones', stats.total_recolecciones.toLocaleString('es-MX')],
        ['Promedio kg/Recolección', (stats.total_kilos / stats.total_recolecciones).toFixed(1) + ' kg']
      ];
      
      kpis.forEach(([label, value]) => {
        const row = sheetResumen.addRow([label, value]);
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { size: 12, bold: true, color: { argb: 'FF047857' } };
        row.getCell(2).alignment = { horizontal: 'right' };
      });
      
      // Anchos de columna
      sheetResumen.getColumn(1).width = 30;
      sheetResumen.getColumn(2).width = 20;
      
      // ==================== HOJA 2: POR TIPO DE RESIDUO ====================
      const sheetTipos = workbook.addWorksheet('Por Tipo de Residuo', {
        properties: { tabColor: { argb: 'FF10B981' } }
      });
      
      // Headers
      sheetTipos.addRow(['DESGLOSE POR TIPO DE RESIDUO']);
      sheetTipos.mergeCells('A1:E1');
      sheetTipos.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF047857' } };
      sheetTipos.getCell('A1').alignment = { horizontal: 'center' };
      sheetTipos.getRow(1).height = 25;
      
      sheetTipos.addRow([]);
      
      const headerRow = sheetTipos.addRow(['Tipo de Residuo', 'Kilos', '%', 'CO₂ Evitado (ton)', 'Color']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 20;
      
      // Datos
      statsByTipo.forEach((tipo: any) => {
        const tipoNombre = tipo.tipo_residuo_nombre || tipo.tipo_residuo || 'Desconocido';
        const porcentaje = ((tipo.total_kilos / stats.total_kilos) * 100).toFixed(1);
        const factorCO2 = tipo.factor_co2_promedio || (tipo.co2_evitado / tipo.total_kilos) || 0;
        const co2Total = ((tipo.total_kilos * factorCO2) / 1000).toFixed(2);
        
        const row = sheetTipos.addRow([
          tipoNombre,
          Math.round(tipo.total_kilos),
          porcentaje + '%',
          co2Total,
          tipo.tipo_residuo_color || '#047857'
        ]);
        
        row.getCell(2).numFmt = '#,##0';
        row.getCell(3).alignment = { horizontal: 'right' };
        row.getCell(4).numFmt = '#,##0.00';
        
        // Color del tipo
        if (tipo.tipo_residuo_color) {
          row.getCell(5).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + tipo.tipo_residuo_color.replace('#', '') }
          };
        }
      });
      
      sheetTipos.getColumn(1).width = 25;
      sheetTipos.getColumn(2).width = 15;
      sheetTipos.getColumn(3).width = 10;
      sheetTipos.getColumn(4).width = 18;
      sheetTipos.getColumn(5).width = 15;
      
      // ==================== HOJA 3: TOP LOCALES ====================
      const sheetLocales = workbook.addWorksheet('Top Locales', {
        properties: { tabColor: { argb: 'FF059669' } }
      });
      
      sheetLocales.addRow(['TOP LOCALES MÁS PRODUCTIVOS']);
      sheetLocales.mergeCells('A1:F1');
      sheetLocales.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF047857' } };
      sheetLocales.getCell('A1').alignment = { horizontal: 'center' };
      sheetLocales.getRow(1).height = 25;
      
      sheetLocales.addRow([]);
      
      const headerLocales = sheetLocales.addRow(['#', 'Local', 'Plaza', 'Kilos', '%', 'Recolecciones']);
      headerLocales.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerLocales.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      headerLocales.alignment = { horizontal: 'center', vertical: 'middle' };
      headerLocales.height = 20;
      
      topLocales.forEach((local: any, index: number) => {
        const porcentaje = ((local.total_kilos / stats.total_kilos) * 100).toFixed(1);
        
        const row = sheetLocales.addRow([
          index + 1,
          local.local_nombre,
          local.plaza_nombre,
          Math.round(local.total_kilos),
          porcentaje + '%',
          local.total_recolecciones
        ]);
        
        // Medallas para top 3
        if (index < 3) {
          const colors = ['FFD97706', 'FF9CA3AF', 'FFCD7F32'];
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors[index] }
          };
          row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
        
        row.getCell(4).numFmt = '#,##0';
        row.getCell(5).alignment = { horizontal: 'right' };
        row.getCell(6).alignment = { horizontal: 'center' };
      });
      
      sheetLocales.getColumn(1).width = 5;
      sheetLocales.getColumn(2).width = 30;
      sheetLocales.getColumn(3).width = 25;
      sheetLocales.getColumn(4).width = 15;
      sheetLocales.getColumn(5).width = 10;
      sheetLocales.getColumn(6).width = 15;
      
      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-plaza-${Date.now()}.xlsx`);
      res.send(buffer);
      
      console.log('✅ Reporte EXCEL por plaza generado');
      
    } catch (error) {
      console.error('❌ Error generando reporte EXCEL:', error);
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
   * Generar reporte PDF por plaza
   */
  async generarReportePDF(req: Request, res: Response) {
    try {
      console.log('📄 Generando reporte PDF por plaza...');
      
      const filters = {
        plaza_id: req.query.plaza_id as string | undefined,
        fecha_desde: req.query.fecha_desde as string | undefined,
        fecha_hasta: req.query.fecha_hasta as string | undefined
      };
      
      console.log('🔍 Filtros recibidos (PDF):', filters);
      console.log('🔍 Query params completos (PDF):', req.query);
      
      // Convertir filtros a camelCase para RecoleccionService
      const serviceFilters = {
        plazaId: filters.plaza_id,
        fechaInicio: filters.fecha_desde,
        fechaFin: filters.fecha_hasta
      };
      
      console.log('🔍 Filtros convertidos para service (PDF):', serviceFilters);
      
      const [stats, statsByTipo, topLocales] = await Promise.all([
        recoleccionService.getStats(serviceFilters),
        recoleccionService.getStatsByTipo(serviceFilters),
        recoleccionService.getTopLocales(serviceFilters)
      ]);
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // PORTADA
      doc.setFillColor(...this.colors.primary);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(42);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE EJECUTIVO', pageWidth / 2, 100, { align: 'center' });
      doc.text('POR PLAZA', pageWidth / 2, 120, { align: 'center' });
      
      if (filters.fecha_desde && filters.fecha_hasta) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const fechaDesde = new Date(filters.fecha_desde).toLocaleDateString('es-MX', { 
          day: 'numeric', month: 'long', year: 'numeric' 
        });
        const fechaHasta = new Date(filters.fecha_hasta).toLocaleDateString('es-MX', { 
          day: 'numeric', month: 'long', year: 'numeric' 
        });
        doc.text(`${fechaDesde} - ${fechaHasta}`, pageWidth / 2, 145, { align: 'center' });
      }
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Elefantes Verdes', pageWidth / 2, pageHeight - 60, { align: 'center' });
      
      // PÁGINA 2: Resumen
      doc.addPage();
      
      doc.setTextColor(...this.colors.primary);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen Ejecutivo', 20, 25);
      
      doc.setDrawColor(...this.colors.primary);
      doc.setLineWidth(2);
      doc.line(20, 30, pageWidth - 20, 30);
      
      // KPIs
      const kpiData = [
        ['Total Kilos', Math.round(stats.total_kilos).toLocaleString('es-MX') + ' kg'],
        ['CO₂ Evitado', (stats.co2_evitado / 1000).toFixed(2) + ' ton'],
        ['Recolecciones', stats.total_recolecciones.toLocaleString('es-MX')],
        ['Promedio kg/Rec', (stats.total_kilos / stats.total_recolecciones).toFixed(1) + ' kg']
      ];
      
      let kpiY = 50;
      kpiData.forEach(([label, value]) => {
        doc.setFillColor(...this.colors.background);
        doc.roundedRect(20, kpiY, pageWidth - 40, 15, 2, 2, 'F');
        
        doc.setTextColor(...this.colors.gray);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 25, kpiY + 6);
        
        doc.setTextColor(...this.colors.primary);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(value, pageWidth - 25, kpiY + 10, { align: 'right' });
        
        kpiY += 20;
      });
      
      // Generar PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-plaza-${Date.now()}.pdf`);
      res.send(pdfBuffer);
      
      console.log('✅ Reporte PDF por plaza generado');
      
    } catch (error) {
      console.error('❌ Error generando reporte PDF:', error);
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
   * Obtener lista de plazas
   */
  private async obtenerPlazas(): Promise<any[]> {
    // Implementar lógica para obtener plazas desde la base de datos
    // Por ahora retorna array vacío
    return [];
  }
}