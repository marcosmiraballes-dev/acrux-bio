import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import { RecoleccionService } from '../recoleccion.service';
import { calculosAmbientalesService } from './calculos-ambientales.service';

const recoleccionService = new RecoleccionService();

export class ReporteImpactoInternoPDFService {

  /**
   * Genera el reporte PDF de Impacto Ambiental para uso interno
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
    
    await this.generarResumenEjecutivo(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarAnalisisEficiencia(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarAnalisisPorMaterial(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarComparativas(doc, datos);
    this.agregarNuevaPagina(doc);
    
    await this.generarProblemasIdentificados(doc, datos);

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
      topLocales,
      comparativaPlazas,
      comparativaMensual,
      comparativaAnual,
      recolecciones
    ] = await Promise.all([
      recoleccionService.getStats(filters),
      recoleccionService.getStatsByTipo(filters),
      recoleccionService.getTopLocales(filters),
      recoleccionService.getComparativaPlazas({}),
      recoleccionService.getComparativaMensual(filters),
      recoleccionService.getComparativaAnual(filters),
      recoleccionService.getAll(filters)
    ]);

    // Preparar datos para cálculos
    const materiales = statsByTipo.map((t: any) => ({
      tipo: t.tipo_residuo_nombre,
      kilos: t.total_kilos,
      co2_evitado: t.co2_evitado
    }));

    const impactoTotal = calculosAmbientalesService.calcularImpactoTotal(materiales);

    return {
      fechaInicio,
      fechaFin,
      stats,
      statsByTipo,
      topLocales,
      comparativaPlazas,
      comparativaMensual,
      comparativaAnual,
      recolecciones: Array.isArray(recolecciones) ? recolecciones : (recolecciones as any).data || [],
      impactoTotal
    };
  }

  /**
   * Página 1: Portada
   */
  private async generarPortada(doc: any, datos: any) {
    const centerX = doc.page.width / 2;
    
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('REPORTE DE IMPACTO', centerX - 140, 150);
    
    doc.fontSize(28)
       .text('AMBIENTAL', centerX - 90, 190);

    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#000000')
       .text('Análisis Interno', centerX - 60, 240);

    // Período
    doc.fontSize(14)
       .fillColor('#666666')
       .text(`${this.formatearFecha(datos.fechaInicio)} - ${this.formatearFecha(datos.fechaFin)}`, 
             centerX - 100, 280);

    // Marca de confidencial
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#EF4444')
       .text('CONFIDENCIAL - USO INTERNO', centerX - 100, 350);

    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#000000')
       .text('Elefantes Verdes', centerX - 70, 400);
  }

