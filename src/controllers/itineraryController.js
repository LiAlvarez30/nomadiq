// Importamos Zod para validar el body de la petición de enriquecimiento.
import { z } from 'zod';

// Importamos el servicio de IA local para itinerarios.
import { enrichItineraryWithAI } from '../services/itineraryAiService.js';

// Importamos getTripById para poder recuperar información del viaje
// asociado al itinerario (título, intereses, etc.).
import { getTripById } from '../services/tripService.js';

// Controlador de Itinerarios
// --------------------------
// Este archivo define las funciones que responden a las rutas HTTP
// relacionadas con la entidad "itineraries". Aquí no se habla con Firestore
// directamente, sino a través del servicio (itineraryService) y se usan
// los modelos (itineraryModel) para validar y formatear los datos.

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
// Recupera un itinerario por su ID.
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

    // Si existe, devolvemos el itinerario formateado.
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
export async function list(req, res, next) {
  try {
    const { tripId, limit, startAfterId } = req.query;

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
export async function update(req, res, next) {
  try {
    const { id } = req.params;

    // Validamos el body con el esquema de actualización parcial.
    const data = itineraryUpdateSchema.parse(req.body);

    // Llamamos al servicio para aplicar el patch.
    const updated = await updateItinerary(id, data);

    // Si no se encontró el itinerario, devolvemos 404.
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
// Elimina un itinerario por ID. Se puede usar para borrar versiones
// anteriores o itinerarios descartados.
//
export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Intentamos eliminar el itinerario.
    const ok = await deleteItinerary(id);

    // Si no existía, devolvemos 404.
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
export async function enrichWithAI(req, res, next) {
  try {
    // Obtenemos el ID del itinerario desde los parámetros de la URL.
    const { id } = req.params;

    // Obtenemos la info básica del usuario autenticado desde req.user.
    // Esto lo carga el authMiddleware cuando el token JWT es válido.
    const user = req.user || null;

    // Definimos un esquema Zod para el cuerpo de la petición.
    // Aquí se pueden añadir más opciones si las necesitás:
    //  - tone: "relajado", "aventurero", etc.
    //  - locale: "es-AR", "es-ES", etc.
    //  - modelHint: sugerencia de modelo (por ahora solo a nivel de string).
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

    // Validamos el body con Zod. Si algo no cumple, lanza un ZodError
    // que será capturado por el errorHandler global.
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

    // Recuperamos el trip asociado al itinerario para tener más contexto.
    const trip = await getTripById(itinerary.tripId);

    // Si no encontramos el trip, también devolvemos 404,
    // porque sin el viaje no podemos personalizar bien el contenido.
    if (!trip) {
      return res.status(404).json({
        ok: false,
        error: 'TRIP_NOT_FOUND_FOR_ITINERARY'
      });
    }

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
