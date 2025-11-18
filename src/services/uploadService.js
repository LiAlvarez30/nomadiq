// src/services/uploadService.js
// ------------------------------
// Este archivo implementa la capa de "servicios" para la entidad "uploads".
// Aquí es donde conectamos la lógica de negocio con Firestore.
//
// ¿Qué hace este service?
//  - Crea un registro de upload en la colección "uploads" de Firestore.
//  - Permite obtener un upload por id.
//  - Permite listar uploads de un usuario (con filtros simples).
//  - Permite eliminar un upload si fuera necesario.
//
// Importante:
//  - El archivo físico (imagen) fue manejado por Multer ANTES de llegar acá.
//  - Este servicio solo se ocupa de guardar/leer la METADATA en la base de datos.

// Importamos la instancia de Firestore que configuramos en firebase.js.
// "db" nos permite acceder a colecciones y documentos en Firestore.
import { db } from '../config/firebase.js';

// Importamos el esquema de validación y el normalizador desde el modelo.
import {
  uploadCreateSchema,
  toPublicUpload
} from '../models/uploadModel.js';

// Nombre de la colección en Firestore donde se guardarán los uploads.
// Usamos una constante para evitar "hardcodear" el string en muchos lugares.
const COL = 'uploads';

//
// -----------------------------------------------------------------------------
// CREATE: crear un nuevo upload en Firestore
// -----------------------------------------------------------------------------
// Esta función recibe los datos necesarios para registrar un upload.
// Normalmente será llamada desde un controller, después de que Multer
// haya procesado el archivo y nos entregue "file".
//
// Parámetros esperados (objeto "data"):
//  - userId       : string (id del usuario dueño del archivo)
//  - originalName : string (nombre original del archivo)
//  - storagePath  : string (ruta o URL donde se almacena el archivo)
//  - type         : "avatar" | "activityImage" | "doc"
//  - mimeType?    : string opcional (tipo MIME del archivo)
//  - size?        : number opcional (tamaño en bytes)
//
// La función:
//  1. Valida los datos con Zod (uploadCreateSchema).
//  2. Construye el payload con timestamps.
//  3. Lo guarda en Firestore.
//  4. Devuelve el upload en formato público.
//
export async function createUpload(data) {
  // Momento actual en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ).
  const now = new Date().toISOString();

  // Validamos los datos con Zod. Si algo está mal,
  // se lanzará un ZodError que será capturado por el errorHandler global.
  const parsed = uploadCreateSchema.parse(data);

  // Obtenemos una referencia a un nuevo documento en la colección "uploads".
  // Firestore generará un ID único automáticamente.
  const docRef = db.collection(COL).doc();

  // Construimos el objeto que realmente guardaremos en Firestore.
  const payload = {
    userId: parsed.userId,
    originalName: parsed.originalName,
    storagePath: parsed.storagePath,
    type: parsed.type,
    mimeType: parsed.mimeType || null,
    size: typeof parsed.size === 'number' ? parsed.size : null,
    createdAt: now,
    updatedAt: now
  };

  // Guardamos el documento en Firestore.
  await docRef.set(payload);

  // Devolvemos el upload en formato público,
  // incluyendo el id del documento.
  const upload = { id: docRef.id, ...payload };
  return toPublicUpload(upload);
}

//
// -----------------------------------------------------------------------------
// READ: obtener un upload por ID
// -----------------------------------------------------------------------------
// Esta función busca un documento en la colección "uploads" por su ID.
// Si lo encuentra, devuelve el upload en formato público.
// Si no existe, devuelve null.
//
export async function getUploadById(id) {
  // Obtenemos un "snapshot" del documento con ese ID.
  const snap = await db.collection(COL).doc(id).get();

  // Si el documento no existe, devolvemos null.
  if (!snap.exists) return null;

  // Si existe, construimos el objeto completo con id + data del documento.
  const upload = { id: snap.id, ...snap.data() };

  // Devolvemos la versión pública del upload.
  return toPublicUpload(upload);
}

//
// -----------------------------------------------------------------------------
// LIST: listar uploads de un usuario (con filtros opcionales)
// -----------------------------------------------------------------------------
// Esta función permite obtener la lista de uploads de un usuario,
// filtrando opcionalmente por "type" (avatar, activityImage, doc).
//
// Parámetros (objeto de filtro):
//  - userId : string (obligatorio, dueño de los archivos)
//  - type?  : string opcional (filtro por tipo de upload)
//  - limit? : number opcional (máximo de documentos a devolver)
//  - startAfterId? : string opcional (para paginación básica)
//
// Devuelve:
//  - un array de uploads en formato público.
//
export async function listUploadsByUser({
  userId,
  type,
  limit = 20,
  startAfterId
}) {
  // Empezamos construyendo una query base filtrando por userId.
  let q = db
    .collection(COL)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc');

  // Si se especifica un "type", añadimos ese filtro.
  if (type) {
    q = q.where('type', '==', type);
  }

  // Si nos pasan un startAfterId, intentamos usarlo como punto
  // de partida para la paginación.
  if (startAfterId) {
    const startSnap = await db.collection(COL).doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  // Ejecutamos la query con el límite indicado.
  const snap = await q.limit(limit).get();

  // Transformamos cada documento en un objeto con id + data.
  const uploads = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));

  // Devolvemos todos los uploads en formato público.
  return uploads.map(toPublicUpload);
}

//
// -----------------------------------------------------------------------------
// DELETE: eliminar un upload por ID (solo borrado en Firestore)
// -----------------------------------------------------------------------------
// Esta función elimina el documento de Firestore, pero NO borra el archivo
// físico del sistema de archivos. Para un MVP académico esto suele ser
// suficiente. Si después quieres sincronizar el borrado del archivo físico,
// se puede extender.
//
// Devuelve:
//  - true  si existía y se borró.
//  - false si no existía.
//
export async function deleteUpload(id) {
  // Obtenemos la referencia al documento.
  const ref = db.collection(COL).doc(id);

  // Comprobamos si existe.
  const snap = await ref.get();
  if (!snap.exists) return false;

  // Si existe, lo borramos.
  await ref.delete();

  // Devolvemos true para indicar que se borró correctamente.
  return true;
}
