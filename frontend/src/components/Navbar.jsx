// src/components/Navbar.jsx

// Este componente es la barra de navegación principal de NomadIQ.
// Ahora ya no va a ser solo visual:
// - Va a navegar entre rutas usando React Router.
// - Va a leer el estado de autenticación (user) desde AuthContext
//   para mostrar "Iniciar sesión" o "Cerrar sesión" según corresponda.

import { useContext } from 'react';
import { Link } from 'react-router-dom';

// Importamos el contexto de autenticación.
// Desde acá podremos saber si hay un usuario logueado (user)
// y también llamar a logout() para cerrar la sesión.
import { AuthContext } from '../context/AuthContext.jsx';

function Navbar() {
  // ---------------------------------------------------
  // Leemos el contexto de autenticación
  // ---------------------------------------------------
  //
  // useContext(AuthContext) nos da el objeto authValue que definimos en
  // AuthContext.jsx: { user, token, login, logout }.
  //
  // En el Navbar nos interesan:
  // - user   → para mostrar el nombre del usuario si está logueado
  // - logout → para poder cerrar sesión desde el botón del Navbar
  const { user, logout } = useContext(AuthContext);

  // ---------------------------------------------------
  // Función para manejar el clic en "Cerrar sesión"
  // ---------------------------------------------------
  const handleLogout = () => {
    // Simplemente llamamos a logout() del contexto.
    // Eso limpia:
    // - user y token en memoria,
    // - y también localStorage (gracias a la lógica en AuthContext).
    logout();

    // Podríamos agregar aquí un console.log para debug si queremos.
    console.log('Sesión cerrada desde el Navbar.');
  };

  return (
    // Cabecera visual de la app.
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Sección izquierda: logo + nombre de la app */}
        <div className="flex items-center gap-2">
          {/* Logo redondo simple con las iniciales de NomadIQ */}
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 text-sm font-bold">
            NQ
          </div>

          {/* Nombre y subtítulo */}
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

          {/* Estos enlaces todavía son solo visuales.
             Más adelante los conectaremos con rutas reales (/destinations, /trips, etc.) */}
          <button
            type="button"
            className="hover:text-emerald-400 transition-colors"
          >
            Explorar destinos
          </button>
          <button
            type="button"
            className="hover:text-emerald-400 transition-colors"
          >
            Mis viajes
          </button>

          {/* ---------------------------------------------------
             Bloque relacionado con la sesión del usuario
             --------------------------------------------------- */}
          {user ? (
            // Si HAY un usuario logueado, mostramos:
            // - un pequeño saludo con su nombre,
            // - un botón para cerrar sesión.
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
