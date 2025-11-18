// Importamos la instancia de Firestore para poder leer/escribir usuarios.
import { db } from '../config/firebase.js';

// Importamos bcrypt para poder hashear y comparar contraseñas de forma segura.
import bcrypt from 'bcryptjs';

// Importamos la función que transforma un usuario a su versión pública
// (sin passwordHash ni campos sensibles).
import { toPublicUser } from '../models/userModel.js';

// Nombre de la colección de usuarios en Firestore.
const USERS_COL = 'users';

// Busca un usuario por email.
// Devuelve null si no encuentra nada.
export async function findUserByEmail(email) {
  // Normalizamos el email a minúsculas para evitar duplicados por mayúsculas/minúsculas.
  const normalizedEmail = email.toLowerCase();

  // Armamos una consulta a la colección "users" filtrando por email.
  const q = await db
    .collection(USERS_COL)
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  // Si la consulta no devuelve documentos, devolvemos null.
  if (q.empty) return null;

  // Tomamos el primer documento encontrado.
  const doc = q.docs[0];

  // Devolvemos un objeto usuario con su id y el resto de los datos.
  return { id: doc.id, ...doc.data() };
}

// Busca un usuario por su ID de documento en Firestore.
// Devuelve null si no existe.
export async function getUserById(id) {
  // Obtenemos el documento correspondiente al ID indicado.
  const snap = await db.collection(USERS_COL).doc(id).get();

  // Si el documento no existe, devolvemos null.
  if (!snap.exists) return null;

  // Si existe, devolvemos id + data.
  return { id: snap.id, ...snap.data() };
}

// Crea un nuevo usuario asegurándose de que el email sea único.
// Recibe un objeto con { email, password, name, role, avatarUrl }.
export async function createUser({ email, password, name, role, avatarUrl }) {
  // Verificamos si ya existe un usuario con ese email.
  const existing = await findUserByEmail(email);
  if (existing) {
    // En lugar de devolver un mensaje genérico, lanzamos un error
    // específico que el errorHandler sabe interpretar como 409.
    throw new Error('EMAIL_IN_USE');
  }

  // Generamos una marca de tiempo actual en formato ISO.
  const now = new Date().toISOString();

  // Hasheamos la contraseña de manera segura con bcrypt.
  const passwordHash = await bcrypt.hash(password, 10);

  // Creamos una referencia a un nuevo documento en la colección "users"
  // con un ID generado automáticamente.
  const docRef = db.collection(USERS_COL).doc();

  // Armamos el objeto usuario que guardaremos en Firestore.
  const user = {
    email: email.toLowerCase(),      // siempre guardamos el email en minúsculas
    passwordHash,                    // hash de la contraseña (no la contraseña en texto plano)
    name,                            // nombre del usuario
    role: role || 'user',            // rol (por defecto "user")
    avatarUrl: avatarUrl || null,    // URL de avatar (opcional)
    createdAt: now,                  // fecha de creación
    updatedAt: now                   // fecha de última actualización
  };

  // Guardamos el usuario en la base de datos.
  await docRef.set(user);

  // Devolvemos la versión pública del usuario (sin passwordHash),
  // incluyendo el ID generado.
  return toPublicUser({ id: docRef.id, ...user });
}

// Valida las credenciales de login (email + password).
// Devuelve el usuario completo si es válido, o null si no lo es.
export async function validateCredentials(email, password) {
  // Buscamos el usuario por email (normalizado).
  const user = await findUserByEmail(email.toLowerCase());

  // Si no hay usuario, indicamos que las credenciales son inválidas.
  if (!user) return null;

  // Comparamos la contraseña recibida con el hash almacenado.
  const ok = await bcrypt.compare(password, user.passwordHash);

  // Si no coincide, devolvemos null.
  if (!ok) return null;

  // Si coincide, devolvemos el usuario completo (incluyendo passwordHash)
  // para que la capa superior pueda generar el token, etc.
  return user;
}
