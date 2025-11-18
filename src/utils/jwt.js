// Importamos jsonwebtoken, la librería que nos permite crear y verificar
// tokens JWT (JSON Web Tokens). Estos tokens se usan para manejar
// autenticación sin necesidad de sesiones.
import jwt from 'jsonwebtoken';

// Leemos la clave secreta desde variables de entorno.
// Esa clave NO debe compartirse nunca ni subir a GitHub.
const JWT_SECRET = process.env.JWT_SECRET;

// Tiempo de expiración del token. Si no está definido en .env,
// por defecto expira en 1 día.
const TOKEN_EXPIRES = process.env.TOKEN_EXPIRES || '1d';

// ---------------------------------------------------------------------------
// signToken(payload)
// ---------------------------------------------------------------------------
// Esta función crea (firma) un JWT usando la clave secreta.
// El "payload" puede incluir: userId, email, role, etc.
// ---------------------------------------------------------------------------
export function signToken(payload) {
  // Validamos que exista la clave secreta.
  if (!JWT_SECRET) {
    throw new Error(
      'Falta JWT_SECRET en .env — no se puede firmar el token.'
    );
  }

  // Firmamos el token y le damos un tiempo de expiración.
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES
  });
}

// ---------------------------------------------------------------------------
// verifyToken(token)
// ---------------------------------------------------------------------------
// Esta función verifica si un token JWT es válido y no ha expirado.
// Si es válido, devuelve el payload original (sub, email, role, etc.)
// ---------------------------------------------------------------------------
export function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new Error(
      'Falta JWT_SECRET en .env — no se puede verificar el token.'
    );
  }

  try {
    // Si la verificación es correcta, devolvemos el contenido del token.
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Si falla, devolvemos un error más claro.
    throw new Error('INVALID_TOKEN');
  }
}
