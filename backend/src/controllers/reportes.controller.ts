import { Request, Response } from 'express';
import { reportePlazaPDFService } from '../services/reportes/reporte-plaza-pdf.service';
import { reportePlazaExcelService } from '../services/reportes/reporte-plaza-excel.service';
import { reporteImpactoClientesPDFService } from '../services/reportes/reporte-impacto-clientes-pdf.service';
import { reporteImpactoInternoPDFService } from '../services/reportes/reporte-impacto-interno-pdf.service';

export class ReportesController {

  /**
   * Genera reporte por plaza en formato PDF
   */
  async generarReportePlazaPDF(req: Request, res: Response) {
    try {
      const { plaza_id, fecha_desde, fecha_hasta } = req.query;

      if (!fecha_desde || !fecha_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren fecha_desde y fecha_hasta'
        });
      }

      // Generar PDF
      const doc = await reportePlazaPDFService.generarReporte(
        plaza_id as string | null,
        fecha_desde as string,
        fecha_hasta as string
      );

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-plaza-${Date.now()}.pdf`);

      // Enviar el PDF
      doc.pipe(res);

    } catch (error) {
      console.error('Error generando reporte plaza PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando reporte',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Genera reporte por plaza en formato Excel
   */
  async generarReportePlazaExcel(req: Request, res: Response) {
    try {
      const { plaza_id, fecha_desde, fecha_hasta } = req.query;

      if (!fecha_desde || !fecha_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren fecha_desde y fecha_hasta'
        });
      }

      // Generar Excel
      const workbook = await reportePlazaExcelService.generarReporte(
        plaza_id as string | null,
        fecha_desde as string,
        fecha_hasta as string
      );

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-plaza-${Date.now()}.xlsx`);

      // Enviar el Excel
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error generando reporte plaza Excel:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando reporte',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Genera reporte de impacto ambiental para clientes (PDF)
   */
  async generarReporteImpactoClientes(req: Request, res: Response) {
    try {
      const { fecha_desde, fecha_hasta, plaza_id } = req.query;

      if (!fecha_desde || !fecha_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren fecha_desde y fecha_hasta'
        });
      }

      // Generar PDF
      const doc = await reporteImpactoClientesPDFService.generarReporte(
        fecha_desde as string,
        fecha_hasta as string,
        plaza_id as string | undefined
      );

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=impacto-ambiental-${Date.now()}.pdf`);

      // Enviar el PDF
      doc.pipe(res);

    } catch (error) {
      console.error('Error generando reporte impacto clientes:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando reporte',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Genera reporte de impacto ambiental para uso interno (PDF)
   */
  async generarReporteImpactoInterno(req: Request, res: Response) {
    try {
      const { fecha_desde, fecha_hasta, plaza_id } = req.query;

      if (!fecha_desde || !fecha_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren fecha_desde y fecha_hasta'
        });
      }

      // Generar PDF
      const doc = await reporteImpactoInternoPDFService.generarReporte(
        fecha_desde as string,
        fecha_hasta as string,
        plaza_id as string | undefined
      );

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=impacto-interno-${Date.now()}.pdf`);

      // Enviar el PDF
      doc.pipe(res);

    } catch (error) {
      console.error('Error generando reporte impacto interno:', error);
      res.status(500).json({
        success: false,
        error: 'Error generando reporte',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}