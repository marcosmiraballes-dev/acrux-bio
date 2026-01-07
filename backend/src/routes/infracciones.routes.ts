import { Router } from 'express';
import { infraccionController } from '../controllers/infraccion.controller';
import { authenticate } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware'; // ⭐ AGREGADO

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/infracciones - Obtener todas con filtros
router.get('/', infraccionController.getAll);

// GET /api/infracciones/count - Contar infracciones
router.get('/count', infraccionController.count);

// GET /api/infracciones/stats - Obtener estadísticas
router.get('/stats', infraccionController.getStats);

// GET /api/infracciones/top-locatarios - Top locatarios
router.get('/top-locatarios', infraccionController.getTopLocatarios);

// GET /api/infracciones/locatario/:locatarioId/next-nro - Siguiente número de aviso
router.get('/locatario/:locatarioId/next-nro', infraccionController.getNextNroAviso);

// GET /api/infracciones/locatario/:locatarioId - Por locatario
router.get('/locatario/:locatarioId', infraccionController.getByLocatario);

// GET /api/infracciones/:id - Obtener por ID
router.get('/:id', infraccionController.getById);

// POST /api/infracciones - Crear
// Solo COORDINADOR y DIRECTOR pueden crear
// ⭐ CON AUDITORÍA
router.post('/', 
  authenticate, 
  (req, res, next) => {
    if (!['COORDINADOR', 'DIRECTOR', 'ADMIN'].includes(req.user?.rol || '')) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para esta acción' 
      });
    }
    next();
  },
  auditMiddleware('infracciones', 'CREATE'), // ⭐ AGREGADO
  infraccionController.create
);

// PUT /api/infracciones/:id - Actualizar
// ⭐ CON AUDITORÍA
router.put('/:id',
  authenticate,
  (req, res, next) => {
    if (!['COORDINADOR', 'DIRECTOR', 'ADMIN'].includes(req.user?.rol || '')) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para esta acción' 
      });
    }
    next();
  },
  auditMiddleware('infracciones', 'UPDATE'), // ⭐ AGREGADO
  infraccionController.update
);

// PATCH /api/infracciones/:id/resolver - Marcar como resuelta
// ⭐ CON AUDITORÍA
router.patch('/:id/resolver',
  authenticate,
  (req, res, next) => {
    if (!['COORDINADOR', 'DIRECTOR', 'ADMIN'].includes(req.user?.rol || '')) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para esta acción' 
      });
    }
    next();
  },
  auditMiddleware('infracciones', 'UPDATE'), // ⭐ AGREGADO
  infraccionController.resolver
);

// PATCH /api/infracciones/:id/cancelar - Cancelar infracción
// ⭐ CON AUDITORÍA
router.patch('/:id/cancelar',
  authenticate,
  (req, res, next) => {
    if (!['DIRECTOR', 'ADMIN'].includes(req.user?.rol || '')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo directores pueden cancelar infracciones' 
      });
    }
    next();
  },
  auditMiddleware('infracciones', 'UPDATE'), // ⭐ AGREGADO
  infraccionController.cancelar
);

// DELETE /api/infracciones/:id - Eliminar
// ⭐ CON AUDITORÍA
router.delete('/:id',
  authenticate,
  (req, res, next) => {
    if (!['ADMIN'].includes(req.user?.rol || '')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden eliminar infracciones' 
      });
    }
    next();
  },
  auditMiddleware('infracciones', 'DELETE'), // ⭐ AGREGADO
  infraccionController.delete
);

export default router;