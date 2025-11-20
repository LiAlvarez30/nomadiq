// src/context/AuthContext.jsx

// Este archivo define el "contexto de autenticación" de la app.
// La idea es tener un lugar central donde guardar:
// - quién es el usuario logueado (user),
// - el token JWT que devuelve el backend (token),
// - y algunas funciones para iniciar y cerrar sesión (login / logout).
//
// Además, en este paso agregamos algo muy útil:
// - guardar la sesión en localStorage para que, si recargás la página,
//   el usuario siga logueado mientras el token siga existiendo.

import { createContext, useState } from 'react';

// Definimos claves que vamos a usar en localStorage.
// Esto nos ayuda a no repetir strings mágicos en el código.
const STORAGE_USER_KEY = 'nomadiq_auth_user';
const STORAGE_TOKEN_KEY = 'nomadiq_auth_token';

// 1) Creamos el contexto con una estructura básica por defecto.
//    Esto es útil para tener autocompletado y evitar undefineds.
export const AuthContext = createContext({
  user: null,          // Objeto de usuario logueado (o null si nadie está logueado).
  token: null,         // Token JWT actual (o null si no hay sesión).
  login: () => {},     // Función que se implementa en AuthProvider.
  logout: () => {},    // Ídem.
});

// 2) Componente AuthProvider.
//    Envuelve a la aplicación y provee el contexto de autenticación.
export function AuthProvider({ children }) {
  // -------------------------------------------------------
  // ESTADO INICIAL: intentamos leer desde localStorage
  // -------------------------------------------------------
  //
  // useState admite una función inicial. Esa función se ejecuta solo una vez,
  // la primera vez que se monta el componente. Aprovechamos eso para leer
  // del localStorage si hay una sesión guardada.
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_USER_KEY);
      // Si había algo guardado, lo parseamos. Si no, devolvemos null.
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error('Error al leer el usuario desde localStorage:', err);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      return storedToken || null;
    } catch (err) {
      console.error('Error al leer el token desde localStorage:', err);
      return null;
    }
  });

  // -------------------------------------------------------
  // FUNCIÓN login
  // -------------------------------------------------------
  //
  // Esta función se llama cuando el backend confirma que el login es correcto.
  // Recibe:
  // - userData  → objeto de usuario que vino del backend
  // - tokenValue → token JWT que vino del backend
  const login = (userData, tokenValue) => {
    // Guardamos en el estado de React.
    setUser(userData);
    setToken(tokenValue);

    try {
      // Además, persistimos en localStorage para que la sesión sobreviva
      // a recargas de página.
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      localStorage.setItem(STORAGE_TOKEN_KEY, tokenValue);
    } catch (err) {
      console.error('Error al guardar la sesión en localStorage:', err);
    }
  };

  // -------------------------------------------------------
  // FUNCIÓN logout
  // -------------------------------------------------------
  //
  // Esta función "cierra sesión":
  // - borra user y token del estado,
  // - y limpia también el localStorage.
  const logout = () => {
    // Limpiamos el estado en memoria.
    setUser(null);
    setToken(null);

    try {
      // Limpiamos lo que habíamos guardado en localStorage.
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch (err) {
      console.error('Error al limpiar la sesión de localStorage:', err);
    }
  };

  // Este objeto es el "valor" que otros componentes verán cuando hagan:
  // const { user, token, login, logout } = useContext(AuthContext);
  const authValue = {
    user,
    token,
    login,
    logout,
  };

  // Devolvemos el provider. Todo lo que esté dentro de <AuthProvider>
  // va a poder acceder a user, token, login y logout.
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
