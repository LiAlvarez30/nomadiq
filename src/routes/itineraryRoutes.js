// Rutas de Itinerarios
// --------------------
// Este archivo define las rutas HTTP relacionadas con "itineraries".
// Aquí solo conectamos los paths (URLs) con las funciones del controller,
// y aplicamos los middlewares necesarios (por ejemplo, auth).

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Importamos las funciones del controlador de itinerarios.
import {
  create,
  getById,
  list,
  update,
  remove,
  enrichWithAI
} from '../controllers/itineraryController.js';


// Creamos una instancia de Router de Express.
const router = Router();

// Listar itinerarios (normalmente filtrando por tripId).
// Requerimos autenticación porque los itinerarios están
// asociados a viajes de usuarios específicos.
router.get('/', authMiddleware, list);

// Obtener un itinerario por ID.
// También pedimos autenticación.
router.get('/:id', authMiddleware, getById);

// Crear un nuevo itinerario.
// Más adelante, el motor de reglas o el motor de IA también
// podría usar esta ruta.
router.post('/', authMiddleware, create);

// Actualizar parcialmente un itinerario existente.
router.patch('/:id', authMiddleware, update);

// Eliminar un itinerario.
router.delete('/:id', authMiddleware, remove);

// Enriquecer un itinerario existente usando el "modo IA".
// Requiere autenticación porque el itinerario pertenece a un usuario.
router.post('/:id/enrich-with-ai', authMiddleware, enrichWithAI);


// Exportamos el router para usarlo en index.js.
export default router;
