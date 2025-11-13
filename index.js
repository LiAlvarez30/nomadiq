import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { db } from './src/config/firebase.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import destinationRoutes from './src/routes/destinationRoutes.js';
import activityRoutes from './src/routes/activityRoutes.js';
import tripRoutes from './src/routes/tripRoutes.js';

const app = express();

// Middlewares base
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Healthcheck
app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, message: 'NomadIQ API activa' });
});

// Rutas API
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/trips', tripRoutes);

// Test Firestore: escribe y lee un documento mínimo
app.get('/db/ping', async (_req, res, next) => {
  try {
    const col = db.collection('healthchecks');
    const docRef = col.doc('ping');
    const payload = { ts: new Date().toISOString(), status: 'ok' };
    await docRef.set(payload, { merge: true });
    const snap = await docRef.get();
    res.status(200).json({ ok: true, firestore: snap.data() });
  } catch (err) {
    next(err);
  }
});

// Manejo centralizado de errores (debe ir después de las rutas)
app.use(errorHandler);

// Arranque
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[NomadIQ] Servidor escuchando en http://localhost:${PORT}`);
});
