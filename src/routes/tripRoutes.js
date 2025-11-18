// Importamos Router para definir las rutas relacionadas con trips (viajes).
import { Router } from 'express';

// Importamos el middleware de autenticación.
// Los trips son siempre privados por usuario, así que todas las rutas
// de este router deberían requerir un token válido.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Importamos los controladores que manejan la lógica para cada endpoint.
import {
  create,
  getById,
  list,
  update,
  remove,
  generateItinerary
} from '../controllers/tripController.js';

// Creamos el router específico para /api/trips.
const router = Router();

// Aplicamos el middleware de autenticación a TODAS las rutas de trips.
// A partir de aquí, cualquier endpoint definido en este router
// solo será accesible si el usuario está autenticado.
router.use(authMiddleware);

// Crear un trip (viaje) para el usuario autenticado.
// Método: POST
// URL completa: POST /api/trips
router.post('/', create);

// Obtener un trip por ID, siempre que pertenezca al usuario actual.
// Método: GET
// URL completa: GET /api/trips/:id
router.get('/:id', getById);

// Listar trips del usuario (con filtros opcionales por query).
// Método: GET
// URL completa: GET /api/trips
router.get('/', list);

// Actualizar un trip existente del usuario.
// Método: PATCH
// URL completa: PATCH /api/trips/:id
router.patch('/:id', update);

// Eliminar un trip del usuario.
// Método: DELETE
// URL completa: DELETE /api/trips/:id
router.delete('/:id', remove);

// Generar un itinerario para un trip usando el motor de reglas.
// Requiere autenticación porque el trip debe pertenecer al usuario.
router.post('/:id/generate-itinerary', authMiddleware, generateItinerary);

// Exportamos el router para montarlo en index.js como:
// app.use('/api/trips', tripRoutes);
export default router;
