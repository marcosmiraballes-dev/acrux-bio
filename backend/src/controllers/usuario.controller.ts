import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { createUsuarioSchema, updateUsuarioSchema } from '../schemas/usuario.schema';
import { z } from 'zod';

const usuarioService = new UsuarioService();

export class UsuarioController {
  
  /**
   * GET /api/usuarios
   * Obtener todos los usuarios
   */
  async getAll(req: Request, res: Response) {
    try {
      const usuarios = await usuarioService.getAll();

      res.json({
        success: true,
        data: usuarios,
        count: usuarios.length
      });
    } catch (error) {
      console.error('Error en getAll usuarios:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo usuarios',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * GET /api/usuarios/:id
   * Obtener un usuario por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = await usuarioService.getById(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error en getById usuario:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo usuario',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * POST /api/usuarios
   * Crear un nuevo usuario
   */
  async create(req: Request, res: Response) {
    try {
      // Validar datos de entrada
      const validatedData = createUsuarioSchema.parse(req.body);

      const usuario = await usuarioService.create(validatedData);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuario
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en create usuario:', error);
      
      if (error instanceof Error && error.message.includes('ya está registrado')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error creando usuario',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Actualizar un usuario existente
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validar datos de entrada
      const validatedData = updateUsuarioSchema.parse(req.body);

      const usuario = await usuarioService.update(id, validatedData);

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuario
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors
        });
      }

      console.error('Error en update usuario:', error);
      
      if (error instanceof Error && error.message === 'Usuario no encontrado') {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      if (error instanceof Error && error.message.includes('ya está en uso')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error actualizando usuario',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * DELETE /api/usuarios/:id
   * Eliminar un usuario
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await usuarioService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error en delete usuario:', error);
      
      if (error instanceof Error && error.message.includes('último administrador')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Error eliminando usuario',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}