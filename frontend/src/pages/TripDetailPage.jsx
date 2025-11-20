// src/pages/TripDetailPage.jsx
//
// Esta pantalla muestra el detalle de UN viaje específico (Trip)
// y el flujo completo de generación de itinerario:
//
//   1) Carga el viaje desde el backend (GET /api/trips/:id)
//   2) Intenta cargar si ya existe un itinerario guardado para ese viaje
//      (GET /api/itineraries?tripId=...)
//   3) Permite generar un nuevo itinerario con el motor de REGLAS
//      (POST /api/trips/:id/generate-itinerary)
//   4) Permite ENRIQUECER ese itinerario usando el modo "IA local"
//      (POST /api/itineraries/:id/enrich-with-ai)
//
// El objetivo es mostrar claramente la arquitectura de IA híbrida:
//   - El motor de reglas siempre funciona aunque no haya IA externa.
//   - El enriquecimiento con IA es opcional y tiene fallback:
//       si falla, el itinerario base sigue estando disponible.

import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext.jsx';

// Función auxiliar para transformar un timeOfDay técnico
// en una etiqueta más humana para la UI.
function getTimeOfDayLabel(timeOfDay) {
  switch (timeOfDay) {
    case 'morning':
      return 'Mañana';
    case 'afternoon':
      return 'Tarde';
    case 'evening':
      return 'Noche';
    default:
      return 'Actividad';
  }
}

// Función auxiliar para mostrar de forma amigable la fuente del itinerario.
// Por ejemplo:
//   - "Motor de reglas"   → aiModelUsed === "rules"
//   - "IA local"          → cualquier otro valor (por ahora "local-ai-simulated")
function getItinerarySourceLabel(aiModelUsed) {
  if (!aiModelUsed || aiModelUsed === 'rules') {
    return 'Generado por el motor de reglas';
  }
  return 'Enriquecido con IA local';
}

