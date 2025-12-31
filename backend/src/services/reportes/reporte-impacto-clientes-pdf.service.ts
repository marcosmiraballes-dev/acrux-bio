import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import { RecoleccionService } from '../recoleccion.service';
import { calculosAmbientalesService } from './calculos-ambientales.service';

const recoleccionService = new RecoleccionService();

export class ReporteImpactoClientesPDFService {

  /**
   * Genera el reporte PDF de Impacto Ambiental para clientes/inversionistas
   */
  async generarReporte(
    fechaInicio: string,
    fechaFin: string,
    plazaId?: string
  ): Promise<any> {
    
    const doc = new PDFDocument({ 
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Obtener datos
    const datos = await this.obtenerDatos(fechaInicio, fechaFin, plazaId);

    // Generar páginas
    await this.generarPortada(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarPanoramaGeneral(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarEquivalenciasAmbientales(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarDesglosePorMaterial(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarCrecimientoImpacto(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarPorUbicacion(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarProyeccion(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarMetodologia(doc, datos);

    doc.end();
    return doc;
  }

  /**
   * Obtiene todos los datos necesarios
   */
  private async obtenerDatos(fechaInicio: string, fechaFin: string, plazaId?: string) {
    const filters = {
      plazaId: plazaId || undefined,
      fechaInicio,
      fechaFin
    };

    const [
      stats,
      statsByTipo,
      comparativaPlazas,
      tendencia
    ] = await Promise.all([
      recoleccionService.getStats(filters),
      recoleccionService.getStatsByTipo(filters),
      recoleccionService.getComparativaPlazas({}),
      recoleccionService.getTendenciaMensual(filters)
    ]);

    // Preparar datos para cálculos ambientales
    const materiales = statsByTipo.map((t: any) => ({
      tipo: t.tipo_residuo_nombre,
      kilos: t.total_kilos,
      co2_evitado: t.co2_evitado
    }));

    const impactoTotal = calculosAmbientalesService.calcularImpactoTotal(materiales);

    // Calcular días transcurridos para proyección
    const diasTranscurridos = this.calcularDiasTranscurridos(fechaInicio, fechaFin);

    return {
      fechaInicio,
      fechaFin,
      stats,
      statsByTipo,
      comparativaPlazas,
      tendencia,
      impactoTotal,
      diasTranscurridos
    };
  }

  /**
   * Página 1: Portada Impactante
   */
  private async generarPortada(doc: any, datos: any) {
    const centerX = doc.page.width / 2;
    
    // Fondo verde suave (simulado con rectángulo)
    doc.rect(0, 0, doc.page.width, 300)
       .fillColor('#D1FAE5')
       .fill();

    // Título principal
    doc.fontSize(32)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('NUESTRO IMPACTO', centerX - 150, 100);
    
    doc.fontSize(32)
       .text('AMBIENTAL', centerX - 120, 140);

    // Período
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#065F46')
       .text(this.formatearPeriodo(datos.fechaInicio, datos.fechaFin), centerX - 100, 200);

    // Separador
    doc.moveTo(50, 320)
       .lineTo(doc.page.width - 50, 320)
       .strokeColor('#047857')
       .lineWidth(3)
       .stroke();

    // Información de la empresa
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Elefantes Verdes', centerX - 90, 360);
    
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Quintana Roo, México', centerX - 70, 390);

    // Footer de portada
    doc.fontSize(10)
       .fillColor('#999999')
       .text(`Generado: ${this.formatearFecha(new Date().toISOString().split('T')[0])}`, 
             centerX - 60, doc.page.height - 100);
  }

  /**
   * Página 2: El Panorama General
   */
  private async generarPanoramaGeneral(doc: any, datos: any) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('El Panorama General', 50, 50);

    const y = 120;
    const boxHeight = 100;
    const gap = 20;

    // KPI 1: Materiales Reciclados
    this.dibujarKPIGrande(doc, 50, y, 
      datos.impactoTotal.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }),
      'KG',
      'Materiales Reciclados',
      '#10B981');

    // KPI 2: CO₂ Evitado
    this.dibujarKPIGrande(doc, 50, y + boxHeight + gap,
      datos.impactoTotal.total_co2_ton.toLocaleString('es-MX', { maximumFractionDigits: 1 }),
      'TON',
      'CO₂ Evitado',
      '#3B82F6');

    // KPI 3: Recolecciones
    this.dibujarKPIGrande(doc, 50, y + (boxHeight + gap) * 2,
      datos.stats.total_recolecciones.toLocaleString('es-MX'),
      '',
      'Recolecciones Realizadas',
      '#F59E0B');

    // KPI 4: Plazas/Locales
    const numPlazas = datos.comparativaPlazas.length;
    this.dibujarKPIGrande(doc, 50, y + (boxHeight + gap) * 3,
      `${numPlazas} Plazas`,
      '',
      'Operación Multi-plaza',
      '#8B5CF6');
  }

  /**
   * Dibuja un KPI grande estilo storytelling
   */
  private dibujarKPIGrande(doc: any, x: number, y: number, 
                           value: string, unit: string, label: string, color: string) {
    const width = doc.page.width - 100;
    const height = 80;

    // Box con borde grueso
    doc.rect(x, y, width, height)
       .strokeColor(color)
       .lineWidth(3)
       .stroke();

    // Valor grande
    doc.fontSize(36)
       .font('Helvetica-Bold')
       .fillColor(color)
       .text(value, x + 20, y + 15, { width: width - 40 });

    // Unidad
    if (unit) {
      doc.fontSize(14)
         .font('Helvetica')
         .fillColor('#666666')
         .text(unit, x + 20, y + 55);
    }

    // Label
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000000')
       .text(label, x + width - 200, y + 55, { width: 180, align: 'right' });
  }

  /**
   * Página 3: Equivalencias Ambientales
   */
  private async generarEquivalenciasAmbientales(doc: any, datos: any) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Nuestro Impacto Equivale a:', 50, 50);

    const equivalencias = [
      {
        emoji: '🌳',
        titulo: 'Árboles Plantados',
        valor: datos.impactoTotal.arboles_equivalentes.toLocaleString('es-MX'),
        descripcion: 'CO₂ capturado en 1 año'
      },
      {
        emoji: '🚗',
        titulo: 'Kilómetros NO Recorridos',
        valor: datos.impactoTotal.km_auto_equivalentes.toLocaleString('es-MX'),
        descripcion: 'en auto promedio'
      },
      {
        emoji: '💡',
        titulo: 'Energía Ahorrada',
        valor: `${datos.impactoTotal.energia_kwh.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kWh`,
        descripcion: 'producción evitada'
      },
      {
        emoji: '💧',
        titulo: 'Agua Ahorrada',
        valor: `${datos.impactoTotal.agua_litros.toLocaleString('es-MX')} Litros`,
        descripcion: 'en producción de materiales'
      },
      {
        emoji: '⚡',
        titulo: 'Hogares Abastecidos',
        valor: datos.impactoTotal.hogares_abastecidos.toString(),
        descripcion: 'energía equivalente por 1 mes'
      }
    ];

    let y = 120;
    equivalencias.forEach(eq => {
      this.dibujarEquivalencia(doc, 50, y, eq);
      y += 120;
    });
  }

  /**
   * Dibuja una equivalencia ambiental
   */
  private dibujarEquivalencia(doc: any, x: number, y: number, eq: any) {
    const width = doc.page.width - 100;

    // Box
    doc.rect(x, y, width, 100)
       .fillColor('#F0FDF4')
       .fill()
       .strokeColor('#10B981')
       .lineWidth(2)
       .stroke();

    // Emoji
    doc.fontSize(40)
       .text(eq.emoji, x + 20, y + 30);

    // Título
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(eq.titulo, x + 80, y + 20);

    // Valor grande
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text(eq.valor, x + 80, y + 45);

    // Descripción
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(eq.descripcion, x + 80, y + 80);
  }

  /**
   * Página 4: Desglose por Material
   */
  private async generarDesglosePorMaterial(doc: any, datos: any) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Desglose por Material', 50, 50);

    let y = 100;

    // Mostrar solo los top 5 materiales
    datos.impactoTotal.materiales_impacto.slice(0, 5).forEach((material: any) => {
      this.dibujarMaterialImpacto(doc, 50, y, material, datos.impactoTotal.total_kilos);
      y += 130;
    });
  }

  /**
   * Dibuja el impacto de un material
   */
  private dibujarMaterialImpacto(doc: any, x: number, y: number, material: any, totalKilos: number) {
    const width = doc.page.width - 100;
    const porcentaje = ((material.kilos / totalKilos) * 100).toFixed(1);

    // Box
    doc.rect(x, y, width, 110)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    // Título del material
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(`${material.tipo.toUpperCase()}: ${material.kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg`, 
             x + 15, y + 15);

    // Porcentaje
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`${porcentaje}% del total`, x + width - 100, y + 18);

    // Impactos específicos
    let infoY = y + 45;
    
    // CO₂
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#333333')
       .text(`→ ${material.co2_evitado_ton} ton de CO₂ evitadas`, x + 15, infoY);
    infoY += 20;

    // Impactos específicos según tipo
    if (material.petroleo_litros) {
      doc.text(`→ ${material.petroleo_litros.toLocaleString('es-MX')} litros de petróleo ahorrados`, x + 15, infoY);
      infoY += 20;
    }

    if (material.arboles_salvados) {
      doc.text(`→ ${material.arboles_salvados} árboles salvados`, x + 15, infoY);
      infoY += 20;
    }

    if (material.agua_litros > 0) {
      doc.text(`→ ${material.agua_litros.toLocaleString('es-MX')} litros de agua ahorrados`, x + 15, infoY);
    }
  }

  /**
   * Página 5: Crecimiento e Impacto
   */
  private async generarCrecimientoImpacto(doc: any, datos: any) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Evolución del Impacto', 50, 50);

    // Tabla de tendencia mensual
    const startY = 120;
    const rowHeight = 30;

    // Headers
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    const headers = ['Mes/Año', 'Kilos', 'CO₂ (ton)'];
    let x = 50;
    const colWidths = [150, 150, 150];

    headers.forEach((header, i) => {
      doc.rect(x, startY, colWidths[i], 25)
         .fillColor('#047857')
         .fill();
      
      doc.text(header, x + 10, startY + 7, { width: colWidths[i] - 20 });
      x += colWidths[i];
    });

    // Datos
    doc.font('Helvetica').fillColor('#000000');
    let row = startY + 25;

    datos.tendencia.slice(0, 10).forEach((mes: any) => {
      x = 50;
      
      doc.text(`${mes.mes} ${mes.anio}`, x + 10, row + 7, { width: colWidths[0] - 20 });
      x += colWidths[0];
      
      doc.text(mes.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), 
               x + 10, row + 7, { width: colWidths[1] - 20 });
      x += colWidths[1];
      
      doc.text((mes.co2_evitado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 2 }), 
               x + 10, row + 7, { width: colWidths[2] - 20 });
      
      row += rowHeight;
    });
  }