  /**
   * Página 2: Resumen Ejecutivo
   */
  private async generarResumenEjecutivo(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Resumen Ejecutivo', 50, 50);

    // KPIs principales
    const y = 100;
    this.dibujarKPI(doc, 50, y, 'Total Kilos', datos.stats.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }));
    this.dibujarKPI(doc, 50, y + 60, 'CO₂ Evitado (ton)', (datos.stats.co2_evitado / 1000).toFixed(2));
    this.dibujarKPI(doc, 50, y + 120, 'Recolecciones', datos.stats.total_recolecciones.toLocaleString());
    this.dibujarKPI(doc, 50, y + 180, 'Promedio kg/Recolección', 
                    (datos.stats.total_kilos / datos.stats.total_recolecciones).toFixed(1));

    // Alertas y observaciones
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Alertas y Observaciones:', 50, y + 260);

    let alertY = y + 290;
    
    // Variación mensual
    if (datos.comparativaMensual) {
      const variacion = datos.comparativaMensual.variacion_kilos || 0;
      const color = variacion >= 0 ? '#10B981' : '#EF4444';
      const simbolo = variacion >= 0 ? '↑' : '↓';
      
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(color)
         .text(`${simbolo} Variación mensual: ${Math.abs(variacion).toFixed(1)}% en kilos`, 
               70, alertY);
      alertY += 25;
    }

    // Locales sin actividad
    const localesInactivos = this.identificarLocalesInactivos(datos.recolecciones);
    if (localesInactivos.length > 0) {
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#F59E0B')
         .text(`⚠️ ${localesInactivos.length} locales sin recolecciones en el período`, 
               70, alertY);
    }
  }

  /**
   * Página 3: Análisis de Eficiencia
   */
  private async generarAnalisisEficiencia(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Análisis de Eficiencia Operativa', 50, 50);

    const promedioKgRecoleccion = datos.stats.total_kilos / datos.stats.total_recolecciones;

    let y = 120;

    // Métricas de eficiencia
    const metricas = [
      {
        label: 'Promedio kg/recolección',
        valor: promedioKgRecoleccion.toFixed(1),
        unidad: 'kg'
      },
      {
        label: 'Total de recolecciones',
        valor: datos.stats.total_recolecciones.toLocaleString(),
        unidad: ''
      },
      {
        label: 'Locales activos',
        valor: new Set(datos.recolecciones.map((r: any) => r.local_id)).size.toString(),
        unidad: ''
      },
      {
        label: 'Plazas operando',
        valor: datos.comparativaPlazas.length.toString(),
        unidad: ''
      }
    ];

    metricas.forEach(metrica => {
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#666666')
         .text(metrica.label, 50, y);

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#047857')
         .text(`${metrica.valor} ${metrica.unidad}`, 50, y + 20);

      y += 70;
    });

    // Eficiencia por plaza
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Eficiencia por Plaza:', 50, y + 20);

    y += 60;

    datos.comparativaPlazas.forEach((plaza: any) => {
      const eficiencia = plaza.total_recolecciones > 0 
        ? (plaza.total_kilos / plaza.total_recolecciones).toFixed(1)
        : '0.0';

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`${plaza.plaza_nombre}: ${eficiencia} kg/recolección`, 70, y);

      y += 25;
    });
  }

  /**
   * Página 4: Análisis por Material
   */
  private async generarAnalisisPorMaterial(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Análisis por Tipo de Material', 50, 50);

    // Tabla
    const startY = 100;
    const rowHeight = 30;

    // Headers
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');

    const headers = ['Material', 'Kilos', '%', 'CO₂/kg', 'CO₂ Total', 'Rentabilidad'];
    const colWidths = [100, 70, 50, 60, 70, 70];
    let x = 50;

    headers.forEach((header, i) => {
      doc.rect(x, startY, colWidths[i], 25)
         .fillColor('#047857')
         .fill();
      
      doc.text(header, x + 5, startY + 8, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });

    // Datos
    doc.font('Helvetica').fillColor('#000000');
    let row = startY + 25;

    datos.statsByTipo.forEach((tipo: any) => {
      x = 50;
      const porcentaje = ((tipo.total_kilos / datos.stats.total_kilos) * 100).toFixed(1);
      const co2PorKg = tipo.total_kilos > 0 ? (tipo.co2_evitado / tipo.total_kilos).toFixed(2) : '0.00';
      const rentabilidad = this.calcularRentabilidad(tipo.tipo_residuo_nombre, parseFloat(co2PorKg));

      doc.fontSize(8)
         .text(tipo.tipo_residuo_nombre, x + 5, row + 8, { width: colWidths[0] - 10 });
      x += colWidths[0];

      doc.text(tipo.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 }), 
               x + 5, row + 8, { width: colWidths[1] - 10 });
      x += colWidths[1];

      doc.text(`${porcentaje}%`, x + 5, row + 8, { width: colWidths[2] - 10 });
      x += colWidths[2];

      doc.text(co2PorKg, x + 5, row + 8, { width: colWidths[3] - 10 });
      x += colWidths[3];

      doc.text((tipo.co2_evitado / 1000).toFixed(2), x + 5, row + 8, { width: colWidths[4] - 10 });
      x += colWidths[4];

      doc.text(rentabilidad, x + 5, row + 8, { width: colWidths[5] - 10 });

      row += rowHeight;
    });

    // Oportunidades
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Oportunidades Identificadas:', 50, row + 40);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text('• Incrementar recolección de materiales de alta rentabilidad (PET, Aluminio)', 
             70, row + 70);
    doc.text('• Optimizar rutas para materiales de bajo impacto', 70, row + 90);
  }

  /**
   * Página 5: Comparativas
   */
  private async generarComparativas(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Comparativas Temporales', 50, 50);

    let y = 120;

    // Comparativa mensual
    if (datos.comparativaMensual) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('vs Mes Anterior:', 50, y);

      y += 40;

      this.dibujarComparativa(doc, 50, y, 'Kilos', 
        datos.comparativaMensual.mes_actual_total_kilos || 0,
        datos.comparativaMensual.mes_anterior_total_kilos || 0,
        datos.comparativaMensual.variacion_kilos || 0);

      y += 60;

      this.dibujarComparativa(doc, 50, y, 'CO₂ (kg)',
        datos.comparativaMensual.mes_actual_co2_evitado || 0,
        datos.comparativaMensual.mes_anterior_co2_evitado || 0,
        datos.comparativaMensual.variacion_co2 || 0);

      y += 80;
    }

    // Comparativa anual
    if (datos.comparativaAnual) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('vs Año Anterior:', 50, y);

      y += 40;

      this.dibujarComparativa(doc, 50, y, 'Kilos',
        datos.comparativaAnual.anio_actual_total_kilos || 0,
        datos.comparativaAnual.anio_anterior_total_kilos || 0,
        datos.comparativaAnual.variacion_kilos || 0);

      y += 60;

      this.dibujarComparativa(doc, 50, y, 'CO₂ (kg)',
        datos.comparativaAnual.anio_actual_co2_evitado || 0,
        datos.comparativaAnual.anio_anterior_co2_evitado || 0,
        datos.comparativaAnual.variacion_co2 || 0);
    }
  }

  /**
   * Página 6: Problemas Identificados
   */
  private async generarProblemasIdentificados(doc: any, datos: any) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text('Problemas y Oportunidades', 50, 50);

    let y = 120;

    // Problemas
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#EF4444')
       .text('⚠️ Problemas Identificados:', 50, y);

    y += 40;

    const problemas = this.identificarProblemas(datos);
    problemas.forEach(problema => {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`• ${problema}`, 70, y);
      y += 25;
    });

    y += 20;

    // Oportunidades
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#10B981')
       .text('✓ Oportunidades:', 50, y);

    y += 40;

    const oportunidades = this.identificarOportunidades(datos);
    oportunidades.forEach(oportunidad => {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`• ${oportunidad}`, 70, y);
      y += 25;
    });
  }

  /**
   * Utilidades
   */
  private dibujarKPI(doc: any, x: number, y: number, label: string, valor: string) {
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(label, x, y);

    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#047857')
       .text(valor, x, y + 20);
  }

  private dibujarComparativa(doc: any, x: number, y: number, 
                             label: string, actual: number, anterior: number, variacion: number) {
    const color = variacion >= 0 ? '#10B981' : '#EF4444';
    const simbolo = variacion >= 0 ? '↑' : '↓';

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000000')
       .text(label, x, y);

    doc.fontSize(11)
       .fillColor('#666666')
       .text(`Actual: ${actual.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, x + 100, y);

    doc.text(`Anterior: ${anterior.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, x + 250, y);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(color)
       .text(`${simbolo} ${Math.abs(variacion).toFixed(1)}%`, x + 400, y);
  }

  private calcularRentabilidad(material: string, co2PorKg: number): string {
    if (co2PorKg > 2.0) return 'Alta';
    if (co2PorKg > 1.0) return 'Media';
    return 'Baja';
  }

  private identificarLocalesInactivos(recolecciones: any[]): any[] {
    // Lógica para identificar locales sin recolecciones
    // Por ahora retorna array vacío
    return [];
  }

  private identificarProblemas(datos: any): string[] {
    const problemas: string[] = [];

    // Caída en recolecciones
    if (datos.comparativaMensual && datos.comparativaMensual.variacion_kilos < -10) {
      problemas.push(`Caída del ${Math.abs(datos.comparativaMensual.variacion_kilos).toFixed(1)}% en kilos vs mes anterior`);
    }

    // Plazas con bajo desempeño
    const plazasBajas = datos.comparativaPlazas.filter((p: any) => p.total_kilos < 1000);
    if (plazasBajas.length > 0) {
      problemas.push(`${plazasBajas.length} plaza(s) con menos de 1,000 kg en el período`);
    }

    if (problemas.length === 0) {
      problemas.push('No se identificaron problemas críticos');
    }

    return problemas;
  }

  private identificarOportunidades(datos: any): string[] {
    const oportunidades: string[] = [];

    // Crecimiento
    if (datos.comparativaMensual && datos.comparativaMensual.variacion_kilos >= 10) {
      oportunidades.push(`Crecimiento sostenido del ${datos.comparativaMensual.variacion_kilos.toFixed(1)}% - replicar estrategia`);
    }

    // Plaza destacada
    const mejorPlaza = datos.comparativaPlazas.reduce((prev: any, current: any) => 
      (prev.total_kilos > current.total_kilos) ? prev : current
    );
    if (mejorPlaza) {
      oportunidades.push(`${mejorPlaza.plaza_nombre} lidera con ${mejorPlaza.total_kilos.toLocaleString()} kg - benchmarking`);
    }

    return oportunidades;
  }

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
}

export const reporteImpactoInternoPDFService = new ReporteImpactoInternoPDFService();