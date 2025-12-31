import { Request, Response } from 'express';
import { tipoAvisoService } from '../services/tipo-aviso.service';
import { createTipoAvisoSchema, updateTipoAvisoSchema } from '../schemas/tipo-aviso.schema';

export class TipoAvisoController {
  // GET /api/tipos-aviso
  async getAll(req: Request, res: Response) {
    try {
      const data = await tipoAvisoService.getAll();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/tipos-aviso/with-count
  async getAllWithCount(req: Request, res: Response) {
    try {
      const data = await tipoAvisoService.getWithInfraccionesCount();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/tipos-aviso/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await tipoAvisoService.getById(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  // POST /api/tipos-aviso
  async create(req: Request, res: Response) {
    try {
      const validated = createTipoAvisoSchema.parse(req.body);
      const data = await tipoAvisoService.create(validated);
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

  // PUT /api/tipos-aviso/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validated = updateTipoAvisoSchema.parse(req.body);
      const data = await tipoAvisoService.update(id, validated);
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

  // POST /api/tipos-aviso/reorder
  async reorder(req: Request, res: Response) {
    try {
      const { tipos_aviso } = req.body;
      
      if (!Array.isArray(tipos_aviso)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Se esperaba un array de tipos de aviso' 
        });
      }

      const data = await tipoAvisoService.reorder(tipos_aviso);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DELETE /api/tipos-aviso/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await tipoAvisoService.delete(id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const tipoAvisoController = new TipoAvisoController();