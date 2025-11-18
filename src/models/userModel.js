// Importamos Zod, la librería de validación de esquemas que usamos
// para asegurar que los datos que llegan desde el frontend tengan
// el formato correcto antes de guardarlos o procesarlos.
import { z } from 'zod';

// Esquema de validación para el registro de usuario.
// Se usa en POST /auth/register.
export const userRegisterSchema = z.object({
  // Email obligatorio en formato válido.
  email: z.string().email(),

  // Contraseña con un mínimo de 8 caracteres.
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),

  // Nombre del usuario, entre 2 y 80 caracteres.
  name: z.string().min(2).max(80),

  // Rol del usuario dentro de la app. Por ahora usamos solo 'user' o 'admin'.
  // Si no se envía, por defecto es 'user'.
  role: z.enum(['user', 'admin']).default('user'),

  // URL opcional de avatar del usuario.
  avatarUrl: z.string().url().optional()
});

// Esquema de validación para login de usuario.
// Se usa en POST /auth/login.
export const userLoginSchema = z.object({
  // Email en formato válido.
  email: z.string().email(),

  // Contraseña con mínimo de 8 caracteres.
  password: z.string().min(8)
});

// Normalizador de salida para usuarios.
// Se asegura de NO exponer el passwordHash al frontend.
export function toPublicUser(u) {
  // Si no hay usuario, devolvemos null directamente.
  if (!u) return null;

  // Extraemos passwordHash y dejamos el resto de campos.
  const { passwordHash, ...rest } = u;

  // Devolvemos el usuario "público" sin la contraseña en ningún formato.
  return rest;
}
