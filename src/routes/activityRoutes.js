// Importamos Router para crear las rutas relacionadas con actividades.
import { Router } from 'express';

// Importamos el middleware de autenticación para proteger
// las operaciones que modifican datos.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Importamos los controladores de actividades.
import {
  create,
  getById,
  list,
  update,
  remove
} from '../controllers/activityController.js';

// Creamos el router específico para /api/activities.
const router = Router();

// Listar actividades (ruta pública, con posibles filtros por query).
// Método: GET
// URL completa: GET /api/activities
router.get('/', list);

// Obtener una actividad por ID (ruta pública).
// Método: GET
// URL completa: GET /api/activities/:id
router.get('/:id', getById);

// Crear una nueva actividad (requiere autenticación).
// Método: POST
// URL completa: POST /api/activities
router.post('/', authMiddleware, create);

// Actualizar una actividad (requiere autenticación).
// Método: PATCH
// URL completa: PATCH /api/activities/:id
router.patch('/:id', authMiddleware, update);

// Eliminar una actividad (requiere autenticación).
// Método: DELETE
// URL completa: DELETE /api/activities/:id
router.delete('/:id', authMiddleware, remove);

// Exportamos el router para montarlo en index.js como:
// app.use('/api/activities', activityRoutes);
export default router;
