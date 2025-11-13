import { db } from '../config/firebase.js';

const COL = 'activities';

// CREATE
export async function createActivity(data) {
  const now = new Date().toISOString();
  const docRef = db.collection(COL).doc();
  const payload = {
    destinationId: data.destinationId,
    name: data.name,
    category: data.category,
    priceRange: data.priceRange,     // 'free' | 'low' | 'medium' | 'high'
    openingHours: data.openingHours || null,
    coords: data.coords || null,     // { lat, lng } | null
    rating: typeof data.rating === 'number' ? data.rating : null,
    reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0,
    images: data.images || [],
    createdAt: now,
    updatedAt: now
  };
  await docRef.set(payload);
  return { id: docRef.id, ...payload };
}

// READ by ID
export async function getActivityById(id) {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// LIST con filtros opcionales: destinationId, category
export async function listActivities({ destinationId, category, limit = 20, startAfterId } = {}) {
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  if (destinationId) {
    q = q.where('destinationId', '==', destinationId);
  }
  if (category) {
    q = q.where('category', '==', category);
  }

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
export async function updateActivity(id, data) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const patch = {
    ...('destinationId' in data ? { destinationId: data.destinationId } : {}),
    ...('name' in data ? { name: data.name } : {}),
    ...('category' in data ? { category: data.category } : {}),
    ...('priceRange' in data ? { priceRange: data.priceRange } : {}),
    ...('openingHours' in data ? { openingHours: data.openingHours || null } : {}),
    ...('coords' in data ? { coords: data.coords || null } : {}),
    ...('rating' in data ? { rating: typeof data.rating === 'number' ? data.rating : null } : {}),
    ...('reviewsCount' in data ? { reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 0 } : {}),
    ...('images' in data ? { images: data.images || [] } : {}),
    updatedAt: new Date().toISOString()
  };

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

// DELETE
export async function deleteActivity(id) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
