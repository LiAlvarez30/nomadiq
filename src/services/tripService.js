import { db } from '../config/firebase.js';

const COL = 'trips';

// CREATE
export async function createTrip(data) {
  const now = new Date().toISOString();
  const docRef = db.collection(COL).doc();
  const payload = {
    userId: data.userId,
    title: data.title,
    startDate: data.startDate, // se espera formato ISO (YYYY-MM-DD)
    endDate: data.endDate,
    budget: typeof data.budget === 'number' ? data.budget : null,
    interests: data.interests || [],
    status: data.status || 'draft',
    createdAt: now,
    updatedAt: now
  };
  await docRef.set(payload);
  return { id: docRef.id, ...payload };
}

// READ by ID
export async function getTripById(id) {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

// LIST con filtros opcionales: userId, status
export async function listTrips({ userId, status, limit = 20, startAfterId } = {}) {
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  if (userId) {
    q = q.where('userId', '==', userId);
  }
  if (status) {
    q = q.where('status', '==', status);
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
export async function updateTrip(id, data) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const patch = {
    ...('userId' in data ? { userId: data.userId } : {}),
    ...('title' in data ? { title: data.title } : {}),
    ...('startDate' in data ? { startDate: data.startDate } : {}),
    ...('endDate' in data ? { endDate: data.endDate } : {}),
    ...('budget' in data ? { budget: typeof data.budget === 'number' ? data.budget : null } : {}),
    ...('interests' in data ? { interests: data.interests || [] } : {}),
    ...('status' in data ? { status: data.status } : {}),
    updatedAt: new Date().toISOString()
  };

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

// DELETE
export async function deleteTrip(id) {
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}
