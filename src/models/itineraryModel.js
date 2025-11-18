// Importamos Zod, la librería que usamos en todo el proyecto
// para validar y describir la forma de los datos que entran a la API.
import { z } from 'zod';

//
// -----------------------------------------------------------------------------
// ESQUEMAS INTERNOS: CÓMO SE VE UN ITINERARIO POR DENTRO
// -----------------------------------------------------------------------------
//
// La idea base es que un itinerario está compuesto por:
//
// - Un viaje (tripId)
// - Una serie de días
// - Dentro de cada día, varios "bloques" de actividades (mañana/tarde/noche)
// - Estos bloques pueden estar vinculados a activities, o ser libres
//
// Esto sirve tanto para:
//  - El motor de REGLAS (modo offline)
//  - El motor de IA (que enriquecerá los textos y descripciones)
//

// timeOfDayEnum define en qué momento del día sucede cada bloque de actividad.
// Esto facilita al front agrupar y mostrar el itinerario de forma visual.
const timeOfDayEnum = z.enum([
  'morning',   // mañana
  'afternoon', // tarde
  'evening',   // noche
  'full_day'   // todo el día
]);

// Cada "periodo" o "bloque" representa una parte del día dentro del itinerario.
// Ejemplo: "mañana: city tour", "tarde: museo y café".
const itineraryPeriodSchema = z.object({
  // Momento del día en el que ocurre este bloque.
  timeOfDay: timeOfDayEnum.default('full_day'),

  // Título corto de lo que se hará en este bloque.
  // Ejemplos: "City tour por el centro", "Tarde de nieve en el cerro".
  title: z
    .string()
    .min(3, 'El título de la actividad debe tener al menos 3 caracteres'),

  // Descripción opcional más narrativa.
  // Aquí la IA puede enriquecer con detalles, contexto y recomendaciones.
  description: z
    .string()
    .min(3)
    .max(2000)
    .optional(),

  // activityId es un enlace opcional a una actividad de la colección "activities".
  // Sirve para conectar el itinerario con actividades concretas de la base de datos.
  activityId: z
    .string()
    .min(1)
    .optional(),

  // Notas adicionales que pueden ser útiles para el viajero.
  // Ejemplos: "Llevar abrigo", "Comprar entradas anticipadas".
  notes: z
    .string()
    .min(1)
    .max(1000)
    .optional(),

  // Costo estimado de este bloque, en la misma moneda que el viaje.
  // No es obligatorio, pero abre la puerta a sumar presupuesto por día.
  estimatedCost: z
    .number()
    .nonnegative()
    .optional()
});

// Cada día del itinerario está compuesto por:
// - Un número de día (1, 2, 3...)
// - Una fecha opcional (texto)
// - Una lista de periodos (bloques de actividades).
const itineraryDaySchema = z.object({
  // Número de día dentro del viaje.
  day: z
    .number()
    .int()
    .min(1, 'El número de día debe ser al menos 1'),

  // Fecha opcional asociada a este día.
  // Podría ser "2025-07-15" o una fecha ISO completa.
  date: z
    .string()
    .min(4)
    .optional(),

  // Lista de bloques de actividades para este día.
  // Para que un día tenga sentido, debe tener al menos 1 bloque.
  periods: z
    .array(itineraryPeriodSchema)
    .min(1, 'Cada día debe tener al menos una actividad o bloque')
});

// Estructura general del campo "data" de un itinerario.
// Aquí es donde realmente vive el "plan de viaje".
const itineraryDataSchema = z.object({
  // Lista de días que componen el itinerario.
  days: z
    .array(itineraryDaySchema)
    .min(1, 'El itinerario debe contener al menos un día')
});

//
// -----------------------------------------------------------------------------
// ESQUEMAS PRINCIPALES DEL MODELO ITINERARIO
// -----------------------------------------------------------------------------
//
// Aclaración importante:
// - A nivel BASE DE DATOS, siempre queremos que existan:
//   tripId, generatedAt, data, aiModelUsed, score (aunque algunos sean null).
// - A nivel REQUEST (lo que manda el front), permitimos que algunos vengan
//   como opcionales porque los va a completar el backend en el servicio.
//
// Por ejemplo:
// - El motor de reglas puede crear un itinerario con:
//   tripId + data, y el servicio completa generatedAt, aiModelUsed = "rules".
// - Luego el motor de IA puede actualizar el mismo itinerario y setear
//   aiModelUsed = "gemini-1.5-free" y score = 90.
//

// Esquema de creación de itinerario (cuando el backend genera uno nuevo).
export const itineraryCreateSchema = z.object({
  // ID del trip al que pertenece este itinerario.
  // Este campo es CLAVE para relacionar itinerarios con viajes.
  tripId: z
    .string()
    .min(1, 'tripId es requerido'),

  // Fecha/hora de generación del itinerario.
  // En la práctica, el servicio suele completarlo con "new Date().toISOString()"
  // si no viene desde el frontend.
  generatedAt: z
    .string()
    .min(4)
    .optional(),

  // Estructura completa del itinerario:
  // días, periodos, actividades, notas, etc.
  data: itineraryDataSchema,

  // Nombre del modelo o estrategia utilizada para generar el itinerario.
  // Ejemplos:
  //  - "rules"              -> solo motor de reglas offline
  //  - "rules+gemini-free"  -> reglas + enriquecimiento con IA
  //  - "manual"             -> creado a mano desde el panel
  aiModelUsed: z
    .string()
    .min(1)
    .optional(),

  // Puntuación opcional, por ejemplo de 0 a 100, para medir
  // qué tan bien se adapta el itinerario a los intereses del usuario.
  score: z
    .number()
    .min(0)
    .max(100)
    .optional()
});

// Esquema de actualización (PATCH) de un itinerario.
// Todos los campos son opcionales, porque en un PATCH solo se envían
// los campos que se desean modificar.
export const itineraryUpdateSchema = itineraryCreateSchema.partial();

//
// -----------------------------------------------------------------------------
// NORMALIZADOR DE SALIDA PARA LA API PÚBLICA
// -----------------------------------------------------------------------------
//
// Esta función toma un documento de Firestore y lo convierte al formato
// final que queremos exponer desde la API. De esta forma:
//
// - El frontend siempre recibe la misma estructura.
// - Si cambiamos algo por dentro en Firestore, solo tocamos aquí.
//

export function toPublicItinerary(it) {
  // Si no existe (null/undefined), devolvemos null para ser consistentes.
  if (!it) return null;

  return {
    // ID del documento en Firestore.
    id: it.id,

    // ID del trip al que pertenece este itinerario.
    tripId: it.tripId,

    // Fecha/hora en la que se generó este itinerario.
    // Si por algún error no existe, devolvemos null por seguridad.
    generatedAt: it.generatedAt || null,

    // Estructura completa del itinerario. Si por algún motivo no viniera,
    // devolvemos un "esqueleto" vacío para no romper al frontend.
    data: it.data || { days: [] },

    // Qué modelo o estrategia se usó para generarlo.
    aiModelUsed: it.aiModelUsed || null,

    // Puntuación de calidad o afinidad si existe, o null si no está definida.
    score:
      typeof it.score === 'number'
        ? it.score
        : null,

    // Timestamps de auditoría (los maneja Firestore desde la capa de servicio).
    createdAt: it.createdAt,
    updatedAt: it.updatedAt
  };
}
