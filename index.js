// Cargamos automáticamente las variables de entorno desde el archivo .env.
// Esta forma de importación es propia de ESM y es muy cómoda porque
// no tenemos que llamar a dotenv.config() en ningún lado.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Importamos la instancia de Firestore (db) que ya está configurada
// en src/config/firebase.js. Esto nos permite hacer pruebas de conexión
// y más adelante usar la base de datos en distintos módulos.
import { db } from './src/config/firebase.js';

// Importamos las rutas de las distintas partes de la API.
// Cada grupo de rutas está organizado por responsabilidad.
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import destinationRoutes from './src/routes/destinationRoutes.js';
import activityRoutes from './src/routes/activityRoutes.js';
import tripRoutes from './src/routes/tripRoutes.js';
import itineraryRoutes from './src/routes/itineraryRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { UPLOADS_DIR } from './src/config/multerConfig.js';
import { authLimiter } from './src/middlewares/rateLimitMiddleware.js';



// Importamos el middleware centralizado de manejo de errores.
// Este middleware se encarga de capturar errores que ocurran
// en los controladores y enviar una respuesta coherente al cliente.
import { errorHandler } from './src/middlewares/errorHandler.js';

// Creamos la aplicación Express.
// "app" va a ser nuestro servidor HTTP.
const app = express();

// -------------------------
// MIDDLEWARES BASE
// -------------------------

// Habilitamos CORS para permitir que el frontend (que en el futuro
// podría estar en otro dominio) pueda hacer requests a esta API.
app.use(cors());

// Habilitamos el middleware que parsea automáticamente el cuerpo
// de las peticiones JSON. El "limit" define el tamaño máximo permitido.
app.use(express.json({ limit: '1mb' }));

// morgan es un logger HTTP que nos muestra en la consola
// un resumen de cada request (método, ruta, tiempo, etc.).
app.use(morgan('dev'));

// Servimos archivos estáticos desde la carpeta de uploads.
// Esto permite acceder a las imágenes por una URL pública como:
//   http://localhost:3000/uploads/<nombre-del-archivo>
app.use('/uploads', express.static(UPLOADS_DIR));


// -------------------------
// RUTA DE HEALTHCHECK
// -------------------------

// Esta ruta simple sirve para comprobar rápidamente que el servidor
// está levantado y respondiendo. Es útil para pruebas rápidas
// o para que servicios externos verifiquen el estado de la API.
app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    message: 'NomadIQ API activa'
  });
});

// -------------------------
// RUTAS PRINCIPALES DE LA API
// -------------------------

// Grupo de rutas de autenticación (registro, login, refresh, etc.).
// Todas cuelgan de /auth.
app.use('/auth', authLimiter, authRoutes);

// Grupo de rutas relacionadas con usuarios (perfil, etc.).
// Todas cuelgan de /users.
app.use('/users', userRoutes);

// Ruta base para destinos turísticos.
// Ejemplo: GET /api/destinations
app.use('/api/destinations', destinationRoutes);

// Ruta base para actividades turísticas.
// Ejemplo: GET /api/activities
app.use('/api/activities', activityRoutes);

// Ruta base para trips (viajes planificados por el usuario).
// Ejemplo: GET /api/trips
app.use('/api/trips', tripRoutes);

// Ruta base para itineraries (itinerarios planificados por el usuario).
// Ejemplo: GET /api/trips
app.use('/api/itineraries', itineraryRoutes);

// Ruta base para uploads
app.use('/api/uploads', uploadRoutes);

// Rutas de administración (solo para usuarios con rol "admin").
app.use('/admin', adminRoutes);


// -------------------------
// TEST DE FIRESTORE
// -------------------------

// Esta ruta sirve como "ping" a la base de datos.
// Es muy útil para verificar que la conexión a Firestore está funcionando.
// Lo que hace:
// 1. Escribe un documento mínimo en la colección "healthchecks".
// 2. Lo vuelve a leer.
// 3. Devuelve el contenido en la respuesta.
app.get('/db/ping', async (_req, res, next) => {
  try {
    // Obtenemos una referencia a la colección "healthchecks".
    const col = db.collection('healthchecks');

    // Usamos el documento con ID fijo "ping".
    const docRef = col.doc('ping');

    // Armamos un payload muy simple con fecha y estado.
    const payload = {
      ts: new Date().toISOString(),
      status: 'ok'
    };

    // Guardamos (o actualizamos) el documento en Firestore.
    await docRef.set(payload, { merge: true });

    // Volvemos a leer el documento desde Firestore.
    const snap = await docRef.get();

    // Devolvemos al cliente los datos leídos de Firestore.
    res.status(200).json({
      ok: true,
      firestore: snap.data()
    });
  } catch (err) {
    // Si algo sale mal (por ejemplo, problema de credenciales),
    // pasamos el error al middleware centralizado de errores.
    next(err);
  }
});

// -------------------------
// MANEJO CENTRALIZADO DE ERRORES
// -------------------------

// Este middleware debe ir SIEMPRE después de todas las rutas.
// Cualquier error que ocurra en los controladores y llame a next(err)
// llegará aquí, donde podremos:
// - loguearlo
// - formatear la respuesta
// - evitar que el servidor se caiga
app.use(errorHandler);

// -------------------------
// ARRANQUE DEL SERVIDOR
// -------------------------

// Obtenemos el puerto desde las variables de entorno, y si no existe,
// usamos 3000 como valor por defecto.
const PORT = process.env.PORT || 3000;

// Le indicamos a Express que escuche en ese puerto.
// Esta es la línea que realmente "levanta" el servidor.
app.listen(PORT, () => {
  console.log(`[NomadIQ] Servidor escuchando en http://localhost:${PORT}`);
});
