import { Request, Response } from 'express';
import { portalService } from '../services/portal.service';

export class PortalController {
  /**
   * Login del locatario con código de acceso
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { codigo_acceso } = req.body;

      if (!codigo_acceso) {
        res.status(400).json({ error: 'Código de acceso requerido' });
        return;
      }

      const local = await portalService.login(codigo_acceso.trim().toUpperCase());

      if (!local) {
        res.status(401).json({ error: 'Código de acceso inválido' });
        return;
      }

      res.json({
        success: true,
        local_id: local.id,
        nombre: local.nombre,
        giro: local.giro,
        plaza: local.plazas?.nombre || null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener recolecciones del local autenticado
   */
  async getRecolecciones(req: Request, res: Response): Promise<void> {
    try {
      const { local_id } = req.body;
      const { fecha_inicio, fecha_fin } = req.query;

      if (!local_id) {
        res.status(400).json({ error: 'local_id requerido' });
        return;
      }

      const result = await portalService.getRecolecciones(local_id, {
        fechaInicio: fecha_inicio as string,
        fechaFin: fecha_fin as string
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Registrar residuos por autoservicio
   */
  async registrarAutoservicio(req: Request, res: Response): Promise<void> {
    try {
      const { local_id, tipo_residuo, kilos, observaciones } = req.body;

      if (!local_id) {
        res.status(400).json({ error: 'local_id requerido' });
        return;
      }
      if (!tipo_residuo) {
        res.status(400).json({ error: 'tipo_residuo requerido' });
        return;
      }
      if (!kilos || Number(kilos) <= 0) {
        res.status(400).json({ error: 'kilos debe ser mayor a 0' });
        return;
      }

      const data = await portalService.registrarAutoservicio(
        local_id,
        tipo_residuo,
        Number(kilos),
        observaciones
      );

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtener historial de autoservicio del local
   */
  async getHistorialAutoservicio(req: Request, res: Response): Promise<void> {
    try {
      const { local_id } = req.query;

      if (!local_id) {
        res.status(400).json({ error: 'local_id requerido' });
        return;
      }

      const result = await portalService.getHistorialAutoservicio(local_id as string);

      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const portalController = new PortalController();
