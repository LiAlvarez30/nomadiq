// Este middleware centralizado se encarga de manejar TODOS los errores
// que ocurran en la aplicación y que se pasen con next(err).
// Gracias a esto, evitamos tener try/catch repetidos en cada controlador
// y mantenemos las respuestas de error consistentes.
export function errorHandler(err, _req, res, _next) {
  // Caso especial: cuando el error indica que el email ya está en uso.
  // Esto suele generarse en la lógica de registro de usuarios.
  if (err.message === 'EMAIL_IN_USE') {
    return res.status(409).json({
      ok: false,
      error: 'EMAIL_IN_USE'
    });
  }

  // Caso especial: errores de validación de Zod.
  // Estos ocurren cuando los datos recibidos no cumplen el esquema.
  if (err.name === 'ZodError') {
    return res.status(400).json({
      ok: false,
      error: 'VALIDATION_ERROR',
      // err.errors contiene un array con información detallada
      // sobre qué campo falló, qué valor tenía, etc.
      details: err.errors
    });
  }

  // Para cualquier otro tipo de error que no hayamos contemplado
  // específicamente, lo logueamos en la consola para poder
  // investigarlo durante el desarrollo.
  console.error('[ErrorHandler]', err);

  // Enviamos una respuesta genérica de error interno del servidor.
  // No revelamos detalles concretos al cliente por seguridad.
  return res.status(500).json({
    ok: false,
    error: 'INTERNAL_ERROR'
  });
}
