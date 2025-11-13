import { z } from 'zod';

// Esquema de creación (POST)
export const destinationCreateSchema = z.object({
  name: z.string().min(2).max(120),
  country: z.string().min(2).max(120),
  summary: z.string().min(10).max(500),
  coords: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([])
});

// Esquema de actualización (PATCH/PUT)
export const destinationUpdateSchema = destinationCreateSchema.partial();

// Normalizador de salida
export function toPublicDestination(d) {
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    summary: d.summary,
    coords: d.coords,
    tags: d.tags || [],
    images: d.images || [],
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}
