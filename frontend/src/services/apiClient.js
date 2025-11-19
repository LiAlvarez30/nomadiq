// src/services/apiClient.js

// Importamos axios, que será la librería que usemos
// para hacer las llamadas HTTP al backend de NomadIQ.
import axios from 'axios';

// Creamos una instancia de axios con una configuración base.
// Esto nos permite centralizar:
// - la URL del backend
// - futuros headers comunes (como el token JWT)
// - interceptores de errores, etc.
const apiClient = axios.create({
  // Esta es la URL base del backend en desarrollo.
  // Más adelante podemos leerla desde variables de entorno (.env).
  baseURL: 'http://localhost:3000',
  // Opcionalmente podríamos configurar timeouts u otras cosas aquí.
});

// Más adelante acá vamos a agregar interceptores para:
// - Adjuntar Authorization: Bearer <token> cuando el usuario esté logueado.
// - Manejar errores con el formato { ok: false, error: "CODIGO" }.
 // Por ahora, dejamos la instancia simple.

export default apiClient;
