/**
 * RUTAS PARA REPORTES
 * Incluye: Huella de carbono (CO₂ evitado por reciclaje, EPA WARM v16)
 */

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { huellaCarbonoService } from '../services/huella-carbono.service';

const router = express.Router();

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
    const { local_id, anio, mes } = req.query;
    if (!local_id) {
      return res.status(400).json({ success: false, error: 'Se requiere local_id' });
    }
    const data = await huellaCarbonoService.getReporteLocatario(
      local_id as string,
      parseInt(anio as string) || new Date().getFullYear(),
      mes ? parseInt(mes as string) : undefined
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
    const { plaza_id, anio, mes } = req.query;
    if (!plaza_id) {
      return res.status(400).json({ success: false, error: 'Se requiere plaza_id' });
    }
    const data = await huellaCarbonoService.getReportePlaza(
      plaza_id as string,
      parseInt(anio as string) || new Date().getFullYear(),
      mes ? parseInt(mes as string) : undefined
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