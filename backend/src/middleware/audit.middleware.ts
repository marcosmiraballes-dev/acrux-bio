// backend/src/middleware/audit.middleware.ts

import { Request, Response, NextFunction } from 'express';
import logAuditoriaService from '../services/log-auditoria.service';

/**
 * Middleware de auditoría para registrar acciones CREATE, UPDATE, DELETE
 * 
 * @param modulo - Nombre del módulo (usuarios, recolecciones, etc.)
 * @param accion - Tipo de acción (CREATE, UPDATE, DELETE)
 * 
 * Uso:
 * router.post('/', authenticate, auditMiddleware('recolecciones', 'CREATE'), controller.create);
 */
export const auditMiddleware = (
  modulo: string,
  accion: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Guardar el método original res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para capturar la respuesta
    res.json = function (body: any) {
      // Solo registrar si fue exitoso (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Ejecutar log en background (no bloquear la respuesta)
        setImmediate(async () => {
          try {
            const usuario = req.user;
            if (!usuario) {
              console.warn('⚠️ Auditoría sin usuario:', { modulo, accion });
              return;
            }

            let descripcion = '';
            let registro_id = undefined;
            let datos_nuevos = undefined;

            // Generar descripción y extraer datos según la acción
            if (accion === 'CREATE') {
              registro_id = body.data?.id;
              datos_nuevos = body.data;
              descripcion = `Creó ${modulo}`;
              
              // Descripciones más específicas por módulo
              if (modulo === 'recolecciones' && body.data?.plaza_nombre) {
                descripcion = `Creó recolección en ${body.data.plaza_nombre}`;
              } else if (modulo === 'manifiestos' && body.data?.folio) {
                descripcion = `Generó manifiesto ${body.data.folio}`;
              } else if (modulo === 'usuarios' && body.data?.nombre) {
                descripcion = `Creó usuario ${body.data.nombre}`;
              }
            } else if (accion === 'UPDATE') {
              registro_id = req.params.id || body.data?.id;
              datos_nuevos = body.data;
              descripcion = `Actualizó ${modulo}`;
            } else if (accion === 'DELETE') {
              registro_id = req.params.id;
              descripcion = `Eliminó ${modulo}`;
            }

            // Crear log de auditoría
            await logAuditoriaService.crear({
              usuario_id: usuario.id,
              usuario_nombre: usuario.nombre,
              usuario_email: usuario.email,
              usuario_rol: usuario.rol,
              accion,
              modulo,
              registro_id,
              tabla: modulo,
              datos_nuevos,
              descripcion,
              ip_address: req.ip || req.socket.remoteAddress,
              user_agent: req.get('user-agent'),
              endpoint: req.originalUrl,
              metodo: req.method
            });

            console.log(`📝 Log creado: ${descripcion} por ${usuario.nombre}`);
          } catch (error) {
            console.error('❌ Error en auditMiddleware:', error);
            // NO lanzar error - no debe romper el flujo principal
          }
        });
      }

      // Llamar al método original
      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware específico para LOGIN
 * Se aplica en la ruta de autenticación
 */
export const auditLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if (res.statusCode === 200 && body.data?.usuario) {
      setImmediate(async () => {
        try {
          const usuario = body.data.usuario;
          
          await logAuditoriaService.crear({
            usuario_id: usuario.id,
            usuario_nombre: usuario.nombre,
            usuario_email: usuario.email,
            usuario_rol: usuario.rol,
            accion: 'LOGIN',
            modulo: 'auth',
            descripcion: `Inició sesión - ${usuario.rol}`,
            ip_address: req.ip || req.socket.remoteAddress,
            user_agent: req.get('user-agent'),
            endpoint: req.originalUrl,
            metodo: req.method
          });

          console.log(`🔐 Login registrado: ${usuario.nombre} (${usuario.rol})`);
        } catch (error) {
          console.error('❌ Error en auditLogin:', error);
        }
      });
    }

    return originalJson(body);
  };

  next();
};

/**
 * Middleware específico para LOGOUT
 */
export const auditLogout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const usuario = req.user;

  if (usuario) {
    setImmediate(async () => {
      try {
        await logAuditoriaService.crear({
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre,
          usuario_email: usuario.email,
          usuario_rol: usuario.rol,
          accion: 'LOGOUT',
          modulo: 'auth',
          descripcion: 'Cerró sesión',
          ip_address: req.ip || req.socket.remoteAddress,
          user_agent: req.get('user-agent'),
          endpoint: req.originalUrl,
          metodo: req.method
        });

        console.log(`🚪 Logout registrado: ${usuario.nombre}`);
      } catch (error) {
        console.error('❌ Error en auditLogout:', error);
      }
    });
  }

  next();
};