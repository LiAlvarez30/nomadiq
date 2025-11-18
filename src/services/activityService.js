// Importamos la instancia de Firestore.
import { db } from '../config/firebase.js';

// Nombre de la colección de actividades.
const COL = 'activities';

// CREATE: crea una nueva actividad asociada a un destino.
export async function createActivity(data) {
  const now = new Date().toISOString();
  const docRef = db.collection(COL).doc();

  const payload = {
    destinationId: data.destinationId,            // ID del destino al que pertenece
    name: data.name,                              // nombre de la actividad
    category: data.category,                      // categoría (ej: "gastronomía", "aventura")
    priceRange: data.priceRange,                 // 'free' | 'low' | 'medium' | 'high'
    openingHours: data.openingHours || null,      // horarios de apertura (texto) o null
    coords: data.coords || null,                  // coordenadas { lat, lng } o null
    rating: typeof data.rating === 'number' ? data.rating : null, // puntuación promedio
    reviewsCount:
      typeof data.reviewsCount === 'number'
        ? data.reviewsCount
        : 0,                                      // cantidad de reseñas
    images: data.images || [],                    // URLs de imágenes
    createdAt: now,
    updatedAt: now
  };

  await docRef.set(payload);
  return { id: docRef.id, ...payload };
}

// READ by ID: obtiene una actividad por su ID.
export async function getActivityById(id) {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// LIST: lista actividades con filtros opcionales por destino y categoría.
export async function listActivities({
  destinationId,
  category,
  limit = 20,
  startAfterId
} = {}) {
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  // Filtrar por destino, si se especifica.
  if (destinationId) {
    q = q.where('destinationId', '==', destinationId);
  }

  // Filtrar por categoría, si se especifica.
  if (category) {
    q = q.where('category', '==', category);
  }

  // Paginación simple con startAfterId.
  if (startAfterId) {
    const startSnap = await db.collection(COL).doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  const snap = await q.limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// UPDATE (PATCH): actualiza parcialmente una actividad.
export async function updateActivity(id, data) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const patch = {
    ...('destinationId' in data ? { destinationId: data.destinationId } : {}),
    ...('name' in data ? { name: data.name } : {}),
    ...('category' in data ? { category: data.category } : {}),
    ...('priceRange' in data ? { priceRange: data.priceRange } : {}),
    ...('openingHours' in data
      ? { openingHours: data.openingHours || null }
      : {}),
    ...('coords' in data ? { coords: data.coords || null } : {}),
    ...('rating' in data
      ? {
          rating:
            typeof data.rating === 'number'
              ? data.rating
              : null
        }
      : {}),
    ...('reviewsCount' in data
      ? {
          reviewsCount:
            typeof data.reviewsCount === 'number'
              ? data.reviewsCount
              : 0
        }
      : {}),
    ...('images' in data ? { images: data.images || [] } : {}),
    updatedAt: new Date().toISOString()
  };

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

// DELETE: elimina una actividad si existe.
export async function deleteActivity(id) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
