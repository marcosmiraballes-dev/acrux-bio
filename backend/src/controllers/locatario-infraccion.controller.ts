import { Request, Response } from 'express';
import { locatarioInfraccionService } from '../services/locatario-infraccion.service';
import { createLocatarioInfraccionSchema, updateLocatarioInfraccionSchema } from '../schemas/locatario-infraccion.schema';

export class LocatarioInfraccionController {
  // GET /api/locatarios-infracciones
  async getAll(req: Request, res: Response) {
    try {
      const { plaza_id } = req.query;
      const data = await locatarioInfraccionService.getAll(plaza_id as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/locatarios-infracciones/with-count
  async getAllWithCount(req: Request, res: Response) {
    try {
      const { plaza_id } = req.query;
      const data = await locatarioInfraccionService.getWithInfraccionesCount(plaza_id as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/locatarios-infracciones/search
  async search(req: Request, res: Response) {
    try {
      const { q, plaza_id } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'El parámetro de búsqueda "q" es requerido' 
        });
      }

      const data = await locatarioInfraccionService.search(q, plaza_id as string);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/locatarios-infracciones/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await locatarioInfraccionService.getById(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // POST /api/locatarios-infracciones
  async create(req: Request, res: Response) {
    try {
      const validated = createLocatarioInfraccionSchema.parse(req.body);
      const data = await locatarioInfraccionService.create(validated);
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

  // PUT /api/locatarios-infracciones/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateLocatarioInfraccionSchema.parse(req.body);
      const data = await locatarioInfraccionService.update(id, validated);
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

  // PATCH /api/locatarios-infracciones/:id/toggle-active
  async toggleActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await locatarioInfraccionService.toggleActive(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/locatarios-infracciones/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await locatarioInfraccionService.delete(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const locatarioInfraccionController = new LocatarioInfraccionController();