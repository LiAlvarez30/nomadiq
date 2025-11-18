// src/routes/uploadRoutes.js
// ---------------------------
// Este archivo define las rutas HTTP relacionadas con "uploads".
// Aquí combinamos:
//   - Router de Express
//   - authMiddleware (protege las rutas)
//   - Multer (uploader.single('file'))
//   - Los handlers definidos en uploadController.
//
// Rutas principales:
//   POST   /api/uploads           -> subir un archivo
//   GET    /api/uploads           -> listar mis archivos
//   GET    /api/uploads/:id       -> obtener un upload por id
//   DELETE /api/uploads/:id       -> eliminar un upload por id

import { Router } from 'express';

// Importamos el middleware de autenticación.
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Importamos el "uploader" de Multer que configuramos en multerConfig.js.
import { uploader } from '../config/multerConfig.js';

// Importamos los handlers del controlador de uploads.
import {
  uploadSingle,
  listMine,
  getOne,
  remove
} from '../controllers/uploadController.js';

// Creamos una instancia de Router para agrupar las rutas de uploads.
const router = Router();

// -----------------------------------------------------------------------------
// POST /api/uploads
// -----------------------------------------------------------------------------
// Esta ruta permite subir un archivo.
// Middleware en cadena:
//   1) authMiddleware -> verifica el token JWT y carga req.user.
//   2) uploader.single('file') -> procesa el archivo del campo "file".
//   3) uploadSingle -> registra la metadata en Firestore y responde.
//
router.post(
  '/',
  authMiddleware,
  uploader.single('file'),
  uploadSingle
);

// -----------------------------------------------------------------------------
// GET /api/uploads
// -----------------------------------------------------------------------------
// Esta ruta devuelve la lista de uploads del usuario autenticado.
// Se puede filtrar por tipo con ?type=avatar | activityImage | doc.
//
router.get(
  '/',
  authMiddleware,
  listMine
);

// -----------------------------------------------------------------------------
// GET /api/uploads/:id
// -----------------------------------------------------------------------------
// Esta ruta devuelve la información de un upload específico.
// También valida que el upload pertenezca al usuario actual.
//
router.get(
  '/:id',
  authMiddleware,
  getOne
);

// -----------------------------------------------------------------------------
// DELETE /api/uploads/:id
// -----------------------------------------------------------------------------
// Esta ruta permite eliminar un upload de Firestore.
// También valida que el upload pertenezca al usuario actual.
//
router.delete(
  '/:id',
  authMiddleware,
  remove
);

// Exportamos el router para poder usarlo en index.js.
export default router;
