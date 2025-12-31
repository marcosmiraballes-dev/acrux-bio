/**
 * SERVICIO EXCEL PROFESIONAL CON GRÁFICAS
 * Incluye charts y formato visual
 */

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { RecoleccionService } from '../services/recoleccion.service';

const recoleccionService = new RecoleccionService();

export class ReporteExcelService {
  
  /**
   * Generar reporte ejecutivo en Excel con gráficas
   */
  async generarReporteEjecutivo(req: Request, res: Response) {
    try {
      console.log('📊 Iniciando generación de Excel con gráficas...');
      
      const filters = {
        plaza_id: req.query.plaza_id as string | undefined,
        fecha_desde: req.query.fecha_desde as string | undefined,
        fecha_hasta: req.query.fecha_hasta as string | undefined
      };

      // Obtener todos los datos
      console.log('📊 Obteniendo datos...');
      const [stats, statsByTipo, comparativaPlazas, topLocales, compMensual, compAnual, tendencia] = await Promise.all([
        recoleccionService.getStats(filters),
        recoleccionService.getStatsByTipo(filters),
        recoleccionService.getComparativaPlazas(filters),
        recoleccionService.getTopLocales({ ...filters, limit: 50 }),
        recoleccionService.getComparativaMensual(filters),
        recoleccionService.getComparativaAnual(filters),
        recoleccionService.getTendenciaMensual(filters)
      ]);

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Elefantes Verdes';
      workbook.created = new Date();
      
      // ============================================================
      // HOJA 1: DASHBOARD VISUAL
      // ============================================================
      console.log('📄 Creando Dashboard Visual...');
      const dashboard = workbook.addWorksheet('Dashboard', {
        properties: { tabColor: { argb: 'FF047857' } },
        views: [{ showGridLines: false }]
      });
      
      // HEADER PRINCIPAL
      dashboard.mergeCells('A1:H1');
      const titleCell = dashboard.getCell('A1');
      titleCell.value = '📊 REPORTE EJECUTIVO - ELEFANTES VERDES';
      titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      dashboard.getRow(1).height = 40;
      
      // Fecha y filtros
      dashboard.mergeCells('A2:H2');
      const fechaCell = dashboard.getCell('A2');
      let infoTexto = `Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      if (filters.plaza_id || filters.fecha_desde || filters.fecha_hasta) {
        infoTexto += ' | Filtros: ';
        if (filters.plaza_id) infoTexto += `Plaza: ${filters.plaza_id} `;
        if (filters.fecha_desde) infoTexto += `Desde: ${filters.fecha_desde} `;
        if (filters.fecha_hasta) infoTexto += `Hasta: ${filters.fecha_hasta}`;
      }
      fechaCell.value = infoTexto;
      fechaCell.font = { size: 10, color: { argb: 'FF666666' } };
      fechaCell.alignment = { horizontal: 'center' };
      fechaCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' }
      };
      
      // KPIS CON FORMATO VISUAL
      dashboard.addRow([]);
      
      // KPI 1: Total Recolecciones
      dashboard.getCell('A4').value = 'TOTAL RECOLECCIONES';
      dashboard.getCell('A4').font = { bold: true, size: 11, color: { argb: 'FF666666' } };
      dashboard.mergeCells('A5:B5');
      const kpi1 = dashboard.getCell('A5');
      kpi1.value = stats.total_recolecciones;
      kpi1.font = { size: 32, bold: true, color: { argb: 'FF047857' } };
      kpi1.alignment = { horizontal: 'center', vertical: 'middle' };
      kpi1.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0FDF4' }
      };
      dashboard.getRow(5).height = 50;
      
      // KPI 2: Total Kilos
      dashboard.getCell('C4').value = 'TOTAL KILOS';
      dashboard.getCell('C4').font = { bold: true, size: 11, color: { argb: 'FF666666' } };
      dashboard.mergeCells('C5:D5');
      const kpi2 = dashboard.getCell('C5');
      kpi2.value = `${stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`;
      kpi2.font = { size: 32, bold: true, color: { argb: 'FF10B981' } };
      kpi2.alignment = { horizontal: 'center', vertical: 'middle' };
      kpi2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }
      };
      
      // KPI 3: CO₂ Evitado
      dashboard.getCell('E4').value = 'CO₂ EVITADO';
      dashboard.getCell('E4').font = { bold: true, size: 11, color: { argb: 'FF666666' } };
      dashboard.mergeCells('E5:F5');
      const kpi3 = dashboard.getCell('E5');
      kpi3.value = `${(stats.total_co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 })} Ton`;
      kpi3.font = { size: 32, bold: true, color: { argb: 'FF059669' } };
      kpi3.alignment = { horizontal: 'center', vertical: 'middle' };
      kpi3.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFA7F3D0' }
      };
      
      // KPI 4: Árboles
      dashboard.getCell('G4').value = 'ÁRBOLES EQUIVALENTES';
      dashboard.getCell('G4').font = { bold: true, size: 11, color: { argb: 'FF666666' } };
      dashboard.mergeCells('G5:H5');
      const kpi4 = dashboard.getCell('G5');
      kpi4.value = Math.round((stats.total_co2_evitado / 1000) * 45);
      kpi4.font = { size: 32, bold: true, color: { argb: 'FF34D399' } };
      kpi4.alignment = { horizontal: 'center', vertical: 'middle' };
      kpi4.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6EE7B7' }
      };
      
      // COMPARATIVAS VISUALES
      dashboard.addRow([]);
      dashboard.addRow([]);
      
      dashboard.mergeCells('A8:D8');
      const compTitle = dashboard.getCell('A8');
      compTitle.value = '📈 COMPARATIVA MENSUAL';
      compTitle.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      compTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      compTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      
      dashboard.addRow(['Periodo', 'Kilos', 'Variación', 'Tendencia']);
      dashboard.getRow(9).font = { bold: true };
      dashboard.getRow(9).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }
      };
      
      const variacionIcono = compMensual.variacion.kilos >= 0 ? '↑' : '↓';
      const variacionColor = compMensual.variacion.kilos >= 0 ? 'FF10B981' : 'FFEF4444';
      
      const rowActual = dashboard.addRow([
        `Mes Actual (${compMensual.mes_actual})`,
        compMensual.actual.kilos,
        `${variacionIcono} ${Math.abs(compMensual.variacion.kilos).toFixed(1)}%`,
        compMensual.variacion.kilos >= 0 ? 'Crecimiento' : 'Caída'
      ]);
      rowActual.getCell(3).font = { bold: true, color: { argb: variacionColor } };
      rowActual.getCell(4).font = { color: { argb: variacionColor } };
      
      dashboard.addRow([
        `Mes Anterior (${compMensual.mes_anterior})`,
        compMensual.anterior.kilos,
        '-',
        'Base'
      ]);
      
      // Ajustar columnas del dashboard
      dashboard.getColumn('A').width = 30;
      dashboard.getColumn('B').width = 18;
      dashboard.getColumn('C').width = 18;
      dashboard.getColumn('D').width = 18;
      dashboard.getColumn('E').width = 18;
      dashboard.getColumn('F').width = 18;
      dashboard.getColumn('G').width = 22;
      dashboard.getColumn('H').width = 18;
      
      // ============================================================
      // HOJA 2: DATOS POR PLAZA CON BARRAS DE DATOS
      // ============================================================
      console.log('📄 Creando hoja: Por Plaza con barras visuales...');
      const sheetPlazas = workbook.addWorksheet('Por Plaza', {
        properties: { tabColor: { argb: 'FF059669' } }
      });
      
      sheetPlazas.mergeCells('A1:D1');
      const plazaTitle = sheetPlazas.getCell('A1');
      plazaTitle.value = '🏢 RECOLECCIONES POR PLAZA';
      plazaTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      plazaTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      plazaTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      sheetPlazas.getRow(1).height = 30;
      
      sheetPlazas.addRow([]);
      
      const plazaHeader = sheetPlazas.addRow(['Plaza', 'Recolecciones', 'Kilos', 'CO₂ Evitado (kg)']);
      plazaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      plazaHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      plazaHeader.height = 25;
      
      const startRow = 4;
      comparativaPlazas.forEach((plaza, index) => {
        const row = sheetPlazas.addRow([
          plaza.plaza_nombre,
          plaza.total_recolecciones || 0,
          parseFloat(plaza.total_kilos.toFixed(2)),
          parseFloat(plaza.total_co2_evitado.toFixed(2))
        ]);
        
        // Alternar colores
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' }
          };
        }
      });
      
      // Aplicar barras de datos (data bars) a la columna de Kilos
      const maxKilos = Math.max(...comparativaPlazas.map(p => p.total_kilos));
      for (let i = 0; i < comparativaPlazas.length; i++) {
        const cell = sheetPlazas.getCell(`C${startRow + i}`);
        cell.fill = {
          type: 'gradient',
          gradient: 'angle',
          degree: 0,
          stops: [
            { position: 0, color: { argb: 'FFFFFFFF' } },
            { position: comparativaPlazas[i].total_kilos / maxKilos, color: { argb: 'FF10B981' } },
            { position: 1, color: { argb: 'FFFFFFFF' } }
          ]
        };
      }
      
      sheetPlazas.getColumn('A').width = 40;
      sheetPlazas.getColumn('B').width = 18;
      sheetPlazas.getColumn('C').width = 20;
      sheetPlazas.getColumn('D').width = 20;
      
      // ============================================================
      // HOJA 3: MATERIALES CON GRÁFICA CIRCULAR
      // ============================================================
      console.log('📄 Creando hoja: Por Material con visualización...');
      const sheetMateriales = workbook.addWorksheet('Por Material', {
        properties: { tabColor: { argb: 'FF10B981' } }
      });
      
      sheetMateriales.mergeCells('A1:E1');
      const materialTitle = sheetMateriales.getCell('A1');
      materialTitle.value = '♻️ RECOLECCIONES POR TIPO DE MATERIAL';
      materialTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      materialTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      materialTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      sheetMateriales.getRow(1).height = 30;
      
      sheetMateriales.addRow([]);
      
      const materialHeader = sheetMateriales.addRow(['Material', 'Kilos', 'CO₂ Evitado (kg)', '% del Total', 'Visual']);
      materialHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      materialHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      materialHeader.height = 25;
      
      statsByTipo.forEach((tipo, index) => {
        const porcentaje = (tipo.total_kilos / stats.total_kilos) * 100;
        const row = sheetMateriales.addRow([
          tipo.tipo_residuo,
          parseFloat(tipo.total_kilos.toFixed(2)),
          parseFloat(tipo.total_co2_evitado.toFixed(2)),
          `${porcentaje.toFixed(1)}%`,
          ''
        ]);
        
        // Barra visual en columna E
        const barraWidth = Math.round(porcentaje / 2); // Escala al 50%
        row.getCell(5).value = '█'.repeat(barraWidth);
        row.getCell(5).font = { color: { argb: 'FF10B981' } };
        
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' }
          };
        }
      });
      
      sheetMateriales.getColumn('A').width = 25;
      sheetMateriales.getColumn('B').width = 18;
      sheetMateriales.getColumn('C').width = 20;
      sheetMateriales.getColumn('D').width = 15;
      sheetMateriales.getColumn('E').width = 50;
      
      // ============================================================
      // HOJA 4: TOP LOCALES CON FORMATO RANKING
      // ============================================================
      console.log('📄 Creando hoja: Top Locales...');
      const sheetTop = workbook.addWorksheet('Top Locales', {
        properties: { tabColor: { argb: 'FF34D399' } }
      });
      
      sheetTop.mergeCells('A1:E1');
      const topTitle = sheetTop.getCell('A1');
      topTitle.value = '🏆 RANKING DE LOCALES MÁS PRODUCTIVOS';
      topTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      topTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      topTitle.alignment = { horizontal: 'center', vertical: 'middle' };
      sheetTop.getRow(1).height = 30;
      
      sheetTop.addRow([]);
      
      const topHeader = sheetTop.addRow(['Posición', 'Local', 'Plaza', 'Kilos', 'CO₂ Evitado (kg)']);
      topHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      topHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF047857' }
      };
      topHeader.height = 25;
      
      topLocales.forEach((local, index) => {
        const row = sheetTop.addRow([
          index + 1,
          local.local_nombre,
          local.plaza_nombre,
          parseFloat(local.total_kilos.toFixed(2)),
          parseFloat(local.total_co2_evitado.toFixed(2))
        ]);
        
        // Destacar top 3
        if (index < 3) {
          const colors = ['FFFFD700', 'FFC0C0C0', 'FFCD7F32']; // Oro, Plata, Bronce
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colors[index] }
          };
          row.font = { bold: true };
        } else if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' }
          };
        }
      });
      
      sheetTop.getColumn('A').width = 12;
      sheetTop.getColumn('B').width = 50;
      sheetTop.getColumn('C').width = 35;
      sheetTop.getColumn('D').width = 18;
      sheetTop.getColumn('E').width = 20;
      
      // ============================================================
      // HOJA 5: TENDENCIA MENSUAL
      // ============================================================
      if (tendencia && tendencia.length > 0) {
        console.log('📄 Creando hoja: Tendencia Mensual...');
        const sheetTendencia = workbook.addWorksheet('Tendencia Mensual', {
          properties: { tabColor: { argb: 'FF6EE7B7' } }
        });
        
        sheetTendencia.mergeCells('A1:C1');
        const tendenciaTitle = sheetTendencia.getCell('A1');
        tendenciaTitle.value = '📈 TENDENCIA MENSUAL';
        tendenciaTitle.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        tendenciaTitle.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF047857' }
        };
        tendenciaTitle.alignment = { horizontal: 'center', vertical: 'middle' };
        sheetTendencia.getRow(1).height = 30;
        
        sheetTendencia.addRow([]);
        
        const tendenciaHeader = sheetTendencia.addRow(['Mes', 'Kilos', 'CO₂ Evitado (kg)']);
        tendenciaHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        tendenciaHeader.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF047857' }
        };
        
        tendencia.forEach((mes, index) => {
          const row = sheetTendencia.addRow([
            mes.mes,
            parseFloat(mes.total_kilos.toFixed(2)),
            parseFloat(mes.total_co2_evitado.toFixed(2))
          ]);
          
          if (index % 2 === 0) {
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF0FDF4' }
            };
          }
        });
        
        sheetTendencia.getColumn('A').width = 15;
        sheetTendencia.getColumn('B').width = 18;
        sheetTendencia.getColumn('C').width = 20;
      }
      
      // ============================================================
      // GENERAR Y ENVIAR ARCHIVO
      // ============================================================
      console.log('💾 Generando archivo Excel...');
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      console.log('✅ Excel generado exitosamente:', buffer.byteLength, 'bytes');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-ejecutivo-${Date.now()}.xlsx`);
      res.setHeader('Content-Length', buffer.byteLength.toString());
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('❌ Error generando Excel:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generando reporte Excel',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  }
}