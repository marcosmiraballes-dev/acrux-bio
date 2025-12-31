import { Request, Response } from 'express';
import { ComparacionService } from '../services/comparacion.service';

const comparacionService = new ComparacionService();

export class ComparacionController {
  
  /**
   * GET /api/comparacion/periodos
   * Comparar dos periodos de recolecciones
   */
  async compararPeriodos(req: Request, res: Response) {
    return comparacionService.compararPeriodos(req, res);
  }
}