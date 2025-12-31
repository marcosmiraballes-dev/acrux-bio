import { Request, Response } from 'express';
import { RecoleccionService } from '../services/recoleccion.service';
import { createRecoleccionSchema } from '../schemas/recoleccion.schema';
import { z } from 'zod';

const recoleccionService = new RecoleccionService();

export class RecoleccionController {
  
  async create(req: Request, res: Response) {
    try {
      const validatedData = createRecoleccionSchema.parse(req.body);
      const usuarioId = req.user?.id || 'f092df7f-c771-4e75-a84b-59692cc32b99';
      const recoleccion = await recoleccionService.create(validatedData, usuarioId);

      res.status(201).json({
        success: true,
        message: 'Recolección creada exitosamente',
        data: recoleccion
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en create recolección:', error);
      res.status(500).json({
        success: false,
        error: 'Error creando recolección',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = req.body;
      const recoleccion = await recoleccionService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Recolección actualizada exitosamente',
        data: recoleccion
      });
    } catch (error) {
      console.error('Error en update recolección:', error);
      res.status(500).json({
        success: false,
        error: 'Error actualizando recolección',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await recoleccionService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Recolección eliminada exitosamente'
      });
    } catch (error) {
      console.error('Error en delete recolección:', error);
      
      if (error instanceof Error && error.message === 'Recolección no encontrada') {
        return res.status(404).json({
          success: false,
          error: 'Recolección no encontrada'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error eliminando recolección',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
  
  async getAll(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        fechaInicio: req.query.fecha_desde as string | undefined,
        fechaFin: req.query.fecha_hasta as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await recoleccionService.getAll(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.count,
          limit: result.limit,
          offset: result.offset,
          pages: Math.ceil(result.count / result.limit)
        },
        filters: {
          plaza_id: filters.plazaId || null,
          local_id: filters.localId || null,
          fecha_desde: filters.fechaInicio || null,
          fecha_hasta: filters.fechaFin || null
        }
      });
    } catch (error) {
      console.error('Error en getAll recolecciones:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo recolecciones',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const recoleccion = await recoleccionService.getById(id);

      if (!recoleccion) {
        return res.status(404).json({
          success: false,
          error: 'Recolección no encontrada'
        });
      }

      res.json({
        success: true,
        data: recoleccion
      });
    } catch (error) {
      console.error('Error en getById recolección:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo recolección',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Devuelve el objeto, no el array
  async getStats(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined,
        fechaInicio: req.query.fecha_desde as string | undefined,
        fechaFin: req.query.fecha_hasta as string | undefined
      };

      const stats = await recoleccionService.getStats(filters);

      res.json({
        success: true,
        data: stats,  // Ahora stats ya es un objeto, no un array
        filters: {
          plaza_id: filters.plazaId || null,
          local_id: filters.localId || null,
          fecha_desde: filters.fechaInicio || null,
          fecha_hasta: filters.fechaFin || null
        }
      });
    } catch (error) {
      console.error('Error en getStats:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getStatsByTipo(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined,
        fechaInicio: req.query.fecha_desde as string | undefined,
        fechaFin: req.query.fecha_hasta as string | undefined
      };

      const stats = await recoleccionService.getStatsByTipo(filters);

      res.json({
        success: true,
        data: stats,
        count: stats.length,
        filters: {
          plaza_id: filters.plazaId || null,
          local_id: filters.localId || null,
          fecha_desde: filters.fechaInicio || null,
          fecha_hasta: filters.fechaFin || null
        }
      });
    } catch (error) {
      console.error('Error en getStatsByTipo:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estadísticas por tipo',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getTendenciaMensual(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined,
        fechaInicio: req.query.fecha_desde as string | undefined,
        fechaFin: req.query.fecha_hasta as string | undefined
      };

      const tendencia = await recoleccionService.getTendenciaMensual(filters);

      res.json({
        success: true,
        data: tendencia,
        filters: {
          plaza_id: filters.plazaId || null,
          local_id: filters.localId || null
        }
      });
    } catch (error) {
      console.error('Error en getTendenciaMensual:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo tendencia mensual',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getComparativaPlazas(req: Request, res: Response) {
    try {
      const filters = {
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined,
        fechaInicio: req.query.fecha_desde as string | undefined,
        fechaFin: req.query.fecha_hasta as string | undefined
      };

      const comparativa = await recoleccionService.getComparativaPlazas(filters);

      res.json({
        success: true,
        data: comparativa,
        count: comparativa.length,
        filters: {
          fecha_desde: filters.fechaInicio || null,
          fecha_hasta: filters.fechaFin || null
        }
      });
    } catch (error) {
      console.error('Error en getComparativaPlazas:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo comparativa por plazas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getTopLocales(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined,
        fechaInicio: req.query.fecha_desde as string | undefined,
        fechaFin: req.query.fecha_hasta as string | undefined
      };

      const topLocales = await recoleccionService.getTopLocales(filters);

      res.json({
        success: true,
        data: topLocales,
        count: topLocales.length,
        filters: {
          plaza_id: filters.plazaId || null,
          fecha_desde: filters.fechaInicio || null,
          fecha_hasta: filters.fechaFin || null
        }
      });
    } catch (error) {
      console.error('Error en getTopLocales:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo top locales',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getComparativaMensual(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined
      };

      const comparativa = await recoleccionService.getComparativaMensual(filters);

      res.json({
        success: true,
        data: comparativa,
        filters: {
          plaza_id: filters.plazaId || null
        }
      });
    } catch (error) {
      console.error('Error en getComparativaMensual:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo comparativa mensual',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getComparativaAnual(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined
      };

      const comparativa = await recoleccionService.getComparativaAnual(filters);

      res.json({
        success: true,
        data: comparativa,
        filters: {
          plaza_id: filters.plazaId || null
        }
      });
    } catch (error) {
      console.error('Error en getComparativaAnual:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo comparativa anual',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // CORREGIDO: Mapeo correcto de filtros
  async getComparativaTrimestral(req: Request, res: Response) {
    try {
      const filters = {
        plazaId: req.query.plaza_id as string | undefined,
        localId: req.query.local_id as string | undefined,
        tipoResiduoId: req.query.tipo_residuo_id as string | undefined,
        usuarioId: req.query.usuario_id as string | undefined
      };

      const comparativa = await recoleccionService.getComparativaTrimestral(filters);

      res.json({
        success: true,
        data: comparativa,
        filters: {
          plaza_id: filters.plazaId || null
        }
      });
    } catch (error) {
      console.error('Error en getComparativaTrimestral:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo comparativa trimestral',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }


  // Obtener historial de recolecciones por tipo (para dashboard cliente)
  async getRecoleccionesPorTipo(req: Request, res: Response) {
    try {
      const { tipoResiduoId } = req.params;
      const { plaza_id, local_id, fecha_desde, fecha_hasta, limit } = req.query;

      if (!tipoResiduoId) {
        return res.status(400).json({
          success: false,
          message: 'tipo_residuo_id es requerido'
        });
      }

      const filters = {
        plaza_id: plaza_id as string,
        local_id: local_id as string,
        fecha_desde: fecha_desde as string,
        fecha_hasta: fecha_hasta as string,
        limit: limit ? parseInt(limit as string) : 10
      };

      const result = await recoleccionService.getRecoleccionesPorTipo(
        tipoResiduoId,
        filters
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);

    } catch (error: any) {
      console.error('Error en getRecoleccionesPorTipo controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener recolecciones por tipo',
        error: error.message
      });
    }
  }



}