// Importamos los esquemas de validación y la función que formatea
// un trip para ser devuelto al cliente.
import {
  tripCreateSchema,
  tripUpdateSchema,
  toPublicTrip
} from '../models/tripModel.js';

// Importamos las funciones del servicio que hablan con Firestore.
import {
  createTrip,
  getTripById,
  listTrips,
  updateTrip,
  deleteTrip
} from '../services/tripService.js';

// Importamos Zod para validar el body de este endpoint específico.
import { z } from 'zod';

// Importamos el servicio de actividades para poder obtener actividades
// relacionadas con un destino concreto.
import { listActivities } from '../services/activityService.js';

// Importamos funciones del mundo "itineraries": creación en Firestore
// y normalizador para la salida.
import { createItinerary, generateItineraryRules } from '../services/itineraryService.js';
import { toPublicItinerary } from '../models/itineraryModel.js';



// Función de ayuda para obtener el ID del usuario autenticado
// desde req.user, contemplando distintos nombres de campo
// según cómo lo defina el authMiddleware.
function getUserIdFromRequest(req) {
  return req.user?.id || req.user?.sub || req.user?.uid || null;
}

// POST /api/trips
// Crea un nuevo trip para el usuario autenticado.
export async function create(req, res, next) {
  try {
    // Obtenemos el ID del usuario desde el token (inyectado por authMiddleware).
    const userId = getUserIdFromRequest(req);

    // Si no hay usuario, devolvemos 401 (esto no debería ocurrir
    // si la ruta está protegida correctamente).
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    // Validamos el cuerpo de la petición con el esquema de creación.
    const data = tripCreateSchema.parse(req.body);

    // Creamos el trip asociándolo al usuario autenticado.
    const created = await createTrip({
      ...data,
      userId
    });

    // Devolvemos el trip creado en su versión pública.
    return res.status(201).json({
      ok: true,
      trip: toPublicTrip(created)
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/trips/:id
// Obtiene un trip por ID, siempre que pertenezca al usuario autenticado.
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    // Obtenemos el trip desde el servicio.
    const trip = await getTripById(id);

    // Si no existe o no pertenece al usuario actual, devolvemos 404.
    if (!trip || trip.userId !== userId) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    // Devolvemos el trip formateado.
    return res.status(200).json({
      ok: true,
      trip: toPublicTrip(trip)
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/trips?status=planned&limit=20&startAfterId=...
// Lista trips SOLO del usuario autenticado, con filtros opcionales.
export async function list(req, res, next) {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    // Extraemos filtros desde la query.
    // Importante: ignoramos userId en la query por seguridad.
    const { status, limit, startAfterId } = req.query;

    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 20, 100)
      : 20;

    // Obtenemos solo los trips del usuario actual.
    const items = await listTrips({
      userId,
      status,
      limit: parsedLimit,
      startAfterId
    });

    return res.status(200).json({
      ok: true,
      count: items.length,
      trips: items.map(toPublicTrip)
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/trips/:id
// Actualiza un trip si existe y pertenece al usuario autenticado.
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    // Validamos los datos que se quieren actualizar.
    const data = tripUpdateSchema.parse(req.body);

    // Primero obtenemos el trip actual para verificar que existe
    // y pertenece al usuario autenticado.
    const existing = await getTripById(id);

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    // Si el trip es del usuario, procedemos a actualizarlo.
    const updated = await updateTrip(id, data);

    return res.status(200).json({
      ok: true,
      trip: toPublicTrip(updated)
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/trips/:id
// Elimina un trip si existe y pertenece al usuario autenticado.
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    // Igual que en update: primero leemos el trip.
    const existing = await getTripById(id);

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    // Si el trip es del usuario, intentamos borrarlo.
    const ok = await deleteTrip(id);

    if (!ok) {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }

    return res.status(200).json({
      ok: true,
      deleted: id
    });
  } catch (err) {
    next(err);
  }
}

//
// POST /api/trips/:id/generate-itinerary
// --------------------------------------
// Este endpoint usa el motor de REGLAS para generar un itinerario
// basado en:
//
// - Los datos del trip (fechas, intereses, título)
// - Una lista de actividades asociadas a un destino (opcional)
// - Una lógica simple que reparte actividades en días y bloques horarios.
//
// Luego guarda el resultado en la colección "itineraries" y devuelve
// el itinerario creado.
//
export async function generateItinerary(req, res, next) {
  try {
    // Obtenemos el id del trip desde los parámetros de la URL.
    const { id: tripId } = req.params;

    // Obtenemos el id del usuario autenticado desde req.user.
    // Esto lo carga el authMiddleware cuando el token es válido.
    const userId = req.user?.id;

    // Definimos un esquema Zod para validar el cuerpo de la petición.
    // En esta primera versión solo pedimos destinationId como opcional,
    // pero más adelante podríamos agregar preferencias adicionales.
    const bodySchema = z.object({
      destinationId: z
        .string()
        .min(1, 'destinationId no puede ser vacío')
        .optional()
    });

    // Validamos el body con Zod para asegurarnos de que tiene el formato correcto.
    const body = bodySchema.parse(req.body);

    // Obtenemos el trip desde la base de datos.
    const trip = await getTripById(tripId);

    // Si el trip no existe, devolvemos 404.
    if (!trip) {
      return res.status(404).json({
        ok: false,
        error: 'TRIP_NOT_FOUND'
      });
    }

    // Verificamos que el trip pertenezca al usuario autenticado.
    // Esto es importante para evitar que un usuario genere itinerarios
    // sobre viajes de otra persona.
    if (trip.userId !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'FORBIDDEN_TRIP_OWNER'
      });
    }

    // Preparamos una lista de actividades. Si el cliente envía destinationId,
    // intentaremos buscar actividades de ese destino para enriquecer el itinerario.
    let activities = [];

    if (body.destinationId) {
      activities = await listActivities({
        destinationId: body.destinationId,
        limit: 100
      });
    }

    // Usamos el motor de REGLAS para generar la estructura "data" del itinerario
    // en memoria, sin guardar aún en Firestore.
    const data = generateItineraryRules({
      trip,
      activities
    });

    // Creamos el itinerario en Firestore, utilizando createItinerary del service.
    // Indicamos que el modelo usado es "rules" (modo offline).
    const created = await createItinerary({
      tripId,
      data,
      aiModelUsed: 'rules'
    });

    // Devolvemos el itinerario en formato público (toPublicItinerary).
    return res.status(201).json({
      ok: true,
      itinerary: toPublicItinerary(created)
    });
  } catch (err) {
    // Si ocurre cualquier error (validación, Firestore, etc.),
    // lo derivamos al errorHandler central.
    next(err);
  }
}
