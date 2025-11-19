// Importamos Zod para validar el body de la petición de enriquecimiento.
import { z } from 'zod';

// Importamos el servicio de IA local para itinerarios.
import { enrichItineraryWithAI } from '../services/itineraryAiService.js';

// Importamos getTripById para poder recuperar información del viaje
// asociado al itinerario (título, intereses, etc.) y, AHORA TAMBIÉN,
// para verificar que el itinerario pertenece al usuario autenticado.
import { getTripById } from '../services/tripService.js';

// Importamos los esquemas de validación y el normalizador de salida.
import {
  itineraryCreateSchema,
  itineraryUpdateSchema,
  toPublicItinerary
} from '../models/itineraryModel.js';

// Importamos las funciones del servicio que hablan con Firestore.
import {
  createItinerary,
  getItineraryById,
  listItineraries,
  updateItinerary,
  deleteItinerary
} from '../services/itineraryService.js';

//
// -----------------------------------------------------------------------------
// PEQUEÑAS FUNCIONES DE AYUDA PARA SEGURIDAD / OWNERSHIP
// -----------------------------------------------------------------------------

// Esta función nos devuelve de forma segura el userId y el role
// del usuario autenticado (inyectado por authMiddleware).
function getAuthInfo(req) {
  return {
    userId: req.user?.id || null,
    role: req.user?.role || 'user'
  };
}

// Esta función verifica que el trip exista y que pertenezca al usuario
// autenticado, salvo que el usuario tenga rol "admin".
// Devuelve un objeto con { ok, status, errorCode, trip } para que el
// controlador pueda decidir qué respuesta enviar.
async function checkTripOwnership({ tripId, req }) {
  const { userId, role } = getAuthInfo(req);

  // Si por alguna razón no hay usuario autenticado, devolvemos 401.
  if (!userId) {
    return {
      ok: false,
      status: 401,
      errorCode: 'UNAUTHORIZED',
      trip: null
    };
  }

  // Buscamos el trip en la base de datos.
  const trip = await getTripById(tripId);

  // Si el trip no existe, devolvemos 404.
  if (!trip) {
    return {
      ok: false,
      status: 404,
      errorCode: 'TRIP_NOT_FOUND',
      trip: null
    };
  }

  // Si el usuario ES admin, permitimos acceso aunque no sea el dueño.
  if (role === 'admin') {
    return {
      ok: true,
      status: 200,
      errorCode: null,
      trip
    };
  }

  // Si NO es admin, verificamos que el trip sea del usuario actual.
  if (trip.userId !== userId) {
    return {
      ok: false,
      status: 403,
      errorCode: 'FORBIDDEN_TRIP_OWNER',
      trip: null
    };
  }

  // Todo OK: el trip pertenece al usuario autenticado.
  return {
    ok: true,
    status: 200,
    errorCode: null,
    trip
  };
}

//
// -----------------------------------------------------------------------------
// POST /api/itineraries
// ---------------------
// Crea un nuevo itinerario. En esta primera versión asumimos que el
// motor de reglas o el front nos envían la estructura de "data" ya armada.
// Más adelante, para el motor de reglas, esta ruta podría ser usada
// internamente por un endpoint como /api/trips/:tripId/generate-itinerary.
//
export async function create(req, res, next) {
  try {
    // Validamos el cuerpo del request usando Zod.
    // Esto garantiza que tripId, data, etc. tengan la forma correcta.
    const data = itineraryCreateSchema.parse(req.body);

    // Antes de crear el itinerario, verificamos que el trip exista
    // y que pertenezca al usuario autenticado (o que sea admin).
    const ownership = await checkTripOwnership({
      tripId: data.tripId,
      req
    });

    if (!ownership.ok) {
      return res.status(ownership.status).json({
        ok: false,
        error: ownership.errorCode
      });
    }

    // Llamamos al servicio para crear el itinerario en Firestore.
    const created = await createItinerary(data);

    // Devolvemos el itinerario en formato "público" (toPublicItinerary).
    return res.status(201).json({
      ok: true,
      itinerary: toPublicItinerary(created)
    });
  } catch (err) {
    // Cualquier error (validación, Firestore, etc.) se envía
    // al middleware centralizado de manejo de errores.
    next(err);
  }
}

