import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { procesarMensajeDirector, MensajeChat } from '../services/asistente-director.service';

const router = Router();

/**
 * POST /api/asistente/director
 * Endpoint del asistente de IA para el Director
 * Rol: DIRECTOR
 */
router.post('/director', authenticate, async (req, res) => {
  const userRole = (req as any).user?.rol;

  if (!['DIRECTOR'].includes(userRole)) {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }

  try {
    const { mensaje, historial } = req.body;

    if (!mensaje || typeof mensaje !== 'string') {
      return res.status(400).json({ success: false, error: 'Se requiere el campo mensaje' });
    }

    const historialValidado: MensajeChat[] = Array.isArray(historial) ? historial : [];

    console.log(`🤖 Asistente Director — mensaje recibido: "${mensaje.substring(0, 60)}..."`);

    const resultado = await procesarMensajeDirector(mensaje, historialValidado);

    return res.json({
      success: true,
      respuesta: resultado.respuesta,
      accion: resultado.accion || null,
    });

  } catch (error) {
    console.error('❌ Error en asistente director:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

export default router;