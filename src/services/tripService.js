// Importamos la instancia de Firestore.
import { db } from '../config/firebase.js';

// Nombre de la colección de trips (viajes) en Firestore.
const COL = 'trips';

// CREATE: crea un nuevo viaje asociado a un usuario.
export async function createTrip(data) {
  const now = new Date().toISOString();
  const docRef = db.collection(COL).doc();

  const payload = {
    userId: data.userId,                            // ID del usuario dueño del viaje
    title: data.title,                              // título del viaje
    startDate: data.startDate,                      // fecha de inicio (formato ISO o "YYYY-MM-DD")
    endDate: data.endDate,                          // fecha de fin
    budget: typeof data.budget === 'number'
      ? data.budget
      : null,                                       // presupuesto o null
    interests: data.interests || [],                // intereses del viaje (array de strings)
    status: data.status || 'draft',                 // estado del viaje (draft, planned, etc.)
    createdAt: now,
    updatedAt: now
  };

  await docRef.set(payload);
  return { id: docRef.id, ...payload };
}

// READ by ID: obtiene un viaje por su ID.
export async function getTripById(id) {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// LIST: lista trips con filtros opcionales: userId, status.
export async function listTrips({
  userId,
  status,
  limit = 20,
  startAfterId
} = {}) {
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  // Filtrar por usuario, si se especifica.
  if (userId) {
    q = q.where('userId', '==', userId);
  }

  // Filtrar por estado de viaje, si se especifica.
  if (status) {
    q = q.where('status', '==', status);
  }

  // Paginación simple usando startAfterId como referencia.
  if (startAfterId) {
    const startSnap = await db.collection(COL).doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  const snap = await q.limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// UPDATE (PATCH): actualiza parcialmente un trip existente.
// Importante: aquí NO permitimos cambiar el userId.
export async function updateTrip(id, data) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const patch = {
    // NO permitimos cambiar userId por seguridad.
    // ...('userId' in data ? { userId: data.userId } : {}),

    ...('title' in data ? { title: data.title } : {}),
    ...('startDate' in data ? { startDate: data.startDate } : {}),
    ...('endDate' in data ? { endDate: data.endDate } : {}),
    ...('budget' in data
      ? {
          budget:
            typeof data.budget === 'number'
              ? data.budget
              : null
        }
      : {}),
    ...('interests' in data ? { interests: data.interests || [] } : {}),
    ...('status' in data ? { status: data.status } : {}),
    updatedAt: new Date().toISOString()
  };

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

// DELETE: elimina un trip por ID (la verificación de dueño
// la hacemos en el controlador antes de llamar a este servicio).
export async function deleteTrip(id) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
