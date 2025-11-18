// Importamos los esquemas de validación de usuario y la función que
// transforma un usuario a su versión "pública" (sin datos sensibles).
import {
  userRegisterSchema,
  userLoginSchema,
  toPublicUser
} from '../models/userModel.js';

// Importamos los servicios que encapsulan la lógica de creación de usuario
// y validación de credenciales.
import {
  createUser,
  validateCredentials
} from '../services/userService.js';

// Importamos la función para firmar (crear) tokens JWT.
import { signToken } from '../utils/jwt.js';

// Controlador para registrar un nuevo usuario.
// Ruta: POST /auth/register
export async function register(req, res, next) {
  try {
    // Validamos el cuerpo de la petición con Zod.
    // Si falta un campo o tiene un formato incorrecto, lanzará ZodError.
    const data = userRegisterSchema.parse(req.body);

    // Creamos el usuario en la base de datos a través del servicio.
    const newUser = await createUser(data);

    // Generamos un token JWT con la info básica del usuario.
    // - sub: identificador principal del usuario en el token.
    // - email, role: útiles para el frontend.
    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    // Devolvemos al cliente la versión pública del usuario
    // (sin password ni campos sensibles) junto con el token.
    return res.status(201).json({
      ok: true,
      user: toPublicUser(newUser),
      token
    });
  } catch (err) {
    // Cualquier error (validación, email en uso, etc.) se deriva
    // al middleware de errores.
    next(err);
  }
}

// Controlador para iniciar sesión.
// Ruta: POST /auth/login
export async function login(req, res, next) {
  try {
    // Validamos el cuerpo de la petición con el esquema de login.
    const data = userLoginSchema.parse(req.body);

    // Verificamos las credenciales usando el servicio.
    // Si el email o la contraseña no coinciden, devuelve null.
    const user = await validateCredentials(data.email, data.password);

    // Si no se encuentra un usuario válido, devolvemos 401 (no autorizado).
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generamos un token JWT para el usuario autenticado.
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    // Devolvemos la versión pública del usuario junto con el token.
    return res.status(200).json({
      ok: true,
      user: toPublicUser(user),
      token
    });
  } catch (err) {
    // Derivamos errores de validación o internos al errorHandler.
    next(err);
  }
}
