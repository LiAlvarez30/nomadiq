// src/services/itineraryAiService.js
// ----------------------------------
// Este archivo define un "servicio de IA" para NomadIQ.
// En esta primera versión NO llama a un modelo externo real,
// sino que simula el enriquecimiento de texto de forma local.
//
// La idea es:
//  - Recibir un itinerario ya generado por REGLAS.
//  - Recibir datos del trip y del usuario (opcional).
//  - "Enriquecer" las descripciones con texto más humano y cálido.
//  - Devolver un nuevo objeto { data, aiModelUsed, score } listo
//    para ser guardado en Firestore a través de updateItinerary.
//
// Más adelante, se puede reemplazar la parte interna por una llamada real
// a un modelo generativo (Gemini, Hugging Face, etc.) sin cambiar la firma
// pública de la función principal.

// Importamos tipos auxiliares de Node si hiciera falta (en este caso no).
// No necesitamos Firestore aquí porque el guardado lo hace itineraryService.
// Por eso este servicio solo transforma datos en memoria.

// Nombre por defecto del "modelo" que vamos a usar en esta simulación.
// Esto se guardará en el campo aiModelUsed del itinerario.
const DEFAULT_AI_MODEL_NAME =
  process.env.AI_MODEL_NAME || 'local-rules-enrichment-v1';

//
// -----------------------------------------------------------------------------
// Función auxiliar: construir un breve "perfil" del viajero
// -----------------------------------------------------------------------------
// A partir de los datos del trip y del usuario, armamos una frase corta
// que podamos reutilizar para enriquecer las descripciones.
//
function buildTravelerProfile({ trip, user }) {
  // Obtenemos el nombre de la persona viajera, si está disponible.
  const travelerName = user?.name || 'la persona viajera';

  // Tomamos algunos intereses del trip, si están definidos.
  const interests = Array.isArray(trip?.interests) ? trip.interests : [];

  // Si hay intereses, armamos una frase con ellos.
  if (interests.length > 0) {
    const mainInterests = interests.slice(0, 3).join(', ');
    return `${travelerName}, que disfruta especialmente de ${mainInterests}`;
  }

  // Si no hay intereses, devolvemos una frase más genérica.
  return `${travelerName}, que busca una experiencia equilibrada entre descanso y descubrimiento`;
}

//
// -----------------------------------------------------------------------------
// Función auxiliar: enriquecer la descripción de un bloque (period)
// -----------------------------------------------------------------------------
// Dado un bloque del itinerario (period) y el perfil de viajero,
// construimos una descripción más cálida y narrativa.
//
function enrichPeriodDescription({ period, dayNumber, trip, travelerProfile }) {
  // Empezamos por la descripción original del itinerario por reglas.
  const baseDescription = period.description || '';

  // Tomamos el título del viaje, o un string por defecto si no existiera.
  const tripTitle = trip?.title || 'el viaje';

  // Definimos una frase según el momento del día para que suene más humano.
  let momentSentence = '';

  switch (period.timeOfDay) {
    case 'morning':
      momentSentence =
        'Es un buen momento para empezar el día con calma, respirando el ambiente del lugar.';
      break;
    case 'afternoon':
      momentSentence =
        'La tarde invita a seguir explorando sin apuro, combinando movimiento y pequeños descansos.';
      break;
    case 'evening':
      momentSentence =
        'La noche es ideal para bajar revoluciones y disfrutar de la ciudad iluminada.';
      break;
    default:
      momentSentence =
        'Este momento del día es perfecto para conectar con el lugar y contigo misma/o.';
      break;
  }

  // Pequeña introducción que hace referencia al día del viaje.
  const dayIntro = `Día ${dayNumber} de tu viaje "${tripTitle}".`;

  // Usamos el perfil del viajero para darle un toque personal.
  const travelerSentence = `Pensado para ${travelerProfile}.`;

  // Construimos el texto final combinando:
  //  - la descripción original
  //  - el contexto del día
  //  - el momento del día
  //  - el perfil del viajero
  //
  // Intentamos evitar repeticiones muy obvias pero, al ser un MVP,
  // es normal que todavía no sea perfecto. A futuro, aquí es donde
  // una IA real podría hacer un texto mucho más sofisticado.
  const enriched =
    `${baseDescription} ` +
    `${dayIntro} ` +
    `${momentSentence} ` +
    `${travelerSentence}`;

  return enriched.trim();
}