//
// GET /api/itineraries/:id
// ------------------------
// Recupera un itinerario por su ID, siempre que el trip asociado
// pertenezca al usuario autenticado (o el usuario sea admin).
//
export async function getById(req, res, next) {
  try {
    const { id } = req.params;

    // Buscamos el itinerario por ID.
    const it = await getItineraryById(id);

    // Si no existe, devolvemos 404.
    if (!it) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Verificamos que el trip asociado al itinerario pertenezca al usuario.
    const ownership = await checkTripOwnership({
      tripId: it.tripId,
      req
    });

    if (!ownership.ok) {
      return res.status(ownership.status).json({
        ok: false,
        error: ownership.errorCode
      });
    }

    // Si existe y pertenece al usuario (o es admin), devolvemos el itinerario.
    return res.status(200).json({
      ok: true,
      itinerary: toPublicItinerary(it)
    });
  } catch (err) {
    next(err);
  }
}

//
// GET /api/itineraries?tripId=...&limit=20&startAfterId=...
// ---------------------------------------------------------
// Lista itinerarios. Normalmente se usará filtrando por tripId
// para ver todos los itinerarios asociados a un viaje.
//
// Por seguridad, en esta versión requerimos tripId para usuarios
// normales. Más adelante, un rol admin podría listar sin tripId.
//
export async function list(req, res, next) {
  try {
    const { tripId, limit, startAfterId } = req.query;

    const { role } = getAuthInfo(req);

    // Para usuarios no admin, exigimos tripId para poder verificar ownership.
    if (!tripId && role !== 'admin') {
      return res.status(400).json({
        ok: false,
        error: 'TRIP_ID_REQUIRED'
      });
    }

    // Si viene tripId, verificamos que el trip pertenezca al usuario
    // (o que sea admin). Esto asegura que no se puedan listar itinerarios
    // de viajes ajenos.
    if (tripId) {
      const ownership = await checkTripOwnership({
        tripId,
        req
      });

      if (!ownership.ok) {
        return res.status(ownership.status).json({
          ok: false,
          error: ownership.errorCode
        });
      }
    }

    // Parseamos el límite y lo acotamos a un máximo razonable.
    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 20, 100)
      : 20;

    // Llamamos al servicio para obtener la lista.
    const items = await listItineraries({
      tripId,
      limit: parsedLimit,
      startAfterId
    });

    // Devolvemos la lista en formato público.
    return res.status(200).json({
      ok: true,
      count: items.length,
      itineraries: items.map(toPublicItinerary)
    });
  } catch (err) {
    next(err);
  }
}

//
// PATCH /api/itineraries/:id
// --------------------------
// Actualiza parcialmente un itinerario. Puede usarse, por ejemplo,
// para actualizar el "score", ajustar algunas actividades o cambiar
// el modelo de IA utilizado.
//
// Solo permitimos la actualización si el itinerario pertenece a un
// trip del usuario autenticado (o si el usuario es admin).
//
export async function update(req, res, next) {
  try {
    const { id } = req.params;

    // Buscamos el itinerario actual para verificar que existe
    // y que su trip asociado pertenece al usuario.
    const existing = await getItineraryById(id);

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Verificamos ownership del trip asociado.
    const ownership = await checkTripOwnership({
      tripId: existing.tripId,
      req
    });

    if (!ownership.ok) {
      return res.status(ownership.status).json({
        ok: false,
        error: ownership.errorCode
      });
    }

    // Validamos el body con el esquema de actualización parcial.
    const data = itineraryUpdateSchema.parse(req.body);

    // Llamamos al servicio para aplicar el patch.
    const updated = await updateItinerary(id, data);

    // Si por algún motivo no se encontró al actualizar, devolvemos 404.
    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Si todo salió bien, devolvemos la versión actualizada.
    return res.status(200).json({
      ok: true,
      itinerary: toPublicItinerary(updated)
    });
  } catch (err) {
    next(err);
  }
}