  /**
   * Página 6: Por Ubicación
   */
  private async generarPorUbicacion(doc: any, datos: any) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Impacto por Ubicación', 50, 50);

    let y = 120;

    datos.comparativaPlazas.forEach((plaza: any) => {
      const porcentaje = ((plaza.total_kilos / datos.stats.total_kilos) * 100).toFixed(0);
      
      // Nombre de la plaza
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(plaza.plaza_nombre, 50, y);

      // Barra de progreso
      const barWidth = (doc.page.width - 200) * (plaza.total_kilos / datos.stats.total_kilos);
      doc.rect(50, y + 25, doc.page.width - 200, 30)
         .strokeColor('#CCCCCC')
         .lineWidth(1)
         .stroke();

      doc.rect(50, y + 25, barWidth, 30)
         .fillColor('#10B981')
         .fill();

      // Valor y porcentaje
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#FFFFFF')
         .text(`${plaza.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg (${porcentaje}%)`, 
               60, y + 35);

      y += 80;
    });
  }

  /**
   * Página 7: Proyección
   */
  private async generarProyeccion(doc: any, datos: any) {
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Proyección Futura', 50, 50);

    const proyeccion = calculosAmbientalesService.calcularProyeccionAnual(
      datos.impactoTotal.total_kilos,
      datos.diasTranscurridos
    );

    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#000000')
       .text('Si mantenemos este ritmo:', 50, 120);

    let y = 160;

    const proyecciones = [
      {
        titulo: 'En 1 año habremos reciclado:',
        items: [
          `→ ${proyeccion.proyeccion_anual.toLocaleString('es-MX')} kg de materiales`,
          `→ ${Math.round((proyeccion.proyeccion_anual * datos.impactoTotal.total_co2_ton / datos.impactoTotal.total_kilos) * 100) / 100} ton de CO₂ evitadas`,
          `→ Equivalente a ${calculosAmbientalesService.calcularArbolesEquivalentes(proyeccion.proyeccion_anual * datos.impactoTotal.total_co2_kg / datos.impactoTotal.total_kilos).toLocaleString('es-MX')} árboles`
        ]
      }
    ];

    proyecciones.forEach(p => {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#047857')
         .text(p.titulo, 50, y);
      
      y += 40;

      p.items.forEach(item => {
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#333333')
           .text(item, 70, y);
        y += 25;
      });
    });
  }

  /**
   * Página 8: Metodología
   */
  private async generarMetodologia(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Metodología de Cálculo', 50, 50);

    const metodologia = [
      {
        titulo: 'Factores de Conversión:',
        items: [
          'CO₂ por kg de material: según tipo de residuo',
          'Árboles: 1 árbol captura 22 kg CO₂/año',
          'Autos: 0.12 kg CO₂/km promedio',
          'Energía: según tipo de material (kWh/kg)',
          'Agua: según tipo de material (L/kg)'
        ]
      },
      {
        titulo: 'Fuentes:',
        items: [
          'EPA (Environmental Protection Agency)',
          'SEMARNAT México',
          'The Recycling Partnership',
          'Estándares internacionales de reciclaje'
        ]
      }
    ];

    let y = 100;

    metodologia.forEach(seccion => {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(seccion.titulo, 50, y);
      
      y += 30;

      seccion.items.forEach(item => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#333333')
           .text(`• ${item}`, 70, y);
        y += 20;
      });

      y += 20;
    });
  }

  /**
   * Utilidades
   */
  private agregarNuevaPagina(doc: any) {
    doc.addPage();
  }

  private formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-MX', options);
  }

  private formatearPeriodo(inicio: string, fin: string): string {
    return `${this.formatearFecha(inicio)} - ${this.formatearFecha(fin)}`;
  }

  private calcularDiasTranscurridos(inicio: string, fin: string): number {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const diferencia = fechaFin.getTime() - fechaInicio.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
}

export const reporteImpactoClientesPDFService = new ReporteImpactoClientesPDFService();