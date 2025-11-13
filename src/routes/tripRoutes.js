import { Router } from 'express';
import {
  create,
  getById,
  list,
  update,
  remove
} from '../controllers/tripController.js';

const router = Router();

// Crear un trip
router.post('/', create);

// Obtener un trip por ID
router.get('/:id', getById);

// Listar trips (con filtros opcionales)
router.get('/', list);

// Actualizar un trip
router.patch('/:id', update);

// Eliminar un trip
router.delete('/:id', remove);

export default router;
