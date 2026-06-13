import { Request, Response } from 'express';
import { AlertasService } from '../services/alertas.service';

const alertasService = new AlertasService();

export class AlertasController {

  async generarAlertasMes(req: Request, res: Response): Promise<void> {
    try {
      let { mes } = req.body;
      if (!mes) {
        const hoy = new Date();
        const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        mes = primerDiaMesAnterior.toISOString().split('T')[0];
      }
      const resultado = await alertasService.generarAlertasMes(mes);
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAlertasByCoordinador(req: Request, res: Response): Promise<void> {
    try {
      const { coordinador_id } = req.params;
      const { estatus } = req.query;
      const data = await alertasService.getAlertasByCoordinador(
        coordinador_id,
        estatus as string | undefined
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAlertasByPlaza(req: Request, res: Response): Promise<void> {
    try {
      const { plaza_id } = req.params;
      const { estatus } = req.query;
      const data = await alertasService.getAlertasByPlaza(
        plaza_id,
        estatus as string | undefined
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAlertasParaDirector(req: Request, res: Response): Promise<void> {
    try {
      const data = await alertasService.getAlertasParaDirector();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async actualizarAlerta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await alertasService.actualizarAlerta(id, req.body);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generarInforme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nota } = req.body;
      if (!nota) {
        res.status(400).json({ error: 'La nota es requerida para generar el informe' });
        return;
      }
      const data = await alertasService.generarInforme(id, nota);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTendenciaLocal(req: Request, res: Response): Promise<void> {
    try {
      const { local_id } = req.params;
      const { mes_alerta } = req.query;
      const [tendencia, alertasAnteriores] = await Promise.all([
        alertasService.getTendenciaLocal(local_id),
        alertasService.getAlertasAnteriores(local_id, mes_alerta as string || new Date().toISOString().split('T')[0]),
      ]);
      res.json({ tendencia, alertas_anteriores: alertasAnteriores });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
