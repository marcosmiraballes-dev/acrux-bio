import { Request, Response } from 'express';
import { SectorService } from '../services/sector.service';
import { createSectorSchema, updateSectorSchema } from '../schemas/sector.schema';
import { z } from 'zod';

const sectorService = new SectorService();

export class SectorController {

  async getByLocal(req: Request, res: Response) {
    try {
      const { localId } = req.params;
      const sectores = await sectorService.getByLocal(localId);

      res.json({
        success: true,
        data: sectores,
        count: sectores.length
      });
    } catch (error) {
      console.error('Error en getByLocal sectores:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo sectores',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { localId } = req.params;
      const validatedData = createSectorSchema.parse(req.body);
      const sector = await sectorService.create(localId, validatedData);

      res.status(201).json({
        success: true,
        message: 'Sector creado exitosamente',
        data: sector
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en create sector:', error);
      res.status(500).json({
        success: false,
        error: 'Error creando sector',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateSectorSchema.parse(req.body);
      const sector = await sectorService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Sector actualizado exitosamente',
        data: sector
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en update sector:', error);

      if (error instanceof Error && error.message === 'Sector no encontrado') {
        return res.status(404).json({
          success: false,
          error: 'Sector no encontrado'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error actualizando sector',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await sectorService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Sector desactivado exitosamente'
      });
    } catch (error) {
      console.error('Error en delete sector:', error);

      if (error instanceof Error && error.message === 'Sector no encontrado') {
        return res.status(404).json({
          success: false,
          error: 'Sector no encontrado'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error desactivando sector',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
