/**
 * CONTROLLER PARA REPORTES EXCEL
 */

import { Request, Response } from 'express';
import { ReporteExcelService } from '../services/reporte-excel.service';

const reporteExcelService = new ReporteExcelService();

export class ReporteExcelController {
  
  /**
   * GET /api/reportes/excel/ejecutivo
   * Descargar reporte ejecutivo en Excel
   */
  async descargarReporteEjecutivo(req: Request, res: Response) {
    await reporteExcelService.generarReporteEjecutivo(req, res);
  }
}