import { Request, Response } from 'express';
import { HistorialService } from '../services/historial.service';

const historialService = new HistorialService();

export class HistorialController {

  async getHistorialByLocal(req: Request, res: Response): Promise<void> {
    try {
      const { local_id } = req.params;
      const data = await historialService.getHistorialByLocal(local_id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async crearNotaManual(req: Request, res: Response): Promise<void> {
    try {
      const { local_id, tipo_nota_manual, descripcion, coordinador_id } = req.body;
      if (!local_id || !tipo_nota_manual || !descripcion || !coordinador_id) {
        res.status(400).json({ error: 'Faltan campos requeridos: local_id, tipo_nota_manual, descripcion, coordinador_id' });
        return;
      }
      const data = await historialService.crearNotaManual({
        local_id,
        tipo_nota_manual,
        descripcion,
        coordinador_id,
      });
      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHistorialResumen(req: Request, res: Response): Promise<void> {
    try {
      const { local_id } = req.params;
      const data = await historialService.getHistorialResumen(local_id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
