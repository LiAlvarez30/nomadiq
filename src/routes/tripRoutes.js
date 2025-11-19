// src/routes/tripRoutes.js
// ------------------------
// Este archivo define las rutas HTTP relacionadas con "trips" (viajes).
// Aquí conectamos:
//   - Router de Express
//   - authMiddleware (para proteger las rutas con JWT)
//   - Los handlers definidos en tripController.
//
// Rutas principales:
//   POST   /api/trips               -> crear un trip
//   GET    /api/trips               -> listar trips (del usuario autenticado)
//   GET    /api/trips/:id           -> obtener un trip por id
//   PATCH  /api/trips/:id           -> actualizar un trip
//   DELETE /api/trips/:id           -> eliminar un trip
//
// Más adelante también se conecta:
//   POST   /api/trips/:tripId/generate-itinerary  -> generar itinerario para un trip

import { Router } from 'express';

// Importamos el middleware de autenticación.
// Esto asegura que todas las rutas de trips requieran un token válido.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Importamos los handlers del controlador de trips.
import {
  create,
  getById,
  list,
  update,
  remove
} from '../controllers/tripController.js';

// Creamos una instancia de Router para agrupar las rutas de trips.
const router = Router();

// -----------------------------------------------------------------------------
// POST /api/trips
// -----------------------------------------------------------------------------
// Crear un nuevo trip.
// Protegido con authMiddleware: solo usuarios autenticados pueden crear viajes.
//
router.post('/', authMiddleware, create);

// -----------------------------------------------------------------------------
// GET /api/trips/:id
// -----------------------------------------------------------------------------
// Obtener un trip por ID.
// Protegido con authMiddleware: solo usuarios autenticados pueden ver los detalles.
// En el controlador validaremos que el trip pertenezca al usuario, salvo que
// tenga rol "admin" (esto lo agregaremos en el siguiente paso).
//
router.get('/:id', authMiddleware, getById);

// -----------------------------------------------------------------------------
// GET /api/trips
// -----------------------------------------------------------------------------
// Listar trips del usuario autenticado.
// En el controlador usaremos req.user.id para filtrar por dueño.
// De esta forma, cada usuario solo ve sus propios viajes.
// (Podremos hacer excepciones para admin más adelante si hace falta.)
//
router.get('/', authMiddleware, list);

// -----------------------------------------------------------------------------
// PATCH /api/trips/:id
// -----------------------------------------------------------------------------
// Actualizar un trip existente.
// Protegido con authMiddleware.
// En el controlador validaremos que el trip realmente pertenezca al usuario.
// Si no es dueño ni admin, devolveremos 403 (FORBIDDEN).
//
router.patch('/:id', authMiddleware, update);

// -----------------------------------------------------------------------------
// DELETE /api/trips/:id
// -----------------------------------------------------------------------------
// Eliminar un trip existente.
// Protegido con authMiddleware.
// También validaremos ownership en el controlador.
//
router.delete('/:id', authMiddleware, remove);

// Exportamos el router para poder usarlo en index.js.
export default router;
