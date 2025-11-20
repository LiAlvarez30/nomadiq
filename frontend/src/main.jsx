// src/main.jsx

// Importamos React y ReactDOM, que son las bases para montar
// nuestra aplicación en el navegador.
import React from 'react';
import ReactDOM from 'react-dom/client';

// BrowserRouter se encarga de manejar las rutas en una SPA
// (Single Page Application) usando el historial del navegador.
import { BrowserRouter } from 'react-router-dom';

// Importamos el componente raíz de la app, que define el layout
// general y las rutas (Home, Login, etc.).
import App from './App.jsx';

// Importamos los estilos globales, donde ya tenemos Tailwind configurado.
import './index.css';

// Importamos el AuthProvider, que acabamos de crear.
// Este componente es el encargado de manejar el contexto de autenticación:
// - user (usuario logueado)
// - token (JWT)
// - funciones login y logout
import { AuthProvider } from './context/AuthContext.jsx';

// Acá buscamos en el HTML el elemento con id="root", que es donde
// React va a "inyectar" toda nuestra aplicación.
const rootElement = document.getElementById('root');

// Creamos la raíz de React (API moderna de React 18).
const root = ReactDOM.createRoot(rootElement);

// Renderizamos la aplicación.
// El orden de los componentes que envuelven a <App /> es importante:
//
// - <React.StrictMode> ayuda a detectar problemas potenciales en desarrollo.
// - <BrowserRouter> habilita el sistema de rutas en toda la app.
// - <AuthProvider> pone a disposición de todos los componentes
//   la información de autenticación (user, token, login, logout).
//
// Cualquier componente dentro de App ahora va a poder usar el
// contexto de autenticación si lo necesita.
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
