import { Request, Response } from 'express';
import { procesarMensajeCoordinador, MensajeChat } from '../services/asistente-coordinador.service';

export class AsistenteCoordinadorController {

  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { mensaje, historial, coordinador_id } = req.body;

      if (!mensaje || typeof mensaje !== 'string') {
        res.status(400).json({ error: 'El campo mensaje es requerido' });
        return;
      }

      if (!coordinador_id || typeof coordinador_id !== 'string') {
        res.status(400).json({ error: 'El campo coordinador_id es requerido' });
        return;
      }

      const historialValidado: MensajeChat[] = Array.isArray(historial)
        ? historial.filter(m => m.role && m.content)
        : [];

      const resultado = await procesarMensajeCoordinador(
        mensaje,
        historialValidado,
        coordinador_id
      );

      res.json(resultado);
    } catch (error: any) {
      console.error('Error en AsistenteCoordinadorController.chat:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }
}
