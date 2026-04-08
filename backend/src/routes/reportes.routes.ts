/**
 * RUTAS PARA REPORTES
 * Incluye: Impacto Ambiental (PDF) y Reportes por Plaza (Excel/PDF)
 */

import express from 'express';
import { ReportePDFController } from '../controllers/reporte-pdf.controller';
import { ReportePlazaController } from '../controllers/reporte-plaza.controller';
import { authenticate } from '../middleware/auth.middleware';
import { huellaCarbonoService } from '../services/huella-carbono.service';

const router = express.Router();

const reportePDFController = new ReportePDFController();
const reportePlazaController = new ReportePlazaController();

// ==================== REPORTES DE IMPACTO AMBIENTAL (PDF) ====================

/**
 * GET /api/reportes/pdf/interno
 * Reporte PDF interno (análisis detallado para Director/Coordinador)
 * Roles: DIRECTOR, COORDINADOR
 */
router.get('/pdf/interno', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  
  if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'No autorizado para descargar este reporte'
    });
  }
  
  await reportePDFController.descargarReporteInterno(req, res);
});

/**
 * GET /api/reportes/pdf/clientes
 * Reporte PDF para clientes (visual y motivacional)
 * Roles: DIRECTOR, COORDINADOR
 */
router.get('/pdf/clientes', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  
  if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'No autorizado para descargar este reporte'
    });
  }
  
  await reportePDFController.descargarReporteClientes(req, res);
});

/**
 * GET /api/reportes/pdf/ejecutivo
 * Alias para reporte interno (compatibilidad)
 * Roles: DIRECTOR, COORDINADOR
 */
router.get('/pdf/ejecutivo', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  
  if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'No autorizado para descargar este reporte'
    });
  }
  
  await reportePDFController.descargarReporteEjecutivo(req, res);
});

// ==================== REPORTES POR PLAZA ====================

/**
 * GET /api/reportes/plaza/excel
 * Reporte por plaza en formato Excel
 * Roles: DIRECTOR, COORDINADOR
 */
router.get('/plaza/excel', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  
  if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'No autorizado para descargar este reporte'
    });
  }
  
  await reportePlazaController.descargarExcel(req, res);
});

/**
 * GET /api/reportes/plaza/pdf
 * Reporte por plaza en formato PDF
 * Roles: DIRECTOR, COORDINADOR
 */
router.get('/plaza/pdf', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  
  if (!['DIRECTOR', 'COORDINADOR'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'No autorizado para descargar este reporte'
    });
  }
  
  await reportePlazaController.descargarPDF(req, res);
});

// ==================== HUELLA DE CARBONO ====================

/**
 * GET /api/reportes/huella/locatario?local_id=X&anio=2025
 * Datos JSON para reporte de huella de carbono por locatario
 * Roles: DIRECTOR
 */
router.get('/huella/locatario', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  if (!['DIRECTOR'].includes(userRole)) {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }
  try {
    const { local_id, anio } = req.query;
    if (!local_id) {
      return res.status(400).json({ success: false, error: 'Se requiere local_id' });
    }
    const data = await huellaCarbonoService.getReporteLocatario(
      local_id as string,
      parseInt(anio as string) || new Date().getFullYear()
    );
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/reportes/huella/plaza?plaza_id=X&anio=2025
 * Datos JSON para reporte de huella de carbono por plaza
 * Roles: DIRECTOR
 */
router.get('/huella/plaza', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;
  if (!['DIRECTOR'].includes(userRole)) {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }
  try {
    const { plaza_id, anio } = req.query;
    if (!plaza_id) {
      return res.status(400).json({ success: false, error: 'Se requiere plaza_id' });
    }
    const data = await huellaCarbonoService.getReportePlaza(
      plaza_id as string,
      parseInt(anio as string) || new Date().getFullYear()
    );
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;