// src/main.jsx

// Importamos React y ReactDOM para montar la aplicación.
import React from 'react';
import ReactDOM from 'react-dom/client';

// Importamos el BrowserRouter, que se encarga de manejar
// el historial y las rutas en una SPA.
import { BrowserRouter } from 'react-router-dom';

// Importamos el componente raíz de nuestra app.
import App from './App.jsx';

// Importamos los estilos globales, que incluyen Tailwind.
import './index.css';

// Montamos la aplicación dentro del elemento con id "root"
// definido en index.html. Envolvemos App con BrowserRouter
// para que todas las páginas tengan acceso al router.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
