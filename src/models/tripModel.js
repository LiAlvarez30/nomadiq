import { z } from 'zod';

// Estado del viaje dentro de NomadIQ
export const tripStatusEnum = z.enum([
  'draft',       // borrador, aún sin confirmar
  'planned',     // planificado (fechas y datos definidos)
  'in_progress', // viaje en curso
  'completed',   // viaje finalizado
  'cancelled'    // viaje cancelado
]);

// Esquema de creación (POST)
export const tripCreateSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
  title: z.string().min(3).max(150),
  startDate: z.string().min(1, 'startDate es requerido'), // ISO date (YYYY-MM-DD)
  endDate: z.string().min(1, 'endDate es requerido'),     // ISO date (YYYY-MM-DD)
  budget: z.number().nonnegative().optional(),            // puede ser opcional
  interests: z.array(z.string()).default([]),             // ej: ["museos", "gastronomía"]
  status: tripStatusEnum.default('draft')
});

// Esquema de actualización (PATCH)
export const tripUpdateSchema = tripCreateSchema.partial();

// Normalizador de salida para la API pública
export function toPublicTrip(t) {
  if (!t) return null;
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    startDate: t.startDate,
    endDate: t.endDate,
    budget: typeof t.budget === 'number' ? t.budget : null,
    interests: t.interests || [],
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  };
}
