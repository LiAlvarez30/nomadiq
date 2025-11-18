// src/models/uploadModel.js
// --------------------------
// Este archivo define el "modelo" de datos para la entidad "uploads".
// En NomadIQ, cada upload representa un archivo subido por un usuario
// (por ejemplo, un avatar o una imagen de una actividad).
//
// La información del archivo se guarda en Firestore, mientras que
// el archivo físico se almacena en el sistema de archivos local
// (carpeta src/uploads) o en un storage externo en el futuro.
//
// Aquí usamos Zod para validar los datos de entrada (cuando registramos
// un upload) y definimos una función "toPublicUpload" para controlar
// qué campos exponemos en la API pública.

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Enumeración de tipos de upload permitidos
// -----------------------------------------------------------------------------
// Según la definición de entidades de NomadIQ, los tipos principales son:
//  - "avatar"        -> imagen de perfil de usuario.
//  - "activityImage" -> imagen asociada a una actividad.
//  - "doc"           -> archivo genérico (por ejemplo, un PDF con info extra).
//
// Si en el futuro quieres agregar más tipos, simplemente se amplía este enum.
//
export const uploadTypeEnum = z.enum(['avatar', 'activityImage', 'doc']);

// -----------------------------------------------------------------------------
// Esquema de creación de un upload (registro en Firestore)
// -----------------------------------------------------------------------------
// Este esquema representa la información lógica que vamos a guardar
// en la colección "uploads" de Firestore.
//
// Algunos campos vendrán del usuario autenticado y del archivo que
// maneje Multer (file.originalname, file.filename, etc.).
//
// La validación con Zod nos ayuda a asegurarnos de que los tipos
// sean correctos antes de intentar guardar en la base de datos.
//
export const uploadCreateSchema = z.object({
  // ID del usuario que sube el archivo. Debe ser una cadena no vacía.
  userId: z.string().min(1, 'userId es requerido'),

  // Nombre original del archivo (tal como venía desde el cliente).
  originalName: z.string().min(1, 'originalName es requerido'),

  // Ruta o URL de almacenamiento. En este MVP usaremos una ruta relativa
  // del estilo "/uploads/archivo-123.png", pero en el futuro podría ser
  // una URL pública de Firebase Storage.
  storagePath: z.string().min(1, 'storagePath es requerido'),

  // Tipo de archivo según la lógica del negocio (avatar, activityImage, doc).
  type: uploadTypeEnum,

  // Campo opcional para guardar el mimeType (por ejemplo, "image/png").
  // No es estrictamente necesario para el MVP, pero es útil si después
  // queremos filtrar o validar.
  mimeType: z.string().min(1).optional(),

  // Campo opcional para guardar el tamaño del archivo en bytes.
  // También es opcional, pero puede servir para diagnósticos y límites.
  size: z.number().nonnegative().optional()
});

// -----------------------------------------------------------------------------
// Normalizador de salida para la API pública
// -----------------------------------------------------------------------------
// Esta función recibe un objeto "upload" (por ejemplo, el que viene de Firestore)
// y devuelve solo los campos que queremos exponer en la API.
//
// De esta manera evitamos filtrar información interna o sensible
// (si en algún momento agregamos campos privados).
//
export function toPublicUpload(u) {
  if (!u) return null;

  return {
    // ID del documento en Firestore.
    id: u.id,

    // Usuario dueño del archivo.
    userId: u.userId,

    // Nombre original del archivo.
    originalName: u.originalName,

    // Ruta o URL donde se puede acceder al archivo.
    storagePath: u.storagePath,

    // Tipo de archivo según la lógica de NomadIQ.
    type: u.type,

    // Tipo MIME y tamaño, si están disponibles.
    mimeType: u.mimeType || null,
    size: typeof u.size === 'number' ? u.size : null,

    // Timestamps de creación/actualización, si existen.
    createdAt: u.createdAt || null,
    updatedAt: u.updatedAt || null
  };
}
