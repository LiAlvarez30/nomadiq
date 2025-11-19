// src/pages/LoginPage.jsx

// Esta página será la pantalla de login de NomadIQ.
// De momento es solo un placeholder con texto y estructura básica.
// Más adelante aquí vamos a:
// - crear el formulario de email + password,
// - conectarlo con POST /auth/login,
// - manejar errores y redirecciones.
function LoginPage() {
  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión en NomadIQ</h1>

      <p className="text-sm text-slate-300">
        Esta es una vista preliminar de la pantalla de login.
        En los próximos pasos vamos a convertirla en un formulario real
        conectado al backend (<span className="font-mono">/auth/login</span>).
      </p>

      <div className="mt-4 p-4 rounded-xl border border-slate-700 bg-slate-900/60">
        <p className="text-sm text-slate-200">
          Aquí irá el formulario de autenticación.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          (Placeholder temporal para estructurar las rutas y el layout.)
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
