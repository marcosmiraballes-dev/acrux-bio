import { Router } from 'express';
import { faltaPredefinidaController } from '../controllers/falta-predefinida.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/faltas-predefinidas - Obtener todas (o filtradas por reglamento)
router.get('/', faltaPredefinidaController.getAll);

// GET /api/faltas-predefinidas/grouped - Obtener agrupadas por reglamento
router.get('/grouped', faltaPredefinidaController.getGrouped);

// GET /api/faltas-predefinidas/:id - Obtener por ID
router.get('/:id', faltaPredefinidaController.getById);

// POST /api/faltas-predefinidas - Crear (Solo ADMIN)
router.post('/', 
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden crear faltas predefinidas' 
      });
    }
    next();
  },
  faltaPredefinidaController.create
);

// PUT /api/faltas-predefinidas/:id - Actualizar (Solo ADMIN)
router.put('/:id',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden actualizar faltas predefinidas' 
      });
    }
    next();
  },
  faltaPredefinidaController.update
);

// PATCH /api/faltas-predefinidas/:id/toggle-active - Activar/Desactivar (Solo ADMIN)
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
  faltaPredefinidaController.toggleActive
);

// DELETE /api/faltas-predefinidas/:id - Eliminar (Solo ADMIN)
router.delete('/:id',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden eliminar faltas predefinidas' 
      });
    }
    next();
  },
  faltaPredefinidaController.delete
);

export default router;