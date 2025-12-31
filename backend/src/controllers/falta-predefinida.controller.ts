import { Request, Response } from 'express';
import { faltaPredefinidaService } from '../services/falta-predefinida.service';
import { createFaltaPredefinidaSchema, updateFaltaPredefinidaSchema } from '../schemas/falta-predefinida.schema';

export class FaltaPredefinidaController {
  // GET /api/faltas-predefinidas
  async getAll(req: Request, res: Response) {
    try {
      const { reglamento_id, active_only } = req.query;
      
      let data;
      if (active_only === 'true') {
        data = await faltaPredefinidaService.getActive(reglamento_id as string);
      } else {
        data = await faltaPredefinidaService.getAll(reglamento_id as string);
      }
      
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/faltas-predefinidas/grouped
  async getGrouped(req: Request, res: Response) {
    try {
      const data = await faltaPredefinidaService.getGroupedByReglamento();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/faltas-predefinidas/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await faltaPredefinidaService.getById(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // POST /api/faltas-predefinidas
  async create(req: Request, res: Response) {
    try {
      const validated = createFaltaPredefinidaSchema.parse(req.body);
      const data = await faltaPredefinidaService.create(validated);
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

  // PUT /api/faltas-predefinidas/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateFaltaPredefinidaSchema.parse(req.body);
      const data = await faltaPredefinidaService.update(id, validated);
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

  // PATCH /api/faltas-predefinidas/:id/toggle-active
  async toggleActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await faltaPredefinidaService.toggleActive(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/faltas-predefinidas/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await faltaPredefinidaService.delete(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const faltaPredefinidaController = new FaltaPredefinidaController();