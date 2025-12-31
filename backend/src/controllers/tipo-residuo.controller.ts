import { Request, Response } from 'express';
import { TipoResiduoService } from '../services/tipo-residuo.service';
import { createTipoResiduoSchema, updateTipoResiduoSchema } from '../schemas/tipo-residuo.schema';
import { z } from 'zod';

const tipoResiduoService = new TipoResiduoService();

export class TipoResiduoController {
  
  /**
   * GET /api/tipos-residuos
   * Obtener todos los tipos de residuos
   */
  async getAll(req: Request, res: Response) {
    try {
      const tipos = await tipoResiduoService.getAll();

      res.json({
        success: true,
        data: tipos,
        count: tipos.length
      });
    } catch (error) {
      console.error('Error en getAll tipos de residuos:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo tipos de residuos',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/tipos-residuos/:id
   * Obtener un tipo de residuo por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tipo = await tipoResiduoService.getById(id);

      if (!tipo) {
        return res.status(404).json({
          success: false,
          error: 'Tipo de residuo no encontrado'
        });
      }

      res.json({
        success: true,
        data: tipo
      });
    } catch (error) {
      console.error('Error en getById tipo de residuo:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo tipo de residuo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/tipos-residuos
   * Crear un nuevo tipo de residuo
   */
  async create(req: Request, res: Response) {
    try {
      // Validar datos de entrada
      const validatedData = createTipoResiduoSchema.parse(req.body);

      const tipo = await tipoResiduoService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Tipo de residuo creado exitosamente',
        data: tipo
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en create tipo de residuo:', error);
      
      if (error instanceof Error && error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error creando tipo de residuo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * PUT /api/tipos-residuos/:id
   * Actualizar un tipo de residuo existente
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validar datos de entrada
      const validatedData = updateTipoResiduoSchema.parse(req.body);

      const tipo = await tipoResiduoService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Tipo de residuo actualizado exitosamente',
        data: tipo
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en update tipo de residuo:', error);
      
      if (error instanceof Error && error.message === 'Tipo de residuo no encontrado') {
        return res.status(404).json({
          success: false,
          error: 'Tipo de residuo no encontrado'
        });
      }

      if (error instanceof Error && error.message.includes('Ya existe')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error actualizando tipo de residuo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * DELETE /api/tipos-residuos/:id
   * Eliminar un tipo de residuo
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await tipoResiduoService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Tipo de residuo eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en delete tipo de residuo:', error);
      
      if (error instanceof Error && error.message.includes('recolecciones asociadas')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error eliminando tipo de residuo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}