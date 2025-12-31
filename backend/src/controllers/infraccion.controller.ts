import { Request, Response } from 'express';
import { infraccionService } from '../services/infraccion.service';
import { createInfraccionSchema, updateInfraccionSchema, resolverInfraccionSchema } from '../schemas/infraccion.schema';

export class InfraccionController {
  // GET /api/infracciones
  async getAll(req: Request, res: Response) {
    try {
      const {
        plaza_id,
        locatario_id,
        tipo_aviso_id,
        estatus,
        fecha_desde,
        fecha_hasta,
        limit,
        offset
      } = req.query;

      const filters = {
        plazaId: plaza_id as string,
        locatarioId: locatario_id as string,
        tipoAvisoId: tipo_aviso_id as string,
        estatus: estatus as string,
        fechaDesde: fecha_desde as string,
        fechaHasta: fecha_hasta as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const data = await infraccionService.getAll(filters);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/infracciones/count
  async count(req: Request, res: Response) {
    try {
      const {
        plaza_id,
        locatario_id,
        tipo_aviso_id,
        estatus,
        fecha_desde,
        fecha_hasta
      } = req.query;

      const filters = {
        plazaId: plaza_id as string,
        locatarioId: locatario_id as string,
        tipoAvisoId: tipo_aviso_id as string,
        estatus: estatus as string,
        fechaDesde: fecha_desde as string,
        fechaHasta: fecha_hasta as string
      };

      const count = await infraccionService.count(filters);
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/infracciones/stats
  async getStats(req: Request, res: Response) {
    try {
      const { plaza_id, fecha_desde, fecha_hasta } = req.query;
      const data = await infraccionService.getStats(
        plaza_id as string,
        fecha_desde as string,
        fecha_hasta as string
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/infracciones/top-locatarios
  async getTopLocatarios(req: Request, res: Response) {
    try {
      const { plaza_id, limit } = req.query;
      const data = await infraccionService.getTopLocatarios(
        plaza_id as string,
        limit ? parseInt(limit as string) : 10
      );
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/infracciones/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await infraccionService.getById(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // GET /api/infracciones/locatario/:locatarioId
  async getByLocatario(req: Request, res: Response) {
    try {
      const { locatarioId } = req.params;
      const data = await infraccionService.getByLocatario(locatarioId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/infracciones/locatario/:locatarioId/next-nro
  async getNextNroAviso(req: Request, res: Response) {
    try {
      const { locatarioId } = req.params;
      const nroAviso = await infraccionService.getNextNroAviso(locatarioId);
      res.json({ success: true, nroAviso });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/infracciones
  async create(req: Request, res: Response) {
    try {
      const validated = createInfraccionSchema.parse(req.body);
      const createdBy = req.user?.id || '';
      
      const data = await infraccionService.create(validated, createdBy);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors 
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // PUT /api/infracciones/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateInfraccionSchema.parse(req.body);
      const data = await infraccionService.update(id, validated);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors 
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // PATCH /api/infracciones/:id/resolver
  async resolver(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = resolverInfraccionSchema.parse(req.body);
      const resueltoBy = req.user?.id || '';
      
      const data = await infraccionService.resolver(id, validated, resueltoBy);
      res.json({ success: true, data });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Datos de entrada inválidos',
          details: error.errors 
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // PATCH /api/infracciones/:id/cancelar
  async cancelar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notas } = req.body;
      
      const data = await infraccionService.cancelar(id, notas || '');
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/infracciones/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await infraccionService.delete(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const infraccionController = new InfraccionController();