import { z } from 'zod';

// priceRange: rango simple para el MVP
const priceRangeEnum = z.enum(['free', 'low', 'medium', 'high']);

// Esquema de creación (POST)
export const activityCreateSchema = z.object({
  destinationId: z.string().min(1, 'destinationId es requerido'),
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(80), // p.ej. 'museo', 'gastronomía', 'parque'
  priceRange: priceRangeEnum,
  openingHours: z.string().min(1).max(200).optional(), // simplificado a string legible
  coords: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).default([])
});

// Esquema de actualización (PATCH)
export const activityUpdateSchema = activityCreateSchema.partial();

// Normalizador de salida para API pública
export function toPublicActivity(a) {
  if (!a) return null;
  return {
    id: a.id,
    destinationId: a.destinationId,
    name: a.name,
    category: a.category,
    priceRange: a.priceRange,
    openingHours: a.openingHours || null,
    coords: a.coords || null,
    rating: typeof a.rating === 'number' ? a.rating : null,
    reviewsCount: typeof a.reviewsCount === 'number' ? a.reviewsCount : 0,
    images: a.images || [],
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}
