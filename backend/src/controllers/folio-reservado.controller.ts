// backend/src/controllers/folio-reservado.controller.ts

import { Request, Response } from 'express';
import { FolioReservadoService } from '../services/folio-reservado.service';
import { createFolioReservadoSchema, updateFolioReservadoSchema } from '../schemas/folio-reservado.schema';
import { supabase } from '../config/supabase';

export class FolioReservadoController {
  private folioReservadoService: FolioReservadoService;

  constructor(folioReservadoService: FolioReservadoService) {
    this.folioReservadoService = folioReservadoService;
  }

  // GET /api/folios-reservados
  getAll = async (req: Request, res: Response) => {
    try {
      const folios = await this.folioReservadoService.getAll();

      res.json({
        success: true,
        data: folios
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // GET /api/folios-reservados/disponibles?anio=2026&plaza_id=xxx
  getDisponibles = async (req: Request, res: Response) => {
    try {
      const anio = req.query.anio ? parseInt(req.query.anio as string) : undefined;
      const plazaId = req.query.plaza_id as string | undefined;

      const folios = await this.folioReservadoService.getDisponibles(anio, plazaId);

      res.json({
        success: true,
        data: folios
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // GET /api/folios-reservados/estadisticas?mes=1&anio=2026
  getEstadisticasMes = async (req: Request, res: Response) => {
    try {
      const mes = parseInt(req.query.mes as string);
      const anio = parseInt(req.query.anio as string);

      if (!mes || !anio) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren los parámetros mes y anio'
        });
      }

      const stats = await this.folioReservadoService.getEstadisticasMes(mes, anio);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // GET /api/folios-reservados/count
  getCount = async (req: Request, res: Response) => {
    try {
      const count = await this.folioReservadoService.count();

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

  // GET /api/folios-reservados/:id
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const folio = await this.folioReservadoService.getById(id);

      res.json({
        success: true,
        data: folio
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  };

  // POST /api/folios-reservados
  create = async (req: Request, res: Response) => {
    try {
      const validatedData = createFolioReservadoSchema.parse(req.body);
      const userId = (req as any).user.id;

      const folio = await this.folioReservadoService.create(validatedData, userId);

      res.status(201).json({
        success: true,
        data: folio
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

  // PUT /api/folios-reservados/:id
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateFolioReservadoSchema.parse(req.body);
      const folio = await this.folioReservadoService.update(id, validatedData);

      res.json({
        success: true,
        data: folio
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

  // DELETE /api/folios-reservados/:id
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.folioReservadoService.delete(id);

      res.json({
        success: true,
        message: 'Folio reservado eliminado correctamente'
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
const folioReservadoService = new FolioReservadoService(supabase);
export const folioReservadoController = new FolioReservadoController(folioReservadoService);
