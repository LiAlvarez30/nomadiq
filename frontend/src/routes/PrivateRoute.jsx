// src/routes/PrivateRoute.jsx

// Este componente va a servir como "puerta de seguridad" para ciertas rutas.
// La idea es simple:
//
// - Si el usuario está logueado (tenemos user y/o token en el AuthContext):
//     → mostramos la pantalla protegida.
// - Si NO está logueado:
//     → lo redirigimos a /login.
//
// Más adelante lo usaremos para proteger pantallas como:
// - /trips (Mis viajes)
// - /itineraries
// - /admin, etc.

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';

// Importamos el contexto de autenticación para saber si hay usuario o token.
import { AuthContext } from '../context/AuthContext.jsx';

// Recibimos una prop llamada "children", que será el componente que queremos proteger.
// Ejemplo de uso (más adelante en las rutas):
//
// <Route
//   path="/trips"
//   element={
//     <PrivateRoute>
//       <TripsPage />
//     </PrivateRoute>
//   }
// />
//
function PrivateRoute({ children }) {
  // Leemos el contexto de autenticación para saber el estado actual de la sesión.
  const { user, token } = useContext(AuthContext);

  // Lógica muy simple:
  // Si NO tenemos ni user ni token, asumimos que no hay sesión activa
  // y redirigimos al login.
  const isAuthenticated = Boolean(user && token);

  if (!isAuthenticated) {
    // Navigate es un componente especial de React Router:
    // cuando se renderiza, cambia la ruta.
    // En este caso, mandamos al usuario a /login.
    return <Navigate to="/login" replace />;
  }

  // Si sí está autenticado, mostramos el contenido que estaba intentando ver.
  return children;
}

export default PrivateRoute;
