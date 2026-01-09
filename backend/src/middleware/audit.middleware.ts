// backend/src/middleware/audit.middleware.ts

import { Request, Response, NextFunction } from 'express';
import logAuditoriaService from '../services/log-auditoria.service';

export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';

/**
 * Genera descripción detallada según el módulo y los datos
 */
const generarDescripcionDetallada = (
  modulo: string,
  accion: AccionAuditoria,
  datos_nuevos: any,
  datos_anteriores: any = null
): string => {
  try {
    // ==================== RECOLECCIONES ====================
    if (modulo === 'recolecciones') {
      if (accion === 'CREATE' && datos_nuevos) {
        const plaza = datos_nuevos.plazas?.nombre || datos_nuevos.plaza_nombre || 'Plaza desconocida';
        const local = datos_nuevos.locales?.nombre || datos_nuevos.local_nombre || 'Local desconocido';
        const fecha = datos_nuevos.fecha_recoleccion || 'Sin fecha';
        
        // Parsear residuos si existen
        let residuosTexto = '';
        if (datos_nuevos.detalle_recolecciones && Array.isArray(datos_nuevos.detalle_recolecciones)) {
          const residuos = datos_nuevos.detalle_recolecciones
            .filter((d: any) => (d.kilos || 0) > 0)
            .map((d: any) => {
              // ✅ CORREGIDO: El campo es 'nombre' no 'tipo'
              const tipo = d.tipos_residuos?.nombre ||      // ✅ Campo correcto
                          d.tipo_residuo_nombre ||           
                          d.tipos_residuos?.tipo ||          // Por si cambia en el futuro
                          d.tipo ||                          
                          'Residuo desconocido';             
              
              return `${tipo}: ${parseFloat(d.kilos).toFixed(1)}kg`;
            })
            .join(', ');
          
          const totalKilos = datos_nuevos.detalle_recolecciones.reduce(
            (sum: number, d: any) => sum + (parseFloat(d.kilos) || 0), 0
          );
          
          if (residuos) {
            residuosTexto = `\nResiduos: ${residuos}\nTotal: ${totalKilos.toFixed(1)}kg`;
          }
        }
        
        return `Creó recolección en ${plaza} - ${local}\nFecha: ${fecha}${residuosTexto}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const plaza = datos_nuevos.plazas?.nombre || datos_nuevos.plaza_nombre || 'Plaza';
        const local = datos_nuevos.locales?.nombre || datos_nuevos.local_nombre || 'Local';
        return `Editó recolección en ${plaza} - ${local}`;
      }
      
      if (accion === 'DELETE') {
        return `Eliminó recolección`;
      }
    }

    // ==================== MANIFIESTOS ====================
    if (modulo === 'manifiestos') {
      if (accion === 'CREATE' && datos_nuevos) {
        const folio = datos_nuevos.folio || 'Sin folio';
        const local = datos_nuevos.generador_nombre_comercial || datos_nuevos.local || 'Local desconocido';
        const fecha = datos_nuevos.fecha_emision || 'Sin fecha';
        
        let residuosTexto = '';
        if (datos_nuevos.residuos && Array.isArray(datos_nuevos.residuos)) {
          const residuos = datos_nuevos.residuos
            .filter((r: any) => (r.cantidad_kg || 0) > 0)
            .map((r: any) => `${r.tipo}: ${r.cantidad_kg}kg`)
            .join(', ');
          
          const totalKilos = datos_nuevos.residuos.reduce(
            (sum: number, r: any) => sum + (parseFloat(r.cantidad_kg) || 0), 0
          );
          
          if (residuos) {
            residuosTexto = `\nResiduos: ${residuos}\nTotal: ${totalKilos.toFixed(1)}kg`;
          }
        }
        
        return `Generó manifiesto ${folio}\nGenerador: ${local}\nFecha: ${fecha}${residuosTexto}`;
      }
      
      if (accion === 'DELETE') {
        const folio = datos_anteriores?.folio || 'Sin folio';
        return `Eliminó manifiesto ${folio}`;
      }
    }

    // ==================== INFRACCIONES ====================
    if (modulo === 'infracciones') {
      if (accion === 'CREATE' && datos_nuevos) {
        // ✅ CORREGIDO: Extraer información correctamente
        const localNombre = datos_nuevos.locales?.nombre || 
                           datos_nuevos.locatario_nombre || 
                           datos_nuevos.local_nombre ||
                           'Local desconocido';
        
        const reglamentoPunto = datos_nuevos.reglamentos?.numero_punto || 
                               datos_nuevos.reglamento_numero ||
                               datos_nuevos.numero_punto ||
                               'N/A';
        
        const tipoAviso = datos_nuevos.tipos_aviso?.tipo || 
                         datos_nuevos.tipo_aviso_tipo ||
                         datos_nuevos.tipo_aviso ||
                         'Aviso';
        
        // Formatear fecha dd/mm/aaaa
        let fechaFormateada = 'Sin fecha';
        if (datos_nuevos.fecha_infraccion) {
          try {
            const fecha = new Date(datos_nuevos.fecha_infraccion);
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();
            fechaFormateada = `${dia}/${mes}/${anio}`;
          } catch (e) {
            fechaFormateada = datos_nuevos.fecha_infraccion;
          }
        }
        
        return `Registró infracción - Local: ${localNombre}, Reglamento: ${reglamentoPunto}, Tipo Aviso: ${tipoAviso}, Fecha: ${fechaFormateada}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        if (datos_nuevos.estatus === 'resuelto' || datos_nuevos.estatus === 'RESUELTO') {
          const local = datos_nuevos.locales?.nombre || 
                       datos_nuevos.locatario_nombre || 
                       'Local';
          return `Resolvió infracción de ${local}`;
        }
        const local = datos_nuevos.locales?.nombre || 
                     datos_nuevos.locatario_nombre || 
                     'Local';
        return `Editó infracción de ${local}`;
      }
      
      if (accion === 'DELETE') {
        return `Eliminó infracción`;
      }
    }

    // ==================== USUARIOS ====================
    if (modulo === 'usuarios') {
      if (accion === 'CREATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre || 'Usuario';
        const rol = datos_nuevos.rol || 'Sin rol';
        const email = datos_nuevos.email || 'Sin email';
        return `Creó usuario: ${nombre}\nRol: ${rol}\nEmail: ${email}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre || 'Usuario';
        
        if (datos_anteriores) {
          const cambios = [];
          if (datos_anteriores.rol !== datos_nuevos.rol) {
            cambios.push(`Rol: ${datos_anteriores.rol} → ${datos_nuevos.rol}`);
          }
          if (datos_anteriores.activo !== datos_nuevos.activo) {
            const estadoAntes = datos_anteriores.activo ? 'Activo' : 'Inactivo';
            const estadoDespues = datos_nuevos.activo ? 'Activo' : 'Inactivo';
            cambios.push(`Estado: ${estadoAntes} → ${estadoDespues}`);
          }
          if (cambios.length > 0) {
            return `Editó usuario: ${nombre}\nCambios: ${cambios.join(', ')}`;
          }
        }
        
        return `Editó usuario: ${nombre}`;
      }
      
      if (accion === 'DELETE') {
        const nombre = datos_anteriores?.nombre || datos_nuevos?.nombre || 'Usuario';
        return `Desactivó usuario: ${nombre}`;
      }
    }

    // ==================== PLAZAS ====================
    if (modulo === 'plazas') {
      if (accion === 'CREATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre || 'Plaza';
        const ciudad = datos_nuevos.ciudad || 'Sin ciudad';
        return `Creó plaza: ${nombre}\nCiudad: ${ciudad}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre || 'Plaza';
        return `Editó plaza: ${nombre}`;
      }
      
      if (accion === 'DELETE') {
        const nombre = datos_anteriores?.nombre || datos_nuevos?.nombre || 'Plaza';
        return `Eliminó plaza: ${nombre}`;
      }
    }

    // ==================== LOCALES ====================
    if (modulo === 'locales') {
      if (accion === 'CREATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre || 'Local';
        const giro = datos_nuevos.giro || 'Sin giro';
        const plaza = datos_nuevos.plazas?.nombre || datos_nuevos.plaza || 'Sin plaza';
        return `Creó local: ${nombre}\nGiro: ${giro}\nPlaza: ${plaza}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre || 'Local';
        return `Editó local: ${nombre}`;
      }
      
      if (accion === 'DELETE') {
        const nombre = datos_anteriores?.nombre || datos_nuevos?.nombre || 'Local';
        return `Eliminó local: ${nombre}`;
      }
    }

    // ==================== TIPOS DE RESIDUOS ====================
    if (modulo === 'tipos_residuos') {
      if (accion === 'CREATE' && datos_nuevos) {
        const tipo = datos_nuevos.tipo || 'Tipo de residuo';
        const factor = datos_nuevos.factor_co2 || 0;
        return `Creó tipo de residuo: ${tipo}\nFactor CO₂: ${factor}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const tipo = datos_nuevos.tipo || 'Tipo de residuo';
        return `Editó tipo de residuo: ${tipo}`;
      }
      
      if (accion === 'DELETE') {
        const tipo = datos_anteriores?.tipo || datos_nuevos?.tipo || 'Tipo de residuo';
        return `Eliminó tipo de residuo: ${tipo}`;
      }
    }

    // ==================== VEHÍCULOS ====================
    if (modulo === 'vehiculos') {
      if (accion === 'CREATE' && datos_nuevos) {
        const tipo = datos_nuevos.tipo || 'Vehículo';
        const placas = datos_nuevos.placas || 'Sin placas';
        return `Creó vehículo: ${tipo}\nPlacas: ${placas}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const tipo = datos_nuevos.tipo || 'Vehículo';
        const placas = datos_nuevos.placas || '';
        
        if (datos_anteriores && datos_anteriores.activo !== datos_nuevos.activo) {
          const estado = datos_nuevos.activo ? 'Activó' : 'Desactivó';
          return `${estado} vehículo: ${tipo} (${placas})`;
        }
        
        return `Editó vehículo: ${tipo} (${placas})`;
      }
      
      if (accion === 'DELETE') {
        const tipo = datos_anteriores?.tipo || datos_nuevos?.tipo || 'Vehículo';
        return `Eliminó vehículo: ${tipo}`;
      }
    }

    // ==================== DESTINOS FINALES ====================
    if (modulo === 'destinos_finales') {
      if (accion === 'CREATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre_destino || 'Destino';
        const autorizacion = datos_nuevos.numero_autorizacion || 'Sin autorización';
        return `Creó destino final: ${nombre}\nAutorización: ${autorizacion}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const nombre = datos_nuevos.nombre_destino || 'Destino';
        
        if (datos_anteriores && datos_anteriores.activo !== datos_nuevos.activo) {
          const estado = datos_nuevos.activo ? 'Activó' : 'Desactivó';
          return `${estado} destino final: ${nombre}`;
        }
        
        return `Editó destino final: ${nombre}`;
      }
      
      if (accion === 'DELETE') {
        const nombre = datos_anteriores?.nombre_destino || datos_nuevos?.nombre_destino || 'Destino';
        return `Eliminó destino final: ${nombre}`;
      }
    }

    // ==================== FOLIOS RESERVADOS ====================
    if (modulo === 'folios_reservados') {
      if (accion === 'CREATE' && datos_nuevos) {
        const folio = datos_nuevos.folio_manual || 'Folio';
        const mes = datos_nuevos.mes || '';
        const anio = datos_nuevos.anio || '';
        return `Reservó folio: ${folio}\nPeriodo: ${mes}/${anio}`;
      }
      
      if (accion === 'UPDATE' && datos_nuevos) {
        const folio = datos_nuevos.folio_manual || 'Folio';
        return `Editó folio reservado: ${folio}`;
      }
      
      if (accion === 'DELETE') {
        const folio = datos_anteriores?.folio_manual || datos_nuevos?.folio_manual || 'Folio';
        return `Eliminó folio reservado: ${folio}`;
      }
    }

    // ==================== AUTH ====================
    if (modulo === 'auth') {
      if (accion === 'LOGIN' && datos_nuevos) {
        const email = datos_nuevos.email || 'Usuario';
        const rol = datos_nuevos.rol || 'Sin rol';
        return `Inició sesión\nEmail: ${email}\nRol: ${rol}`;
      }
      
      if (accion === 'LOGOUT') {
        return `Cerró sesión`;
      }
    }

    // ==================== DESCRIPCIÓN GENÉRICA (fallback) ====================
    return `${accion} en ${modulo}`;

  } catch (error) {
    console.error('❌ Error generando descripción detallada:', error);
    return `${accion} en ${modulo}`;
  }
};

