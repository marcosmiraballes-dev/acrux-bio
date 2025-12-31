/**
 * CONTROLLER PARA REPORTES PDF
 * Endpoints para descargar reportes ejecutivos (Interno y Clientes)
 * Usando PDFKit para evitar corrupción de archivos
 */

import { Request, Response } from 'express';
import { ReportePDFServiceSimple } from '../services/reporte-pdf-simple.service';

const reportePDFService = new ReportePDFServiceSimple();

export class ReportePDFController {
  
  /**
   * GET /api/reportes/pdf/interno
   * Descargar reporte INTERNO (análisis detallado para Director/Coordinador)
   * 
   * Query params opcionales:
   *   - plaza_id: UUID de la plaza
   *   - fecha_desde: YYYY-MM-DD
   *   - fecha_hasta: YYYY-MM-DD
   */
  async descargarReporteInterno(req: Request, res: Response) {
    await reportePDFService.generarReporteInterno(req, res);
  }
  
  /**
   * GET /api/reportes/pdf/clientes
   * Descargar reporte CLIENTES (visual y motivacional para mostrar a clientes)
   * 
   * Query params opcionales:
   *   - plaza_id: UUID de la plaza
   *   - fecha_desde: YYYY-MM-DD
   *   - fecha_hasta: YYYY-MM-DD
   */
  async descargarReporteClientes(req: Request, res: Response) {
    await reportePDFService.generarReporteClientes(req, res);
  }
  
  /**
   * GET /api/reportes/pdf/ejecutivo
   * Alias para reporte interno (mantener compatibilidad)
   */
  async descargarReporteEjecutivo(req: Request, res: Response) {
    await reportePDFService.generarReporteInterno(req, res);
  }
}