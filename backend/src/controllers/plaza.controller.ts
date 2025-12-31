import { Request, Response } from 'express';
import { PlazaService } from '../services/plaza.service';
import { createPlazaSchema, updatePlazaSchema } from '../schemas/plaza.schema';
import { z } from 'zod';

const plazaService = new PlazaService();

export class PlazaController {
  
  /**
   * GET /api/plazas
   * Obtener todas las plazas
   */
  async getAll(req: Request, res: Response) {
    try {
      const includeStats = req.query.stats === 'true';
      
      const plazas = includeStats 
        ? await plazaService.getAllWithStats()
        : await plazaService.getAll();

      res.json({
        success: true,
        data: plazas,
        count: plazas.length
      });
    } catch (error) {
      console.error('Error en getAll plazas:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo plazas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/plazas/:id
   * Obtener una plaza por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plaza = await plazaService.getById(id);

      if (!plaza) {
        return res.status(404).json({
          success: false,
          error: 'Plaza no encontrada'
        });
      }

      res.json({
        success: true,
        data: plaza
      });
    } catch (error) {
      console.error('Error en getById plaza:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo plaza',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/plazas
   * Crear una nueva plaza
   */
  async create(req: Request, res: Response) {
    try {
      // Validar datos de entrada
      const validatedData = createPlazaSchema.parse(req.body);

      const plaza = await plazaService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Plaza creada exitosamente',
        data: plaza
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en create plaza:', error);
      res.status(500).json({
        success: false,
        error: 'Error creando plaza',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * PUT /api/plazas/:id
   * Actualizar una plaza existente
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validar datos de entrada
      const validatedData = updatePlazaSchema.parse(req.body);

      const plaza = await plazaService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Plaza actualizada exitosamente',
        data: plaza
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en update plaza:', error);
      
      if (error instanceof Error && error.message === 'Plaza no encontrada') {
        return res.status(404).json({
          success: false,
          error: 'Plaza no encontrada'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error actualizando plaza',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * DELETE /api/plazas/:id
   * Eliminar una plaza
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await plazaService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Plaza eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error en delete plaza:', error);
      
      if (error instanceof Error && error.message.includes('recolecciones asociadas')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error eliminando plaza',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}