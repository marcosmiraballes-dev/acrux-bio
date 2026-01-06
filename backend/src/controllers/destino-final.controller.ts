// backend/src/controllers/Destino final.controller.ts

import { Request, Response } from 'express';
import { DestinoFinalService } from '../services/destino-final.service';
import { createDestinoFinalSchema, updateDestinoFinalSchema } from '../schemas/destino-final.schema';
import { createClient } from '@supabase/supabase-js';

// Crear instancia de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export class DestinoFinalController {
  private destinoFinalService: DestinoFinalService;

  constructor(destinoFinalService: DestinoFinalService) {
    this.destinoFinalService = destinoFinalService;
  }

  // GET /api/destinos-finales
  getAll = async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active_only === 'true';
      
      const destinos = activeOnly 
        ? await this.destinoFinalService.getActive()
        : await this.destinoFinalService.getAll();

      res.json({
        success: true,
        data: destinos
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // GET /api/destinos-finales/count
  getCount = async (req: Request, res: Response) => {
    try {
      const count = await this.destinoFinalService.count();

      res.json({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // GET /api/destinos-finales/:id
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const destino = await this.destinoFinalService.getById(id);

      res.json({
        success: true,
        data: destino
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  };

  // POST /api/destinos-finales
  create = async (req: Request, res: Response) => {
    try {
      const validatedData = createDestinoFinalSchema.parse(req.body);
      const destino = await this.destinoFinalService.create(validatedData);

      res.status(201).json({
        success: true,
        data: destino
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // PUT /api/destinos-finales/:id
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateDestinoFinalSchema.parse(req.body);
      const destino = await this.destinoFinalService.update(id, validatedData);

      res.json({
        success: true,
        data: destino
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // PATCH /api/destinos-finales/:id/toggle-active
  toggleActive = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const destino = await this.destinoFinalService.toggleActive(id);

      res.json({
        success: true,
        data: destino
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // DELETE /api/destinos-finales/:id
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.destinoFinalService.delete(id);

      res.json({
        success: true,
        message: 'Destino final eliminado correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}

// Exportar instancia singleton
const destinoFinalService = new DestinoFinalService(supabase);
export const destinoFinalController = new DestinoFinalController(destinoFinalService);
