// Importamos la instancia de Firestore que ya configuraste
// en src/config/firebase.js. Este "db" es el que nos permite
// leer y escribir documentos en la base de datos.
import { db } from '../config/firebase.js';

// Nombre de la colección en Firestore donde vamos a guardar
// todos los itinerarios generados por NomadIQ.
const COL = 'itineraries';

//
// -----------------------------------------------------------------------------
// CREATE - Crear un nuevo itinerario
// -----------------------------------------------------------------------------
//
// Esta función se usará, por ejemplo, cuando el motor de REGLAS genere
// un itinerario para un trip, o cuando la IA lo enriquezca y queramos
// guardar una nueva versión.
//
export async function createItinerary(data) {
  // Obtenemos la fecha/hora actual en formato ISO.
  const now = new Date().toISOString();

  // Preparamos una nueva referencia de documento en la colección "itineraries".
  // Si no pasamos ID, Firestore genera uno automáticamente.
  const docRef = db.collection(COL).doc();

  // Armamos el "payload" que vamos a guardar en Firestore.
  // Aquí definimos exactamente qué campos tendrá cada itinerario.
  const payload = {
    // ID del trip al que pertenece este itinerario.
    tripId: data.tripId,

    // Momento en el que se generó el itinerario.
    // Si no viene desde "data", usamos la fecha actual.
    generatedAt: data.generatedAt || now,

    // Estructura completa del itinerario (días, periodos, etc.).
    // En este punto asumimos que ya fue validado por Zod (itineraryCreateSchema).
    data: data.data,

    // Modelo o estrategia usada para generarlo.
    // Si no viene definido, asumimos "rules" como modo base (motor de reglas).
    aiModelUsed: data.aiModelUsed || 'rules',

    // Puntuación opcional. Si no es un número, la guardamos como null.
    score:
      typeof data.score === 'number'
        ? data.score
        : null,

    // Timestamps de auditoría.
    createdAt: now,
    updatedAt: now
  };

  // Guardamos el documento en Firestore.
  await docRef.set(payload);

  // Log simple para depuración (sirve para la rúbrica de logs en consola).
  console.log('[Itineraries] createItinerary -> creado', docRef.id);

  // Devolvemos el itinerario recién creado, incluyendo el ID generado.
  return {
    id: docRef.id,
    ...payload
  };
}

//
// -----------------------------------------------------------------------------
// READ - Obtener un itinerario por ID
// -----------------------------------------------------------------------------
//
// Esta función recupera un único itinerario por su ID de documento.
//
export async function getItineraryById(id) {
  // Referencia al documento dentro de la colección "itineraries".
  const snap = await db.collection(COL).doc(id).get();

  // Si el documento no existe, devolvemos null
  // y dejamos que el controller devuelva un 404.
  if (!snap.exists) {
    console.log('[Itineraries] getItineraryById -> NOT_FOUND', id);
    return null;
  }

  // Si existe, devolvemos un objeto plano con "id" + sus datos.
  const data = { id: snap.id, ...snap.data() };

  console.log('[Itineraries] getItineraryById -> ok', id);
  return data;
}

//
// -----------------------------------------------------------------------------
// LIST - Listar itinerarios (con filtros opcionales)
// -----------------------------------------------------------------------------
//
// Esta función permite listar itinerarios, normalmente filtrando por tripId.
// También soporta "limit" y paginación simple con startAfterId.
//
export async function listItineraries({
  tripId,
  limit = 20,
  startAfterId
} = {}) {
  // Comenzamos la query ordenando por fecha de creación (más recientes primero).
  let q = db.collection(COL).orderBy('createdAt', 'desc');

  // Si nos pasan un tripId, filtramos solo los itinerarios de ese viaje.
  if (tripId) {
    q = q.where('tripId', '==', tripId);
  }

  // Paginación: si nos pasan un startAfterId, buscamos ese doc y usamos startAfter.
  if (startAfterId) {
    const startSnap = await db.collection(COL).doc(startAfterId).get();
    if (startSnap.exists) {
      q = q.startAfter(startSnap);
    }
  }

  // Ejecutamos la query con el límite indicado.
  const snap = await q.limit(limit).get();

  // Convertimos los documentos de Firestore a objetos planos con id + data.
  const items = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(
    '[Itineraries] listItineraries -> count',
    items.length,
    'tripId:',
    tripId || '(all)'
  );

  return items;
}

