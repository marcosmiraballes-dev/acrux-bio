/**
 * CONTROLLER PARA REPORTES POR PLAZA
 */

import { Request, Response } from 'express';
import { ReportePlazaService } from '../services/reporte-plaza.service';

const reportePlazaService = new ReportePlazaService();

export class ReportePlazaController {
  
  /**
   * GET /api/reportes/plaza/excel
   * Descargar reporte por plaza en Excel
   */
  async descargarExcel(req: Request, res: Response) {
    await reportePlazaService.generarReporteExcel(req, res);
  }
  
  /**
   * GET /api/reportes/plaza/pdf
   * Descargar reporte por plaza en PDF
   */
  async descargarPDF(req: Request, res: Response) {
    await reportePlazaService.generarReportePDF(req, res);
  }
}