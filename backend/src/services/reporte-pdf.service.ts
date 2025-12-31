/**
 * SERVICIO PDF SIMPLIFICADO - SIN PUPPETEER
 * Usar PDFKit para generar PDFs sin HTML
 */

import PDFDocument from 'pdfkit';
import { Request, Response } from 'express';
import { RecoleccionService } from '../services/recoleccion.service';

const recoleccionService = new RecoleccionService();

export class ReportePDFServiceSimple {
  
  /**
   * Generar reporte CLIENTES con PDFKit
   */
  async generarReporteClientes(req: Request, res: Response) {
    try {
      console.log('🔄 Generando reporte CLIENTES con PDFKit...');
      
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
      
      // Crear PDF
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      // Configurar respuesta HTTP
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=impacto-ambiental-clientes-${Date.now()}.pdf`);
      
      // Pipe al response
      doc.pipe(res);
      
      // PORTADA
      doc.fontSize(32).fillColor('#047857').text('NUESTRO IMPACTO', { align: 'center' });
      doc.fontSize(32).text('AMBIENTAL', { align: 'center' });
      doc.moveDown(2);
      
      if (filters.fecha_desde && filters.fecha_hasta) {
        doc.fontSize(14).fillColor('#666666').text(
          `${new Date(filters.fecha_desde).toLocaleDateString('es-MX')} - ${new Date(filters.fecha_hasta).toLocaleDateString('es-MX')}`,
          { align: 'center' }
        );
      }
      
      doc.moveDown(3);
      doc.fontSize(18).fillColor('#047857').text('Elefantes Verdes', { align: 'center' });
      doc.fontSize(12).fillColor('#666666').text('Quintana Roo, México', { align: 'center' });
      
      // PÁGINA 2 - EL PANORAMA GENERAL
      doc.addPage();
      doc.fontSize(24).fillColor('#047857').text('El Panorama General', { align: 'center' });
      doc.moveDown(2);
      
      // KPIs
      const kpis = [
        { label: 'KG Materiales Reciclados', value: Math.round(stats.total_kilos).toLocaleString('es-MX') },
        { label: 'TON CO₂ Evitado', value: (co2Evitado / 1000).toFixed(1) },
        { label: 'Recolecciones Realizadas', value: stats.total_recolecciones.toLocaleString('es-MX') },
        { label: 'Plazas', value: new Set(topLocales.map((l: any) => l.plaza_id || l.plaza_nombre)).size.toString() }
      ];
      
      kpis.forEach(kpi => {
        doc.fontSize(10).fillColor('#666666').text(kpi.label);
        doc.fontSize(32).fillColor('#047857').text(kpi.value);
        doc.moveDown(1);
      });
      
      // PÁGINA 3 - NUESTRO IMPACTO
      doc.addPage();
      doc.fontSize(24).fillColor('#047857').text('Nuestro Impacto Equivale a:', { align: 'center' });
      doc.moveDown(2);
      
      const impactos = [
        { icono: 'Árboles Plantados', valor: arbolesEquivalentes.toLocaleString('es-MX'), detalle: 'CO₂ capturado en 1 año' },
        { icono: 'Kilómetros NO Recorridos', valor: kmAuto.toLocaleString('es-MX'), detalle: 'en auto promedio' },
        { icono: 'Energía Ahorrada', valor: `${Math.round(stats.total_kilos * 1.17).toLocaleString('es-MX')} kWh`, detalle: 'producción evitada' },
        { icono: 'Agua Ahorrada', valor: `${Math.round(stats.total_kilos * 4.38).toLocaleString('es-MX')} Litros`, detalle: 'en producción de materiales' }
      ];
      
      impactos.forEach(imp => {
        doc.fontSize(12).fillColor('#666666').text(imp.icono);
        doc.fontSize(24).fillColor('#047857').text(imp.valor);
        doc.fontSize(10).fillColor('#999999').text(imp.detalle);
        doc.moveDown(1);
      });
      
      // PÁGINA 4 - DESGLOSE POR MATERIAL
      doc.addPage();
      doc.fontSize(24).fillColor('#047857').text('Desglose por Material', { align: 'center' });
      doc.moveDown(2);
      
      statsByTipo.slice(0, 5).forEach((tipo: any) => {
        const tipoNombre = tipo.tipo_residuo_nombre || tipo.tipo_residuo || tipo.nombre || 'Desconocido';
        const porcentaje = ((tipo.total_kilos / stats.total_kilos) * 100).toFixed(1);
        const factorCO2 = tipo.factor_co2_promedio || (tipo.co2_evitado / tipo.total_kilos) || 0;
        const co2Total = ((tipo.total_kilos * factorCO2) / 1000).toFixed(2);
        
        doc.fontSize(14).fillColor('#1F2937').text(`${tipoNombre.toUpperCase()}: ${Math.round(tipo.total_kilos).toLocaleString('es-MX')} kg (${porcentaje}%)`);
        doc.fontSize(10).fillColor('#666666').text(`↑ ${co2Total} ton de CO₂ evitadas`);
        doc.moveDown(1);
      });
      
      // Finalizar
      doc.end();
      
      console.log('✅ PDF generado con PDFKit');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      
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
   * Generar reporte INTERNO con PDFKit
   */
  async generarReporteInterno(req: Request, res: Response) {
    try {
      console.log('🔄 Generando reporte INTERNO con PDFKit...');
      
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
      
      // Crear PDF
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      // Configurar respuesta HTTP
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=impacto-ambiental-interno-${Date.now()}.pdf`);
      
      // Pipe al response
      doc.pipe(res);
      
      // PORTADA
      doc.fontSize(28).fillColor('#DC2626').text('CONFIDENCIAL - USO INTERNO', { align: 'right' });
      doc.moveDown(2);
      doc.fontSize(32).fillColor('#047857').text('REPORTE DE IMPACTO', { align: 'center' });
      doc.fontSize(32).text('AMBIENTAL', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(18).fillColor('#666666').text('Análisis Interno', { align: 'center' });
      
      // RESUMEN EJECUTIVO
      doc.addPage();
      doc.fontSize(24).fillColor('#047857').text('Resumen Ejecutivo');
      doc.moveDown(2);
      
      const kpis = [
        { label: 'Total Kilos', value: Math.round(stats.total_kilos).toLocaleString('es-MX') },
        { label: 'CO₂ Evitado (ton)', value: (co2Evitado / 1000).toFixed(2) },
        { label: 'Recolecciones', value: stats.total_recolecciones.toLocaleString('es-MX') },
        { label: 'Promedio kg/Recolección', value: (stats.total_kilos / stats.total_recolecciones).toFixed(1) }
      ];
      
      kpis.forEach(kpi => {
        doc.fontSize(10).fillColor('#666666').text(kpi.label);
        doc.fontSize(28).fillColor('#047857').text(kpi.value);
        doc.moveDown(1);
      });
      
      // ANÁLISIS POR MATERIAL
      doc.addPage();
      doc.fontSize(20).fillColor('#047857').text('Análisis por Tipo de Material');
      doc.moveDown(2);
      
      statsByTipo.forEach((tipo: any) => {
        const tipoNombre = tipo.tipo_residuo_nombre || tipo.tipo_residuo || 'Desconocido';
        const porcentaje = ((tipo.total_kilos / stats.total_kilos) * 100).toFixed(1);
        
        doc.fontSize(12).fillColor('#1F2937').text(
          `${tipoNombre}: ${Math.round(tipo.total_kilos).toLocaleString('es-MX')} kg (${porcentaje}%)`
        );
        doc.moveDown(0.5);
      });
      
      // Finalizar
      doc.end();
      
      console.log('✅ PDF generado con PDFKit');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generando reporte',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  }
}