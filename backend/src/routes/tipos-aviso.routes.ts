import { Router } from 'express';
import { tipoAvisoController } from '../controllers/tipo-aviso.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/tipos-aviso - Obtener todos
router.get('/', tipoAvisoController.getAll);

// GET /api/tipos-aviso/with-count - Obtener con conteo de infracciones
router.get('/with-count', tipoAvisoController.getAllWithCount);

// GET /api/tipos-aviso/:id - Obtener por ID
router.get('/:id', tipoAvisoController.getById);

// POST /api/tipos-aviso - Crear (Solo ADMIN)
router.post('/', 
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden crear tipos de aviso' 
      });
    }
    next();
  },
  tipoAvisoController.create
);

// PUT /api/tipos-aviso/:id - Actualizar (Solo ADMIN)
router.put('/:id',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden actualizar tipos de aviso' 
      });
    }
    next();
  },
  tipoAvisoController.update
);

// POST /api/tipos-aviso/reorder - Reordenar (Solo ADMIN)
router.post('/reorder',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden reordenar tipos de aviso' 
      });
    }
    next();
  },
  tipoAvisoController.reorder
);

// DELETE /api/tipos-aviso/:id - Eliminar (Solo ADMIN)
router.delete('/:id',
  (req, res, next) => {
    if (req.user?.rol !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Solo administradores pueden eliminar tipos de aviso' 
      });
    }
    next();
  },
  tipoAvisoController.delete
);

export default router;