/**
 * Middleware principal de auditoría
 */
export const auditMiddleware = (modulo: string, accion: AccionAuditoria) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Solo loguear respuestas exitosas (200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Ejecutar en background para no bloquear la respuesta
        setImmediate(async () => {
          try {
            const user = (req as any).user;
            if (!user) {
              console.warn('⚠️ Auditoría sin usuario:', { modulo, accion });
              return;
            }

            const registro_id = body?.data?.id || null;
            const datos_nuevos = body?.data || null;

            // ✅ GENERAR DESCRIPCIÓN DETALLADA
            const descripcion = generarDescripcionDetallada(modulo, accion, datos_nuevos);

            const logData = {
              usuario_id: user.id,
              usuario_nombre: user.nombre || 'Sistema',
              usuario_email: user.email || undefined,
              usuario_rol: user.rol || null,
              accion,
              modulo,
              registro_id,
              tabla: modulo,
              datos_anteriores: null,
              datos_nuevos,
              descripcion, // ✅ DESCRIPCIÓN DETALLADA INCLUIDA
              ip_address: req.ip || req.socket.remoteAddress || undefined,
              user_agent: req.get('user-agent') || undefined,
              endpoint: req.originalUrl,
              metodo: req.method
            };

            await logAuditoriaService.crear(logData);
            console.log(`📝 Log creado: ${user.nombre} - ${descripcion.split('\n')[0]}`);
          } catch (error) {
            console.error('❌ Error en auditMiddleware:', error);
          }
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware para LOGIN
 */
export const auditLogin = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    if (res.statusCode === 200 && body?.data?.usuario) {
      setImmediate(async () => {
        try {
          const user = body.data.usuario;
          
          const descripcion = generarDescripcionDetallada('auth', 'LOGIN', {
            email: user.email,
            rol: user.rol
          });

          await logAuditoriaService.crear({
            usuario_id: user.id,
            usuario_nombre: user.nombre,
            usuario_email: user.email,
            usuario_rol: user.rol,
            accion: 'LOGIN',
            modulo: 'auth',
            registro_id: user.id,
            tabla: 'usuarios',
            datos_nuevos: { email: user.email, rol: user.rol },
            descripcion,
            ip_address: req.ip || req.socket.remoteAddress || undefined,
            user_agent: req.get('user-agent') || undefined,
            endpoint: req.originalUrl,
            metodo: req.method
          });

          console.log(`🔐 Login registrado: ${user.nombre} (${user.rol})`);
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
 * Middleware para LOGOUT
 */
export const auditLogout = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user) {
    setImmediate(async () => {
      try {
        const descripcion = generarDescripcionDetallada('auth', 'LOGOUT', null);

        await logAuditoriaService.crear({
          usuario_id: user.id,
          usuario_nombre: user.nombre,
          usuario_email: user.email,
          usuario_rol: user.rol,
          accion: 'LOGOUT',
          modulo: 'auth',
          registro_id: user.id,
          tabla: 'usuarios',
          descripcion,
          ip_address: req.ip || req.socket.remoteAddress || undefined,
          user_agent: req.get('user-agent') || undefined,
          endpoint: req.originalUrl,
          metodo: req.method
        });

        console.log(`🚪 Logout registrado: ${user.nombre}`);
      } catch (error) {
        console.error('❌ Error en auditLogout:', error);
      }
    });
  }

  next();
};
