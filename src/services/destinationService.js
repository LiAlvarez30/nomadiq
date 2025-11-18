// Importamos la instancia de Firestore.
import { db } from '../config/firebase.js';

// Nombre de la colección de destinos en Firestore.
const COL = 'destinations';

// CREATE: crea un nuevo destino turístico.
export async function createDestination(data) {
  // Obtenemos la fecha/hora actual en formato ISO.
  const now = new Date().toISOString();

  // Creamos una referencia a un nuevo documento en la colección.
  const docRef = db.collection(COL).doc();

  // Armamos el payload que vamos a guardar.
  const payload = {
    name: data.name,                    // nombre del destino (ej: "Bariloche")
    country: data.country,              // país (ej: "AR")
    summary: data.summary,              // breve descripción
    coords: data.coords,                // coordenadas { lat, lng }
    tags: data.tags || [],              // etiquetas, por ejemplo ["playa", "montaña"]
    images: data.images || [],          // URLs de imágenes
    createdAt: now,                     // fecha de creación
    updatedAt: now                      // fecha de última actualización
  };

  // Guardamos el destino en Firestore.
  await docRef.set(payload);

  // Devolvemos el destino creado junto con su ID.
  return { id: docRef.id, ...payload };
}

// READ by ID: obtiene un destino por su ID.
export async function getDestinationById(id) {
  // Buscamos el documento en Firestore.
  const snap = await db.collection(COL).doc(id).get();

  // Si no existe, devolvemos null.
  if (!snap.exists) return null;

  // Si existe, devolvemos id + datos.
  return { id: snap.id, ...snap.data() };
}

// LIST: lista destinos con filtros opcionales por país y tag.
export async function listDestinations({
  country,
  tag,
  limit = 20,
  startAfterId
} = {}) {
  // Armamos la query base, ordenada por fecha de creación (descendente).
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  // Si recibimos un país, lo usamos como filtro.
  if (country) {
    q = q.where('country', '==', country);
  }

  // Si recibimos un tag, filtramos por ese tag en el array "tags".
  if (tag) {
    // "array-contains" verifica que el array incluya ese tag.
    q = q.where('tags', 'array-contains', tag);
  }

  // Paginación simple basada en un documento de referencia.
  if (startAfterId) {
    const startSnap = await db.collection(COL).doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  // Ejecutamos la query con el límite indicado.
  const snap = await q.limit(limit).get();

  // Convertimos cada documento en un objeto { id, ...data }.
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// UPDATE (PATCH): actualiza parcialmente un destino existente.
export async function updateDestination(id, data) {
  // Obtenemos la referencia al documento a actualizar.
  const ref = db.collection(COL).doc(id);

  // Verificamos si el documento existe.
  const snap = await ref.get();
  if (!snap.exists) return null;

  // Construimos un "patch" solo con los campos presentes en "data".
  const patch = {
    ...('name' in data ? { name: data.name } : {}),
    ...('country' in data ? { country: data.country } : {}),
    ...('summary' in data ? { summary: data.summary } : {}),
    ...('coords' in data ? { coords: data.coords } : {}),
    ...('tags' in data ? { tags: data.tags || [] } : {}),
    ...('images' in data ? { images: data.images || [] } : {}),
    updatedAt: new Date().toISOString() // siempre actualizamos updatedAt
  };

  // Hacemos un merge para actualizar solo los campos indicados.
  await ref.set(patch, { merge: true });

  // Volvemos a leer el documento actualizado.
  const updated = await ref.get();

  // Devolvemos el destino actualizado.
  return { id: updated.id, ...updated.data() };
}

// DELETE: elimina un destino si existe.
export async function deleteDestination(id) {
  // Obtenemos la referencia al documento a eliminar.
  const ref = db.collection(COL).doc(id);

  // Verificamos si existe.
  const snap = await ref.get();
  if (!snap.exists) return false;

  // Eliminamos el documento.
  await ref.delete();

  // Indicamos que la operación se realizó correctamente.
  return true;
}