// Componente principal de la página de detalle de viaje.
function TripDetailPage() {
  // Leemos el :id de la URL. Este es el ID del trip en el backend.
  const { id } = useParams();

  // Leemos token y user desde el contexto de autenticación.
  // El token es necesario para llamar a los endpoints protegidos.
  const { token, user } = useContext(AuthContext);

  // Estado para los datos del viaje.
  const [trip, setTrip] = useState(null);

  // Estados para la experiencia general de carga de la página.
  const [loading, setLoading] = useState(true);      // Mientras se carga el trip.
  const [error, setError] = useState(null);          // Errores al cargar el trip.

  // Estado para el itinerario generado (reglas o IA).
  const [generatedItinerary, setGeneratedItinerary] = useState(null);

  // Estados para la generación "base" por reglas.
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // Estados para el enriquecimiento con IA.
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState(null);

  // Flag para asegurarnos de que el intento de carga de itinerario inicial
  // (GET /api/itineraries?tripId=...) se ejecute solo una vez.
  const [initialItineraryLoaded, setInitialItineraryLoaded] = useState(false);

  // ---------------------------------------------------------------------------
  // 1) useEffect: cargar el viaje desde el backend
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Si no hay id en la URL, dejamos un error claro.
    if (!id) {
      setError('No se encontró el ID del viaje en la URL.');
      setLoading(false);
      return;
    }

    // Si no hay token, probablemente el usuario no esté autenticado.
    // Igual mostramos un mensaje claro.
    if (!token) {
      setError('Tu sesión no es válida. Iniciá sesión nuevamente.');
      setLoading(false);
      return;
    }

    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);

        // Llamada real al backend:
        //   GET /api/trips/:id
        const res = await apiClient.get(`/api/trips/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // El backend responde algo como:
        //   { ok: true, trip: { ... } }
        // o, en algunos casos, directamente el objeto trip.
        const tripData = res.data.trip || res.data;
        setTrip(tripData);

        console.log('Detalle de viaje cargado:', tripData);
      } catch (err) {
        console.error('Error al cargar el viaje:', err);

        if (err.response && err.response.data) {
          const apiError = err.response.data.error;

          if (apiError === 'NOT_FOUND' || apiError === 'TRIP_NOT_FOUND') {
            setError('No encontramos este viaje. Puede que haya sido eliminado.');
          } else if (apiError === 'UNAUTHORIZED' || apiError === 'INVALID_TOKEN') {
            setError('No tenés permiso para ver este viaje. Iniciá sesión nuevamente.');
          } else {
            setError('Ocurrió un error al cargar el viaje. Probá de nuevo en unos minutos.');
          }
        } else {
          setError(
            'No pudimos conectarnos con el servidor para cargar los datos del viaje.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id, token]);

  // ---------------------------------------------------------------------------
  // 2) useEffect: intentar cargar un itinerario existente para este viaje
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Si ya intentamos cargar el itinerario inicial, no lo hacemos de nuevo.
    if (initialItineraryLoaded) return;

    // Necesitamos tanto id de viaje como token.
    if (!id || !token) return;

    const fetchExistingItinerary = async () => {
      try {
        setInitialItineraryLoaded(true);

        console.log('Buscando itinerarios existentes para el viaje:', id);

        // GET /api/itineraries?tripId=...&limit=1
        const res = await apiClient.get('/api/itineraries', {
          params: { tripId: id, limit: 1 },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // El backend debería responder algo como:
        //   { ok: true, count: N, itineraries: [ ... ] }
        const itineraries = res.data.itineraries || res.data.items || [];

        if (Array.isArray(itineraries) && itineraries.length > 0) {
          // Tomamos el primero (el más reciente, según cómo liste el backend).
          const existing = itineraries[0];
          setGeneratedItinerary(existing);

          console.log('Itinerario existente encontrado:', existing);
        } else {
          console.log('No hay itinerarios previos para este viaje.');
        }
      } catch (err) {
        console.error('Error al buscar itinerarios existentes:', err);
        // No consideramos esto un error "fatal" para la página:
        // simplemente mostraremos el botón para generar uno nuevo.
      }
    };

    fetchExistingItinerary();
  }, [id, token, initialItineraryLoaded]);

  // ---------------------------------------------------------------------------
  // Handler: generar un nuevo itinerario usando el motor de reglas
  // ---------------------------------------------------------------------------
  const handleGenerateItinerary = async () => {
    try {
      // Limpiamos errores anteriores de generación y enriquecimiento.
      setGenerateError(null);
      setEnrichError(null);
      setGenerating(true);

      if (!token) {
        setGenerateError('Tu sesión no es válida. Iniciá sesión nuevamente.');
        setGenerating(false);
        return;
      }

      console.log('Generando itinerario para el viaje:', id);

      // Llamada real al backend:
      //   POST /api/trips/:id/generate-itinerary
      //
      // En esta primera versión no enviamos destinationId en el body.
      // El backend tiene un esquema donde destinationId es opcional,
      // así que un body vacío {} es válido. Si más adelante sumamos
      // un selector de destino, podríamos enviar destinationId aquí.
      const res = await apiClient.post(
        `/api/trips/${id}/generate-itinerary`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Respuesta esperada:
      //   { ok: true, itinerary: { ... } }
      const itinerary = res.data.itinerary || res.data;

      setGeneratedItinerary(itinerary);

      console.log('Itinerario generado por reglas:', itinerary);
    } catch (err) {
      console.error('Error al generar el itinerario:', err);

      if (err.response && err.response.data) {
        const apiError = err.response.data.error;

        if (apiError === 'TRIP_NOT_FOUND') {
          setGenerateError('No encontramos este viaje para generar un itinerario.');
        } else if (apiError === 'UNAUTHORIZED' || apiError === 'INVALID_TOKEN') {
          setGenerateError('No tenés permiso para generar itinerarios en este viaje.');
        } else if (apiError === 'VALIDATION_ERROR') {
          setGenerateError(
            'Hay datos del viaje que no son válidos. Revisá fechas e intereses.'
          );
        } else {
          setGenerateError(
            'Ocurrió un error inesperado al generar el itinerario. Probá de nuevo.'
          );
        }
      } else {
        setGenerateError(
          'No pudimos conectarnos con el servidor para generar el itinerario.'
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Handler: enriquecer el itinerario existente usando el modo "IA local"
  // ---------------------------------------------------------------------------
  const handleEnrichItinerary = async () => {
    try {
      // Limpiamos errores previos y marcamos estado de carga.
      setEnrichError(null);
      setEnriching(true);

      // Chequeos defensivos: necesitamos token e itinerario cargado.
      if (!token) {
        setEnrichError('Tu sesión no es válida. Iniciá sesión nuevamente.');
        setEnriching(false);
        return;
      }

      if (!generatedItinerary || !generatedItinerary.id) {
        setEnrichError(
          'Primero generá un itinerario base antes de usar el modo IA.'
        );
        setEnriching(false);
        return;
      }

      console.log(
        'Enriqueciendo itinerario con IA local. ID:',
        generatedItinerary.id
      );

      // Llamada al backend:
      //   POST /api/itineraries/:id/enrich-with-ai
      //
      // Enviamos algunos parámetros opcionales para el "tono".
      const res = await apiClient.post(
        `/api/itineraries/${generatedItinerary.id}/enrich-with-ai`,
        {
          tone: 'relajado', // puede ser 'neutral', 'relajado' o 'aventurero'
          locale: 'es-AR',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Respuesta esperada:
      //   { ok: true, itinerary: { ... } }
      const updated = res.data.itinerary || res.data;

      // Reemplazamos el itinerario actual por la versión enriquecida.
      setGeneratedItinerary(updated);

      console.log('Itinerario enriquecido con IA local:', updated);
    } catch (err) {
      console.error('Error al enriquecer el itinerario:', err);

      // La gracia del modo híbrido es que, si falla el enriquecimiento,
      // el itinerario base sigue estando en generatedItinerary.
      // Sólo mostramos un mensaje humano de error.
      if (err.response && err.response.data) {
        const apiError = err.response.data.error;

        if (apiError === 'ITINERARY_NOT_FOUND') {
          setEnrichError(
            'No encontramos el itinerario en el servidor. Probá generarlo de nuevo.'
          );
        } else if (apiError === 'UNAUTHORIZED' || apiError === 'INVALID_TOKEN') {
          setEnrichError(
            'No tenés permiso para enriquecer este itinerario. Iniciá sesión nuevamente.'
          );
        } else {
          setEnrichError(
            'Hubo un problema al usar el modo IA. Tu itinerario base sigue disponible.'
          );
        }
      } else {
        setEnrichError(
          'No pudimos conectarnos con el servidor para usar el modo IA. Intentá más tarde.'
        );
      }
    } finally {
      setEnriching(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render auxiliar: dibujar la estructura del itinerario como timeline simple
  // ---------------------------------------------------------------------------
  const renderItinerary = () => {
    if (!generatedItinerary) {
      return (
        <p className="text-sm text-slate-300">
          Todavía no generaste un itinerario para este viaje. Usá el botón
          "Generar itinerario" para crear uno con el motor de reglas.
        </p>
      );
    }

    const data = generatedItinerary.data;

    if (!data || !Array.isArray(data.days) || data.days.length === 0) {
      return (
        <p className="text-sm text-slate-300">
          El itinerario no tiene días cargados. Revisá la lógica del motor de reglas.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {data.days.map((day) => (
          <article
            key={day.day}
            className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3"
          >
            <header className="flex items-baseline justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Día {day.day}
                </h3>
                {day.date && (
                  <p className="text-xs text-slate-400">{day.date}</p>
                )}
              </div>

              {/* Etiqueta pequeña con la fuente del itinerario */}
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                {getItinerarySourceLabel(generatedItinerary.aiModelUsed)}
              </span>
            </header>

            <div className="space-y-2">
              {Array.isArray(day.periods) && day.periods.length > 0 ? (
                day.periods.map((period, index) => (
                  <div
                    key={`${day.day}-${index}`}
                    className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="mt-1 h-2 w-2 flex-none rounded-full bg-emerald-400" />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[11px] uppercase tracking-wide text-emerald-300">
                          {getTimeOfDayLabel(period.timeOfDay)}
                        </span>
                        {period.title && (
                          <h4 className="text-sm font-semibold text-slate-100">
                            {period.title}
                          </h4>
                        )}
                      </div>

                      {period.description && (
                        <p className="text-xs leading-relaxed text-slate-300">
                          {period.description}
                        </p>
                      )}

                      {typeof period.estimatedCost === 'number' && (
                        <p className="text-[11px] text-slate-400">
                          Costo estimado:{' '}
                          <span className="font-mono">
                            USD {period.estimatedCost}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  No hay actividades asignadas para este día.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render principal de la página
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Encabezado de navegación / migas simples */}
      <div className="text-xs text-slate-400 flex items-center gap-2">
        <Link
          to="/trips"
          className="hover:text-emerald-400 transition-colors underline-offset-2 hover:underline"
        >
          ← Volver a tus viajes
        </Link>
      </div>

      {/* Estados globales: loading / error */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-300 animate-pulse">
          Cargando información del viaje...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-700 bg-red-900/40 p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Contenido principal cuando hay trip */}
      {!loading && !error && trip && (
        <div className="space-y-4">
          {/* Tarjeta principal con info del viaje */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-slate-50">
                {trip.title || 'Viaje sin título'}
              </h2>

              <p className="text-xs text-slate-400">
                ID del viaje:&nbsp;
                <span className="font-mono text-[11px] text-slate-300">
                  {trip.id || '(no disponible)'}
                </span>
              </p>

              {trip.startDate && trip.endDate && (
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-slate-200">
                    Fechas:
                  </span>{' '}
                  {trip.startDate} → {trip.endDate}
                </p>
              )}

              {Array.isArray(trip.interests) && trip.interests.length > 0 && (
                <p className="text-xs text-slate-300">
                  <span className="font-medium text-slate-200">
                    Intereses:
                  </span>{' '}
                  {trip.interests.join(', ')}
                </p>
              )}
            </div>

            {/* Acciones relacionadas con el itinerario */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={handleGenerateItinerary}
                disabled={generating}
                className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating ? 'Generando itinerario...' : 'Generar itinerario'}
              </button>

              <button
                type="button"
                onClick={handleEnrichItinerary}
                disabled={
                  enriching ||
                  !generatedItinerary ||
                  generating
                }
                className="inline-flex items-center rounded-full border border-emerald-500/60 bg-transparent px-4 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enriching
                  ? 'Enriqueciendo con IA...'
                  : 'Enriquecer itinerario con IA'}
              </button>
            </div>

            {/* Mensajes de error de los flujos de generación / IA */}
            {(generateError || enrichError) && (
              <div className="mt-2 space-y-1 text-xs">
                {generateError && (
                  <div className="rounded-lg border border-amber-600 bg-amber-900/30 px-3 py-2 text-amber-100">
                    {generateError}
                  </div>
                )}
                {enrichError && (
                  <div className="rounded-lg border border-sky-600 bg-sky-900/30 px-3 py-2 text-sky-100">
                    {enrichError}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Bloque donde mostramos el itinerario generado, si existe */}
          {generatedItinerary && (
            <section className="rounded-2xl border border-emerald-600 bg-slate-900/80 p-5 space-y-3">
              <header className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-emerald-300">
                  Itinerario generado
                </h2>
                <p className="text-xs text-emerald-200/80">
                  Este es el plan de viaje que NomadIQ armó para vos. Primero
                  se genera con el motor de reglas y, si querés, podés
                  enriquecerlo con el modo IA.
                </p>
              </header>

              {renderItinerary()}
            </section>
          )}

          {/* Estado vacío cuando todavía no hay itinerario */}
          {!generatedItinerary && (
            <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="text-sm font-semibold text-slate-100 mb-1">
                Todavía no hay un itinerario para este viaje
              </h2>
              <p className="text-xs text-slate-300">
                Usá el botón <span className="font-semibold">"Generar itinerario"</span>{' '}
                para crear un plan de viaje automático con el motor de reglas.
                Más adelante podés mejorarlo con el modo IA.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default TripDetailPage;
