// src/components/Navbar.jsx

// Este componente es la barra de navegación principal de NomadIQ.
// Acá resolvemos dos cosas importantes:
// - Navegación entre pantallas usando React Router.
// - Mostrar opciones distintas según haya o no sesión activa.
//
// El Navbar NO hace llamadas al backend directamente:
// solo reacciona al estado de autenticación (AuthContext)
// y usa enlaces internos (<Link>) para moverte entre rutas.

import { useContext } from 'react';
import { Link } from 'react-router-dom';

// Importamos el contexto de autenticación para saber:
// - si hay un usuario logueado (user)
// - y poder cerrar sesión (logout)
import { AuthContext } from '../context/AuthContext.jsx';

function Navbar() {
  // Leemos el contexto de autenticación.
  // user  → nos sirve para mostrar "Hola, {nombre}"
  // logout → para cerrar sesión desde el Navbar
  const { user, logout } = useContext(AuthContext);

  // Función que se ejecuta cuando el usuario hace clic en "Cerrar sesión".
  const handleLogout = () => {
    // Esta llamada limpia:
    // - user y token en memoria,
    // - y también localStorage (según la lógica del AuthContext).
    logout();
    console.log('Sesión cerrada desde el Navbar.');
  };

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Sección izquierda: logo + nombre de la app */}
        <div className="flex items-center gap-2">
          {/* Logo redondo simple con las iniciales de NomadIQ */}
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 text-sm font-bold">
            NQ
          </div>

          {/* Nombre y subtítulo de la app */}
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-50">
              NomadIQ
            </span>
            <span className="text-xs text-slate-400">
              Itinerarios inteligentes para tus viajes
            </span>
          </div>
        </div>

        {/* Sección derecha: navegación + estado de sesión */}
        <nav className="flex items-center gap-4 text-xs text-slate-300">
          {/* Enlace a la página de inicio */}
          <Link
            to="/"
            className="hover:text-emerald-400 transition-colors"
          >
            Inicio
          </Link>

          {/* Enlace real al explorador de destinos. La ruta /destinations es pública y mostrará el listado de lugares. */}
          <Link
            to="/destinations"
            className="hover:text-emerald-400 transition-colors"
          >
            Explorar destinos
          </Link>

          {/* "Mis viajes" es un enlace real a la ruta protegida /trips.
             Si no hay sesión, PrivateRoute redirige a /login.
             Si hay sesión, se muestra la página de viajes. */}
          <Link
            to="/trips"
            className="hover:text-emerald-400 transition-colors"
          >
            Mis viajes
          </Link>

          {/* Link a Perfil:
             - Solo tiene sentido si hay usuario logueado.
             - Lo mostramos junto al resto de links de navegación. */}
          {user && (
            <Link
              to="/profile"
              className="hover:text-emerald-400 transition-colors"
            >
              Perfil
            </Link>
          )}

          {/* Bloque de sesión: depende de si hay user o no */}
          {user ? (
            // Si hay usuario logueado, mostramos un saludo + botón de logout.
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                Hola,&nbsp;
                <span className="text-emerald-300 font-medium">
                  {user.name}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-600 px-3 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            // Si NO hay usuario, mostramos el botón de "Iniciar sesión"
            // que lleva a la ruta /login.
            <Link
              to="/login"
              className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
