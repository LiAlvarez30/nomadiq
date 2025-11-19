// src/middlewares/rateLimitMiddleware.js
// --------------------------------------
// Este archivo define middlewares de "rate limiting" para NomadIQ.
//
// ¿Qué es el rate limiting?
// Es una forma de limitar cuántas veces un mismo cliente (IP) puede
// hacer ciertas peticiones en un período de tiempo.
//
// ¿Por qué es importante?
// - Protege los endpoints sensibles (como /auth/login) de ataques
//   de fuerza bruta (intentos masivos de contraseñas).
// - Evita abuso accidental (por ejemplo, un cliente que repite
//   muchas veces la misma request por error).
//
// Aquí usamos la librería "express-rate-limit" para crear un middleware
// específico para la zona de autenticación (/auth).

import rateLimit from 'express-rate-limit';

// -----------------------------------------------------------------------------
// Limiter específico para rutas de autenticación (/auth)
// -----------------------------------------------------------------------------
// Este limiter se aplicará a:
//   - /auth/register
//   - /auth/login
//
// Configuración elegida (puede ajustarse según necesidades):
//   - windowMs: 15 minutos -> 15 * 60 * 1000 milisegundos.
//   - max: 20 -> máximo 20 requests por IP en esa ventana de tiempo.
//   - message: respuesta estándar cuando se excede el límite.
//
// Esto significa que, si un cliente intenta hacer más de 20 requests
// a /auth en 15 minutos, comenzará a recibir errores 429 (Too Many Requests).
//
export const authLimiter = rateLimit({
  // Ventana de tiempo de 15 minutos.
  windowMs: 15 * 60 * 1000,

  // Máximo de 20 requests por IP dentro de la ventana.
  max: 20,

  // Código de estado que se devolverá cuando se exceda el límite.
  standardHeaders: true, // Incluye información de rate limit en headers estándar.
  legacyHeaders: false,  // Desactiva headers antiguos (X-RateLimit-*).

  // Mensaje que enviamos al cliente cuando supera el límite.
  // Nota: se envía solo cuando el límite se ha excedido.
  message: {
    ok: false,
    error: 'RATE_LIMIT_EXCEEDED',
    details: 'Demasiadas solicitudes a /auth desde esta IP. Intenta de nuevo más tarde.'
  }
});

// -----------------------------------------------------------------------------
// (Opcional) Limiter general para toda la API
// -----------------------------------------------------------------------------
// Si en el futuro quieres proteger toda la API con un límite global,
// puedes definir otro limiter aquí y aplicarlo en index.js.
//
// Por ahora, solo exportamos authLimiter para mantener el enfoque
// en la protección de /auth.
//
// Ejemplo de cómo se vería otro limiter:
//
// export const apiLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minuto
//   max: 100,            // 100 requests por IP por minuto
//   message: {
//     ok: false,
//     error: 'API_RATE_LIMIT_EXCEEDED',
//     details: 'Demasiadas solicitudes a la API. Intenta de nuevo más tarde.'
//   }
// });
