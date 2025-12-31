import { Request, Response } from 'express';
import { LocalService } from '../services/local.service';
import { createLocalSchema, updateLocalSchema } from '../schemas/local.schema';
import { z } from 'zod';

const localService = new LocalService();

export class LocalController {
  
  /**
   * GET /api/locales
   * Obtener todos los locales (opcionalmente filtrado por plaza)
   * Query params: ?plaza_id=xxx&stats=true
   */
  async getAll(req: Request, res: Response) {
    try {
      const plazaId = req.query.plaza_id as string | undefined;
      const includeStats = req.query.stats === 'true';

      let locales;
      
      if (includeStats && plazaId) {
        locales = await localService.getByPlazaWithStats(plazaId);
      } else {
        locales = await localService.getAll(plazaId);
      }

      res.json({
        success: true,
        data: locales,
        count: locales.length,
        filters: {
          plaza_id: plazaId || null
        }
      });
    } catch (error) {
      console.error('Error en getAll locales:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo locales',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/locales/:id
   * Obtener un local por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const local = await localService.getById(id);

      if (!local) {
        return res.status(404).json({
          success: false,
          error: 'Local no encontrado'
        });
      }

      res.json({
        success: true,
        data: local
      });
    } catch (error) {
      console.error('Error en getById local:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo local',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/locales
   * Crear un nuevo local
   */
  async create(req: Request, res: Response) {
    try {
      // Validar datos de entrada
      const validatedData = createLocalSchema.parse(req.body);

      const local = await localService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Local creado exitosamente',
        data: local
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en create local:', error);
      
      if (error instanceof Error && error.message.includes('no existe')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error creando local',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * PUT /api/locales/:id
   * Actualizar un local existente
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validar datos de entrada
      const validatedData = updateLocalSchema.parse(req.body);

      const local = await localService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Local actualizado exitosamente',
        data: local
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en update local:', error);
      
      if (error instanceof Error && error.message === 'Local no encontrado') {
        return res.status(404).json({
          success: false,
          error: 'Local no encontrado'
        });
      }

      if (error instanceof Error && error.message.includes('no existe')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error actualizando local',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * DELETE /api/locales/:id
   * Eliminar un local
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await localService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Local eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en delete local:', error);
      
      if (error instanceof Error && error.message.includes('recolecciones asociadas')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error eliminando local',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}