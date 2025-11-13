export function errorHandler(err, _req, res, _next) {
  // Mapea algunos errores conocidos
  if (err.message === 'EMAIL_IN_USE') {
    return res.status(409).json({ ok: false, error: 'EMAIL_IN_USE' });
  }
  if (err.name === 'ZodError') {
    return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR', details: err.errors });
  }

  console.error('[ErrorHandler]', err);
  return res.status(500).json({ ok: false, error: 'INTERNAL_ERROR' });
}
