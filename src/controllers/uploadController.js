// src/controllers/uploadController.js
// -----------------------------------
// Este controlador se encarga de manejar las peticiones HTTP relacionadas
// con la entidad "uploads". Aquí conectamos:
//   - el middleware de autenticación (req.user)
//   - el middleware de Multer (req.file)
//   - el servicio de uploads (uploadService)
//
// Flujos principales que vamos a manejar:
//   1) Subir un archivo (POST /api/uploads)
//   2) Listar mis archivos (GET /api/uploads)
//   3) Obtener un upload por id (GET /api/uploads/:id)
//   4) Eliminar un upload (DELETE /api/uploads/:id)
//
// Importante: el archivo físico ya fue procesado por Multer y se encuentra
// en "req.file". Aquí solamente registramos su metadata en Firestore.

// Importamos las funciones del servicio de uploads.
import {
  createUpload,
  getUploadById,
  listUploadsByUser,
  deleteUpload
} from '../services/uploadService.js';

// Importamos el enum de tipos de upload para validar de forma simple.
import { uploadTypeEnum } from '../models/uploadModel.js';

//
// -----------------------------------------------------------------------------
// POST /api/uploads
// -----------------------------------------------------------------------------
// Este handler recibe un archivo desde el cliente (campo "file" en multipart/form-data).
//
// Flujo esperado:
//   - authMiddleware ya validó el token y cargó req.user.
//   - uploader.single('file') ya procesó el archivo y cargó req.file.
//   - Aquí validamos que exista req.file.
//   - Construimos los datos necesarios para registrar el upload en Firestore.
//   - Llamamos a createUpload del servicio.
//   - Devolvemos el upload en formato público.
//
// Datos que vienen en req:
//   - req.user.id       -> id del usuario autenticado.
//   - req.file          -> información del archivo (originalname, filename, mimetype, size, etc.).
//   - req.body.type     -> tipo de upload ("avatar", "activityImage" o "doc").
//
export async function uploadSingle(req, res, next) {
  try {
    // Verificamos que el middleware de autenticación haya cargado el usuario.
    // Si por alguna razón no existe, devolvemos 401.
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        ok: false,
        error: 'AUTH_REQUIRED'
      });
    }

    // Obtenemos la información del archivo que subió Multer.
    const file = req.file;

    // Si no hay archivo, devolvemos un error 400.
    if (!file) {
      return res.status(400).json({
        ok: false,
        error: 'FILE_REQUIRED'
      });
    }

    // Obtenemos el tipo lógico de upload desde el body.
    // Por ejemplo: "avatar", "activityImage" o "doc".
    const { type } = req.body;

    // Validamos que el "type" sea uno de los permitidos usando el enum de Zod.
    // Si no es válido, lanzará una excepción que será capturada por el errorHandler global.
    const parsedType = uploadTypeEnum.parse(type);

    // Construimos la "ruta lógica" donde se podrá acceder al archivo.
    // Como usamos Express para servir estáticos desde "/uploads",
    // podemos armar algo como "/uploads/<nombre-de-archivo>".
    const storagePath = `/uploads/${file.filename}`;

    // Armamos el objeto con todos los datos necesarios para registrar el upload.
    const uploadData = {
      userId: req.user.id,
      originalName: file.originalname,
      storagePath,
      type: parsedType,
      mimeType: file.mimetype,
      size: file.size
    };

    // Llamamos al servicio para crear el upload en Firestore.
    const created = await createUpload(uploadData);

    // Devolvemos 201 Created con el upload recién creado.
    return res.status(201).json({
      ok: true,
      upload: created
    });
  } catch (err) {
    // Cualquier error se delega al middleware de manejo centralizado.
    next(err);
  }
}

