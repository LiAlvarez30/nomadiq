// Cargamos las variables de entorno definidas en el archivo .env.
// Esta forma de importación hace que dotenv se ejecute automáticamente
// antes de que se ejecute el resto del código.
import 'dotenv/config';

import { initializeApp, cert } from 'firebase-admin/app';
// getFirestore nos permite obtener la instancia de la base de datos Firestore.
import { getFirestore } from 'firebase-admin/firestore';
// fs se usa para leer el archivo de credenciales JSON desde el sistema de archivos.
import fs from 'node:fs';

// Declaramos una variable "app" donde guardaremos la instancia inicializada
// de Firebase Admin. Más abajo la vamos a inicializar dentro de un try/catch.
let app;

try {
  // Obtenemos desde las variables de entorno la ruta al archivo de credenciales
  // del servicio (service account). Esta ruta debe estar configurada en .env
  // como: GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/archivo.json
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Si la variable no está definida, lanzamos un error explícito.
  // Esto es útil para detectar rápidamente una mala configuración.
  if (!keyPath) {
    throw new Error('Falta GOOGLE_APPLICATION_CREDENTIALS en .env');
  }

  // Verificamos que el archivo de credenciales exista en el sistema de archivos.
  // Si no existe, también lanzamos un error descriptivo.
  if (!fs.existsSync(keyPath)) {
    throw new Error(`No se encontró el archivo de credenciales en: ${keyPath}`);
  }

  // Leemos el contenido del archivo JSON de credenciales como texto.
  const rawJson = fs.readFileSync(keyPath, 'utf8');

  // Parseamos el texto del archivo para obtener un objeto JavaScript.
  const serviceAccount = JSON.parse(rawJson);

  // Inicializamos el SDK de Firebase Admin usando las credenciales del service account.
  // Esto nos va a permitir acceder a Firestore, Storage, etc. desde el backend.
  app = initializeApp({
    credential: cert(serviceAccount)
  });

  // Mensaje informativo en la consola para confirmar que la inicialización
  // fue exitosa con el archivo de credenciales.
  console.log('[Firebase] Admin inicializado con credenciales del archivo.');
} catch (err) {
  // Si ocurre cualquier error durante la inicialización (por ejemplo,
  // el .env está mal, el archivo no existe o el JSON es inválido),
  // lo mostramos en consola para facilitar el debugging.
  console.error('[Firebase] Error al inicializar:', err.message);

  // Luego relanzamos el error para que la aplicación falle al arrancar.
  // Es mejor que el servidor NO arranque si no tenemos conexión segura
  // a la base de datos.
  throw err;
}

// Obtenemos la instancia de Firestore asociada a la app inicializada.
// Esta "db" será el punto de entrada para todas las operaciones de lectura
// y escritura en nuestra base de datos.
export const db = getFirestore(app);
