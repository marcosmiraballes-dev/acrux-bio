// backend/src/controllers/Vehiculo.controller.ts

import { Request, Response } from 'express';
import { VehiculoService } from '../services/vehiculo.service';
import { createVehiculoSchema, updateVehiculoSchema } from '../schemas/vehiculo.schema';
import { createClient } from '@supabase/supabase-js';

// Crear instancia de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export class VehiculoController {
  private vehiculoService: VehiculoService;

  constructor(vehiculoService: VehiculoService) {
    this.vehiculoService = vehiculoService;
  }

  // GET /api/vehiculos
  getAll = async (req: Request, res: Response) => {
    try {
      const activeOnly = req.query.active_only === 'true';
      
      const vehiculos = activeOnly 
        ? await this.vehiculoService.getActive()
        : await this.vehiculoService.getAll();

      res.json({
        success: true,
        data: vehiculos
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // GET /api/vehiculos/count
  getCount = async (req: Request, res: Response) => {
    try {
      const count = await this.vehiculoService.count();

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

  // GET /api/vehiculos/:id
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vehiculo = await this.vehiculoService.getById(id);

      res.json({
        success: true,
        data: vehiculo
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  };

  // POST /api/vehiculos
  create = async (req: Request, res: Response) => {
    try {
      const validatedData = createVehiculoSchema.parse(req.body);
      const vehiculo = await this.vehiculoService.create(validatedData);

      res.status(201).json({
        success: true,
        data: vehiculo
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

  // PUT /api/vehiculos/:id
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateVehiculoSchema.parse(req.body);
      const vehiculo = await this.vehiculoService.update(id, validatedData);

      res.json({
        success: true,
        data: vehiculo
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

  // PATCH /api/vehiculos/:id/toggle-active
  toggleActive = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const vehiculo = await this.vehiculoService.toggleActive(id);

      res.json({
        success: true,
        data: vehiculo
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // DELETE /api/vehiculos/:id
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.vehiculoService.delete(id);

      res.json({
        success: true,
        message: 'Vehículo eliminado correctamente'
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
const vehiculoService = new VehiculoService(supabase);
export const vehiculoController = new VehiculoController(vehiculoService);
