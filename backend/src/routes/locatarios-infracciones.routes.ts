import { Router } from 'express';
import { locatarioInfraccionController } from '../controllers/locatario-infraccion.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/locatarios-infracciones - Obtener todos
router.get('/', locatarioInfraccionController.getAll);

// GET /api/locatarios-infracciones/with-count - Obtener con conteo de infracciones
router.get('/with-count', locatarioInfraccionController.getAllWithCount);

// GET /api/locatarios-infracciones/search - Buscar
router.get('/search', locatarioInfraccionController.search);

// GET /api/locatarios-infracciones/:id - Obtener por ID
router.get('/:id', locatarioInfraccionController.getById);

// POST /api/locatarios-infracciones - Crear
// Solo COORDINADOR y DIRECTOR pueden crear
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
  locatarioInfraccionController.create
);

// PUT /api/locatarios-infracciones/:id - Actualizar
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
  locatarioInfraccionController.update
);

// PATCH /api/locatarios-infracciones/:id/toggle-active - Activar/Desactivar
router.patch('/:id/toggle-active',
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
  locatarioInfraccionController.toggleActive
);

// DELETE /api/locatarios-infracciones/:id - Eliminar
router.delete('/:id',
  authenticate,
  (req, res, next) => {
    if (!['ADMIN'].includes(req.user?.rol || '')) {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden eliminar locatarios' 
      });
    }
    next();
  },
  locatarioInfraccionController.delete
);

export default router;