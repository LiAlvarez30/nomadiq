// src/App.jsx

// Este archivo define la estructura principal de la aplicación en el frontend.
// Acá colocamos cosas "globales" como:
// - la barra de navegación (Navbar),
// - el contenedor general de las páginas,
// - y las rutas (Home, Login, etc.).

// Importamos componentes de React Router para definir las rutas de la SPA.
import { Routes, Route } from 'react-router-dom';

// Importamos las páginas que ya creaste.
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Importamos el Navbar que acabamos de crear.
// La idea es que este Navbar se muestre en todas las pantallas.
import Navbar from './components/Navbar.jsx';

import TripsPage from "./pages/TripsPage.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";
import ProfilePage from "./pages/ProfilePage";
import DestinationsPage from './pages/DestinationsPage.jsx';
import DestinationDetailPage from './pages/DestinationDetailPage.jsx';
import CreateTripPage from './pages/CreateTripPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';





function App() {
  return (
    // Este div envuelve toda la aplicación visual.
    // Usamos clases de Tailwind para el fondo y el texto general.
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Navbar fijo en la parte superior.
          Lo colocamos fuera del contenedor principal de las páginas
          para que siempre esté visible, sin importar la ruta actual. */}
      <Navbar />

      {/* Contenedor principal de contenido.
          Le damos un max-width para que no se vea demasiado ancho
          en pantallas grandes, y centramos con mx-auto. */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Acá definimos las rutas principales de la app.
            Cada <Route> dice: "si la URL es X, mostrá el componente Y". */}
        <Routes>
          {/* Ruta raíz: pantalla de inicio / dashboard básico.
              Por ahora muestra el healthcheck del backend. */}
          <Route path="/" element={<HomePage />} />

          {/* Ruta de login: pantalla donde el usuario puede iniciar sesión. */}
          <Route path="/login" element={<LoginPage />} />

          {/* Ruta protegida: /trips */}
          <Route 
           path="/trips" 
           element={
            <PrivateRoute>
              <TripsPage />
            </PrivateRoute>
           }
          />

          <Route
            path="/trips/new"
            element={
            <PrivateRoute>
              <CreateTripPage />
            </PrivateRoute>
            }
          />

         <Route
            path="/trips/:id"
            element={
            <PrivateRoute>
              <TripDetailPage />
            </PrivateRoute>
            }
          />


          <Route 
           path="/profile" 
           element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
           }
          />

          


          {/* Nueva ruta pública para explorar destinos */}
          <Route path="/destinations" element={<DestinationsPage />} />

          {/* Nueva ruta de detalle de destino */}
          <Route path="/destinations/:id" element={<DestinationDetailPage />} />


          {/* Más adelante podremos agregar:
              - /trips
              - /destinations
              - /itineraries
              - /admin
              etc. */}
            
        </Routes>
      </main>
    </div>
  );
}

export default App;
