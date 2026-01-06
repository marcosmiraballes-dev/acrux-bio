// backend/src/controllers/recolector.controller.ts

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecolectorController {
  /**
   * GET /api/recolectores - Obtener todos los recolectores activos
   */
  async getAll(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('recolectores')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          error: `Error al obtener recolectores: ${error.message}`
        });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  }
}

export const recolectorController = new RecolectorController();