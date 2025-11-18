// Importamos Zod para definir los esquemas de validación de trips (viajes).
import { z } from 'zod';

// Estado posible del viaje dentro de NomadIQ.
// Esto nos ayuda a mantener consistencia en la lógica de negocio.
export const tripStatusEnum = z.enum([
  'draft',       // borrador, aún sin confirmar
  'planned',     // planificado (fechas definidas)
  'in_progress', // viaje en curso
  'completed',   // viaje finalizado
  'cancelled'    // viaje cancelado
]);

// Definimos los campos base de un trip, sin incluir userId.
// userId SIEMPRE vendrá del token (req.user) y se agrega en el controller,
// nunca lo envía el frontend.
const tripBaseFields = {
  // Título del viaje (ej: "Escapada a Bariloche en invierno").
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150),

  // Fecha de inicio del viaje (como string).
  // Podés usar formato ISO "YYYY-MM-DD" o fecha ISO completa.
  startDate: z.string().min(1, 'startDate es requerido'),

  // Fecha de fin del viaje.
  endDate: z.string().min(1, 'endDate es requerido'),

  // Presupuesto estimado del viaje.
  // Usamos preprocess para aceptar números o strings numéricos.
  budget: z.preprocess(
    (val) => {
      // Si no viene nada, lo dejamos como undefined (campo opcional).
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      // Si no se puede convertir a número, se devolverá tal cual
      // y Zod lo marcará como error de tipo.
      return Number.isNaN(num) ? val : num;
    },
    z
      .number()
      .nonnegative('El presupuesto no puede ser negativo')
      .optional()
  ),

  // Intereses principales del viaje, por ejemplo ["museos", "gastronomía"].
  interests: z.array(z.string()).default([]),

  // Estado del viaje usando el enum definido arriba.
  status: tripStatusEnum.default('draft')
};

// Esquema de creación (POST /api/trips).
// NO incluye userId porque viene del token.
export const tripCreateSchema = z.object({
  ...tripBaseFields
});

// Esquema de actualización (PATCH /api/trips/:id).
// Todos los campos son opcionales, permitiendo un patch parcial.
export const tripUpdateSchema = z.object({
  ...tripCreateSchema.partial().shape
});

// Normalizador de salida para la API pública.
// Ensamblamos el objeto trip que verá el frontend, incluyendo userId
// y timestamps.
export function toPublicTrip(t) {
  if (!t) return null;

  return {
    id: t.id,                                      // ID del trip en Firestore
    userId: t.userId,                              // ID del usuario dueño
    title: t.title,                                // título del viaje
    startDate: t.startDate,                        // fecha de inicio
    endDate: t.endDate,                            // fecha de fin
    budget: typeof t.budget === 'number'
      ? t.budget
      : null,                                      // presupuesto (o null)
    interests: t.interests || [],                  // intereses (array)
    status: t.status,                              // estado del viaje
    createdAt: t.createdAt,                        // fecha de creación
    updatedAt: t.updatedAt                         // fecha de actualización
  };
}
