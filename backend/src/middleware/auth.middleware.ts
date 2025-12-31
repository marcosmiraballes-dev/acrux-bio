import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Extender el tipo Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware para verificar JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado - Token no proporcionado'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = verifyToken(token);

    // Agregar usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'No autorizado - Token inválido',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Middleware para verificar rol específico
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado - Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'Prohibido - No tienes permisos suficientes',
        requiredRoles: roles,
        userRole: req.user.rol
      });
    }

    next();
  };
};

/**
 * Middleware combinado: autenticación + autorización por rol
 * Esta función combina authenticate y authorize en uno solo
 */
export const authMiddleware = (allowedRoles: string[]) => {
  return [
    authenticate,
    authorize(...allowedRoles)
  ];
};