//
// -----------------------------------------------------------------------------
// GET /api/uploads
// -----------------------------------------------------------------------------
// Este handler devuelve la lista de uploads del usuario autenticado.
//
// Soporta filtros opcionales por query string:
//   - ?type=avatar
//   - ?type=activityImage
//   - ?type=doc
//
// Ejemplo de uso:
//   GET /api/uploads?type=avatar
//
// Respuesta:
//   {
//     ok: true,
//     count: 1,
//     uploads: [ ... ]
//   }
//
export async function listMine(req, res, next) {
  try {
    // Validamos que exista un usuario autenticado.
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        ok: false,
        error: 'AUTH_REQUIRED'
      });
    }

    // Leemos el posible filtro "type" desde la query.
    const { type, limit, startAfterId } = req.query;

    // Validamos el "type" solo si viene definido.
    let parsedType = undefined;
    if (typeof type === 'string' && type.length > 0) {
      parsedType = uploadTypeEnum.parse(type);
    }

    // Convertimos "limit" a número, con máximos razonables.
    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 20, 100)
      : 20;

    // Llamamos al servicio para listar los uploads del usuario.
    const uploads = await listUploadsByUser({
      userId: req.user.id,
      type: parsedType,
      limit: parsedLimit,
      startAfterId
    });

    // Devolvemos la lista en formato estándar.
    return res.status(200).json({
      ok: true,
      count: uploads.length,
      uploads
    });
  } catch (err) {
    next(err);
  }
}

//
// -----------------------------------------------------------------------------
// GET /api/uploads/:id
// -----------------------------------------------------------------------------
// Este handler devuelve un upload específico por su ID.
//
// Flujo:
//   - authMiddleware ya validó al usuario.
//   - Buscamos el upload por id.
//   - (Opcional) podríamos validar que el upload pertenezca al usuario actual.
//   - Devolvemos el upload o 404 si no existe.
//
export async function getOne(req, res, next) {
  try {
    const { id } = req.params;

    const upload = await getUploadById(id);

    if (!upload) {
      return res.status(404).json({
        ok: false,
        error: 'UPLOAD_NOT_FOUND'
      });
    }

    // (Opcional pero recomendable):
    // Verificamos que el archivo pertenezca al usuario actual.
    if (!req.user || upload.userId !== req.user.id) {
      return res.status(403).json({
        ok: false,
        error: 'FORBIDDEN'
      });
    }

    return res.status(200).json({
      ok: true,
      upload
    });
  } catch (err) {
    next(err);
  }
}

//
// -----------------------------------------------------------------------------
// DELETE /api/uploads/:id
// -----------------------------------------------------------------------------
// Este handler elimina un upload de Firestore.
//
// Nota importante:
//  - Esta versión SOLO borra el registro en Firestore.
//  - El archivo físico en disco (src/uploads/...) no se elimina aún.
//    Para un MVP académico es suficiente, pero se podría extender.
//
// Flujo:
//   - authMiddleware ya validó al usuario.
//   - Buscamos el upload por id.
//   - Verificamos que pertenezca al usuario actual.
//   - Llamamos a deleteUpload.
//   - Devolvemos 200 o 404 según corresponda.
//
export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    // Obtenemos el upload para poder verificar propiedad.
    const upload = await getUploadById(id);

    if (!upload) {
      return res.status(404).json({
        ok: false,
        error: 'UPLOAD_NOT_FOUND'
      });
    }

    // Verificamos que el archivo pertenezca al usuario actual.
    if (!req.user || upload.userId !== req.user.id) {
      return res.status(403).json({
        ok: false,
        error: 'FORBIDDEN'
      });
    }

    // Si es del usuario, procedemos a eliminarlo de Firestore.
    const ok = await deleteUpload(id);

    if (!ok) {
      // Caso raro: el documento existía al leerlo pero falló la eliminación.
      return res.status(500).json({
        ok: false,
        error: 'DELETE_FAILED'
      });
    }

    return res.status(200).json({
      ok: true,
      deleted: id
    });
  } catch (err) {
    next(err);
  }
}
