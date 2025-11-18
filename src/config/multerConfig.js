// src/config/multerConfig.js
// ---------------------------
// Este archivo define la configuración base de Multer para NomadIQ.
//
// Multer es un middleware para Express que nos permite manejar subidas
// de archivos (por ejemplo, imágenes de perfil o fotos de actividades).
//
// En esta primera versión vamos a:
//  - Guardar los archivos físicamente en la carpeta "src/uploads".
//  - Generar nombres de archivo únicos para evitar colisiones.
//  - Exponer un "uploader" que luego podremos usar en las rutas.
//
// Más adelante, si lo deseas, podemos cambiar el destino a un servicio
// externo (como Firebase Storage), pero la interfaz de Multer se mantiene
// muy similar.

// Importamos "multer", que es el paquete especializado en manejo de uploads.
import multer from 'multer';

// Importamos "path" desde Node.js para trabajar con rutas de archivos
// de forma segura y compatible entre sistemas operativos.
import path from 'node:path';

// Importamos "fs" para poder verificar y crear directorios si no existen.
import fs from 'node:fs';

// Definimos el directorio base donde se guardarán los archivos subidos.
// Usamos "path.resolve" para obtener una ruta absoluta a partir
// de la carpeta raíz del proyecto.
const UPLOADS_DIR = path.resolve('src', 'uploads');

// Antes de configurar Multer, nos aseguramos de que la carpeta de destino exista.
// Si no existe, la creamos. Esto evita errores cuando Multer intente guardar archivos.
if (!fs.existsSync(UPLOADS_DIR)) {
  // "mkdirSync" crea el directorio. El flag { recursive: true } asegura
  // que se creen también directorios intermedios si hiciera falta.
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('[Multer] Carpeta de uploads creada en:', UPLOADS_DIR);
}

// Aquí definimos el "storage" (almacenamiento) que Multer usará.
// En este caso usamos "diskStorage", que significa que los archivos
// se guardarán directamente en el sistema de archivos local.
const storage = multer.diskStorage({
  // La función "destination" decide en qué carpeta se guardará cada archivo.
  // Recibe la request, el archivo y un callback.
  destination: (_req, _file, cb) => {
    // Llamamos al callback con:
    //  - null para indicar que no hubo error.
    //  - UPLOADS_DIR como carpeta de destino.
    cb(null, UPLOADS_DIR);
  },
  // La función "filename" decide el nombre final del archivo guardado.
  filename: (_req, file, cb) => {
    // Obtenemos la extensión original del archivo (por ejemplo, ".jpg", ".png").
    const ext = path.extname(file.originalname);

    // Obtenemos el nombre base original SIN la extensión (por ejemplo, "foto01").
    const baseName = path.basename(file.originalname, ext);

    // Generamos un sufijo único usando la fecha actual en milisegundos.
    const timestamp = Date.now();

    // Construimos un nombre de archivo nuevo combinando el nombre base,
    // el timestamp y la extensión original.
    //
    // Ejemplo:
    //   original: "avatar.png"
    //   result:   "avatar-1700000000000.png"
    const safeFilename = `${baseName}-${timestamp}${ext}`;

    // Llamamos al callback con:
    //  - null para indicar que no hubo error.
    //  - safeFilename como nombre final del archivo.
    cb(null, safeFilename);
  }
});

// Definimos un "fileFilter" opcional para aceptar solo ciertos tipos de archivo.
// Esta función nos permite, por ejemplo, restringir subidas solo a imágenes.
function fileFilter(_req, file, cb) {
  // "file.mimetype" nos dice el tipo MIME del archivo, por ejemplo:
  //  - "image/png"
  //  - "image/jpeg"
  //  - "application/pdf"
  //
  // Para este MVP vamos a aceptar solo imágenes (png, jpg, jpeg, webp, gif).
  if (!file.mimetype.startsWith('image/')) {
    // Si el archivo no es una imagen, indicamos un error.
    // El primer argumento del callback es un error (podría ser null si no hay error).
    const error = new Error('FILE_TYPE_NOT_ALLOWED');
    return cb(error, false);
  }

  // Si el archivo es aceptable, llamamos al callback con:
  //  - null para indicar que no hay error.
  //  - true para aceptar el archivo.
  cb(null, true);
}

// Finalmente, creamos una instancia de Multer con la configuración definida.
//  - "storage" define dónde y cómo se guardan los archivos.
//  - "fileFilter" define qué archivos aceptamos.
//  - "limits" nos permite poner límites de tamaño para evitar abusos.
export const uploader = multer({
  storage,
  fileFilter,
  limits: {
    // max size ~ 5MB por archivo, se puede ajustar según necesidades.
    fileSize: 5 * 1024 * 1024
  }
});

// Además, exportamos la constante UPLOADS_DIR por si en algún momento
// queremos usarla en otros módulos (por ejemplo, para servir archivos estáticos).
export { UPLOADS_DIR };