//
// -----------------------------------------------------------------------------
// UPDATE - Actualizar (PATCH) un itinerario existente
// -----------------------------------------------------------------------------
//
// Esta función aplica cambios parciales sobre un itinerario existente.
// Solo actualiza los campos que estén presentes en "data".
//
export async function updateItinerary(id, data) {
  // Obtenemos la referencia al documento.
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();

  // Si no existe, informamos con null.
  if (!snap.exists) {
    console.log('[Itineraries] updateItinerary -> NOT_FOUND', id);
    return null;
  }

  // Armamos el "patch" únicamente con los campos presentes en "data".
  const patch = {
    // Si viene tripId en data, lo incluimos en el patch.
    ...('tripId' in data ? { tripId: data.tripId } : {}),

    // Si viene generatedAt, actualizamos este campo.
    ...('generatedAt' in data ? { generatedAt: data.generatedAt } : {}),

    // Si viene data (estructura de itinerario), la actualizamos.
    ...('data' in data ? { data: data.data } : {}),

    // Si viene aiModelUsed, lo actualizamos.
    ...('aiModelUsed' in data ? { aiModelUsed: data.aiModelUsed } : {}),

    // Si viene score, validamos que sea número o lo dejamos en null.
    ...('score' in data
      ? {
          score:
            typeof data.score === 'number'
              ? data.score
              : null
        }
      : {}),

    // Siempre actualizamos updatedAt al momento actual.
    updatedAt: new Date().toISOString()
  };

  // Aplicamos el patch con merge:true para no sobreescribir campos no incluidos.
  await ref.set(patch, { merge: true });

  console.log('[Itineraries] updateItinerary -> ok', id);

  // Volvemos a leer el documento actualizado para devolver la versión final.
  const updated = await ref.get();
  return {
    id: updated.id,
    ...updated.data()
  };
}

