import 'dotenv/config.js';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';

let app;

try {
  // Opción por variable de entorno con ruta al JSON (recomendada en local)
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!keyPath) {
    throw new Error('Falta GOOGLE_APPLICATION_CREDENTIALS en .env');
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error(`No se encontró el archivo de credenciales en: ${keyPath}`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  app = initializeApp({
    credential: cert(serviceAccount),
  });
  console.log('[Firebase] Admin inicializado con credenciales del archivo.');
} catch (err) {
  console.error('[Firebase] Error al inicializar:', err.message);
  throw err;
}

export const db = getFirestore(app);
