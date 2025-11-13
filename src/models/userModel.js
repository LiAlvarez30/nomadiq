import { z } from 'zod';

export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2).max(80),
  role: z.enum(['user','admin']).default('user'),
  avatarUrl: z.string().url().optional()
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Normalizador de salida (no exponer hash)
export function toPublicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}
