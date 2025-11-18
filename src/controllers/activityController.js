// Importamos los esquemas de validación y la función que formatea
// una actividad para ser devuelta al cliente.
import {
  activityCreateSchema,
  activityUpdateSchema,
  toPublicActivity
} from '../models/activityModel.js';

// Importamos las funciones del servicio que hablan con Firestore.
import {
  createActivity,
  getActivityById,
  listActivities,
  updateActivity,
  deleteActivity
} from '../services/activityService.js';

// Controlador para crear una nueva actividad.
// Ruta: POST /api/activities
export async function create(req, res, next) {
  try {
    // Validamos los datos del body con Zod.
    const data = activityCreateSchema.parse(req.body);

    // Creamos la actividad en la base de datos.
    const created = await createActivity(data);

    // Devolvemos la actividad creada.
    return res.status(201).json({
      ok: true,
      activity: toPublicActivity(created)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para obtener una actividad por ID.
// Ruta: GET /api/activities/:id
export async function getById(req, res, next) {
  try {
    // ID de la actividad desde la URL.
    const { id } = req.params;

    // Buscamos la actividad.
    const a = await getActivityById(id);

    // Si no existe, devolvemos 404.
    if (!a) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Devolvemos la actividad encontrada.
    return res.status(200).json({
      ok: true,
      activity: toPublicActivity(a)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para listar actividades con filtros opcionales.
// Ruta: GET /api/activities?destinationId=...&category=...&limit=20&startAfterId=...
export async function list(req, res, next) {
  try {
    // Extraemos filtros y opciones de paginación desde la query.
    const { destinationId, category, limit, startAfterId } = req.query;

    // Normalizamos el límite (máximo 100 resultados).
    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 20, 100)
      : 20;

    // Obtenemos la lista de actividades desde el servicio.
    const items = await listActivities({
      destinationId,
      category,
      limit: parsedLimit,
      startAfterId
    });

    // Devolvemos la lista y la cantidad de resultados.
    return res.status(200).json({
      ok: true,
      count: items.length,
      activities: items.map(toPublicActivity)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para actualizar parcialmente una actividad.
// Ruta: PATCH /api/activities/:id
export async function update(req, res, next) {
  try {
    // ID de la actividad a actualizar.
    const { id } = req.params;

    // Validamos los datos del body con el esquema de actualización.
    const data = activityUpdateSchema.parse(req.body);

    // Actualizamos la actividad.
    const updated = await updateActivity(id, data);

    // Si no se encuentra, devolvemos 404.
    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Devolvemos la actividad actualizada.
    return res.status(200).json({
      ok: true,
      activity: toPublicActivity(updated)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para eliminar una actividad.
// Ruta: DELETE /api/activities/:id
export async function remove(req, res, next) {
  try {
    // ID de la actividad a eliminar.
    const { id } = req.params;

    // Intentamos borrar la actividad.
    const ok = await deleteActivity(id);

    // Si no existe, devolvemos 404.
    if (!ok) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Confirmamos la eliminación.
    return res.status(200).json({
      ok: true,
      deleted: id
    });
  } catch (err) {
    next(err);
  }
}
