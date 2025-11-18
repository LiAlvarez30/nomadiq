// Importamos Zod para definir los esquemas de validación
// de los destinos turísticos.
import { z } from 'zod';

// Esquema de creación de destino (para POST /api/destinations).
export const destinationCreateSchema = z.object({
  // Nombre del destino (ej: "Bariloche", "Barcelona").
  name: z.string().min(2).max(120),

  // País del destino (puede ser nombre o código).
  country: z.string().min(2).max(120),

  // Resumen descriptivo del destino.
  summary: z.string().min(10).max(500),

  // Coordenadas geográficas del destino.
  coords: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),

  // Lista de etiquetas, por ejemplo ["playa", "montaña"].
  tags: z.array(z.string()).default([]),

  // Lista de URLs de imágenes.
  images: z.array(z.string().url()).default([])
});

// Esquema de actualización parcial (PATCH /api/destinations/:id).
// Todos los campos se vuelven opcionales para permitir cambios parciales.
export const destinationUpdateSchema = destinationCreateSchema.partial();

// Normalizador de salida para la API pública.
// Se asegura de devolver un objeto consistente con los campos
// que nos interesan para el frontend o la documentación.
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
