import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  
  /**
   * POST /api/auth/login
   * Login de usuario
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email y password son requeridos'
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error) {
      console.error('Error en login:', error);
      
      const message = error instanceof Error ? error.message : 'Error desconocido';
      const statusCode = message === 'Credenciales inválidas' ? 401 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Error en login',
        message
      });
    }
  }

  /**
   * POST /api/auth/register
   * Registro de nuevo usuario
   */
  async register(req: Request, res: Response) {
    try {
      const { nombre, email, password, rol } = req.body;

      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nombre, email y password son requeridos'
        });
      }

      // Validar rol
      const rolesValidos = ['ADMIN', 'CAPTURADOR', 'VISOR'];
      if (rol && !rolesValidos.includes(rol)) {
        return res.status(400).json({
          success: false,
          error: 'Rol inválido',
          rolesValidos
        });
      }

      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error en register:', error);
      
      const message = error instanceof Error ? error.message : 'Error desconocido';
      const statusCode = message.includes('ya está registrado') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Error en registro',
        message
      });
    }
  }

  /**
   * GET /api/auth/profile
   * Obtener perfil del usuario autenticado
   */
  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'No autenticado'
        });
      }

      const usuario = await authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error en getProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo perfil',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}