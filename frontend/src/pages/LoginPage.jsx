// src/pages/LoginPage.jsx

// Importamos useState para manejar los datos del formulario (email, password)
// y los estados de la interfaz (loading, error, success).
// Importamos useContext para poder leer el contexto de autenticación.
import { useState, useContext } from 'react';

// Importamos el cliente Axios configurado para apuntar al backend de NomadIQ.
// apiClient.post('/auth/login', ...) llama a http://localhost:3000/auth/login
import apiClient from '../services/apiClient';

// Importamos el AuthContext que creamos.
// Desde este contexto podemos acceder a:
// - user   → usuario actualmente logueado
// - token  → token JWT actual
// - login  → función para guardar user + token en el contexto
// - logout → función para limpiar la sesión (user + token + localStorage)
import { AuthContext } from '../context/AuthContext.jsx';

function LoginPage() {
  // -------------------------------------------------------
  // 1) Accedemos al contexto de autenticación
  // -------------------------------------------------------
  //
  // useContext(AuthContext) nos devuelve { user, token, login, logout }.
  // En esta pantalla vamos a usar:
  // - user   → para mostrar quién está logueado
  // - login  → para guardar la sesión al loguear
  // - logout → para cerrar sesión desde un botón
  const { user, login, logout } = useContext(AuthContext);

  // -------------------------------------------------------
  // 2) Estados locales del formulario y la UI
  // -------------------------------------------------------

  // Campos del formulario de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para la experiencia de usuario
  const [loading, setLoading] = useState(false);  // Mientras se llama al backend
  const [error, setError] = useState(null);       // Mensaje de error visible
  const [success, setSuccess] = useState(null);   // Mensaje de éxito visible

  // -------------------------------------------------------
  // 3) Manejo del submit del formulario (LOGIN)
  // -------------------------------------------------------
  const handleSubmit = async (event) => {
    // Evitamos que el navegador recargue la página.
    event.preventDefault();

    // Limpiamos mensajes previos.
    setError(null);
    setSuccess(null);

    // Activamos modo "cargando".
    setLoading(true);

    try {
      // Llamada REAL al backend.
      // Si las credenciales son correctas, el backend responde con:
      // { ok: true, user: { ... }, token: "..." }
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const loggedUser = response.data.user;
      const token = response.data.token;

      // Mostramos un mensaje de bienvenida.
      setSuccess(`Bienvenido/a, ${loggedUser.name}`);

      // Guardamos el usuario y el token en el contexto de autenticación.
      // Esto también los guarda en localStorage, gracias a la lógica en AuthContext.
      login(loggedUser, token);

      console.log('Login exitoso:', response.data);
    } catch (err) {
      // -------------------------------------------
      // Manejo de errores de forma humana
      // -------------------------------------------
      if (err.response && err.response.data) {
        const apiErrorCode = err.response.data.error;

        if (apiErrorCode === 'INVALID_CREDENTIALS') {
          setError('Las credenciales no son correctas. Revisá tu email y contraseña.');
        } else if (apiErrorCode === 'VALIDATION_ERROR') {
          setError('Debes completar todos los campos correctamente.');
        } else {
          setError(`El servidor devolvió un error: ${apiErrorCode}`);
        }
      } else {
        setError('No se pudo conectar con el servidor. ¿Lo tenés encendido?');
      }

      console.error('Error al intentar hacer login:', err);
    } finally {
      // Siempre apagamos el modo "cargando".
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // 4) Manejo del logout (CERRAR SESIÓN)
  // -------------------------------------------------------
  //
  // Esta función se dispara cuando el usuario hace clic en el botón
  // "Cerrar sesión". Lo que hace es:
  // - limpiar el contexto (user + token),
  // - limpiar localStorage (gracias a AuthContext),
  // - limpiar mensajes de éxito/errores en esta pantalla.
  const handleLogout = () => {
    // Llamamos a la función logout del contexto.
    logout();

    // Limpiamos cualquier mensaje que estuviera visible.
    setError(null);
    setSuccess(null);

    // También podríamos limpiar los campos del formulario,
    // para dejar todo como "estado inicial".
    setEmail('');
    setPassword('');
  };

  // -------------------------------------------------------
  // 5) Render de la pantalla de login
  // -------------------------------------------------------
  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      {/* Encabezado de la página */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Iniciar sesión en NomadIQ</h1>
          <p className="mt-2 text-sm text-slate-300">
            Ingresá tus credenciales para acceder a tu cuenta.
          </p>
        </div>

        {/* Si hay un usuario logueado, mostramos un botón pequeño de "Cerrar sesión". */}
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs px-3 py-1 rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cerrar sesión
          </button>
        )}
      </header>

      {/* Tarjeta que contiene el formulario */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg">
        {/* Mensaje de error (bloque rojo) */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-600 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Mensaje de éxito (bloque verde) */}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-900/40 border border-emerald-600 text-emerald-200 text-sm">
            {success}
          </div>
        )}

        {/* Formulario de login */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Campo de email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-slate-200">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu-correo@ejemplo.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              required
            />
          </div>

          {/* Campo de contraseña */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm text-slate-200">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
              required
            />
          </div>

          {/* Botón principal de "Iniciar sesión" */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Conectando...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Bloque de información sobre la sesión actual.
           Esto es muy útil para "ver" qué pasa con el contexto mientras desarrollamos. */}
        <div className="mt-4 text-xs text-slate-400">
          {user ? (
            <p>
              <span className="font-semibold">Sesión actual:</span>{' '}
              estás logueado/a como{' '}
              <span className="text-emerald-300">{user.name}</span>{' '}
              (<span className="font-mono">{user.email}</span>).
            </p>
          ) : (
            <p>No hay ninguna sesión activa en el contexto.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
