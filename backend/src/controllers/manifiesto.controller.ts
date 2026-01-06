// backend/src/controllers/manifiesto.controller.ts

import { Request, Response } from 'express';
import { manifiestoService } from '../services/manifiesto.service';
import { createManifiestoSchema, updateManifiestoSchema } from '../schemas/manifiesto.schema';

export class ManifiestoController {
  /**
   * GET /api/manifiestos
   * Listar todos los manifiestos con paginación
   */
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const plazaId = req.query.plaza_id as string;
      const localId = req.query.local_id as string;

      const manifiestos = await manifiestoService.getAll(page, limit, plazaId, localId);

      res.json({
        success: true,
        data: manifiestos,
      });
    } catch (error: any) {
      console.error('Error al obtener manifiestos:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener manifiestos',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/manifiestos/count
   * Contar total de manifiestos
   */
  async count(req: Request, res: Response) {
    try {
      const total = await manifiestoService.count();

      res.json({
        success: true,
        data: { total },
      });
    } catch (error: any) {
      console.error('Error al contar manifiestos:', error);
      res.status(500).json({
        success: false,
        error: 'Error al contar manifiestos',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/manifiestos/:id
   * Obtener un manifiesto por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const manifiesto = await manifiestoService.getById(id);

          console.log('📄 MANIFIESTO COMPLETO CON RESIDUOS:', manifiesto); 

      if (!manifiesto) {
        return res.status(404).json({
          success: false,
          error: 'Manifiesto no encontrado',
        });
      }

      res.json({
        success: true,
        data: manifiesto,
      });
    } catch (error: any) {
      console.error('Error al obtener manifiesto:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener manifiesto',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/manifiestos/local/:localId
   * Obtener manifiestos de un local específico
   */
  async getByLocal(req: Request, res: Response) {
    try {
      const { localId } = req.params;

      const manifiestos = await manifiestoService.getByLocal(localId);

      res.json({
        success: true,
        data: manifiestos,
      });
    } catch (error: any) {
      console.error('Error al obtener manifiestos del local:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener manifiestos del local',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/manifiestos/recoleccion/:recoleccionId
   * Verificar si una recolección ya tiene manifiesto
   */
  async getByRecoleccion(req: Request, res: Response) {
    try {
      const { recoleccionId } = req.params;

      const manifiesto = await manifiestoService.getByRecoleccion(recoleccionId);

      res.json({
        success: true,
        data: manifiesto,
        existe: !!manifiesto,
      });
    } catch (error: any) {
      console.error('Error al verificar manifiesto:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar manifiesto',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/manifiestos
   * Crear un nuevo manifiesto
   */
  async create(req: Request, res: Response) {
    try {
      // Validar datos
      const validatedData = createManifiestoSchema.parse(req.body);

      // Obtener usuario autenticado
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
      }

      // Crear manifiesto con snapshots automáticos
      const manifiesto = await manifiestoService.create(validatedData, userId);

      res.status(201).json({
        success: true,
        message: 'Manifiesto creado exitosamente',
        data: manifiesto,
      });
    } catch (error: any) {
      console.error('Error al crear manifiesto:', error);

      // Error de validación Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors,
        });
      }

      // Error de negocio (ej: recolección ya tiene manifiesto)
      if (error.message.includes('ya tiene un manifiesto')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al crear manifiesto',
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/manifiestos/:id
   * Actualizar manifiesto (solo PDF path)
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validar datos
      const validatedData = updateManifiestoSchema.parse(req.body);

      const manifiesto = await manifiestoService.update(id, validatedData);

      res.json({
        success: true,
        message: 'Manifiesto actualizado exitosamente',
        data: manifiesto,
      });
    } catch (error: any) {
      console.error('Error al actualizar manifiesto:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error al actualizar manifiesto',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/manifiestos/:id
   * Eliminar manifiesto (solo ADMIN)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await manifiestoService.delete(id);

      res.json({
        success: true,
        message: 'Manifiesto eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar manifiesto:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar manifiesto',
        message: error.message,
      });
    }
  }
}

export const manifiestoController = new ManifiestoController();