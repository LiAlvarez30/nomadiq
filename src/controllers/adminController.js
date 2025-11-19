// src/controllers/adminController.js
// ----------------------------------
// Controladores para rutas de administración (/admin)
// Solo accesibles para usuarios con rol "admin".
// Aquí exponemos endpoints para que el profesor (o un admin)
// pueda ver el estado general del sistema: usuarios, trips, etc.

import { db } from '../config/firebase.js';
import { toPublicUser } from '../models/userModel.js';
// Importamos el servicio de trips para reutilizar su lógica
// en lugar de leer "trips" directo desde Firestore.
import { listTrips as listTripsService } from '../services/tripService.js';


// ----------------------------------------------------------
// GET /admin/users
// ----------------------------------------------------------
// Devuelve la lista de TODOS los usuarios del sistema.
// Solo accesible para rol "admin".
// ----------------------------------------------------------
export async function listUsers(req, res, next) {
  try {
    // Leemos toda la colección "users" directamente desde Firestore.
    const snap = await db.collection('users').get();

    // Convertimos cada documento a su versión pública
    // (sin passwordHash ni datos sensibles).
    const users = snap.docs.map((doc) =>
      toPublicUser({ id: doc.id, ...doc.data() })
    );

    return res.json({
      ok: true,
      count: users.length,
      users
    });
  } catch (err) {
    // Delegamos el error al middleware global.
    next(err);
  }
}

// ----------------------------------------------------------
// GET /admin/trips
// ----------------------------------------------------------
// Devuelve TODOS los trips del sistema usando la capa de servicios.
// Esto es útil para tareas de monitoreo o reportes del profesor.
// Solo accesible para rol "admin".
// ----------------------------------------------------------
export async function listTripsAdmin(req, res, next) {
  try {
    // Usamos el servicio listTrips SIN filtrar por userId
    // para obtener todos los viajes del sistema.
    const trips = await listTripsService({
      userId: undefined,
      status: undefined,
      limit: 200
    });

    return res.json({
      ok: true,
      count: trips.length,
      trips
    });
  } catch (err) {
    next(err);
  }
}
