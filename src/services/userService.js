import { db } from '../config/firebase.js';
import bcrypt from 'bcryptjs';
import { toPublicUser } from '../models/userModel.js';

const USERS_COL = 'users';

export async function findUserByEmail(email) {
  const q = await db.collection(USERS_COL).where('email', '==', email).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getUserById(id) {
  const snap = await db.collection(USERS_COL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createUser({ email, password, name, role, avatarUrl }) {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('EMAIL_IN_USE');

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);

  const docRef = db.collection(USERS_COL).doc();
  const user = {
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: role || 'user',
    avatarUrl: avatarUrl || null,
    createdAt: now,
    updatedAt: now
  };

  await docRef.set(user);
  return toPublicUser({ id: docRef.id, ...user });
}

export async function validateCredentials(email, password) {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user; // con passwordHash (interno)
}
