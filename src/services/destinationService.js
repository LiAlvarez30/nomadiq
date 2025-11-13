import { db } from '../config/firebase.js';

const COL = 'destinations';

// CREATE
export async function createDestination(data) {
  const now = new Date().toISOString();
  const docRef = db.collection(COL).doc();
  const payload = {
    name: data.name,
    country: data.country,
    summary: data.summary,
    coords: data.coords,           // { lat, lng }
    tags: data.tags || [],
    images: data.images || [],
    createdAt: now,
    updatedAt: now
  };
  await docRef.set(payload);
  return { id: docRef.id, ...payload };
}

// READ by ID
export async function getDestinationById(id) {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// LIST (opcionalmente filtra por country y/o tag)
export async function listDestinations({ country, tag, limit = 20, startAfterId } = {}) {
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  if (country) {
    q = q.where('country', '==', country);
  }
  if (tag) {
    // Firestore no permite "array-contains-any" con múltiples; aquí usamos uno.
    q = q.where('tags', 'array-contains', tag);
  }

  // Paginación simple por documento (startAfter)
  if (startAfterId) {
    const startSnap = await db.collection(COL).doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  const snap = await q.limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// UPDATE (PATCH)
export async function updateDestination(id, data) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const patch = {
    ...('name' in data ? { name: data.name } : {}),
    ...('country' in data ? { country: data.country } : {}),
    ...('summary' in data ? { summary: data.summary } : {}),
    ...('coords' in data ? { coords: data.coords } : {}),
    ...('tags' in data ? { tags: data.tags || [] } : {}),
    ...('images' in data ? { images: data.images || [] } : {}),
    updatedAt: new Date().toISOString()
  };

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

// DELETE
export async function deleteDestination(id) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
