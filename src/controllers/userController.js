// Importamos el servicio que permite obtener un usuario por su ID.
import { getUserById } from '../services/userService.js';

// Importamos la función que convierte el usuario a su forma pública.
import { toPublicUser } from '../models/userModel.js';

// Controlador para obtener la información del usuario autenticado.
// Ruta: GET /users/me
export async function me(req, res, next) {
  try {
    // El middleware de autenticación (authMiddleware) debió inyectar
    // en req.user la información básica del usuario (id, email, etc.).
    const userId = req.user?.id;

    // Si por alguna razón no hay userId, devolvemos 401.
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'UNAUTHORIZED'
      });
    }

    // Buscamos el usuario en la base de datos.
    const user = await getUserById(userId);

    // Si no se encuentra, devolvemos 404.
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'NOT_FOUND'
      });
    }

    // Si todo está bien, devolvemos la versión pública del usuario.
    return res.status(200).json({
      ok: true,
      user: toPublicUser(user)
    });
  } catch (err) {
    // Delegamos cualquier error al middleware global.
    next(err);
  }
}
