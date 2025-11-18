// Importamos Zod para definir el esquema de validación de actividades.
import { z } from 'zod';

// priceRange: rango simple de precios para el MVP.
const priceRangeEnum = z.enum(['free', 'low', 'medium', 'high']);

// Esquema de creación de actividad (POST /api/activities).
export const activityCreateSchema = z.object({
  // ID del destino al que pertenece esta actividad.
  destinationId: z.string().min(1, 'destinationId es requerido'),

  // Nombre de la actividad (ej: "Tour en bici por la ciudad").
  name: z.string().min(2).max(120),

  // Categoría de la actividad (ej: "museo", "gastronomía", "parque").
  category: z.string().min(2).max(80),

  // Rango de precio (free, low, medium, high).
  priceRange: priceRangeEnum,

  // Horarios de apertura en formato texto (opcional).
  openingHours: z
    .string()
    .min(1)
    .max(200)
    .optional(),

  // Coordenadas geográficas (opcional).
  coords: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
    .optional(),

  // Puntuación de la actividad (0 a 5).
  rating: z.number().min(0).max(5).optional(),

  // Cantidad de reseñas (entero no negativo).
  reviewsCount: z.number().int().min(0).optional(),

  // Lista de imágenes (URLs).
  images: z.array(z.string().url()).default([])
});

// Esquema de actualización parcial (PATCH /api/activities/:id).
export const activityUpdateSchema = activityCreateSchema.partial();

// Normalizador de salida para la API pública.
// Nos aseguramos de que los campos numéricos tengan valores razonables
// y que listas nulas se conviertan en arrays vacíos.
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
    reviewsCount:
      typeof a.reviewsCount === 'number' ? a.reviewsCount : 0,
    images: a.images || [],
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  };
}
