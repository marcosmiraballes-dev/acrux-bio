/**
 * SERVICIO PARA GENERAR BITÁCORA DE LOCATARIO
 * Versión mejorada con diseño profesional - Verde corporativo
 */

import ExcelJS from 'exceljs';
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

export class BitacoraService {
  
  /**
   * Generar bitácora de locatario en Excel
   */
  async generarBitacoraLocatario(req: Request, res: Response) {
    try {
      console.log('📋 Iniciando generación de bitácora...');
      
      const local_id = req.query.local_id as string;
      const fecha_desde = req.query.fecha_desde as string;
      const fecha_hasta = req.query.fecha_hasta as string;
      
      if (!local_id || !fecha_desde || !fecha_hasta) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros requeridos: local_id, fecha_desde, fecha_hasta'
        });
      }

      // Obtener información del local
      const { data: local, error: localError } = await supabase
        .from('locales')
        .select(`
          id,
          nombre,
          plaza:plazas(nombre)
        `)
        .eq('id', local_id)
        .single();
      
      if (localError || !local) {
        return res.status(404).json({
          success: false,
          error: 'Local no encontrado'
        });
      }

      // Obtener datos de la bitácora usando la función SQL
      const { data: bitacora, error: bitacoraError } = await supabase
        .rpc('get_bitacora_locatario', {
          p_local_id: local_id,
          p_fecha_desde: fecha_desde,
          p_fecha_hasta: fecha_hasta
        });
      
      if (bitacoraError) {
        console.error('Error obteniendo bitácora:', bitacoraError);
        return res.status(500).json({
          success: false,
          error: 'Error obteniendo datos de la bitácora',
          details: bitacoraError.message
        });
      }

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Bitácora de Residuos Sólidos'); // ✅ CAMBIO
      
      // Configurar página para impresión
      sheet.pageSetup = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }
      };
      
      // ============================================================
      // COLORES CORPORATIVOS
      // ============================================================
      const VERDE_CORPORATIVO = '047857'; // Verde Elefantes Verdes
      
      // ============================================================
      // HEADER CON TÍTULO Y LOGO
      // ============================================================
      
      let currentRow = 1;
      
      // Título - Fila 1 con fondo verde
      sheet.mergeCells('A1:L1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'Bitácora de Residuos Sólidos'; // ✅ CAMBIO
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${VERDE_CORPORATIVO}` }
      };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;
      
      // Logo (si existe) - ✅ CAMBIO: ruta actualizada a logo-blanco.png
      const logoPath = path.join(__dirname, '../../public/logo-blanco.png');
      if (fs.existsSync(logoPath)) {
        const logoId = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        // Posicionar logo proporcionalmente (altura máxima 5 filas)
        sheet.addImage(logoId, {
          tl: { col: 9.5, row: 1.5 },   // Top-left ajustado
          br: { col: 11.5, row: 6.5 },  // Bottom-right - mantiene proporción
          editAs: 'oneCell'              // Mantiene aspecto ratio
        });
      } else {
        // Si no hay logo, agregar texto en J2:L7
        sheet.mergeCells('J2:L7');
        const logoTextCell = sheet.getCell('J2');
        logoTextCell.value = 'ELEFANTE VERDE\nEstrategias Ambientales';
        logoTextCell.font = { size: 11, bold: true, color: { argb: `FF${VERDE_CORPORATIVO}` } };
        logoTextCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
      
      currentRow = 3; // Dejar una fila en blanco
      
      // ============================================================
      // INFORMACIÓN DEL REPORTE (4 FILAS CON FONDO VERDE)
      // ============================================================
      
      // Convertir fechas de YYYY-MM-DD a DD/MM/YYYY
      const formatearFecha = (fecha: string) => {
        const partes = fecha.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      };
      
      // Estilo para labels de información
      const estiloLabel = {
        font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: `FF${VERDE_CORPORATIVO}` }
        },
        alignment: { horizontal: 'left' as const, vertical: 'middle' as const }
      };
      
      // Fecha inicio
      let labelCell = sheet.getCell(`A${currentRow}`);
      labelCell.value = 'Fecha inicio';
      Object.assign(labelCell, estiloLabel);
      sheet.getCell(`B${currentRow}`).value = formatearFecha(fecha_desde);
      sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
      currentRow++;
      
      // Fecha fin
      labelCell = sheet.getCell(`A${currentRow}`);
      labelCell.value = 'Fecha fin';
      Object.assign(labelCell, estiloLabel);
      sheet.getCell(`B${currentRow}`).value = formatearFecha(fecha_hasta);
      sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
      currentRow++;
      
      // Plaza
      labelCell = sheet.getCell(`A${currentRow}`);
      labelCell.value = 'Plaza';
      Object.assign(labelCell, estiloLabel);
      sheet.getCell(`B${currentRow}`).value = local.plaza?.nombre || 'N/A';
      sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
      currentRow++;
      
      // Locatario
      labelCell = sheet.getCell(`A${currentRow}`);
      labelCell.value = 'Locatario';
      Object.assign(labelCell, estiloLabel);
      sheet.getCell(`B${currentRow}`).value = local.nombre;
      sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
      currentRow++;
      
      // ============================================================
      // TABLA DE DATOS
      // ============================================================
      
      currentRow++; // Fila en blanco antes de la tabla
      const tableStartRow = currentRow;
      
      // Headers de la tabla con fondo verde
      const headers = [
        'Fecha',
        'Organico',
        'Inorganico',
        'Carton',
        'Aluminio',
        'Archivo',
        'Plastico Duro',
        'Pet',
        'Playo',
        'Vidrio',
        'TetraPak',
        'Chatarra'
      ];
      
      const headerRow = sheet.getRow(tableStartRow);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${VERDE_CORPORATIVO}` }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 22;
      
      // Inicializar totales
      const totales = {
        organico: 0,
        inorganico: 0,
        carton: 0,
        aluminio: 0,
        archivo: 0,
        plastico_duro: 0,
        pet: 0,
        playo: 0,
        vidrio: 0,
        tetra_pak: 0,
        chatarra: 0
      };
      
      let totalGeneral = 0;
      
      // Datos de la bitácora
      if (bitacora && bitacora.length > 0) {
        bitacora.forEach((row: any, index: number) => {
          const dataRow = sheet.getRow(tableStartRow + 1 + index);
          
          // Formatear fecha
          const fechaFormateada = formatearFecha(row.fecha);
          
          const organico = parseFloat(row.organico) || 0;
          const inorganico = parseFloat(row.inorganico) || 0;
          const carton = parseFloat(row.carton) || 0;
          const aluminio = parseFloat(row.aluminio) || 0;
          const archivo = parseFloat(row.archivo) || 0;
          const plastico_duro = parseFloat(row.plastico_duro) || 0;
          const pet = parseFloat(row.pet) || 0;
          const playo = parseFloat(row.playo) || 0;
          const vidrio = parseFloat(row.vidrio) || 0;
          const tetra_pak = parseFloat(row.tetra_pak) || 0;
          const chatarra = parseFloat(row.chatarra) || 0;
          
          // Acumular totales
          totales.organico += organico;
          totales.inorganico += inorganico;
          totales.carton += carton;
          totales.aluminio += aluminio;
          totales.archivo += archivo;
          totales.plastico_duro += plastico_duro;
          totales.pet += pet;
          totales.playo += playo;
          totales.vidrio += vidrio;
          totales.tetra_pak += tetra_pak;
          totales.chatarra += chatarra;
          
          const values = [
            fechaFormateada,
            organico,
            inorganico,
            carton,
            aluminio,
            archivo,
            plastico_duro,
            pet,
            playo,
            vidrio,
            tetra_pak,
            chatarra
          ];
          
          values.forEach((value, colIndex) => {
            const cell = dataRow.getCell(colIndex + 1);
            
            if (colIndex === 0) {
              // Fecha - centrada
              cell.value = value;
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else {
              // Números - centrados con formato
              const numValue = value as number;
              cell.value = numValue;
              cell.numFmt = '#,##0.00';
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          
          dataRow.height = 18;
        });
        
        // Fila de TOTALES con fondo verde claro
        const totalRow = sheet.getRow(tableStartRow + 1 + bitacora.length);
        
        // Celda "Total:"
        const totalLabelCell = totalRow.getCell(1);
        totalLabelCell.value = 'Total:';
        totalLabelCell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        totalLabelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' }
        };
        totalLabelCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalLabelCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Valores de totales
        const totalesArray = [
          totales.organico,
          totales.inorganico,
          totales.carton,
          totales.aluminio,
          totales.archivo,
          totales.plastico_duro,
          totales.pet,
          totales.playo,
          totales.vidrio,
          totales.tetra_pak,
          totales.chatarra
        ];
        
        totalesArray.forEach((total, index) => {
          const cell = totalRow.getCell(index + 2);
          cell.value = parseFloat(total.toFixed(2));
          cell.numFmt = '#,##0.00';
          totalGeneral += total;
          cell.font = { bold: true, size: 10 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        totalRow.height = 22;
        
        // ============================================================
        // TOTAL GENERAL (Esquina inferior derecha)
        // ============================================================
        
        const totalGeneralRow = sheet.getRow(tableStartRow + 2 + bitacora.length);
        
        const totalGeneralLabelCell = totalGeneralRow.getCell(11);
        totalGeneralLabelCell.value = 'Total General:';
        totalGeneralLabelCell.font = { bold: true, size: 12 };
        totalGeneralLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
        
        const totalGeneralValueCell = totalGeneralRow.getCell(12);
        totalGeneralValueCell.value = parseFloat(totalGeneral.toFixed(2));
        totalGeneralValueCell.font = { bold: true, size: 12, color: { argb: `FF${VERDE_CORPORATIVO}` } };
        totalGeneralValueCell.numFmt = '#,##0.00';
        totalGeneralValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalGeneralValueCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }
        };
        totalGeneralValueCell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        };
        
        totalGeneralRow.height = 25;
        
      } else {
        // No hay datos
        const noDataRow = sheet.getRow(tableStartRow + 1);
        sheet.mergeCells(tableStartRow + 1, 1, tableStartRow + 1, 12);
        const noDataCell = noDataRow.getCell(1);
        noDataCell.value = 'No hay recolecciones en el periodo seleccionado';
        noDataCell.alignment = { horizontal: 'center', vertical: 'middle' };
        noDataCell.font = { italic: true, color: { argb: 'FF666666' } };
        noDataRow.height = 30;
      }
      
      // ============================================================
      // AJUSTAR ANCHOS DE COLUMNAS
      // ============================================================
      
      sheet.getColumn(1).width = 12;  // Fecha
      sheet.getColumn(2).width = 11;  // Orgánico
      sheet.getColumn(3).width = 12;  // Inorgánico
      sheet.getColumn(4).width = 10;  // Cartón
      sheet.getColumn(5).width = 10;  // Aluminio
      sheet.getColumn(6).width = 10;  // Archivo
      sheet.getColumn(7).width = 13;  // Plástico Duro
      sheet.getColumn(8).width = 9;   // Pet
      sheet.getColumn(9).width = 9;   // Playo
      sheet.getColumn(10).width = 9;  // Vidrio
      sheet.getColumn(11).width = 10; // TetraPak
      sheet.getColumn(12).width = 10; // Chatarra
      
      // ============================================================
      // GENERAR Y ENVIAR
      // ============================================================
      
      console.log('💾 Generando archivo Excel...');
      
      const buffer = await workbook.xlsx.writeBuffer();
      
      console.log('✅ Bitácora generada exitosamente:', buffer.byteLength, 'bytes');
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Bitacora_${local.nombre.replace(/\s+/g, '_')}_${fecha_desde.split('-')[1]}_${fecha_desde.split('-')[0]}.xlsx`);
      res.setHeader('Content-Length', buffer.byteLength.toString());
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('❌ Error generando bitácora:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error generando bitácora',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  }
}