//
// -----------------------------------------------------------------------------
// DELETE - Eliminar un itinerario
// -----------------------------------------------------------------------------
//
// Esta función elimina un itinerario por ID. Devuelve true si se borró,
// false si el documento no existía.
//
export async function deleteItinerary(id) {
  // Referencia al documento.
  const ref = db.collection(COL).doc(id);
  const snap = await ref.get();

  // Si no existe, informamos con false para que el controller devuelva 404.
  if (!snap.exists) {
    console.log('[Itineraries] deleteItinerary -> NOT_FOUND', id);
    return false;
  }

  // Si existe, lo eliminamos.
  await ref.delete();

  console.log('[Itineraries] deleteItinerary -> deleted', id);
  return true;
}
// -----------------------------------------------------------------------------
// MOTOR DE REGLAS BÁSICO PARA GENERAR ITINERARIOS (VERSIÓN REFINADA)
// -----------------------------------------------------------------------------
// Esta función NO guarda nada en la base de datos.
// Solo construye la estructura "data" del itinerario:
//
// {
//   days: [
//     { day, date, periods: [ { timeOfDay, title, description, activityId?, estimatedCost? } ] }
//   ]
// }
//
// Luego, esa estructura se pasa a createItinerary para guardarla en Firestore.
//
export function generateItineraryRules({ trip, activities = [] }) {
  // Intentamos calcular la cantidad de días del viaje a partir de startDate y endDate.
  // Si las fechas no son válidas, usamos un valor por defecto.
  let dayCount = 3; // valor por defecto si algo falla
  let startDateObj = null;

  try {
    // Creamos objetos Date con las fechas del trip.
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    // Si ambas fechas son válidas y end >= start, calculamos el rango de días.
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
      startDateObj = start;

      // Diferencia en milisegundos y luego la pasamos a días.
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

      // Limitamos el número de días a un máximo razonable (por ejemplo, 30).
      dayCount = Math.max(1, Math.min(diffDays, 30));
    }
  } catch {
    // Si algo falla en el cálculo de fechas, dejamos dayCount con el valor por defecto.
    startDateObj = null;
  }

  // Bloques horarios que usaremos para cada día.
  // Se pueden ajustar en el futuro si necesitás más o menos bloques.
  const timeSlots = ['morning', 'afternoon', 'evening'];

  // Número máximo de bloques por día (en este caso, igual al número de timeSlots).
  const maxActivitiesPerDay = timeSlots.length;

  // Tomamos los intereses del trip (si no es un array, usamos un array vacío).
  const interests = Array.isArray(trip.interests) ? trip.interests : [];

  // Si el trip tiene presupuesto total (budget), calculamos un presupuesto diario
  // y luego un presupuesto aproximado por bloque.
  const hasBudget =
    typeof trip.budget === 'number' && trip.budget > 0;

  const dailyBudget = hasBudget
    ? trip.budget / dayCount
    : null;

  const perSlotBudget = dailyBudget
    ? Math.round(dailyBudget / timeSlots.length)
    : null;

  // Extra: tratamos de sacar un "nombre de destino" más limpio a partir del título del trip.
  // Por ejemplo: "Viaje a Bariloche en invierno" -> "Bariloche en invierno".
  const destinationName = (() => {
    if (typeof trip.title !== 'string') return '';
    const cleaned = trip.title.replace(/^Viaje a\s+/i, '').trim();
    return cleaned || trip.title;
  })();

  // Construimos una frase corta a partir de los intereses,
  // para que las descripciones suenen más humanas.
  function buildInterestSentence() {
    if (!interests.length) return '';
    const picked = interests.slice(0, 2).join(' y ');
    return `, con actividades pensadas para quienes disfrutan de ${picked}`;
  }

  // Etiqueta amigable para el momento del día, en español.
  function timeOfDayLabel(timeOfDay) {
    switch (timeOfDay) {
      case 'morning':
        return 'la mañana';
      case 'afternoon':
        return 'la tarde';
      case 'evening':
        return 'la noche';
      default:
        return 'el día';
    }
  }

  // Función auxiliar para obtener una fecha en formato YYYY-MM-DD
  // sumando "offset" días a la fecha de inicio.
  function buildDateString(baseDate, offset) {
    if (!baseDate) return undefined;
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  // Array final de días del itinerario.
  const days = [];

  // Recorremos cada día del itinerario.
  for (let i = 0; i < dayCount; i++) {
    // Número de día (1-based).
    const dayNumber = i + 1;

    // Calculamos la fecha de este día, si tenemos startDate.
    const dateString = buildDateString(startDateObj, i);

    // Lista de bloques (periodos) para este día.
    const periods = [];

    // Índice base para seleccionar actividades de forma "repartida".
    const baseIndex = i * maxActivitiesPerDay;

    // Recorremos los bloques horarios definidos en timeSlots.
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      // Si alcanzamos el máximo permitido de bloques por día, cortamos.
      if (slotIndex >= maxActivitiesPerDay) break;

      // Momento del día (morning, afternoon, evening).
      const timeOfDay = timeSlots[slotIndex];
      const timeLabel = timeOfDayLabel(timeOfDay);

      // Seleccionamos una actividad desde la lista, si existen actividades.
      const activity =
        activities.length > 0
          ? activities[(baseIndex + slotIndex) % activities.length]
          : null;

      // Construimos el título del bloque.
      // Si hay actividad, usamos su nombre; si no, usamos un título genérico.
      const title = activity
        ? activity.name
        : `Explorar ${destinationName || trip.title}`;

      // Vamos armando la descripción como un arreglo de fragmentos de texto
      // para luego unirlos en una sola cadena.
      const descriptionParts = [];

      // Frase base: en qué momento del día y dónde.
      descriptionParts.push(
        `Bloque de ${timeLabel} en ${destinationName || trip.title}.`
      );

      // Si hay actividad concreta, añadimos información más detallada.
      if (activity) {
        descriptionParts.push(
          `Actividad sugerida: ${activity.name}.`
        );

        if (activity.category) {
          descriptionParts.push(
            `Categoría: ${activity.category}.`
          );
        }

        if (activity.priceRange) {
          descriptionParts.push(
            `Rango de precio aproximado: ${activity.priceRange}.`
          );
        }
      } else {
        // Si no hay actividad concreta, dejamos espacio para explorar libremente.
        descriptionParts.push(
          'Espacio libre para que el viajero descubra la ciudad a su propio ritmo.'
        );
      }

      // Añadimos la frase relacionada con los intereses del usuario, si existen.
      const interestSentence = buildInterestSentence();
      if (interestSentence) {
        descriptionParts.push(interestSentence);
      }

      // Si tenemos un presupuesto calculado por bloque, lo incluimos
      // como referencia muy simple (no es exacto, solo orientativo).
      if (perSlotBudget !== null) {
        descriptionParts.push(
          `Presupuesto sugerido para este bloque: aproximadamente ${perSlotBudget} unidades de la moneda del viaje.`
        );
      }

      // Unimos todas las partes de la descripción en un solo texto.
      const description = descriptionParts.join(' ');

      // Construimos el objeto "period" que se guardará en el itinerario.
      const period = {
        timeOfDay,
        title,
        description
      };

      // Si hay actividad asociada y tiene id, la vinculamos.
      if (activity && activity.id) {
        period.activityId = activity.id;
      }

      // Si calculamos un costo estimado por bloque, lo guardamos.
      if (perSlotBudget !== null) {
        period.estimatedCost = perSlotBudget;
      }

      // Agregamos este bloque a la lista de periodos del día.
      periods.push(period);
    }

    // Agregamos el día completo a la lista de días.
    days.push({
      day: dayNumber,
      date: dateString,
      periods
    });
  }

  // Devolvemos la estructura "data" completa para el itinerario.
  return { days };
}
