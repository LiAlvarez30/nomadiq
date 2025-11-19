// 
// -------------------------
// Este archivo define las rutas "solo para administradores" de NomadIQ.
//
// Todas estas rutas:
//   - Requieren un usuario autenticado (authMiddleware).
//   - Requieren que ese usuario tenga rol "admin" (adminMiddleware).
//
// Endpoints que definimos aquí:
//
//   GET /admin/users  -> listar TODOS los usuarios (versión pública, sin passwordHash)
//   GET /admin/trips  -> listar TODOS los trips de TODOS los usuarios
//
// Nota: estas rutas NO son para el usuario final normal, sino para
//       herramientas internas, panel de admin o para que el profesor
//       pueda inspeccionar los datos rápidamente.

import { Router } from 'express';

// Middleware que verifica que el token JWT sea válido
// y que adjunta los datos del usuario en req.user.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Middleware que verifica que req.user.role === 'admin'.
// Si no es admin, responde con 403 FORBIDDEN.
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

// Controladores que implementan la lógica de cada endpoint.
import {
  listUsers,
  listTrips
} from '../controllers/adminController.js';

// Creamos una instancia de Router específica para la zona /admin.
const router = Router();

// -----------------------------------------------------------------------------
// GET /admin/users
// -----------------------------------------------------------------------------
// Devuelve la lista de TODOS los usuarios del sistema.
// Flujo de middlewares:
//   1) authMiddleware  -> verifica que el token JWT sea válido.
//   2) adminMiddleware -> verifica que el usuario tenga rol "admin".
//   3) listUsers       -> ejecuta la lógica de listar usuarios.
//
// Ejemplo de respuesta:
//   {
//     ok: true,
//     count: 3,
//     users: [ { id, email, name, role, ... }, ... ]
//   }
router.get(
  '/users',
  authMiddleware,
  adminMiddleware,
  listUsers
);

// -----------------------------------------------------------------------------
// GET /admin/trips
// -----------------------------------------------------------------------------
// Devuelve TODOS los trips del sistema, sin filtrar por usuario.
// Es útil para tareas de monitoreo, reportes o paneles de administración.
//
// Flujo de middlewares:
//   1) authMiddleware  -> verifica token.
//   2) adminMiddleware -> exige rol "admin".
//   3) listTrips       -> devuelve todos los viajes.
//
// Ejemplo de respuesta:
//   {
//     ok: true,
//     count: 5,
//     trips: [ { id, userId, title, ... }, ... ]
//   }
router.get(
  '/trips',
  authMiddleware,
  adminMiddleware,
  listTrips
);

// Exportamos el router para montarlo en index.js como:
//   app.use('/admin', adminRoutes);
export default router;
