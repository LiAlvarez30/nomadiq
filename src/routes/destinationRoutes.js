// Importamos Router para definir las rutas de destinos turísticos.
import { Router } from 'express';

// Importamos el middleware de autenticación para proteger ciertas rutas.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Importamos los controladores que contienen la lógica de negocio
// para crear, listar, obtener, actualizar y eliminar destinos.
import {
  create,
  getById,
  list,
  update,
  remove
} from '../controllers/destinationController.js';

// Creamos el router específico para /api/destinations.
const router = Router();

// Listar destinos (ruta pública).
// Método: GET
// URL completa: GET /api/destinations
router.get('/', list);

// Obtener un destino por ID (ruta pública).
// Método: GET
// URL completa: GET /api/destinations/:id
router.get('/:id', getById);

// Crear un nuevo destino (requiere autenticación).
// Método: POST
// URL completa: POST /api/destinations
router.post('/', authMiddleware, create);

// Actualizar un destino existente (requiere autenticación).
// Método: PATCH
// URL completa: PATCH /api/destinations/:id
router.patch('/:id', authMiddleware, update);

// Eliminar un destino (requiere autenticación).
// Método: DELETE
// URL completa: DELETE /api/destinations/:id
router.delete('/:id', authMiddleware, remove);

// Exportamos el router para montarlo en index.js como:
// app.use('/api/destinations', destinationRoutes);
export default router;
