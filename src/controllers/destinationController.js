// Importamos los esquemas de validación y la función que formatea
// un destino para ser devuelto al cliente.
import {
  destinationCreateSchema,
  destinationUpdateSchema,
  toPublicDestination
} from '../models/destinationModel.js';

// Importamos las funciones del servicio que hablan con Firestore.
import {
  createDestination,
  getDestinationById,
  listDestinations,
  updateDestination,
  deleteDestination
} from '../services/destinationService.js';

// Controlador para crear un nuevo destino.
// Ruta: POST /api/destinations
export async function create(req, res, next) {
  try {
    // Validamos el cuerpo de la petición con Zod.
    const data = destinationCreateSchema.parse(req.body);

    // Creamos el destino en la base de datos.
    const created = await createDestination(data);

    // Devolvemos el destino creado formateado.
    return res.status(201).json({
      ok: true,
      destination: toPublicDestination(created)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para obtener un destino por su ID.
// Ruta: GET /api/destinations/:id
export async function getById(req, res, next) {
  try {
    // Tomamos el ID desde los parámetros de la URL.
    const { id } = req.params;

    // Buscamos el destino en la base de datos.
    const dest = await getDestinationById(id);

    // Si no lo encontramos, devolvemos 404.
    if (!dest) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Si existe, devolvemos el destino formateado.
    return res.status(200).json({
      ok: true,
      destination: toPublicDestination(dest)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para listar destinos con filtros opcionales.
// Ruta: GET /api/destinations?country=AR&tag=playa&limit=20&startAfterId=...
export async function list(req, res, next) {
  try {
    // Extraemos filtros y parámetros de paginación desde la query.
    const { country, tag, limit, startAfterId } = req.query;

    // Normalizamos el límite: máximo 100 resultados para evitar abusos.
    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 20, 100)
      : 20;

    // Llamamos al servicio pasando los filtros.
    const items = await listDestinations({
      country,
      tag,
      limit: parsedLimit,
      startAfterId
    });

    // Devolvemos la lista y cuántos elementos tiene.
    return res.status(200).json({
      ok: true,
      count: items.length,
      destinations: items.map(toPublicDestination)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para actualizar parcialmente un destino.
// Ruta: PATCH /api/destinations/:id
export async function update(req, res, next) {
  try {
    // ID del destino a actualizar.
    const { id } = req.params;

    // Validamos los campos del body con el esquema de actualización.
    const data = destinationUpdateSchema.parse(req.body);

    // Actualizamos el destino.
    const updated = await updateDestination(id, data);

    // Si no se encuentra, devolvemos 404.
    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Si todo sale bien, devolvemos el destino actualizado.
    return res.status(200).json({
      ok: true,
      destination: toPublicDestination(updated)
    });
  } catch (err) {
    next(err);
  }
}

// Controlador para eliminar un destino.
// Ruta: DELETE /api/destinations/:id
export async function remove(req, res, next) {
  try {
    // ID del destino a eliminar.
    const { id } = req.params;

    // Intentamos borrar el destino.
    const ok = await deleteDestination(id);

    // Si el servicio devuelve false, el destino no existe.
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
