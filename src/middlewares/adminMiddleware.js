// -----------------------------------------------------------------------------
// adminMiddleware.js
// -----------------------------------------------------------------------------
// Este middleware se encarga de verificar que el usuario autenticado tenga
// rol "admin". Se utiliza para proteger rutas específicas destinadas a tareas
// administrativas (por ejemplo: listar todos los usuarios, ver todos los trips,
// etc.).
//
// NOTA IMPORTANTE:
// - Este middleware se ejecuta DESPUÉS de authMiddleware.
// - authMiddleware ya verifica el JWT y coloca el usuario en req.user.
// - Por eso aquí solo revisamos el campo req.user.role.
// -----------------------------------------------------------------------------

export function adminMiddleware(req, res, next) {
  // Si por alguna razón no existe req.user, significa que NO pasó
  // por authMiddleware correctamente. Esto es un error crítico.
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: 'AUTH_REQUIRED',
      message: 'Se requiere autenticación para acceder a este recurso.'
    });
  }

  // Extraemos el rol desde req.user (agregado por authMiddleware).
  const { role } = req.user;

  // Verificamos si el rol es ADMIN.
  if (role !== 'admin') {
    return res.status(403).json({
      ok: false,
      error: 'FORBIDDEN',
      message: 'Acceso denegado. Se requiere rol administrador.'
    });
  }

  // Si llegamos hasta aquí, el usuario ES admin → permitimos continuar.
  return next();
}
