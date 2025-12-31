import { Request, Response } from 'express';
import { reglamentoService } from '../services/reglamento.service';
import { createReglamentoSchema, updateReglamentoSchema } from '../schemas/reglamento.schema';

export class ReglamentoController {
  // GET /api/reglamentos
  async getAll(req: Request, res: Response) {
    try {
      const { active_only } = req.query;
      
      let data;
      if (active_only === 'true') {
        data = await reglamentoService.getActive();
      } else {
        data = await reglamentoService.getAll();
      }
      
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/reglamentos/with-count
  async getAllWithCount(req: Request, res: Response) {
    try {
      const data = await reglamentoService.getWithFaltasCount();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/reglamentos/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await reglamentoService.getById(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // POST /api/reglamentos
  async create(req: Request, res: Response) {
    try {
      const validated = createReglamentoSchema.parse(req.body);
      const data = await reglamentoService.create(validated);
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

  // PUT /api/reglamentos/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateReglamentoSchema.parse(req.body);
      const data = await reglamentoService.update(id, validated);
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

  // PATCH /api/reglamentos/:id/toggle-active
  async toggleActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await reglamentoService.toggleActive(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/reglamentos/reorder
  async reorder(req: Request, res: Response) {
    try {
      const { reglamentos } = req.body;
      
      if (!Array.isArray(reglamentos)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Se esperaba un array de reglamentos' 
        });
      }

      const data = await reglamentoService.reorder(reglamentos);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/reglamentos/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await reglamentoService.delete(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const reglamentoController = new ReglamentoController();