//
// DELETE /api/itineraries/:id
// ---------------------------
// Elimina un itinerario por ID. Solo si el trip asociado pertenece
// al usuario autenticado (o el usuario es admin).
//
export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Obtenemos el itinerario para poder verificar propiedad.
    const it = await getItineraryById(id);

    if (!it) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Verificamos ownership del trip asociado.
    const ownership = await checkTripOwnership({
      tripId: it.tripId,
      req
    });

    if (!ownership.ok) {
      return res.status(ownership.status).json({
        ok: false,
        error: ownership.errorCode
      });
    }

    // Intentamos eliminar el itinerario.
    const ok = await deleteItinerary(id);

    // Si no existía (caso raro: entre la lectura y el delete), devolvemos 404.
    if (!ok) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Si se eliminó correctamente, devolvemos un 200 con el ID borrado.
    return res.status(200).json({
      ok: true,
      deleted: id
    });
  } catch (err) {
    next(err);
  }
}

//
// POST /api/itineraries/:id/enrich-with-ai
// ----------------------------------------
// Este endpoint toma un itinerario existente (generado por REGLAS),
// lo combina con la información del trip y del usuario autenticado,
// y utiliza el "servicio de IA" para enriquecer las descripciones.
//
// En esta primera versión, la "IA" es local (no se llama a ningún modelo externo),
// pero la arquitectura ya está lista para conectar un modelo real más adelante.
//
// Ahora, además, verificamos que el trip asociado al itinerario
// pertenezca al usuario autenticado (o sea admin) antes de enriquecer.
//
export async function enrichWithAI(req, res, next) {
  try {
    // Obtenemos el ID del itinerario desde los parámetros de la URL.
    const { id } = req.params;

    // Obtenemos la info básica del usuario autenticado desde req.user.
    // Esto lo carga el authMiddleware cuando el token JWT es válido.
    const user = req.user || null;

    // Definimos un esquema Zod para el cuerpo de la petición.
    const bodySchema = z.object({
      tone: z
        .enum(['neutral', 'relajado', 'aventurero'])
        .optional(),
      locale: z
        .string()
        .min(2)
        .max(10)
        .optional(),
      modelHint: z
        .string()
        .min(1)
        .optional()
    });

    // Validamos el body con Zod.
    const body = bodySchema.parse(req.body || {});

    // Recuperamos el itinerario desde la base de datos usando el service.
    const itinerary = await getItineraryById(id);

    // Si no existe, devolvemos 404.
    if (!itinerary) {
      return res.status(404).json({
        ok: false,
        error: 'ITINERARY_NOT_FOUND'
      });
    }

    // Recuperamos el trip asociado al itinerario para tener más contexto
    // Y, MUY IMPORTANTE, para verificar que pertenece al usuario actual.
    const ownership = await checkTripOwnership({
      tripId: itinerary.tripId,
      req
    });

    if (!ownership.ok) {
      return res.status(ownership.status).json({
        ok: false,
        error: ownership.errorCode
      });
    }

    const trip = ownership.trip;

    // Llamamos al servicio de "IA" para construir una nueva versión
    // enriquecida del itinerario.
    const enriched = await enrichItineraryWithAI({
      itinerary,
      trip,
      user,
      options: body
    });

    // Ahora actualizamos el documento de itinerario en Firestore
    // usando el service updateItinerary.
    const updated = await updateItinerary(id, {
      data: enriched.data,
      aiModelUsed: enriched.aiModelUsed,
      score: enriched.score
    });

    // Devolvemos el itinerario actualizado en formato público.
    return res.status(200).json({
      ok: true,
      itinerary: toPublicItinerary(updated)
    });
  } catch (err) {
    // Cualquier error se delega al middleware de manejo centralizado.
    next(err);
  }
}
