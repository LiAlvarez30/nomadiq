import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  create,
  getById,
  list,
  update,
  remove
} from '../controllers/activityController.js';

const router = Router();

// Listar actividades (público, con filtros opcionales)
router.get('/', list);

// Obtener una actividad por id (público)
router.get('/:id', getById);

// Crear actividad (requiere autenticación)
router.post('/', authMiddleware, create);

// Actualizar actividad (requiere autenticación)
router.patch('/:id', authMiddleware, update);

// Eliminar actividad (requiere autenticación)
router.delete('/:id', authMiddleware, remove);

export default router;
