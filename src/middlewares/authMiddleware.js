// Importamos la función que se encarga de verificar y decodificar
// el token JWT. Si el token es inválido o está vencido, lanzará un error.
import { verifyToken } from '../utils/jwt.js';

// Importamos el servicio que nos permite buscar un usuario por su ID.
// Esto sirve para verificar que el usuario del token todavía exista.
import { getUserById } from '../services/userService.js';

// Este middleware protege rutas que requieren autenticación.
// Se encarga de:
// 1. Leer el header Authorization.
// 2. Extraer el token JWT.
// 3. Verificar el token y obtener su payload.
// 4. Buscar el usuario en la base de datos.
// 5. Adjuntar la info del usuario a req.user si todo está bien.
// 6. Si algo falla, responder con 401 (no autorizado).
export async function authMiddleware(req, res, next) {
  try {
    // Obtenemos el header Authorization de la petición.
    // Si no existe, usamos un string vacío para evitar errores.
    const header = req.headers.authorization || '';

    // Normalmente esperamos un formato "Bearer <token>".
    // split(' ') separa en dos partes: ["Bearer", "<token>"].
    const parts = header.split(' ');
    const token = parts.length === 2 ? parts[1] : null;

    // Si no hay token, respondemos inmediatamente con 401.
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'TOKEN_REQUIRED'
      });
    }

    // Verificamos el token usando la función de utilidades.
    // Si el token es inválido, verifyToken lanzará un error
    // que será capturado por el catch más abajo.
    const payload = verifyToken(token);

    // Usualmente, el ID del usuario se guarda en el campo "sub" (subject)
    // dentro del payload del JWT.
    const userId = payload.sub;

    // Buscamos al usuario en la base de datos usando el ID del token.
    const user = await getUserById(userId);

    // Si no encontramos el usuario, es posible que haya sido eliminado
    // o que el token no sea válido para un usuario real.
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'INVALID_USER'
      });
    }

    // Si todo está en orden, guardamos en req.user la información
    // relevante del usuario. Esto estará disponible en cualquier
    // controlador que se ejecute después de este middleware.
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    // Llamamos a next() para que Express continúe con la siguiente
    // función de la cadena (por ejemplo, el controlador de la ruta).
    next();
  } catch (err) {
    // Si algo falla (token inválido, expirado, etc.), devolvemos 401.
    // No exponemos detalles internos del error para no dar información
    // sensible a posibles atacantes.
    return res.status(401).json({
      ok: false,
      error: 'INVALID_TOKEN'
    });
  }
}
