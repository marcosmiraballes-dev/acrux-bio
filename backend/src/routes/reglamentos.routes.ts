import { Router } from 'express';
import { reglamentoController } from '../controllers/reglamento.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/reglamentos - Obtener todos (o solo activos con ?active_only=true)
router.get('/', reglamentoController.getAll);

// GET /api/reglamentos/with-count - Obtener con conteo de faltas predefinidas
router.get('/with-count', reglamentoController.getAllWithCount);

// GET /api/reglamentos/:id - Obtener por ID
router.get('/:id', reglamentoController.getById);

// POST /api/reglamentos - Crear (Solo ADMIN)
router.post('/', 
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden crear reglamentos' 
      });
    }
    next();
  },
  reglamentoController.create
);

// PUT /api/reglamentos/:id - Actualizar (Solo ADMIN)
router.put('/:id',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden actualizar reglamentos' 
      });
    }
    next();
  },
  reglamentoController.update
);

// PATCH /api/reglamentos/:id/toggle-active - Activar/Desactivar (Solo ADMIN)
router.patch('/:id/toggle-active',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden cambiar el estado' 
      });
    }
    next();
  },
  reglamentoController.toggleActive
);

// POST /api/reglamentos/reorder - Reordenar (Solo ADMIN)
router.post('/reorder',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden reordenar reglamentos' 
      });
    }
    next();
  },
  reglamentoController.reorder
);

// DELETE /api/reglamentos/:id - Eliminar (Solo ADMIN)
router.delete('/:id',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden eliminar reglamentos' 
      });
    }
    next();
  },
  reglamentoController.delete
);

export default router;