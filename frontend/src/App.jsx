// src/App.jsx

// Importamos el sistema de rutas de React Router.
import { Routes, Route, Link } from 'react-router-dom';

// Importamos las páginas que acabamos de crear.
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Este componente App ahora funciona como "shell" principal de la SPA.
// - Define el layout base (fondo, header, contenedor).
// - Declara las rutas principales de la aplicación.
// Más adelante podemos extraer el layout a un componente separado.
function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header simple con el nombre de la app y enlaces básicos */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-900 font-bold">
              NQ
            </span>
            <span className="font-semibold tracking-tight">NomadIQ</span>
          </div>

          {/* Navegación mínima para movernos entre Home y Login.
             Más adelante, cuando tengamos auth, esto cambiará. */}
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-full border border-emerald-500/70 text-emerald-200 text-xs hover:bg-emerald-500 hover:text-slate-950 transition-colors"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido principal donde se van a renderizar las páginas */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          {/* Ruta raíz: muestra la Home con el healthcheck */}
          <Route path="/" element={<HomePage />} />

          {/* Ruta /login: por ahora un placeholder,
              luego será el formulario real de autenticación */}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