//
// -----------------------------------------------------------------------------
// Función principal interna: enriquecimiento local (sin IA externa real)
// -----------------------------------------------------------------------------
// Esta función recorre todos los días y bloques del itinerario
// y construye una nueva estructura "data" con descripciones mejoradas.
//
function buildLocallyEnrichedData({ itinerary, trip, user }) {
  // Extraemos los días del itinerario original.
  const originalDays = Array.isArray(itinerary.data?.days)
    ? itinerary.data.days
    : [];

  // Construimos un perfil de viajero a partir del trip y el usuario.
  const travelerProfile = buildTravelerProfile({ trip, user });

  // Creamos un nuevo arreglo de días enriquecidos.
  const enrichedDays = originalDays.map((day) => {
    // Aseguramos un número de día válido.
    const dayNumber =
      typeof day.day === 'number' && day.day > 0 ? day.day : 1;

    // Aseguramos que haya una lista de periodos.
    const originalPeriods = Array.isArray(day.periods)
      ? day.periods
      : [];

    // Enriquecemos cada bloque (period) individualmente.
    const enrichedPeriods = originalPeriods.map((period) => {
      // Copiamos el bloque original para no perder campos (como activityId).
      const basePeriod = { ...period };

      // Generamos una nueva descripción enriquecida, manteniendo la original
      // pero sumando contexto, emociones y referencia al viajero.
      const newDescription = enrichPeriodDescription({
        period: basePeriod,
        dayNumber,
        trip,
        travelerProfile
      });

      // Devolvemos el bloque original con la descripción sobrescrita.
      return {
        ...basePeriod,
        description: newDescription
      };
    });

    // Construimos el nuevo día, manteniendo date y cualquier otro campo.
    return {
      ...day,
      periods: enrichedPeriods
    };
  });

  // Devolvemos la nueva estructura "data" enriquecida.
  return {
    days: enrichedDays
  };
}

//
// -----------------------------------------------------------------------------
// Función pública principal: enrichItineraryWithAI
// -----------------------------------------------------------------------------
// Esta es la función que el controller va a llamar.
//
// Recibe:
//  - itinerary: el itinerario ya generado por reglas.
//  - trip: el viaje asociado (para conocer título, intereses, etc.).
//  - user: usuario autenticado (para personalizar textos).
//  - options: objeto opcional con preferencias (tono, idioma, modelo, etc.).
//
// Devuelve un objeto:
//  {
//    data: ...,          // nueva estructura de itinerario enriquecida
//    aiModelUsed: ...,   // nombre del "modelo" utilizado
//    score: ...          // número opcional para indicar calidad/confianza
//  }
//
// En esta versión la "IA" es local. En el futuro, aquí se podría:
//  - Construir un prompt de texto.
//  - Llamar a un modelo externo (Gemini, Hugging Face, etc.).
//  - Parsear la respuesta y transformarla en el formato de "data".
//
export async function enrichItineraryWithAI({
  itinerary,
  trip,
  user,
  options = {}
}) {
  // Leemos un posible nombre de modelo enviado por el cliente,
  // o usamos el valor por defecto definido arriba.
  const modelName =
    typeof options.modelHint === 'string' && options.modelHint.trim().length > 0
      ? options.modelHint.trim()
      : DEFAULT_AI_MODEL_NAME;

  // En un escenario real, aquí tendríamos algo como:
  //
  //   const prompt = buildPromptForExternalModel({ itinerary, trip, user, options });
  //   const externalResponse = await callExternalAIModel({ prompt, modelName });
  //   const enrichedData = parseExternalResponseToItineraryData(externalResponse);
  //
  // Pero, como estamos construyendo un MVP académico y queremos que
  // el proyecto funcione sin depender de claves externas ni facturación,
  // vamos a usar el enriquecimiento local.
  //
  // Esto nos permite demostrar la arquitectura híbrida:
  //  - Motor REGLAS -> genera estructura base.
  //  - "Modo IA" (simulado) -> mejora textos y da una sensación más humana.
  const enrichedData = buildLocallyEnrichedData({
    itinerary,
    trip,
    user
  });

  // Asignamos una "puntuación" fija, a modo de ejemplo.
  // En un caso real, esta podría venir de la IA o de alguna heurística.
  const score = 90;

  // Log simple para depuración y para cumplir con la rúbrica de logs.
  console.log(
    '[Itineraries][AI] enrichItineraryWithAI -> enriched itinerary',
    itinerary.id,
    'using model',
    modelName
  );

  // Devolvemos el paquete listo para ser guardado por el controller.
  return {
    data: enrichedData,
    aiModelUsed: modelName,
    score
  };
}
