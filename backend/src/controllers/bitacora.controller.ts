import { Request, Response } from 'express';
import { BitacoraService } from '../services/bitacora.service';

const bitacoraService = new BitacoraService();

export class BitacoraController {
  
  /**
   * GET /api/bitacoras/locatario
   * Generar bitácora de locatario en Excel
   * Query params: local_id, fecha_desde, fecha_hasta
   */
  async generarBitacoraLocatario(req: Request, res: Response) {
    await bitacoraService.generarBitacoraLocatario(req, res);
  }
}