import ExcelJS from 'exceljs';
import { RecoleccionService } from '../recoleccion.service';

const recoleccionService = new RecoleccionService();

export class ReportePlazaExcelService {

  /**
   * Genera el reporte Excel para una plaza
   */
  async generarReporte(
    plazaId: string | null,
    fechaInicio: string,
    fechaFin: string
  ): Promise<ExcelJS.Workbook> {
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Elefantes Verdes';
    workbook.created = new Date();

    // Obtener datos
    const datos = await this.obtenerDatos(plazaId, fechaInicio, fechaFin);

    // Crear hojas
    await this.crearHojaResumen(workbook, datos);
    await this.crearHojaRecoleccionesDetalladas(workbook, datos);
    await this.crearHojaPorLocal(workbook, datos);
    await this.crearHojaPorMaterial(workbook, datos);
    await this.crearHojaHistoricoMensual(workbook, datos);

    return workbook;
  }

  /**
   * Obtiene todos los datos necesarios
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
      recolecciones,
      tendencia
    ] = await Promise.all([
      recoleccionService.getStats(filters),
      recoleccionService.getStatsByTipo(filters),
      recoleccionService.getTopLocales(filters),
      recoleccionService.getAll(filters),
      recoleccionService.getTendenciaMensual(filters)
    ]);

    return {
      plazaId,
      fechaInicio,
      fechaFin,
      stats,
      statsByTipo,
      topLocales,
      recolecciones: Array.isArray(recolecciones) ? recolecciones : (recolecciones as any).data || [],
      tendencia
    };
  }

  /**
   * Hoja 1: Resumen
   */
  private async crearHojaResumen(workbook: ExcelJS.Workbook, datos: any) {
    const sheet = workbook.addWorksheet('Resumen', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Título
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REPORTE POR PLAZA - RESUMEN';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' }
    };
    titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).height = 30;

    // Período
    sheet.getCell('A3').value = 'Período:';
    sheet.getCell('B3').value = `${datos.fechaInicio} a ${datos.fechaFin}`;
    sheet.getCell('A3').font = { bold: true };

    // KPIs
    sheet.getCell('A5').value = 'INDICADORES PRINCIPALES';
    sheet.getCell('A5').font = { bold: true, size: 14 };
    sheet.mergeCells('A5:D5');

    const kpis = [
      ['Total Recolecciones', datos.stats.total_recolecciones],
      ['Total Kilos', Math.round(datos.stats.total_kilos)],
      ['CO₂ Evitado (kg)', Math.round(datos.stats.co2_evitado)],
      ['CO₂ Evitado (ton)', Math.round(datos.stats.co2_evitado / 1000 * 100) / 100]
    ];

    let row = 7;
    kpis.forEach(([label, value]) => {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`B${row}`).value = value;
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).numFmt = '#,##0.00';
      sheet.getCell(`B${row}`).alignment = { horizontal: 'right' };
      row++;
    });

    // Top 5 Locales
    sheet.getCell(`A${row + 2}`).value = 'TOP 5 LOCALES';
    sheet.getCell(`A${row + 2}`).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${row + 2}:D${row + 2}`);

    row += 4;
    
    // Headers
    const headers = ['#', 'Local', 'Kilos', 'CO₂ (kg)'];
    headers.forEach((header, i) => {
      const cell = sheet.getCell(row, i + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
    });

    row++;

    // Datos
    datos.topLocales.slice(0, 5).forEach((local: any, index: number) => {
      sheet.getCell(row, 1).value = index + 1;
      sheet.getCell(row, 2).value = local.local_nombre;
      sheet.getCell(row, 3).value = local.total_kilos;
      sheet.getCell(row, 3).numFmt = '#,##0';
      sheet.getCell(row, 4).value = local.co2_evitado;
      sheet.getCell(row, 4).numFmt = '#,##0.00';
      row++;
    });

    // Ajustar anchos
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
  }

  /**
   * Hoja 2: Recolecciones Detalladas
   */
  private async crearHojaRecoleccionesDetalladas(workbook: ExcelJS.Workbook, datos: any) {
    const sheet = workbook.addWorksheet('Recolecciones Detalladas', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Headers
    const headers = [
      'Fecha',
      'Hora',
      'Plaza',
      'Local',
      'Total Kilos',
      'CO₂ Evitado (kg)',
      'Notas'
    ];

    headers.forEach((header, i) => {
      const cell = sheet.getCell(1, i + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Datos
    let row = 2;
    datos.recolecciones.forEach((rec: any) => {
      sheet.getCell(row, 1).value = rec.fecha_recoleccion;
      sheet.getCell(row, 2).value = rec.hora_recoleccion || '';
      sheet.getCell(row, 3).value = rec.plazas?.nombre || 'N/A';
      sheet.getCell(row, 4).value = rec.locales?.nombre || 'N/A';
      sheet.getCell(row, 5).value = rec.total_kilos;
      sheet.getCell(row, 5).numFmt = '#,##0.00';
      sheet.getCell(row, 6).value = rec.co2_evitado;
      sheet.getCell(row, 6).numFmt = '#,##0.00';
      sheet.getCell(row, 7).value = rec.notas || '';
      row++;
    });

    // Totales
    sheet.getCell(row, 4).value = 'TOTAL:';
    sheet.getCell(row, 4).font = { bold: true };
    sheet.getCell(row, 5).value = { formula: `SUM(E2:E${row - 1})` };
    sheet.getCell(row, 5).font = { bold: true };
    sheet.getCell(row, 5).numFmt = '#,##0.00';
    sheet.getCell(row, 6).value = { formula: `SUM(F2:F${row - 1})` };
    sheet.getCell(row, 6).font = { bold: true };
    sheet.getCell(row, 6).numFmt = '#,##0.00';

    // Ajustar anchos
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 10;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 30;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 40;

    // Habilitar filtros
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: row, column: 7 }
    };
  }

  /**
   * Hoja 3: Por Local
   */
  private async crearHojaPorLocal(workbook: ExcelJS.Workbook, datos: any) {
    const sheet = workbook.addWorksheet('Por Local');

    // Headers
    const headers = ['Local', 'Plaza', 'Recolecciones', 'Kilos', 'CO₂ (kg)'];
    headers.forEach((header, i) => {
      const cell = sheet.getCell(1, i + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
    });

    // Datos
    let row = 2;
    datos.topLocales.forEach((local: any) => {
      sheet.getCell(row, 1).value = local.local_nombre;
      sheet.getCell(row, 2).value = local.plaza_nombre || 'N/A';
      sheet.getCell(row, 3).value = local.total_recolecciones || 0;
      sheet.getCell(row, 4).value = local.total_kilos;
      sheet.getCell(row, 4).numFmt = '#,##0.00';
      sheet.getCell(row, 5).value = local.co2_evitado;
      sheet.getCell(row, 5).numFmt = '#,##0.00';
      row++;
    });

    // Ajustar anchos
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;
  }

  /**
   * Hoja 4: Por Material
   */
  private async crearHojaPorMaterial(workbook: ExcelJS.Workbook, datos: any) {
    const sheet = workbook.addWorksheet('Por Material');

    // Headers
    const headers = ['Tipo Residuo', 'Recolecciones', 'Kilos', '% Total', 'CO₂ (kg)'];
    headers.forEach((header, i) => {
      const cell = sheet.getCell(1, i + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
    });

    // Datos
    let row = 2;
    datos.statsByTipo.forEach((tipo: any) => {
      const porcentaje = (tipo.total_kilos / datos.stats.total_kilos) * 100;
      
      sheet.getCell(row, 1).value = tipo.tipo_residuo_nombre;
      sheet.getCell(row, 2).value = tipo.total_recolecciones || 0;
      sheet.getCell(row, 3).value = tipo.total_kilos;
      sheet.getCell(row, 3).numFmt = '#,##0.00';
      sheet.getCell(row, 4).value = porcentaje / 100;
      sheet.getCell(row, 4).numFmt = '0.0%';
      sheet.getCell(row, 5).value = tipo.co2_evitado;
      sheet.getCell(row, 5).numFmt = '#,##0.00';
      row++;
    });

    // Ajustar anchos
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 15;
  }

  /**
   * Hoja 5: Histórico Mensual
   */
  private async crearHojaHistoricoMensual(workbook: ExcelJS.Workbook, datos: any) {
    const sheet = workbook.addWorksheet('Histórico Mensual');

    // Headers
    const headers = ['Mes', 'Año', 'Recolecciones', 'Kilos', 'CO₂ (kg)'];
    headers.forEach((header, i) => {
      const cell = sheet.getCell(1, i + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
    });

    // Datos
    let row = 2;
    datos.tendencia.forEach((mes: any) => {
      sheet.getCell(row, 1).value = mes.mes;
      sheet.getCell(row, 2).value = mes.anio;
      sheet.getCell(row, 3).value = mes.total_recolecciones;
      sheet.getCell(row, 4).value = mes.total_kilos;
      sheet.getCell(row, 4).numFmt = '#,##0.00';
      sheet.getCell(row, 5).value = mes.co2_evitado;
      sheet.getCell(row, 5).numFmt = '#,##0.00';
      row++;
    });

    // Ajustar anchos
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 10;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;
  }
}

export const reportePlazaExcelService = new ReportePlazaExcelService();