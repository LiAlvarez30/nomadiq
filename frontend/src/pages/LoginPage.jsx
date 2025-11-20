// src/pages/LoginPage.jsx

// Importamos useState para manejar los datos del formulario y estados de la UI,
// useContext para leer el contexto de autenticación y useEffect para reaccionar
// cuando cambia el usuario logueado (por ejemplo, cuando hacemos logout desde el Navbar).
import { useState, useContext, useEffect } from 'react';

// Cliente Axios configurado para apuntar al backend de NomadIQ.
import apiClient from '../services/apiClient';

// Contexto de autenticación: desde acá obtenemos user y login.
import { AuthContext } from '../context/AuthContext.jsx';

function LoginPage() {
  // -------------------------------------------------------
  // 1) Leemos el contexto de autenticación
  // -------------------------------------------------------
  //
  // Nos interesan:
  // - user  → usuario actualmente logueado (o null)
  // - login → función para guardar user + token cuando el backend valida credenciales
  const { user, login } = useContext(AuthContext);

  // -------------------------------------------------------
  // 2) Estados locales del formulario y la interfaz
  // -------------------------------------------------------

  // Valores que el usuario escribe en el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de UX
  const [loading, setLoading] = useState(false);  // mientras hablamos con el backend
  const [error, setError] = useState(null);       // mensaje de error visible
  const [success, setSuccess] = useState(null);   // mensaje de éxito visible

  // -------------------------------------------------------
  // 3) Efecto para mantener coherente la UI con el contexto
  // -------------------------------------------------------
  //
  // Si el usuario se desloguea desde el Navbar (logout),
  // el contexto pone user = null. Cuando eso pasa, este efecto se dispara
  // y aprovechamos para limpiar el mensaje de éxito en la pantalla de login
  // para que no quede el cartel verde de "Bienvenido/a" cuando ya no hay sesión.
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, limpiamos el mensaje de éxito.
      setSuccess(null);
    }
  }, [user]);

  // -------------------------------------------------------
  // 4) Manejo del submit del formulario (LOGIN)
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
      // Enviamos las credenciales al endpoint /auth/login.
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      // Extraemos user y token de la respuesta del backend.
      const loggedUser = response.data.user;
      const token = response.data.token;

      // Mostramos un mensaje de bienvenida en esta pantalla.
      setSuccess(`Bienvenido/a, ${loggedUser.name}`);

      // Guardamos usuario y token en el contexto (y en localStorage).
      login(loggedUser, token);

      console.log('Login exitoso:', response.data);
    } catch (err) {
      // Manejo de errores con mensajes humanos.
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
      // Sea éxito o error, salimos del modo "cargando".
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // 5) Renderizado de la pantalla de login
  // -------------------------------------------------------
  return (
    <div className="max-w-md w-full mx-auto space-y-6">
      {/* Encabezado de la página (ya sin botón de logout aquí;
          el logout vive en el Navbar para no duplicar responsabilidades). */}
      <header>
        <h1 className="text-2xl font-semibold">Iniciar sesión en NomadIQ</h1>
        <p className="mt-2 text-sm text-slate-300">
          Ingresá tus credenciales para acceder a tu cuenta.
        </p>
      </header>

      {/* Tarjeta principal con el formulario */}
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

        {/* Bloque informativo sobre la sesión actual.
           Esto sigue siendo útil mientras desarrollamos para ver qué dice el contexto. */}
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
