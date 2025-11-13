import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  create,
  getById,
  list,
  update,
  remove
} from '../controllers/destinationController.js';

const router = Router();

// Listar destinos (público)
router.get('/', list);

// Obtener un destino por id (público)
router.get('/:id', getById);

// Crear destino (requiere autenticación)
router.post('/', authMiddleware, create);

// Actualizar destino (requiere autenticación)
router.patch('/:id', authMiddleware, update);

// Eliminar destino (requiere autenticación)
router.delete('/:id', authMiddleware, remove);

export default router;
