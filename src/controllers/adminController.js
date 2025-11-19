// ----------------------------------
// Controlador para las funciones de administración.
// Requiere que el usuario tenga rol "admin".
// Aquí implementamos endpoints internos para:
//
//   - Listar todos los usuarios (GET /admin/users)
//   - Listar todos los trips de todos los usuarios (GET /admin/trips)
//
// Importante: estos endpoints NO deben quedar expuestos sin protección.
//             Siempre usan authMiddleware + adminMiddleware.
//


import { db } from '../config/firebase.js'; // acceso directo a Firestore
import { toPublicUser } from '../models/userModel.js';

// ----------------------------------------------------------
// GET /admin/users
// ----------------------------------------------------------
// Devuelve la lista de TODOS los usuarios del sistema.
// Solo accesible para rol "admin".
// ----------------------------------------------------------
export async function listUsers(req, res, next) {
  try {
    // Leemos toda la colección "users".
    const snap = await db.collection('users').get();

    // Convertimos cada documento a su versión pública.
    const users = snap.docs.map((doc) =>
      toPublicUser({ id: doc.id, ...doc.data() })
    );

    return res.json({
      ok: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err); // delega al errorHandler
  }
}

// ----------------------------------------------------------
// GET /admin/trips
// ----------------------------------------------------------
// Devuelve TODOS los trips del sistema.
// Esto es útil para tareas de monitoreo o reportes del profesor.
// También solo accesible para rol "admin".
// ----------------------------------------------------------
export async function listTrips(req, res, next) {
  try {
    const snap = await db.collection('trips').get();

    const trips = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json({
      ok: true,
      count: trips.length,
      trips
    });
  } catch (err) {
    next(err);
  }
}
